import { resetLobbyEstado } from './lobby.js'
import { Sonido }   from './sonido.js'
import { estado, API, get, post, fetchEstado } from './api.js'
import { mostrarToast } from './modal.js'
import { fetchNombre, imgUrl, imgSprite } from './pokeapi.js'
import { TIMER_SEG, SUBSTITUTE_IMG } from './constantes.js'

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
    if (esYo) div.addEventListener('mouseenter', () => Sonido.hover())
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
      // Estilo Clash Royale:
      // J1 elige en rondas impares (índices 0, 2, 4...) -> pick secreto propio de J1.
      // J2 elige en rondas pares (índices 1, 3, 5...) y le da ese poke a J1 -> J2 sabe qué le regaló.
      // El rival (J2) solo ve '???' para los Pokémon que J1 eligió para sí mismo.
      const esPickPropioDeJ1 = (i % 2 === 0)
      const ocultar = modoOculto && estado.miRol === 'jugador2' && !esEspectador && !esFin && esPickPropioDeJ1
      g1.appendChild(await crearMini(id, 'slide-in-right', ocultar))
      rendJ1.add(key)
    }
  }

  for (let i = 0; i < est.jugador2.equipo.length; i++) {
    const id = est.jugador2.equipo[i]
    const key = `j2_${i}_${id}`
    if (!rendJ2.has(key)) {
      // Estilo Clash Royale:
      // J1 elige en rondas impares (índices 0, 2, 4...) y le da ese poke a J2 -> J1 sabe qué le regaló.
      // J2 elige en rondas pares (índices 1, 3, 5...) -> pick secreto propio de J2.
      // El rival (J1) solo ve '???' para los Pokémon que J2 eligió para sí mismo.
      const esPickPropioDeJ2 = (i % 2 === 1)
      const ocultar = modoOculto && estado.miRol === 'jugador1' && !esEspectador && !esFin && esPickPropioDeJ2
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
