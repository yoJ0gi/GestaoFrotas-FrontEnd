// Proteção de rota no Front-end: redireciona para login se não houver token
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

const API = "http://127.0.0.1:8000/api";

// ================= AUTH FETCH INTERCEPTOR =================
// Injeta automaticamente o header Authorization: Token <token> em todas
// as requisições para a API, sem precisar alterar nenhum fetch individual.
const _originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  if (typeof url === 'string' && url.startsWith(API)) {
    const token = localStorage.getItem("token");
    if (token && token !== "MOCKED_JWT_TOKEN_MEDFLEET_2026_SESSION") {
      options.headers = {
        ...(options.headers || {}),
        "Authorization": `Token ${token}`
      };
    }
  }
  return _originalFetch.call(this, url, options);
};

let funcionarioEditandoId = null;
let veiculoEditandoId = null;
let manutencaoEditandoId = null;
let abastecimentoEditandoId = null;
let ocorrenciaEditandoId = null;
let currentFuncionarioFilter = null;

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

  // Destaca o botão Configurações se for a página ativa
  const settingsBtn = document.getElementById("settingsLink");
  if (settingsBtn) {
    if (pageId === "settingsPage") {
      settingsBtn.classList.add("active");
    } else {
      settingsBtn.classList.remove("active");
    }
  }

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

document.addEventListener("DOMContentLoaded", async () => {
  await loadFuncionariosCache();
  await loadVeiculosCache();
  initAutocompletes();
  initEquipeAutocomplete();
  loadDashboard();
  initNotificationSystem();

  // Configurações do Sistema
  initSettingsPage();
  loadUserProfile();
  loadNotificationSettings();
  loadLayoutDensity();
  initLayoutDensity();
  loadTimezone();
  initTimezone();
  initCacheCleaner();

  // Escuta o botão de configurações na barra lateral
  const settingsBtn = document.getElementById("settingsLink");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showPage("settingsPage");
    });
  }

  // Escuta o botão de logout na barra lateral
  const logoutBtn = document.getElementById("logoutLink");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  // Inicializa o dropdown do perfil de usuário
  initUserProfileDropdown();

  // Inicializa o toggle do menu inferior da sidebar
  initSidebarBottomToggle();
});
function toggleDropdown() {
  document.getElementById("options").classList.toggle("active");
}

function selectOption(valor) {
  document.querySelector(".selected").innerText = valor + " ▼";
  document.getElementById("options").classList.remove("active");
}

function initSidebarBottomToggle() {
  const toggleBtn = document.getElementById("sidebarBottomToggleBtn");
  const content = document.getElementById("sidebarBottomContent");
  const icon = document.getElementById("sidebarBottomToggleIcon");
  const label = document.getElementById("sidebarBottomToggleLabel");

  if (!toggleBtn || !content || !icon) return;

  function applyState(isCollapsed) {
    if (isCollapsed) {
      content.classList.add("collapsed");
      icon.classList.remove("ph-caret-down");
      icon.classList.add("ph-caret-up");
      if (label) label.style.display = "";
    } else {
      content.classList.remove("collapsed");
      icon.classList.remove("ph-caret-up");
      icon.classList.add("ph-caret-down");
      if (label) label.style.display = "none";
    }
  }

  // Check persisted state (default: open = false collapsed)
  const saved = localStorage.getItem("medfleet_sidebar_bottom_collapsed");
  const isCollapsed = saved === "true";
  applyState(isCollapsed);

  toggleBtn.addEventListener("click", () => {
    const collapsed = content.classList.contains("collapsed");
    const next = !collapsed;
    applyState(next);
    localStorage.setItem("medfleet_sidebar_bottom_collapsed", String(next));
  });
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let iconClass = "ph ph-check-circle";
  if (type === "warning") {
    iconClass = "ph ph-warning-circle";
  } else if (type === "error" || type === "emergency") {
    iconClass = "ph ph-x-circle";
  }

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${iconClass}"></i>
    </div>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger sound if error or emergency
  if (type === "error" || type === "emergency") {
    if (typeof playAlertSound === "function") {
      const sound = localStorage.getItem("medfleet_settings_sound") || "sirene";
      playAlertSound(sound);
    }
  }

  // Force reflow and add show class
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 400); // match transition duration
  }, 4000);
}

