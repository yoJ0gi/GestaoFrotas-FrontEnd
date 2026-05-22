// Redireciona se o usuário já estiver logado
if (localStorage.getItem("medfleet_token")) {
  window.location.href = "index.html";
}

const senhaInput = document.getElementById("senha");
const toggleSenha = document.getElementById("toggleSenha");
const form = document.getElementById("loginForm");
const erro = document.getElementById("erro");

toggleSenha.addEventListener("click", () => {
  if (senhaInput.type === "password") {
    senhaInput.type = "text";
    toggleSenha.textContent = "🙈";
  } else {
    senhaInput.type = "password";
    toggleSenha.textContent = "👁";
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = senhaInput.value;

  if (email === "" || senha === "") {
    erro.textContent = "Preencha todos os campos!";
    return;
  }

  // Credenciais de administrador fornecidas pelo template original
  if (email === "admin@email.com" && senha === "admin123") {
    erro.textContent = "";
    
    // Gerar e armazenar token fake no localStorage
    localStorage.setItem("medfleet_token", "MOCKED_JWT_TOKEN_MEDFLEET_2026_SESSION");
    
    // Redirecionar para o painel principal
    window.location.href = "index.html";
  } else {
    erro.textContent = "E-mail ou senha incorretos!";
  }
});
