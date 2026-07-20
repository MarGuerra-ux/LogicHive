// ================================================
// PANEL_APUNTES.JS — v3
// Grid 2 col, tarjetas grandes, modal editor completo
// ================================================

let notesData    = [];
let selectedNote = null;


const NOTE_COLORS = [
  { color: "#111b31", label: "Azul noche" },
  { color: "#0d2218", label: "Verde noche" },
  { color: "#2a1a1a", label: "Rojo noche" },
  { color: "#1a1030", label: "Violeta noche" },
  { color: "#ffffff", label: "Blanco" },
  { color: "#f8f9e8", label: "Papel" },
  { color: "#1a1a2a", label: "Pizarrón" },
  { color: "#0a1a0a", label: "Pizarrón verde" },
];

// ================================================
// INIT
// ================================================

async function initApuntes() {
  await loadNotes();
  renderNotes();
}

async function loadNotes() {
  const groupId = getState().selected.groupId;
  if (!groupId) { notesData = []; return; }

  const { data, error } = await supabaseClient
    .from("notes")
    .select("id, title, content, color, pinned, created_at")
    .eq("group_id", groupId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) { console.error(error.message); return; }
  notesData = data || [];
}

// ================================================
// RENDER GRID — 2 columnas, tarjetas grandes
// ================================================

function renderNotes() {
  const wrap = document.getElementById("notesGrid");
  if (!wrap) return;

  if (!notesData.length) {
    wrap.innerHTML = `
      <div class="notes-empty">
        <p style="font-size:32px;margin:0 0 10px">📝</p>
        <p style="font-size:15px;margin:0 0 6px">No hay apuntes aún</p>
        <p class="muted-text" style="font-size:13px">Hacé click en "+ Nuevo apunte" para empezar</p>
      </div>`;
    return;
  }

  wrap.innerHTML = notesData.map(note => {
    const bg       = note.color || "#111b31";
    const isDark   = isDarkColor(bg);
    const textCol  = isDark ? "#e8edf8" : "#1a202c";
    const mutedCol = isDark ? "rgba(200,210,240,.5)" : "rgba(0,0,0,.4)";
    const bgStyle  = getNoteBackgroundStyle(note.bg_pattern || "solid", bg);
    const isSelected = selectedNote?.id === note.id;

    return `
      <article
        class="note-card-v3 ${isSelected ? "note-selected" : ""}"
        style="${bgStyle};color:${textCol}"
        onclick="selectNote('${note.id}')"
        ondblclick="openNoteModal('${note.id}')"
        title="Click para seleccionar · Doble click para editar">

        <!-- Header -->
        <div class="note-v3-header">
          <h4 style="color:${textCol};margin:0;font-size:15px;font-weight:600;
                     overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">
            ${note.title}
          </h4>
          ${note.pinned ? `<span title="Fijado" style="flex-shrink:0">📌</span>` : ""}
        </div>

        <!-- Contenido -->
        <div class="note-v3-content" style="color:${mutedCol}">
          ${note.content
            ? note.content.replace(/</g,"&lt;").slice(0,200) + (note.content.length > 200 ? "…" : "")
            : "<em>Sin contenido</em>"}
        </div>

        <!-- Footer -->
        <div class="note-v3-footer" style="color:${mutedCol}">
          <span>${formatFechaCorta(note.created_at)}</span>
          <span class="note-v3-hint">doble click para editar</span>
        </div>

      </article>`;
  }).join("");
}

function selectNote(id) {
  const note = notesData.find(n => n.id === id);
  if (selectedNote?.id === id) {
    selectedNote = null;
  } else {
    selectedNote = note;
  }
  renderNotes();
}

function formatFechaCorta(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CL", { day:"numeric", month:"short" });
}


// ================================================
// FONDOS — contraste mejorado
// ================================================

