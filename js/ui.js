window.UI = {
  els: {},

  init() {
    this.els.loginView = document.getElementById("loginView");
    this.els.mainView = document.getElementById("mainView");
    this.els.loginMessage = document.getElementById("loginMessage");
    this.els.projectsTableBody = document.getElementById("projectsTableBody");
    this.els.tableEmpty = document.getElementById("tableEmpty");
    this.els.detailEmpty = document.getElementById("detailEmpty");
    this.els.detailContent = document.getElementById("detailContent");
    this.els.detailTitle = document.getElementById("detailTitle");
    this.els.detailEstadoBadge = document.getElementById("detailEstadoBadge");
    this.els.sessionBadge = document.getElementById("sessionBadge");
    this.els.todayBadge = document.getElementById("todayBadge");
    this.els.btnNuevoProyecto = document.getElementById("btnNuevoProyecto");
    this.els.saveMessage = document.getElementById("saveMessage");
    this.els.stepsContainer = document.getElementById("stepsContainer");

    this.els.modalNuevoProyecto = document.getElementById("modalNuevoProyecto");
    this.els.newProjectMessage = document.getElementById("newProjectMessage");

    this.bindEvents();
    this.renderToday();
  },

  bindEvents() {
    const byId = (id) => document.getElementById(id);

    const btnLogin = byId("btnLogin");
    const btnLogout = byId("btnLogout");
    const btnGuardarProyecto = byId("btnGuardarProyecto");
    const btnDescargarQR = byId("btnDescargarQR");
    const btnNuevoProyecto = byId("btnNuevoProyecto");
    const btnCerrarModalNuevo = byId("btnCerrarModalNuevo");
    const btnCrearProyecto = byId("btnCrearProyecto");
    const btnAbrirAdjunto = byId("btnAbrirAdjunto");
    const thSortID = byId("thSortID");

    if (btnLogin) btnLogin.addEventListener("click", window.App.handleLogin);
    if (btnLogout) btnLogout.addEventListener("click", window.App.handleLogout);
    if (btnGuardarProyecto) btnGuardarProyecto.addEventListener("click", window.App.handleGuardarProyecto);
    if (btnDescargarQR) btnDescargarQR.addEventListener("click", window.App.handleDescargarQR);
    if (btnNuevoProyecto) btnNuevoProyecto.addEventListener("click", () => this.openNewModal());
    if (btnCerrarModalNuevo) btnCerrarModalNuevo.addEventListener("click", () => this.closeNewModal());
    if (btnCrearProyecto) btnCrearProyecto.addEventListener("click", window.App.handleCrearProyecto);
    if (btnAbrirAdjunto) btnAbrirAdjunto.addEventListener("click", this.abrirAdjunto);
    if (thSortID) thSortID.addEventListener("click", window.App.toggleSortById);

    ["searchInput", "filterCliente", "filterResponsable", "filterEstado"].forEach((id) => {
      const el = byId(id);
      if (el) {
        el.addEventListener("input", window.App.refreshFilters);
        el.addEventListener("change", window.App.refreshFilters);
      }
    });

    if (this.els.modalNuevoProyecto) {
      this.els.modalNuevoProyecto.addEventListener("click", (e) => {
        if (e.target === this.els.modalNuevoProyecto) this.closeNewModal();
      });
    }
  },

  renderToday() {
    if (!this.els.todayBadge) return;
    const d = new Date();
    this.els.todayBadge.textContent = d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  },

  abrirAdjunto() {
    const linkInput = document.getElementById("fieldLink");
    const link = linkInput ? linkInput.value.trim() : "";
    if (!link) {
      alert("Este proyecto no tiene un enlace adjunto.");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  },

  showLogin() {
    if (this.els.loginView) this.els.loginView.classList.add("active");
    if (this.els.mainView) this.els.mainView.classList.remove("active");
  },

  showMain() {
    if (this.els.loginView) this.els.loginView.classList.remove("active");
    if (this.els.mainView) this.els.mainView.classList.add("active");

    const user = window.Auth.currentUser;
    if (this.els.sessionBadge) {
      this.els.sessionBadge.textContent = `${user?.nombre || user?.usuario || ""}${user?.administrador ? " · Admin" : ""}`;
    }
    if (this.els.btnNuevoProyecto) {
      this.els.btnNuevoProyecto.classList.toggle("hidden", !user?.administrador);
    }
  },

  setLoginMessage(text, type = "") {
    if (!this.els.loginMessage) return;
    this.els.loginMessage.textContent = text || "";
    this.els.loginMessage.className = `message ${type}`.trim();
  },

  setSaveMessage(text, type = "") {
    if (!this.els.saveMessage) return;
    this.els.saveMessage.textContent = text || "";
    this.els.saveMessage.className = `message ${type}`.trim();
  },

  setNewProjectMessage(text, type = "") {
    if (!this.els.newProjectMessage) return;
    this.els.newProjectMessage.textContent = text || "";
    this.els.newProjectMessage.className = `message ${type}`.trim();
  },

  renderFilterOptions() {
    const clienteSel = document.getElementById("filterCliente");
    const respSel = document.getElementById("filterResponsable");
    if (!clienteSel || !respSel) return;

    const currentCliente = clienteSel.value;
    const currentResp = respSel.value;

    clienteSel.innerHTML = `<option value="">Cliente</option>`;
    respSel.innerHTML = `<option value="">Responsable</option>`;

    window.Proyectos.getClientesUnicos().forEach((x) => {
      clienteSel.innerHTML += `<option value="${window.Utils.escapeHtml(x)}">${window.Utils.escapeHtml(x)}</option>`;
    });

    window.Proyectos.getResponsablesUnicos().forEach((x) => {
      respSel.innerHTML += `<option value="${window.Utils.escapeHtml(x)}">${window.Utils.escapeHtml(x)}</option>`;
    });

    clienteSel.value = currentCliente;
    respSel.value = currentResp;
  },

  renderNewProjectOptions() {
    const clienteSel = document.getElementById("nuevoCliente");
    const respSel = document.getElementById("nuevoResponsable");
    if (!clienteSel || !respSel) return;

    const currentCliente = clienteSel.value;
    const currentResp = respSel.value;

    clienteSel.innerHTML = `<option value="">Selecciona un cliente</option>`;
    respSel.innerHTML = `<option value="">Selecciona un responsable</option>`;

    (window.Proyectos.catalogoClientes || []).forEach((x) => {
      clienteSel.innerHTML += `<option value="${window.Utils.escapeHtml(x)}">${window.Utils.escapeHtml(x)}</option>`;
    });

    (window.Proyectos.catalogoResponsables || []).forEach((x) => {
      respSel.innerHTML += `<option value="${window.Utils.escapeHtml(x)}">${window.Utils.escapeHtml(x)}</option>`;
    });

    clienteSel.value = currentCliente;
    respSel.value = currentResp;
  },

  renderResponsableDetalleOptions(valorActual = "") {
    const sel = document.getElementById("fieldNombre");
    if (!sel) return;

    const actual = window.Utils.normalizarTexto(valorActual);
    const responsables = window.Proyectos.catalogoResponsables || [];

    sel.innerHTML = `<option value="">Selecciona un responsable</option>`;

    responsables.forEach((x) => {
      sel.innerHTML += `<option value="${window.Utils.escapeHtml(x)}">${window.Utils.escapeHtml(x)}</option>`;
    });

    if (actual && !responsables.includes(actual)) {
      sel.innerHTML += `<option value="${window.Utils.escapeHtml(actual)}">${window.Utils.escapeHtml(actual)}</option>`;
    }

    sel.value = actual;
    sel.disabled = !window.Auth.currentUser?.administrador;
  },

  renderKPIs(rows) {
    const base = rows || [];
    const countBy = (estado) => base.filter(x => (x._estadoCalculado || "") === estado).length;

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText("kpiTotal", base.length);
    setText("kpiDesarrollo", countBy("En desarrollo"));
    setText("kpiEspera", countBy("En espera"));
    setText("kpiImpreso", countBy("Impreso"));
    setText("kpiEntregado", countBy("Entregado"));
    setText("kpiFacturado", countBy("Facturado"));
    setText("kpiPagado", countBy("Pagado"));
  },

  renderSortIndicator() {
    const indicator = document.getElementById("sortIdIndicator");
    if (!indicator) return;
    indicator.textContent = window.Proyectos.sortDirection === "asc" ? "▲" : "▼";
  },

  renderTable() {
    const body = this.els.projectsTableBody;
    const rows = window.Proyectos.filtered || [];
    if (!body) return;

    body.innerHTML = "";
    this.renderKPIs(rows);
    this.renderSortIndicator();

    if (this.els.tableEmpty) {
      this.els.tableEmpty.classList.toggle("hidden", rows.length > 0);
    }

    rows.forEach((item) => {
      const tr = document.createElement("tr");
      tr.dataset.key = item._firebaseKey;
      if (item._firebaseKey === window.Proyectos.selectedKey) tr.classList.add("selected");

      const estado = item._estadoCalculado || "Sin iniciar";
      const estadoClass = window.Utils.getEstadoClass(estado);

      tr.innerHTML = `
        <td>${window.Utils.escapeHtml(String(item.ID))}</td>
        <td>${window.Utils.escapeHtml(item.Proyecto)}</td>
        <td>${window.Utils.escapeHtml(item.Cliente)}</td>
        <td>${window.Utils.escapeHtml(item.Nombre)}</td>
        <td>${window.Utils.escapeHtml(item.PO)}</td>
        <td><span class="status-badge ${estadoClass}">${window.Utils.escapeHtml(estado)}</span></td>
        <td>${window.Utils.escapeHtml(item._ultimaFechaActiva || "—")}</td>
      `;

      tr.addEventListener("click", () => {
        window.App.selectProject(item._firebaseKey);
      });

      body.appendChild(tr);
    });
  },

  showEmptyDetail() {
    if (this.els.detailEmpty) this.els.detailEmpty.classList.remove("hidden");
    if (this.els.detailContent) this.els.detailContent.classList.add("hidden");
  },

  updateProgress(registro) {
    let completadas = 0;
    for (let i = 1; i <= 12; i++) {
      if (registro[`Step${i}`]) completadas++;
    }

    const pct = Math.round((completadas / 12) * 100);

    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");

    if (progressText) progressText.textContent = `${completadas} / 12 etapas completadas`;
    if (progressBar) progressBar.style.width = `${pct}%`;
  },

  parseEntregaDetalle(entregadoRaw, fechaEntregaRaw) {
    const parsed = window.Utils.parseCampoEntregado(entregadoRaw || "");
    let observaciones = window.Utils.normalizarTexto(parsed.observaciones);
    let fecha = window.Utils.normalizarFechaTexto(fechaEntregaRaw || "");

    if (!fecha && observaciones) {
      const match = observaciones.match(/\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/);
      if (match) {
        fecha = match[1];
        observaciones = observaciones
          .replace(match[1], "")
          .replace(/\s{2,}/g, " ")
          .replace(/^[-_,.;:\s]+|[-_,.;:\s]+$/g, "")
          .trim();
      }
    }

    return {
      quienEntrega: parsed.quienEntrega || "",
      quienRecibe: parsed.quienRecibe || "",
      observaciones,
      fecha
    };
  },

  renderBitacora(historial) {
    const container = document.getElementById("historialBitacora");
    if (!container) return;

    const text = window.Utils.normalizarTexto(historial);
    container.innerHTML = "";

    if (!text) {
      container.innerHTML = `<div class="history-empty">Aún no hay entradas en la bitácora.</div>`;
      return;
    }

    const normalizado = text.replace(/\r\n/g, "\n");
    const entries = normalizado
      .split(/\n(?=\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s+\d{1,2}:\d{2}\s+(?:a\. m\.|p\. m\.|am|pm))?\s*-\s)/i)
      .map(x => x.trim())
      .filter(Boolean);

    entries.forEach((entry) => {
      const lines = entry.split("\n");
      const meta = lines[0] || "";
      const body = lines.slice(1).join("\n").trim();

      const card = document.createElement("div");
      card.className = "history-entry";

      const metaEl = document.createElement("div");
      metaEl.className = "history-meta";
      metaEl.textContent = meta;
      card.appendChild(metaEl);

      if (body) {
        const bodyEl = document.createElement("div");
        bodyEl.className = "history-body";
        bodyEl.textContent = body;
        card.appendChild(bodyEl);
      }

      container.appendChild(card);
    });
  },

  renderDetail(registro) {
    if (!registro) {
      this.showEmptyDetail();
      return;
    }

    if (this.els.detailEmpty) this.els.detailEmpty.classList.add("hidden");
    if (this.els.detailContent) this.els.detailContent.classList.remove("hidden");

    if (this.els.detailTitle) this.els.detailTitle.textContent = registro.Proyecto || "(Sin nombre)";
    if (this.els.detailEstadoBadge) {
      this.els.detailEstadoBadge.textContent = registro._estadoCalculado || "Sin iniciar";
      this.els.detailEstadoBadge.className = `status-badge ${window.Utils.getEstadoClass(registro._estadoCalculado)}`;
    }

    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || "";
    };
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || "";
    };

    setText("detailClienteMini", registro.Cliente || "Sin cliente");
    setText("detailResponsableMini", registro.Nombre || "Sin responsable");
    setText("detailIDMini", `ID ${registro.ID || ""}`);

    setValue("fieldID", registro.ID);
    setValue("fieldProyecto", registro.Proyecto);
    setValue("fieldCliente", registro.Cliente);
    setValue("fieldPO", registro.PO);
    this.renderResponsableDetalleOptions(registro.Nombre);
    setValue("fieldLink", registro.Link);

    const entregaInfo = this.parseEntregaDetalle(registro.Entregado, registro.FechaEntrega);
    setValue("fieldFechaEntrega", entregaInfo.fecha);
    setValue("fieldQuienEntrega", entregaInfo.quienEntrega);
    setValue("fieldQuienRecibe", entregaInfo.quienRecibe);
    setValue("fieldObservacionesEntrega", entregaInfo.observaciones);

    setValue("fieldInDateStamp", registro.In_DateStamp);
    setValue("fieldNuevoComentario", "");
    this.renderBitacora(registro.Historial);

    this.updateProgress(registro);
    this.renderSteps(registro);
    window.QRModule.render("qrContainer", registro.ID || "");
  },

  renderSteps(registro) {
    if (!this.els.stepsContainer) return;
    this.els.stepsContainer.innerHTML = "";

    for (let i = 1; i <= 12; i++) {
      const row = document.createElement("div");
      row.className = "step-row";
      if (registro[`Step${i}`]) row.classList.add("active-step");

      const nextDate = i < 12 ? registro[`Step${i + 1}_Date`] : "";
      const currDate = registro[`Step${i}_Date`];
      const diff = i < 12 ? window.Utils.diffDiasEntreFechas(currDate, nextDate) : null;
      const diffText = diff === null ? "—" : `${diff} día(s)`;

      row.innerHTML = `
        <div class="step-marker">${i}</div>
        <div>
          <div class="step-title">${window.Utils.escapeHtml(window.STEP_NAMES[i - 1])}</div>
          <div class="small-note">Etapa ${i}</div>
        </div>
        <div class="step-date">
          <div class="inline-step-controls">
            <input type="checkbox" id="stepCheck${i}" ${registro[`Step${i}`] ? "checked" : ""} />
            <input type="text" id="stepDate${i}" value="${window.Utils.escapeHtml(registro[`Step${i}_Date`] || "")}" placeholder="dd/MM/yyyy" />
          </div>
        </div>
        <div class="step-diff">a siguiente: ${i < 12 ? diffText : "—"}</div>
      `;

      this.els.stepsContainer.appendChild(row);

      const check = row.querySelector(`#stepCheck${i}`);
      const date = row.querySelector(`#stepDate${i}`);

      check.addEventListener("change", () => {
        if (check.checked && !date.value.trim()) {
          date.value = window.Utils.formatFechaHoy();
        }
        window.App.previewEstadoFromForm();
      });

      date.addEventListener("input", () => {
        window.App.previewEstadoFromForm();
      });
    }
  },

  getFilters() {
    return {
      search: document.getElementById("searchInput")?.value || "",
      cliente: document.getElementById("filterCliente")?.value || "",
      responsable: document.getElementById("filterResponsable")?.value || "",
      estado: document.getElementById("filterEstado")?.value || ""
    };
  },

  getFormRegistro() {
    const selected = window.Proyectos.getByKey(window.Proyectos.selectedKey);
    if (!selected) return null;

    const getValue = (id) => document.getElementById(id)?.value || "";
    const registro = { ...selected };

    registro.Proyecto = getValue("fieldProyecto");
    registro.Cliente = getValue("fieldCliente");
    registro.PO = getValue("fieldPO");
    registro.Nombre = getValue("fieldNombre");
    registro.Link = getValue("fieldLink");
    registro.Entregado = selected.Entregado || "";
    registro.FechaEntrega = getValue("fieldFechaEntrega");
    registro.NuevoComentario = getValue("fieldNuevoComentario");

    for (let i = 1; i <= 12; i++) {
      registro[`Step${i}`] = document.getElementById(`stepCheck${i}`)?.checked || false;
      registro[`Step${i}_Date`] = document.getElementById(`stepDate${i}`)?.value || "";
    }

    registro._estadoCalculado = window.Utils.getEstadoCalculado(registro);
    return registro;
  },

  previewEstado(estado) {
    if (!this.els.detailEstadoBadge) return;
    this.els.detailEstadoBadge.textContent = estado;
    this.els.detailEstadoBadge.className = `status-badge ${window.Utils.getEstadoClass(estado)}`;
  },

  openNewModal() {
    if (!this.els.modalNuevoProyecto) return;
    const idPreview = document.getElementById("nuevoIDPreview");
    if (idPreview) idPreview.value = String(Date.now());
    this.renderNewProjectOptions();
    this.clearNewProjectForm(false);
    this.els.modalNuevoProyecto.classList.remove("hidden");
  },

  closeNewModal() {
    if (!this.els.modalNuevoProyecto) return;
    this.els.modalNuevoProyecto.classList.add("hidden");
  },

  clearNewProjectForm(resetId = true) {
    const set = (id, value = "") => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    };

    set("nuevoProyecto", "");
    set("nuevoCliente", "");
    set("nuevoPO", "");
    set("nuevoResponsable", "");
    set("nuevoHistorial", "");

    if (resetId) {
      set("nuevoIDPreview", String(Date.now()));
    }

    this.setNewProjectMessage("", "");
  },

  getNewProjectForm() {
    const get = (id) => document.getElementById(id)?.value || "";

    return {
      IDPreview: get("nuevoIDPreview"),
      Proyecto: get("nuevoProyecto"),
      Cliente: get("nuevoCliente"),
      PO: get("nuevoPO"),
      Nombre: get("nuevoResponsable"),
      Historial: get("nuevoHistorial")
    };
  }
};
