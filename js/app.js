// ===============================
// INICIO
// ===============================

initLogin();
checkActiveStudent();

// ===============================
// AUTO LOGIN
// ===============================

function checkActiveStudent() {
  const activeStudent = JSON.parse(localStorage.getItem("active_student"));

  if (!activeStudent) return;

  saveSession(activeStudent);

  if (activeStudent.group_id) {
    location.href = "pages/panel.html";
  } else {
    location.href = "pages/grupos.html";
  }
}

// ===============================
// LOGIN
// ===============================

function initLogin() {
  const loginBtn = document.getElementById("loginBtn");

  if (!loginBtn) return;

  loginBtn.addEventListener("click", handleLogin);
}

async function handleLogin() {
  const phone = getPhoneInput();

  if (!phone) {
    alert("Ingresa tu número de teléfono.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("students")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("Error al iniciar sesión:", error.message);
    alert("Error al iniciar sesión.");
    return;
  }

  if (!data) {
    alert("No estás registrado. Debes crear una cuenta primero.");
    return;
  }

  saveSession(data);

  if (data.group_id) {
    location.href = "pages/panel.html";
  } else {
    location.href = "pages/grupos.html";
  }
}

// ===============================
// SESIÓN
// ===============================

function saveSession(student) {
  localStorage.setItem("active_student", JSON.stringify(student));

  const state = getState();

  state.session = {
    role: student.role || "student",
    user: student.full_name,
    phone: student.phone,
    studentId: student.id,
    careerId: student.career_id,
    sectionId: student.section_id,
  };

  state.selected.careerId = student.career_id;
  state.selected.sectionId = student.section_id;
  state.selected.groupId = student.group_id || null;

  setState(state);
}

// ===============================
// OBTENER DATOS DEL FORM
// ===============================

function getPhoneInput() {
  const input = document.getElementById("userInput");
  return input?.value.trim() || "";
}