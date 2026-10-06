import { resetLobbyEstado } from './lobby.js'
import { Sonido }   from './sonido.js'
import { estado, API, get, post, fetchEstado } from './api.js'
import { mostrarToast } from './modal.js'
import { fetchNombre, imgUrl, imgSprite, getPokemonData } from './pokeapi.js'
import { TIMER_SEG, SUBSTITUTE_IMG } from './constantes.js'

const TIPO_COLORES = {
  normal: '#9fa19f', fire: '#e62829', water: '#2980ef', grass: '#3fa129',
  electric: '#d4a017', ice: '#3dcef3', fighting: '#c03028', poison: '#9141cb',
  ground: '#915121', flying: '#81b9ef', psychic: '#ef4179', bug: '#91a119',
  rock: '#afa981', ghost: '#704170', dragon: '#5060e1', steel: '#60a1b8',
  dark: '#50413f', fairy: '#e076b0'
}

export let superAyudaActiva = localStorage.getItem('poke_super_ayuda') === 'true'

export function actualizarBotonSuperAyudaUI() {
  const btns = [
    document.getElementById('btn-super-ayuda'),
    document.getElementById('btn-super-ayuda-lobby')
  ].filter(Boolean)

  btns.forEach(b => {
    if (superAyudaActiva) {
      b.innerHTML = '🧠 Súper Ayuda: <b style="color:var(--yellow-lt,#aed581)">ON</b>'
      b.classList.add('super-ayuda-on')
    } else {
      b.innerHTML = '🧠 Súper Ayuda: <span style="opacity:0.7">OFF</span>'
      b.classList.remove('super-ayuda-on')
    }
  })
}

export function toggleSuperAyuda() {
  superAyudaActiva = !superAyudaActiva
  localStorage.setItem('poke_super_ayuda', String(superAyudaActiva))
  actualizarBotonSuperAyudaUI()
  Sonido.click()

  if (superAyudaActiva) {
    mostrarToast('🧠 Súper Ayuda ACTIVADA: Ficha técnica visible al pasar el cursor o pulsar un Pokémon', 'ok')
  } else {
    ocultarDexTooltip()
    mostrarToast('🧠 Súper Ayuda DESACTIVADA', 'info')
  }
}

