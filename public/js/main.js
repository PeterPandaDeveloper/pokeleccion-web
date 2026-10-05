import { estado, fetchEstado, guardarSesion, limpiarSesion, iniciarHeartbeat, detenerHeartbeat } from './api.js'
import { Sonido }        from './sonido.js'
import { mostrarToast, mostrarInfo, cerrarInfo, mostrarTutorial, cerrarTutorial } from './modal.js'
import {
  construirTipos, onRolChange, toggleRegion, toggleTipo, toggleColor, syncRestr,
  leerVoto, etiquetaVoto, unirseAlLobby, votarConfig, votarConfigDelOtro, marcarListo,
  limpiarSala, copiarEnlace, crearNuevaSala, actualizarDisplaySala,
  actualizarLobbyUI, mostrarPasoLobby,
} from './lobby.js'
import {
  syncDraft, flashBatalla, resetarEstadoRender, resetear,
  enviarChat, enviarBuzz, copiarCodigo, abrirShowdown, renderChat,
} from './draft.js'

// ─── ESTADO GLOBAL DE PANTALLA ────────────────────────────────────────────────
let enDraft = false
let prevEstadoG = null

// ─── EXPONER AL HTML (onclick=) ───────────────────────────────────────────────
window.onRolChange     = onRolChange
window.toggleRegion    = toggleRegion
window.toggleTipo      = toggleTipo
window.toggleColor     = toggleColor
window.syncRestr       = syncRestr
window.unirseAlLobby   = async (...args) => {
  await unirseAlLobby(...args)
  // Iniciar heartbeat tras unirse exitosamente
  if (estado.miToken && estado.miRol !== 'espectador') iniciarHeartbeat()
}
window.votarConfig     = votarConfig
window.votarConfigOtro = votarConfigDelOtro
window.marcarListo     = marcarListo
window.limpiarSala     = limpiarSala
window.copiarEnlace    = copiarEnlace
window.crearNuevaSala  = crearNuevaSala
window.eliminarSala    = async () => {
  if (!estado.miToken || estado.miRol === 'espectador') return
  if (!confirm('¿Solicitar la eliminación de la sala para ambos jugadores?')) return
  try {
    const r = await fetch(`/api/sala/${estado.salaId}/eliminar`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({token: estado.miToken})
    })
    const d = await r.json()
    if (!r.ok) { mostrarToast('⚠️ '+d.error,'err'); return }
    if (d.eliminado) {
      mostrarToast('🗑 Sala eliminada por consenso','ok')
      setTimeout(() => window.location.href = '/', 700)
    } else {
      mostrarToast('🗑 Solicitud enviada. Espera a que el otro jugador confirme.','info')
    }
  } catch(e) { mostrarToast('⚠️ Error al eliminar la sala','err') }
}
window.mostrarInfo     = mostrarInfo
window.cerrarInfo      = cerrarInfo
window.mostrarTutorial = mostrarTutorial
window.cerrarTutorial  = cerrarTutorial
window.resetear        = async () => {
  detenerHeartbeat()
  await resetear()
  enDraft = false
  document.getElementById('pantalla-draft').style.display = 'none'
  document.getElementById('pantalla-lobby').style.display = 'block'
  mostrarPasoLobby()
  if (estado.miToken && estado.miRol !== 'espectador') iniciarHeartbeat()
}
window.copiarCodigo    = copiarCodigo
window.abrirShowdown   = abrirShowdown
window.enviarChat      = enviarChat
window.enviarBuzz      = enviarBuzz
window.mantenerViva    = async () => {
  try {
    await fetch(`/api/sala/${estado.salaId}/keepalive`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({token:estado.miToken})
    })
    Sonido.click()
    mostrarToast('⏱ ¡Sala extendida por 5 minutos!', 'ok')
  } catch {}
}
window.liberarSlot     = async () => {
  if (!estado.miToken || estado.miRol === 'espectador') return
  if (!confirm('¿Dejar tu slot como jugador y pasar a espectador?')) return
  try {
    const r = await fetch(`/api/sala/${estado.salaId}/intercambiar`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({accion:'liberar', token: estado.miToken})
    })
    const d = await r.json()
    if (!r.ok) { mostrarToast('⚠️ '+d.error,'err'); return }
    estado.miToken = ''
    estado.miRol = 'espectador'
    guardarSesion()
    mostrarPasoLobby()
    mostrarToast('🚪 Slot liberado, ahora eres espectador','ok')
    Sonido.click()
  } catch(e) { mostrarToast('⚠️ Error al liberar slot','err') }
}
window.tomarSlot       = async (rol) => {
  if (!confirm(`¿Tomar el slot de ${rol==='jugador1'?'Jugador 1':'Jugador 2'}?`)) return
  try {
    const nombreParaSlot = estado.miNombre || document.getElementById('input-nombre-esp')?.value?.trim() || 'Espectador'
    estado.miNombre = nombreParaSlot
    const r = await fetch(`/api/sala/${estado.salaId}/intercambiar`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({accion:'tomar', rol, nombreEspectador: nombreParaSlot})
    })
    const d = await r.json()
    if (!r.ok) { mostrarToast('⚠️ '+d.error,'err'); return }
    estado.miToken = d.token
    estado.miRol = d.rol
    guardarSesion()
    mostrarPasoLobby()
    mostrarToast(`✅ Ahora eres ${d.rol==='jugador1'?'Jugador 1':'Jugador 2'}!`, 'ok')
    Sonido.seleccionar()
    // Iniciar heartbeat
    import('./api.js').then(m => m.iniciarHeartbeat())
  } catch(e) { mostrarToast('⚠️ Error al tomar slot','err') }
}
window.togglePrivada   = async () => {
  const priv = document.getElementById('chk-privada')?.checked
  try {
    await fetch(`/api/sala/${estado.salaId}/privada`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({token:estado.miToken, privada:priv})
    })
    Sonido.click()
    mostrarToast(priv ? '🔒 Sala privada' : '🌐 Sala pública', 'info')
  } catch {}
}

