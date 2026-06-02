function updateProgressRing(circleId, textId, percent) {
  const circle = document.getElementById(circleId);
  const text = document.getElementById(textId);
  if (!circle || !text) return;
  
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  
  
  const offset = circumference - (percent / 100 * circumference);
  circle.style.strokeDashoffset = offset;
  
  text.textContent = `${Math.round(percent)}%`;
}

function loadTimeline() {
  const timeline = document.getElementById("liveTimeline");
  if (!timeline) return;
  timeline.innerHTML = "";

  const events = [];

  
  ocorrenciasCache.forEach((o, index) => {
    let icon = "ph-warning-octagon";
    let iconClass = "timeline-icon-red";
    let title = `Ocorrência: ${o.titulo}`;
    let desc = `Paciente: ${o.paciente || "Não informado"} | Local: ${o.endereco || "N/A"}`;
    let time = `há ${5 + index * 12} min`;

    if (o.status === "Em Atendimento") {
      icon = "ph-clock";
      iconClass = "timeline-icon-blue";
      desc = `Equipe ${o.equipe_nome || "médica"} em atendimento rápido no local.`;
    } else if (o.status === "Finalizada") {
      icon = "ph-check-circle";
      iconClass = "timeline-icon-green";
      desc = `Atendimento concluído. Viatura em processo de retorno.`;
    }

    events.push({ title, desc, time, icon, iconClass, timestamp: Date.now() - (5 + index * 12) * 60000 });
  });

  
  funcionariosCache.slice(0, 3).forEach((f, index) => {
    let icon = "ph-user-check";
    let iconClass = "timeline-icon-green";
    let title = `${f.cargo}: ${f.nome}`;
    let desc = `Profissional operacional com status atualizado para: ${f.status || "Disponível"}.`;
    let time = `há ${15 + index * 18} min`;

    if (f.status === "Em Rota") {
      icon = "ph-navigation-arrow";
      iconClass = "timeline-icon-blue";
    }

    events.push({ title, desc, time, icon, iconClass, timestamp: Date.now() - (15 + index * 18) * 60000 });
  });

  
  if (typeof veiculosCache !== "undefined" && veiculosCache.length > 0) {
    veiculosCache.slice(0, 2).forEach((v, index) => {
      let icon = "ph-ambulance";
      let iconClass = "timeline-icon-green";
      let title = `Ambulância: ${v.placa}`;
      let desc = `Viatura (${v.modelo || "Padrão"}) monitorada no sistema | Status: ${v.status || "Disponível"}.`;
      let time = `há ${8 + index * 15} min`;

      const cycleStatus = index % 4 === 1 ? "Em rota" : index % 4 === 2 ? "Emergência" : index % 4 === 3 ? "Manutenção" : "Disponível";
      const actualStatus = v.status || cycleStatus;

      if (actualStatus === "Em rota" || actualStatus === "Emergência") {
        iconClass = "timeline-icon-blue";
        icon = "ph-navigation-arrow";
      } else if (actualStatus === "Manutenção") {
        iconClass = "timeline-icon-yellow";
        icon = "ph-wrench";
      }

      events.push({ title, desc, time, icon, iconClass, timestamp: Date.now() - (8 + index * 15) * 60000 });
    });
  } else {
    
    events.push({
      title: "Viatura AMB-1020",
      desc: "Check-list operacional matutino finalizado sem inconformidades.",
      time: "há 2h",
      icon: "ph-wrench",
      iconClass: "timeline-icon-yellow",
      timestamp: Date.now() - 120 * 60000
    });
  }

  
  events.sort((a, b) => b.timestamp - a.timestamp);

  events.forEach(ev => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="timeline-icon ${ev.iconClass}">
        <i class="ph ${ev.icon}"></i>
      </div>
      <div class="timeline-content">
        <div class="timeline-meta">
          <span class="timeline-title">${ev.title}</span>
          <span class="timeline-time">${ev.time}</span>
        </div>
        <p class="timeline-desc">${ev.desc}</p>
      </div>
    `;
    timeline.appendChild(item);
  });
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

    
    const totalOcor = ocorrenciasCache.length;
    const activeOcor = ocorrenciasCache.filter(o => o.status === "Ativa" || o.status === "Em Atendimento").length;
    
    const totalVeic = veiculosCache.length;
    const inRoute = veiculosCache.filter((v, idx) => {
      const s = v.status || (idx % 4 === 1 ? "Em rota" : idx % 4 === 2 ? "Emergência" : idx % 4 === 3 ? "Manutenção" : "Disponível");
      return s === "Em rota" || s === "Emergência";
    }).length;

    const disponiveis = funcionariosCache.filter(f => f.status === "Disponível").length;
    const totalFunc = funcionariosCache.length;

    const operacionais = veiculosCache.filter((v, idx) => {
      const s = v.status || (idx % 4 === 1 ? "Em rota" : idx % 4 === 2 ? "Emergência" : idx % 4 === 3 ? "Manutenção" : "Disponível");
      return s !== "Manutenção";
    }).length;

    if (totalOcorrenciasEl) totalOcorrenciasEl.textContent = activeOcor;
    if (viaturasRotaEl) viaturasRotaEl.textContent = inRoute;
    if (equipeDisponivelEl) equipeDisponivelEl.textContent = disponiveis;
    if (totalViaturasEl) totalViaturasEl.textContent = totalVeic;

    
    const pctOcor = totalOcor > 0 ? (activeOcor / totalOcor) * 100 : 0;
    const pctRota = totalVeic > 0 ? (inRoute / totalVeic) * 100 : 0;
    const pctEquipe = totalFunc > 0 ? (disponiveis / totalFunc) * 100 : 0;
    const pctFrota = totalVeic > 0 ? (operacionais / totalVeic) * 100 : 0;

    
    setTimeout(() => {
      updateProgressRing("progressOcorrencias", "progressTextOcorrencias", pctOcor);
      updateProgressRing("progressRota", "progressTextRota", pctRota);
      updateProgressRing("progressEquipe", "progressTextEquipe", pctEquipe);
      updateProgressRing("progressFrota", "progressTextFrota", pctFrota);
    }, 100);

    
    const alertList = document.getElementById("alertList");
    if (alertList) {
      alertList.innerHTML = "";
      
      const alerts = [];
      
      ocorrenciasCache.forEach(o => {
        if (o.status === "Ativa" && o.prioridade === "Crítica") {
          alerts.push(`<li onclick="showPage('ocorrenciasPage'); selectOcorrencia(${o.id});" style="cursor: pointer;"><i class="ph ph-warning-octagon" style="color: #ef4444; font-size: 18px; flex-shrink: 0;"></i> <div><strong>Urgência Crítica:</strong> ${o.titulo} para paciente ${o.paciente}.</div></li>`);
        } else if (o.status === "Ativa" && o.prioridade === "Alta") {
          alerts.push(`<li onclick="showPage('ocorrenciasPage'); selectOcorrencia(${o.id});" style="cursor: pointer;"><i class="ph ph-warning" style="color: #f59e0b; font-size: 18px; flex-shrink: 0;"></i> <div><strong>Demanda Alta:</strong> ${o.titulo} pendente de atendimento.</div></li>`);
        }
      });

      
      veiculosCache.forEach((v, idx) => {
        const s = v.status || (idx % 4 === 1 ? "Em rota" : idx % 4 === 2 ? "Emergência" : idx % 4 === 3 ? "Manutenção" : "Disponível");
        if (s === "Manutenção") {
          alerts.push(`<li onclick="showPage('manutencoesPage');" style="cursor: pointer;"><i class="ph ph-wrench" style="color: #f59e0b; font-size: 18px; flex-shrink: 0;"></i> <div><strong>Manutenção Preventiva:</strong> Viatura ${v.placa} (${v.modelo}) está indisponível na oficina.</div></li>`);
        }
      });

      
      if (alerts.length === 0) {
        alerts.push(`<li><i class="ph ph-check-circle" style="color: #10b981; font-size: 18px; flex-shrink: 0;"></i> <div>Tudo sob controle. Nenhum alerta crítico operacional ativo.</div></li>`);
      }

      alertList.innerHTML = alerts.join("");
    }

    
    loadTimeline();


  } catch(e) {
    console.error("Erro ao carregar o dashboard:", e);
  }
}
