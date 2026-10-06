import { TIPOS, TIPO_COLOR, TIPO_EN, TIPO_ABBR, RANGOS, FORMAS_REGIONALES, LEGENDARIOS, COLORES, COLOR_HEX, FORMAS_REGIONALES_ESPECIALES, GIMMICKS, NUM_RONDAS_DEFAULT } from './constantes.js'
import { Sonido }  from './sonido.js'
import { estado, API, post, guardarSesion, fetchEstado } from './api.js'
import { mostrarInfo, mostrarToast } from './modal.js'
import { precargaBatch, evoCache, typeCache, bstCache, colorCache, pokemonFullCache } from './pokeapi.js'
import { renderChat } from './draft.js'
import { getLanguage, t, COLOR_NOMBRES } from './i18n.js'

// ─── ESTADO LOCAL DE CONFIG ───────────────────────────────────────────────────
export let regionesSel  = new Set(['todas'])
export let tiposSel     = new Set()
export let coloresSel   = new Set()
export let yaVote       = false
export let yaListo      = false
export let cooldownLimpiar = false

// ─── BUILD UI ─────────────────────────────────────────────────────────────────
export function construirTipos() {
  const tGrid = document.getElementById('tipo-grid')
  if (tGrid) {
    tGrid.innerHTML = TIPOS.map(t => {
      const abbr  = TIPO_ABBR[t] || t.slice(0, 3).toUpperCase()
      const color = TIPO_COLOR[t]
      const cap   = t.charAt(0).toUpperCase() + t.slice(1)
      return `<button class="tbtn type-badge type-${TIPO_EN[t]}" data-t="${t}" style="background-color:${color};" title="${cap} (${abbr})" onclick="window.toggleTipo(this)">${abbr}</button>`
    }).join('')
  }
  const colorGrid = document.getElementById('color-grid')
  if (colorGrid) {
    const lang = getLanguage()
    colorGrid.innerHTML = COLORES.map(c => {
      const nom = (COLOR_NOMBRES[lang] && COLOR_NOMBRES[lang][c]) || c
      return `<button class="cbtn" data-c="${c}" style="--cc:${COLOR_HEX[c]}" onclick="window.toggleColor(this)">${nom}</button>`
    }).join('')
  }
}

export function onRolChange() {
  const r = document.getElementById('rol-selector').value
  document.getElementById('fila-nombre').style.display = r==='espectador'?'none':'flex'
  document.getElementById('fila-nombre-esp').style.display = r==='espectador'?'flex':'none'
  document.getElementById('paso-titulo').textContent   = r==='espectador'?'Entrar como espectador':'¿Quién eres?'
  document.getElementById('btn-unirse').textContent    = r==='espectador'?'Entrar a mirar':'Entrar'
}

export let presetActivo = null
export let snapshotPrevio = null

export function desactivarPresetVisual() {
  if (presetActivo) {
    presetActivo = null
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('preset-active'))
  }
}

export function toggleRegion(btn) {
  desactivarPresetVisual()
  const r = btn.dataset.r; Sonido.click()
  if (r==='todas') {
    regionesSel.clear(); regionesSel.add('todas')
    document.querySelectorAll('.rbtn').forEach(b=>b.classList.toggle('active',b.dataset.r==='todas'))
  } else {
    if (regionesSel.has(r)) {
      regionesSel.delete(r); btn.classList.remove('active')
      if (!regionesSel.size) { regionesSel.add('todas'); document.querySelector('.rbtn[data-r="todas"]').classList.add('active') }
    } else {
      regionesSel.add(r); btn.classList.add('active')
      if (regionesSel.has('todas')) { regionesSel.delete('todas'); document.querySelector('.rbtn[data-r="todas"]').classList.remove('active') }
    }
  }
  document.getElementById('hint-regiones').textContent =
    regionesSel.has('todas') ? t('regions_all') : t('regions_selected', { list: [...regionesSel].join(', ') })
}

export function toggleTipo(btn) {
  desactivarPresetVisual()
  const t=btn.dataset.t
  tiposSel.has(t)?(tiposSel.delete(t),btn.classList.remove('active')):(tiposSel.add(t),btn.classList.add('active'))
  document.getElementById('tipo-grid')?.classList.toggle('has-selected', tiposSel.size > 0)
  document.getElementById('modo-tipos-row').style.display = tiposSel.size>1?'flex':'none'
  if (tiposSel.size) coloresSel.clear(); document.querySelectorAll('.cbtn').forEach(b=>b.classList.remove('active'))
  Sonido.click()
}

export function toggleColor(btn) {
  desactivarPresetVisual()
  const c=btn.dataset.c
  coloresSel.has(c)?(coloresSel.delete(c),btn.classList.remove('active')):(coloresSel.add(c),btn.classList.add('active'))
  if (coloresSel.size) {
    tiposSel.clear()
    document.querySelectorAll('.tbtn').forEach(b=>b.classList.remove('active'))
    document.getElementById('tipo-grid')?.classList.remove('has-selected')
  }
  document.getElementById('modo-tipos-row').style.display = 'none'
  Sonido.click()
}

export function syncRestr(el) {
  desactivarPresetVisual()
  const ids=['chk-finales','chk-sinevo','chk-base','chk-copabebe']
  const activos = ids.filter(id=>document.getElementById(id)?.checked)
  if (activos.length>1) {
    ids.forEach(id=>{ if (id!==el.id) { const x=document.getElementById(id); if(x) x.checked=false } })
    document.getElementById('warn-evolucion').style.display='block'
    setTimeout(()=>document.getElementById('warn-evolucion').style.display='none',3000)
  } else {
    document.getElementById('warn-evolucion').style.display='none'
  }
  Sonido.click()
}

