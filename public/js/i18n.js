// ══════════════════════════════════════════════════════════════════════════════
// DICCIONARIO INTERNACIONAL (i18n) — POKÉDRAFT ROYALE / POKÉLECCIÓN
// Soporta Inglés (EN - Por Defecto) y Español (ES) con persistencia en localStorage
// ══════════════════════════════════════════════════════════════════════════════

export const COLOR_NOMBRES = {
  en: {
    negro: 'Black', azul: 'Blue', marron: 'Brown', gris: 'Gray', verde: 'Green',
    rosa: 'Pink', morado: 'Purple', rojo: 'Red', blanco: 'White', amarillo: 'Yellow'
  },
  es: {
    negro: 'Negro', azul: 'Azul', marron: 'Marrón', gris: 'Gris', verde: 'Verde',
    rosa: 'Rosa', morado: 'Morado', rojo: 'Rojo', blanco: 'Blanco', amarillo: 'Amarillo'
  }
}

export const I18N = {
  en: {
    title: "PokéDraft Royale",
    subtitle: "Draft your team · Compatible with Pokémon Showdown",
    how_to_play: "How to Play?",
    super_assist: "Super Assist",
    super_assist_off: "OFF",
    super_assist_on: "ON",
    super_assist_title: "Tactical data cards with base stats",

    // Step 1: Onboarding
    trainer_title: "Pokémon Trainer",
    trainer_name_label: "Name",
    trainer_name_ph: "Your trainer nickname...",
    btn_create_room_title: "Create Room",
    btn_create_room_sub: "Host game & generate invite link",
    btn_join_room_title: "Join Room",
    btn_join_room_sub: "Enter with code or link",
    code_input_ph: "Room code (e.g. A1B2C3)",
    btn_enter_code: "Join",
    current_room: "Current room:",
    copy_link: "🔗 Copy link",
    active_rooms: "Active rooms",
    new_room: "+ New room",
    loading_rooms: "Loading rooms...",
    no_active_rooms: "No public rooms active. Create one to begin!",
    room_open_slot: "Open",
    fase_lobby: "In lobby",
    fase_draft: "Drafting",
    fase_fin: "Finished",

    // Step 2: Lobby
    room_lbl: "Room",
    copy_code: "📋 Copy code",
    copy_link_btn: "🔗 Link",
    copy_code_hint: "Copy 6-character room code",
    copy_link_hint: "Copy direct invite link",
    waiting_player: "Waiting...",
    status_ready: "✅ Ready",
    status_voted: "🗳 Voted",
    status_in_room: "🟡 In room",
    status_empty: "—",
    spectators_count: "{n} spectator(s)",
    your_avatar: "Your avatar:",
    democratic_title: "Democratic Voting",
    democratic_sub: "Both vote · consensus merges rules",
    democratic_agreed: "Agreed Configuration",
    room_settings: "Room settings",
    private_lbl: "Private",
    private_title: "Hide from public room list",
    reset_filters: "Reset filters",
    keep_alive: "Keep room alive",
    leave_slot: "Leave my slot",
    claim_p1: "Claim Player 1",
    claim_p2: "Claim Player 2",
    delete_room: "Delete room",

    // Chat
    chat_title: "💬 PokéChat",
    chat_live: "● LIVE",
    chat_ph: "Type a message...",
    chat_send: "Send",
    chat_buzz: "Buzz",
    chat_empty: "💬 Channel connected!<br>Send a message to coordinate rules with your rival.",
    chat_sys: "⚙️ System",

    // Config panel
    config_title: "Duel Configuration",
    presets_title: "Quick Presets",
    presets_hint: "1-click config · Click again to restore your custom settings",
    preset_casual_tit: "Casual",
    preset_casual_desc: "No legendaries, 6 rounds",
    preset_comp_tit: "Competitive",
    preset_comp_desc: "Final evos, 500+ BST, unique types",
    preset_baby_tit: "Little Cup",
    preset_baby_desc: "First stage, BST ≤ 360",

    regions_title: "Regions",
    regions_all: "Selection: all",
    regions_selected: "Selection: {list}",
    region_all_btn: "🌐 All",

    types_title: "Types",
    types_hint: "One or more (optional)",
    types_mode_lbl: "Mode:",
    types_mode_or: "At least one",
    types_mode_and: "All exact",

    colors_title: "Colors",
    colors_hint: "Choose one or more colors",

    evo_title: "Evolutionary Stage",
    evo_final: "Fully evolved only",
    evo_single: "Single stage only (no evos)",
    evo_base: "First stage only (any chain)",
    evo_baby: "🍼 Little Cup — first stage of multi-stage evolutions",
    evo_warn: "⚠️ Only one evolution stage option can be active at a time.",

    other_restr_title: "Other Restrictions",
    restr_no_leg: "No legendaries or mythicals",
    restr_no_gimmicks: "No gimmicks / ultra beasts / paradox",
    restr_no_reg: "No regional forms",
    restr_no_dup: "No duplicate types on team",
    restr_blind: "🙈 Blind Mode (Secret Draft)",

    bst_title: "📊 BST (Base Stat Total)",
    bst_min: "Minimum",
    bst_max: "Maximum",
    bst_lower_tag: "Lower Limit",
    bst_upper_tag: "Upper Limit",
    bst_no_min: "No minimum",
    bst_no_max: "No maximum",
    bst_any: "Any",
    bst_up_to: "Up to 780+",
    bst_pool_lbl: "Eligible Pool",
    bst_pokemon_count: "{n} Pokémon",

    rounds_title: "Rounds",
    rounds_hint: "Pokémon per team (1–6)",
    rounds_each: "Pokémon each:",

    // Lobby action buttons
    btn_vote_my: "🗳 Vote my config",
    btn_change_vote: "✏️ Change my vote",
    btn_vote_rival: "🤝 Copy rival's config",
    btn_ready: "⚔️ Ready for duel!",
    btn_waiting_rival: "⌛ Waiting for rival...",
    preparing_pool: "Preparing Pokémon pool...",

    // Draft screen
    round_pill: "Round {cur} / {tot}",
    connected: "🟢 Connected",
    disconnected: "🔴 Disconnected",
    reconnected: "🟢 Reconnected",
    your_turn: "Your turn, {name}!",
    rival_turn: "{name}'s turn...",
    waiting_draft: "Waiting...",
    duel_finished: "¡Duel Finished!",
    time_out_random: "⚡ Time expired — Random Pokémon assigned",
    rival_picking_secret: "{name} is picking their Pokémon in secret...",
    btn_reset: "↺ Reset",

    // Showdown box
    export_title: "Export to Showdown",
    rule_note: "⚠️ <strong>Rule:</strong> You may change moves, abilities, and items. The drafted Pokémon are mandatory.",
    your_team: "Your Team ({name})",
    btn_copy_team: "📋 Copy team",
    btn_open_showdown: "⚡ Open Showdown",
    btn_rematch: "⚔️ Rematch",
    btn_requesting_rematch: "⏳ Requesting rematch...",
    btn_waiting_rematch_rival: "⏳ Waiting for rival to accept...",
    rematch_accepted: "⚔️ Rematch accepted! Starting new duel...",
    rematch_sent: "⚔️ Rematch request sent. Waiting for rival to confirm...",

    // Modals & toasts
    tutorial_title: "🎁 How to Play?",
    tuto_p1_tit: "Create or join a room",
    tuto_p1_txt: "Share the link or code with your rival. Choose your role and nickname.",
    tuto_p2_tit: "Vote game rules",
    tuto_p2_txt: "Each player picks regions, types, and restrictions. Consensus merges both choices.",
    tuto_p3_tit: "Confirm when ready!",
    tuto_p3_txt: "Both players confirm. The system filters and pre-loads the Pokémon pool.",
    tuto_p4_tit: "Turn-based drafting (10s)",
    tuto_p4_txt: "Two Pokémon appear on each turn. Pick one before the timer runs out.",
    tuto_p5_tit: "Export to Pokémon Showdown",
    tuto_p5_txt: "Once completed, copy your team directly into Pokémon Showdown for battle!",
    tuto_btn_close: "Got it, let's play!",

    toast_copied_code: "📋 Room code copied: {code}",
    toast_copied_link: "🔗 Room link copied: {url}",
    toast_copied_team: "✅ Team copied to clipboard!",
    toast_vote_registered: "✅ Vote registered",
    toast_vote_copied: "✅ Rival config copied and voted",
    toast_buzz_sent: "🔔 Rival alerted!",
    toast_buzz_recv: "🔔 RIVAL ALERT!",
    toast_ready_wait: "✅ Ready! Waiting for rival to confirm.",
    toast_reset_filters: "🧹 Filters reset to default values",
    confirm_reset_all: "Reset all filters and restart with default values?",
    confirm_full_restart: "Completely restart the duel?"
  },

  es: {
    title: "Desafío de Pokélección",
    subtitle: "Elige tu equipo · Compatible con Pokémon Showdown",
    how_to_play: "¿Cómo jugar?",
    super_assist: "Súper Ayuda",
    super_assist_off: "OFF",
    super_assist_on: "ON",
    super_assist_title: "Fichas técnicas con estadísticas de Pokémon",

    // Paso 1: Onboarding
    trainer_title: "Entrenador Pokémon",
    trainer_name_label: "Nombre",
    trainer_name_ph: "Tu nombre de entrenador...",
    btn_create_room_title: "Crear Sala",
    btn_create_room_sub: "Ser anfitrión y generar enlace",
    btn_join_room_title: "Unirse a Sala",
    btn_join_room_sub: "Entrar con código o enlace",
    code_input_ph: "Código de sala (ej: A1B2C3)",
    btn_enter_code: "Entrar",
    current_room: "Sala actual:",
    copy_link: "🔗 Copiar enlace",
    active_rooms: "Salas activas",
    new_room: "+ Nueva sala",
    loading_rooms: "Cargando salas...",
    no_active_rooms: "No hay salas públicas activas. ¡Crea una para comenzar!",
    room_open_slot: "Libre",
    fase_lobby: "En lobby",
    fase_draft: "Jugando",
    fase_fin: "Finalizada",

    // Paso 2: Lobby
    room_lbl: "Sala",
    copy_code: "📋 Copiar código",
    copy_link_btn: "🔗 Enlace",
    copy_code_hint: "Copiar código de 6 caracteres",
    copy_link_hint: "Copiar enlace directo",
    waiting_player: "Esperando...",
    status_ready: "✅ Listo",
    status_voted: "🗳 Votó",
    status_in_room: "🟡 En sala",
    status_empty: "—",
    spectators_count: "{n} espectador(es)",
    your_avatar: "Tu avatar:",
    democratic_title: "Votación democrática",
    democratic_sub: "Ambos votan · gana el consenso",
    democratic_agreed: "Configuración acordada",
    room_settings: "Ajustes de sala",
    private_lbl: "Privada",
    private_title: "Ocultar de la lista pública",
    reset_filters: "Restablecer filtros",
    keep_alive: "Mantener sala viva",
    leave_slot: "Dejar mi slot",
    claim_p1: "Tomar Jugador 1",
    claim_p2: "Tomar Jugador 2",
    delete_room: "Eliminar sala",

    // Chat
    chat_title: "💬 PokéChat",
    chat_live: "● EN VIVO",
    chat_ph: "Escribe un mensaje...",
    chat_send: "Enviar",
    chat_buzz: "Avisar",
    chat_empty: "💬 ¡Canal conectado!<br>Envía un mensaje para coordinar las reglas con tu rival.",
    chat_sys: "⚙️ Sistema",

    // Panel de config
    config_title: "Configuración del duelo",
    presets_title: "Presets Rápidos",
    presets_hint: "Configura en 1 clic · Clic de nuevo para restaurar tu ajuste",
    preset_casual_tit: "Casual",
    preset_casual_desc: "Sin legendarios, 6 rondas",
    preset_comp_tit: "Competitivo",
    preset_comp_desc: "Finales, BST 500+, tipos únicos",
    preset_baby_tit: "Copa Bebé",
    preset_baby_desc: "Primera etapa, BST ≤ 360",

    regions_title: "Regiones",
    regions_all: "Selección: todas",
    regions_selected: "Selección: {list}",
    region_all_btn: "🌐 Todas",

    types_title: "Tipos",
    types_hint: "Uno o más (opcional)",
    types_mode_lbl: "Modo:",
    types_mode_or: "Al menos uno",
    types_mode_and: "Todos exactos",

    colors_title: "Colores",
    colors_hint: "Elige uno o más colores",

    evo_title: "Etapa evolutiva",
    evo_final: "Solo completamente evolucionados",
    evo_single: "Sin ninguna evolución posible",
    evo_base: "Solo primera etapa (cualquier cadena)",
    evo_baby: "🍼 Copa Bebé — primera etapa de cadenas evolutivas largas",
    evo_warn: "⚠️ Solo puede activarse una opción de etapa a la vez.",

    other_restr_title: "Otras restricciones",
    restr_no_leg: "Sin legendarios ni míticos",
    restr_no_gimmicks: "Sin gimmicks / ultraentes / paradojas",
    restr_no_reg: "Sin formas regionales",
    restr_no_dup: "Sin tipos repetidos en el equipo",
    restr_blind: "🙈 Modo Oculto (Draft a ciegas)",

    bst_title: "📊 BST (Estadísticas Base Totales)",
    bst_min: "Mínimo",
    bst_max: "Máximo",
    bst_lower_tag: "Límite Inferior",
    bst_upper_tag: "Límite Superior",
    bst_no_min: "Sin mínimo",
    bst_no_max: "Sin límite",
    bst_any: "Cualquiera",
    bst_up_to: "Hasta 780+",
    bst_pool_lbl: "Piscina elegible",
    bst_pokemon_count: "{n} Pokémon",

    rounds_title: "Rondas",
    rounds_hint: "Pokémon por equipo (1–6)",
    rounds_each: "Pokémon cada uno:",

    // Botones de acción del lobby
    btn_vote_my: "🗳 Votar mi config.",
    btn_change_vote: "✏️ Cambiar mi voto",
    btn_vote_rival: "🤝 Config. del rival",
    btn_ready: "⚔️ ¡Listo para el duelo!",
    btn_waiting_rival: "⌛ Esperando al otro jugador...",
    preparing_pool: "Preparando el grupo de Pokémon...",

    // Pantalla de draft
    round_pill: "Ronda {cur} / {tot}",
    connected: "🟢 Conectado",
    disconnected: "🔴 Desconectado",
    reconnected: "🟢 Reconectado",
    your_turn: "¡Tu turno, {name}!",
    rival_turn: "Turno de {name}...",
    waiting_draft: "Esperando...",
    duel_finished: "¡Duelo finalizado!",
    time_out_random: "⚡ Tiempo agotado — Pokémon asignado al azar",
    rival_picking_secret: "{name} está eligiendo su Pokémon en secreto...",
    btn_reset: "↺ Reiniciar",

    // Showdown box
    export_title: "Exportar a Showdown",
    rule_note: "⚠️ <strong>Regla:</strong> Puedes cambiar ataques, habilidades y objetos. Los Pokémon son obligatorios.",
    your_team: "Tu Equipo ({name})",
    btn_copy_team: "📋 Copiar equipo",
    btn_open_showdown: "⚡ Abrir Showdown",
    btn_rematch: "⚔️ Revancha",
    btn_requesting_rematch: "⏳ Solicitando revancha...",
    btn_waiting_rematch_rival: "⏳ Esperando que acepte tu rival...",
    rematch_accepted: "⚔️ ¡Revancha aceptada! Comenzando nuevo duelo...",
    rematch_sent: "⚔️ Solicitud de revancha enviada a tu rival. Esperando confirmación...",

    // Modales y toasts
    tutorial_title: "🎁 ¿Cómo jugar?",
    tuto_p1_tit: "Crea o únete a una sala",
    tuto_p1_txt: "Comparte el enlace con tu rival. Elige tu rol (Jugador 1 o 2) y escribe tu nombre.",
    tuto_p2_tit: "Vota la configuración",
    tuto_p2_txt: "Cada jugador elige región, tipos y restricciones. Se aplica el resultado combinado de ambos votos.",
    tuto_p3_tit: "¡Confirma cuando estés listo!",
    tuto_p3_txt: "Ambos jugadores deben confirmar. El sistema prepara el pool de Pokémon.",
    tuto_p4_tit: "Elige por turnos (10 segundos)",
    tuto_p4_txt: "Cada turno aparecen 2 Pokémon. Eliges uno, el otro va al rival. Hay 6 rondas.",
    tuto_p5_tit: "Exporta a Pokémon Showdown",
    tuto_p5_txt: "Al terminar, copia tu equipo y ábrelo directamente en Showdown para batalla.",
    tuto_btn_close: "¡Entendido, a jugar!",

    toast_copied_code: "📋 Código de sala copiado: {code}",
    toast_copied_link: "🔗 Enlace de sala copiado: {url}",
    toast_copied_team: "✅ ¡Equipo copiado al portapapeles!",
    toast_vote_registered: "✅ Voto registrado",
    toast_vote_copied: "✅ Configuración del rival copiada y votada",
    toast_buzz_sent: "🔔 Aviso enviado al rival",
    toast_buzz_recv: "🔔 ¡AVISO DEL RIVAL!",
    toast_ready_wait: "✅ ¡Listo! Esperando a que tu rival confirme.",
    toast_reset_filters: "🧹 Filtros restablecidos a valores por defecto",
    confirm_reset_all: "¿Restablecer todos los filtros y empezar de nuevo con los valores por defecto?",
    confirm_full_restart: "¿Reiniciar el duelo completo?"
  }
}