export function mostrarDexTooltip(id, el) {
  if (!superAyudaActiva) return
  const data = getPokemonData(id)
  if (!data) return
  let tt = document.getElementById('dex-tooltip')
  if (!tt) {
    tt = document.createElement('div')
    tt.id = 'dex-tooltip'
    tt.className = 'dex-tooltip'
    document.body.appendChild(tt)
  }

  const s = data.stats || { hp:0, atk:0, def:0, spa:0, spd:0, spe:0 }
  const bar = (v, max=180) => Math.min(100, Math.max(4, Math.round((v / max) * 100)))

  const tiposHTML = (data.types || []).map(t => {
    const bg = TIPO_COLORES[t.toLowerCase()] || '#4caf50'
    return `<span class="dex-tt-type" style="background:${bg};border:1px solid rgba(255,255,255,0.4);">${t.toUpperCase()}</span>`
  }).join('')

  tt.innerHTML = `
    <div class="dex-tt-topbar">
      <span class="dex-tt-badge">🧠 SÚPER AYUDA</span>
      <span class="dex-tt-gen">GEN ${data.gen || 1}</span>
    </div>
    <div class="dex-tt-header">
      <div class="dex-tt-sprite-wrap">
        <img src="${data.sprite || imgSprite(id)}" class="dex-tt-sprite" alt="${data.name}"/>
      </div>
      <div class="dex-tt-info">
        <div class="dex-tt-title-row">
          <strong class="dex-tt-nom">${data.name}</strong>
          <span class="dex-tt-id">#${data.id}</span>
        </div>
        <div class="dex-tt-types">
          ${tiposHTML}
        </div>
      </div>
    </div>
    <div class="dex-tt-stats">
      <div class="dex-stat-row">
        <span class="dex-stat-label">PS</span>
        <div class="dex-bar-track"><div class="dex-bar-fill bar-hp" style="width:${bar(s.hp)}%"></div></div>
        <b class="dex-stat-val">${s.hp}</b>
      </div>
      <div class="dex-stat-row">
        <span class="dex-stat-label">ATQ</span>
        <div class="dex-bar-track"><div class="dex-bar-fill bar-atk" style="width:${bar(s.atk)}%"></div></div>
        <b class="dex-stat-val">${s.atk}</b>
      </div>
      <div class="dex-stat-row">
        <span class="dex-stat-label">DEF</span>
        <div class="dex-bar-track"><div class="dex-bar-fill bar-def" style="width:${bar(s.def)}%"></div></div>
        <b class="dex-stat-val">${s.def}</b>
      </div>
      <div class="dex-stat-row">
        <span class="dex-stat-label">AT.ESP</span>
        <div class="dex-bar-track"><div class="dex-bar-fill bar-spa" style="width:${bar(s.spa)}%"></div></div>
        <b class="dex-stat-val">${s.spa}</b>
      </div>
      <div class="dex-stat-row">
        <span class="dex-stat-label">DF.ESP</span>
        <div class="dex-bar-track"><div class="dex-bar-fill bar-spd" style="width:${bar(s.spd)}%"></div></div>
        <b class="dex-stat-val">${s.spd}</b>
      </div>
      <div class="dex-stat-row">
        <span class="dex-stat-label">VEL</span>
        <div class="dex-bar-track"><div class="dex-bar-fill bar-spe" style="width:${bar(s.spe)}%"></div></div>
        <b class="dex-stat-val">${s.spe}</b>
      </div>
    </div>
    <div class="dex-tt-footer">
      <div class="dex-tt-bst-box">
        <span>BST TOTAL</span>
        <strong>${data.bst || 0}</strong>
      </div>
      ${(data.abilities && data.abilities.length) ? `
        <div class="dex-tt-abil-box">
          <small>Habilidades:</small>
          <span>${data.abilities.slice(0, 2).join(' · ')}</span>
        </div>` : ''}
      ${data.height && data.weight ? `
        <div class="dex-tt-phys-box">
          <span>📏 ${data.height}m</span>
          <span>⚖️ ${data.weight}kg</span>
        </div>` : ''}
    </div>
  `

  const rect = el.getBoundingClientRect()
  const ttWidth = 280
  const ttHeight = 240
  let top = rect.bottom + window.scrollY + 8
  if (rect.bottom + ttHeight > window.innerHeight && rect.top - ttHeight > 0) {
    top = rect.top + window.scrollY - ttHeight - 8
  }
  const left = Math.max(10, Math.min(window.innerWidth - ttWidth - 10, rect.left + window.scrollX - 20))

  tt.style.top = `${top}px`
  tt.style.left = `${left}px`
  tt.style.display = 'block'
}

export function ocultarDexTooltip() {
  const tt = document.getElementById('dex-tooltip')
  if (tt) tt.style.display = 'none'
}

// ─── ESTADO DE RENDER ────────────────────────────────────────────────────────
export let prevOps = [], prevTurno = '', prevRonda = -1, exportGen = false
export const rendJ1 = new Set(), rendJ2 = new Set()
let timerHandle = null, timerExpira = null, ultimoSeg = -1, yaRevelo = false

// ─── TRANSICIÓN DE BATALLA ───────────────────────────────────────────────────
export function flashBatalla(cb) {
  const fl = document.getElementById('battle-flash')
  fl.classList.add('activo')
  Sonido.draftInicia()
  setTimeout(() => { cb(); setTimeout(() => fl.classList.remove('activo'), 80) }, 350)
}

