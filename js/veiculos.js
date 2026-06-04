let usandoMockVeiculos = false;
let veiculoSelecionadoId = null;

async function carregarCacheVeiculos() {
  if (usandoMockVeiculos) return; 

  try {
    const resposta = await fazerRequisicao("/veiculos");
    if (!resposta.ok) throw new Error("API falhou");
    veiculosCache = await resposta.json();
  } catch (erro) {
    console.warn("Backend offline ou com erro, usando dados mockados de veículos");
    usandoMockVeiculos = true;
    veiculosCache = [
      { id: 1, placa: "AMB-1020", marca: "Mercedes-Benz", modelo: "Sprinter", categoria: "UTI Móvel", ano: 2023, km: 12500, motorista_nome: "Carlos Silva" },
      { id: 2, placa: "HOS-4B21", marca: "Renault", modelo: "Master", categoria: "Suporte Básico", ano: 2022, km: 45000, motorista_nome: "Ana Santos" },
      { id: 3, placa: "MED-9C44", marca: "Fiat", modelo: "Ducato", categoria: "Administrativo", ano: 2021, km: 68000, motorista_nome: "João Pereira" },
      { id: 4, placa: "RES-7A99", marca: "Volkswagen", modelo: "Amarok", categoria: "Apoio Rápido", ano: 2024, km: 2500, motorista_nome: "Marcos Lima" }
    ];
  }
}

async function carregarVeiculos() {
  await carregarCacheVeiculos();
  atualizarTodosSelects();

  const lista = document.getElementById("veiculosList");
  if (!lista) return;
  lista.innerHTML = "";

  const configStatus = [
    { label: "Disponível", class: "badge-available", icon: "ph-check-circle" },
    { label: "Em rota", class: "badge-route", icon: "ph-navigation-arrow" },
    { label: "Emergência", class: "badge-emergency", icon: "ph-warning-circle" },
    { label: "Manutenção", class: "badge-maintenance", icon: "ph-wrench" }
  ];

  veiculosCache.forEach((v, index) => {
    const cartao = document.createElement("div");
    cartao.className = "tracking-card";
    cartao.dataset.id = v.id;
    cartao.classList.toggle("selected", v.id === veiculoSelecionadoId);

    const statusAtual = configStatus[index % configStatus.length];

    cartao.innerHTML = `
      <div class="tc-header">
        <h3>${v.placa}</h3>
        <span class="status-badge ${statusAtual.class}">
          <i class="ph ${statusAtual.icon}"></i> ${statusAtual.label}
        </span>
      </div>
      <div class="tc-image">
        <img src="assets/ambulance.png" alt="Ambulância" />
      </div>
    `;

    cartao.onclick = () => selecionarVeiculo(v.id, statusAtual);
    lista.appendChild(cartao);
  });

  fecharDetalhes('veiculos');
}

function selecionarVeiculo(id, statusAtual) {
  veiculoSelecionadoId = id;
  const v = veiculosCache.find(ve => ve.id === id);
  if (!v) return;

  document.querySelectorAll("#veiculosList .tracking-card").forEach(cartao => {
    cartao.classList.toggle("selected", Number(cartao.dataset.id) === Number(id));
  });

  const el = idDoc => document.getElementById(idDoc);
  if (el("detailPlate")) el("detailPlate").textContent = v.placa;
  
  if (el("detailStatus")) {
    const statusEl = el("detailStatus");
    statusEl.className = `status-badge ${statusAtual.class}`;
    statusEl.innerHTML = `<i class="ph ${statusAtual.icon}"></i> ${statusAtual.label}`;
  }

  if (el("detailModelo")) el("detailModelo").textContent = `${v.marca || ''} ${v.modelo || ''}`;
  if (el("detailCategoria")) el("detailCategoria").textContent = v.categoria || 'Não definida';
  if (el("detailAno")) el("detailAno").textContent = v.ano || '-';
  if (el("detailKm")) el("detailKm").textContent = `${v.km || 0} km`;
  if (el("detailMotorista")) el("detailMotorista").textContent = v.motorista_nome || 'Não atribuído';

  if (el("btnEditVeiculo")) el("btnEditVeiculo").onclick = () => editarVeiculo(v.id);
  if (el("btnDeleteVeiculo")) {
    el("btnDeleteVeiculo").onclick = () => {
      if (confirm(`Tem certeza que deseja remover o veículo ${v.placa}?`)) {
        deletarVeiculo(v.id);
      }
    };
  }

  mostrarDetalhes('veiculos');
}

