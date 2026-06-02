let usingMockVeiculos = false;
let selectedVehicleId = null;

async function loadVeiculosCache() {
  if (usingMockVeiculos) return; 

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
        <img src="assets/ambulance.png" alt="Ambulância" />
      </div>
    `;

    card.onclick = () => selectVehicle(v.id, status);

    list.appendChild(card);
  });

  closeDetails('veiculos');
}

function selectVehicle(id, status) {
  selectedVehicleId = id;
  const v = veiculosCache.find(ve => ve.id === id);
  if (!v) return;

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

  showDetails('veiculos');
}

document.getElementById("addVeiculoBtn").onclick = () => {
  veiculoEditandoId = null;
  resetVeiculoForm();
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


let usingMockManutencoes = false;
let manutencoesCache = [
  { id: 1, veiculo_placa: "AMB-1020", data: "2026-05-10", status: "Concluída", veiculo_id: 1 },
  { id: 2, veiculo_placa: "HOS-4B21", data: "2026-05-15", status: "Em Andamento", veiculo_id: 2 },
  { id: 3, veiculo_placa: "MED-9C44", data: "2026-05-20", status: "Agendada", veiculo_id: 3 }
];

async function loadManutencoes() {
  await loadVeiculosCache();

  let data = [];
  try {
    if (usingMockManutencoes) {
      data = manutencoesCache;
    } else {
      data = await fetch(API + "/manutencoes").then(r => {
        if (!r.ok) throw new Error("API failed");
        return r.json();
      });
    }
  } catch (err) {
    console.warn("Backend offline, usando dados mockados de manutenções");
    usingMockManutencoes = true;
    data = manutencoesCache;
  }

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

  if (!veiculoId) return showToast("Selecione um veículo válido", "warning");

  const veiculo = veiculosCache.find(v => v.id == veiculoId);
  const placa = veiculo ? veiculo.placa : inputVeiculoManut.value;

  const data = {
    veiculo_id: veiculoId,
    veiculo_placa: placa,
    data: inputDataManut.value,
    status: inputStatusManut.value
  };

  const method = manutencaoEditandoId ? "PUT" : "POST";
  const url = manutencaoEditandoId ? `${API}/manutencoes/${manutencaoEditandoId}` : `${API}/manutencoes`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("API failed");
  } catch (err) {
    console.warn("Backend offline, salvando manutenção no cache local");
    if (manutencaoEditandoId) {
      const idx = manutencoesCache.findIndex(m => m.id == manutencaoEditandoId);
      if (idx > -1) manutencoesCache[idx] = { ...manutencoesCache[idx], ...data };
    } else {
      const newId = manutencoesCache.length > 0 ? Math.max(...manutencoesCache.map(m => m.id)) + 1 : 1;
      manutencoesCache.push({ id: newId, ...data });
    }
  }

  document.getElementById("manutencaoForm").classList.add("hidden");
  loadManutencoes();
};

async function editManutencao(id) {
  let m;
  try {
    if (usingMockManutencoes) {
      m = manutencoesCache.find(m => m.id == id);
    } else {
      const data = await fetch(API + "/manutencoes").then(r => r.json());
      m = data.find(m => m.id == id);
    }
  } catch(e) {
    m = manutencoesCache.find(m => m.id == id);
  }
  if (!m) return;

  const veiculo = veiculosCache.find(v => v.id == m.veiculo_id);

  inputVeiculoManut.value = veiculo ? `${veiculo.placa} - ${veiculo.modelo}` : "";
  inputVeiculoManut.dataset.id = m.veiculo_id;

  inputDataManut.value = m.data;
  inputStatusManut.value = m.status;

  manutencaoEditandoId = id;
  document.getElementById("manutencaoForm").classList.remove("hidden");
}

async function deleteManutencao(id) {
  try {
    const res = await fetch(`${API}/manutencoes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("API failed");
  } catch(e) {
    console.warn("Backend offline, removendo manutenção do cache local");
    manutencoesCache = manutencoesCache.filter(m => m.id != id);
  }
  loadManutencoes();
}