function getNoteBackgroundStyle(pattern, baseColor) {
  const isDark    = isDarkColor(baseColor);
  const lineAlpha = isDark ? ".25" : ".18";
  const dotAlpha  = isDark ? ".35" : ".22";

  switch(pattern) {
    case "grid":
      return `background:${baseColor};
        background-image:
          linear-gradient(rgba(128,128,128,${lineAlpha}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(128,128,128,${lineAlpha}) 1px, transparent 1px);
        background-size: 24px 24px`;
    case "lines":
      return `background:${baseColor};
        background-image: linear-gradient(rgba(128,128,128,${lineAlpha}) 1px, transparent 1px);
        background-size: 100% 28px;
        background-position: 0 20px`;
    case "dots":
      return `background:${baseColor};
        background-image: radial-gradient(circle, rgba(128,128,128,${dotAlpha}) 1.5px, transparent 1.5px);
        background-size: 18px 18px`;
    default:
      return `background:${baseColor}`;
  }
}

function isDarkColor(hex) {
  if (!hex || hex.length < 4) return true;
  const r = parseInt(hex.slice(1,3)||"11",16);
  const g = parseInt(hex.slice(3,5)||"1b",16);
  const b = parseInt(hex.slice(5,7)||"31",16);
  return (r*0.299 + g*0.587 + b*0.114) < 140;
}

// ================================================
// MODAL EDITOR — grande con toolbar
// ================================================

function newNote()          { openNoteModal(null); }
function openNoteModal(id)  { showNoteModal(id ? notesData.find(n => n.id === id) : null); }

