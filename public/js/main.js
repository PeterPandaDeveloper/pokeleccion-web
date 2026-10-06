import { estado, fetchEstado, guardarSesion, limpiarSesion, iniciarHeartbeat, detenerHeartbeat } from './api.js'
import { Sonido }        from './sonido.js'
import { mostrarToast, mostrarInfo, cerrarInfo, mostrarTutorial, cerrarTutorial } from './modal.js'
import { actualizarTextosDOM, getLanguage, setLanguage, t } from './i18n.js'
import {
  construirTipos, onRolChange, toggleRegion, toggleTipo, toggleColor, syncRestr,
  leerVoto, etiquetaVoto, unirseAlLobby, crearSalaParty, unirsePorCodigo, votarConfig, votarConfigDelOtro, marcarListo,
  limpiarSala, copiarEnlace, copiarCodigoSala, crearNuevaSala, actualizarDisplaySala,
  actualizarLobbyUI, mostrarPasoLobby,
  aplicarPreset, onSliderBSTMin, onSliderBSTMax, actualizarBSTPreview,
  seleccionarAvatarEsp, volverAlMenuPrincipal,
} from './lobby.js'
import {
  syncDraft, flashBatalla, resetarEstadoRender, resetear,
  enviarChat, enviarBuzz, copiarCodigo, copiarResumenDuelo, abrirShowdown, renderChat,
  solicitarRevancha, toggleSuperAyuda, actualizarBotonSuperAyudaUI,
} from './draft.js'
import { cargarPokedex } from './pokeapi.js'

// ─── ESTADO GLOBAL DE PANTALLA ────────────────────────────────────────────────
let enDraft = false
let prevEstadoG = null

// ─── EXPONER AL HTML (onclick=) ───────────────────────────────────────────────
window.cambiarIdioma      = setLanguage
window.onRolChange        = onRolChange
window.toggleRegion       = toggleRegion
window.toggleTipo         = toggleTipo
window.toggleColor        = toggleColor
window.syncRestr          = syncRestr
window.crearSalaParty     = crearSalaParty
window.unirsePorCodigo    = unirsePorCodigo
window.copiarCodigoSala   = copiarCodigoSala
window.seleccionarAvatarEsp = seleccionarAvatarEsp
window.volverAlMenuPrincipal = volverAlMenuPrincipal
window.copiarResumenDuelo = copiarResumenDuelo
window.solicitarRevancha  = solicitarRevancha
window.aplicarPreset      = aplicarPreset
window.onSliderBSTMin     = onSliderBSTMin
window.onSliderBSTMax     = onSliderBSTMax
window.actualizarBSTPreview = actualizarBSTPreview
window.toggleSuperAyuda   = toggleSuperAyuda
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
let conteoBuzzLocal = 0
let eliminacionSolicitadaEn = 0
window.registrarBuzz = () => { conteoBuzzLocal++ }
window.getBuzzCount = () => conteoBuzzLocal

