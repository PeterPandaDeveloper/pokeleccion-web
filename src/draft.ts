import { CONFIG }        from './config'
import { Sala, EstadoSala, VotoConfig, agregarMensajeSistema } from './sala'
import { POKEMON_DB }     from './pokemonData'

const LEGENDARIOS = new Set<number>([
  144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,
  480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,638,639,640,641,642,643,
  644,645,646,647,648,649,716,717,718,719,720,721,772,773,785,786,787,788,789,790,791,
  792,800,801,802,888,889,890,891,892,893,894,895,896,897,898,
  905,1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1017,1020,1024,1025,
])

export const RANGOS: Record<string, [number, number]> = {
  todas: [1, 1025], kanto: [1, 151], johto: [152, 251], hoenn: [252, 386], sinnoh: [387, 493],
  unova: [494, 649], kalos: [650, 721], alola: [722, 809], galar: [810, 905], paldea: [906, 1025]
}

export const TIPO_EN: Record<string, string> = {
  normal:'normal', fuego:'fire', agua:'water', planta:'grass', 'eléctrico':'electric',
  hielo:'ice', lucha:'fighting', veneno:'poison', tierra:'ground', volador:'flying',
  'psíquico':'psychic', bicho:'bug', roca:'rock', fantasma:'ghost', 'dragón':'dragon',
  siniestro:'dark', acero:'steel', hada:'fairy'
}

export const FORMAS_REGIONALES: Record<string, number[]> = {
  kanto:[10033,10034,10035,10036,10037,10038,10039,10040],
  johto:[],
  hoenn:[10033,10034,10035,10036,10037,10038,10039,10040,10041,10042,
         10043,10044,10045,10046,10047,10048,10049,10050,10051,10052,
         10053,10054,10055,10056,10057,10058,10059,10060,10061,10062,10063,10064,10065],
  sinnoh:[],unova:[],kalos:[],
  alola:[10091,10092,10093,10094,10095,10096,10097,10098,10099,10100,
         10101,10102,10103,10104,10105,10106,10107,10108,10109,10110,
         10111,10112,10113,10114,10115,10116,10117,10118],
  galar:[10158,10159,10160,10161,10162,10163,10164,10165,10166,10167,
         10168,10169,10170,10171,10172,10173,10174,10175,10176,10177,
         10178,10179,10180,10181,10182,10183,10184,10185],
  hisui:[10186,10187,10188,10189,10190,10191,10192,10193,10194,10195,
         10196,10197,10198,10199,10200,10201,10202,10203,10204],
  paldea:[10250,10251,10252],
  todas:[],
}

export const FORMAS_REGIONALES_ESPECIALES = new Set<number>([
  ...Object.values(FORMAS_REGIONALES).flat()
])

export const GIMMICKS = new Set<number>([
  793,794,795,796,797,798,799,803,804,805,806,
  1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025
])

export function construirPoolBackend(v: VotoConfig): number[] {
  const idSet = new Set<number>()
  for (const reg of v.regiones) {
    const [mn, mx] = RANGOS[reg] || [1, 1025]
    for (let i = mn; i <= mx; i++) idSet.add(i)
    ;(FORMAS_REGIONALES[reg] || []).forEach(id => idSet.add(id))
  }
  let ids = [...idSet].sort((a, b) => a - b)
  if (v.sinLegendarios) ids = ids.filter(id => !LEGENDARIOS.has(id))

  if (v.soloFinales)      ids = ids.filter(id => POKEMON_DB[id]?.esFinal === true)
  if (v.soloSinEvolucion) ids = ids.filter(id => POKEMON_DB[id]?.sinEvo === true)
  if (v.soloBase)         ids = ids.filter(id => POKEMON_DB[id]?.esBase === true)
  if (v.copaBebe)         ids = ids.filter(id => POKEMON_DB[id]?.esBase === true && POKEMON_DB[id]?.copaBebe === true && !LEGENDARIOS.has(id))

  if (v.tipos && v.tipos.length) {
    const te = v.tipos.map(t => TIPO_EN[t]).filter(Boolean)
    ids = v.modoTipos === 'AND'
      ? ids.filter(id => te.every(t => POKEMON_DB[id]?.types.includes(t)))
      : ids.filter(id => te.some(t => POKEMON_DB[id]?.types.includes(t)))
  }

  if (v.colores && v.colores.length) {
    ids = ids.filter(id => v.colores.includes(POKEMON_DB[id]?.color || 'gris'))
  }

  if (v.sinFormasRegionales) {
    ids = ids.filter(id => !FORMAS_REGIONALES_ESPECIALES.has(id))
  }

  if (v.sinGimmicks) {
    ids = ids.filter(id => !GIMMICKS.has(id))
  }

  if (v.minBST) ids = ids.filter(id => (POKEMON_DB[id]?.bst || 0) >= v.minBST!)
  if (v.maxBST) ids = ids.filter(id => (POKEMON_DB[id]?.bst || 9999) <= v.maxBST!)

  return ids
}