document.getElementById("addVeiculoBtn").onclick = () => {
  veiculoEditandoId = null;
  limparFormularioVeiculo();
  document.getElementById("saveVeiculo").innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Veículo';
  document.getElementById("veiculoModal").classList.remove("hidden");
};

document.getElementById("cancelVeiculo").onclick = limparFormularioVeiculo;
document.getElementById("closeVeiculoModal").onclick = limparFormularioVeiculo;

document.getElementById("saveVeiculo").onclick = async () => {
  const motoristaId = document.getElementById("inputMotorista").value;
  const motoristaObj = funcionariosCache.find(f => f.id == motoristaId);
  const motoristaNome = motoristaObj ? motoristaObj.nome : "";

  const dados = {
    placa: obterValorInput("inputPlaca"),
    marca: obterValorInput("inputMarca"),
    modelo: obterValorInput("inputModelo"),
    categoria: obterValorInput("inputCategoria"),
    ano: obterValorInput("inputAno"),
    km: obterValorInput("inputKm"),
    motorista_id: motoristaId || null
  };

  const caminho = veiculoEditandoId ? `/veiculos/${veiculoEditandoId}` : "/veiculos";

  try {
    const resposta = await fazerRequisicao(caminho, {
      method: veiculoEditandoId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });
    if (!resposta.ok) throw new Error("Erro na API");
  } catch (erro) {
    console.warn("Backend offline: Salvando no mock local temporário");
    if (usandoMockVeiculos) {
      if (veiculoEditandoId) {
        const idx = veiculosCache.findIndex(v => v.id == veiculoEditandoId);
        if (idx > -1) {
          veiculosCache[idx] = { ...veiculosCache[idx], ...dados, motorista_nome: motoristaNome };
        }
      } else {
        const novoId = veiculosCache.length > 0 ? Math.max(...veiculosCache.map(v => v.id)) + 1 : 1;
        veiculosCache.push({ id: novoId, ...dados, motorista_nome: motoristaNome });
        veiculoSelecionadoId = novoId; 
      }
    }
  }

  limparFormularioVeiculo();
  carregarVeiculos();
};

function limparFormularioVeiculo() {
  ["inputPlaca", "inputMarca", "inputModelo", "inputCategoria", "inputAno", "inputKm", "inputMotorista"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = "";
      el.dataset.id = "";
    }
  });
  document.getElementById("veiculoModal").classList.add("hidden");
}

function editarVeiculo(id) {
  const v = veiculosCache.find(ve => ve.id == id);
  if (!v) return;

  const campoVal = (idCampo, valor) => {
    const el = document.getElementById(idCampo);
    if (el) el.value = valor || "";
  };

  campoVal("inputPlaca", v.placa);
  campoVal("inputMarca", v.marca);
  campoVal("inputModelo", v.modelo);
  campoVal("inputCategoria", v.categoria);
  campoVal("inputAno", v.ano);
  campoVal("inputKm", v.km);

  const motoristaSelect = document.getElementById("inputMotorista");
  if (motoristaSelect) {
    motoristaSelect.value = v.motorista_id || "";
  }

  veiculoEditandoId = id;
  document.getElementById("saveVeiculo").innerHTML = '<i class="ph ph-pencil-simple"></i> Atualizar Veículo';
  document.getElementById("veiculoModal").classList.remove("hidden");
}

async function deletarVeiculo(id) {
  try {
    const resposta = await fazerRequisicao(`/veiculos/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error("Erro na API");
  } catch (erro) {
    console.warn("Backend offline: Removendo do mock local temporário");
    if (usandoMockVeiculos) {
      veiculosCache = veiculosCache.filter(v => v.id != id);
      if (veiculoSelecionadoId == id) veiculoSelecionadoId = null;
    }
  }
  carregarVeiculos();
}

// ----------------------------------------------------
// Seção de Manutenções
// ----------------------------------------------------
let usandoMockManutencoes = false;
let manutencoesCache = [
  { id: 1, veiculo_placa: "AMB-1020", data: "2026-05-10", status: "Concluída", veiculo_id: 1 },
  { id: 2, veiculo_placa: "HOS-4B21", data: "2026-05-15", status: "Em Andamento", veiculo_id: 2 },
  { id: 3, veiculo_placa: "MED-9C44", data: "2026-05-20", status: "Agendada", veiculo_id: 3 }
];

async function carregarManutencoes() {
  await carregarCacheVeiculos();

  let dados = [];
  try {
    if (usandoMockManutencoes) {
      dados = manutencoesCache;
    } else {
      dados = await fazerRequisicao("/manutencoes").then(r => {
        if (!r.ok) throw new Error("API falhou");
        return r.json();
      });
    }
  } catch (erro) {
    console.warn("Backend offline, usando dados mockados de manutenções");
    usandoMockManutencoes = true;
    dados = manutencoesCache;
  }

  const lista = document.getElementById("manutencoesList");
  if (!lista) return;
  lista.innerHTML = "";

  dados.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p>${m.veiculo_placa} - ${m.data} - ${m.status}</p>
      <button onclick="editarManutencao(${m.id})">Editar</button>
      <button onclick="deletarManutencao(${m.id})">Excluir</button>
    `;
    lista.appendChild(div);
  });
}