function showNoteModal(note) {
  const overlay = document.getElementById("noteModalOverlay");
  const box     = document.getElementById("noteModalBox");
  if (!overlay || !box) return;

  initResizableModal("noteModalBox");

  const currentColor   = note?.color      || "#111b31";
  const currentPattern = note?.bg_pattern || "solid";
  const isDark         = isDarkColor(currentColor);
  const editorBg       = getNoteBackgroundStyle(currentPattern, currentColor);
  const editorText     = isDark ? "#e8edf8" : "#1a202c";

  box.innerHTML = `

    <!-- ===== HEADER DEL MODAL ===== -->
    <div class="note-modal-header">
      <input id="n_title"
             type="text"
             placeholder="Título del apunte..."
             value="${(note?.title || "").replace(/"/g, "&quot;")}"
             spellcheck="true" lang="es"
             class="note-modal-title-input">
      <div style="display:flex;gap:8px;align-items:center">
        ${note ? `<button class="btn danger"    onclick="deleteNote('${note.id}')">Eliminar</button>` : ""}
        <button class="btn primary"   onclick="${note ? `saveEditNote('${note.id}')` : "saveNewNote()"}">
          Guardar
        </button>
        <button class="btn secondary" onclick="closeNoteModal()">✕</button>
      </div>
    </div>

    <!-- ===== LAYOUT 2 COLUMNAS ===== -->
    <div class="note-modal-body">

      <!-- COL IZQUIERDA: Editor -->
      <div class="note-editor-col">

        <!-- Toolbar de formato -->
        <div class="note-toolbar" id="noteToolbar">
          <!-- Fuente -->
          <select class="toolbar-select" id="tb_font" onchange="execCmd('fontName', this.value)"
                  title="Fuente">
            <option value="inherit">Fuente</option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="'Courier New'">Código</option>
            <option value="Verdana">Verdana</option>
          </select>

          <!-- Tamaño -->
          <select class="toolbar-select" id="tb_size" onchange="execFontSize(this.value)"
                  title="Tamaño">
            <option value="">Tamaño</option>
            <option value="1">Pequeño</option>
            <option value="3">Normal</option>
            <option value="5">Grande</option>
            <option value="7">Muy grande</option>
          </select>

          <div class="toolbar-sep"></div>

          <!-- Formato básico -->
          <button class="tb-btn" onclick="execCmd('bold')"         title="Negrita (Ctrl+B)"><b>B</b></button>
          <button class="tb-btn" onclick="execCmd('italic')"       title="Cursiva (Ctrl+I)"><i>I</i></button>
          <button class="tb-btn" onclick="execCmd('underline')"    title="Subrayado (Ctrl+U)"><u>U</u></button>
          <button class="tb-btn" onclick="execCmd('strikeThrough')" title="Tachado"><s>S</s></button>

          <div class="toolbar-sep"></div>

          <!-- Color de texto -->
          <div class="tb-color-wrap" title="Color de texto">
            <span class="tb-color-icon">A</span>
            <input type="color" value="#38bdf8"
                   onchange="execCmd('foreColor', this.value)"
                   class="tb-color-input">
          </div>

          <!-- Marcador / resaltado -->
          <div class="tb-color-wrap" title="Marcador de color">
            <span class="tb-color-icon" style="background:#fde68a;color:#111;padding:0 3px;border-radius:3px">▐</span>
            <input type="color" value="#fde68a"
                   onchange="execCmd('hiliteColor', this.value)"
                   class="tb-color-input">
          </div>

          <div class="toolbar-sep"></div>

          <!-- Alineación -->
          <button class="tb-btn" onclick="execCmd('justifyLeft')"   title="Izquierda">⬤◻◻</button>
          <button class="tb-btn" onclick="execCmd('justifyCenter')" title="Centro">◻⬤◻</button>
          <button class="tb-btn" onclick="execCmd('justifyRight')"  title="Derecha">◻◻⬤</button>

          <div class="toolbar-sep"></div>

          <!-- Listas -->
          <button class="tb-btn" onclick="execCmd('insertUnorderedList')" title="Lista con viñetas">• —</button>
          <button class="tb-btn" onclick="execCmd('insertOrderedList')"   title="Lista numerada">1.</button>

          <div class="toolbar-sep"></div>

          <!-- Fijar -->
          <label class="tb-pin-label" title="Fijar apunte">
            <input type="checkbox" id="n_pinned" ${note?.pinned ? "checked" : ""}
                   style="accent-color:var(--color-accent)">
            📌
          </label>
        </div>

        <!-- Área de edición -->
        <div id="n_editor"
             contenteditable="true"
             spellcheck="true"
             lang="es"
             class="note-editor-area"
             style="${editorBg};color:${editorText}"
             >${note?.content || ""}</div>

      </div>

      <!-- COL DERECHA: Opciones -->
      <div class="note-options-col">

        <!-- Color de fondo -->
        <div class="note-opt-section">
          <p class="note-opt-label">Color de fondo</p>
          <div class="note-color-grid">
            ${NOTE_COLORS.map(c => `
              <div class="note-color-dot ${currentColor===c.color ? "active" : ""}"
                   style="background:${c.color}"
                   title="${c.label}"
                   onclick="selectNoteColor('${c.color}')">
              </div>
            `).join("")}
            <div class="note-color-dot custom-color-dot" title="Color personalizado"
                 style="background: conic-gradient(red,yellow,lime,cyan,blue,magenta,red)">
              <input type="color" value="${currentColor}"
                     onchange="selectNoteColor(this.value)"
                     style="opacity:0;position:absolute;width:100%;height:100%;cursor:pointer">
            </div>
          </div>
        </div>

        <!-- Patrón de fondo -->
        <div class="note-opt-section">
          <p class="note-opt-label">Patrón de fondo</p>
          <div class="note-pattern-grid">
            ${[
              { id:"solid", icon:"⬜", label:"Sólido" },
              { id:"grid",  icon:"⊞",  label:"Cuadrícula" },
              { id:"lines", icon:"≡",  label:"Líneas" },
              { id:"dots",  icon:"⠿",  label:"Puntos" },
            ].map(p => `
              <button class="note-pattern-btn ${currentPattern===p.id ? "active" : ""}"
                      onclick="selectNotePattern('${p.id}')"
                      title="${p.label}">
                <span style="font-size:18px">${p.icon}</span>
                <span style="font-size:11px">${p.label}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Vista previa del fondo -->
        <div class="note-opt-section">
          <p class="note-opt-label">Vista previa</p>
          <div id="note_preview_bg"
               style="${editorBg};border-radius:10px;height:80px;
                      border:1px solid rgba(255,255,255,.1)"></div>
        </div>

      </div>
    </div>

    <input type="hidden" id="n_color"   value="${currentColor}">
    <input type="hidden" id="n_pattern" value="${currentPattern}">
  `;

  overlay.style.display = "flex";
 
  document.getElementById("n_title")?.focus();
}

// ================================================
// TOOLBAR — comandos de formato
// ================================================

function execCmd(cmd, value = null) {
  const editor = document.getElementById("n_editor");
  if (!editor) return;
  editor.focus();
  document.execCommand(cmd, false, value);
}

function execFontSize(size) {
  if (!size) return;
  execCmd("fontSize", size);
}

// ================================================
// SELECCIÓN DE COLOR Y PATRÓN
// ================================================

function selectNoteColor(color) {
  document.getElementById("n_color").value = color;

  // Actualizar dots
  document.querySelectorAll(".note-color-dot").forEach(d => {
    d.classList.remove("active");
    if (d.style.background === color) d.classList.add("active");
  });

  // Actualizar editor y preview en tiempo real
  updateEditorBackground();
}

function selectNotePattern(pattern) {
  document.getElementById("n_pattern").value = pattern;

  document.querySelectorAll(".note-pattern-btn").forEach(b => {
    b.classList.remove("active");
    if (b.getAttribute("onclick")?.includes(`'${pattern}'`)) b.classList.add("active");
  });

  updateEditorBackground();
}

function updateEditorBackground() {
  const color   = document.getElementById("n_color")?.value   || "#111b31";
  const pattern = document.getElementById("n_pattern")?.value || "solid";
  const isDark  = isDarkColor(color);
  const bgStyle = getNoteBackgroundStyle(pattern, color);
  const textCol = isDark ? "#e8edf8" : "#1a202c";

  const editor  = document.getElementById("n_editor");
  const preview = document.getElementById("note_preview_bg");

  if (editor) {
    // Aplicar cada propiedad individualmente
    editor.style.color = textCol;
    applyBgStyle(editor, bgStyle);
  }
  if (preview) applyBgStyle(preview, bgStyle);
}

function applyBgStyle(el, styleStr) {
  // Parsear el string de estilo y aplicar propiedades
  styleStr.split(";").forEach(rule => {
    const [prop, ...rest] = rule.split(":");
    if (!prop?.trim()) return;
    const val = rest.join(":").trim();
    try { el.style[prop.trim().replace(/-([a-z])/g, g => g[1].toUpperCase())] = val; } catch(e) {}
  });
}

// ================================================
// CERRAR MODAL
// ================================================

function closeNoteModal() {
  const o = document.getElementById("noteModalOverlay");
  if (o) o.style.display = "none";
}

// ================================================
// CRUD
// ================================================

async function saveNewNote() {
  const title      = document.getElementById("n_title")?.value.trim();
  const content    = document.getElementById("n_editor")?.innerHTML.trim();
  const color      = document.getElementById("n_color")?.value   || "#111b31";
  const bg_pattern = document.getElementById("n_pattern")?.value || "solid";
  const pinned     = document.getElementById("n_pinned")?.checked || false;

  if (!title) { showToast("El título no puede estar vacío."); return; }

  const state   = getState();
  const student = JSON.parse(localStorage.getItem("active_student"));

  const { error } = await supabaseClient.from("notes").insert([{
    id: uid("note"), group_id: state.selected.groupId,
    owner_id: student?._dev_mode ? null : student?.id,
    title, content: content || "", color, pinned,
  }]);

  if (error) { showToast("Error al guardar."); return; }
  closeNoteModal();
  await loadNotes();
  renderNotes();
  showToast("Apunte guardado ✓", "success");
}

async function saveEditNote(id) {
  const title      = document.getElementById("n_title")?.value.trim();
  const content    = document.getElementById("n_editor")?.innerHTML.trim();
  const color      = document.getElementById("n_color")?.value   || "#111b31";
  const bg_pattern = document.getElementById("n_pattern")?.value || "solid";
  const pinned     = document.getElementById("n_pinned")?.checked || false;

  if (!title) { showToast("El título no puede estar vacío."); return; }

  const { error } = await supabaseClient.from("notes")
    .update({ title, content: content || "", color, pinned }).eq("id", id);

  if (error) { showToast("Error al guardar."); return; }
  closeNoteModal();
  await loadNotes();
  renderNotes();
  showToast("Apunte actualizado ✓", "success");
}

async function deleteNote(id) {
  if (!confirm("¿Eliminar este apunte?")) return;
  await supabaseClient.from("notes").delete().eq("id", id);
  closeNoteModal();
  selectedNote = null;
  await loadNotes();
  renderNotes();
}