window.eliminarSala    = async () => {
  if (!estado.miToken || estado.miRol === 'espectador') return

  const otroRol = estado.miRol === 'jugador1' ? 'jugador2' : 'jugador1'
  const est = prevEstadoG
  const otroPresente = Boolean(est && est[otroRol]?.nombre && est[otroRol]?.conectado)
  const buzzCount = window.getBuzzCount ? window.getBuzzCount() : 0
  const espera15s = eliminacionSolicitadaEn > 0 && (Date.now() - eliminacionSolicitadaEn >= 15_000)
  const puedeForzar = !otroPresente || buzzCount >= 3 || espera15s

  let confirmMsg = ''
  if (!otroPresente) {
    confirmMsg = t('confirm_delete_alone') || '¿Eliminar la sala inmediatamente? (Estás solo en la sala)'
  } else if (buzzCount >= 3) {
    confirmMsg = t('confirm_delete_forced') || '¿Forzar el borrado de la sala por inactividad del rival (3 avisos)?'
  } else if (espera15s) {
    confirmMsg = t('confirm_delete_pending') || 'El rival no ha respondido. ¿Forzar el borrado de la sala ahora?'
  } else {
    confirmMsg = t('confirm_delete_room') || '¿Solicitar la eliminación de la sala para ambos jugadores?'
  }

  if (!confirm(confirmMsg)) return

  try {
    const r = await fetch(`/api/sala/${estado.salaId}/eliminar`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        token: estado.miToken,
        forzar: puedeForzar
      })
    })
    const d = await r.json()
    if (!r.ok) { mostrarToast('⚠️ ' + (d.error || 'Error'), 'err'); return }
    if (d.eliminado) {
      limpiarSesion()
      const msg = d.forzado ? (t('toast_room_deleted_forced') || '🗑 Sala eliminada por inactividad') : (t('toast_room_deleted') || '🗑 Sala eliminada con éxito')
      mostrarToast(msg, 'ok')
      setTimeout(() => window.location.href = '/', 700)
    } else if (d.pending) {
      eliminacionSolicitadaEn = Date.now()
      if (d.segRestantes) {
        mostrarToast(t('toast_room_delete_waiting', { s: d.segRestantes }) || `🗑 Solicitud enviada. Puedes forzar el borrado en ${d.segRestantes}s`, 'info')
      } else {
        mostrarToast(t('toast_room_delete_pending') || '🗑 Solicitud enviada. Espera a que el otro jugador confirme.', 'info')
      }
    }
  } catch(e) {
    mostrarToast('⚠️ ' + (t('toast_delete_err') || 'Error al eliminar la sala'), 'err')
  }
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
    mostrarToast(t('toast_keepalive_ok'), 'ok')
  } catch {}
}
window.liberarSlot     = async () => {
  if (!estado.miToken || estado.miRol === 'espectador') return
  const isEn = getLanguage() === 'en'
  if (!confirm(isEn ? 'Leave your player slot and become a spectator?' : '¿Dejar tu slot como jugador y pasar a espectador?')) return
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
    mostrarToast(t('toast_slot_released'), 'ok')
    Sonido.click()
  } catch(e) { mostrarToast('⚠️ ' + (e.message || 'Error'), 'err') }
}
window.tomarSlot       = async (rol) => {
  const isEn = getLanguage() === 'en'
  const rolName = rol === 'jugador1' ? (isEn ? 'Player 1' : 'Jugador 1') : (isEn ? 'Player 2' : 'Jugador 2')
  if (!confirm(isEn ? `Claim ${rolName} slot?` : `¿Tomar el slot de ${rolName}?`)) return
  try {
    const nombreParaSlot = estado.miNombre || document.getElementById('input-nombre-esp')?.value?.trim() || (isEn ? 'Spectator' : 'Espectador')
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
    const rolTxt = d.rol === 'jugador1' ? (isEn ? 'Player 1' : 'Jugador 1') : (isEn ? 'Player 2' : 'Jugador 2')
    mostrarToast(t('toast_slot_claimed', { role: rolTxt }), 'ok')
    Sonido.seleccionar()
    // Iniciar heartbeat
    import('./api.js').then(m => m.iniciarHeartbeat())
  } catch(e) { mostrarToast('⚠️ ' + (e.message || 'Error'), 'err') }
}
window.togglePrivada   = async () => {
  const priv = document.getElementById('chk-privada')?.checked
  try {
    await fetch(`/api/sala/${estado.salaId}/privada`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({token:estado.miToken, privada:priv})
    })
    Sonido.click()
    mostrarToast(priv ? t('toast_room_private') : t('toast_room_public'), 'info')
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
      box.innerHTML = `<p class="sin-salas">${t('no_active_rooms')}</p>`
      return
    }
    const isEn = getLanguage() === 'en'
    const openTxt = t('room_open_slot')
    box.innerHTML = lista.map(s => {
      const faseTxt = s.fase === 'lobby' ? t('fase_lobby') : s.fase === 'draft' ? t('fase_draft') : t('fase_fin')
      return `
        <button class="sala-item" onclick="window.unirseASala('${s.id}')">
          <span class="sala-item-id">${s.id}</span>
          <span class="sala-item-info">
            ${s.j1 ? `🔴 ${s.j1}` : `🔴 ${openTxt}`} · ${s.j2 ? `🟢 ${s.j2}` : `🟢 ${openTxt}`}
          </span>
          <span class="sala-fase fase-${s.fase}">${faseTxt}</span>
        </button>
      `
    }).join('')
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
        const isEn = getLanguage() === 'en'
        mostrarToast(isEn ? `Room ${id}: P1 occupied. Selected Player 2!` : `Sala ${id}: J1 ocupado. ¡Seleccionado Jugador 2!`, 'ok')
        return
      } else if (est.jugador1?.conectado && est.jugador2?.conectado) {
        sel.value = 'espectador'
        onRolChange()
        mostrarToast(t('toast_joined_spectator', { code: id }), 'info')
        return
      }
    }
  } catch {}
  mostrarToast(t('toast_room_selected', { id }), 'ok')
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
  if (document.hidden) return 2500
  if (!prevEstadoG) return 480

  if (prevEstadoG.fase === 'draft') {
    const miTurno = (prevEstadoG.turnoDe === estado.miRol)
    if (miTurno) return 320 // ¡Instantáneo cuando es mi turno!

    // Si es turno del rival, verificar si el reloj está bajo para acelerar
    if (prevEstadoG.timerExpira) {
      const msRestantes = prevEstadoG.timerExpira - Date.now()
      if (msRestantes <= 3500) return 350 // Acelerar cuando está por pasar el turno
    }
    // Ahorro sustancial de cuota Redis mientras el rival piensa
    return 950
  }

  if (prevEstadoG.fase === 'fin') return 1200

  // Lobby: si ambos están listos, sincronizar rápido
  const ambosListos = prevEstadoG.lobby?.jugador1?.listo && prevEstadoG.lobby?.jugador2?.listo
  if (ambosListos) return 350
  return 600
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
  p.textContent  = ok ? t('connected') : t('disconnected')
  p.className    = `conn-pill ${ok ? 'conn-ok' : 'conn-err'}`
}

