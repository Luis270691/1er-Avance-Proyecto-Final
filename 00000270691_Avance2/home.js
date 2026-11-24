const app = document.getElementById("app");
const statusEl = document.getElementById("status");
const emptyEl = document.getElementById("empty");
const listEl = document.getElementById("projects");
const template = document.getElementById("project-template");
const dialog = document.getElementById("project-dialog");
const form = document.getElementById("project-form");
const dialogTitle = document.getElementById("dialog-title");
const formAlert = document.getElementById("form-alert");
const saveBtn = document.getElementById("save-btn");

let projects = [];
let editing = null;

function logout() {
  clearSession();
  location.replace("login.html");
}

function handleError(error, target) {
  if ([401, 403].includes(error.status)) return logout();
  showMessage(target, error.message, "error");
}

function renderUser() {
  const user = getUser() || {};
  const name = user.name || "Usuario";
  document.getElementById("user-name").textContent = name;
  document.getElementById("avatar").textContent = name.slice(0, 2).toUpperCase();
}

function renderProjects() {
  listEl.replaceChildren();
  emptyEl.hidden = projects.length > 0;

  projects.forEach((project) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".project-title").textContent = project.title;
    node.querySelector(".project-desc").textContent = project.description;

    const tags = node.querySelector(".tags");
    (project.technologies || []).forEach((tech) => {
      const li = document.createElement("li");
      li.textContent = tech;
      tags.append(li);
    });

    const link = node.querySelector(".project-link");
    if (/^https?:\/\//i.test(project.repository || "")) {
      link.href = project.repository;
      link.hidden = false;
    }

    node.querySelector("[data-action='edit']").addEventListener("click", () => openForm(project));
    node.querySelector("[data-action='delete']").addEventListener("click", () => removeProject(project));
    listEl.append(node);
  });
}

async function loadProjects() {
  statusEl.textContent = "Cargando proyectos...";
  statusEl.className = "status";
  statusEl.hidden = false;
  try {
    const data = await apiRequest("/projects", { auth: true });
    projects = Array.isArray(data) ? data : data.projects || [];
    statusEl.hidden = true;
    renderProjects();
  } catch (error) {
    if ([400, 401, 403].includes(error.status)) return logout();
    showMessage(statusEl, error.message, "error");
  }
}

function openForm(project = null) {
  editing = project;
  form.reset();
  hideMessage(formAlert);
  dialogTitle.textContent = project ? "Actualizar proyecto" : "Agregar proyecto";

  if (project) {
    form.title.value = project.title;
    form.description.value = project.description;
    form.technologies.value = (project.technologies || []).join(", ");
    form.repository.value = project.repository || "";
  }
  dialog.showModal();
}

function readForm() {
  const payload = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    technologies: form.technologies.value
      .split(",")
      .map((tech) => tech.trim())
      .filter(Boolean),
    images: editing ? editing.images || [] : [],
  };
  const repository = form.repository.value.trim();
  if (repository) payload.repository = repository;

  const user = getUser();
  if (user && user.id) payload.userId = user.id;
  return payload;
}

async function saveProject(event) {
  event.preventDefault();
  hideMessage(formAlert);
  saveBtn.disabled = true;

  try {
    if (editing) {
      await apiRequest(`/projects/${editing._id}`, { method: "PUT", body: readForm(), auth: true });
    } else {
      await apiRequest("/projects", { method: "POST", body: readForm(), auth: true });
    }
    dialog.close();
    await loadProjects();
  } catch (error) {
    handleError(error, formAlert);
  } finally {
    saveBtn.disabled = false;
  }
}

async function removeProject(project) {
  if (!confirm(`¿Eliminar el proyecto "${project.title}"?`)) return;
  try {
    await apiRequest(`/projects/${project._id}`, { method: "DELETE", auth: true });
    await loadProjects();
  } catch (error) {
    handleError(error, statusEl);
    statusEl.hidden = false;
  }
}

if (requireAuth()) {
  app.hidden = false;
  renderUser();
  loadProjects();

  document.getElementById("logout").addEventListener("click", logout);
  document.getElementById("add-btn").addEventListener("click", () => openForm());
  document.getElementById("cancel-btn").addEventListener("click", () => dialog.close());
  form.addEventListener("submit", saveProject);
}
