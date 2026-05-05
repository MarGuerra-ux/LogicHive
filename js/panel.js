let state = getState();
let currentColumns = [];
let currentTasks = [];

function init() {
  applyRoleVisibility();
  setupTabs();
  loadPanel();
}

async function loadPanel() {
  await renderContext();
  await loadScrumData();
  renderColumnSelect();
  renderKanban();
  renderSimpleLists();
  renderPolls();
}

// ===============================
// CONTEXTO
// ===============================

async function renderContext() {
  const context = document.getElementById("panelContext");
  if (!context) return;

  const groupId = state.selected.groupId;

  if (!groupId) {
    context.textContent = "Grupo no seleccionado.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("groups")
    .select(`
      id,
      name,
      sections (
        id,
        name,
        careers (
          id,
          name
        )
      )
    `)
    .eq("id", groupId)
    .single();

  if (error || !data) {
    context.textContent = "No se pudo cargar el contexto del grupo.";
    return;
  }

  context.textContent =
    `${data.sections?.careers?.name || "Carrera"} → ` +
    `${data.sections?.name || "Sección"} → ` +
    `${data.name || "Grupo"}`;
}

// ===============================
// TABS
// ===============================

function setupTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");

      const panel = document.getElementById(btn.dataset.tab);
      if (panel) panel.classList.add("active");
    });
  });
}

// ===============================
// SUPABASE SCRUM
// ===============================

async function loadScrumData() {
  const groupId = state.selected.groupId;

  if (!groupId) {
    currentColumns = [];
    currentTasks = [];
    return;
  }

  const { data: columns, error: columnsError } = await supabaseClient
    .from("scrum_columns")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (columnsError) {
    console.error("Error cargando columnas:", columnsError.message);
    currentColumns = [];
  } else {
    currentColumns = columns || [];
  }

  const { data: tasks, error: tasksError } = await supabaseClient
    .from("scrum_tasks")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (tasksError) {
    console.error("Error cargando tareas:", tasksError.message);
    currentTasks = [];
  } else {
    currentTasks = tasks || [];
  }
}

// ===============================
// SCRUM / KANBAN
// ===============================

function renderColumnSelect() {
  const select = document.getElementById("columnSelect");
  if (!select) return;

  select.innerHTML = "";

  currentColumns.forEach((column) => {
    const option = document.createElement("option");
    option.value = column.id;
    option.textContent = column.title;
    select.appendChild(option);
  });
}

function renderKanban() {
  const board = document.getElementById("kanbanBoard");
  if (!board) return;

  board.innerHTML = "";

  if (!currentColumns.length) {
    board.innerHTML = "<p>No hay columnas creadas para este grupo.</p>";
    return;
  }

  currentColumns.forEach((column) => {
    const columnDiv = document.createElement("div");
    columnDiv.className = "kanban-column";

    const tasks = currentTasks
      .filter((task) => task.column_id === column.id)
      .map(taskHtml)
      .join("");

    columnDiv.innerHTML = `
      <div class="column-header">
        <span class="column-title">${column.title}</span>
        <span>${column.icon || ""}</span>
      </div>

      ${tasks || "<p>No hay tareas en esta columna.</p>"}
    `;

    board.appendChild(columnDiv);
  });
}

function taskHtml(task) {
  return `
    <article class="task-card">
      <h4>${task.title}</h4>

      <p>
        <b>Dueño:</b> ${task.owner || "Sin dueño"}<br>
        <b>Permiso:</b> ${task.permission || "Sin permiso"}
      </p>

      <div class="task-actions">
        <button class="btn secondary" onclick="moveTask('${task.id}')">Mover</button>
        <button class="btn warning" onclick="editTask('${task.id}')">Modificar</button>
        <button class="btn danger" onclick="deleteTask('${task.id}')">Eliminar</button>
      </div>
    </article>
  `;
}

async function addTask() {
  const input = document.getElementById("taskTitle");
  const columnSelect = document.getElementById("columnSelect");
  const permissionSelect = document.getElementById("taskPermission");

  if (!input || !columnSelect || !permissionSelect) return;

  const title = input.value.trim();

  if (!title) {
    alert("Escribe una tarea");
    return;
  }

  const { error } = await supabaseClient.from("scrum_tasks").insert([
    {
      id: uid("task"),
      group_id: state.selected.groupId,
      column_id: columnSelect.value,
      title,
      owner: state.session.user || "Marco",
      permission: permissionSelect.value,
    },
  ]);

  if (error) {
    alert("Error al crear tarea.");
    console.error(error.message);
    return;
  }

  input.value = "";
  await loadScrumData();
  renderKanban();
}

async function editTask(id) {
  const task = currentTasks.find((task) => task.id === id);
  if (!task) return;

  const title = prompt("Nuevo nombre de la tarea", task.title);
  if (!title || !title.trim()) return;

  const permission = prompt(
    "Permiso: Solo lectura / Edición / Eliminación",
    task.permission
  );

  const { error } = await supabaseClient
    .from("scrum_tasks")
    .update({
      title: title.trim(),
      permission: permission || task.permission,
    })
    .eq("id", id);

  if (error) {
    alert("Error al modificar tarea.");
    console.error(error.message);
    return;
  }

  await loadScrumData();
  renderKanban();
}

async function deleteTask(id) {
  if (!confirm("¿Eliminar esta tarea?")) return;

  const { error } = await supabaseClient
    .from("scrum_tasks")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar tarea.");
    console.error(error.message);
    return;
  }

  await loadScrumData();
  renderKanban();
}

