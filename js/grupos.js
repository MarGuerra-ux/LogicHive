let state = getState();

// ===============================
// RENDER PRINCIPAL
// ===============================

async function renderGroups() {
  applyRoleVisibility();

  const sectionId = state.selected.sectionId;
  const sectionInfo = document.getElementById("sectionInfo");
  const grid = document.getElementById("groupGrid");

  if (!sectionInfo || !grid) return;

  if (!sectionId) {
    sectionInfo.textContent = "No hay sección seleccionada.";
    grid.innerHTML = "";
    return;
  }

  sectionInfo.textContent = "Cargando grupos...";
  grid.innerHTML = "";

  const section = await getSectionFromSupabase(sectionId);
  const groups = await getGroupsFromSupabase(sectionId);

  if (!section) {
    sectionInfo.textContent = "Sección no encontrada.";
    return;
  }

  renderSectionInfo(section, sectionInfo);
  renderGroupCards(groups, section, grid);
}

function renderSectionInfo(section, sectionInfo) {
  sectionInfo.textContent =
    `${section.careers?.name || "Carrera"} → Sección ${section.name}. ` +
    "Clave de sección omitida en fase de construcción.";
}

function renderGroupCards(groups, section, grid) {
  grid.innerHTML = "";

  if (!groups.length) {
    grid.innerHTML = "<p>No hay grupos creados en esta sección.</p>";
    return;
  }

  groups.forEach((group) => {
    const card = createGroupCard(group, section);
    grid.appendChild(card);
  });
}

function createGroupCard(group, section) {
  const card = document.createElement("article");
  card.className = "card";

  card.innerHTML = `
    <h2>${group.name}</h2>

    <p>
      Grupo de trabajo dentro de la sección ${section.name}. 
      El dueño del grupo define la clave.
    </p>

    <span class="badge">Clave: ${group.key ? "definida" : "libre"}</span>
    <span class="badge">Dueño: ${group.owner}</span>

    <br><br>

    <button class="btn primary" onclick="enterGroup('${group.id}')">
      Entrar al ${group.name}
    </button>
  `;

  return card;
}

// ===============================
// SUPABASE
// ===============================

async function getSectionFromSupabase(sectionId) {
  const { data, error } = await supabaseClient
    .from("sections")
    .select(`
      id,
      name,
      key,
      careers (
        id,
        name,
        code
      )
    `)
    .eq("id", sectionId)
    .single();

  if (error) {
    console.error("Error cargando sección:", error.message);
    return null;
  }

  return data;
}

async function getGroupsFromSupabase(sectionId) {
  const { data, error } = await supabaseClient
    .from("groups")
    .select("*")
    .eq("section_id", sectionId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error cargando grupos:", error.message);
    alert("Error al cargar grupos desde Supabase.");
    return [];
  }

  return data || [];
}

// ===============================
// NAVEGACIÓN
// ===============================

async function enterGroup(groupId) {
  state.selected.groupId = groupId;

  const activeStudent = JSON.parse(localStorage.getItem("active_student"));

  if (activeStudent?.id) {
    await supabaseClient
      .from("students")
      .update({ group_id: groupId })
      .eq("id", activeStudent.id);

    activeStudent.group_id = groupId;
    localStorage.setItem("active_student", JSON.stringify(activeStudent));
  }

  setState(state);
  location.href = "panel.html";
}

function currentSectionId() {
  return state.selected.sectionId;
}

function logoutStudent() {
  localStorage.removeItem("active_student");
  localStorage.removeItem("organizador_marco_v26");
  location.href = "../index.html";
}

// ===============================
// ADMINISTRADOR DE GRUPOS
// ===============================

async function createGroup() {
  const sectionId = currentSectionId();

  if (!sectionId) {
    alert("Primero debes seleccionar una sección.");
    return;
  }

  const name = prompt("Nombre del grupo", "Grupo nuevo");
  if (!name || !name.trim()) return;

  const owner = prompt("Dueño del grupo", state.session.user || "Alumno") || "Alumno";

  const { error } = await supabaseClient.from("groups").insert([
    {
      id: uid("group"),
      section_id: sectionId,
      name: name.trim(),
      owner: owner.trim(),
      key: "",
    },
  ]);

  if (error) {
    console.error("Error creando grupo:", error.message);
    alert("Error al crear grupo.");
    return;
  }

  renderGroups();
}

async function renameGroup() {
  const name = prompt("Nombre actual del grupo");
  if (!name || !name.trim()) return;

  const sectionId = currentSectionId();

  const newName = prompt("Nuevo nombre");
  if (!newName || !newName.trim()) return;

  const { error } = await supabaseClient
    .from("groups")
    .update({ name: newName.trim() })
    .eq("section_id", sectionId)
    .eq("name", name.trim());

  if (error) {
    console.error("Error renombrando grupo:", error.message);
    alert("Error al renombrar grupo.");
    return;
  }

  renderGroups();
}

async function changeGroupKey() {
  const name = prompt("Grupo al que quieres cambiar clave");
  if (!name || !name.trim()) return;

  const newKey = prompt("Nueva clave numérica", "") || "";

  const { error } = await supabaseClient
    .from("groups")
    .update({ key: newKey.trim() })
    .eq("section_id", currentSectionId())
    .eq("name", name.trim());

  if (error) {
    console.error("Error cambiando clave:", error.message);
    alert("Error al cambiar clave.");
    return;
  }

  alert("Clave actualizada");
  renderGroups();
}

async function deleteGroup() {
  const name = prompt("Grupo a eliminar");
  if (!name || !name.trim()) return;

  if (!confirm(`¿Seguro que deseas eliminar "${name}"?`)) return;

  const { error } = await supabaseClient
    .from("groups")
    .delete()
    .eq("section_id", currentSectionId())
    .eq("name", name.trim());

  if (error) {
    console.error("Error eliminando grupo:", error.message);
    alert("Error al eliminar grupo.");
    return;
  }

  renderGroups();
}

// ===============================
// ADMINISTRADOR DE ALUMNOS
// ===============================

function moveStudent() {
  alert(
    "Simulación: aquí se reubicaría un alumno entre carrera, sección y grupo."
  );
}

function showStudents() {
  alert("Alumnos de ejemplo:\n- Marco\n- Alumno 1\n- Alumno 2");
}

// ===============================
// INICIO
// ===============================

renderGroups();