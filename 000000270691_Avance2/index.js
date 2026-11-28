const form = document.getElementById("login-form");
const alertBox = document.getElementById("alert");
const submitBtn = form.querySelector("button[type='submit']");

if (hasSession()) location.replace("home.html");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage(alertBox);

  const email = form.email.value.trim();
  const password = form.password.value;

  submitBtn.disabled = true;
  submitBtn.textContent = "Entrando...";

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    saveSession(data.token, data.user);
    location.replace("home.html");
  } catch (error) {
    showMessage(alertBox, error.message, "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
  }
});