// ─── SINCRONIZACIÓN PRINCIPAL ────────────────────────────────────────────────
export async function syncDraft(est) {
  // Nombres
  document.getElementById('nom-j1-draft').textContent = est.jugador1.nombre || 'Jugador 1'
  document.getElementById('nom-j2-draft').textContent = est.jugador2.nombre || 'Jugador 2'

  // Reglas activas en el encabezado
  const reglasPill = document.getElementById('reglas-pill')
  if (reglasPill && est.reglas) reglasPill.textContent = est.reglas

  // Espectadores
  const espN = est.lobby.espectadores || 0
  const ep   = document.getElementById('esp-pill')
  if (ep) { ep.style.display = espN > 0 ? 'inline-block' : 'none'; document.getElementById('esp-count-draft').textContent = espN }

  // Ronda y badges de progreso
  const totalRondas = est.config?.numRondas ?? 6
  if (est.rondaActual !== prevRonda) {
    document.getElementById('ronda-txt').textContent = `Ronda ${est.rondaActual} / ${totalRondas}`
    prevRonda = est.rondaActual
  }
  const b1 = document.getElementById('badge-j1'), b2 = document.getElementById('badge-j2')
  if (b1) b1.textContent = `${est.jugador1.equipo.length}/${totalRondas}`
  if (b2) b2.textContent = `${est.jugador2.equipo.length}/${totalRondas}`

  // Tag de asignación aleatoria
  const rtag = document.getElementById('random-tag')
  const yaRandom = rtag.style.display === 'block'
  rtag.style.display = est.ultimaEleccionRandom ? 'block' : 'none'
  if (est.ultimaEleccionRandom && !yaRandom) Sonido.timeout()

  // ── FIN ──────────────────────────────────────────────────────────────────
  if (est.turnoDe === 'FIN') {
    detenerTimer()
    document.getElementById('turno-alert').textContent = '¡Duelo finalizado!'
    document.getElementById('turno-alert').style.color = 'var(--text)'
    document.getElementById('timer-wrap').style.display = 'none'
    document.getElementById('opciones-render').innerHTML = ''
    if (est.config?.modoOculto) await revelarTodo(est)
    await renderEquipos(est)
    if (!exportGen) {
      Sonido.finDraft()
      await generarExport(est)
      document.getElementById('showdown-box').style.display = 'block'
      exportGen = true
    }
    return
  }

  document.getElementById('showdown-box').style.display = 'none'
  exportGen = false

  // Si reiniciamos el draft (revancha o nuevo juego) y los equipos en servidor están vacíos
  if (yaRevelo || (est.jugador1.equipo.length === 0 && rendJ1.size > 0)) {
    yaRevelo = false
    rendJ1.clear()
    rendJ2.clear()
    const eq1 = document.getElementById('equipo-j1')
    const eq2 = document.getElementById('equipo-j2')
    if (eq1) eq1.innerHTML = ''
    if (eq2) eq2.innerHTML = ''
  }

  if (est.rondaActual > 0) {
    // ── TURNO ──────────────────────────────────────────────────────────────
    if (est.turnoDe !== prevTurno || !arrEq(est.opcionesActuales, prevOps)) {
      const cambio = est.turnoDe !== prevTurno
      prevTurno = est.turnoDe
      const esYo   = est.turnoDe === estado.miRol
      const nomT   = est[est.turnoDe]?.nombre || (est.turnoDe === 'jugador1' ? 'Jugador 1' : 'Jugador 2')
      const ta     = document.getElementById('turno-alert')
      ta.textContent = esYo ? `¡Tu turno, ${nomT}!` : `Turno de ${nomT}...`
      ta.style.color = esYo ? 'var(--yellow-lt)' : 'var(--green-lt)'
      ta.classList.remove('pulso'); void ta.offsetWidth; ta.classList.add('pulso')
      if (cambio) esYo ? Sonido.miTurno() : Sonido.esperando()
    }

    // Timer
    if (est.timerExpira) sincronizarTimer(est.timerExpira, est.serverTime)

    // Cartas
    if (!arrEq(est.opcionesActuales, prevOps) || document.querySelectorAll('#opciones-render .poke-card').length === 0) {
      await renderCartas(est)
      prevOps = [...est.opcionesActuales]
    }
  }

  await renderEquipos(est)
  await renderChat(est)
}

// ─── TIMER ───────────────────────────────────────────────────────────────────
let serverTimeOffset = 0

function sincronizarTimer(exp, serverTime) {
  if (timerExpira !== exp) ultimoSeg = -1
  timerExpira = exp
  if (serverTime) {
    serverTimeOffset = Date.now() - serverTime
  }
  document.getElementById('timer-wrap').style.display = 'flex'
  actualizarTimer()
  if (!timerHandle) timerHandle = setInterval(actualizarTimer, 80)
}

function detenerTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null }
  document.getElementById('timer-wrap').style.display = 'none'
}

