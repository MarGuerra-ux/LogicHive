
// ===============================
// RENDER BASE
// ===============================

function renderInicio() {

  const panel =
    document.getElementById("inicio");

  if (!panel) return;

  panel.innerHTML = `

    <div class="card" style="margin-bottom:16px">

      <h2 id="saludoNombre">
        Bienvenido 👋
      </h2>

      <p class="muted-text">
        Resumen rápido de tu actividad.
      </p>

    </div>

    <div class="cal-layout">

      <div class="card">

        <h3>Resumen del grupo</h3>

        <div id="resumenGrupo"></div>

      </div>

      <div class="card">

        <h3>Próximos eventos</h3>

        <div id="proximosEventos"></div>

      </div>

    </div>

    <div class="card" style="margin-top:16px">

      <h3>Actividad reciente</h3>

      <div id="actividadLista"></div>

    </div>

  `;
}


// ===============================
// INICIO - FEED DE ACTIVIDAD
// ===============================

async function initInicio() {

  renderInicio();

  const state = getState();
  const student = JSON.parse(
    localStorage.getItem("active_student")
  );

  if (!student) return;

  renderBienvenida(student);

  await Promise.all([
    cargarResumenGrupo(state),
    cargarActividadReciente(state),
    cargarProximosEventos(state),
  ]);
}

// ===============================
// BIENVENIDA
// ===============================

function renderBienvenida(student) {
  const hora = new Date().getHours();
  let saludo = "Buenas noches";
  if (hora >= 6 && hora < 12) saludo = "Buenos días";
  else if (hora >= 12 && hora < 20) saludo = "Buenas tardes";

  const el = document.getElementById("saludoNombre");
  if (el) el.textContent = `${saludo}, ${student.full_name.split(" ")[0]} 👋`;
}

// ===============================
// RESUMEN DEL GRUPO
// ===============================