// Idioma activo inicial: 'en' (Inglés) por defecto a menos que el usuario haya seleccionado otro
let idiomaActual = localStorage.getItem('pokeleccion_lang') || 'en'

export function getLanguage() {
  return idiomaActual
}

export function t(key, vars = {}) {
  const dict = I18N[idiomaActual] || I18N.en
  let txt = dict[key] || I18N.en[key] || key
  for (const [k, v] of Object.entries(vars)) {
    txt = txt.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
  }
  return txt
}

export function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'es') lang = 'en'
  idiomaActual = lang
  try {
    localStorage.setItem('pokeleccion_lang', lang)
  } catch {}
  actualizarTextosDOM()
  window.dispatchEvent(new CustomEvent('idiomaCambiado', { detail: { lang } }))
}

export function actualizarTextosDOM() {
  const dict = I18N[idiomaActual] || I18N.en

  // 1. Atributo lang y título del documento
  if (document.documentElement) document.documentElement.lang = idiomaActual
  document.title = dict.title

  // 2. Elementos con data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    if (dict[key]) {
      if (dict[key].includes('<') && dict[key].includes('>')) {
        el.innerHTML = dict[key]
      } else {
        el.textContent = dict[key]
      }
    }
  })

  // 3. Atributos placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh
    if (dict[key]) el.placeholder = dict[key]
  })

  // 4. Atributos title / tooltip
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle
    if (dict[key]) el.title = dict[key]
  })

  // 5. Botones de cambio de idioma
  document.querySelectorAll('.btn-lang').forEach(btn => {
    const l = btn.dataset.lang
    btn.classList.toggle('active', l === idiomaActual)
  })

  // 6. Colores en la cuadrícula de colores
  document.querySelectorAll('.cbtn').forEach(btn => {
    const c = btn.dataset.c
    if (COLOR_NOMBRES[idiomaActual] && COLOR_NOMBRES[idiomaActual][c]) {
      btn.textContent = COLOR_NOMBRES[idiomaActual][c]
    }
  })

  // 7. Actualizar botón de Súper Ayuda si la función está disponible
  if (typeof window.actualizarBotonSuperAyudaUI === 'function') {
    window.actualizarBotonSuperAyudaUI()
  }

  // 8. Elementos dinámicos del lobby
  const btnVotar = document.querySelector('.btn-votar')
  if (btnVotar) {
    if (btnVotar.textContent.includes('✏️')) {
      btnVotar.textContent = dict.btn_change_vote
    } else {
      btnVotar.textContent = dict.btn_vote_my
    }
  }

  const btnListo = document.getElementById('btn-listo')
  if (btnListo) {
    if (btnListo.disabled) {
      btnListo.textContent = dict.btn_waiting_rival
    } else {
      btnListo.textContent = dict.btn_ready
    }
  }

  // 9. Actualizar BST previews estáticos si no hay número
  const bstMin = document.getElementById('bst-min')
  const bstMax = document.getElementById('bst-max')
  if ((!bstMin || !bstMin.value) && document.getElementById('bst-nom-min')) {
    document.getElementById('bst-nom-min').textContent = dict.bst_no_min
    document.getElementById('bst-val-min').textContent = dict.bst_any
  }
  if ((!bstMax || !bstMax.value) && document.getElementById('bst-nom-max')) {
    document.getElementById('bst-nom-max').textContent = dict.bst_no_max
    document.getElementById('bst-val-max').textContent = dict.bst_up_to
  }

  // 10. Actualizar hint de regiones si es "todas"
  const hintReg = document.getElementById('hint-regiones')
  if (hintReg && (hintReg.textContent.includes('todas') || hintReg.textContent.includes('all'))) {
    hintReg.textContent = dict.regions_all
  }
}

// Exponer global para inline onclick handlers
window.cambiarIdioma = (lang) => {
  setLanguage(lang)
}
