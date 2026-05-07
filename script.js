const API = "http://localhost:3000/api";

let motoristaEditandoId = null;
let veiculoEditandoId = null;
let manutencaoEditandoId = null;
let abastecimentoEditandoId = null;

let motoristasCache = [];
let veiculosCache = [];

document.querySelectorAll(".sidebar nav a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const target = link.getAttribute("data-target");
    showPage(target);
  });
});

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".sidebar nav a").forEach((l) => l.classList.remove("active"));

  document.getElementById(pageId).classList.add("active");
  document.querySelector(`[data-target="${pageId}"]`).classList.add("active");

  loadPageData(pageId);
}

document.getElementById("themeToggleBtn").onclick = () => {
  document.body.classList.toggle("dark");
};

let usingMockMotoristas = false;

async function loadMotoristasCache() {
  if (usingMockMotoristas) return;
  try {
    const res = await fetch(API + "/motoristas");
    if (!res.ok) throw new Error("API failed");
    motoristasCache = await res.json();
  } catch (err) {
    console.warn("Backend offline, mock data para motoristas");
    usingMockMotoristas = true;
    motoristasCache = [
      { id: 1, nome: "Carlos Silva", idade: 45, cpf: "111.222.333-44", cnh: "123456789", validade_cnh: "2026-10-12", telefone: "(11) 99999-1111", email: "carlos@exemplo.com" },
      { id: 2, nome: "Ana Santos", idade: 38, cpf: "222.333.444-55", cnh: "987654321", validade_cnh: "2025-05-20", telefone: "(11) 98888-2222", email: "ana@exemplo.com" }
    ];
  }
}

let usingMockVeiculos = false;

async function loadVeiculosCache() {
  if (usingMockVeiculos) return; // Não sobrescrever o mock se já carregou

  try {
    const res = await fetch(API + "/veiculos");
    if (!res.ok) throw new Error("API failed");
    veiculosCache = await res.json();
  } catch (err) {
    console.warn("Backend offline ou erro, usando mock data para veículos");
    usingMockVeiculos = true;
    veiculosCache = [
      { id: 1, placa: "AMB-1020", marca: "Mercedes-Benz", modelo: "Sprinter", categoria: "UTI Móvel", ano: 2023, km: 12500, motorista_nome: "Carlos Silva" },
      { id: 2, placa: "HOS-4B21", marca: "Renault", modelo: "Master", categoria: "Suporte Básico", ano: 2022, km: 45000, motorista_nome: "Ana Santos" },
      { id: 3, placa: "MED-9C44", marca: "Fiat", modelo: "Ducato", categoria: "Administrativo", ano: 2021, km: 68000, motorista_nome: "João Pereira" },
      { id: 4, placa: "RES-7A99", marca: "Volkswagen", modelo: "Amarok", categoria: "Apoio Rápido", ano: 2024, km: 2500, motorista_nome: "Marcos Lima" }
    ];
  }
}

function setupAutocomplete(inputId, listaId, getData, format) {
  const input = document.getElementById(inputId);
  const lista = document.getElementById(listaId);

  input.addEventListener("input", () => {
    const termo = input.value.toLowerCase();
    lista.innerHTML = "";

    if (!termo) {
      lista.classList.add("hidden");
      return;
    }

    const filtrados = getData().filter(item =>
      format(item).toLowerCase().includes(termo)
    );

    filtrados.forEach(item => {
      const li = document.createElement("li");
      li.textContent = format(item);

      li.onclick = () => {
        input.value = format(item);
        input.dataset.id = item.id;
        lista.classList.add("hidden");
      };

      lista.appendChild(li);
    });

    lista.classList.remove("hidden");
  });
}

function initAutocompletes() {
  setupAutocomplete(
    "inputMotorista",
    "motoristaSugestoes",
    () => motoristasCache,
    (m) => `${m.nome} (${m.cpf || "sem CPF"})`
  );

  setupAutocomplete(
    "inputVeiculoManut",
    "veiculoSugestoesManut",
    () => veiculosCache,
    (v) => `${v.placa} - ${v.modelo}`
  );

  setupAutocomplete(
    "inputVeiculoAbast",
    "veiculoSugestoesAbast",
    () => veiculosCache,
    (v) => `${v.placa} - ${v.modelo}`
  );
}

