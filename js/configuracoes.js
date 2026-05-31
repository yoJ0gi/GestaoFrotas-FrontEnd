function initSettingsPage() {
  const navBtns = document.querySelectorAll(".settings-nav-btn");
  const tabPanes = document.querySelectorAll(".settings-tab-pane");

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      navBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetTab = btn.dataset.tab;
      const targetPane = document.getElementById(targetTab);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      avatarOptions.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
    });
  });

  const btnSave = document.getElementById("btnSaveProfile");
  if (btnSave) {
    btnSave.addEventListener("click", saveUserProfile);
  }

  const btnTest = document.getElementById("btnTestSound");
  if (btnTest) {
    btnTest.addEventListener("click", () => {
      const soundSelect = document.getElementById("settingSoundAlert");
      if (soundSelect) playAlertSound(soundSelect.value);
    });
  }

  ["settingSoundAlert", "settingNotifyPush", "settingNotifyMaint"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", saveNotificationSettings);
  });

  const settingsThemeToggle = document.getElementById("settingDarkModeToggle");
  if (settingsThemeToggle) {
    const isDark = document.documentElement.classList.contains("dark");
    settingsThemeToggle.checked = isDark;

    settingsThemeToggle.addEventListener("change", () => {
      const themeToggle = document.getElementById("themeToggleSwitch");
      if (themeToggle) {
        themeToggle.checked = settingsThemeToggle.checked;
        themeToggle.dispatchEvent(new Event("change"));
      }
    });
  }

  const sidebarThemeToggle = document.getElementById("themeToggleSwitch");
  if (sidebarThemeToggle) {
    sidebarThemeToggle.addEventListener("change", () => {
      const settingsThemeToggle = document.getElementById("settingDarkModeToggle");
      if (settingsThemeToggle) {
        settingsThemeToggle.checked = sidebarThemeToggle.checked;
      }
    });
  }
}

function loadUserProfile() {
  const avatar = localStorage.getItem("medfleet_profile_avatar") || "admin";
  const name = localStorage.getItem("medfleet_profile_name") || "Admin";
  const email = localStorage.getItem("medfleet_profile_email") || "admin@medfleet.com";

  const nameInput = document.getElementById("settingProfileName");
  const emailInput = document.getElementById("settingProfileEmail");
  if (nameInput) nameInput.value = name;
  if (emailInput) emailInput.value = email;

  const avatarOptions = document.querySelectorAll(".avatar-option");
  avatarOptions.forEach(opt => {
    if (opt.dataset.avatar === avatar) {
      opt.classList.add("selected");
    } else {
      opt.classList.remove("selected");
    }
  });

  const topbarName = document.querySelector(".topbar-user-name");
  const welcomeTitle = document.querySelector(".welcome-title");
  if (topbarName) topbarName.textContent = name;
  if (welcomeTitle) welcomeTitle.innerHTML = `Bem-vindo de volta, ${name} 👋`;

  const dropdownName = document.getElementById("dropdownProfileName");
  if (dropdownName) dropdownName.textContent = name;

  const topbarAvatar = document.querySelector(".topbar-avatar");
  const dropdownAvatar = document.querySelector(".dropdown-avatar");
  const iconMap = {
    admin: "ph-user-gear",
    medico: "ph-stethoscope",
    enfermeiro: "ph-first-aid",
    socorrista: "ph-siren"
  };

  if (topbarAvatar) {
    topbarAvatar.innerHTML = `<i class="ph ${iconMap[avatar] || "ph-user"}"></i>`;
  }
  if (dropdownAvatar) {
    dropdownAvatar.innerHTML = `<i class="ph ${iconMap[avatar] || "ph-user"}"></i>`;
  }
}