document.getElementById("addManutencaoBtn").onclick = () => {
  manutencaoEditandoId = null;
  document.getElementById("manutencaoForm").classList.remove("hidden");
};

document.getElementById("cancelManutencao").onclick = () => {
  document.getElementById("manutencaoForm").classList.add("hidden");
};

document.getElementById("saveManutencao").onclick = async () => {
  const veiculoId = document.getElementById("inputVeiculoManut").value;
  if (!veiculoId) return mostrarToast("Selecione um veículo válido", "warning");

  const veiculo = veiculosCache.find(v => v.id == veiculoId);
  const placa = veiculo ? veiculo.placa : "";

  const dados = {
    veiculo_id: veiculoId,
    veiculo_placa: placa,
    data: inputDataManut.value,
    status: inputStatusManut.value
  };

  const caminho = manutencaoEditandoId ? `/manutencoes/${manutencaoEditandoId}` : "/manutencoes";

  try {
    const resposta = await fazerRequisicao(caminho, {
      method: manutencaoEditandoId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });
    if (!resposta.ok) throw new Error("API falhou");
  } catch (erro) {
    console.warn("Backend offline, salvando manutenção no cache local");
    if (manutencaoEditandoId) {
      const idx = manutencoesCache.findIndex(m => m.id == manutencaoEditandoId);
      if (idx > -1) manutencoesCache[idx] = { ...manutencoesCache[idx], ...dados };
    } else {
      const novoId = manutencoesCache.length > 0 ? Math.max(...manutencoesCache.map(m => m.id)) + 1 : 1;
      manutencoesCache.push({ id: novoId, ...dados });
    }
  }

  document.getElementById("manutencaoForm").classList.add("hidden");
  carregarManutencoes();
};

async function editarManutencao(id) {
  let m;
  try {
    if (usandoMockManutencoes) {
      m = manutencoesCache.find(m => m.id == id);
    } else {
      const dados = await fazerRequisicao("/manutencoes").then(r => r.json());
      m = dados.find(m => m.id == id);
    }
  } catch (erro) {
    m = manutencoesCache.find(m => m.id == id);
  }
  if (!m) return;

  const inputVeiculoManutSelect = document.getElementById("inputVeiculoManut");
  if (inputVeiculoManutSelect) {
    inputVeiculoManutSelect.value = m.veiculo_id || "";
  }
  inputDataManut.value = m.data;
  inputStatusManut.value = m.status;

  manutencaoEditandoId = id;
  document.getElementById("manutencaoForm").classList.remove("hidden");
}

async function deletarManutencao(id) {
  try {
    const resposta = await fazerRequisicao(`/manutencoes/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error("Erro na API");
  } catch (erro) {
    console.warn("Backend offline, removendo manutenção do cache local");
    manutencoesCache = manutencoesCache.filter(m => m.id != id);
  }
  carregarManutencoes();
}

// ----------------------------------------------------
// Seção de Abastecimentos
// ----------------------------------------------------
let usandoMockAbastecimentos = false;
let abastecimentosCache = [
  { id: 1, veiculo_placa: "AMB-1020", data: "2026-05-12", tipo_combustivel: "diesel", posto: "Ipiranga", litros: "50", valor: "300", veiculo_id: 1 },
  { id: 2, veiculo_placa: "HOS-4B21", data: "2026-05-18", tipo_combustivel: "gasolina", posto: "Shell", litros: "40", valor: "240", veiculo_id: 2 }
];

async function carregarAbastecimentos() {
  await carregarCacheVeiculos();

  let dados = [];
  try {
    if (usandoMockAbastecimentos) {
      dados = abastecimentosCache;
    } else {
      dados = await fazerRequisicao("/abastecimentos").then(r => {
        if (!r.ok) throw new Error("API falhou");
        return r.json();
      });
    }
  } catch (erro) {
    console.warn("Backend offline, usando dados mockados de abastecimentos");
    usandoMockAbastecimentos = true;
    dados = abastecimentosCache;
  }

  const lista = document.getElementById("abastecimentosList");
  if (!lista) return;
  lista.innerHTML = "";

  dados.forEach(a => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p>${a.veiculo_placa} - ${a.data} - ${a.tipo_combustivel}</p>
      <p>Posto: ${a.posto || "N/A"} | ${a.litros}L - R$${a.valor}</p>
      <button onclick="editarAbastecimento(${a.id})">Editar</button>
      <button onclick="deletarAbastecimento(${a.id})">Excluir</button>
    `;
    lista.appendChild(div);
  });
}