async function loadDashboard() {
  try {
    const [v, m, man, ab] = await Promise.all([
      fetch(API + "/veiculos").then(r => r.json()).catch(() => veiculosCache),
      fetch(API + "/motoristas").then(r => r.json()).catch(() => []),
      fetch(API + "/manutencoes").then(r => r.json()).catch(() => []),
      fetch(API + "/abastecimentos").then(r => r.json()).catch(() => [])
    ]);

    totalVeiculos.textContent = v.length;
    totalMotoristas.textContent = m.length;
    totalManutencoes.textContent = man.length;
    totalAbastecimentos.textContent = ab.length;
  } catch(e) {}
}

let selectedVehicleId = null;

async function loadVeiculos() {
  await loadVeiculosCache();

  const list = document.getElementById("veiculosList");
  list.innerHTML = "";

  const statuses = [
    { label: "Disponível", class: "badge-available", icon: "ph-check-circle" },
    { label: "Em rota", class: "badge-route", icon: "ph-navigation-arrow" },
    { label: "Emergência", class: "badge-emergency", icon: "ph-warning-circle" },
    { label: "Manutenção", class: "badge-maintenance", icon: "ph-wrench" }
  ];

  veiculosCache.forEach((v, index) => {
    const card = document.createElement("div");
    card.className = "tracking-card";
    if (v.id === selectedVehicleId) card.classList.add("selected");

    const status = statuses[index % statuses.length];

    const eta = Math.floor(Math.random() * 60) + 10;
    const distance = Math.floor(Math.random() * 200) + 20;

    card.innerHTML = `
      <div class="tc-header">
        <h3>${v.placa}</h3>
        <span class="status-badge ${status.class}">
          <i class="ph ${status.icon}"></i> ${status.label}
        </span>
      </div>
      <div class="tc-image">
        <img src="ambulance.png" alt="Ambulância" />
      </div>
    `;

    card.onclick = () => selectVehicle(v.id, status);

    list.appendChild(card);
  });

  if (!selectedVehicleId && veiculosCache.length > 0) {
    selectedVehicleId = veiculosCache[0].id;
    selectVehicle(selectedVehicleId, statuses[0], true);
  } else if (selectedVehicleId && veiculosCache.length > 0) {
    // Força a atualização do painel da direita com os dados novos em caso de edição
    const currentVIdx = veiculosCache.findIndex(v => v.id === selectedVehicleId);
    if(currentVIdx > -1) {
       selectVehicle(selectedVehicleId, statuses[currentVIdx % statuses.length], true);
    }
  } else if (veiculosCache.length === 0) {
    // Se excluiu o último, limpa a tela direita
    document.getElementById("detailPlate").textContent = "Nenhum veículo selecionado";
    document.getElementById("detailStatus").innerHTML = "";
    document.getElementById("detailStatus").className = "status-badge";
    const el = docId => document.getElementById(docId);
    if(el("detailModelo")) el("detailModelo").textContent = "-";
    if(el("detailCategoria")) el("detailCategoria").textContent = "-";
    if(el("detailAno")) el("detailAno").textContent = "-";
    if(el("detailKm")) el("detailKm").textContent = "-";
    if(el("detailMotorista")) el("detailMotorista").textContent = "-";
  }
}

function selectVehicle(id, status, skipRender = false) {
  selectedVehicleId = id;
  const v = veiculosCache.find(ve => ve.id === id);
  if (!v) return;

  if (!skipRender) {
    loadVeiculos();
  } else {
    // Just visually update the first card if skipRender is true
    const firstCard = document.querySelector('.tracking-card');
    if(firstCard) firstCard.classList.add('selected');
  }

  const detailPlate = document.getElementById("detailPlate");
  if(detailPlate) detailPlate.textContent = v.placa;
  
  const detailStatus = document.getElementById("detailStatus");
  if(detailStatus) {
    detailStatus.className = `status-badge ${status.class}`;
    detailStatus.innerHTML = `<i class="ph ${status.icon}"></i> ${status.label}`;
  }

  const el = docId => document.getElementById(docId);
  if(el("detailModelo")) el("detailModelo").textContent = `${v.marca || ''} ${v.modelo || ''}`;
  if(el("detailCategoria")) el("detailCategoria").textContent = v.categoria || 'Não definida';
  if(el("detailAno")) el("detailAno").textContent = v.ano || '-';
  if(el("detailKm")) el("detailKm").textContent = `${v.km || 0} km`;
  if(el("detailMotorista")) el("detailMotorista").textContent = v.motorista_nome || 'Não atribuído';

  const btnEdit = el("btnEditVeiculo");
  if(btnEdit) btnEdit.onclick = () => editVeiculo(v.id);

  const btnDel = el("btnDeleteVeiculo");
  if(btnDel) btnDel.onclick = () => {
    if(confirm(`Tem certeza que deseja remover o veículo ${v.placa}?`)) {
      deleteVeiculo(v.id);
    }
  };

  const btnLigar = document.querySelector(".btn-outline-primary");
  if(btnLigar) btnLigar.onclick = () => alert(`Iniciando chamada para motorista: ${v.motorista_nome || 'Desconhecido'}`);

  const btnMsg = document.querySelector(".btn-primary");
  if(btnMsg) btnMsg.onclick = () => alert(`Abrindo chat com motorista: ${v.motorista_nome || 'Desconhecido'}`);
}