export function resolverConfig(v1: VotoConfig, v2: VotoConfig): VotoConfig {
  const regiones = [...new Set([...v1.regiones,...v2.regiones])]
  const tipos    = [...new Set([...v1.tipos,...v2.tipos])]
  const colores  = [...new Set([...v1.colores,...v2.colores])]
  const modoTipos = (v1.modoTipos==='AND'&&v2.modoTipos==='AND') ? 'AND' : 'OR'
  const sinLegendarios   = v1.sinLegendarios   || v2.sinLegendarios
  const soloFinales      = v1.soloFinales      || v2.soloFinales
  const soloSinEvolucion = !soloFinales && (v1.soloSinEvolucion || v2.soloSinEvolucion)
  const soloBase  = !soloFinales && !soloSinEvolucion && (v1.soloBase  || v2.soloBase)
  // Copa Bebé: primera etapa de cadenas con 2+ evoluciones. Excluye legendarios y mono-etapa.
  const copaBebe  = !soloFinales && !soloSinEvolucion && !soloBase && (v1.copaBebe || v2.copaBebe)
  const noDuplicadosTipo = v1.noDuplicadosTipo || v2.noDuplicadosTipo
  const sinGimmicks = v1.sinGimmicks || v2.sinGimmicks
  const sinFormasRegionales = v1.sinFormasRegionales || v2.sinFormasRegionales
  const maxBST = v1.maxBST!==null&&v2.maxBST!==null ? Math.min(v1.maxBST,v2.maxBST) : v1.maxBST??v2.maxBST??null
  const minBST = v1.minBST!==null&&v2.minBST!==null ? Math.max(v1.minBST,v2.minBST) : v1.minBST??v2.minBST??null
  const numRondas = Math.max(v1.numRondas, v2.numRondas)
  const modoOculto = v1.modoOculto || v2.modoOculto
  return { regiones, tipos, colores, modoTipos, sinLegendarios, soloFinales, soloSinEvolucion, soloBase, copaBebe, noDuplicadosTipo, sinGimmicks, sinFormasRegionales, maxBST, minBST, numRondas, modoOculto }
}

export function etiquetaConfig(c: VotoConfig): string {
  const p: string[] = []
  if (!c.regiones.includes('todas')) p.push('📍 Regiones: '+c.regiones.join(', '))
  if (c.tipos.length) {
    const modo = c.modoTipos==='AND' ? 'todos estos tipos' : 'cualquiera de estos tipos'
    p.push('⚔️ Tipos: '+c.tipos.join(', ')+' ('+modo+')')
  }
  if (c.colores?.length) p.push('🎨 Colores: '+c.colores.join(', '))
  if (c.sinLegendarios)   p.push('🚫 Sin legendarios')
  if (c.soloFinales)      p.push('⬆️ Solo evolucionados al máximo')
  if (c.soloSinEvolucion) p.push('⛔ Sin evolución')
  if (c.soloBase)         p.push('🐣 Solo primera etapa')
  if (c.copaBebe)         p.push('🍼 Copa Bebé (bebés con futuro)')
  if (c.noDuplicadosTipo) p.push('🔄 Tipos únicos')
  if (c.sinGimmicks) p.push('🪄 Sin gimmicks')
  if (c.sinFormasRegionales) p.push('🗺️ Sin formas regionales')
  if (c.minBST) p.push(`📊 BST ≥ ${c.minBST}`)
  if (c.maxBST) p.push(`📊 BST ≤ ${c.maxBST}`)
  p.push(`🎯 ${c.numRondas} ronda${c.numRondas > 1 ? 's' : ''}`)
  if (c.modoOculto) p.push('🙈 Modo Oculto (Clash Royale)')
  return p.length ? p.join(' · ') : '🎯 Sin restricciones'
}

function pool2pokemon(sala: Sala): void {
  if (sala.pool.length < 2) {
    const ya = new Set([...sala.estado.jugador1.equipo,...sala.estado.jugador2.equipo])
    sala.pool = Array.from({length:1025},(_,i)=>i+1).filter(id=>!ya.has(id))
  }
}

export function limpiarTimer(sala: Sala): void {
  if (sala.timer) { clearTimeout(sala.timer); sala.timer=null }
  sala.estado.timerExpira = null
}