async function editarAbastecimento(id) {
  let a;
  try {
    if (usandoMockAbastecimentos) {
      a = abastecimentosCache.find(a => a.id == id);
    } else {
      const dados = await fazerRequisicao("/abastecimentos").then(r => r.json());
      a = dados.find(a => a.id == id);
    }
  } catch (erro) {
    a = abastecimentosCache.find(a => a.id == id);
  }
  if (!a) return;

  const inputVeiculoAbastSelect = document.getElementById("inputVeiculoAbast");
  if (inputVeiculoAbastSelect) {
    inputVeiculoAbastSelect.value = a.veiculo_id || "";
  }
  inputDataAbast.value = a.data;
  
  const combEl = document.getElementById("combustivel");
  if (combEl) combEl.value = a.tipo_combustivel;

  const postoInput = document.getElementById("inputPosto");
  if (postoInput) postoInput.value = a.posto || "";
  
  const inputLitros = document.getElementById("inputLitros");
  if (inputLitros) inputLitros.value = a.litros || "";

  const inputValor = document.getElementById("inputValor");
  if (inputValor) inputValor.value = a.valor || "";

  abastecimentoEditandoId = id;
  document.getElementById("abastecimentoForm").classList.remove("hidden");
}

async function deletarAbastecimento(id) {
  try {
    const resposta = await fazerRequisicao(`/abastecimentos/${id}`, { method: "DELETE" });
    if (!resposta.ok) throw new Error("API falhou");
  } catch (erro) {
    console.warn("Backend offline, removendo abastecimento do cache local");
    abastecimentosCache = abastecimentosCache.filter(a => a.id != id);
  }
  carregarAbastecimentos();
}

document.getElementById("addAbastecimentoBtn").onclick = () => {
  abastecimentoEditandoId = null;
  limparFormularioAbastecimento();
  document.getElementById("abastecimentoForm").classList.remove("hidden");
};

document.getElementById("cancelAbastecimento").onclick = limparFormularioAbastecimento;

function limparFormularioAbastecimento() {
  ["inputVeiculoAbast", "inputDataAbast", "inputPosto", "inputLitros", "inputValor"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = "";
      el.dataset.id = "";
    }
  });

  const comb = document.getElementById("combustivel");
  if (comb) comb.value = "";
  document.getElementById("abastecimentoForm").classList.add("hidden");
}

document.getElementById("saveAbastecimento").onclick = async () => {
  const veiculoId = document.getElementById("inputVeiculoAbast").value;
  if (!veiculoId) return mostrarToast("Selecione um veículo válido", "warning");

  const veiculo = veiculosCache.find(v => v.id == veiculoId);
  const placa = veiculo ? veiculo.placa : "";
  const tipoCombustivel = document.getElementById("combustivel").value;

  const dados = {
    veiculo_id: veiculoId,
    veiculo_placa: placa,
    data: obterValorInput("inputDataAbast"),
    tipo_combustivel: tipoCombustivel,
    posto: obterValorInput("inputPosto"),
    litros: obterValorInput("inputLitros"),
    valor: obterValorInput("inputValor")
  };

  const caminho = abastecimentoEditandoId ? `/abastecimentos/${abastecimentoEditandoId}` : "/abastecimentos";

  try {
    const resposta = await fazerRequisicao(caminho, {
      method: abastecimentoEditandoId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });
    if (!resposta.ok) throw new Error("API falhou");
  } catch (erro) {
    console.warn("Backend offline, salvando abastecimento no cache local");
    if (abastecimentoEditandoId) {
      const idx = abastecimentosCache.findIndex(a => a.id == abastecimentoEditandoId);
      if (idx > -1) abastecimentosCache[idx] = { ...abastecimentosCache[idx], ...dados };
    } else {
      const novoId = abastecimentosCache.length > 0 ? Math.max(...abastecimentosCache.map(a => a.id)) + 1 : 1;
      abastecimentosCache.push({ id: newId, ...dados });
    }
  }

  limparFormularioAbastecimento();
  carregarAbastecimentos();
};
