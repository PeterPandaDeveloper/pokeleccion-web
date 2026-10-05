import { Sala, crearSalaDefault } from './sala'
import { CONFIG } from './config'
import Redis from 'ioredis'
import * as crypto from 'crypto'

export interface HistorialPartida {
  id: string
  salaId: string
  fecha: number
  j1: { nombre: string; equipo: number[] }
  j2: { nombre: string; equipo: number[] }
  reglas: string
  rondas: number
  modoOculto: boolean
}

export interface EstadisticasPartidas {
  totalPartidas: number
  topPicks: Array<{ id: number; count: number }>
  ultimasPartidas: HistorialPartida[]
}

export interface IStorage {
  obtenerSala(id: string): Promise<Sala>
  guardarSala(sala: Sala): Promise<void>
  eliminarSala(id: string): Promise<void>
  listarSalasPublicas(): Promise<Array<{ id: string; fase: string; j1: string|null; j2: string|null; hayEspacio: boolean }>>
  guardarHistorial(partida: HistorialPartida): Promise<void>
  obtenerEstadisticas(): Promise<EstadisticasPartidas>
  adquirirLock?(id: string, maxWaitMs?: number): Promise<string | null>
  liberarLock?(id: string, token: string | null): Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MEMORY STORAGE (Fallback local sin dependencias externas)
// ─────────────────────────────────────────────────────────────────────────────
class MemoryStorage implements IStorage {
  private salas = new Map<string, Sala>()
  private historial: HistorialPartida[] = []
  private pickCounts = new Map<number, number>()

  async obtenerSala(id: string): Promise<Sala> {
    if (!this.salas.has(id)) {
      if (this.salas.size >= CONFIG.MAX_SALAS) {
        let target = ''
        let tsMin = Infinity
        for (const [sid, s] of this.salas) {
          if (!s.estado.jugador1.conectado && !s.estado.jugador2.conectado && s.creadaEn < tsMin) {
            tsMin = s.creadaEn
            target = sid
          }
        }
        if (!target) {
          for (const [sid, s] of this.salas) {
            if (s.creadaEn < tsMin) { tsMin = s.creadaEn; target = sid }
          }
        }
        if (target) this.salas.delete(target)
      }
      this.salas.set(id, crearSalaDefault(id))
    }
    return this.salas.get(id)!
  }

  async guardarSala(sala: Sala): Promise<void> {
    this.salas.set(sala.id, sala)
  }

  async eliminarSala(id: string): Promise<void> {
    this.salas.delete(id)
  }

  async listarSalasPublicas(): Promise<Array<{ id: string; fase: string; j1: string|null; j2: string|null; hayEspacio: boolean }>> {
    const res = []
    for (const [id, s] of this.salas) {
      if (!s.privada && !s.eliminada) {
        res.push({
          id,
          fase: s.estado.fase,
          j1: s.estado.lobby.jugador1.nombre || null,
          j2: s.estado.lobby.jugador2.nombre || null,
          hayEspacio: !s.estado.jugador1.conectado || !s.estado.jugador2.conectado,
        })
      }
    }
    return res
  }

  async guardarHistorial(partida: HistorialPartida): Promise<void> {
    this.historial.unshift(partida)
    if (this.historial.length > 50) this.historial.pop()
    for (const pid of [...partida.j1.equipo, ...partida.j2.equipo]) {
      this.pickCounts.set(pid, (this.pickCounts.get(pid) || 0) + 1)
    }
  }