function actualizarTimer() {
  if (!timerExpira) return
  const nowServer = Date.now() - serverTimeOffset
  const ms  = Math.max(0, timerExpira - nowServer)
  const ring = document.getElementById('ring-fg')
  if (ring) ring.style.strokeDashoffset = 213.6 * (1 - Math.max(0, ms / (TIMER_SEG * 1000)))
  const s   = Math.ceil(ms / 1000)
  const num = document.getElementById('timer-num')
  if (num) {
    if (s !== ultimoSeg && s <= 5 && s >= 1) { Sonido.timerTick(s <= 3); ultimoSeg = s }
    else if (s > 5) ultimoSeg = s
    num.textContent = s
    num.style.color = s <= 3 ? 'var(--red-lt)' : s <= 6 ? 'var(--yellow-lt)' : 'var(--text)'
    if (ring) ring.style.stroke = s <= 3 ? '#e84040' : s <= 6 ? '#d4a017' : '#3cb878'
  }
  if (ms <= 0) detenerTimer()
}

// ─── CARTAS ───────────────────────────────────────────────────────────────────
async function renderCartas(est) {
  const esYo = est.turnoDe === estado.miRol
  const c    = document.getElementById('opciones-render')
  if (!c) return

  const nomT = est[est.turnoDe]?.nombre || (est.turnoDe === 'jugador1' ? 'Jugador 1' : 'Jugador 2')

  // En Modo Oculto, si no es mi turno y soy jugador (no espectador), ocultar las opciones que el rival está eligiendo
  if (est.config?.modoOculto && !esYo && estado.miRol && estado.miRol !== 'espectador') {
    c.innerHTML = `
      <div class="poke-card-oculta-rival">
        <span class="ico-oculto">🙈</span>
        <p class="txt-oculto-rival"><strong>${nomT}</strong> está eligiendo su Pokémon en secreto...</p>
      </div>
    `
    return
  }

  // Si ya tenemos exactamente estas cartas renderizadas, solo actualizar estado visual
  const existingCards = c.querySelectorAll('.poke-card')
  if (existingCards.length === est.opcionesActuales.length && arrEq(est.opcionesActuales, prevOps)) {
    existingCards.forEach(card => {
      card.classList.toggle('card-disabled', !esYo)
    })
    return
  }

  // Pre-obtener todos los nombres en paralelo para evitar parpadeos secuenciales
  const nombres = await Promise.all(est.opcionesActuales.map(fetchNombre))

  // Construir fragmento fuera del DOM
  const frag = document.createDocumentFragment()
  est.opcionesActuales.forEach((id, idx) => {
    const nom = nombres[idx] || `#${id}`
    const div = document.createElement('div')
    div.className = 'poke-card' + (!esYo ? ' card-disabled' : '')
    div.dataset.pokeId = String(id)
    div.onclick   = () => intentarElegir(id, div)
    div.addEventListener('mouseenter', () => {
      if (esYo) Sonido.hover()
      mostrarDexTooltip(id, div)
    })
    div.addEventListener('mouseleave', ocultarDexTooltip)
    const artwork = imgUrl(id)
    const sprite  = imgSprite(id)
    div.innerHTML = `
      <img src="${artwork}" alt="${nom}" loading="eager"
           onerror="this.src='${sprite}'"
           style="width:118px;height:118px;object-fit:contain;display:block;margin:0 auto;transition:transform .22s">
      <div class="poke-name">${nom}</div>`
    frag.appendChild(div)
  })

  // Reemplazo atómico en un solo repaint (cero tearing / cero pantalla en blanco)
  c.replaceChildren(frag)
}

// ─── EQUIPOS ─────────────────────────────────────────────────────────────────
async function renderEquipos(est) {
  const g1 = document.getElementById('equipo-j1')
  const g2 = document.getElementById('equipo-j2')
  const modoOculto = est.config?.modoOculto
  const esEspectador = !estado.miRol || estado.miRol === 'espectador'
  const esFin = est.turnoDe === 'FIN'

  for (let i = 0; i < est.jugador1.equipo.length; i++) {
    const id = est.jugador1.equipo[i]
    const key = `j1_${i}_${id}`
    if (!rendJ1.has(key)) {
      // En Modo Oculto, el rival (J2) no ve los Pokémon de J1 hasta que finaliza el draft
      const ocultar = modoOculto && estado.miRol === 'jugador2' && !esEspectador && !esFin
      g1.appendChild(await crearMini(id, 'slide-in-right', ocultar))
      rendJ1.add(key)
    }
  }

  for (let i = 0; i < est.jugador2.equipo.length; i++) {
    const id = est.jugador2.equipo[i]
    const key = `j2_${i}_${id}`
    if (!rendJ2.has(key)) {
      // En Modo Oculto, el rival (J1) no ve los Pokémon de J2 hasta que finaliza el draft
      const ocultar = modoOculto && estado.miRol === 'jugador1' && !esEspectador && !esFin
      g2.appendChild(await crearMini(id, 'slide-in-left', ocultar))
      rendJ2.add(key)
    }
  }
}