// ─── SELECTOR DE SALAS PÚBLICAS ───────────────────────────────────────────────
async function cargarSalasPublicas() {
  try {
    const r = await fetch('/api/salas')
    const lista = await r.json()
    const box = document.getElementById('salas-publicas')
    if (!box) return
    if (!lista.length) {
      box.innerHTML = '<p class="sin-salas">No hay salas públicas activas. ¡Crea una nueva!</p>'
      return
    }
    box.innerHTML = lista.map(s => `
      <button class="sala-item" onclick="window.unirseASala('${s.id}')">
        <span class="sala-item-id">${s.id}</span>
        <span class="sala-item-info">
          ${s.j1 ? `🔴 ${s.j1}` : '🔴 Libre'} · ${s.j2 ? `🟢 ${s.j2}` : '🟢 Libre'}
        </span>
        <span class="sala-fase fase-${s.fase}">${s.fase === 'lobby' ? 'En lobby' : s.fase === 'draft' ? 'Jugando' : 'Finalizada'}</span>
      </button>
    `).join('')
  } catch {}
}

window.unirseASala = async (id) => {
  estado.salaId = id
  guardarSesion()
  actualizarDisplaySala()
  Sonido.click()
  try {
    const est = await fetchEstado()
    const sel = document.getElementById('rol-selector')
    if (sel) {
      if (est.jugador1?.conectado && !est.jugador2?.conectado) {
        sel.value = 'jugador2'
        onRolChange()
        mostrarToast(`Sala ${id}: J1 ocupado (${est.jugador1.nombre||'J1'}). ¡Seleccionado Jugador 2!`, 'ok')
        return
      } else if (est.jugador1?.conectado && est.jugador2?.conectado) {
        sel.value = 'espectador'
        onRolChange()
        mostrarToast(`Sala ${id}: Sala llena. ¡Entrarás como Espectador!`, 'info')
        return
      }
    }
  } catch {}
  mostrarToast(`Sala ${id} seleccionada. ¡Elige tu rol!`, 'ok')
}

// ─── MAIN LOOP & SINCRONIZACIÓN EN TIEMPO REAL ─────────────────────────────
let isActualizando = false

export async function aplicarEstado(est) {
  if (!est) return
  prevEstadoG = est

  // Detectar notificaciones del otro jugador
  detectarCambios(est)

  if (est.fase === 'lobby') {
    if (enDraft) {
      // Volvimos al lobby (reset)
      enDraft = false
      document.getElementById('pantalla-draft').style.display = 'none'
      document.getElementById('pantalla-lobby').style.display = 'block'
      resetarEstadoRender()
      mostrarPasoLobby()
    }
    if (document.getElementById('paso-lobby').style.display !== 'none') {
      actualizarLobbyUI(est)
    }
    await renderChat(est)
  } else {
    if (!enDraft) {
      enDraft = true
      flashBatalla(() => {
        document.getElementById('pantalla-lobby').style.display = 'none'
        document.getElementById('pantalla-draft').style.display = 'block'
      })
    }
    await syncDraft(est)
  }

  // Indicador de conexión
  setConexion(true)
}
window.aplicarEstado = aplicarEstado

