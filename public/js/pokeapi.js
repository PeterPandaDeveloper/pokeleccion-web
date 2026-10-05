export const nameCache = new Map()
export const typeCache = new Map()
export const bstCache  = new Map()
export const evoCache  = new Map()
export const colorCache = new Map()

const pendingRequests = new Map()

export const imgUrl    = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
export const imgSprite = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

let pokedexCargado = false
let promesaCarga = null

export async function cargarPokedex() {
  if (pokedexCargado) return
  if (promesaCarga) return promesaCarga

  promesaCarga = (async () => {
    try {
      const r = await fetch('/data/pokedex.json')
      if (r.ok) {
        const data = await r.json()
        for (const [idStr, p] of Object.entries(data)) {
          const id = Number(idStr)
          nameCache.set(id, p.name)
          typeCache.set(id, p.types)
          bstCache.set(id, p.bst)
          colorCache.set(id, p.color)
          evoCache.set(id, {
            esFinal: p.esFinal,
            sinEvo: p.sinEvo,
            esBase: p.esBase,
            copaBebe: p.copaBebe
          })
        }
        pokedexCargado = true
        return
      }
    } catch (e) {
      console.warn('⚠️ No se pudo cargar pokedex.json local:', e)
    }
  })()

  return promesaCarga
}

// Iniciar precarga de inmediato en segundo plano
cargarPokedex().catch(() => {})

export async function fetchNombre(id) {
  if (nameCache.has(id)) return nameCache.get(id)
  if (!pokedexCargado) await cargarPokedex()
  if (nameCache.has(id)) return nameCache.get(id)

  if (pendingRequests.has(id)) return pendingRequests.get(id)

  const reqPromise = (async () => {
    try {
      const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      if (!r.ok) return `#${id}`
      const d = await r.json()
      nameCache.set(id, d.name)
      const types = d.types.map(t => t.type.name)
      typeCache.set(id, types)
      const bst = d.stats.reduce((s, x) => s + x.base_stat, 0)
      bstCache.set(id, bst)
      return d.name
    } catch {
      return `#${id}`
    } finally {
      pendingRequests.delete(id)
    }
  })()

  pendingRequests.set(id, reqPromise)
  return reqPromise
}

export async function precargaBatch(ids) {
  if (!pokedexCargado) {
    await cargarPokedex()
  }
}
