/*
  Clínica Reinaldo Guazzelli — demonstração de agenda.
  IMPORTANTE: autenticação e dados no navegador NÃO são seguros para uso real.
  Antes de publicar, implemente backend, banco de dados e autenticação segura.
*/
(() => {
  "use strict";
  const WHATSAPP_NUMBER = "5518999999999"; // TROQUE pelo número oficial da clínica, com DDI + DDD, somente números.
  const ADMIN_PASSWORD = "Reinaldodiasguazzelli"; // Apenas demonstração local; não protege um site público.
  const STORAGE_KEY = "rg_clinica_agenda_demo_v1";
  const defaultHours = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const now = new Date();
  let displayedYear = now.getFullYear();
  let displayedMonth = now.getMonth();
  let selectedDate = "";
  let selectedTime = "";
  let adminLoggedIn = false;
  let agenda = loadAgenda();

  function loadAgenda() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch { return {}; }
  }
  function saveAgenda() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(agenda)); }
    catch { alert("Não foi possível salvar neste navegador."); }
  }
  function dateKey(year, monthIndex, day) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function parseKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
  }
  function isPast(key) {
    const d = parseKey(key); d.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    return d < today;
  }
  function isBusinessDay(year, month, day) {
    const weekday = new Date(year, month, day).getDay();
    return weekday !== 0 && weekday !== 6;
  }
  function getSlots(key) {
    const custom = agenda[key] || {};
    return defaultHours.map(time => ({ time, ...(custom[time] || { status: "livre" }) }));
  }
  function getStatus(key) {
    if (isPast(key)) return "past";
    if (!isBusinessDay(...key.split("-").map((n, i) => i === 1 ? Number(n)-1 : Number(n)))) return "weekend";
    const slots = getSlots(key);
    const occupied = slots.filter(s => s.status === "ocupado").length;
    if (occupied === 0) return "available";
    if (occupied >= slots.length) return "full";
    return "partial";
  }
  function renderCalendar() {
    const firstDay = new Date(displayedYear, displayedMonth, 1).getDay();
    const totalDays = new Date(displayedYear, displayedMonth + 1, 0).getDate();
    $("#monthLabel").textContent = new Date(displayedYear, displayedMonth, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const grid = $("#calendarDays");
    grid.innerHTML = "";
    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement("span");
      blank.className = "day-cell blank";
      blank.setAttribute("aria-hidden", "true");
      grid.appendChild(blank);
    }
    for (let day = 1; day <= totalDays; day++) {
      const key = dateKey(displayedYear, displayedMonth, day);
      const status = getStatus(key);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `day-cell ${status}`;
      btn.textContent = day;
      btn.setAttribute("aria-label", `${day} de ${$("#monthLabel").textContent}, ${status === "available" ? "disponível" : status === "partial" ? "alguns horários ocupados" : status === "full" ? "lotado" : status === "weekend" ? "sem atendimento padrão" : "data passada"}`);
      if (key === selectedDate) btn.classList.add("selected");
      if (status === "past" || status === "weekend") btn.disabled = true;
      if (status === "available") addStatusLabel(btn, "Livre");
      if (status === "partial") addStatusLabel(btn, "Parcial");
      if (status === "full") addStatusLabel(btn, "Lotado");
      btn.addEventListener("click", () => {
        selectedDate = key; selectedTime = "";
        renderCalendar(); renderSlots();
      });
      grid.appendChild(btn);
    }
  }
  function addStatusLabel(button, text) {
    const span = document.createElement("span");
    span.className = "day-status"; span.textContent = text;
    button.appendChild(span);
  }
  function renderSlots() {
    const list = $("#slotsList");
    list.innerHTML = "";
    $("#bookingForm").hidden = true;
    if (!selectedDate) {
      $("#selectedDateTitle").textContent = "Horários disponíveis";
      $("#selectedDateHelp").textContent = "Selecione um dia útil no calendário para visualizar os horários.";
      list.innerHTML = '<div class="empty-state">Nenhuma data selecionada. Os dias verdes têm horários livres; os amarelos têm alguns horários ocupados e os vermelhos estão lotados.</div>';
      return;
    }
    const formatted = parseKey(selectedDate).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    $("#selectedDateTitle").textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    $("#selectedDateHelp").textContent = "Selecione um horário livre para solicitar o agendamento.";
    getSlots(selectedDate).forEach(slot => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `slot-button ${slot.status === "ocupado" ? "occupied" : ""} ${slot.time === selectedTime ? "selected" : ""}`;
      btn.disabled = slot.status === "ocupado";
      const strong = document.createElement("strong"); strong.textContent = slot.time;
      const small = document.createElement("small"); small.textContent = slot.status === "ocupado" ? "Ocupado" : "Livre";
      btn.append(strong, small);
      if (slot.status === "livre") btn.addEventListener("click", () => {
        selectedTime = slot.time;
        $("#bookingTime").value = `${formatted} às ${slot.time}`;
        $("#bookingForm").hidden = false;
        renderSlots();
        $("#bookingTime").value = `${formatted} às ${slot.time}`;
      });
      list.appendChild(btn);
    });
    if (!getSlots(selectedDate).some(s => s.status === "livre")) list.innerHTML = '<div class="empty-state">Todos os horários desta data estão ocupados. Escolha outro dia ou fale com a clínica.</div>';
  }
  $("#prevMonth").addEventListener("click", () => {
    displayedMonth--; if (displayedMonth < 0) { displayedMonth = 11; displayedYear--; }
    selectedDate = ""; selectedTime = ""; renderCalendar(); renderSlots();
  });
  $("#nextMonth").addEventListener("click", () => {
    displayedMonth++; if (displayedMonth > 11) { displayedMonth = 0; displayedYear++; }
    selectedDate = ""; selectedTime = ""; renderCalendar(); renderSlots();
  });

  function whatsappUrl(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
  $$("[data-whatsapp]").forEach(link => {
    link.href = whatsappUrl(link.dataset.message || "Olá! Gostaria de informações sobre a clínica.");
    link.target = "_blank"; link.rel = "noopener noreferrer";
  });
  $("#bookingRequest").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selectedDate || !selectedTime) return alert("Selecione uma data e um horário livre.");
    const data = new FormData(event.currentTarget);
    if (!data.get("consentimento")) return alert("É necessário aceitar o aviso de privacidade para continuar.");
    const message = [
      "Olá! Gostaria de solicitar um agendamento na Clínica Reinaldo Guazzelli.",
      `Nome: ${data.get("nome")}`, `Celular: ${data.get("celular")}`, `Cidade: ${data.get("cidade")}`,
      `Data e horário solicitados: ${data.get("horario")}`,
      "Entendo que o pedido precisa ser confirmado pela clínica."
    ].join("\n");
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  });
  $("#contactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = `Olá! Sou ${data.get("nome")}.\nAssunto: ${data.get("assunto")}\nDúvida: ${data.get("mensagem")}`;
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  });
  $$("[data-material]").forEach(link => link.addEventListener("click", () => {
    link.href = whatsappUrl(`Olá! Gostaria de solicitar o material informativo: ${link.dataset.material}.`);
    link.target = "_blank"; link.rel = "noopener noreferrer";
  }));

  const dialog = $("#adminDialog");
  $("#adminOpen").addEventListener("click", () => {
    dialog.showModal();
    $("#adminLoginView").hidden = adminLoggedIn;
    $("#adminPanel").hidden = !adminLoggedIn;
    if (adminLoggedIn) renderAdminRecords();
  });
  $("#adminClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  $("#adminLogin").addEventListener("submit", (event) => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("senha");
    if (password !== ADMIN_PASSWORD) return alert("Senha incorreta.");
    adminLoggedIn = true;
    $("#adminLoginView").hidden = true; $("#adminPanel").hidden = false;
    renderAdminRecords();
  });
  $("#adminLogout").addEventListener("click", () => {
    adminLoggedIn = false; $("#adminPanel").hidden = true; $("#adminLoginView").hidden = false;
    $("#adminLogin").reset();
  });
  $("#adminAppointmentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!adminLoggedIn) return alert("Entre na área do proprietário.");
    const form = new FormData(event.currentTarget);
    const date = form.get("data"), time = form.get("horario"), status = form.get("status");
    if (!date || isPast(date)) return alert("Escolha uma data de hoje ou futura.");
    if (!isBusinessDay(...date.split("-").map((n, i) => i === 1 ? Number(n)-1 : Number(n)))) return alert("O atendimento padrão é de segunda a sexta-feira.");
    agenda[date] ||= {};
    if (status === "livre") delete agenda[date][time];
    else agenda[date][time] = {
      status: "ocupado",
      nome: String(form.get("nome") || "").trim(),
      celular: String(form.get("celular") || "").trim(),
      cidade: String(form.get("cidade") || "").trim(),
      observacao: String(form.get("observacao") || "").trim(),
      cancelamento: form.get("cancelamento") === "on",
      atualizadoEm: new Date().toISOString()
    };
    if (Object.keys(agenda[date]).length === 0) delete agenda[date];
    saveAgenda();
    event.currentTarget.reset();
    renderCalendar(); renderSlots(); renderAdminRecords();
    alert(status === "livre" ? "Horário liberado nesta agenda demonstrativa." : "Horário salvo nesta agenda demonstrativa.");
  });
  function renderAdminRecords() {
    const root = $("#adminRecords"); root.innerHTML = "";
    const records = [];
    Object.entries(agenda).sort(([a],[b]) => a.localeCompare(b)).forEach(([date, slots]) => {
      Object.entries(slots).sort(([a],[b]) => a.localeCompare(b)).forEach(([time, info]) => records.push({date,time,...info}));
    });
    if (!records.length) { root.innerHTML = '<div class="empty-state">Nenhum horário ocupado cadastrado nesta demonstração.</div>'; return; }
    records.forEach(record => {
      const card = document.createElement("div"); card.className = "admin-record";
      const title = document.createElement("strong");
      title.textContent = `${parseKey(record.date).toLocaleDateString("pt-BR")} — ${record.time}`;
      const details = document.createElement("div");
      details.textContent = `Status: ${record.status} · Nome: ${record.nome || "não informado"} · Celular: ${record.celular || "não informado"} · Cidade: ${record.cidade || "não informada"}${record.cancelamento ? " · Desistência/cancelamento registrado" : ""}${record.observacao ? " · Observação: " + record.observacao : ""}`;
      const release = document.createElement("button"); release.type = "button"; release.textContent = "Liberar este horário";
      release.addEventListener("click", () => {
        if (!confirm(`Liberar o horário ${record.time} em ${record.date}?`)) return;
        delete agenda[record.date][record.time];
        if (!Object.keys(agenda[record.date]).length) delete agenda[record.date];
        saveAgenda(); renderCalendar(); renderSlots(); renderAdminRecords();
      });
      card.append(title, details, release); root.appendChild(card);
    });
  }
  $("#exportData").addEventListener("click", () => {
    const rows = [["data","horario","status","nome","celular","cidade","cancelamento","observacao"]];
    Object.entries(agenda).forEach(([date, slots]) => Object.entries(slots).forEach(([time, info]) => rows.push([date,time,info.status,info.nome,info.celular,info.cidade,info.cancelamento ? "sim" : "não",info.observacao])));
    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g,'""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "agenda-demonstrativa-clinica.csv"; a.click(); URL.revokeObjectURL(url);
  });
  $("#clearDemo").addEventListener("click", () => {
    if (!confirm("Apagar todos os horários da agenda demonstrativa deste navegador?")) return;
    agenda = {}; saveAgenda(); renderCalendar(); renderSlots(); renderAdminRecords();
  });

  $("#menuToggle").addEventListener("click", () => {
    const nav = $("#mainNav"); const open = nav.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
  });
  $$("#mainNav a").forEach(link => link.addEventListener("click", () => {
    $("#mainNav").classList.remove("open"); $("#menuToggle").setAttribute("aria-expanded", "false");
  }));
  $("#year").textContent = new Date().getFullYear();
  renderCalendar(); renderSlots();
})();