async function crearMini(id, anim, oculto = false) {
  const nom  = oculto ? '???' : await fetchNombre(id)
  const div  = document.createElement('div')
  div.className = 'mini-poke ' + anim + (oculto ? ' mini-poke-oculto' : '')
  div.dataset.pokeId = String(id)
  const artwork = oculto ? SUBSTITUTE_IMG : imgUrl(id)
  const sprite  = oculto ? SUBSTITUTE_IMG : imgSprite(id)
  div.innerHTML = `<img src="${artwork}" alt="${nom}" loading="lazy"
    ${oculto ? '' : `onerror="this.src='${sprite}'"`} style="width:52px;height:52px;object-fit:contain">
    <p>${nom}</p>`
  if (!oculto) {
    div.addEventListener('mouseenter', () => mostrarDexTooltip(id, div))
    div.addEventListener('mouseleave', ocultarDexTooltip)
  }
  return div
}

// ─── REVEAL DE POKÉMON OCULTOS ──────────────────────────────────────────────
async function revelarTodo(est) {
  if (yaRevelo) return
  yaRevelo = true
  const paneles = [
    { g: document.getElementById('equipo-j1') },
    { g: document.getElementById('equipo-j2') },
  ]
  for (const { g } of paneles) {
    if (!g) continue
    const ocultos = Array.from(g.querySelectorAll('.mini-poke-oculto'))
    for (const el of ocultos) {
      const id = parseInt(el.dataset.pokeId || '0')
      if (!id) continue
      const nom = await fetchNombre(id)
      el.classList.remove('mini-poke-oculto')
      el.classList.add('mini-poke-revelado')
      el.innerHTML = `<img src="${imgUrl(id)}" alt="${nom}" loading="lazy"
        onerror="this.src='${imgSprite(id)}'" style="width:52px;height:52px;object-fit:contain">
        <p>${nom}</p>`
      el.addEventListener('mouseenter', () => mostrarDexTooltip(id, el))
      el.addEventListener('mouseleave', ocultarDexTooltip)
      await new Promise(r => setTimeout(r, 110))
    }
  }
}

// ─── CHAT & BUZZ VISUAL ──────────────────────────────────────────────────────
let ultimoChatSig = ''
let ultimoBuzzId  = ''
let chatInicializado = false

export function dispararAlertaVisualBuzz(texto) {
  Sonido.buzz()
  document.body.classList.remove('buzz-shake')
  void document.body.offsetWidth
  document.body.classList.add('buzz-shake')
  setTimeout(() => document.body.classList.remove('buzz-shake'), 750)

  // Banner visual flotante
  const idBanner = 'banner-buzz-notif'
  let banner = document.getElementById(idBanner)
  if (!banner) {
    banner = document.createElement('div')
    banner.id = idBanner
    banner.className = 'alerta-buzz-visual'
    document.body.appendChild(banner)
  }
  banner.innerHTML = `<span style="font-size:1.6rem">🔔</span> <span>${escHTML(texto || '¡AVISO DEL RIVAL!')}</span>`
  banner.style.display = 'flex'

  clearTimeout(banner._timer)
  banner._timer = setTimeout(() => {
    banner.style.display = 'none'
  }, 3500)
}

