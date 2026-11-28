const app = document.getElementById("app");
const statusEl = document.getElementById("status");
const emptyEl = document.getElementById("empty");
const listEl = document.getElementById("projects");
const template = document.getElementById("project-template");
const dialog = document.getElementById("project-dialog");
const dialogTitle = document.getElementById("dialog-title");
const form = document.getElementById("project-form");
const formAlert = document.getElementById("form-alert");
const saveBtn = document.getElementById("save-btn");

let editing = null;

function logout() {
  clearSession();
  location.replace("index.html");
}

function isAuthError(error) {
  return [401, 403].includes(error.status);
}

function renderUser() {
  const user = getUser() || {};
  const name = user.name || "Usuario";
  document.getElementById("user-name").textContent = name;
  document.getElementById("avatar").textContent = name.slice(0, 2).toUpperCase();
}

function renderProjects(projects) {
  listEl.replaceChildren();
  emptyEl.hidden = projects.length > 0;

  projects.forEach((project) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".project-title").textContent = project.title;
    node.querySelector(".project-desc").textContent = project.description;

    const tags = node.querySelector(".tags");
    (project.technologies || []).forEach((tech) => {
      const item = document.createElement("li");
      item.textContent = tech;
      tags.append(item);
    });

    const link = node.querySelector(".project-link");
    if (/^https?:\/\//i.test(project.repository || "")) {
      link.href = project.repository;
    } else {
      link.remove();
    }

    node.querySelector("[data-action='edit']").addEventListener("click", () => openEdit(project));
    node.querySelector("[data-action='delete']").addEventListener("click", () => removeProject(project));
    listEl.append(node);
  });
}

async function loadProjects() {
  showMessage(statusEl, "Cargando proyectos...", "info");
  try {
    const data = await apiRequest("/projects", { auth: true });
    const projects = Array.isArray(data) ? data : data.projects || [];
    hideMessage(statusEl);
    renderProjects(projects);
  } catch (error) {
    if (isAuthError(error) || error.status === 400) return logout();
    showMessage(statusEl, error.message, "error");
  }
}

function fillForm(project) {
  form.title.value = project.title || "";
  form.description.value = project.description || "";
  form.technologies.value = (project.technologies || []).join(", ");
  form.repository.value = project.repository || "";
}

function openCreate() {
  editing = null;
  form.reset();
  hideMessage(formAlert);
  dialogTitle.textContent = "Agregar proyecto";
  dialog.showModal();
}

async function openEdit(summary) {
  hideMessage(statusEl);
  try {
    const project = await apiRequest(`/projects/${summary._id}`, { auth: true });
    editing = project && project._id ? project : summary;
  } catch (error) {
    if (isAuthError(error)) return logout();
    editing = summary;
  }
  form.reset();
  hideMessage(formAlert);
  fillForm(editing);
  dialogTitle.textContent = "Actualizar proyecto";
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
  payload.userId = editing && editing.userId ? editing.userId : user && user.id;
  return payload;
}

async function saveProject(event) {
  event.preventDefault();
  hideMessage(formAlert);
  saveBtn.disabled = true;
  saveBtn.textContent = "Guardando...";

  try {
    const path = editing ? `/projects/${editing._id}` : "/projects";
    await apiRequest(path, {
      method: editing ? "PUT" : "POST",
      body: readForm(),
      auth: true,
    });
    dialog.close();
    await loadProjects();
  } catch (error) {
    if (isAuthError(error)) return logout();
    showMessage(formAlert, error.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Guardar";
  }
}

async function removeProject(project) {
  if (!confirm(`¿Eliminar el proyecto "${project.title}"?`)) return;
  try {
    await apiRequest(`/projects/${project._id}`, { method: "DELETE", auth: true });
    await loadProjects();
  } catch (error) {
    if (isAuthError(error)) return logout();
    showMessage(statusEl, error.message, "error");
  }
}

if (requireAuth()) {
  app.hidden = false;
  renderUser();
  loadProjects();

  document.getElementById("logout").addEventListener("click", logout);
  document.getElementById("add-btn").addEventListener("click", openCreate);
  document.getElementById("cancel-btn").addEventListener("click", () => dialog.close());
  form.addEventListener("submit", saveProject);
}
