// ================================================
// PANEL_ESTATICO_TOP.JS — v3
// Contexto, tabs, navegación global
// ================================================

let _tabsInited = {};

// ================================================
// INICIO GENERAL
// ================================================

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

const cfg =
loadConfig();

document.documentElement.setAttribute(
"data-theme",
cfg.theme || "dark"
);

if (cfg.customColors) {

```
Object.entries(cfg.customColors)
  .forEach(([key, val]) => {

    document.documentElement
      .style
      .setProperty(key, val);

  });
```

}

if (cfg.fontSize) {

```
document.documentElement
  .style
  .setProperty(
    "--font-size-base",
    cfg.fontSize + "px"
  );
```

}
}

// ================================================
// CONTEXTO DEL GRUPO
// ================================================

async function renderContext() {

const ctx =
document.getElementById(
"panelContext"
);

const groupId =
getState()
.selected
.groupId;

if (!ctx) return;

if (!groupId) {

```
ctx.textContent =
  "Sin grupo seleccionado.";

return;
```

}

const { data, error } =
await supabaseClient
.from("groups")
.select(`         id,
        name,
        sections(
          id,
          name,
          careers(
            id,
            name
          )
        )
      `)
.eq("id", groupId)
.single();

if (error || !data) {

```
ctx.textContent =
  "No se pudo cargar el grupo.";

return;
```

}

ctx.textContent =
`${data.sections?.careers?.name || "Carrera"} → ` +
`${data.sections?.name || "Sección"} → ` +
`${data.name}`;
}

// ================================================
// TABS
// ================================================

function setupTabs() {

document
.querySelectorAll(".tab")
.forEach(btn => {

```
  btn.addEventListener("click", () => {

    document
      .querySelectorAll(".tab")
      .forEach(b =>
        b.classList.remove("active")
      );

    document
      .querySelectorAll(".tab-panel")
      .forEach(p =>
        p.classList.remove("active")
      );

    btn.classList.add("active");

    const panel =
      document.getElementById(
        btn.dataset.tab
      );

    if (panel) {
      panel.classList.add("active");
    }

    const tab =
      btn.dataset.tab;

    if (!_tabsInited[tab]) {

      _tabsInited[tab] = true;

      initTab(tab);
    }
  });
});
```

const defaultTab =
document
.querySelector(".tab.active")
?.dataset.tab;

if (
defaultTab &&
!_tabsInited[defaultTab]
) {

```
_tabsInited[defaultTab] = true;

initTab(defaultTab);
```

}
}

// ================================================
// ROUTER DE SECCIONES
// ================================================

function initTab(tab) {

switch (tab) {

```
// NUEVOS MÓDULOS
case "inicio":
  initInicio();
  break;

case "biblioteca":
  initBiblioteca();
  break;

case "mas":
  initMas();
  break;

// EXISTENTES
case "scrum":
  initScrum();
  break;

case "calendario":
  initCalendario();
  break;

case "apuntes":
  initApuntes();
  break;

case "lista":
  initLista();
  break;

case "sorteo":
  initSorteo();
  break;

case "encuestas":
  initEncuestas();
  break;

case "maquetador":
  initMaquetador();
  break;

case "asistente":
  initAsistente();
  break;

case "institucion":
  initInstitucion();
  break;

case "grupos":
  initGruposTab();
  break;

case "configuraciones":
  initConfiguraciones();
  break;

default:
  break;
```

}
}

// ================================================
// TAB INICIAL DESDE OTRA PÁGINA
// ================================================

function checkTabInicial() {

const tabInicial =
localStorage.getItem(
"panel_tab_inicial"
);

if (!tabInicial) return;

localStorage.removeItem(
"panel_tab_inicial"
);

const btn =
document.querySelector(
`.tab[data-tab="${tabInicial}"]`
);

if (btn) {

```
setTimeout(
  () => btn.click(),
  80
);
```

}
}

// ================================================
// ARRANQUE
// ================================================

initPanel();