export function leerVoto() {
  const modoEl = document.querySelector('input[name="modoTipos"]:checked')
  return {
    regiones: [...regionesSel], tipos: [...tiposSel], colores: [...coloresSel],
    modoTipos: modoEl?.value||'OR',
    sinLegendarios:   !!document.getElementById('chk-sin-leg')?.checked,
    soloFinales:      !!document.getElementById('chk-finales')?.checked,
    soloSinEvolucion: !!document.getElementById('chk-sinevo')?.checked,
    soloBase:         !!document.getElementById('chk-base')?.checked,
    copaBebe:         !!document.getElementById('chk-copabebe')?.checked,
    noDuplicadosTipo: !!document.getElementById('chk-nodup')?.checked,
    sinGimmicks: !!document.getElementById('chk-gimmicks')?.checked,
    sinFormasRegionales: !!document.getElementById('chk-formas-reg')?.checked,
    maxBST: document.getElementById('bst-max')?.value ? parseInt(document.getElementById('bst-max').value) : null,
    minBST: document.getElementById('bst-min')?.value ? parseInt(document.getElementById('bst-min').value) : null,
    numRondas: parseInt(document.getElementById('num-rondas')?.value || String(NUM_RONDAS_DEFAULT)),
    modoOculto: !!document.getElementById('chk-oculto')?.checked,
  }
}

export function etiquetaVoto(v) {
  const isEn = getLanguage() === 'en'
  if (!v) return isEn ? 'No vote' : 'Sin voto'
  const p=[]
  if (v.regiones&&!v.regiones.includes('todas')) p.push((isEn ? '📍 Regions: ' : '📍 Regiones: ')+v.regiones.join(', '))
  if (v.tipos?.length) {
    const modo = isEn ? (v.modoTipos==='AND' ? 'all of these types' : 'any of these types') : (v.modoTipos==='AND' ? 'todos estos tipos' : 'cualquiera de estos tipos')
    p.push((isEn ? '⚔️ Types: ' : '⚔️ Tipos: ')+v.tipos.join(', ')+' ('+modo+')')
  }
  if (v.colores?.length) p.push((isEn ? '🎨 Colors: ' : '🎨 Colores: ')+v.colores.join(', '))
  if (v.sinLegendarios)   p.push(isEn ? '🚫 No legendaries' : '🚫 Sin legendarios')
  if (v.soloFinales)      p.push(isEn ? '⬆️ Fully evolved only' : '⬆️ Solo evolucionados al máximo')
  if (v.soloSinEvolucion) p.push(isEn ? '⛔ Single stage only' : '⛔ Sin evolución posible')
  if (v.soloBase)         p.push(isEn ? '🐣 First stage only' : '🐣 Solo primera etapa')
  if (v.copaBebe)         p.push(isEn ? '🍼 Little Cup' : '🍼 Copa Bebé (bebés con futuro)')
  if (v.noDuplicadosTipo) p.push(isEn ? '🔄 Unique types on team' : '🔄 Tipos únicos en equipo')
  if (v.sinGimmicks) p.push(isEn ? '🪄 No gimmicks' : '🪄 Sin gimmicks')
  if (v.sinFormasRegionales) p.push(isEn ? '🗺️ No regional forms' : '🗺️ Sin formas regionales')
  if (v.minBST) p.push((isEn ? '📊 Min BST: ' : '📊 BST mínimo: ')+v.minBST)
  if (v.maxBST) p.push((isEn ? '📊 Max BST: ' : '📊 BST máximo: ')+v.maxBST)
  const nr = v.numRondas ?? NUM_RONDAS_DEFAULT
  p.push(isEn ? `🎯 ${nr} round${nr > 1 ? 's' : ''}` : `🎯 ${nr} ronda${nr > 1 ? 's' : ''}`)
  if (v.modoOculto) p.push(isEn ? '🙈 Blind Mode' : '🙈 Modo Oculto')
  return p.length ? p.join(' · ') : (isEn ? '🎯 No restrictions' : '🎯 Sin restricciones')
}

const CONFIG_CTRLS = '.config-panel input, .config-panel select, .rbtn, .tbtn, .tog input, .bst-input, .btn-votar, .btn-votar-j2, .btn-preset, .bst-slider'

export function actualizarBSTPreview() {
  const minVal = parseInt(document.getElementById('bst-min')?.value, 10) || 0
  const maxVal = parseInt(document.getElementById('bst-max')?.value, 10) || 0

  const sliderMin = document.getElementById('slider-bst-min')
  const sliderMax = document.getElementById('slider-bst-max')
  if (sliderMin && document.activeElement !== sliderMin) {
    sliderMin.value = minVal > 0 ? String(minVal) : '180'
  }
  if (sliderMax && document.activeElement !== sliderMax) {
    sliderMax.value = maxVal > 0 ? String(maxVal) : '780'
  }

  if (!pokemonFullCache || pokemonFullCache.size === 0) return

  const todos = Array.from(pokemonFullCache.values())

  // Min preview
  const nomMinEl = document.getElementById('bst-nom-min')
  const valMinEl = document.getElementById('bst-val-min')
  const imgMinEl = document.getElementById('bst-sprite-min')

  if (minVal > 0) {
    let closestMin = todos[0]
    let diffMin = Infinity
    for (const p of todos) {
      const d = Math.abs(p.bst - minVal)
      if (d < diffMin) { diffMin = d; closestMin = p; if (d === 0) break }
    }
    if (nomMinEl) nomMinEl.textContent = closestMin.name
    if (valMinEl) valMinEl.textContent = `BST ${closestMin.bst}`
    if (imgMinEl) imgMinEl.src = closestMin.sprite
  } else {
    if (nomMinEl) nomMinEl.textContent = t('bst_no_min')
    if (valMinEl) valMinEl.textContent = t('bst_any')
    if (imgMinEl) imgMinEl.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/172.png'
  }

  // Max preview
  const nomMaxEl = document.getElementById('bst-nom-max')
  const valMaxEl = document.getElementById('bst-val-max')
  const imgMaxEl = document.getElementById('bst-sprite-max')

  if (maxVal > 0 && maxVal < 780) {
    let closestMax = todos[0]
    let diffMax = Infinity
    for (const p of todos) {
      const d = Math.abs(p.bst - maxVal)
      if (d < diffMax) { diffMax = d; closestMax = p; if (d === 0) break }
    }
    if (nomMaxEl) nomMaxEl.textContent = closestMax.name
    if (valMaxEl) valMaxEl.textContent = `BST ${closestMax.bst}`
    if (imgMaxEl) imgMaxEl.src = closestMax.sprite
  } else {
    if (nomMaxEl) nomMaxEl.textContent = t('bst_no_max')
    if (valMaxEl) valMaxEl.textContent = t('bst_up_to')
    if (imgMaxEl) imgMaxEl.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png'
  }

  // Count
  const effectiveMin = minVal || 0
  const effectiveMax = maxVal || 9999
  const count = todos.filter(p => p.bst >= effectiveMin && p.bst <= effectiveMax).length
  const countEl = document.getElementById('bst-pool-count')
  if (countEl) countEl.textContent = `${count} Pokémon`
}