export async function renderChat(est) {
  const chat = est.chat || []
  const sig = chat.map(m => m.id).join(',')
  if (sig === ultimoChatSig) return
  ultimoChatSig = sig

  const boxes = [
    document.getElementById('chat-mensajes'),
    document.getElementById('chat-mensajes-lobby'),
  ].filter(Boolean)
  if (!boxes.length) return

  const html = chat.length ? chat.map(m => {
    const cls = m.rol === 'sistema' ? 'chat-sistema' : m.rol === 'jugador1' ? 'chat-j1' : m.rol === 'jugador2' ? 'chat-j2' : 'chat-esp'
    const ts  = new Date(m.ts).toLocaleTimeString('es', {hour:'2-digit',minute:'2-digit'})
    const autor = m.rol === 'sistema' ? '<span class="chat-autor chat-autor-sys">⚙️ Sistema</span>' : `<span class="chat-autor">${escHTML(m.autor || 'Usuario')}</span>`
    return `<div class="chat-msg ${cls}"><div class="chat-msg-header">${autor}<span class="chat-ts">${ts}</span></div><span class="chat-texto">${escHTML(m.texto)}</span></div>`
  }).join('') : '<div class="chat-vacio">💬 ¡Canal conectado!<br>Envía un mensaje para coordinar las reglas con tu rival.</div>'

  boxes.forEach(box => { box.innerHTML = html; box.scrollTop = box.scrollHeight })

  const ultimo = chat[chat.length - 1]
  if (!chatInicializado) {
    chatInicializado = true
    if (ultimo?.id) ultimoBuzzId = ultimo.id
  } else {
    if (ultimo && ultimo.rol !== estado.miRol && ultimo.rol !== 'sistema') Sonido.chat()
    if (ultimo?.rol === 'sistema' && ultimo.texto.includes('🔔') && ultimo.id !== ultimoBuzzId) {
      ultimoBuzzId = ultimo.id
      const esReciente = Math.abs(Date.now() - (ultimo.ts || 0)) < 8000
      // Solo alertar y vibrar si el aviso es para mí (el rival) y NO para quien lo envió ni para espectadores
      const soyElDestinatario = ultimo.paraRol
        ? (estado.miRol === ultimo.paraRol)
        : (estado.miRol && estado.miRol !== ultimo.deRol && estado.miRol !== 'espectador')

      if (esReciente && soyElDestinatario) {
        dispararAlertaVisualBuzz(ultimo.texto)
      }
    }
  }
}

