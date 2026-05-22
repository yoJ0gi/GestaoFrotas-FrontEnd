const senhaInput = document.getElementById("senha");
const toggleSenha = document.getElementById("toggleSenha");
const form = document.getElementById("loginForm");
const erro = document.getElementById("erro");

toggleSenha.addEventListener("click", () => {
  if (senhaInput.type === "password") {
    senhaInput.type = "text";
  } else {
    senhaInput.type = "password";
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const senha = senhaInput.value;

  if (email === "" || senha === "") {
    erro.textContent = "Preencha todos os campos!";
    return;
  }

  if (email === "admin@email.com" && senha === "admin123") {
    alert("Login realizado!");
    // window.location.href = "dashboard.html";
  } else {
    erro.textContent = "E-mail ou senha incorretos!";
  }
});