// Proteção de rota no Front-end: redireciona para login se não houver token
if (!localStorage.getItem("medfleet_token")) {
  window.location.href = "login.html";
}

const API = "http://localhost:3000/api";

let funcionarioEditandoId = null;
let veiculoEditandoId = null;
let manutencaoEditandoId = null;
let abastecimentoEditandoId = null;
let ocorrenciaEditandoId = null;

let funcionariosCache = [
  { id: 1, nome: "Carlos Silva", cargo: "Motorista", cpf: "111.222.333-44", apto_dirigir: "Sim", cnh: "123456789", validade_cnh: "2026-10-12", registro: "", idade: 45, telefone: "(11) 99999-1111", email: "carlos@exemplo.com", status: "Disponível" },
  { id: 2, nome: "Ana Santos", cargo: "Motorista", cpf: "222.333.444-55", apto_dirigir: "Sim", cnh: "987654321", validade_cnh: "2025-05-20", registro: "", idade: 38, telefone: "(11) 98888-2222", email: "ana@exemplo.com", status: "Disponível" },
  { id: 3, nome: "Dr. Marcos Paulo", cargo: "Médico", cpf: "333.444.555-66", apto_dirigir: "Não", cnh: "", validade_cnh: "", registro: "CRM-12345", idade: 42, telefone: "(11) 98888-0000", email: "marcos@hospital.com", status: "Disponível" },
  { id: 4, nome: "Enf. Joana Silva", cargo: "Enfermeiro", cpf: "444.555.666-77", apto_dirigir: "Não", cnh: "", validade_cnh: "", registro: "COREN-54321", idade: 36, telefone: "(11) 97777-1111", email: "joana@hospital.com", status: "Em Rota" },
  { id: 5, nome: "Pedro Almeida", cargo: "Socorrista", cpf: "555.666.777-88", apto_dirigir: "Não", cnh: "", validade_cnh: "", registro: "SOC-98765", idade: 29, telefone: "(11) 96666-3333", email: "pedro@hospital.com", status: "Disponível" }
];
let veiculosCache = [];
let ocorrenciasCache = [
  { id: 1, titulo: "Mal súbito", prioridade: "Alta", status: "Ativa", veiculo_nome: "AMB-1020", equipe_nome: "Dr. Marcos Paulo", paciente: "João das Neves", endereco: "Av. Paulista, 1000", descricao: "Paciente inconsciente na rua.", data: "2026-05-19" },
  { id: 2, titulo: "Acidente de Trânsito", prioridade: "Crítica", status: "Em Atendimento", veiculo_nome: "HOS-4B21", equipe_nome: "Enf. Joana Silva", paciente: "Desconhecido", endereco: "Rodovia Castelo Branco, km 15", descricao: "Colisão entre dois carros.", data: "2026-05-18" }
];

let equipeEditandoId = null;
let equipesCache = [
  { id: 1, nome: "Equipe Plantão Alpha", data: "2026-05-22", turno: "Manhã", membros: [1, 3, 4], obs: "Equipe principal para atendimento de urgências do período matutino." },
  { id: 2, nome: "Equipe UTI Especial", data: "2026-05-23", turno: "Integral", membros: [2, 3, 5], obs: "Equipe de apoio para UTI Móvel." }
];
let membrosSelecionadosIds = [];

document.querySelectorAll(".sidebar-nav-main a, .sidebar-submenu a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Sub-link clicked logic
    if (link.closest(".sidebar-submenu")) {
      const filter = link.getAttribute("data-filter");
      currentFuncionarioFilter = filter;
      
      // Update sub-link active state
      document.querySelectorAll(".sidebar-submenu a").forEach(sub => sub.classList.remove("active"));
      link.classList.add("active");
      
      // Highlight parent link
      const parentLink = document.querySelector('[data-target="funcionariosPage"]');
      if (parentLink) {
        document.querySelectorAll(".sidebar-nav-main a").forEach(l => {
          if (!l.closest(".sidebar-submenu")) l.classList.remove("active");
        });
        parentLink.classList.add("active");
      }
      
      showPage("funcionariosPage");
      return;
    }

    const target = link.getAttribute("data-target");
    
    // Parent link clicked
    if (target === "funcionariosPage") {
      currentFuncionarioFilter = null;
      document.querySelectorAll(".sidebar-submenu a").forEach(sub => sub.classList.remove("active"));
    }

    showPage(target);
  });
});

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".sidebar-nav-main a").forEach((l) => {
    if (!l.closest(".sidebar-submenu")) l.classList.remove("active");
  });

  const pageEl = document.getElementById(pageId);
  if (pageEl) pageEl.classList.add("active");

  const targetLink = document.querySelector(`[data-target="${pageId}"]:not(.sidebar-submenu a)`);
  if (targetLink) targetLink.classList.add("active");

  // Handle submenu open/close
  const submenu = document.getElementById("funcionariosSubmenu");
  if (submenu) {
    if (pageId === "funcionariosPage") {
      submenu.classList.add("open");
    } else {
      submenu.classList.remove("open");
    }
  }

  loadPageData(pageId);
}

// ================= SHOW/CLOSE DETAILS =================
const panelMap = {
  veiculos:     { sidebar: 'veiculosSidebar',     detail: 'veiculosDetail' },
  funcionarios: { sidebar: 'funcionariosSidebar', detail: 'funcionariosDetail' },
  ocorrencias:  { sidebar: 'ocorrenciasSidebar',  detail: 'ocorrenciasDetail' },
  equipeMedica: { sidebar: 'equipeMedicaSidebar', detail: 'equipeMedicaDetail' }
};