// ─── INICIO ───────────────────────────────────────────────────────────────────
async function iniciar() {
  actualizarTextosDOM()
  construirTipos()
  actualizarDisplaySala()
  actualizarBotonSuperAyudaUI()

  // Sincronizar tras cambio de idioma
  window.addEventListener('idiomaCambiado', () => {
    if (!estado.salaId) cargarSalasPublicas()
    setConexion(true)
  })

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

  // Enter en input de nombre y código
  document.getElementById('input-nombre')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const cod = document.getElementById('input-codigo-sala')?.value?.trim()
      if (cod || estado.salaId) unirsePorCodigo()
      else crearSalaParty()
    }
  })
  if (estado.salaId) {
    const inputCod = document.getElementById('input-codigo-sala')
    if (inputCod && !inputCod.value) inputCod.value = estado.salaId
  }
  document.getElementById('input-codigo-sala')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') unirsePorCodigo()
  })

  // Enter en chat (ambos inputs)
  ;['chat-input','chat-input-lobby'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarChat() }
    })
  })

  // Escuchar estado de red (offline / online)
  window.addEventListener('offline', () => {
    const b = document.getElementById('banner-desconexion')
    if (b) {
      b.textContent = '⚠️ Sin conexión a internet. Intentando reconectar...'
      b.className = 'banner-desconexion desconectado'
      b.style.display = 'block'
    }
  })
  window.addEventListener('online', () => {
    const b = document.getElementById('banner-desconexion')
    if (b) {
      b.textContent = '✅ Conexión restablecida con éxito'
      b.className = 'banner-desconexion reconectado'
      setTimeout(() => { b.style.display = 'none' }, 2500)
    }
    programarSiguientePoll(true)
  })

  // Cargar Pokédex en memoria y previsualizar BST
  cargarPokedex().then(() => {
    actualizarBSTPreview()
  }).catch(() => {})
}

window.onload = iniciar