document.getElementById("addVeiculoBtn").onclick = () => {
  veiculoEditandoId = null;
  resetVeiculoForm();
  
  // Limpa também o texto do botão para indicar "Salvar" ao invés de edição antiga
  document.getElementById("saveVeiculo").innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Veículo';
  
  document.getElementById("veiculoModal").classList.remove("hidden");
};

document.getElementById("cancelVeiculo").onclick = resetVeiculoForm;
document.getElementById("closeVeiculoModal").onclick = resetVeiculoForm;

document.getElementById("saveVeiculo").onclick = async () => {
  const motoristaId = document.getElementById("inputMotorista").dataset.id;

  const data = {
    placa: inputValue("inputPlaca"),
    marca: inputValue("inputMarca"),
    modelo: inputValue("inputModelo"),
    categoria: inputValue("inputCategoria"),
    ano: inputValue("inputAno"),
    km: inputValue("inputKm"),
    motorista_id: motoristaId || null
  };

  const method = veiculoEditandoId ? "PUT" : "POST";
  const url = veiculoEditandoId ? `${API}/veiculos/${veiculoEditandoId}` : `${API}/veiculos`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("API Error");
  } catch (err) {
    console.warn("API Offline: Salvando veículo no mock temporário");
    if (usingMockVeiculos) {
      if (veiculoEditandoId) {
        const idx = veiculosCache.findIndex(v => v.id == veiculoEditandoId);
        if (idx > -1) {
          veiculosCache[idx] = { ...veiculosCache[idx], ...data, motorista_nome: document.getElementById("inputMotorista").value };
        }
      } else {
        const newId = veiculosCache.length > 0 ? Math.max(...veiculosCache.map(v => v.id)) + 1 : 1;
        veiculosCache.push({ id: newId, ...data, motorista_nome: document.getElementById("inputMotorista").value });
        
        // Auto-select o veículo recém-criado
        selectedVehicleId = newId; 
      }
    }
  }

  resetVeiculoForm();
  loadVeiculos();
};

function resetVeiculoForm() {
  ["inputPlaca", "inputMarca", "inputModelo", "inputCategoria", "inputAno", "inputKm", "inputMotorista"].forEach(id => {
    const el = document.getElementById(id);
    el.value = "";
    el.dataset.id = "";
  });

  document.getElementById("veiculoModal").classList.add("hidden");
}

async function editVeiculo(id) {
  const v = veiculosCache.find(v => v.id == id);

  document.getElementById("inputPlaca").value = v.placa || "";
  document.getElementById("inputMarca").value = v.marca || "";
  document.getElementById("inputModelo").value = v.modelo || "";
  document.getElementById("inputCategoria").value = v.categoria || "";
  document.getElementById("inputAno").value = v.ano || "";
  document.getElementById("inputKm").value = v.km || "";

  const motoristaInput = document.getElementById("inputMotorista");
  motoristaInput.value = v.motorista_nome || "";
  motoristaInput.dataset.id = v.motorista_id || "";

  veiculoEditandoId = id;
  document.getElementById("saveVeiculo").innerHTML = '<i class="ph ph-pencil-simple"></i> Atualizar Veículo';
  document.getElementById("veiculoModal").classList.remove("hidden");
}

