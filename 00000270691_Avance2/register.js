const form = document.getElementById("register-form");
const alertBox = document.getElementById("alert");
const submitBtn = form.querySelector("button[type='submit']");

if (hasSession()) location.replace("home.html");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage(alertBox);

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    itsonId: form.itsonId.value.trim(),
    password: form.password.value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Creando cuenta...";

  try {
    await apiRequest("/auth/register", { method: "POST", body: payload });
    showMessage(alertBox, "Cuenta creada. Redirigiendo al login...", "success");
    setTimeout(() => location.replace("login.html"), 1200);
  } catch (error) {
    showMessage(alertBox, error.message, "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Crear cuenta";
  }
});
