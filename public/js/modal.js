import { Sonido } from './sonido.js'
import { getLanguage } from './i18n.js'

const INFO = {
  en: {
    region: {
      titulo: 'Region Filter',
      cuerpo: `<p>Filter available Pokémon by their National Pokédex origin. You can select multiple regions at once.</p>
        <ul><li><b>Kanto</b> #1–151 · <b>Johto</b> #152–251 · <b>Hoenn</b> #252–386</li>
        <li><b>Sinnoh</b> #387–493 · <b>Unova</b> #494–649 · <b>Kalos</b> #650–721</li>
        <li><b>Alola</b> #722–809 (includes regional forms) · <b>Galar</b> #810–905</li>
        <li><b>Paldea</b> #906–1025 · <b>Hisui</b> Hisuian forms</li></ul>
        <p>If players vote different regions, selections are combined.</p>`
    },
    evolucion: {
      titulo: 'Evolutionary Stage',
      cuerpo: `<ul>
        <li><b>Fully evolved only</b> — <em>Fully Evolved</em> in Smogon. Cannot evolve any further.</li>
        <li><b>Single stage only</b> — Pokémon with no evolutionary chain (Tauros, Lapras, Heracross).</li>
        <li><b>First stage only</b> — <em>NFE</em> in Smogon. Includes Pokémon that can still evolve.</li>
        <li><b>🍼 Little Cup</b> — first stage of chains with <em>two or more</em> evolutionary stages (Bulbasaur yes, Pikachu yes, Tauros no). Great for strategy without Legendaries or Ultra Beasts.</li></ul>
        <p>⚠️ Only one evolution stage filter can be active at a time.</p>`
    },
    bst: {
      titulo: 'BST — Base Stat Total',
      cuerpo: `<p>Sum of the 6 base stats (HP, Atk, Def, SpAtk, SpDef, Spe).</p>
        <table style="width:100%;border-collapse:collapse;font-size:.92em">
          <tr style="background:#e8f5ee"><th style="padding:4px 8px;text-align:left">Pokémon</th><th style="padding:4px 8px;text-align:right">BST</th></tr>
          <tr><td style="padding:4px 8px">Caterpie</td><td style="text-align:right;padding:4px 8px">195</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:4px 8px">Pikachu</td><td style="text-align:right;padding:4px 8px">320</td></tr>
          <tr><td style="padding:4px 8px">Charizard</td><td style="text-align:right;padding:4px 8px">534</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:4px 8px">Mewtwo</td><td style="text-align:right;padding:4px 8px">680</td></tr>
        </table>
        <p>Range 400–550 is popular for balanced drafts.</p>`
    },
    nodup: {
      titulo: 'No Duplicate Types',
      cuerpo: `<p>The system prevents offering Pokémon whose types are already in your drafted team. Promotes broad type coverage.</p>
        <p>If the eligible pool is very small, this restriction is relaxed to avoid deadlocks.</p>`
    },
    copabebe: {
      titulo: '🍼 Little Cup',
      cuerpo: `<p>Only allows Pokémon that:</p>
        <ul><li>Are the <b>first stage</b> of an evolutionary chain</li>
        <li>The chain has <b>at least 2 evolutions</b> (e.g., Bulbasaur → Ivysaur → Venusaur)</li>
        <li>Are <b>not Legendary</b>, Ultra Beasts, or Paradox</li></ul>
        <p>Example: Bulbasaur ✅, Pikachu ✅, Tauros ❌ (no evolutions), Moltres ❌ (Legendary).</p>
        <p>Perfect for low-level strategic matches.</p>`
    },
    modoOculto: {
      titulo: '🙈 Blind Mode (Secret Draft)',
      cuerpo: `<p>Adds mystery and tactical tension to your draft:</p>
        <ul>
          <li>Picks each player makes for their own team remain <b>secret</b> during drafting (shown as <code>???</code> with the Substitute doll).</li>
          <li>You only see the Pokémon that <b>you pass</b> to your rival on your turns.</li>
          <li>Both full teams are automatically revealed once the draft completes for battle!</li>
        </ul>`
    }
  },
  es: {
    region: {
      titulo: 'Filtro de región',
      cuerpo: `<p>Filtra los Pokémon disponibles por su Pokédex Nacional. Puedes elegir varias regiones a la vez.</p>
        <ul><li><b>Kanto</b> #1–151 · <b>Johto</b> #152–251 · <b>Hoenn</b> #252–386</li>
        <li><b>Sinnoh</b> #387–493 · <b>Unova</b> #494–649 · <b>Kalos</b> #650–721</li>
        <li><b>Alola</b> #722–809 (incluye formas regionales) · <b>Galar</b> #810–905</li>
        <li><b>Paldea</b> #906–1025 · <b>Hisui</b> formas de Hisui</li></ul>
        <p>Si ambos votan regiones distintas, se combinan.</p>`
    },
    evolucion: {
      titulo: 'Etapa evolutiva',
      cuerpo: `<ul>
        <li><b>Solo completamente evolucionados</b> — <em>Fully Evolved</em> en Smogon. No pueden evolucionar más.</li>
        <li><b>Sin ninguna evolución posible</b> — cadena de un solo Pokémon (Tauros, Lapras, Heracross).</li>
        <li><b>Solo primera etapa</b> — <em>NFE</em> en Smogon. Incluyen Pokémon que aún pueden evolucionar.</li>
        <li><b>🍼 Copa Bebé</b> — primera etapa de cadenas con <em>dos o más</em> evoluciones (Bulbasaur sí, Pikachu sí, Tauros no). Ideal para estrategia sin Legendarios ni Ultra Bestias.</li></ul>
        <p>⚠️ Estas opciones son mutuamente excluyentes.</p>`
    },
    bst: {
      titulo: 'BST — Base Stat Total',
      cuerpo: `<p>Suma de las 6 estadísticas base (PS, Atk, Def, SpAtk, SpDef, Vel).</p>
        <table style="width:100%;border-collapse:collapse;font-size:.92em">
          <tr style="background:#e8f5ee"><th style="padding:4px 8px;text-align:left">Pokémon</th><th style="padding:4px 8px;text-align:right">BST</th></tr>
          <tr><td style="padding:4px 8px">Caterpie</td><td style="text-align:right;padding:4px 8px">195</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:4px 8px">Pikachu</td><td style="text-align:right;padding:4px 8px">320</td></tr>
          <tr><td style="padding:4px 8px">Charizard</td><td style="text-align:right;padding:4px 8px">534</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:4px 8px">Mewtwo</td><td style="text-align:right;padding:4px 8px">680</td></tr>
        </table>
        <p>Rango 400–550 es popular para drafts equilibrados.</p>`
    },
    nodup: {
      titulo: 'Sin tipos duplicados',
      cuerpo: `<p>El sistema intenta no ofrecer Pokémon de tipos que ya tienes en tu equipo. Promueve cobertura amplia.</p>
        <p>Si el pool es muy pequeño, se ignora esta restricción para evitar bloqueos.</p>`
    },
    copabebe: {
      titulo: '🍼 Copa Bebé',
      cuerpo: `<p>Solo aparecen Pokémon que:</p>
        <ul><li>Son la <b>primera etapa</b> de una cadena evolutiva</li>
        <li>La cadena tiene <b>al menos 2 evoluciones</b> (ej: Bulbasaur → Ivysaur → Venusaur)</li>
        <li><b>No son Legendarios</b> ni Ultra Bestias ni Paradojas</li></ul>
        <p>Ejemplo: Bulbasaur ✅, Pikachu ✅ (por Raichu), Tauros ❌ (sin evolución), Moltres ❌ (legendario).</p>
        <p>Perfecto para partidas con Pokémon de bajo nivel y mucho potencial estratégico.</p>`
    },
    modoOculto: {
      titulo: '🙈 Modo Oculto (Draft a Ciegas)',
      cuerpo: `<p>Añade misterio y tensión táctica a la partida:</p>
        <ul>
          <li>Las elecciones que tu rival toma para su propio equipo se mantienen <b>secretas</b> durante el draft (se muestran como <code>???</code> con el muñeco de Sustituto).</li>
          <li>Tú solo puedes ver los Pokémon que <b>tú le envías</b> en tus turnos de elección.</li>
          <li>Los equipos completos se revelan automáticamente al finalizar el draft para el combate.</li>
        </ul>`
    }
  }
}

export function mostrarInfo(clave) {
  const lang = getLanguage()
  const d = (INFO[lang] && INFO[lang][clave]) || INFO.es[clave]
  if (!d) return
  document.getElementById('info-titulo').textContent = d.titulo
  document.getElementById('info-cuerpo').innerHTML  = d.cuerpo
  document.getElementById('modal-info').style.display = 'flex'
  Sonido.click()
}

export function cerrarInfo(e) {
  if (!e || e.target===document.getElementById('modal-info'))
    document.getElementById('modal-info').style.display = 'none'
}

export function mostrarToast(msg, tipo='ok', dur=3000) {
  const el = document.getElementById('toast')
  el.textContent = msg; el.className = `toast toast-${tipo}`; el.style.display='block'; el.style.opacity='1'
  clearTimeout(el._t)
  el._t = setTimeout(()=>{
    el.style.opacity='0'
    setTimeout(()=>el.style.display='none',400)
  }, dur)
}

export function mostrarTutorial() {
  document.getElementById('modal-tutorial').style.display='flex'
}
export function cerrarTutorial() {
  document.getElementById('modal-tutorial').style.display='none'
  localStorage.setItem('tutorial-visto','1')
}
