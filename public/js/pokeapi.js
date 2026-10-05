export const nameCache = new Map()
export const typeCache = new Map()
export const bstCache  = new Map()
export const evoCache  = new Map()
export const colorCache = new Map()

const pendingRequests = new Map()

const COLOR_MAP = {
  black:'negro', blue:'azul', brown:'marron', gray:'gris', green:'verde', pink:'rosa', purple:'morado', red:'rojo', white:'blanco', yellow:'amarillo'
}

// Cargar caché local desde sessionStorage si existe
try {
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i)
    if (k && k.startsWith('pk_data_')) {
      const id = parseInt(k.replace('pk_data_', ''), 10)
      if (id) {
        const item = JSON.parse(sessionStorage.getItem(k) || '{}')
        if (item.name) nameCache.set(id, item.name)
        if (item.types) typeCache.set(id, item.types)
        if (item.bst !== undefined) bstCache.set(id, item.bst)
        if (item.color) colorCache.set(id, item.color)
      }
    }
  }
} catch {}

function guardarCacheLocal(id, data) {
  try {
    sessionStorage.setItem(`pk_data_${id}`, JSON.stringify(data))
  } catch {}
}

export const imgUrl    = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
export const imgSprite = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

export async function fetchNombre(id) {
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
      guardarCacheLocal(id, { name: d.name, types, bst, color: colorCache.get(id) || 'gris' })
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

function analizarCadena(nodo, nombre) {
  function profundidad(n) {
    if (!n.evolves_to.length) return 0
    return 1 + Math.max(...n.evolves_to.map(profundidad))
  }
  function buscar(n) {
    if (n.species.name === nombre) return { esFinal: n.evolves_to.length === 0 }
    for (const h of n.evolves_to) { const r = buscar(h); if (r) return r }
    return null
  }
  const esRaiz      = nodo.species.name === nombre
  const res         = buscar(nodo)
  const profTotal   = profundidad(nodo)
  const copaBebe    = esRaiz && profTotal >= 2
  return {
    esFinal:  res?.esFinal ?? false,
    sinEvo:   esRaiz && nodo.evolves_to.length === 0,
    esBase:   esRaiz,
    copaBebe,
  }
}

export async function precargaBatch(ids) {
  const pendientes = ids.filter(id => !typeCache.has(id))
  if (!pendientes.length) return

  let limite = pendientes
  if (pendientes.length > 150) {
    for (let i = pendientes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pendientes[i], pendientes[j]] = [pendientes[j], pendientes[i]]
    }
    limite = pendientes.slice(0, 150)
  }

  // Chunks más moderados (15) para evitar saturación de conexiones HTTP
  const BATCH = 15
  for (let i = 0; i < limite.length; i += BATCH) {
    await Promise.all(limite.slice(i, i + BATCH).map(async id => {
      try {
        const [pkR, spR] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
        ])
        if (!pkR.ok || !spR.ok) return
        const [pk, sp] = await Promise.all([pkR.json(), spR.json()])
        const types = pk.types.map(t => t.type.name)
        const bst   = pk.stats.reduce((s, x) => s + x.base_stat, 0)
        const color = COLOR_MAP[sp.color?.name] || 'gris'

        nameCache.set(id, pk.name)
        typeCache.set(id, types)
        bstCache.set(id, bst)
        colorCache.set(id, color)

        guardarCacheLocal(id, { name: pk.name, types, bst, color })

        if (sp.evolution_chain?.url) {
          const cR = await fetch(sp.evolution_chain.url)
          if (cR.ok) evoCache.set(id, analizarCadena((await cR.json()).chain, sp.name))
        } else {
          evoCache.set(id, { esFinal:true, sinEvo:true, esBase:true, copaBebe:false })
        }
      } catch {}
    }))
  }
}