async function moveTask(id) {
  const task = currentTasks.find((task) => task.id === id);
  if (!task) return;

  const options = currentColumns
    .map((column) => `${column.id}: ${column.title}`)
    .join("\n");

  const nextColumnId = prompt(
    "Escribe el ID de la columna destino:\n" + options,
    task.column_id
  );

  const columnExists = currentColumns.some((column) => column.id === nextColumnId);

  if (!nextColumnId) return;

  if (!columnExists) {
    alert("Columna no encontrada");
    return;
  }

  const { error } = await supabaseClient
    .from("scrum_tasks")
    .update({ column_id: nextColumnId })
    .eq("id", id);

  if (error) {
    alert("Error al mover tarea.");
    console.error(error.message);
    return;
  }

  await loadScrumData();
  renderKanban();
}

async function addColumn() {
  const title = prompt("Nombre de la nueva columna");
  if (!title || !title.trim()) return;

  const icon = prompt("Ícono opcional", "📌") || "";

  const { error } = await supabaseClient.from("scrum_columns").insert([
    {
      id: uid("col"),
      group_id: state.selected.groupId,
      title: title.trim(),
      icon,
    },
  ]);

  if (error) {
    alert("Error al crear columna.");
    console.error(error.message);
    return;
  }

  await loadScrumData();
  renderColumnSelect();
  renderKanban();
}

async function renameSelectedColumn() {
  const select = document.getElementById("columnSelect");
  if (!select) return;

  const column = currentColumns.find((column) => column.id === select.value);
  if (!column) return;

  const name = prompt("Nuevo nombre de columna", column.title);
  if (!name || !name.trim()) return;

  const icon = prompt("Ícono de columna", column.icon || "");

  const { error } = await supabaseClient
    .from("scrum_columns")
    .update({
      title: name.trim(),
      icon: icon || "",
    })
    .eq("id", column.id);

  if (error) {
    alert("Error al renombrar columna.");
    console.error(error.message);
    return;
  }

  await loadScrumData();
  renderColumnSelect();
  renderKanban();
}

async function deleteSelectedColumn() {
  const select = document.getElementById("columnSelect");
  if (!select) return;

  const columnId = select.value;

  if (currentColumns.length <= 1) {
    alert("Debe quedar al menos una columna");
    return;
  }

  const column = currentColumns.find((column) => column.id === columnId);
  if (!column) return;

  if (!confirm(`¿Eliminar columna "${column.title}"?`)) return;

  const fallbackColumn = currentColumns.find((column) => column.id !== columnId);

  await supabaseClient
    .from("scrum_tasks")
    .update({ column_id: fallbackColumn.id })
    .eq("column_id", columnId);

  const { error } = await supabaseClient
    .from("scrum_columns")
    .delete()
    .eq("id", columnId);

  if (error) {
    alert("Error al eliminar columna.");
    console.error(error.message);
    return;
  }

  await loadScrumData();
  renderColumnSelect();
  renderKanban();
}

// ===============================
// LISTAS SIMPLES TEMPORALES
// ===============================

function addSimpleItem(key, inputId, listId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const value = input.value.trim();
  if (!value) return;

  state[key] = state[key] || [];

  state[key].push({
    id: uid(key),
    text: value,
  });

  input.value = "";

  setState(state);
  renderSimpleList(key, listId);
}

function renderSimpleList(key, listId) {
  const list = document.getElementById(listId);
  if (!list) return;

  list.innerHTML = (state[key] || [])
    .map((item) => {
      return `
        <li>
          ${item.text}
          <button class="btn danger" onclick="removeSimpleItem('${key}', '${item.id}', '${listId}')">
            Eliminar
          </button>
        </li>
      `;
    })
    .join("");
}

function removeSimpleItem(key, id, listId) {
  state[key] = (state[key] || []).filter((item) => item.id !== id);

  setState(state);
  renderSimpleList(key, listId);
}

function renderSimpleLists() {
  renderSimpleList("events", "eventList");
  renderSimpleList("notes", "noteList");
  renderSimpleList("list", "listOutput");
  renderSimpleList("blacklist", "blackList");
}

// ===============================
// SORTEO
// ===============================

function runRaffle() {
  const input = document.getElementById("raffleInput");
  const result = document.getElementById("raffleResult");

  if (!input || !result) return;

  const names = input.value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (!names.length) {
    alert("Escribe nombres separados por coma");
    return;
  }

  const winner = names[Math.floor(Math.random() * names.length)];
  result.textContent = "Resultado: " + winner;
}

// ===============================
// ENCUESTAS TEMPORALES
// ===============================

function createPoll() {
  const input = document.getElementById("pollInput");
  if (!input) return;

  const question = input.value.trim();
  if (!question) return;

  state.polls.push({
    id: uid("poll"),
    question,
    yes: 0,
    no: 0,
  });

  input.value = "";

  setState(state);
  renderPolls();
}

function renderPolls() {
  const output = document.getElementById("pollOutput");
  if (!output) return;

  output.innerHTML = (state.polls || [])
    .map((poll) => {
      return `
        <div class="mini-card">
          <h3>${poll.question}</h3>
          <button class="btn success" onclick="votePoll('${poll.id}', 'yes')">
            Sí (${poll.yes})
          </button>
          <button class="btn danger" onclick="votePoll('${poll.id}', 'no')">
            No (${poll.no})
          </button>
          <button class="btn secondary" onclick="deletePoll('${poll.id}')">
            Eliminar
          </button>
        </div>
      `;
    })
    .join("");
}

function votePoll(id, type) {
  const poll = state.polls.find((poll) => poll.id === id);
  if (!poll) return;

  if (type !== "yes" && type !== "no") return;

  poll[type]++;

  setState(state);
  renderPolls();
}

function deletePoll(id) {
  state.polls = state.polls.filter((poll) => poll.id !== id);

  setState(state);
  renderPolls();
}

// ===============================
// INICIO
// ===============================

init();