let usingMockAbastecimentos = false;
let abastecimentosCache = [
  { id: 1, veiculo_placa: "AMB-1020", data: "2026-05-12", tipo_combustivel: "diesel", posto: "Ipiranga", litros: "50", valor: "300", veiculo_id: 1 },
  { id: 2, veiculo_placa: "HOS-4B21", data: "2026-05-18", tipo_combustivel: "gasolina", posto: "Shell", litros: "40", valor: "240", veiculo_id: 2 }
];

async function loadAbastecimentos() {
  await loadVeiculosCache();

  let data = [];
  try {
    if (usingMockAbastecimentos) {
      data = abastecimentosCache;
    } else {
      data = await fetch(API + "/abastecimentos").then(r => {
        if (!r.ok) throw new Error("API failed");
        return r.json();
      });
    }
  } catch (err) {
    console.warn("Backend offline, usando dados mockados de abastecimentos");
    usingMockAbastecimentos = true;
    data = abastecimentosCache;
  }

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
  let a;
  try {
    if (usingMockAbastecimentos) {
      a = abastecimentosCache.find(a => a.id == id);
    } else {
      const data = await fetch(API + "/abastecimentos").then(r => r.json());
      a = data.find(a => a.id == id);
    }
  } catch(e) {
    a = abastecimentosCache.find(a => a.id == id);
  }
  if (!a) return;

  inputVeiculoAbast.value = a.veiculo_placa;
  inputVeiculoAbast.dataset.id = a.veiculo_id;
  inputDataAbast.value = a.data;
  selectOption(a.tipo_combustivel);
  inputPostPosto = document.getElementById("inputPosto");
  if (inputPostPosto) inputPostPosto.value = a.posto || "";
  inputLitros.value = a.litros;
  inputValor.value = a.valor;

  abastecimentoEditandoId = id;
  document.getElementById("abastecimentoForm").classList.remove("hidden");
}

async function deleteAbastecimento(id) {
  try {
    const res = await fetch(`${API}/abastecimentos/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("API failed");
  } catch(e) {
    console.warn("Backend offline, removendo abastecimento do cache local");
    abastecimentosCache = abastecimentosCache.filter(a => a.id != id);
  }
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
  const veiculoId = inputVeiculoAbast.dataset.id;

  if (!veiculoId) return showToast("Selecione um veículo válido", "warning");

  const veiculo = veiculosCache.find(v => v.id == veiculoId);
  const placa = veiculo ? veiculo.placa : inputVeiculoAbast.value;

  const tipoCombustivel = document.getElementById("combustivel").value;
  const data = {
    veiculo_id: veiculoId,
    veiculo_placa: placa,
    data: inputValue("inputDataAbast"),
    tipo_combustivel: tipoCombustivel,
    posto: inputValue("inputPosto"),
    litros: inputValue("inputLitros"),
    valor: inputValue("inputValor")
  };

  const method = abastecimentoEditandoId ? "PUT" : "POST";
  const url = abastecimentoEditandoId ? `${API}/abastecimentos/${abastecimentoEditandoId}` : `${API}/abastecimentos`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("API failed");
  } catch (err) {
    console.warn("Backend offline, salvando abastecimento no cache local");
    if (abastecimentoEditandoId) {
      const idx = abastecimentosCache.findIndex(a => a.id == abastecimentoEditandoId);
      if (idx > -1) abastecimentosCache[idx] = { ...abastecimentosCache[idx], ...data };
    } else {
      const newId = abastecimentosCache.length > 0 ? Math.max(...abastecimentosCache.map(a => a.id)) + 1 : 1;
      abastecimentosCache.push({ id: newId, ...data });
    }
  }

  resetAbastecimentoForm();
  loadAbastecimentos();
};