export function onSliderBSTMin(val) {
  desactivarPresetVisual()
  const num = parseInt(val, 10)
  const minInput = document.getElementById('bst-min')
  if (minInput) minInput.value = num <= 180 ? '' : String(num)
  actualizarBSTPreview()
}

export function onSliderBSTMax(val) {
  desactivarPresetVisual()
  const num = parseInt(val, 10)
  const maxInput = document.getElementById('bst-max')
  if (maxInput) maxInput.value = num >= 780 ? '' : String(num)
  actualizarBSTPreview()
}

export function aplicarPreset(tipo) {
  // Toggle: Si ya está activo este preset, desclicar y restaurar la configuración anterior
  if (presetActivo === tipo) {
    desactivarPresetVisual()
    Sonido.click()

    if (snapshotPrevio) {
      aplicarVotoEnUI(snapshotPrevio)
      mostrarToast('↩️ Configuración previa restaurada', 'info')
    } else {
      regionesSel = new Set(['todas'])
      tiposSel.clear()
      coloresSel.clear()
      aplicarVotoEnUI({
        regiones: ['todas'], tipos: [], colores: [], modoTipos: 'OR',
        sinLegendarios: false, soloFinales: false, soloSinEvolucion: false,
        soloBase: false, copaBebe: false, noDuplicadosTipo: false,
        sinGimmicks: false, sinFormasRegionales: false,
        minBST: null, maxBST: null, numRondas: 6, modoOculto: true
      })
      mostrarToast(t('toast_preset_off'), 'info')
    }
    actualizarBSTPreview()
    if (estado.miToken && estado.miRol !== 'espectador' && !yaListo) {
      votarConfig()
    }
    return
  }

  // Si no había ningún preset activo, capturar snapshot de la configuración actual
  if (!presetActivo) {
    snapshotPrevio = leerVoto()
  }

  presetActivo = tipo
  document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('preset-active'))
  document.getElementById(`preset-${tipo}`)?.classList.add('preset-active')

  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val }

  // Limpiar tipos y colores para aplicar preset
  tiposSel.clear()
  coloresSel.clear()
  document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'))
  document.querySelectorAll('.cbtn').forEach(b => b.classList.remove('active'))
  document.getElementById('tipo-grid')?.classList.remove('has-selected')
  const mRow = document.getElementById('modo-tipos-row')
  if (mRow) mRow.style.display = 'none'

  const bstMin = document.getElementById('bst-min')
  const bstMax = document.getElementById('bst-max')
  const numR = document.getElementById('num-rondas')

  if (tipo === 'casual') {
    regionesSel = new Set(['todas'])
    setChk('chk-sin-leg', true)
    setChk('chk-finales', false)
    setChk('chk-sinevo', false)
    setChk('chk-base', false)
    setChk('chk-copabebe', false)
    setChk('chk-nodup', false)
    setChk('chk-gimmicks', true)
    setChk('chk-formas-reg', false)
    if (bstMin) bstMin.value = ''
    if (bstMax) bstMax.value = ''
    if (numR) numR.value = '6'
    setChk('chk-oculto', true)
    mostrarToast(t('toast_preset_casual'), 'ok')
  } else if (tipo === 'competitivo') {
    regionesSel = new Set(['todas'])
    setChk('chk-sin-leg', true)
    setChk('chk-finales', true)
    setChk('chk-sinevo', false)
    setChk('chk-base', false)
    setChk('chk-copabebe', false)
    setChk('chk-nodup', true)
    setChk('chk-gimmicks', true)
    setChk('chk-formas-reg', false)
    if (bstMin) bstMin.value = '500'
    if (bstMax) bstMax.value = ''
    if (numR) numR.value = '6'
    setChk('chk-oculto', true)
    mostrarToast(t('toast_preset_comp'), 'ok')
  } else if (tipo === 'copabebe') {
    regionesSel = new Set(['todas'])
    setChk('chk-sin-leg', true)
    setChk('chk-finales', false)
    setChk('chk-sinevo', false)
    setChk('chk-base', false)
    setChk('chk-copabebe', true)
    setChk('chk-nodup', false)
    setChk('chk-gimmicks', true)
    setChk('chk-formas-reg', false)
    if (bstMin) bstMin.value = ''
    if (bstMax) bstMax.value = '360'
    if (numR) numR.value = '6'
    setChk('chk-oculto', true)
    mostrarToast(t('toast_preset_baby'), 'ok')
  }

  document.querySelectorAll('.rbtn').forEach(b => {
    b.classList.toggle('active', regionesSel.has(b.dataset.r))
  })
  const hintR = document.getElementById('hint-regiones')
  if (hintR) hintR.textContent = 'Selección: todas'

  Sonido.click()
  actualizarBSTPreview()

  // Sincronización reactiva con el lobby y servidor
  if (estado.miToken && estado.miRol !== 'espectador' && !yaListo) {
    votarConfig()
  }
}

