let usandoMockFuncionarios = false;
let funcionarioSelecionadoId = null;

async function carregarCacheFuncionarios() {
  if (usandoMockFuncionarios) return;
  try {
    const resposta = await fazerRequisicao("/motoristas");
    if (!resposta.ok) throw new Error("API falhou");
    const motoristas = await resposta.json();
    
    const naoMotoristas = funcionariosCache.filter(f => f.cargo !== "Motorista");
    const motoristasMapeados = motoristas.map(m => ({
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
    
    funcionariosCache = [...motoristasMapeados, ...naoMotoristas];
  } catch (erro) {
    console.warn("Backend offline ou com erro, usando dados mockados");
    usandoMockFuncionarios = true;
  }
}

async function carregarFuncionarios(filtro = null) {
  await carregarCacheFuncionarios();
  atualizarTodosSelects();

  const tituloEl = document.getElementById("funcionariosPageTitle");
  const subtituloEl = document.getElementById("funcionariosPageSubtitle");
  if (tituloEl) tituloEl.textContent = filtro ? filtro + "s" : "Funcionários";
  if (subtituloEl) {
    subtituloEl.textContent = filtro 
      ? `Listando todos os ${filtro.toLowerCase()}s vinculados à frota hospitalar` 
      : "Todos os profissionais vinculados à frota hospitalar";
  }

  const lista = document.getElementById("funcionariosList");
  if (lista) lista.innerHTML = "";

  const filtrados = filtro 
    ? funcionariosCache.filter(f => f.cargo === filtro)
    : funcionariosCache;

  filtrados.forEach(f => {
    const cartao = document.createElement("div");
    cartao.className = "tracking-card";
    cartao.dataset.id = f.id;
    if (f.id === funcionarioSelecionadoId) cartao.classList.add("selected");

    const emRota = f.status === "Em Rota";
    const badgeStatus = emRota
      ? `<span class="status-badge badge-route"><i class="ph ph-navigation-arrow"></i> Em Rota</span>`
      : `<span class="status-badge badge-available"><i class="ph ph-check-circle"></i> Disponível</span>`;

    cartao.innerHTML = `
      <div class="tc-header">
        <h3>${f.nome}</h3>
        ${badgeStatus}
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 5px;">
        ${f.cargo} ${f.registro ? '| ' + f.registro : ''}
      </div>
      <div class="tc-image" style="display: flex; justify-content: center; align-items: center; padding: 1rem 0;">
        <i class="ph ph-user-circle" style="font-size: 64px; color: var(--text-muted);"></i>
      </div>
    `;

    cartao.onclick = () => selecionarFuncionario(f.id);
    if (lista) lista.appendChild(cartao);
  });

  fecharDetalhes('funcionarios');
}

function selecionarFuncionario(id) {
  funcionarioSelecionadoId = id;
  const f = funcionariosCache.find(func => func.id == id);
  if (!f) return;

  document.querySelectorAll("#funcionariosList .tracking-card").forEach(cartao => {
    cartao.classList.toggle("selected", cartao.dataset.id == id);
  });

  const el = docId => document.getElementById(docId);
  if (el("detailFuncNome")) el("detailFuncNome").textContent = f.nome || 'Sem Nome';
  
  if (el("detailFuncStatus")) {
    const statusEl = el("detailFuncStatus");
    const emRota = f.status === "Em Rota";
    statusEl.className = `status-badge ${emRota ? "badge-route" : "badge-available"}`;
    statusEl.innerHTML = emRota 
      ? `<i class="ph ph-navigation-arrow"></i> Em Rota` 
      : `<i class="ph ph-check-circle"></i> Disponível`;
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

  const apto = f.apto_dirigir === "Sim";
  if (cnhBox) cnhBox.style.display = apto ? "block" : "none";
  if (validadeCnhBox) validadeCnhBox.style.display = apto ? "block" : "none";

  if (apto) {
    if (el("detailFuncCnh")) el("detailFuncCnh").textContent = f.cnh || '-';
    if (el("detailFuncValidadeCnh")) {
      if (f.validade_cnh) {
        const partes = f.validade_cnh.split("-");
        el("detailFuncValidadeCnh").textContent = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : f.validade_cnh;
      } else {
        el("detailFuncValidadeCnh").textContent = '-';
      }
    }
  }

  const eMotorista = f.cargo === "Motorista";
  if (registroBox) registroBox.style.display = eMotorista ? "none" : "block";
  if (!eMotorista && el("detailFuncRegistro")) el("detailFuncRegistro").textContent = f.registro || '-';

  if (el("btnEditFuncionario")) el("btnEditFuncionario").onclick = () => editarFuncionario(f.id);
  if (el("btnDeleteFuncionario")) {
    el("btnDeleteFuncionario").onclick = () => {
      if (confirm(`Tem certeza que deseja remover o funcionário ${f.nome}?`)) {
        deletarFuncionario(f.id);
      }
    };
  }

  mostrarDetalhes('funcionarios');
}

const btnAddFunc = document.getElementById("addFuncionarioBtn");
if (btnAddFunc) {
  btnAddFunc.onclick = () => {
    funcionarioEditandoId = null;
    limparFormularioFuncionario();
    document.getElementById("saveFuncionario").innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Funcionário';
    document.getElementById("funcionarioModal").classList.remove("hidden");
  };
}

function limparFormularioFuncionario() {
  ["inputFuncNome", "inputFuncCargo", "inputFuncCpf", "inputFuncIdade", "inputFuncTelefone", "inputFuncEmail", "inputFuncCnh", "inputFuncValidadeCnh", "inputFuncRegistro"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  
  const seletorApto = document.getElementById("inputFuncApto");
  if (seletorApto) {
    seletorApto.value = "Não";
    seletorApto.disabled = false;
  }

  atualizarCamposCondicionaisModal("", "Não");
  document.getElementById("funcionarioModal").classList.add("hidden");
}

const btnCancelarFunc = document.getElementById("cancelFuncionario");
if (btnCancelarFunc) btnCancelarFunc.onclick = limparFormularioFuncionario;

const btnFecharModalFunc = document.getElementById("closeFuncionarioModal");
if (btnFecharModalFunc) btnFecharModalFunc.onclick = limparFormularioFuncionario;

function atualizarCamposCondicionaisModal(cargo, aptoDirigir) {
  const campoCnh = document.getElementById("fieldCnh");
  const campoValidadeCnh = document.getElementById("fieldValidadeCnh");
  const campoRegistro = document.getElementById("fieldRegistro");
  const seletorApto = document.getElementById("inputFuncApto");

  let aptoAtual = aptoDirigir;

  if (cargo === "Motorista") {
    if (seletorApto) {
      seletorApto.value = "Sim";
      seletorApto.disabled = true;
    }
    aptoAtual = "Sim";
  } else if (seletorApto) {
    seletorApto.disabled = false;
  }

  const eApto = aptoAtual === "Sim";
  if (campoCnh) campoCnh.classList.toggle("hidden", !eApto);
  if (campoValidadeCnh) campoValidadeCnh.classList.toggle("hidden", !eApto);

  const precisaRegistro = ["Médico", "Enfermeiro", "Socorrista"].includes(cargo);
  if (campoRegistro) campoRegistro.classList.toggle("hidden", !precisaRegistro);
}

const seletorCargo = document.getElementById("inputFuncCargo");
const seletorApto = document.getElementById("inputFuncApto");

if (seletorCargo) {
  seletorCargo.onchange = (e) => {
    const aptoVal = seletorApto ? seletorApto.value : "Não";
    atualizarCamposCondicionaisModal(e.target.value, aptoVal);
  };
}

if (seletorApto) {
  seletorApto.onchange = (e) => {
    const cargoVal = seletorCargo ? seletorCargo.value : "";
    atualizarCamposCondicionaisModal(cargoVal, e.target.value);
  };
}

const btnSalvarFunc = document.getElementById("saveFuncionario");
if (btnSalvarFunc) {
  btnSalvarFunc.onclick = async () => {
    const cargo = obterValorInput("inputFuncCargo");
    const apto = cargo === "Motorista" ? "Sim" : obterValorInput("inputFuncApto");
    const dados = {
      nome: obterValorInput("inputFuncNome"),
      cargo: cargo,
      cpf: obterValorInput("inputFuncCpf"),
      idade: obterValorInput("inputFuncIdade"),
      telefone: obterValorInput("inputFuncTelefone"),
      email: obterValorInput("inputFuncEmail"),
      apto_dirigir: apto,
      cnh: apto === "Sim" ? obterValorInput("inputFuncCnh") : "",
      validade_cnh: apto === "Sim" ? obterValorInput("inputFuncValidadeCnh") : "",
      registro: cargo !== "Motorista" ? obterValorInput("inputFuncRegistro") : "",
      status: "Disponível"
    };

    if (cargo === "Motorista") {
      const eEdicao = funcionarioEditandoId && typeof funcionarioEditandoId === 'number';
      const caminho = eEdicao ? `/motoristas/${funcionarioEditandoId}` : `/motoristas`;
      
      try {
        const resposta = await fazerRequisicao(caminho, {
          method: eEdicao ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: dados.nome,
            cpf: dados.cpf,
            telefone: dados.telefone,
            idade: dados.idade,
            cnh: dados.cnh,
            validade_cnh: dados.validade_cnh,
            email: dados.email
          })
        });
        if (!resposta.ok) throw new Error("Erro na API");
        usandoMockFuncionarios = false;
      } catch (erro) {
        salvarFuncionarioMock(dados);
      }
    } else {
      salvarFuncionarioMock(dados);
    }

    limparFormularioFuncionario();
    await carregarFuncionarios(currentFuncionarioFilter);
  };
}

function salvarFuncionarioMock(dados) {
  if (funcionarioEditandoId) {
    const idx = funcionariosCache.findIndex(f => f.id == funcionarioEditandoId);
    if (idx > -1) funcionariosCache[idx] = { ...funcionariosCache[idx], ...dados };
  } else {
    const idsNumericos = funcionariosCache.map(f => Number(f.id)).filter(n => !isNaN(n));
    const novoId = idsNumericos.length > 0 ? Math.max(...idsNumericos) + 1 : 1;
    funcionariosCache.push({ id: novoId, ...dados });
    funcionarioSelecionadoId = novoId;
  }
}

function editarFuncionario(id) {
  const f = funcionariosCache.find(func => func.id == id);
  if (!f) return;

  const campoVal = (idCampo, valor) => {
    const el = document.getElementById(idCampo);
    if (el) el.value = valor || "";
  };

  campoVal("inputFuncNome", f.nome);
  campoVal("inputFuncCargo", f.cargo);
  campoVal("inputFuncCpf", f.cpf);
  campoVal("inputFuncIdade", f.idade);
  campoVal("inputFuncTelefone", f.telefone);
  campoVal("inputFuncEmail", f.email);

  const seletorApto = document.getElementById("inputFuncApto");
  const aptoVal = f.apto_dirigir || "Não";
  if (seletorApto) seletorApto.value = aptoVal;

  atualizarCamposCondicionaisModal(f.cargo, aptoVal);

  campoVal("inputFuncCnh", aptoVal === "Sim" ? f.cnh : "");
  campoVal("inputFuncValidadeCnh", aptoVal === "Sim" ? f.validade_cnh : "");
  campoVal("inputFuncRegistro", f.cargo !== "Motorista" ? f.registro : "");

  funcionarioEditandoId = id;
  document.getElementById("saveFuncionario").innerHTML = '<i class="ph ph-pencil-simple"></i> Atualizar Funcionário';
  document.getElementById("funcionarioModal").classList.remove("hidden");
}

async function deletarFuncionario(id) {
  const f = funcionariosCache.find(func => func.id == id);
  if (!f) return;

  if (f.cargo === "Motorista" && typeof id === 'number') {
    try {
      const resposta = await fazerRequisicao(`/motoristas/${id}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Erro na API");
      usandoMockFuncionarios = false;
    } catch (erro) {
      funcionariosCache = funcionariosCache.filter(func => func.id != id);
      if (funcionarioSelecionadoId == id) funcionarioSelecionadoId = null;
    }
  } else {
    funcionariosCache = funcionariosCache.filter(func => func.id != id);
    if (funcionarioSelecionadoId == id) funcionarioSelecionadoId = null;
  }
  
  await carregarFuncionarios(currentFuncionarioFilter);
}