async function deleteVeiculo(id) {
  try {
    const res = await fetch(`${API}/veiculos/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("API Error");
  } catch(e) {
    if(usingMockVeiculos) {
      veiculosCache = veiculosCache.filter(v => v.id != id);
      if (selectedVehicleId == id) selectedVehicleId = null;
    }
  }
  loadVeiculos();
}

let selectedMotoristaId = null;

async function loadMotoristas() {
  await loadMotoristasCache();

  const list = document.getElementById("motoristasList");
  if (list) list.innerHTML = "";

  const badge = document.getElementById("badgeTotalMotoristas");
  if (badge) badge.textContent = motoristasCache.length;

  motoristasCache.forEach(m => {
    const card = document.createElement("div");
    card.className = "tracking-card";
    if (m.id === selectedMotoristaId) card.classList.add("selected");

    card.innerHTML = `
      <div class="tc-header">
        <h3>${m.nome}</h3>
        <span class="status-badge badge-available">
          <i class="ph ph-check-circle"></i> Ativo
        </span>
      </div>
      <div class="tc-image" style="display: flex; justify-content: center; align-items: center; padding: 1rem 0;">
        <i class="ph ph-user-circle" style="font-size: 64px; color: var(--text-muted);"></i>
      </div>
    `;

    card.onclick = () => selectMotorista(m.id);

    if (list) list.appendChild(card);
  });

  if (!selectedMotoristaId && motoristasCache.length > 0) {
    selectedMotoristaId = motoristasCache[0].id;
    selectMotorista(selectedMotoristaId, true);
  } else if (selectedMotoristaId && motoristasCache.length > 0) {
    const idx = motoristasCache.findIndex(m => m.id === selectedMotoristaId);
    if(idx > -1) selectMotorista(selectedMotoristaId, true);
  } else if (motoristasCache.length === 0) {
    document.getElementById("detailMotoristaNome").textContent = "Nenhum motorista";
    document.getElementById("detailMotoristaStatus").innerHTML = "";
    document.getElementById("detailMotoristaStatus").className = "status-badge";
    const el = id => document.getElementById(id);
    if(el("detailMotoristaIdade")) el("detailMotoristaIdade").textContent = "-";
    if(el("detailMotoristaCpf")) el("detailMotoristaCpf").textContent = "-";
    if(el("detailMotoristaCnh")) el("detailMotoristaCnh").textContent = "-";
    if(el("detailMotoristaValidadeCnh")) el("detailMotoristaValidadeCnh").textContent = "-";
    if(el("detailMotoristaTelefone")) el("detailMotoristaTelefone").textContent = "-";
    if(el("detailMotoristaEmail")) el("detailMotoristaEmail").textContent = "-";
  }
}

function selectMotorista(id, skipRender = false) {
  selectedMotoristaId = id;
  const m = motoristasCache.find(mo => mo.id === id);
  if (!m) return;

  if (!skipRender) {
    loadMotoristas();
  }

  const el = docId => document.getElementById(docId);
  if(el("detailMotoristaNome")) el("detailMotoristaNome").textContent = m.nome || 'Sem Nome';
  if(el("detailMotoristaStatus")) {
    el("detailMotoristaStatus").className = `status-badge badge-available`;
    el("detailMotoristaStatus").innerHTML = `<i class="ph ph-check-circle"></i> Ativo`;
  }
  if(el("detailMotoristaIdade")) el("detailMotoristaIdade").textContent = m.idade ? `${m.idade} anos` : '-';
  if(el("detailMotoristaCpf")) el("detailMotoristaCpf").textContent = m.cpf || '-';
  if(el("detailMotoristaCnh")) el("detailMotoristaCnh").textContent = m.cnh || '-';
  if(el("detailMotoristaValidadeCnh")) {
    if(m.validade_cnh) {
      const parts = m.validade_cnh.split("-");
      el("detailMotoristaValidadeCnh").textContent = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : m.validade_cnh;
    } else {
      el("detailMotoristaValidadeCnh").textContent = '-';
    }
  }
  if(el("detailMotoristaTelefone")) el("detailMotoristaTelefone").textContent = m.telefone || '-';
  if(el("detailMotoristaEmail")) el("detailMotoristaEmail").textContent = m.email || '-';

  const btnEdit = el("btnEditMotorista");
  if(btnEdit) btnEdit.onclick = () => editMotorista(m.id);

  const btnDel = el("btnDeleteMotorista");
  if(btnDel) btnDel.onclick = () => {
    if(confirm(`Tem certeza que deseja remover o motorista ${m.nome}?`)) {
      deleteMotorista(m.id);
    }
  };
}

document.getElementById("addMotoristaBtn").onclick = () => {
  motoristaEditandoId = null;
  resetMotoristaForm();
  document.getElementById("saveMotorista").innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Motorista';
  document.getElementById("motoristaModal").classList.remove("hidden");
};

function resetMotoristaForm() {
  ["inputNomeMotorista", "inputCPF", "inputTelefone", "inputIdadeMotorista", "inputCNH", "inputValidadeCNH", "inputEmail"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("motoristaModal").classList.add("hidden");
}

document.getElementById("cancelMotorista").onclick = resetMotoristaForm;
const closeMotoristaModalBtn = document.getElementById("closeMotoristaModal");
if (closeMotoristaModalBtn) closeMotoristaModalBtn.onclick = resetMotoristaForm;

document.getElementById("saveMotorista").onclick = async () => {
  const data = {
    nome: inputValue("inputNomeMotorista"),
    cpf: inputValue("inputCPF"),
    telefone: inputValue("inputTelefone"),
    idade: inputValue("inputIdadeMotorista"),
    cnh: inputValue("inputCNH"),
    validade_cnh: inputValue("inputValidadeCNH"),
    email: inputValue("inputEmail")
  };

  const method = motoristaEditandoId ? "PUT" : "POST";
  const url = motoristaEditandoId ? `${API}/motoristas/${motoristaEditandoId}` : `${API}/motoristas`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("API Error");
  } catch (err) {
    if (usingMockMotoristas) {
      if (motoristaEditandoId) {
        const idx = motoristasCache.findIndex(m => m.id == motoristaEditandoId);
        if (idx > -1) {
          motoristasCache[idx] = { ...motoristasCache[idx], ...data };
        }
      } else {
        const newId = motoristasCache.length > 0 ? Math.max(...motoristasCache.map(m => m.id)) + 1 : 1;
        motoristasCache.push({ id: newId, ...data });
        selectedMotoristaId = newId;
      }
    }
  }

  resetMotoristaForm();
  loadMotoristas();
};

async function editMotorista(id) {
  const m = motoristasCache.find(m => m.id == id);
  if(!m) return;

  document.getElementById("inputNomeMotorista").value = m.nome || "";
  document.getElementById("inputCPF").value = m.cpf || "";
  document.getElementById("inputTelefone").value = m.telefone || "";
  document.getElementById("inputIdadeMotorista").value = m.idade || "";
  document.getElementById("inputCNH").value = m.cnh || "";
  document.getElementById("inputValidadeCNH").value = m.validade_cnh || "";
  document.getElementById("inputEmail").value = m.email || "";

  motoristaEditandoId = id;
  document.getElementById("saveMotorista").innerHTML = '<i class="ph ph-pencil-simple"></i> Atualizar Motorista';
  document.getElementById("motoristaModal").classList.remove("hidden");
}

async function deleteMotorista(id) {
  try {
    const res = await fetch(`${API}/motoristas/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("API Error");
  } catch(e) {
    if(usingMockMotoristas) {
      motoristasCache = motoristasCache.filter(m => m.id != id);
      if (selectedMotoristaId == id) selectedMotoristaId = null;
    }
  }
  loadMotoristas();
}

async function loadManutencoes() {
  await loadVeiculosCache();

  const data = await fetch(API + "/manutencoes").then(r => r.json());
  const list = document.getElementById("manutencoesList");
  list.innerHTML = "";

  data.forEach(m => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p>${m.veiculo_placa} - ${m.data} - ${m.status}</p>
      <button onclick="editManutencao(${m.id})">Editar</button>
      <button onclick="deleteManutencao(${m.id})">Excluir</button>
    `;
    list.appendChild(div);
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
  const veiculoId = inputVeiculoManut.dataset.id;

  if (!veiculoId) return alert("Selecione um veículo válido");

  const data = {
    veiculo_id: veiculoId,
    data: inputDataManut.value,
    status: inputStatusManut.value
  };

  const method = manutencaoEditandoId ? "PUT" : "POST";
  const url = manutencaoEditandoId ? `${API}/manutencoes/${manutencaoEditandoId}` : `${API}/manutencoes`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  document.getElementById("manutencaoForm").classList.add("hidden");
  loadManutencoes();
};

async function editManutencao(id) {
  const data = await fetch(API + "/manutencoes").then(r => r.json());
  const m = data.find(m => m.id == id);

  const veiculo = veiculosCache.find(v => v.id == m.veiculo_id);

  inputVeiculoManut.value = veiculo ? `${veiculo.placa} - ${veiculo.modelo}` : "";
  inputVeiculoManut.dataset.id = m.veiculo_id;

  inputDataManut.value = m.data;
  inputStatusManut.value = m.status;

  manutencaoEditandoId = id;
  document.getElementById("manutencaoForm").classList.remove("hidden");
}

async function loadAbastecimentos() {
  await loadVeiculosCache();

  const data = await fetch(API + "/abastecimentos").then(r => r.json());
  const list = document.getElementById("abastecimentosList");
  list.innerHTML = "";

  data.forEach(a => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <p>${a.veiculo_placa} - ${a.data} - ${a.tipo_combustivel}</p>
      <p>Posto: ${a.posto || "N/A"} | ${a.litros}L - R$${a.valor}</p>
      <button onclick="editAbastecimento(${a.id})">Editar</button>
      <button onclick="deleteAbastecimento(${a.id})">Excluir</button>
    `;
    list.appendChild(div);
  });
}