function initNotificationSystem() {
  const btn = document.getElementById("notificationBtn");
  const dropdown = document.getElementById("notificationDropdown");
  const btnMarkRead = document.getElementById("btnMarkAllRead");

  if (!btn || !dropdown) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Toggle active classes
    const isHidden = dropdown.classList.contains("hidden");
    if (isHidden) {
      closeProfileDropdown(); // close user profile dropdown if open!
      updateNotificationDropdown();
      dropdown.classList.remove("hidden");
      setTimeout(() => dropdown.classList.add("active"), 10);
    } else {
      closeNotificationDropdown();
    }
  });

  // Dismiss on click outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      closeNotificationDropdown();
    }
  });

  if (btnMarkRead) {
    btnMarkRead.addEventListener("click", () => {
      // Clear notification dot
      const dot = btn.querySelector(".notification-dot");
      if (dot) dot.remove();

      // Clear alerts
      const list = document.getElementById("dropdownNotificationList");
      if (list) {
        list.innerHTML = `
          <li style="justify-content: center; align-items: center; padding: 24px; color: var(--text-muted); flex-direction: column; gap: 8px;">
            <i class="ph ph-check-circle" style="font-size: 32px; color: #10b981;"></i>
            <span>Nenhum alerta recente</span>
          </li>
        `;
      }
      
      showToast("Alertas marcados como lidos!", "success");
      closeNotificationDropdown();
    });
  }
}

function closeNotificationDropdown() {
  const dropdown = document.getElementById("notificationDropdown");
  if (!dropdown) return;
  dropdown.classList.remove("active");
  setTimeout(() => dropdown.classList.add("hidden"), 300);
}

function updateNotificationDropdown() {
  const list = document.getElementById("dropdownNotificationList");
  if (!list) return;

  list.innerHTML = "";
  const items = [];

  // Fetch critical/high active occurrences
  if (typeof ocorrenciasCache !== "undefined") {
    ocorrenciasCache.forEach(o => {
      if (o.status === "Ativa") {
        const isCritical = o.prioridade === "Crítica";
        items.push(`
          <li onclick="showPage('ocorrenciasPage'); selectOcorrencia(${o.id}); closeNotificationDropdown();">
            <i class="ph ${isCritical ? "ph-warning-octagon" : "ph-warning"}" style="color: ${isCritical ? "#ef4444" : "#f59e0b"};"></i>
            <div>
              <div style="font-weight: 600; color: var(--text);">${o.titulo}</div>
              <div style="font-size: 11px; margin-top: 2px;">Paciente: ${o.paciente} | Prioridade: ${o.prioridade}</div>
            </div>
          </li>
        `);
      }
    });
  }

  // Fetch vehicles in maintenance
  if (typeof veiculosCache !== "undefined") {
    veiculosCache.forEach((v, idx) => {
      const s = v.status || (idx % 4 === 1 ? "Em rota" : idx % 4 === 2 ? "Emergência" : idx % 4 === 3 ? "Manutenção" : "Disponível");
      if (s === "Manutenção") {
        items.push(`
          <li onclick="showPage('manutencoesPage'); closeNotificationDropdown();">
            <i class="ph ph-wrench" style="color: #f59e0b;"></i>
            <div>
              <div style="font-weight: 600; color: var(--text);">Manutenção: Viatura ${v.placa}</div>
              <div style="font-size: 11px; margin-top: 2px;">Ambulância ${v.modelo} indisponível na oficina.</div>
            </div>
          </li>
        `);
      }
    });
  }

  // Check list empty
  if (items.length === 0) {
    list.innerHTML = `
      <li style="justify-content: center; align-items: center; padding: 24px; color: var(--text-muted); flex-direction: column; gap: 8px;">
        <i class="ph ph-check-circle" style="font-size: 32px; color: #10b981;"></i>
        <span>Nenhum alerta recente</span>
      </li>
    `;
  } else {
    list.innerHTML = items.join("");
  }
}

function initUserProfileDropdown() {
  const btn = document.getElementById("userProfileBtn");
  const dropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("dropdownLogoutBtn");

  if (!btn || !dropdown) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Toggle active classes
    const isHidden = dropdown.classList.contains("hidden");
    if (isHidden) {
      closeNotificationDropdown(); // close notifications dropdown if open!
      dropdown.classList.remove("hidden");
      setTimeout(() => dropdown.classList.add("active"), 10);
    } else {
      closeProfileDropdown();
    }
  });

  // Dismiss on click outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      closeProfileDropdown();
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      closeProfileDropdown();
      setTimeout(() => {
        if (confirm("Deseja realmente sair do sistema (Logoff)?")) {
          localStorage.removeItem("token");
          window.location.href = "login.html";
        }
      }, 100);
    });
  }
}

function closeProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  if (!dropdown) return;
  dropdown.classList.remove("active");
  setTimeout(() => dropdown.classList.add("hidden"), 300);
}

console.log("Script carregou");