  async obtenerEstadisticas(): Promise<EstadisticasPartidas> {
    const topPicks = [...this.pickCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }))
    return {
      totalPartidas: this.historial.length,
      topPicks,
      ultimasPartidas: this.historial.slice(0, 10),
    }
  }

  async adquirirLock(id: string, maxWaitMs = 1200): Promise<string | null> {
    return 'mem-lock'
  }

  async liberarLock(id: string, token: string | null): Promise<void> {}
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. UPSTASH REDIS REST STORAGE (Ideal para Vercel Serverless vía HTTP)
// ─────────────────────────────────────────────────────────────────────────────
class UpstashRedisStorage implements IStorage {
  private url: string
  private token: string

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '')
    this.token = token
  }

  private async comando(args: unknown[]): Promise<any> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Upstash error HTTP ${res.status}: ${txt}`)
    }
    const data = await res.json() as { result: any; error?: string }
    if (data.error) throw new Error(`Upstash Redis error: ${data.error}`)
    return data.result
  }

  private async pipeline(comandos: unknown[][]): Promise<any[]> {
    if (!comandos.length) return []
    try {
      const res = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comandos),
      })
      if (res.ok) {
        const data = await res.json() as Array<{ result: any; error?: string }>
        return data.map(d => d.result)
      }
    } catch {}
    const results = []
    for (const c of comandos) {
      results.push(await this.comando(c))
    }
    return results
  }

  async adquirirLock(id: string, maxWaitMs = 1500): Promise<string | null> {
    const token = crypto.randomBytes(4).toString('hex')
    const key = `lock:sala:${id}`
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      try {
        const res = await this.comando(['SET', key, token, 'NX', 'PX', 2500])
        if (res === 'OK' || res === true) return token
      } catch {}
      await new Promise(r => setTimeout(r, 35))
    }
    return null
  }

  async liberarLock(id: string, token: string | null): Promise<void> {
    if (!token) return
    try {
      const key = `lock:sala:${id}`
      const val = await this.comando(['GET', key])
      if (val === token) {
        await this.comando(['DEL', key])
      }
    } catch {}
  }

  async obtenerSala(id: string): Promise<Sala> {
    const raw = await this.comando(['GET', `sala:${id}`])
    if (!raw) {
      const nueva = crearSalaDefault(id)
      await this.guardarSala(nueva)
      return nueva
    }
    const sala = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Sala
    sala.timer = null
    return sala
  }

  async guardarSala(sala: Sala): Promise<void> {
    const ttlSegundos = Math.ceil(CONFIG.TTL_SIN_JUGADORES / 1000) // 420s (7 min)
    const jsonStr = JSON.stringify({ ...sala, timer: null })
    const cmds: unknown[][] = [
      ['SET', `sala:${sala.id}`, jsonStr, 'EX', ttlSegundos],
      [!sala.privada && !sala.eliminada ? 'SADD' : 'SREM', 'salas:publicas', sala.id],
    ]
    await this.pipeline(cmds)
  }

  async eliminarSala(id: string): Promise<void> {
    await this.comando(['DEL', `sala:${id}`])
    await this.comando(['SREM', 'salas:publicas', id])
  }

  async listarSalasPublicas(): Promise<Array<{ id: string; fase: string; j1: string|null; j2: string|null; hayEspacio: boolean }>> {
    const ids: string[] = (await this.comando(['SMEMBERS', 'salas:publicas'])) || []
    if (!ids.length) return []
    const cmds = ids.map(sid => ['GET', `sala:${sid}`])
    const raws = await this.pipeline(cmds)
    const resultado = []
    for (let i = 0; i < ids.length; i++) {
      const sid = ids[i]
      const raw = raws[i]
      if (!raw) {
        await this.comando(['SREM', 'salas:publicas', sid])
        continue
      }
      const s = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Sala
      if (!s.privada && !s.eliminada) {
        resultado.push({
          id: sid,
          fase: s.estado.fase,
          j1: s.estado.lobby.jugador1.nombre || null,
          j2: s.estado.lobby.jugador2.nombre || null,
          hayEspacio: !s.estado.jugador1.conectado || !s.estado.jugador2.conectado,
        })
      }
    }
    return resultado
  }

  async guardarHistorial(partida: HistorialPartida): Promise<void> {
    await this.comando(['LPUSH', 'historial:partidas', JSON.stringify(partida)])
    await this.comando(['LTRIM', 'historial:partidas', 0, 49])
    for (const pid of [...partida.j1.equipo, ...partida.j2.equipo]) {
      await this.comando(['ZINCRBY', 'stats:pokemon:picks', 1, String(pid)])
    }
  }

  async obtenerEstadisticas(): Promise<EstadisticasPartidas> {
    const total = (await this.comando(['LLEN', 'historial:partidas'])) || 0
    const rawHist: string[] = (await this.comando(['LRANGE', 'historial:partidas', 0, 9])) || []
    const ultimasPartidas = rawHist.map(h => typeof h === 'string' ? JSON.parse(h) : h)

    const rawTop: string[] = (await this.comando(['ZREVRANGE', 'stats:pokemon:picks', 0, 9, 'WITHSCORES'])) || []
    const topPicks: Array<{ id: number; count: number }> = []
    for (let i = 0; i < rawTop.length; i += 2) {
      topPicks.push({ id: parseInt(rawTop[i], 10), count: parseFloat(rawTop[i+1]) })
    }

    return { totalPartidas: total, topPicks, ultimasPartidas }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. IOREDIS STORAGE (Para servidor Oracle o Redis estándar local / en la nube)
// ─────────────────────────────────────────────────────────────────────────────
class IoRedisStorage implements IStorage {
  private client: Redis

  constructor(redisUrlOrOptions?: string | Record<string, unknown>) {
    if (typeof redisUrlOrOptions === 'string' && redisUrlOrOptions) {
      this.client = new Redis(redisUrlOrOptions, { maxRetriesPerRequest: 2, lazyConnect: true })
    } else {
      this.client = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 2,
        lazyConnect: true,
      })
    }
    this.client.connect().catch(err => {
      console.warn('⚠️ No se pudo conectar a Redis vía ioredis:', err.message)
    })
  }

  async adquirirLock(id: string, maxWaitMs = 1500): Promise<string | null> {
    const token = crypto.randomBytes(4).toString('hex')
    const key = `lock:sala:${id}`
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      try {
        const res = await this.client.set(key, token, 'PX', 2500, 'NX')
        if (res === 'OK') return token
      } catch {}
      await new Promise(r => setTimeout(r, 35))
    }
    return null
  }

  async liberarLock(id: string, token: string | null): Promise<void> {
    if (!token) return
    try {
      const key = `lock:sala:${id}`
      const val = await this.client.get(key)
      if (val === token) {
        await this.client.del(key)
      }
    } catch {}
  }

  async obtenerSala(id: string): Promise<Sala> {
    const raw = await this.client.get(`sala:${id}`)
    if (!raw) {
      const nueva = crearSalaDefault(id)
      await this.guardarSala(nueva)
      return nueva
    }
    const sala = JSON.parse(raw) as Sala
    sala.timer = null
    return sala
  }

  async guardarSala(sala: Sala): Promise<void> {
    const ttlSegundos = Math.ceil(CONFIG.TTL_SIN_JUGADORES / 1000)
    const jsonStr = JSON.stringify({ ...sala, timer: null })
    await this.client.set(`sala:${sala.id}`, jsonStr, 'EX', ttlSegundos)
    if (!sala.privada && !sala.eliminada) {
      await this.client.sadd('salas:publicas', sala.id)
    } else {
      await this.client.srem('salas:publicas', sala.id)
    }
  }

  async eliminarSala(id: string): Promise<void> {
    await this.client.del(`sala:${id}`)
    await this.client.srem('salas:publicas', id)
  }

  async listarSalasPublicas(): Promise<Array<{ id: string; fase: string; j1: string|null; j2: string|null; hayEspacio: boolean }>> {
    const ids = await this.client.smembers('salas:publicas')
    const res = []
    for (const sid of ids) {
      const raw = await this.client.get(`sala:${sid}`)
      if (!raw) {
        await this.client.srem('salas:publicas', sid)
        continue
      }
      const s = JSON.parse(raw) as Sala
      if (!s.privada && !s.eliminada) {
        res.push({
          id: sid,
          fase: s.estado.fase,
          j1: s.estado.lobby.jugador1.nombre || null,
          j2: s.estado.lobby.jugador2.nombre || null,
          hayEspacio: !s.estado.jugador1.conectado || !s.estado.jugador2.conectado,
        })
      }
    }
    return res
  }

  async guardarHistorial(partida: HistorialPartida): Promise<void> {
    await this.client.lpush('historial:partidas', JSON.stringify(partida))
    await this.client.ltrim('historial:partidas', 0, 49)
    for (const pid of [...partida.j1.equipo, ...partida.j2.equipo]) {
      await this.client.zincrby('stats:pokemon:picks', 1, String(pid))
    }
  }

  async obtenerEstadisticas(): Promise<EstadisticasPartidas> {
    const total = await this.client.llen('historial:partidas')
    const rawHist = await this.client.lrange('historial:partidas', 0, 9)
    const ultimasPartidas = rawHist.map(h => JSON.parse(h))

    const rawTop = await this.client.zrevrange('stats:pokemon:picks', 0, 9, 'WITHSCORES')
    const topPicks: Array<{ id: number; count: number }> = []
    for (let i = 0; i < rawTop.length; i += 2) {
      topPicks.push({ id: parseInt(rawTop[i], 10), count: parseFloat(rawTop[i+1]) })
    }

    return { totalPartidas: total, topPicks, ultimasPartidas }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON / FACTORY
// ─────────────────────────────────────────────────────────────────────────────
let storageInstance: IStorage | null = null

export function getStorage(): IStorage {
  if (storageInstance) return storageInstance

  const upstashUrl =
    process.env.STORAGE_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_REST_API_URL

  const upstashToken =
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.REDIS_REST_API_TOKEN

  const directRedisUrl =
    process.env.STORAGE_URL ||
    process.env.REDIS_URL

  if (upstashUrl && upstashToken) {
    console.log('⚡ Conectado a Upstash Redis / Vercel KV (Serverless HTTP)')
    storageInstance = new UpstashRedisStorage(upstashUrl, upstashToken)
  } else if (directRedisUrl || process.env.REDIS_HOST) {
    console.log('🔌 Conectado a Redis TCP (ioredis / Oracle Server)')
    storageInstance = new IoRedisStorage(directRedisUrl)
  } else {
    console.log('💾 Usando almacenamiento en memoria local (MemoryStorage)')
    storageInstance = new MemoryStorage()
  }

  return storageInstance
}