async function editAbastecimento(id) {
  const a = (await fetch(API + "/abastecimentos").then(r => r.json())).find(a => a.id == id);

  inputVeiculoAbast.value = a.veiculo_placa;
  inputVeiculoAbast.dataset.id = a.veiculo_id;
  inputDataAbast.value = a.data;
  selectOption(a.tipo_combustivel);
  inputPosto.value = a.posto || "";
  inputLitros.value = a.litros;
  inputValor.value = a.valor;

  abastecimentoEditandoId = id;
  document.getElementById("abastecimentoForm").classList.remove("hidden");
}

async function deleteAbastecimento(id) {
  await fetch(`${API}/abastecimentos/${id}`, { method: "DELETE" });
  loadAbastecimentos();
}

document.getElementById("addAbastecimentoBtn").onclick = () => {
  document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addAbastecimentoBtn").onclick = () => {
    abastecimentoEditandoId = null;
    resetAbastecimentoForm();
    document.getElementById("abastecimentoForm").classList.remove("hidden");
  };
});
  abastecimentoEditandoId = null;
  resetAbastecimentoForm();
  document.getElementById("abastecimentoForm").classList.remove("hidden");
};

document.getElementById("cancelAbastecimento").onclick = () => {
  resetAbastecimentoForm();
};

