const STORAGE_KEY = "organizador_marco_v26";

const defaultState = {
  session: {
    role: "admin",
    user: "Marco",
  },

  selected: {
    careerId: null,
    sectionId: null,
    groupId: null,
  },

  careers: [
    {
      id: "inf",
      name: "Ingeniería en Informática",
      code: "INF",
      sections: [
        { id: "inf_001-d", name: "001-D", key: "" },
        { id: "inf_002-d", name: "002-D", key: "" },
        { id: "inf_003-v", name: "003-V", key: "" },
        { id: "inf_004-v", name: "004-V", key: "" },
      ],
    },
    {
      id: "adm",
      name: "Administración de Empresas",
      code: "ADM",
      sections: [
        { id: "adm_001-d", name: "001-D", key: "" },
        { id: "adm_002-v", name: "002-V", key: "" },
      ],
    },
    {
      id: "ap",
      name: "Analista Programador",
      code: "AP",
      sections: [
        { id: "ap_001-d", name: "001-D", key: "" },
        { id: "ap_003-v", name: "003-V", key: "" },
      ],
    },
  ],

  groups: {
    "inf_001-d": [
      { id: "g1", name: "Grupo 1", owner: "Alumno 1", key: "" },
      { id: "g2", name: "Grupo 2", owner: "Alumno 2", key: "" },
      { id: "g3", name: "Grupo 3", owner: "Alumno 3", key: "" },
      { id: "g4", name: "Grupo 4", owner: "Alumno 4", key: "" },
    ],

    "inf_002-d": [
      { id: "g1", name: "Grupo 1", owner: "Alumno 1", key: "" },
    ],

    "inf_003-v": [
      { id: "g1", name: "Grupo 1", owner: "Marco", key: "" },
      { id: "g2", name: "Grupo 2", owner: "Alumno 2", key: "" },
    ],

    "inf_004-v": [
      { id: "g1", name: "Grupo 1", owner: "Alumno 1", key: "" },
    ],

    "adm_001-d": [
      { id: "g1", name: "Grupo 1", owner: "Alumno 1", key: "" },
    ],

    "adm_002-v": [
      { id: "g1", name: "Grupo 1", owner: "Alumno 1", key: "" },
    ],

    "ap_001-d": [
      { id: "g1", name: "Grupo 1", owner: "Alumno 1", key: "" },
    ],

    "ap_003-v": [
      { id: "g1", name: "Grupo 1", owner: "Alumno 1", key: "" },
    ],
  },

  scrum: {
    selectedColumnId: "todo",

    columns: [
      { id: "todo", title: "Por hacer", icon: "🕒" },
      { id: "doing", title: "En proceso", icon: "⚙️" },
      { id: "done", title: "Finalizado", icon: "✅" },
    ],

    tasks: [
      {
        id: "t1",
        title: "Creación de informe Ramo Base de Datos",
        columnId: "todo",
        owner: "Marco",
        permission: "Solo lectura",
      },
      {
        id: "t2",
        title: "Hacer Quiz actividad 2.3.1",
        columnId: "todo",
        owner: "Marco",
        permission: "Edición",
      },
    ],
  },

  events: [],
  notes: [],
  list: [],
  blacklist: [],
  polls: [],
};

// ===============================
// LOCAL STORAGE
// ===============================

function loadState() {
  const rawData = localStorage.getItem(STORAGE_KEY);

  if (!rawData) {
    const initialState = cloneState(defaultState);
    saveState(initialState);
    return initialState;
  }

  try {
    const savedState = JSON.parse(rawData);
    return normalizeState(savedState);
  } catch (error) {
    const initialState = cloneState(defaultState);
    saveState(initialState);
    return initialState;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getState() {
  return loadState();
}

function setState(state) {
  saveState(normalizeState(state));
}

// ===============================
// NORMALIZACIÓN DEL ESTADO
// ===============================

function normalizeState(state) {
  return {
    ...cloneState(defaultState),
    ...state,

    session: {
      ...defaultState.session,
      ...(state.session || {}),
    },

    selected: {
      ...defaultState.selected,
      ...(state.selected || {}),
    },

    careers: Array.isArray(state.careers)
      ? state.careers
      : cloneState(defaultState.careers),

    groups: {
      ...cloneState(defaultState.groups),
      ...(state.groups || {}),
    },

    scrum: {
      ...cloneState(defaultState.scrum),
      ...(state.scrum || {}),
      columns: Array.isArray(state.scrum?.columns)
        ? state.scrum.columns
        : cloneState(defaultState.scrum.columns),
      tasks: Array.isArray(state.scrum?.tasks)
        ? state.scrum.tasks
        : cloneState(defaultState.scrum.tasks),
    },

    events: Array.isArray(state.events) ? state.events : [],
    notes: Array.isArray(state.notes) ? state.notes : [],
    list: Array.isArray(state.list) ? state.list : [],
    blacklist: Array.isArray(state.blacklist) ? state.blacklist : [],
    polls: Array.isArray(state.polls) ? state.polls : [],
  };
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

// ===============================
// UTILIDADES
// ===============================

function uid(prefix = "id") {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 9999);

  return `${prefix}_${timestamp}_${random}`;
}

function requireAdmin() {
  const state = getState();
  return state.session?.role === "admin";
}

function applyRoleVisibility() {
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.style.display = requireAdmin() ? "block" : "none";
  });
}

function logout() {
  localStorage.removeItem(STORAGE_KEY);
  location.href = "../index.html";
}

// ===============================
// BUSCADORES
// ===============================

function findCareer(state, id) {
  return state.careers.find((career) => career.id === id);
}

function findSection(state, id) {
  for (const career of state.careers) {
    const section = career.sections.find((section) => section.id === id);

    if (section) {
      return {
        career,
        section,
      };
    }
  }

  return null;
}