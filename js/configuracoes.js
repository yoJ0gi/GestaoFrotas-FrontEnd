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

  ["settingNotifyPush", "settingNotifyMaint"].forEach(id => {
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


function loadNotificationSettings() {
  const push = localStorage.getItem("medfleet_settings_push") !== "false";
  const maint = localStorage.getItem("medfleet_settings_maint") !== "false";

  const pushToggle = document.getElementById("settingNotifyPush");
  const maintToggle = document.getElementById("settingNotifyMaint");

  if (pushToggle) pushToggle.checked = push;
  if (maintToggle) maintToggle.checked = maint;
}

function saveNotificationSettings() {
  const pushToggle = document.getElementById("settingNotifyPush");
  const maintToggle = document.getElementById("settingNotifyMaint");

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
      if (confirm("Atenção: Isso redefinirá todas as configurações de perfil, layout compacto e caches locais simulados. Deseja prosseguir?")) {
        localStorage.clear();
        showToast("Todos os dados foram redefinidos. A página será recarregada.", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      }
    });
  }
}