/** Aplica un voto del servidor a los botones/checkboxes de la UI. */
export function aplicarVotoEnUI(v) {
  if (!v) return

  regionesSel = new Set(v.regiones?.length ? v.regiones : ['todas'])
  document.querySelectorAll('.rbtn').forEach(b => {
    b.classList.toggle('active', regionesSel.has(b.dataset.r))
  })
  document.getElementById('hint-regiones').textContent =
    regionesSel.has('todas') ? 'Selección: todas' : 'Selección: '+[...regionesSel].join(', ')

  tiposSel = new Set(v.tipos || [])
  coloresSel = new Set(v.colores || [])
  document.querySelectorAll('.tbtn').forEach(b => {
    b.classList.toggle('active', tiposSel.has(b.dataset.t))
  })
  document.getElementById('tipo-grid')?.classList.toggle('has-selected', tiposSel.size > 0)
  document.querySelectorAll('.cbtn').forEach(b => {
    b.classList.toggle('active', coloresSel.has(b.dataset.c))
  })
  document.getElementById('modo-tipos-row').style.display = tiposSel.size > 1 ? 'flex' : 'none'

  const modo = v.modoTipos || 'OR'
  document.querySelectorAll('input[name="modoTipos"]').forEach(r => { r.checked = r.value === modo })

  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val }
  setChk('chk-sin-leg', v.sinLegendarios)
  setChk('chk-finales', v.soloFinales)
  setChk('chk-sinevo', v.soloSinEvolucion)
  setChk('chk-base', v.soloBase)
  setChk('chk-copabebe', v.copaBebe)
  setChk('chk-nodup', v.noDuplicadosTipo)
  setChk('chk-gimmicks', v.sinGimmicks)
  setChk('chk-formas-reg', v.sinFormasRegionales)

  const bstMin = document.getElementById('bst-min')
  const bstMax = document.getElementById('bst-max')
  if (bstMin) bstMin.value = v.minBST ?? ''
  if (bstMax) bstMax.value = v.maxBST ?? ''
  const numREl = document.getElementById('num-rondas')
  if (numREl) numREl.value = String(v.numRondas ?? NUM_RONDAS_DEFAULT)
  setChk('chk-oculto', v.modoOculto)

  actualizarBSTPreview()
}

function bloquearConfig() {
  document.querySelectorAll(CONFIG_CTRLS).forEach(el => {
    el.disabled = true
    el.style.opacity = '0.5'
    el.style.cursor = 'not-allowed'
  })
  const btnVotar = document.getElementById('cfg-acciones')?.querySelector('.btn-votar')
  if (btnVotar) btnVotar.textContent = '🔒 Config. bloqueada'
}

export function desbloquearConfig() {
  document.querySelectorAll(CONFIG_CTRLS).forEach(el => {
    el.disabled = false
    el.removeAttribute('disabled')
    el.style.opacity = ''
    el.style.cursor = ''
  })
  const btnVotar = document.querySelector('.btn-votar')
  if (btnVotar) btnVotar.textContent = '🗳 Votar mi configuración'
  const btnListo = document.getElementById('btn-listo')
  if (btnListo) { btnListo.style.display = 'none'; btnListo.textContent = '¡Listo para el duelo!'; btnListo.disabled = false }
}

// ─── ACCIONES ─────────────────────────────────────────────────────────────────
export function asegurarNombreEntrenador() {
  let val = (document.getElementById('input-nombre')?.value || '').trim()
  if (!val) {
    const continuar = confirm('¿Seguro que quieres ingresar sin colocarte tu nombre? Te llamarás "Entrenador".\n\nPresiona Aceptar para continuar como Entrenador, o Cancelar para escribir tu nombre.')
    if (!continuar) {
      document.getElementById('input-nombre')?.focus()
      return null
    }
    val = 'Entrenador'
    const inp = document.getElementById('input-nombre')
    if (inp) inp.value = 'Entrenador'
  }
  return val
}

export async function crearSalaParty() {
  const nombre = asegurarNombreEntrenador()
  if (!nombre) return
  estado.miNombre = nombre
  guardarSesion()
  try {
    const r = await fetch('/api/sala/crear', { method: 'POST' })
    const d = await r.json()
    if (!d.salaId) throw new Error(d.error || 'No se pudo crear la sala')
    estado.salaId = d.salaId
    guardarSesion()
    actualizarDisplaySala()

    const resUnirse = await post('/lobby/unirse', { rol: 'jugador1', nombre, token: '' })
    estado.miRol = 'jugador1'
    estado.miToken = resUnirse.token
    guardarSesion()
    Sonido.seleccionar()
    mostrarPasoLobby()
    await copiarEnlace()
    mostrarToast(t('toast_room_created_copied', { id: d.salaId }), 'ok')
    if (resUnirse.estado && window.aplicarEstado) {
      await window.aplicarEstado(resUnirse.estado)
    } else if (window.forzarActualizar) {
      window.forzarActualizar()
    }
    import('./api.js').then(m => m.iniciarHeartbeat())
  } catch (e) {
    Sonido.error()
    mostrarToast('⚠️ ' + e.message, 'err')
  }
}

