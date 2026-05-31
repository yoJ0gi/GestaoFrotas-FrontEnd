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

  if (!nome) return showToast("Por favor, informe o nome da equipe.", "warning");
  if (!data) return showToast("Por favor, selecione uma data.", "warning");
  if (membrosSelecionadosIds.length === 0) return showToast("Por favor, adicione pelo menos 1 membro à equipe.", "warning");

  const temCondutor = membrosSelecionadosIds.some(id => {
    const f = funcionariosCache.find(func => func.id == id);
    return f && f.apto_dirigir === "Sim";
  });

  if (!temCondutor) {
    return showToast("Atenção: A equipe precisa ter no mínimo 1 pessoa apta a dirigir!", "error");
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