export async function actualizar() {
  if (isActualizando || !estado.salaId) return
  isActualizando = true
  try {
    const est = await fetchEstado()
    await aplicarEstado(est)
  } catch {
    setConexion(false)
  } finally {
    isActualizando = false
  }
}

function obtenerIntervaloPolling() {
  if (document.hidden) return 1800
  if (!prevEstadoG) return 450
  if (prevEstadoG.fase === 'draft') return 320 // ¡Tiempo real en draft sin lag!
  if (prevEstadoG.fase === 'fin') return 2000
  return 480 // Lobby ágil
}

let loopTimer = null
export function programarSiguientePoll(inmediato = false) {
  if (loopTimer) clearTimeout(loopTimer)
  const delay = inmediato ? 0 : obtenerIntervaloPolling()
  loopTimer = setTimeout(async () => {
    try { await actualizar() } catch {}
    programarSiguientePoll()
  }, delay)
}
window.forzarActualizar = () => programarSiguientePoll(true)

let _prevLobby = null
function detectarCambios(est) {
  if (!_prevLobby) { _prevLobby = JSON.stringify(est.lobby); return }
  const nuevo = JSON.stringify(est.lobby)
  if (nuevo === _prevLobby) return
  const prev = JSON.parse(_prevLobby)
  _prevLobby = nuevo

  // Otro jugador votó
  const otroRol = estado.miRol === 'jugador1' ? 'jugador2' : 'jugador1'
  const lOtro   = est.lobby[otroRol], pOtro = prev[otroRol]
  if (lOtro?.voto && !pOtro?.voto && otroRol !== estado.miRol) {
    Sonido.votoOtro()
    mostrarToast(`🗳 ${lOtro.nombre||otroRol} eligió su configuración`, 'info')
  }
  if (lOtro?.listo && !pOtro?.listo) {
    Sonido.listo()
    mostrarToast(`✅ ${lOtro.nombre||otroRol} está listo`, 'ok')
  }
}

function setConexion(ok) {
  const p = document.getElementById('conn-pill')
  if (!p) return
  p.textContent  = ok ? '🟢 Conectado' : '🔴 Sin conexión'
  p.className    = `conn-pill ${ok ? 'conn-ok' : 'conn-err'}`
}

// ─── INICIO ───────────────────────────────────────────────────────────────────
async function iniciar() {
  construirTipos()
  actualizarDisplaySala()

  // Mostrar tutorial si es la primera vez
  if (!localStorage.getItem('tutorial-visto')) {
    setTimeout(mostrarTutorial, 600)
  }

  // Cargar salas públicas mientras no hay salaId
  if (!estado.salaId) {
    await cargarSalasPublicas()
  }

  // Reconexión automática si hay token guardado
  if (estado.miToken && estado.salaId) {
    try {
      const r = await fetch(`/api/sala/${estado.salaId}/lobby/verificar`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({token: estado.miToken})
      })
      const d = await r.json()
      if (d.rol) {
        estado.miRol = d.rol
        guardarSesion()
        if (d.estado?.fase === 'lobby') {
          mostrarPasoLobby()
        } else {
          enDraft = true
          document.getElementById('pantalla-lobby').style.display = 'none'
          document.getElementById('pantalla-draft').style.display = 'block'
        }
      }
    } catch {}
  }

  // Si no tenemos rol/token pero sí una sala asignada, auto-detectar rol disponible
  if (estado.salaId && (!estado.miRol || !estado.miToken)) {
    try {
      const est = await fetchEstado()
      const sel = document.getElementById('rol-selector')
      if (sel) {
        if (est.jugador1?.conectado && !est.jugador2?.conectado) {
          sel.value = 'jugador2'
          onRolChange()
        } else if (est.jugador1?.conectado && est.jugador2?.conectado) {
          sel.value = 'espectador'
          onRolChange()
        }
      }
    } catch {}
  }

  // Iniciar heartbeat si ya tenemos sesión activa
  if (estado.miToken && estado.salaId && estado.miRol !== 'espectador') iniciarHeartbeat()

  // Iniciar loop adaptativo en tiempo real
  programarSiguientePoll(true)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) programarSiguientePoll(true)
  })

  // Enter en input de nombre
  document.getElementById('input-nombre')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') unirseAlLobby()
  })

  // Enter en chat (ambos inputs)
  ;['chat-input','chat-input-lobby'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarChat() }
    })
  })
}

window.onload = iniciar