export async function unirsePorCodigo(codigoInput) {
  const codigo = (codigoInput || document.getElementById('input-codigo-sala')?.value || estado.salaId || '').trim().toUpperCase()
  if (!codigo) {
    Sonido.error()
    mostrarToast(t('toast_enter_code'), 'err')
    return
  }

  const nombre = asegurarNombreEntrenador()
  if (!nombre) return
  estado.miNombre = nombre
  guardarSesion()

  estado.salaId = codigo
  guardarSesion()
  actualizarDisplaySala()

  try {
    const r = await fetch(`/api/sala/${codigo}/estado`)
    if (!r.ok) {
      if (r.status === 410) throw new Error(t('toast_room_expired'))
      throw new Error(t('toast_room_not_found', { code: codigo }))
    }
    const est = await r.json()

    let rolElegido = 'espectador'
    if (!est.jugador1?.conectado) {
      rolElegido = 'jugador1'
    } else if (!est.jugador2?.conectado) {
      rolElegido = 'jugador2'
    } else {
      rolElegido = 'espectador'
    }

    if (rolElegido === 'espectador') {
      estado.miRol = 'espectador'
      estado.miToken = ''
      await fetch(`/api/sala/${codigo}/espectador/unirse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
      })
      window.addEventListener('beforeunload', () => navigator.sendBeacon(`/api/sala/${codigo}/espectador/salir`, JSON.stringify({ nombre })))
      guardarSesion()
      Sonido.click()
      mostrarPasoLobby()
      mostrarToast(t('toast_joined_spectator', { code: codigo }), 'info')
    } else {
      const d = await post('/lobby/unirse', { rol: rolElegido, nombre, token: '' })
      estado.miRol = rolElegido
      estado.miToken = d.token
      guardarSesion()
      Sonido.seleccionar()
      mostrarPasoLobby()
      const rolTxt = rolElegido === 'jugador1' ? (getLanguage() === 'en' ? 'Player 1' : 'Jugador 1') : (getLanguage() === 'en' ? 'Player 2' : 'Jugador 2')
      mostrarToast(t('toast_joined_player', { role: rolTxt, code: codigo }), 'ok')
      import('./api.js').then(m => m.iniciarHeartbeat())
    }

    if (window.forzarActualizar) window.forzarActualizar()
  } catch (e) {
    Sonido.error()
    mostrarToast('⚠️ ' + e.message, 'err')
  }
}

export async function unirseAlLobby() {
  const rol    = document.getElementById('rol-selector').value
  const nombre = document.getElementById('input-nombre')?.value.trim()
  if (rol==='espectador') {
    if (!estado.salaId) {
      Sonido.error()
      mostrarToast(t('toast_need_room_esp'), 'err')
      return
    }
    const nomEsp = document.getElementById('input-nombre-esp')?.value.trim() || (getLanguage() === 'en' ? 'Spectator' : 'Espectador')
    estado.miRol='espectador'; estado.miToken=''; estado.miNombre=nomEsp
    try {
      await fetch(`${API()}/espectador/unirse`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nombre:nomEsp})})
    } catch {}
    window.addEventListener('beforeunload',()=>navigator.sendBeacon(`${API()}/espectador/salir`,JSON.stringify({nombre:nomEsp})))
    Sonido.click(); mostrarPasoLobby(); return
  }
  if (!nombre) { Sonido.error(); mostrarToast(t('toast_enter_name'),'err'); return }
  estado.miNombre = nombre

  // Auto-crear sala si el usuario entra como Jugador 1 sin haber elegido o creado una sala
  if (!estado.salaId && rol === 'jugador1') {
    try {
      const r = await fetch('/api/sala/crear', { method: 'POST' })
      const d = await r.json()
      if (d.salaId) {
        estado.salaId = d.salaId
        guardarSesion()
        actualizarDisplaySala()
        await copiarEnlace()
        mostrarToast(t('toast_room_created_copied', { id: d.salaId }), 'ok')
      }
    } catch (e) {
      Sonido.error()
      mostrarToast(t('toast_auto_room_err'), 'err')
      return
    }
  } else if (!estado.salaId && rol === 'jugador2') {
    Sonido.error()
    mostrarToast(t('toast_need_link_j2'), 'err')
    return
  }

  try {
    const d = await post('/lobby/unirse',{rol,nombre,token:estado.miToken||''})
    estado.miRol=rol; estado.miToken=d.token; estado.salaId=d.salaId||estado.salaId
    guardarSesion(); Sonido.seleccionar(); mostrarPasoLobby()
    if (d.estado && window.aplicarEstado) {
      await window.aplicarEstado(d.estado)
    } else if (window.forzarActualizar) {
      window.forzarActualizar()
    }
  } catch(e) { Sonido.error(); mostrarToast('⚠️ '+e.message,'err') }
}

export async function votarConfig() {
  if (yaListo) { mostrarToast(t('status_ready'), 'err'); return }
  const voto = leerVoto()
  try {
    const res = await post('/lobby/votar', { voto })
    Sonido.votar(); yaVote = true
    document.querySelector('.btn-votar').textContent = t('btn_change_vote')
    document.getElementById('btn-listo').style.display = 'inline-block'
    mostrarToast(t('toast_vote_registered'), 'ok')
    if (res && res.lobby && window.aplicarEstado) {
      await window.aplicarEstado(res)
    } else if (window.forzarActualizar) {
      window.forzarActualizar()
    }
  } catch(e) { Sonido.error(); mostrarToast('⚠️ '+e.message,'err') }
}

export async function votarConfigDelOtro() {
  if (yaListo) { mostrarToast(t('status_ready'), 'err'); return }
  const otroRol = estado.miRol === 'jugador1' ? 'jugador2' : 'jugador1'
  try {
    const est = await fetchEstado()
    const votoOtro = est.lobby?.[otroRol]?.voto
    if (!votoOtro) {
      Sonido.error()
      mostrarToast(getLanguage() === 'en' ? '⚠️ The other player has not voted yet.' : '⚠️ El otro jugador aún no ha votado.', 'err')
      return
    }
    aplicarVotoEnUI(votoOtro)
    const voto = leerVoto()
    const res = await post('/lobby/votar', { voto })
    Sonido.votar(); yaVote = true
    document.querySelector('.btn-votar').textContent = t('btn_change_vote')
    document.getElementById('btn-listo').style.display = 'inline-block'
    mostrarToast(t('toast_vote_copied'), 'ok')
    if (res && res.lobby && window.aplicarEstado) {
      await window.aplicarEstado(res)
    } else if (window.forzarActualizar) {
      window.forzarActualizar()
    }
  } catch(e) { Sonido.error(); mostrarToast('⚠️ '+e.message,'err') }
}

export async function marcarListo() {
  if (!yaVote) {
    Sonido.error()
    mostrarToast(getLanguage() === 'en' ? 'Please choose your configuration first.' : 'Primero elige una configuración.', 'err')
    return
  }
  if (yaListo) return
  document.getElementById('msg-pool').style.display='flex'
  document.getElementById('btn-listo').disabled=true
  try {
    const ids = await construirPool(leerVoto())
    document.getElementById('msg-pool').style.display='none'
    const numRondasLocal = parseInt(document.getElementById('num-rondas')?.value || String(NUM_RONDAS_DEFAULT))
    if (ids.length < numRondasLocal * 2) {
      Sonido.error()
      mostrarToast(getLanguage() === 'en'
        ? `Only ${ids.length} Pokémon available. You need at least ${numRondasLocal * 2}. Adjust filters.`
        : `Solo ${ids.length} Pokémon disponibles. Necesitas al menos ${numRondasLocal * 2}. Ajusta los filtros.`, 'err')
      document.getElementById('btn-listo').disabled=false; return
    }
    const res = await post('/lobby/listo',{idsValidos:ids})
    Sonido.listo(); yaListo=true
    document.getElementById('btn-listo').textContent = t('btn_waiting_rival')
    // Bloquear controles de config
    bloquearConfig()
    mostrarToast(t('toast_ready_wait'), 'ok')
    if (res && res.fase && window.aplicarEstado) {
      await window.aplicarEstado(res)
    } else if (window.forzarActualizar) {
      window.forzarActualizar()
    }
  } catch(e) {
    document.getElementById('msg-pool').style.display='none'
    Sonido.error(); mostrarToast('⚠️ '+e.message,'err')
    document.getElementById('btn-listo').disabled=false
  }
}

export function restablecerFiltrosPorDefecto() {
  // 1. Regiones: solo 'todas'
  document.querySelectorAll('.rbtn').forEach(b => {
    b.classList.toggle('active', b.dataset.r === 'todas')
  })

  // 2. Tipos: vaciar selección
  tiposSel.clear()
  document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'))
  document.getElementById('tipo-grid')?.classList.remove('has-selected')
  const mRow = document.getElementById('modo-tipos-row')
  if (mRow) mRow.style.display = 'none'

  // 3. Colores: vaciar selección
  coloresSel.clear()
  document.querySelectorAll('.cbtn').forEach(b => b.classList.remove('active'))

  // 4. Checkboxes a estado por defecto
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val }
  setChk('chk-sin-leg', false)
  setChk('chk-finales', false)
  setChk('chk-sinevo', false)
  setChk('chk-base', false)
  setChk('chk-copabebe', false)
  setChk('chk-nodup', false)
  setChk('chk-gimmicks', false)
  setChk('chk-formas-reg', false)
  setChk('chk-oculto', true) // ¡Modo Oculto activo por defecto!

  // 5. BST: limpio y sliders en extremos
  const bstMin = document.getElementById('bst-min')
  const bstMax = document.getElementById('bst-max')
  if (bstMin) bstMin.value = ''
  if (bstMax) bstMax.value = ''
  const slMin = document.getElementById('slider-bst-min')
  const slMax = document.getElementById('slider-bst-max')
  if (slMin) slMin.value = '180'
  if (slMax) slMax.value = '780'

  // 6. Rondas a 6
  const numREl = document.getElementById('num-rondas')
  if (numREl) numREl.value = '6'

  // 7. Presets desactivados
  document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('preset-active'))

  // 8. Ocultar advertencias
  const wEvo = document.getElementById('warn-evolucion')
  if (wEvo) wEvo.style.display = 'none'

  // 9. Actualizar vista previa visual de BST
  actualizarBSTPreview()
}

export async function limpiarSala() {
  if (cooldownLimpiar) return
  if (!confirm(t('confirm_reset_all'))) return
  try {
    const res = await post('/lobby/limpiar',{})
    Sonido.limpiar(); cooldownLimpiar=true
    restablecerFiltrosPorDefecto()
    resetLobbyEstado()
    if (res && res.lobby && window.aplicarEstado) {
      await window.aplicarEstado(res)
    } else if (window.forzarActualizar) {
      window.forzarActualizar()
    }
    const btn = document.querySelector('.btn-limpiar')
    if (btn) { btn.disabled=true }
    let seg=12
    const iv=setInterval(()=>{
      seg--
      const msg=document.getElementById('cooldown-msg')
      const isEn = getLanguage() === 'en'
      if (seg<=0) {
        clearInterval(iv); cooldownLimpiar=false
        if (btn) {
          btn.disabled = false
          const txt = btn.querySelector('.btn-txt')
          if (txt) txt.textContent = t('reset_filters')
          else btn.textContent = t('reset_filters')
        }
        if (msg) msg.style.display='none'
      } else {
        if (msg) {
          msg.style.display='block'
          msg.textContent = isEn ? `You can reset in ${seg}s` : `Puedes restablecer en ${seg}s`
        }
        if (btn) {
          const txt = btn.querySelector('.btn-txt')
          const resetTxt = isEn ? `Reset (${seg}s)` : `Restablecer (${seg}s)`
          if (txt) txt.textContent = resetTxt
          else btn.textContent = resetTxt
        }
      }
    },1000)
    mostrarToast(t('toast_reset_filters'), 'ok')
  } catch(e) { Sonido.error(); mostrarToast('⚠️ ' + (e.message || e), 'err') }
}

export async function copiarCodigoSala() {
  const codigo = estado.salaId || ''
  if (!codigo) {
    Sonido.error()
    mostrarToast(t('toast_no_active_room'), 'err')
    return
  }
  try {
    await navigator.clipboard.writeText(codigo)
    Sonido.copiar()
    mostrarToast(t('toast_copied_code', { code: codigo }), 'ok', 3000)
  } catch {
    mostrarToast(t('toast_code_fallback', { code: codigo }), 'info', 6000)
  }
}

export async function copiarEnlace() {
  // Leer salaId ACTUAL del estado (no del localStorage anterior)
  const enlace = `${location.origin}${location.pathname}?sala=${estado.salaId}`
  try {
    await navigator.clipboard.writeText(enlace)
    Sonido.copiar()
    mostrarToast(t('toast_copied_link', { url: enlace }), 'ok', 4000)
  } catch {
    mostrarToast(t('toast_link_fallback', { url: enlace }), 'info', 7000)
  }
}

export async function crearNuevaSala() {
  try {
    const r   = await fetch('/api/sala/crear',{method:'POST'})
    const d   = await r.json()
    if (!r.ok) { mostrarToast('⚠️ '+d.error,'err'); return }
    estado.salaId = d.salaId
    guardarSesion()
    // Resetear estado local del lobby
    yaVote=false; yaListo=false
    actualizarDisplaySala()
    Sonido.seleccionar()
    // Copiar nuevo enlace al portapapeles inmediatamente
    await copiarEnlace()
  } catch(e) { Sonido.error(); mostrarToast('⚠️ Error creando sala','err') }
}

export function actualizarDisplaySala() {
  const el=document.getElementById('sala-id-display')
  if (el) el.textContent=estado.salaId||'—'
  const elLobby = document.getElementById('sala-id-lobby')
  if (elLobby) elLobby.textContent = estado.salaId || '—'
}

// ─── POOL DE POKÉMON ─────────────────────────────────────────────────────────
export async function construirPool(v) {
  await precargaBatch()
  const idSet = new Set()
  for (const reg of v.regiones) {
    const [mn, mx] = RANGOS[reg] || [1, 1025]
    for (let i = mn; i <= mx; i++) idSet.add(i)
    ;(FORMAS_REGIONALES[reg] || []).forEach(id => idSet.add(id))
  }
  let ids = [...idSet].sort((a, b) => a - b)
  if (v.sinLegendarios) ids = ids.filter(id => !LEGENDARIOS.has(id))

  if (v.soloFinales)      ids = ids.filter(id => evoCache.get(id)?.esFinal === true)
  if (v.soloSinEvolucion) ids = ids.filter(id => evoCache.get(id)?.sinEvo === true)
  if (v.soloBase)         ids = ids.filter(id => evoCache.get(id)?.esBase === true)
  // Copa Bebé: primera etapa + cadena de 2+ evoluciones + no legendario
  if (v.copaBebe)         ids = ids.filter(id => evoCache.get(id)?.esBase === true && evoCache.get(id)?.copaBebe === true && !LEGENDARIOS.has(id))
  if (v.tipos.length) {
    const te = v.tipos.map(t => TIPO_EN[t]).filter(Boolean)
    ids = v.modoTipos === 'AND'
      ? ids.filter(id => te.every(t => typeCache.get(id)?.includes(t)))
      : ids.filter(id => te.some(t => typeCache.get(id)?.includes(t)))
  }
  if (v.colores.length) {
    ids = ids.filter(id => v.colores.includes(colorCache.get(id) || 'gris'))
  }
  if (v.sinFormasRegionales) {
    ids = ids.filter(id => !FORMAS_REGIONALES_ESPECIALES.has(id))
  }
  if (v.sinGimmicks) {
    ids = ids.filter(id => !GIMMICKS.has(id))
  }
  if (v.minBST) ids = ids.filter(id => (bstCache.get(id) || 0) >= v.minBST)
  if (v.maxBST) ids = ids.filter(id => (bstCache.get(id) || 9999) <= v.maxBST)

  return ids
}

export function mostrarPasoLobby() {
  document.getElementById('paso-nombre').style.display='none'
  document.getElementById('paso-lobby').style.display='block'
  const esJugador=estado.miRol==='jugador1'||estado.miRol==='jugador2'
  const esEspectador=estado.miRol==='espectador' || !estado.miRol
  const panelLimpiar = document.getElementById('panel-limpiar')
  if (panelLimpiar) panelLimpiar.style.display = 'flex'
  const btnVotarJ2 = document.getElementById('btn-votar-j2')
  if (btnVotarJ2) btnVotarJ2.style.display = esJugador ? 'inline-block' : 'none'
  const btnLimpiar = document.querySelector('.btn-limpiar')
  const btnKeepalive = document.querySelector('.btn-keepalive')
  const chkPrivada = document.getElementById('chk-privada')
  if (btnLimpiar) btnLimpiar.style.display = esJugador ? 'flex' : 'none'
  if (btnKeepalive) btnKeepalive.style.display = esJugador ? 'flex' : 'none'
  if (chkPrivada) chkPrivada.closest('label')?.style.setProperty('display', esJugador ? 'inline-flex' : 'none')
  const acciones = document.getElementById('cfg-acciones')
  if (acciones) acciones.style.display = esJugador ? 'block' : 'none'
  const cp=document.getElementById('config-panel-wrap')
  if (cp) {
    cp.style.opacity = esJugador ? '' : '0.55'
    cp.style.pointerEvents = esJugador ? '' : 'none'
  }
  const btnLiberar = document.getElementById('btn-liberar')
  if (btnLiberar) btnLiberar.style.display = esJugador ? 'flex' : 'none'
  const btnTomarJ1 = document.getElementById('btn-tomar-j1')
  const btnTomarJ2 = document.getElementById('btn-tomar-j2')
  if (btnTomarJ1 && btnTomarJ2) {
    btnTomarJ1.style.display = esEspectador ? 'flex' : 'none'
    btnTomarJ2.style.display = esEspectador ? 'flex' : 'none'
  }
}

let ultimoEstadoBloqueado = null

export function actualizarLobbyUI(est) {
  const lj1=est.lobby.jugador1, lj2=est.lobby.jugador2

  // Sincronizar estado local con el servidor (desbloquear tras reset/limpiar)
  if (estado.miRol === 'jugador1' || estado.miRol === 'jugador2') {
    const mi = est.lobby[estado.miRol]
    yaVote = !!mi.voto
    yaListo = !!mi.listo
    if (mi.bloqueado !== ultimoEstadoBloqueado) {
      ultimoEstadoBloqueado = mi.bloqueado
      if (mi.bloqueado) bloquearConfig()
      else desbloquearConfig()
    }
    if (yaVote && !mi.bloqueado) {
      const btnVotar = document.querySelector('.btn-votar')
      if (btnVotar) btnVotar.textContent = t('btn_change_vote')
      const btnListo = document.getElementById('btn-listo')
      if (btnListo) btnListo.style.display = 'inline-block'
    }
    if (yaListo && mi.bloqueado) {
      const btnListo = document.getElementById('btn-listo')
      if (btnListo) { btnListo.textContent = t('btn_waiting_rival'); btnListo.disabled = true }
    }
  }

  document.getElementById('nom-j1-lobby').textContent=lj1.nombre||t('waiting_player')
  document.getElementById('nom-j2-lobby').textContent=lj2.nombre||t('waiting_player')
  const ico=lj=>(lj.listo?t('status_ready'):lj.voto?t('status_voted'):lj.nombre?t('status_in_room'):t('status_empty'))
  document.getElementById('est-j1-lobby').textContent=ico(lj1)
  document.getElementById('est-j2-lobby').textContent=ico(lj2)

  // Mostrar/ocultar botones de intercambio (liberar slot / tomar slot)
  const btnLiberar = document.getElementById('btn-liberar')
  if (btnLiberar) {
    const esJugador = estado.miRol === 'jugador1' || estado.miRol === 'jugador2'
    btnLiberar.style.display = esJugador ? 'flex' : 'none'
  }
  const btnTomarJ1 = document.getElementById('btn-tomar-j1')
  const btnTomarJ2 = document.getElementById('btn-tomar-j2')
  if (btnTomarJ1 && btnTomarJ2) {
    const esEsp = estado.miRol === 'espectador' || !estado.miRol
    btnTomarJ1.style.display = (esEsp && !est.jugador1.conectado) ? 'flex' : 'none'
    btnTomarJ2.style.display = (esEsp && !est.jugador2.conectado) ? 'flex' : 'none'
  }
  const espN=est.lobby.espectadores||0
  const eb=document.getElementById('esp-badge')
  if (eb) { eb.style.display=espN>0?'block':'none'; document.getElementById('esp-count').textContent=espN }
  if (lj1.voto||lj2.voto) {
    document.getElementById('votos-display').style.display='block'
    document.getElementById('voto-j1-disp').innerHTML=`<span class="vn j1-color">🔴 ${lj1.nombre||'J1'}:</span> <span class="vt">${etiquetaVoto(lj1.voto)}</span>`
    document.getElementById('voto-j2-disp').innerHTML=`<span class="vn j2-color">🟢 ${lj2.nombre||'J2'}:</span> <span class="vt">${etiquetaVoto(lj2.voto)}</span>`
  }
  if (lj1.voto&&lj2.voto) {
    const b=document.getElementById('cfg-acordado')
    if (b) { b.style.display='block'; b.innerHTML=`<strong>${t('democratic_agreed')}:</strong> ${etiquetaVoto(resolverLocal(lj1.voto,lj2.voto))}` }
  }
}

function resolverLocal(v1,v2) {
  const regiones=[...new Set([...(v1.regiones||['todas']),...(v2.regiones||['todas'])])]
  const tipos=[...new Set([...(v1.tipos||[]),...(v2.tipos||[])])]
  const modoTipos=(v1.modoTipos==='AND'&&v2.modoTipos==='AND')?'AND':'OR'
  const sf=v1.soloFinales||v2.soloFinales
  return {
    regiones,tipos,modoTipos,
    sinLegendarios:v1.sinLegendarios||v2.sinLegendarios,
    soloFinales:sf,soloSinEvolucion:!sf&&(v1.soloSinEvolucion||v2.soloSinEvolucion),
    soloBase:!sf&&!(v1.soloSinEvolucion||v2.soloSinEvolucion)&&(v1.soloBase||v2.soloBase),
    copaBebe:!sf&&!(v1.soloSinEvolucion||v2.soloSinEvolucion)&&!(v1.soloBase||v2.soloBase)&&(v1.copaBebe||v2.copaBebe),
    noDuplicadosTipo:v1.noDuplicadosTipo||v2.noDuplicadosTipo,
    maxBST:v1.maxBST&&v2.maxBST?Math.min(v1.maxBST,v2.maxBST):v1.maxBST??v2.maxBST??null,
    minBST:v1.minBST&&v2.minBST?Math.max(v1.minBST,v2.minBST):v1.minBST??v2.minBST??null,
  }
}

// Resetear estado del lobby (llamado desde draft.js al reiniciar)
export function resetLobbyEstado() {
  yaVote = false
  yaListo = false
  cooldownLimpiar = false
  ultimoEstadoBloqueado = null
  desbloquearConfig()
  restablecerFiltrosPorDefecto()
  const cp = document.getElementById('config-panel-wrap')
  if (cp) { cp.style.opacity = ''; cp.style.pointerEvents = '' }
  document.getElementById('cfg-acciones').style.display = ''
  document.getElementById('votos-display').style.display = 'none'
  document.getElementById('cfg-acordado').style.display = 'none'
}

export function seleccionarAvatarEsp(avatar) {
  estado.miAvatarEsp = avatar
  localStorage.setItem('poke_avatar_esp', avatar)
  document.querySelectorAll('.btn-avatar-esp').forEach(b => {
    b.classList.toggle('avatar-active', b.dataset.avatar === avatar)
  })
  Sonido.click()
  mostrarToast(t('toast_avatar_selected', { avatar }), 'ok')
}

export function volverAlMenuPrincipal() {
  const isEn = getLanguage() === 'en'
  if (confirm(isEn ? 'Leave the room and return to the main menu?' : '¿Deseas salir de la sala y volver al menú principal?')) {
    localStorage.removeItem('poke_sesion')
    estado.salaId = ''
    estado.miRol = ''
    estado.miToken = ''
    location.href = location.pathname
  }
}

// Sincronizar dinámicamente al cambiar de idioma
window.addEventListener('idiomaCambiado', () => {
  construirTipos()
  actualizarBSTPreview()
  const hintReg = document.getElementById('hint-regiones')
  if (hintReg) {
    hintReg.textContent = regionesSel.has('todas')
      ? t('regions_all')
      : t('regions_selected', { list: [...regionesSel].join(', ') })
  }
})
