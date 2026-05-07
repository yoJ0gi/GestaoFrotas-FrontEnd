const API = "http://localhost:3000/api";

async function carregar() {
  const res = await fetch(API + "/veiculos");
  const data = await res.json();

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  data.forEach(v => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${v.nome} - ${v.placa}
      <button onclick="editar(${v.id}, '${v.nome}', '${v.placa}')">Editar</button>
      <button onclick="deletar(${v.id})">X</button>
    `;
    lista.appendChild(li);
  });
}

async function addVeiculo() {
  const nome = document.getElementById("nome").value;
  const placa = document.getElementById("placa").value;

  await fetch(API + "/veiculos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, placa })
  });

  carregar();
}

async function deletar(id) {
  await fetch(API + "/veiculos/" + id, {
    method: "DELETE"
  });

  carregar();
}

async function editar(id, nome, placa) {
  const newNome = prompt('Novo nome:', nome);
  const newPlaca = prompt('Nova placa:', placa);

  if (newNome && newPlaca) {
    await fetch(API + "/veiculos/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: newNome, placa: newPlaca })
    });

    carregar();
  }
}

carregar();