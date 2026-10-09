// ================================================
// PANEL_ESTATICO_TOP.JS — v3
// Router de tabs, contexto de grupo, tema
// ================================================

let _tabsInited = {};

async function initPanel() {
  applyTheme();
  applyRoleVisibility();
  await renderContext();
  setupTabs();
  checkTabInicial();
}

// ================================================
// TEMA
// ================================================
function applyTheme() {
  try {
    const cfg = loadConfig ? loadConfig() : {};
    document.documentElement.setAttribute("data-theme", cfg.theme || "dark");
    if (cfg.customColors) {
      Object.entries(cfg.customColors).forEach(([k, v]) =>
        document.documentElement.style.setProperty(k, v)
      );
    }
    if (cfg.fontSize) {
      document.documentElement.style.setProperty("--font-size-base", cfg.fontSize + "px");
    }
  } catch(e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

// ================================================
// CONTEXTO DEL GRUPO
// ================================================
async function renderContext() {
  const ctx     = document.getElementById("panelContext");
  const groupId = getState().selected.groupId;
  if (!ctx) return;

  if (!groupId) { ctx.textContent = "Sin grupo seleccionado."; return; }

  const { data, error } = await supabaseClient
    .from("groups")
    .select("id, name, sections(id, name, careers(id, name))")
    .eq("id", groupId)
    .single();

  if (error || !data) { ctx.textContent = "No se pudo cargar el grupo."; return; }

  ctx.textContent =
    `${data.sections?.careers?.name || "Carrera"} → ` +
    `${data.sections?.name || "Sección"} → ` +
    `${data.name}`;
}

// ================================================
// TABS
// ================================================
function setupTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(btn.dataset.tab);
      if (panel) panel.classList.add("active");

      const tab = btn.dataset.tab;
      if (!_tabsInited[tab]) {
        _tabsInited[tab] = true;
        initTab(tab);
      }
    });
  });

  // Iniciar tab activo por defecto
  const defaultTab = document.querySelector(".tab.active")?.dataset.tab;
  if (defaultTab && !_tabsInited[defaultTab]) {
    _tabsInited[defaultTab] = true;
    initTab(defaultTab);
  }
}

// ================================================
// ROUTER DE SECCIONES
// ================================================
function initTab(tab) {
  switch(tab) {
    case "inicio":          if (typeof initInicio         === "function") initInicio();          break;
    case "scrum":           if (typeof initScrum          === "function") initScrum();           break;
    case "calendario":      if (typeof initCalendario     === "function") initCalendario();      break;
    case "apuntes":         if (typeof initApuntes        === "function") initApuntes();         break;
    case "biblioteca":      if (typeof initBiblioteca     === "function") initBiblioteca();      break;
    case "lista":           if (typeof initLista          === "function") initLista();           break;
    case "sorteo":          if (typeof initSorteo         === "function") initSorteo();          break;
    case "encuestas":       if (typeof initEncuestas      === "function") initEncuestas();       break;
    case "grupos":          if (typeof initGruposTab      === "function") initGruposTab();       break;
    case "configuraciones": if (typeof initConfiguraciones=== "function") initConfiguraciones(); break;
    case "constructor_ia":  if (typeof initConstructorIA  === "function") initConstructorIA();   break;
    case "agentes_ia":      if (typeof initAgentesIA      === "function") initAgentesIA();       break;
    case "anuncios":        if (typeof initAnuncios       === "function") initAnuncios();        break;
    case "chat":            if (typeof initChat           === "function") initChat();            break;
    case "mensajeria":      if (typeof initMensajeria     === "function") initMensajeria();      break;
    case "institucion":     if (typeof initInstitucion    === "function") initInstitucion();     break;
    case "maquetador":      if (typeof initMaquetador     === "function") initMaquetador();      break;
    case "asistente":       if (typeof initAsistente      === "function") initAsistente();       break;
    default: break;
  }
}

// ================================================
// TAB INICIAL DESDE OTRA PÁGINA
// ================================================
function checkTabInicial() {
  const tabInicial = localStorage.getItem("panel_tab_inicial");
  if (!tabInicial) return;
  localStorage.removeItem("panel_tab_inicial");
  const btn = document.querySelector(`.tab[data-tab="${tabInicial}"]`);
  if (btn) setTimeout(() => btn.click(), 80);
}

// ================================================
// VISIBILIDAD POR ROL
// ================================================
function applyRoleVisibility() {
  const state = getState();
  const role  = state.session?.active_role || state.session?.role || "student";
  const isAdmin   = role === "admin"   || role === "master";
  const isTeacher = role === "teacher" || isAdmin;
  const isOmni    = role === "master";

  // Secciones solo para admin/omni
  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = isAdmin ? "" : "none";
  });

  // Secciones solo para profesor+
  document.querySelectorAll(".teacher-only").forEach(el => {
    el.style.display = isTeacher ? "" : "none";
  });

  // Tabs ocultos por rol
  const tabsAlumno   = ["scrum","calendario","apuntes","biblioteca","chat","mensajeria",
                         "lista","sorteo","encuestas","constructor_ia","agentes_ia",
                         "grupos","configuraciones"];
  const tabsProfesor = ["inicio","calendario","biblioteca","chat","mensajeria","anuncios",
                         "encuestas","sorteo","constructor_ia","agentes_ia",
                         "grupos","configuraciones"];
  const tabsAdmin    = ["inicio","institucion","grupos","mensajeria","anuncios","configuraciones"];

  if (isOmni) return; // Omni ve todo

  let allowedTabs;
  if (role === "admin")   allowedTabs = tabsAdmin;
  else if (role === "teacher") allowedTabs = tabsProfesor;
  else allowedTabs = tabsAlumno;

  document.querySelectorAll(".tab[data-tab]").forEach(btn => {
    const tab = btn.dataset.tab;
    btn.style.display = allowedTabs.includes(tab) ? "" : "none";
  });
}

// ================================================
// TOAST GLOBAL
// ================================================
function showToast(msg, type = "info") {
  const colors = { info: "#1e3a5f", success: "#0f3d28", danger: "#3d1a1a", warning: "#3d2a00" };
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:${colors[type]||colors.info};color:#d4ddf0;
    padding:10px 20px;border-radius:99px;font-size:13px;
    z-index:9999;pointer-events:none;
    border:1px solid rgba(255,255,255,.1);
    animation:fadeInUp .2s ease;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ================================================
// ARRANCAR
// ================================================
initPanel();