function showDetails(section) {
  const map = panelMap[section];
  if (!map) return;
  const sidebar = document.getElementById(map.sidebar);
  const detail = document.getElementById(map.detail);
  if (sidebar) sidebar.classList.add('hidden');
  if (detail) detail.classList.remove('hidden');
}

function closeDetails(section) {
  const map = panelMap[section];
  if (!map) return;
  const sidebar = document.getElementById(map.sidebar);
  const detail = document.getElementById(map.detail);
  if (detail) detail.classList.add('hidden');
  if (sidebar) sidebar.classList.remove('hidden');
}

// ================= THEME TOGGLE =================
function initTheme() {
  const saved = localStorage.getItem('medfleet-theme');
  const toggle = document.getElementById('themeToggleSwitch');
  
  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    if (toggle) toggle.checked = false;
  } else {
    document.documentElement.classList.add('dark');
    if (toggle) toggle.checked = true;
  }
}

const themeToggle = document.getElementById('themeToggleSwitch');
if (themeToggle) {
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('medfleet-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('medfleet-theme', 'light');
    }
  });
}

initTheme();

let usingMockFuncionarios = false;

async function loadFuncionariosCache() {
  if (usingMockFuncionarios) return;
  try {
    const res = await fetch(API + "/motoristas");
    if (!res.ok) throw new Error("API failed");
    const motoristas = await res.json();
    
    const nonMotoristas = funcionariosCache.filter(f => f.cargo !== "Motorista");
    const fetchedMotoristas = motoristas.map(m => ({
      id: m.id,
      nome: m.nome,
      cargo: "Motorista",
      cpf: m.cpf || "",
      apto_dirigir: "Sim",
      cnh: m.cnh || "",
      validade_cnh: m.validade_cnh || "",
      registro: "",
      idade: m.idade || "",
      telefone: m.telefone || "",
      email: m.email || "",
      status: m.status || "Disponível"
    }));
    
    funcionariosCache = [...fetchedMotoristas, ...nonMotoristas];
  } catch (err) {
    console.warn("Backend offline ou erro, usando mock data unificado");
    usingMockFuncionarios = true;
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
    () => funcionariosCache.filter(f => f.cargo === "Motorista" || f.apto_dirigir === "Sim"),
    (m) => `${m.nome} (${m.cargo})`
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

  setupAutocomplete(
    "inputOcorrenciaVeiculo",
    "ocorrenciaVeiculoSugestoes",
    () => veiculosCache,
    (v) => `${v.placa} - ${v.modelo}`
  );

  setupAutocomplete(
    "inputOcorrenciaEquipe",
    "ocorrenciaEquipeSugestoes",
    () => funcionariosCache.filter(f => f.cargo !== "Motorista"),
    (e) => `${e.nome} (${e.cargo})`
  );
}

async function loadDashboard() {
  try {
    await Promise.all([
      loadVeiculosCache(),
      loadFuncionariosCache()
    ]);

    const totalOcorrenciasEl = document.getElementById("totalOcorrencias");
    const viaturasRotaEl = document.getElementById("viaturasRota");
    const equipeDisponivelEl = document.getElementById("equipeDisponivel");
    const totalViaturasEl = document.getElementById('totalViaturas');

    if (totalOcorrenciasEl) totalOcorrenciasEl.textContent = ocorrenciasCache.length;
    if (viaturasRotaEl) viaturasRotaEl.textContent = veiculosCache.length;
    
    const disponiveis = funcionariosCache.filter(f => f.status === "Disponível").length;
    if (equipeDisponivelEl) equipeDisponivelEl.textContent = disponiveis;
    
    if (totalViaturasEl) totalViaturasEl.textContent = veiculosCache.length;
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
    card.dataset.id = v.id;
    if (v.id === selectedVehicleId) card.classList.add("selected");

    const status = statuses[index % statuses.length];

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

  // Ensure the grid is visible and details hidden when loading
  closeDetails('veiculos');
}

function selectVehicle(id, status) {
  selectedVehicleId = id;
  const v = veiculosCache.find(ve => ve.id === id);
  if (!v) return;

  // Update selected class on cards
  const cards = document.querySelectorAll("#veiculosList .tracking-card");
  cards.forEach(card => {
    if (Number(card.dataset.id) === Number(id)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

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

  // Show the details panel
  showDetails('veiculos');
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

let selectedFuncionarioId = null;
let currentFuncionarioFilter = null;

async function loadFuncionarios(filter = null) {
  await loadFuncionariosCache();

  const titleEl = document.getElementById("funcionariosPageTitle");
  const subtitleEl = document.getElementById("funcionariosPageSubtitle");
  if (titleEl) {
    titleEl.textContent = filter ? filter + "s" : "Funcionários";
  }
  if (subtitleEl) {
    subtitleEl.textContent = filter 
      ? `Listando todos os ${filter.toLowerCase()}s vinculados à frota hospitalar` 
      : "Todos os profissionais vinculados à frota hospitalar";
  }

  const list = document.getElementById("funcionariosList");
  if (list) list.innerHTML = "";

  const filtered = filter 
    ? funcionariosCache.filter(f => f.cargo === filter)
    : funcionariosCache;

  filtered.forEach(f => {
    const card = document.createElement("div");
    card.className = "tracking-card";
    card.dataset.id = f.id;
    if (f.id === selectedFuncionarioId) card.classList.add("selected");

    let statusBadge = `<span class="status-badge badge-available"><i class="ph ph-check-circle"></i> Disponível</span>`;
    if (f.status === "Em Rota") {
      statusBadge = `<span class="status-badge badge-route"><i class="ph ph-navigation-arrow"></i> Em Rota</span>`;
    }

    card.innerHTML = `
      <div class="tc-header">
        <h3>${f.nome}</h3>
        ${statusBadge}
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 5px;">
        ${f.cargo} ${f.registro ? '| ' + f.registro : ''}
      </div>
      <div class="tc-image" style="display: flex; justify-content: center; align-items: center; padding: 1rem 0;">
        <i class="ph ph-user-circle" style="font-size: 64px; color: var(--text-muted);"></i>
      </div>
    `;

    card.onclick = () => selectFuncionario(f.id);
    if (list) list.appendChild(card);
  });

  closeDetails('funcionarios');
}

function selectFuncionario(id) {
  selectedFuncionarioId = id;
  const f = funcionariosCache.find(func => func.id == id);
  if (!f) return;

  const cards = document.querySelectorAll("#funcionariosList .tracking-card");
  cards.forEach(card => {
    if (card.dataset.id == id) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  const el = docId => document.getElementById(docId);
  
  if (el("detailFuncNome")) el("detailFuncNome").textContent = f.nome || 'Sem Nome';
  if (el("detailFuncStatus")) {
    const statusEl = el("detailFuncStatus");
    if (f.status === "Em Rota") {
      statusEl.className = "status-badge badge-route";
      statusEl.innerHTML = `<i class="ph ph-navigation-arrow"></i> Em Rota`;
    } else {
      statusEl.className = "status-badge badge-available";
      statusEl.innerHTML = `<i class="ph ph-check-circle"></i> Disponível`;
    }
  }

  if (el("detailFuncCargo")) el("detailFuncCargo").textContent = f.cargo || '-';
  if (el("detailFuncIdade")) el("detailFuncIdade").textContent = f.idade ? `${f.idade} anos` : '-';
  if (el("detailFuncCpf")) el("detailFuncCpf").textContent = f.cpf || '-';
  if (el("detailFuncTelefone")) el("detailFuncTelefone").textContent = f.telefone || '-';
  if (el("detailFuncEmail")) el("detailFuncEmail").textContent = f.email || '-';
  if (el("detailFuncApto")) el("detailFuncApto").textContent = f.apto_dirigir || "Não";

  const cnhBox = el("detailFuncCnhBox");
  const validadeCnhBox = el("detailFuncValidadeCnhBox");
  const registroBox = el("detailFuncRegistroBox");

  // Visibilidade condicional de CNH com base em Aptidão
  if (f.apto_dirigir === "Sim") {
    if (cnhBox) cnhBox.style.display = "block";
    if (validadeCnhBox) validadeCnhBox.style.display = "block";

    if (el("detailFuncCnh")) el("detailFuncCnh").textContent = f.cnh || '-';
    if (el("detailFuncValidadeCnh")) {
      if (f.validade_cnh) {
        const parts = f.validade_cnh.split("-");
        el("detailFuncValidadeCnh").textContent = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : f.validade_cnh;
      } else {
        el("detailFuncValidadeCnh").textContent = '-';
      }
    }
  } else {
    if (cnhBox) cnhBox.style.display = "none";
    if (validadeCnhBox) validadeCnhBox.style.display = "none";
  }

  // Visibilidade condicional de Registro Profissional com base no Cargo (não-motoristas)
  if (f.cargo === "Motorista") {
    if (registroBox) registroBox.style.display = "none";
  } else {
    if (registroBox) registroBox.style.display = "block";
    if (el("detailFuncRegistro")) el("detailFuncRegistro").textContent = f.registro || '-';
  }

  const btnEdit = el("btnEditFuncionario");
  if (btnEdit) btnEdit.onclick = () => editFuncionario(f.id);

  const btnDel = el("btnDeleteFuncionario");
  if (btnDel) btnDel.onclick = () => {
    if (confirm(`Tem certeza que deseja remover o funcionário ${f.nome}?`)) {
      deleteFuncionario(f.id);
    }
  };

  showDetails('funcionarios');
}

const addFuncBtn = document.getElementById("addFuncionarioBtn");
if (addFuncBtn) {
  addFuncBtn.onclick = () => {
    funcionarioEditandoId = null;
    resetFuncionarioForm();
    document.getElementById("saveFuncionario").innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Funcionário';
    document.getElementById("funcionarioModal").classList.remove("hidden");
  };
}

function resetFuncionarioForm() {
  ["inputFuncNome", "inputFuncCargo", "inputFuncCpf", "inputFuncIdade", "inputFuncTelefone", "inputFuncEmail", "inputFuncCnh", "inputFuncValidadeCnh", "inputFuncRegistro"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  
  const aptoSelect = document.getElementById("inputFuncApto");
  if (aptoSelect) {
    aptoSelect.value = "Não";
    aptoSelect.disabled = false;
  }

  updateModalConditionalFields("", "Não");
  document.getElementById("funcionarioModal").classList.add("hidden");
}

const cancelFuncBtn = document.getElementById("cancelFuncionario");
if (cancelFuncBtn) cancelFuncBtn.onclick = resetFuncionarioForm;

const closeFuncModalBtn = document.getElementById("closeFuncionarioModal");
if (closeFuncModalBtn) closeFuncModalBtn.onclick = resetFuncionarioForm;

function updateModalConditionalFields(cargo, aptoDirigir) {
  const fieldCnh = document.getElementById("fieldCnh");
  const fieldValidadeCnh = document.getElementById("fieldValidadeCnh");
  const fieldRegistro = document.getElementById("fieldRegistro");
  const aptoSelect = document.getElementById("inputFuncApto");

  let currentApto = aptoDirigir;

  // Se o cargo for Motorista, força aptidão como Sim e bloqueia a seleção
  if (cargo === "Motorista") {
    if (aptoSelect) {
      aptoSelect.value = "Sim";
      aptoSelect.disabled = true;
    }
    currentApto = "Sim";
  } else {
    if (aptoSelect) {
      aptoSelect.disabled = false;
    }
  }

  // Visibilidade CNH
  if (currentApto === "Sim") {
    if (fieldCnh) fieldCnh.classList.remove("hidden");
    if (fieldValidadeCnh) fieldValidadeCnh.classList.remove("hidden");
  } else {
    if (fieldCnh) fieldCnh.classList.add("hidden");
    if (fieldValidadeCnh) fieldValidadeCnh.classList.add("hidden");
  }

  // Visibilidade Registro Profissional
  if (cargo === "Médico" || cargo === "Enfermeiro" || cargo === "Socorrista") {
    if (fieldRegistro) fieldRegistro.classList.remove("hidden");
  } else {
    if (fieldRegistro) fieldRegistro.classList.add("hidden");
  }
}

const cargoSelect = document.getElementById("inputFuncCargo");
const aptoSelect = document.getElementById("inputFuncApto");

if (cargoSelect) {
  cargoSelect.addEventListener("change", (e) => {
    const aptoVal = aptoSelect ? aptoSelect.value : "Não";
    updateModalConditionalFields(e.target.value, aptoVal);
  });
}

if (aptoSelect) {
  aptoSelect.addEventListener("change", (e) => {
    const cargoVal = cargoSelect ? cargoSelect.value : "";
    updateModalConditionalFields(cargoVal, e.target.value);
  });
}

const saveFuncBtn = document.getElementById("saveFuncionario");
if (saveFuncBtn) {
  saveFuncBtn.onclick = async () => {
    const cargo = inputValue("inputFuncCargo");
    const apto = cargo === "Motorista" ? "Sim" : inputValue("inputFuncApto");
    const data = {
      nome: inputValue("inputFuncNome"),
      cargo: cargo,
      cpf: inputValue("inputFuncCpf"),
      idade: inputValue("inputFuncIdade"),
      telefone: inputValue("inputFuncTelefone"),
      email: inputValue("inputFuncEmail"),
      apto_dirigir: apto,
      cnh: apto === "Sim" ? inputValue("inputFuncCnh") : "",
      validade_cnh: apto === "Sim" ? inputValue("inputFuncValidadeCnh") : "",
      registro: cargo !== "Motorista" ? inputValue("inputFuncRegistro") : "",
      status: "Disponível"
    };

    if (cargo === "Motorista") {
      const method = funcionarioEditandoId && typeof funcionarioEditandoId === 'number' ? "PUT" : "POST";
      const url = funcionarioEditandoId && typeof funcionarioEditandoId === 'number' ? `${API}/motoristas/${funcionarioEditandoId}` : `${API}/motoristas`;
      
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: data.nome,
            cpf: data.cpf,
            telefone: data.telefone,
            idade: data.idade,
            cnh: data.cnh,
            validade_cnh: data.validade_cnh,
            email: data.email
          })
        });
        if (!res.ok) throw new Error("API Error");
        usingMockFuncionarios = false;
      } catch (err) {
        saveFuncionarioMock(data);
      }
    } else {
      saveFuncionarioMock(data);
    }

    resetFuncionarioForm();
    await loadFuncionarios(currentFuncionarioFilter);
  };
}

function saveFuncionarioMock(data) {
  if (funcionarioEditandoId) {
    const idx = funcionariosCache.findIndex(f => f.id == funcionarioEditandoId);
    if (idx > -1) {
      funcionariosCache[idx] = { ...funcionariosCache[idx], ...data };
    }
  } else {
    const numericIds = funcionariosCache.map(f => Number(f.id)).filter(n => !isNaN(n));
    const newId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    funcionariosCache.push({ id: newId, ...data });
    selectedFuncionarioId = newId;
  }
}

function editFuncionario(id) {
  const f = funcionariosCache.find(func => func.id == id);
  if (!f) return;

  document.getElementById("inputFuncNome").value = f.nome || "";
  document.getElementById("inputFuncCargo").value = f.cargo || "";
  document.getElementById("inputFuncCpf").value = f.cpf || "";
  document.getElementById("inputFuncIdade").value = f.idade || "";
  document.getElementById("inputFuncTelefone").value = f.telefone || "";
  document.getElementById("inputFuncEmail").value = f.email || "";

  const aptoSelect = document.getElementById("inputFuncApto");
  const aptoVal = f.apto_dirigir || "Não";
  if (aptoSelect) aptoSelect.value = aptoVal;

  updateModalConditionalFields(f.cargo, aptoVal);

  if (aptoVal === "Sim") {
    document.getElementById("inputFuncCnh").value = f.cnh || "";
    document.getElementById("inputFuncValidadeCnh").value = f.validade_cnh || "";
  } else {
    document.getElementById("inputFuncCnh").value = "";
    document.getElementById("inputFuncValidadeCnh").value = "";
  }

  if (f.cargo !== "Motorista") {
    document.getElementById("inputFuncRegistro").value = f.registro || "";
  } else {
    document.getElementById("inputFuncRegistro").value = "";
  }

  funcionarioEditandoId = id;
  document.getElementById("saveFuncionario").innerHTML = '<i class="ph ph-pencil-simple"></i> Atualizar Funcionário';
  document.getElementById("funcionarioModal").classList.remove("hidden");
}

async function deleteFuncionario(id) {
  const f = funcionariosCache.find(func => func.id == id);
  if (!f) return;

  if (f.cargo === "Motorista" && typeof id === 'number') {
    try {
      const res = await fetch(`${API}/motoristas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("API Error");
      usingMockFuncionarios = false;
    } catch (e) {
      funcionariosCache = funcionariosCache.filter(func => func.id != id);
      if (selectedFuncionarioId == id) selectedFuncionarioId = null;
    }
  } else {
    funcionariosCache = funcionariosCache.filter(func => func.id != id);
    if (selectedFuncionarioId == id) selectedFuncionarioId = null;
  }
  
  await loadFuncionarios(currentFuncionarioFilter);
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
  if (pageId === "funcionariosPage") loadFuncionarios(currentFuncionarioFilter);
  if (pageId === "ocorrenciasPage") loadOcorrencias();
  if (pageId === "manutencoesPage") loadManutencoes();
  if (pageId === "abastecimentosPage") loadAbastecimentos();
  if (pageId === "equipeMedicaPage") loadEquipes();
}



// ================= OCORRÊNCIAS LOGIC =================

let selectedOcorrenciaId = null;

function loadOcorrencias() {
  const list = document.getElementById("ocorrenciasList");
  if (!list) return;
  list.innerHTML = "";

  const badge = document.getElementById("badgeTotalOcorrencias");
  if (badge) badge.textContent = ocorrenciasCache.length;

  ocorrenciasCache.forEach(o => {
    const card = document.createElement("div");
    card.className = "tracking-card";
    card.dataset.id = o.id;
    if (o.id === selectedOcorrenciaId) card.classList.add("selected");

    let statusClass = "badge-available";
    let icon = "ph-check-circle";
    if (o.status === "Ativa") { statusClass = "badge-emergency"; icon = "ph-warning-circle"; }
    else if (o.status === "Em Atendimento") { statusClass = "badge-route"; icon = "ph-clock"; }

    card.innerHTML = `
      <div class="tc-header">
        <h3 style="font-size: 14px;">${o.titulo.substring(0, 20)}...</h3>
        <span class="status-badge ${statusClass}">
          <i class="ph ${icon}"></i> ${o.status}
        </span>
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 10px;">
        <i class="ph ph-calendar"></i> ${o.data} | Prioridade: ${o.prioridade}
      </div>
    `;

    card.onclick = () => selectOcorrencia(o.id);
    list.appendChild(card);
  });

  closeDetails('ocorrencias');
}

function selectOcorrencia(id) {
  selectedOcorrenciaId = id;
  const o = ocorrenciasCache.find(oc => oc.id === id);
  if (!o) return;

  // Update selected class on cards
  const cards = document.querySelectorAll("#ocorrenciasList .tracking-card");
  cards.forEach(card => {
    if (Number(card.dataset.id) === Number(id)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  const el = docId => document.getElementById(docId);
  if(el("detailOcorrenciaTitulo")) el("detailOcorrenciaTitulo").textContent = o.titulo || 'Sem Título';
  
  if(el("detailOcorrenciaStatus")) {
    let statusClass = "badge-available";
    let icon = "ph-check-circle";
    if (o.status === "Ativa") { statusClass = "badge-emergency"; icon = "ph-warning-circle"; }
    else if (o.status === "Em Atendimento") { statusClass = "badge-route"; icon = "ph-clock"; }

    el("detailOcorrenciaStatus").className = `status-badge ${statusClass}`;
    el("detailOcorrenciaStatus").innerHTML = `<i class="ph ${icon}"></i> ${o.status}`;
  }
  
  if(el("detailOcorrenciaPrioridade")) el("detailOcorrenciaPrioridade").textContent = o.prioridade || '-';
  if(el("detailOcorrenciaData")) el("detailOcorrenciaData").textContent = o.data || '-';
  if(el("detailOcorrenciaPaciente")) el("detailOcorrenciaPaciente").textContent = o.paciente || '-';
  if(el("detailOcorrenciaEndereco")) el("detailOcorrenciaEndereco").textContent = o.endereco || '-';
  if(el("detailOcorrenciaVeiculo")) el("detailOcorrenciaVeiculo").textContent = o.veiculo_nome || 'Não vinculado';
  if(el("detailOcorrenciaEquipe")) el("detailOcorrenciaEquipe").textContent = o.equipe_nome || 'Não vinculado';
  if(el("detailOcorrenciaDescricao")) el("detailOcorrenciaDescricao").textContent = o.descricao || '-';

  const btnEdit = el("btnEditOcorrencia");
  if(btnEdit) btnEdit.onclick = () => editOcorrencia(o.id);

  const btnDel = el("btnDeleteOcorrencia");
  if(btnDel) btnDel.onclick = () => {
    if(confirm(`Tem certeza que deseja remover a ocorrência "${o.titulo}"?`)) {
      deleteOcorrencia(o.id);
    }
  };

  const btnRes = el("btnResolverOcorrencia");
  if(btnRes) btnRes.onclick = () => {
    o.status = "Finalizada";
    loadOcorrencias();
  };

  showDetails('ocorrencias');
}

document.getElementById("addOcorrenciaBtn").onclick = () => {
  ocorrenciaEditandoId = null;
  resetOcorrenciaForm();
  document.getElementById("saveOcorrencia").innerHTML = '<i class="ph ph-paper-plane-right"></i> Salvar Ocorrência';
  document.getElementById("ocorrenciaModal").classList.remove("hidden");
};

function resetOcorrenciaForm() {
  ["inputOcorrenciaTitulo", "inputOcorrenciaPaciente", "inputOcorrenciaPrioridade", "inputOcorrenciaEndereco", "inputOcorrenciaStatus", "inputOcorrenciaVeiculo", "inputOcorrenciaEquipe", "inputOcorrenciaDescricao"].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      el.value = (el.tagName === "SELECT") ? el.options[0].value : "";
      if(el.dataset) el.dataset.id = "";
    }
  });
  document.getElementById("ocorrenciaModal").classList.add("hidden");
}

document.getElementById("cancelOcorrencia").onclick = resetOcorrenciaForm;
const closeOcorrenciaModalBtn = document.getElementById("closeOcorrenciaModal");
if (closeOcorrenciaModalBtn) closeOcorrenciaModalBtn.onclick = resetOcorrenciaForm;

document.getElementById("saveOcorrencia").onclick = () => {
  const data = {
    titulo: inputValue("inputOcorrenciaTitulo"),
    paciente: inputValue("inputOcorrenciaPaciente"),
    prioridade: inputValue("inputOcorrenciaPrioridade"),
    endereco: inputValue("inputOcorrenciaEndereco"),
    status: inputValue("inputOcorrenciaStatus"),
    veiculo_nome: inputValue("inputOcorrenciaVeiculo"),
    equipe_nome: inputValue("inputOcorrenciaEquipe"),
    descricao: inputValue("inputOcorrenciaDescricao"),
    data: new Date().toISOString().split('T')[0]
  };

  if (ocorrenciaEditandoId) {
    const idx = ocorrenciasCache.findIndex(o => o.id == ocorrenciaEditandoId);
    if (idx > -1) {
      ocorrenciasCache[idx] = { ...ocorrenciasCache[idx], ...data, data: ocorrenciasCache[idx].data };
    }
  } else {
    const newId = ocorrenciasCache.length > 0 ? Math.max(...ocorrenciasCache.map(o => o.id)) + 1 : 1;
    ocorrenciasCache.push({ id: newId, ...data });
    selectedOcorrenciaId = newId;
  }

  resetOcorrenciaForm();
  loadOcorrencias();
};

function editOcorrencia(id) {
  const o = ocorrenciasCache.find(oc => oc.id == id);
  if(!o) return;

  document.getElementById("inputOcorrenciaTitulo").value = o.titulo || "";
  document.getElementById("inputOcorrenciaPaciente").value = o.paciente || "";
  document.getElementById("inputOcorrenciaPrioridade").value = o.prioridade || "Baixa";
  document.getElementById("inputOcorrenciaEndereco").value = o.endereco || "";
  document.getElementById("inputOcorrenciaStatus").value = o.status || "Ativa";
  document.getElementById("inputOcorrenciaVeiculo").value = o.veiculo_nome || "";
  document.getElementById("inputOcorrenciaEquipe").value = o.equipe_nome || "";
  document.getElementById("inputOcorrenciaDescricao").value = o.descricao || "";

  ocorrenciaEditandoId = id;
  document.getElementById("saveOcorrencia").innerHTML = '<i class="ph ph-pencil-simple"></i> Atualizar Ocorrência';
  document.getElementById("ocorrenciaModal").classList.remove("hidden");
}

function deleteOcorrencia(id) {
  ocorrenciasCache = ocorrenciasCache.filter(o => o.id != id);
  if (selectedOcorrenciaId == id) selectedOcorrenciaId = null;
  loadOcorrencias();
}

// ================= EQUIPE MÉDICA LOGIC =================
let selectedEquipeId = null;

function loadEquipes() {
  const list = document.getElementById("equipeMedicaList");
  if (!list) return;
  list.innerHTML = "";

  equipesCache.forEach(eq => {
    const card = document.createElement("div");
    card.className = "tracking-card";
    card.dataset.id = eq.id;
    if (eq.id === selectedEquipeId) card.classList.add("selected");

    // Count how many members are apt to drive
    const motoristasAptosCount = eq.membros.filter(id => {
      const f = funcionariosCache.find(func => func.id == id);
      return f && f.apto_dirigir === "Sim";
    }).length;

    const totalMembros = eq.membros.length;

    card.innerHTML = `
      <div class="tc-header">
        <h3 style="font-size: 15px;">${eq.nome}</h3>
        <span class="status-badge badge-route">
          <i class="ph ph-clock"></i> ${eq.turno}
        </span>
      </div>
      <div style="font-size: 13px; color: var(--text-light); margin-top: 10px; display: flex; flex-direction: column; gap: 4px;">
        <div><i class="ph ph-calendar"></i> ${eq.data}</div>
        <div><i class="ph ph-users"></i> ${totalMembros} Membros</div>
      </div>
      <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between;">
        <span class="status-badge ${motoristasAptosCount > 0 ? 'badge-available' : 'badge-emergency'}">
          <i class="ph ph-steering-wheel"></i> ${motoristasAptosCount} Condutor(es)
        </span>
      </div>
    `;

    card.onclick = () => selectEquipe(eq.id);
    list.appendChild(card);
  });

  closeDetails('equipeMedica');
}

function selectEquipe(id) {
  selectedEquipeId = id;
  const eq = equipesCache.find(e => e.id === id);
  if (!eq) return;

  // Update selected class on cards
  const cards = document.querySelectorAll("#equipeMedicaList .tracking-card");
  cards.forEach(card => {
    if (Number(card.dataset.id) === Number(id)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  const el = docId => document.getElementById(docId);
  if (el("detailEquipeNome")) el("detailEquipeNome").textContent = eq.nome || 'Sem Nome';
  if (el("detailEquipeData")) el("detailEquipeData").textContent = eq.data || '-';
  if (el("detailEquipeTurno")) el("detailEquipeTurno").textContent = eq.turno || '-';
  if (el("detailEquipeObs")) el("detailEquipeObs").textContent = eq.obs || 'Nenhuma observação cadastrada.';

  const membrosListContainer = el("detailEquipeMembrosList");
  if (membrosListContainer) {
    membrosListContainer.innerHTML = "";
    eq.membros.forEach(mId => {
      const f = funcionariosCache.find(func => func.id == mId);
      if (f) {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.justifyContent = "space-between";
        item.style.padding = "10px 14px";
        item.style.background = "var(--bg-card)";
        item.style.border = "1px solid var(--border)";
        item.style.borderRadius = "10px";

        let cargoBadgeClass = "badge-inactive";
        if (f.cargo === "Médico") cargoBadgeClass = "badge-available";
        else if (f.cargo === "Enfermeiro") cargoBadgeClass = "badge-route";
        else if (f.cargo === "Socorrista") cargoBadgeClass = "badge-maintenance";
        else if (f.cargo === "Motorista") cargoBadgeClass = "badge-inactive";

        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="ph ph-user-circle" style="font-size: 24px; color: var(--text-light);"></i>
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--text);">${f.nome}</div>
              <div style="font-size: 12px; color: var(--text-light);">${f.cargo} ${f.registro ? '(' + f.registro + ')' : ''}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${f.apto_dirigir === "Sim" ? '<span class="status-badge badge-available"><i class="ph ph-steering-wheel"></i> Apto a Dirigir</span>' : ''}
            <span class="status-badge ${cargoBadgeClass}">${f.cargo}</span>
          </div>
        `;
        membrosListContainer.appendChild(item);
      }
    });
  }

  const btnEdit = el("btnEditEquipe");
  if (btnEdit) btnEdit.onclick = () => editEquipe(eq.id);

  const btnDel = el("btnDeleteEquipe");
  if (btnDel) btnDel.onclick = () => {
    if (confirm(`Tem certeza que deseja remover a equipe "${eq.nome}"?`)) {
      deleteEquipe(eq.id);
    }
  };

  showDetails('equipeMedica');
}

document.getElementById("addEquipeBtn").onclick = () => {
  equipeEditandoId = null;
  resetEquipeForm();
  document.getElementById("saveEquipeMedica").innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Equipe';
  document.getElementById("equipeMedicaModal").classList.remove("hidden");
};

function resetEquipeForm() {
  document.getElementById("inputEquipeNome").value = "";
  document.getElementById("inputEquipeData").value = "";
  document.getElementById("inputEquipeTurno").value = "Manhã";
  document.getElementById("inputEquipeMembroBuscar").value = "";
  document.getElementById("inputEquipeObs").value = "";
  membrosSelecionadosIds = [];
  renderMembrosChips();
  document.getElementById("equipeMedicaModal").classList.add("hidden");
}

document.getElementById("cancelEquipeMedica").onclick = resetEquipeForm;
document.getElementById("closeEquipeMedicaModal").onclick = resetEquipeForm;

function renderMembrosChips() {
  const container = document.getElementById("equipeMembrosChipsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (membrosSelecionadosIds.length === 0) {
    container.innerHTML = `<span style="color: var(--text-muted); font-size: 13px;">Nenhum profissional selecionado</span>`;
    return;
  }

  membrosSelecionadosIds.forEach(id => {
    const f = funcionariosCache.find(func => func.id == id);
    if (f) {
      const chip = document.createElement("div");
      chip.style.display = "inline-flex";
      chip.style.alignItems = "center";
      chip.style.gap = "6px";
      chip.style.background = "var(--bg-main)";
      chip.style.border = "1px solid var(--border)";
      chip.style.borderRadius = "20px";
      chip.style.padding = "6px 12px";
      chip.style.fontSize = "13px";
      chip.style.color = "var(--text)";

      let isDriver = f.apto_dirigir === "Sim";
      
      chip.innerHTML = `
        <span style="font-weight: 500;">${f.nome} (${f.cargo})</span>
        ${isDriver ? '<i class="ph ph-steering-wheel" title="Apto a dirigir" style="color: var(--status-available);"></i>' : ''}
        <i class="ph ph-x" style="cursor: pointer; color: #ef4444; font-weight: bold;" onclick="removerMembroDeEquipe(${f.id})"></i>
      `;
      container.appendChild(chip);
    }
  });
}

// Global scope removal function
window.removerMembroDeEquipe = function(id) {
  membrosSelecionadosIds = membrosSelecionadosIds.filter(mId => mId != id);
  renderMembrosChips();
};

function initEquipeAutocomplete() {
  const input = document.getElementById("inputEquipeMembroBuscar");
  const sugestoes = document.getElementById("equipeMembroSugestoes");
  if (!input || !sugestoes) return;

  input.addEventListener("input", () => {
    const termo = input.value.toLowerCase();
    sugestoes.innerHTML = "";

    if (!termo) {
      sugestoes.classList.add("hidden");
      return;
    }

    const filtrados = funcionariosCache.filter(f => 
      !membrosSelecionadosIds.includes(f.id) &&
      (f.nome.toLowerCase().includes(termo) || f.cargo.toLowerCase().includes(termo))
    );

    filtrados.forEach(f => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.alignItems = "center";
      li.innerHTML = `
        <span>${f.nome} (${f.cargo})</span>
        ${f.apto_dirigir === "Sim" ? '<span style="font-size: 11px; color: var(--status-available);"><i class="ph ph-steering-wheel"></i> Condutor</span>' : ''}
      `;

      li.onclick = () => {
        membrosSelecionadosIds.push(f.id);
        input.value = "";
        sugestoes.classList.add("hidden");
        renderMembrosChips();
      };

      sugestoes.appendChild(li);
    });

    sugestoes.classList.remove("hidden");
  });

  document.addEventListener("click", (e) => {
    if (e.target !== input && e.target !== sugestoes) {
      sugestoes.classList.add("hidden");
    }
  });
}

document.getElementById("saveEquipeMedica").onclick = () => {
  const nome = document.getElementById("inputEquipeNome").value.trim();
  const data = document.getElementById("inputEquipeData").value;
  const turno = document.getElementById("inputEquipeTurno").value;
  const obs = document.getElementById("inputEquipeObs").value.trim();

  if (!nome) return alert("Por favor, informe o nome da equipe.");
  if (!data) return alert("Por favor, selecione uma data.");
  if (membrosSelecionadosIds.length === 0) return alert("Por favor, adicione pelo menos 1 membro à equipe.");

  const temCondutor = membrosSelecionadosIds.some(id => {
    const f = funcionariosCache.find(func => func.id == id);
    return f && f.apto_dirigir === "Sim";
  });

  if (!temCondutor) {
    return alert("Atenção: A equipe precisa ter no mínimo 1 pessoa apta a dirigir!");
  }

  const equipeData = {
    nome,
    data,
    turno,
    obs,
    membros: [...membrosSelecionadosIds]
  };

  if (equipeEditandoId) {
    const idx = equipesCache.findIndex(e => e.id == equipeEditandoId);
    if (idx > -1) {
      equipesCache[idx] = { ...equipesCache[idx], ...equipeData };
    }
  } else {
    const newId = equipesCache.length > 0 ? Math.max(...equipesCache.map(e => e.id)) + 1 : 1;
    equipesCache.push({ id: newId, ...equipeData });
    selectedEquipeId = newId;
  }

  resetEquipeForm();
  loadEquipes();
};

function editEquipe(id) {
  const eq = equipesCache.find(e => e.id == id);
  if (!eq) return;

  document.getElementById("inputEquipeNome").value = eq.nome || "";
  document.getElementById("inputEquipeData").value = eq.data || "";
  document.getElementById("inputEquipeTurno").value = eq.turno || "Manhã";
  document.getElementById("inputEquipeObs").value = eq.obs || "";

  membrosSelecionadosIds = [...eq.membros];
  renderMembrosChips();

  equipeEditandoId = id;
  document.getElementById("saveEquipeMedica").innerHTML = '<i class="ph ph-pencil-simple"></i> Atualizar Equipe';
  document.getElementById("equipeMedicaModal").classList.remove("hidden");
}

function deleteEquipe(id) {
  equipesCache = equipesCache.filter(e => e.id != id);
  if (selectedEquipeId == id) selectedEquipeId = null;
  loadEquipes();
}

document.addEventListener("DOMContentLoaded", async () => {
  // Verificação extra de segurança no front
  if (!localStorage.getItem("medfleet_token")) {
    window.location.href = "login.html";
    return;
  }

  await loadFuncionariosCache();
  await loadVeiculosCache();
  initAutocompletes();
  initEquipeAutocomplete();
  loadDashboard();

  // Escuta o botão de logout na barra lateral
  const logoutBtn = document.getElementById("logoutLink");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("medfleet_token");
      window.location.href = "login.html";
    });
  }
});
function toggleDropdown() {
  document.getElementById("options").classList.toggle("active");
}

function selectOption(valor) {
  document.querySelector(".selected").innerText = valor + " ▼";
  document.getElementById("options").classList.remove("active");
}
console.log("Script carregou");