export function generarRonda(salaId: string, sala: Sala): void {
  limpiarTimer(sala)
  const { estado } = sala
  estado.ultimaEleccionRandom = false
  if (estado.rondaActual >= estado.config!.numRondas) {
    estado.turnoDe='FIN'; estado.fase='fin'
    const j1 = estado.jugador1.nombre||'J1'
    const j2 = estado.jugador2.nombre||'J2'
    agregarMensajeSistema(sala,`🏁 ¡Draft terminado! ${j1} y ${j2} tienen sus equipos.`)
    return
  }
  pool2pokemon(sala)
  const i1=Math.floor(Math.random()*sala.pool.length); const id1=sala.pool.splice(i1,1)[0]
  const i2=Math.floor(Math.random()*sala.pool.length); const id2=sala.pool.splice(i2,1)[0]
  estado.opcionesActuales=[id1,id2]; estado.historial.push(id1,id2)
  estado.rondaActual++
  estado.turnoDe = estado.rondaActual%2===1 ? 'jugador1' : 'jugador2'
  // Timer pasivo
  estado.timerExpira = Date.now() + CONFIG.TIMER_SEG*1000

  // Solo en standalone se usa un setTimeout de refuerzo
  if (process.env.VERCEL !== '1' && process.env.SERVERLESS !== '1') {
    sala.timer = setTimeout(()=>{
      if (estado.fase!=='draft'||estado.turnoDe==='FIN') return
      const elegido = estado.opcionesActuales[Math.floor(Math.random()*estado.opcionesActuales.length)]
      console.log(`⏰  [${salaId}] Timeout activo → #${elegido}`)
      estado.ultimaEleccionRandom = true
      aplicarEleccion(salaId, sala, estado.turnoDe as 'jugador1'|'jugador2', elegido)
    }, CONFIG.TIMER_SEG*1000)
  }
}

/**
 * Verificación pasiva del temporizador de 10s.
 * Se ejecuta al recibir peticiones HTTP (ideal para arquitecturas Serverless).
 */
export function verificarTimeoutPasivo(salaId: string, sala: Sala): boolean {
  const { estado } = sala
  if (estado.fase !== 'draft' || estado.turnoDe === 'FIN') return false
  if (estado.timerExpira && Date.now() >= estado.timerExpira) {
    if (!estado.opcionesActuales || !estado.opcionesActuales.length) return false
    const elegido = estado.opcionesActuales[Math.floor(Math.random() * estado.opcionesActuales.length)]
    console.log(`⏰  [${salaId}] Timeout pasivo detectado en petición → auto-elección #${elegido}`)
    estado.ultimaEleccionRandom = true
    aplicarEleccion(salaId, sala, estado.turnoDe as 'jugador1'|'jugador2', elegido)
    return true
  }
  return false
}

export function aplicarEleccion(salaId: string, sala: Sala, jugador: 'jugador1'|'jugador2', elegido: number): void {
  const rival    = jugador==='jugador1'?'jugador2':'jugador1'
  const noElegido = sala.estado.opcionesActuales.find(id=>id!==elegido)!
  if (!sala.estado[jugador].picksPropios) sala.estado[jugador].picksPropios = []
  if (!sala.estado[rival].picksPropios) sala.estado[rival].picksPropios = []
  sala.estado[jugador].equipo.push(elegido)
  sala.estado[jugador].picksPropios.push(elegido)
  sala.estado[rival].equipo.push(noElegido)
  generarRonda(salaId, sala)
}

export function iniciarDraft(salaId: string, sala: Sala, idsValidosCliente?: number[]): void {
  const { estado } = sala
  estado.config  = resolverConfig(estado.lobby.jugador1.voto!, estado.lobby.jugador2.voto!)
  
  // Cálculo autoritativo seguro en el backend:
  let poolServidor = construirPoolBackend(estado.config)
  if (!poolServidor || poolServidor.length < (estado.config.numRondas * 2)) {
    if (idsValidosCliente && idsValidosCliente.length >= (estado.config.numRondas * 2)) {
      poolServidor = idsValidosCliente.slice()
    } else {
      poolServidor = Array.from({length: 1025}, (_, i) => i + 1)
    }
  }

  sala.pool      = poolServidor
  estado.poolSize = sala.pool.length
  estado.jugador1.nombre = estado.lobby.jugador1.nombre
  estado.jugador2.nombre = estado.lobby.jugador2.nombre
  estado.fase = 'draft'
  const etiqueta = etiquetaConfig(estado.config)
  agregarMensajeSistema(sala, `🎮 ¡Draft iniciado! Reglas: ${etiqueta}`)
  console.log(`🎮  [${salaId}] Draft iniciado — pool autoritativo calculado en servidor: ${sala.pool.length}`)
  generarRonda(salaId, sala)
}
