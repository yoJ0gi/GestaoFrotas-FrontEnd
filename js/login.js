if (localStorage.getItem("token")) {
  window.location.href = "index.html";
}

const campoSenha = document.getElementById("senha");
const alternarSenhaBtn = document.getElementById("toggleSenha");
const formularioLogin = document.getElementById("loginForm");
const mensagemErro = document.getElementById("erro");

// Alternar visibilidade da senha
alternarSenhaBtn.onclick = () => {
  const mostrar = campoSenha.type === "password";
  campoSenha.type = mostrar ? "text" : "password";
  alternarSenhaBtn.textContent = mostrar ? "🙈" : "👁";
};

// Submissão do login
formularioLogin.onsubmit = async (evento) => {
  evento.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const senha = campoSenha.value;

  if (!usuario || !senha) {
    mensagemErro.textContent = "Preencha todos os campos!";
    return;
  }

  const botaoLogin = formularioLogin.querySelector(".btn-login");
  const textoOriginal = botaoLogin.textContent;

  botaoLogin.textContent = "Entrando...";
  botaoLogin.disabled = true;
  mensagemErro.textContent = "";

  try {
    // Verificação para credenciais admin mockadas
    if ((usuario === "admin" || usuario === "admin@email.com") && senha === "admin123") {
      localStorage.setItem("token", "MOCKED_JWT_TOKEN_MEDFLEET_2026_SESSION");
      window.location.href = "index.html";
      return;
    }

    const resposta = await fetch("/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usuario, password: senha })
    });

    if (!resposta.ok) {
      mensagemErro.textContent = "Usuário ou senha inválidos.";
      return;
    }

    const dados = await resposta.json();
    localStorage.setItem("token", dados.token);
    window.location.href = "index.html";
  } catch (erro) {
    console.error("Erro ao realizar login:", erro);
    mensagemErro.textContent = "Não foi possível conectar ao servidor backend.";
  } finally {
    botaoLogin.textContent = textoOriginal;
    botaoLogin.disabled = false;
  }
};