function escHTML(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export async function enviarChat() {
  // Leer del input activo (lobby o draft, el que tenga foco o valor)
  const inputDraft = document.getElementById('chat-input')
  const inputLobby = document.getElementById('chat-input-lobby')
  const input = (document.activeElement === inputLobby ? inputLobby : null)
             || (document.activeElement === inputDraft ? inputDraft : null)
             || inputDraft || inputLobby
  const texto = input?.value.trim()
  if (!texto) return
  if (input) input.value = ''
  try {
    // Si es espectador sin token, enviar con nombreEspectador
    const body = {texto}
    if (estado.miRol === 'espectador' || (!estado.miToken)) {
      body.nombreEspectador = estado.miNombre || 'Espectador'
    }
    await post('/chat', body)
    ultimoChatSig = ''
    if (window.forzarActualizar) await window.forzarActualizar()
  } catch(e) { mostrarToast('⚠️ '+e.message,'err') }
}

export async function enviarBuzz() {
  try {
    await post('/buzz', {})
    mostrarToast('🔔 Aviso enviado','ok')
    Sonido.click()
    if (window.forzarActualizar) window.forzarActualizar()
    // Deshabilitar todos los botones de buzz 8s
    const btn = document.getElementById('btn-buzz')
    const btnL = document.getElementById('btn-buzz-lobby')
    if (btn)  btn.disabled = true
    if (btnL) btnL.disabled = true
    if (btn) {
      btn.disabled = true
      let s = 8
      const iv = setInterval(() => {
        s--
        if (btn)  btn.textContent  = `🔔 ${s}s`
        if (btnL) btnL.textContent = `🔔 ${s}s`
        if (s <= 0) {
          clearInterval(iv)
          if (btn)  { btn.disabled=false;  btn.textContent='🔔 Avisar' }
          if (btnL) { btnL.disabled=false; btnL.textContent='🔔 Avisar' }
        }
      }, 1000)
    }
  } catch(e) { mostrarToast('⚠️ '+e.message,'err') }
}

// ─── ELECCIÓN ────────────────────────────────────────────────────────────────
let elegiendoEnProgreso = false

export async function intentarElegir(id, cardEl) {
  if (!estado.miRol || estado.miRol === 'espectador' || elegiendoEnProgreso) return
  elegiendoEnProgreso = true
  Sonido.seleccionar()

  // Feedback visual táctil e inmediato
  if (cardEl) {
    cardEl.classList.add('card-seleccionada')
  }
  const cards = document.querySelectorAll('#opciones-render .poke-card')
  cards.forEach(c => c.classList.add('card-disabled'))

  try {
    const nuevoEst = await get(`/elegir/${estado.miRol}/${id}`)
    if (nuevoEst && nuevoEst.opcionesActuales) {
      if (window.aplicarEstado) {
        await window.aplicarEstado(nuevoEst)
      } else {
        await syncDraft(nuevoEst)
      }
    } else {
      if (window.forzarActualizar) await window.forzarActualizar()
    }
  } catch(e) {
    Sonido.error()
    mostrarToast('⚠️ '+e.message,'err')
    if (cardEl) cardEl.classList.remove('card-seleccionada')
    cards.forEach(c => c.classList.remove('card-disabled'))
  } finally {
    elegiendoEnProgreso = false
  }
}

// ─── EXPORTAR ────────────────────────────────────────────────────────────────
async function generarExport(est) {
  const esJ1 = estado.miRol === 'jugador1'
  const esJ2 = estado.miRol === 'jugador2'
  const esEspectador = !esJ1 && !esJ2
  const colJ1 = document.getElementById('export-col-j1')
  const colJ2 = document.getElementById('export-col-j2')

  if (colJ1) colJ1.style.display = (esEspectador || esJ1) ? 'flex' : 'none'
  if (colJ2) colJ2.style.display = (esEspectador || esJ2) ? 'flex' : 'none'

  // Si soy J1 solo se procesa y asigna J1; si soy J2 solo J2; si es espectador ambos
  if (esEspectador || esJ1) {
    document.getElementById('sd-j1').value = await fmtEquipo(est.jugador1.equipo)
  } else {
    document.getElementById('sd-j1').value = ''
  }

  if (esEspectador || esJ2) {
    document.getElementById('sd-j2').value = await fmtEquipo(est.jugador2.equipo)
  } else {
    document.getElementById('sd-j2').value = ''
  }

  const nomJ1 = est.jugador1.nombre || 'Jugador 1'
  const nomJ2 = est.jugador2.nombre || 'Jugador 2'
  const t1 = document.getElementById('sd-title-j1')
  const t2 = document.getElementById('sd-title-j2')
  if (t1) t1.textContent = esJ1 ? `Tu Equipo (${nomJ1})` : nomJ1
  if (t2) t2.textContent = esJ2 ? `Tu Equipo (${nomJ2})` : nomJ2
}

async function fmtEquipo(equipo) {
  const lines = await Promise.all(equipo.map(async id => {
    const nom = await fetchNombre(id)
    const cap = nom.charAt(0).toUpperCase() + nom.slice(1)
    return `${cap}\nAbility: No Guard\nEVs: 252 HP / 252 Atk / 4 SpD\n- Tackle\n`
  }))
  return lines.join('\n')
}

function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(texto)
  }
  const area = document.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  document.body.removeChild(area)
  return Promise.resolve()
}

export function copiarCodigo(idEl, btn) {
  const v = document.getElementById(idEl)?.value
  if (!v?.trim()) return
  copiarTexto(v).then(() => {
    Sonido.copiar()
    const orig = btn?.innerHTML || '📋 Copiar'
    if (btn) {
      btn.innerHTML = '✅ Copiado'
      btn.classList.add('copy-ok')
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copy-ok') }, 2000)
    }
  }).catch(() => {
    mostrarToast('⚠️ No se pudo copiar al portapapeles','err')
  })
}

export async function copiarAmbos(btn) {
  const j1 = document.getElementById('sd-j1')?.value
  const j2 = document.getElementById('sd-j2')?.value
  if (!j1 || !j2) return
  await copiarTexto(`=== J1 ===\n\n${j1}\n=== J2 ===\n\n${j2}`)
  Sonido.copiar()
  if (btn) {
    btn.textContent = '✅ Copiados'
    btn.classList.add('copy-ok')
    setTimeout(() => { btn.textContent = '📋 Copiar ambos equipos'; btn.classList.remove('copy-ok') }, 2000)
  }
}