async function cargarResumenGrupo(state) {
  const groupId = state.selected.groupId;
  const wrap = document.getElementById("resumenGrupo");
  if (!wrap) return;

  if (!groupId) {
    wrap.innerHTML = `<p class="muted-text">Sin grupo seleccionado.</p>`;
    return;
  }

  const [tareasRes, columnas] = await Promise.all([
    supabaseClient
      .from("scrum_tasks")
      .select("id, title, column_id, permission")
      .eq("group_id", groupId),
    supabaseClient
      .from("scrum_columns")
      .select("id, title")
      .eq("group_id", groupId),
  ]);

  const tareas = tareasRes.data || [];
  const cols = columnas.data || [];

  const colMap = {};
  cols.forEach((c) => (colMap[c.id] = c.title));

  const total = tareas.length;
  const porColumna = {};
  tareas.forEach((t) => {
    const nombre = colMap[t.column_id] || "Sin columna";
    porColumna[nombre] = (porColumna[nombre] || 0) + 1;
  });

  const barras = Object.entries(porColumna)
    .map(([nombre, n]) => {
      const pct = total > 0 ? Math.round((n / total) * 100) : 0;
      return `
        <div class="resumen-barra-wrap">
          <div class="resumen-barra-label">
            <span>${nombre}</span>
            <span>${n} tarea${n !== 1 ? "s" : ""}</span>
          </div>
          <div class="resumen-barra-bg">
            <div class="resumen-barra-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
    })
    .join("");

  wrap.innerHTML = `
    <div class="resumen-stat-row">
      <div class="resumen-stat">
        <span class="resumen-stat-num">${total}</span>
        <span class="resumen-stat-label">Tareas totales</span>
      </div>
      <div class="resumen-stat">
        <span class="resumen-stat-num">${cols.length}</span>
        <span class="resumen-stat-label">Columnas</span>
      </div>
    </div>
    <div class="resumen-barras">${barras || '<p class="muted-text">No hay tareas aún.</p>'}</div>
  `;
}

// ===============================
// ACTIVIDAD RECIENTE
// ===============================

async function cargarActividadReciente(state) {
  const groupId = state.selected.groupId;
  const sectionId = state.selected.sectionId;
  const lista = document.getElementById("actividadLista");
  if (!lista) return;

  lista.innerHTML = `<p class="muted-text">Cargando actividad...</p>`;

  const actividades = [];

  if (groupId) {
    const { data: tareas } = await supabaseClient
      .from("scrum_tasks")
      .select("id, title, owner, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(5);

    (tareas || []).forEach((t) => {
      actividades.push({
        tipo: "tarea",
        icono: "📋",
        texto: `<strong>${t.owner || "Alguien"}</strong> agregó la tarea <em>"${t.title}"</em>`,
        fecha: t.created_at,
      });
    });

    const { data: eventos } = await supabaseClient
      .from("events")
      .select("id, title, owner_name, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(3);

    (eventos || []).forEach((e) => {
      actividades.push({
        tipo: "evento",
        icono: "📅",
        texto: `<strong>${e.owner_name || "Alguien"}</strong> añadió el evento <em>"${e.title}"</em>`,
        fecha: e.created_at,
      });
    });

    const { data: apuntes } = await supabaseClient
      .from("notes")
      .select("id, title, owner_name, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(3);

    (apuntes || []).forEach((a) => {
      actividades.push({
        tipo: "apunte",
        icono: "📝",
        texto: `<strong>${a.owner_name || "Alguien"}</strong> guardó el apunte <em>"${a.title}"</em>`,
        fecha: a.created_at,
      });
    });
  }

  actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (!actividades.length) {
    lista.innerHTML = `<p class="muted-text">Aún no hay actividad en tu grupo. ¡Sé el primero en agregar algo!</p>`;
    return;
  }

  lista.innerHTML = actividades
    .slice(0, 8)
    .map(
      (a) => `
      <div class="actividad-item">
        <span class="actividad-icono">${a.icono}</span>
        <div class="actividad-texto">
          <p>${a.texto}</p>
          <span class="actividad-fecha">${formatFecha(a.fecha)}</span>
        </div>
      </div>`
    )
    .join("");
}

// ===============================
// PRÓXIMOS EVENTOS
// ===============================

async function cargarProximosEventos(state) {
  const groupId = state.selected.groupId;
  const wrap = document.getElementById("proximosEventos");
  if (!wrap) return;

  if (!groupId) {
    wrap.innerHTML = `<p class="muted-text">Sin grupo seleccionado.</p>`;
    return;
  }

  const hoy = new Date().toISOString();

  const { data: eventos } = await supabaseClient
    .from("events")
    .select("id, title, event_date, type")
    .eq("group_id", groupId)
    .gte("event_date", hoy)
    .order("event_date", { ascending: true })
    .limit(4);

  if (!eventos || !eventos.length) {
    wrap.innerHTML = `<p class="muted-text">No hay eventos próximos. Agregá uno en la sección Calendario.</p>`;
    return;
  }

  wrap.innerHTML = eventos
    .map((e) => {
      const dias = diasRestantes(e.event_date);
      const urgente = dias <= 3;
      return `
        <div class="evento-item ${urgente ? "evento-urgente" : ""}">
          <div class="evento-fecha-badge">
            <span class="evento-dia">${new Date(e.event_date).getDate()}</span>
            <span class="evento-mes">${mesCorto(e.event_date)}</span>
          </div>
          <div class="evento-info">
            <p class="evento-titulo">${e.title}</p>
            <span class="evento-dias-restantes">${
              dias === 0
                ? "¡Hoy!"
                : dias === 1
                ? "Mañana"
                : `En ${dias} días`
            }</span>
          </div>
          ${urgente ? '<span class="evento-alerta">⚠️</span>' : ""}
        </div>`;
    })
    .join("");
}

// ===============================
// UTILIDADES DE FECHA
// ===============================

function formatFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const ahora = new Date();
  const diff = Math.floor((ahora - d) / 1000);

  if (diff < 60) return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;

  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

function diasRestantes(iso) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const evento = new Date(iso);
  evento.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((evento - hoy) / 86400000));
}

function mesCorto(iso) {
  return new Date(iso).toLocaleDateString("es-CL", { month: "short" });
}