function resetAbastecimentoForm() {
  ["inputVeiculoAbast", "inputDataAbast", "inputPosto", "inputLitros", "inputValor"].forEach(id => {
    const el = document.getElementById(id);
    el.value = "";
    el.dataset.id = "";
  });

  document.getElementById("combustivel").value = "";
  document.getElementById("abastecimentoForm").classList.add("hidden");
}

document.getElementById("saveAbastecimento").onclick = async () => {
  const veiculoId = inputVeiculoAbast.dataset.id;

  if (!veiculoId) return alert("Selecione um veículo válido");

  const tipoCombustivel = document.getElementById("combustivel").value;
  const data = {
    veiculo_id: veiculoId,
    data: inputValue("inputDataAbast"),
    tipo_combustivel: tipoCombustivel,
    posto: inputValue("inputPosto"),
    litros: inputValue("inputLitros"),
    valor: inputValue("inputValor")
  };

  const method = abastecimentoEditandoId ? "PUT" : "POST";
  const url = abastecimentoEditandoId ? `${API}/abastecimentos/${abastecimentoEditandoId}` : `${API}/abastecimentos`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  resetAbastecimentoForm();
  loadAbastecimentos();
};


function inputValue(id) {
  return document.getElementById(id).value;
}

function loadPageData(pageId) {
  if (pageId === "dashboardPage") loadDashboard();
  if (pageId === "veiculosPage") loadVeiculos();
  if (pageId === "motoristasPage") loadMotoristas();
  if (pageId === "manutencoesPage") loadManutencoes();
  if (pageId === "abastecimentosPage") loadAbastecimentos();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadMotoristasCache();
  await loadVeiculosCache();
  initAutocompletes();
  loadDashboard();
});
function toggleDropdown() {
  document.getElementById("options").classList.toggle("active");
}

function selectOption(valor) {
  document.querySelector(".selected").innerText = valor + " ▼";
  document.getElementById("options").classList.remove("active");
}
console.log("Script carregou");

const btn = document.getElementById("addAbastecimentoBtn");
console.log("Botão:", btn);

btn.onclick = () => {
  console.log("CLICOU!");
  document.getElementById("abastecimentoForm").classList.remove("hidden");
};