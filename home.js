const app = document.getElementById("app");
const dialog = document.getElementById("project-dialog");
const form = document.getElementById("project-form");

function logout() {
  clearSession();
  location.replace("index.html");
}

function renderUser() {
  const user = getUser() || {};
  const name = user.name || "Usuario";
  document.getElementById("user-name").textContent = name;
  document.getElementById("avatar").textContent = name.slice(0, 2).toUpperCase();
}

if (requireAuth()) {
  app.hidden = false;
  renderUser();

  document.getElementById("logout").addEventListener("click", logout);
  document.getElementById("add-btn").addEventListener("click", () => dialog.showModal());
  document.getElementById("cancel-btn").addEventListener("click", () => dialog.close());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    dialog.close();
  });
}