function saveUserProfile() {
  const name = document.getElementById("settingProfileName").value.trim();
  const email = document.getElementById("settingProfileEmail").value.trim();

  if (!name || !email) {
    return showToast("Por favor, preencha o Nome e o E-mail.", "warning");
  }

  const selectedAvatarOpt = document.querySelector(".avatar-option.selected");
  const avatar = selectedAvatarOpt ? selectedAvatarOpt.dataset.avatar : "admin";

  const oldPass = document.getElementById("settingProfileOldPass").value;
  const newPass = document.getElementById("settingProfileNewPass").value;
  const confirmPass = document.getElementById("settingProfileConfirmPass").value;

  if (oldPass || newPass || confirmPass) {
    if (newPass.length < 6) {
      return showToast("A nova senha deve ter no mínimo 6 caracteres.", "warning");
    }
    if (newPass !== confirmPass) {
      return showToast("A nova senha e a confirmação não conferem.", "warning");
    }
    showToast("Senha atualizada com sucesso no banco local!", "success");
    document.getElementById("settingProfileOldPass").value = "";
    document.getElementById("settingProfileNewPass").value = "";
    document.getElementById("settingProfileConfirmPass").value = "";
  }

  localStorage.setItem("medfleet_profile_avatar", avatar);
  localStorage.setItem("medfleet_profile_name", name);
  localStorage.setItem("medfleet_profile_email", email);

  loadUserProfile();
  showToast("Perfil operacional atualizado com sucesso!", "success");
}

function playAlertSound(type) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "sirene") {
    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.4);
    osc.frequency.linearRampToValueAtTime(650, now + 0.8);
    osc.frequency.linearRampToValueAtTime(950, now + 1.2);
    osc.frequency.linearRampToValueAtTime(650, now + 1.6);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    
    osc.start(now);
    osc.stop(now + 1.8);
  } else if (type === "bipe") {
    osc.type = "square";
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(1400, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.setValueAtTime(0.001, now + 0.08);
    
    osc.frequency.setValueAtTime(1400, now + 0.18);
    gain.gain.setValueAtTime(0.08, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (type === "suave") {
    osc.type = "triangle";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
    
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }
}

function loadNotificationSettings() {
  const sound = localStorage.getItem("medfleet_settings_sound") || "sirene";
  const push = localStorage.getItem("medfleet_settings_push") !== "false";
  const maint = localStorage.getItem("medfleet_settings_maint") !== "false";

  const soundSelect = document.getElementById("settingSoundAlert");
  const pushToggle = document.getElementById("settingNotifyPush");
  const maintToggle = document.getElementById("settingNotifyMaint");

  if (soundSelect) soundSelect.value = sound;
  if (pushToggle) pushToggle.checked = push;
  if (maintToggle) maintToggle.checked = maint;
}

function saveNotificationSettings() {
  const soundSelect = document.getElementById("settingSoundAlert");
  const pushToggle = document.getElementById("settingNotifyPush");
  const maintToggle = document.getElementById("settingNotifyMaint");

  if (soundSelect) localStorage.setItem("medfleet_settings_sound", soundSelect.value);
  if (pushToggle) localStorage.setItem("medfleet_settings_push", pushToggle.checked);
  if (maintToggle) localStorage.setItem("medfleet_settings_maint", maintToggle.checked);
}

function loadLayoutDensity() {
  const compact = localStorage.getItem("medfleet_layout_compact") === "true";
  const compactToggle = document.getElementById("settingCompactLayout");
  const contentEl = document.querySelector(".content");

  if (compactToggle) compactToggle.checked = compact;

  if (contentEl) {
    if (compact) {
      contentEl.classList.add("compact");
    } else {
      contentEl.classList.remove("compact");
    }
  }
}

function initLayoutDensity() {
  const compactToggle = document.getElementById("settingCompactLayout");
  if (compactToggle) {
    compactToggle.addEventListener("change", () => {
      const contentEl = document.querySelector(".content");
      if (compactToggle.checked) {
        contentEl.classList.add("compact");
        localStorage.setItem("medfleet_layout_compact", "true");
      } else {
        contentEl.classList.remove("compact");
        localStorage.setItem("medfleet_layout_compact", "false");
      }
    });
  }
}

function loadTimezone() {
  const tz = localStorage.getItem("medfleet_settings_timezone") || "America/Sao_Paulo";
  const tzSelect = document.getElementById("settingTimezone");
  if (tzSelect) tzSelect.value = tz;
}

function initTimezone() {
  const tzSelect = document.getElementById("settingTimezone");
  if (tzSelect) {
    tzSelect.addEventListener("change", () => {
      localStorage.setItem("medfleet_settings_timezone", tzSelect.value);
    });
  }
}

function initCacheCleaner() {
  const btnClear = document.getElementById("btnClearCache");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (confirm("Atenção: Isso redefinirá todas as configurações de perfil, preferências de som, layout compacto e caches locais simulados. Deseja prosseguir?")) {
        localStorage.clear();
        showToast("Todos os dados foram redefinidos. A página será recarregada.", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      }
    });
  }
}