export async function copiarResumenDuelo(btn) {
  const j1Nom = document.getElementById('nom-j1')?.textContent?.trim() || 'Jugador 1'
  const j2Nom = document.getElementById('nom-j2')?.textContent?.trim() || 'Jugador 2'
  const j1Text = document.getElementById('sd-j1')?.value?.trim() || ''
  const j2Text = document.getElementById('sd-j2')?.value?.trim() || ''
  const salaId = estado.salaId || 'DEFAULT'

  const lineasJ1 = j1Text.split('\n\n').map(b => b.split('\n')[0].trim()).filter(Boolean)
  const lineasJ2 = j2Text.split('\n\n').map(b => b.split('\n')[0].trim()).filter(Boolean)

  const resumen = [
    `🏆 DUELO POKÉ-ELECCIÓN [Sala: ${salaId}]`,
    `⚔️ ${j1Nom} vs ${j2Nom}`,
    `----------------------------------------`,
    `🔴 Equipo ${j1Nom}:`,
    ...lineasJ1.map(p => `  • ${p}`),
    ``,
    `🟢 Equipo ${j2Nom}:`,
    ...lineasJ2.map(p => `  • ${p}`),
    `----------------------------------------`,
    `🎮 Juega o revive el draft en: ${window.location.origin}/?sala=${salaId}`
  ].join('\n')

  await copiarTexto(resumen)
  Sonido.copiar()
  if (btn) {
    const orig = btn.innerHTML
    btn.innerHTML = '✅ ¡Resumen Copiado!'
    btn.classList.add('copy-ok')
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copy-ok') }, 2500)
  }
  mostrarToast('📋 Resumen completo del duelo copiado al portapapeles', 'ok')
}

export async function solicitarRevancha(btn) {
  if (estado.miRol !== 'jugador1' && estado.miRol !== 'jugador2') {
    mostrarToast('⚠️ Solo los duelistas pueden solicitar o aceptar revancha', 'err')
    return
  }
  try {
    if (btn) {
      btn.disabled = true
      btn.textContent = '⏳ Solicitando revancha...'
    }
    const res = await post('/revancha', {})
    if (res?.iniciada) {
      mostrarToast('⚔️ ¡Revancha aceptada! Comenzando nuevo duelo...', 'ok')
      Sonido.miTurno?.()
    } else {
      mostrarToast('⚔️ Solicitud de revancha enviada a tu rival. Esperando confirmación...', 'ok')
      Sonido.click?.()
      if (btn) btn.textContent = '⏳ Esperando que acepte tu rival...'
    }
    if (window.forzarActualizar) await window.forzarActualizar()
  } catch (err) {
    mostrarToast('⚠️ ' + (err.message || 'Error al pedir revancha'), 'err')
    if (btn) {
      btn.disabled = false
      btn.textContent = '⚡ Revancha Inmediata'
    }
  }
}

export function abrirShowdown(idEl) {
  const txt = document.getElementById(idEl)?.value?.trim()
  if (!txt) return
  window.open(`https://play.pokemonshowdown.com/teambuilder#${encodeURIComponent(txt)}`, '_blank','noopener,noreferrer')
  Sonido.copiar()
  mostrarToast('🎮 Showdown abierto en nueva pestaña','ok')
}

export async function resetear() {
  if (!confirm('¿Reiniciar el duelo completo?')) return
  Sonido.limpiar()
  try { await get('/reset') } catch {}
  resetarEstadoRender()
}

export function resetarEstadoRender() {
  prevOps=[]; prevTurno=''; prevRonda=-1; exportGen=false; yaRevelo=false
  rendJ1.clear(); rendJ2.clear(); ultimoChatSig=''; ultimoBuzzId=''; chatInicializado=false
  elegiendoEnProgreso=false; serverTimeOffset=0
  detenerTimer()
  resetLobbyEstado()
  document.getElementById('equipo-j1').innerHTML=''
  document.getElementById('equipo-j2').innerHTML=''
  document.getElementById('opciones-render').innerHTML=''
  document.getElementById('showdown-box').style.display='none'
  document.getElementById('chat-mensajes').innerHTML=''
  document.getElementById('chat-mensajes-lobby').innerHTML=''
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
export function arrEq(a,b){ return a.length===b.length&&a.every((v,i)=>v===b[i]) }
