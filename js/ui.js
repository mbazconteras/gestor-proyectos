window.UI = {
  els: {},
  calCenterInbox: [],
  calCenterSelectedKey: null,

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
    this.els.btnNuevoCliente = document.getElementById("btnNuevoCliente");
    this.els.btnEliminarCliente = document.getElementById("btnEliminarCliente");
    this.els.btnServiciosExternos = document.getElementById("btnServiciosExternos");
    this.els.btnPanelGerencial = document.getElementById("btnPanelGerencial");
    this.els.btnFacturasClientes = document.getElementById("btnFacturasClientes");
    this.els.btnLogisticaEntregas = document.getElementById("btnLogisticaEntregas");
    this.els.badgePanelRevision = document.getElementById("badgePanelRevision");
    this.els.badgePanelRevisionLiberado = document.getElementById("badgePanelRevisionLiberado");
    this.els.badgeLogisticaEntregas = document.getElementById("badgeLogisticaEntregas");
    this.els.btnCalCenter = document.getElementById("btnCalCenter");
    this.els.badgeCalCenter = document.getElementById("badgeCalCenter");
    this.els.calCenterDropdown = document.getElementById("calCenterDropdown");
    this.els.calCenterList = document.getElementById("calCenterList");
    this.els.calCenterThread = document.getElementById("calCenterThread");
    this.els.calCenterThreadEmpty = document.getElementById("calCenterThreadEmpty");
    this.els.calCenterThreadTitle = document.getElementById("calCenterThreadTitle");
    this.els.calCenterThreadMeta = document.getElementById("calCenterThreadMeta");
    this.els.calCenterThreadBody = document.getElementById("calCenterThreadBody");
    this.els.calCenterReplyText = document.getElementById("calCenterReplyText");
    this.els.calCenterMessage = document.getElementById("calCenterMessage");
    this.els.saveMessage = document.getElementById("saveMessage");
    this.els.stepsContainer = document.getElementById("stepsContainer");

    this.els.modalNuevoProyecto = document.getElementById("modalNuevoProyecto");
    this.els.newProjectMessage = document.getElementById("newProjectMessage");

    this.els.modalNuevoCliente = document.getElementById("modalNuevoCliente");
    this.els.newClientMessage = document.getElementById("newClientMessage");

    this.els.modalEliminarCliente = document.getElementById("modalEliminarCliente");
    this.els.deleteClientMessage = document.getElementById("deleteClientMessage");

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
    const btnNuevoCliente = byId("btnNuevoCliente");
    const btnEliminarCliente = byId("btnEliminarCliente");
    const btnCerrarModalNuevo = byId("btnCerrarModalNuevo");
    const btnCrearProyecto = byId("btnCrearProyecto");
    const btnCerrarModalCliente = byId("btnCerrarModalCliente");
    const btnCrearCliente = byId("btnCrearCliente");
    const btnCerrarModalEliminarCliente = byId("btnCerrarModalEliminarCliente");
    const btnEliminarClienteConfirmar = byId("btnEliminarClienteConfirmar");
    const btnAbrirAdjunto = byId("btnAbrirAdjunto");
    const thSortID = byId("thSortID");
    const btnCalCenter = byId("btnCalCenter");
    const btnCerrarCalCenter = byId("btnCerrarCalCenter");
    const btnResponderCalCenter = byId("btnResponderCalCenter");
    const btnEliminarCalCenter = byId("btnEliminarCalCenter");

    if (btnLogin) btnLogin.addEventListener("click", window.App.handleLogin);
    if (btnLogout) btnLogout.addEventListener("click", window.App.handleLogout);
    if (btnGuardarProyecto) btnGuardarProyecto.addEventListener("click", window.App.handleGuardarProyecto);
    if (btnDescargarQR) btnDescargarQR.addEventListener("click", window.App.handleDescargarQR);
    if (btnNuevoProyecto) btnNuevoProyecto.addEventListener("click", () => this.openNewModal());
    if (btnNuevoCliente) btnNuevoCliente.addEventListener("click", () => this.openNewClientModal());
    if (btnEliminarCliente) btnEliminarCliente.addEventListener("click", () => this.openDeleteClientModal());
    if (btnCerrarModalNuevo) btnCerrarModalNuevo.addEventListener("click", () => this.closeNewModal());
    if (btnCrearProyecto) btnCrearProyecto.addEventListener("click", window.App.handleCrearProyecto);
    if (btnCerrarModalCliente) btnCerrarModalCliente.addEventListener("click", () => this.closeNewClientModal());
    if (btnCrearCliente) btnCrearCliente.addEventListener("click", window.App.handleCrearCliente);
    if (btnCerrarModalEliminarCliente) btnCerrarModalEliminarCliente.addEventListener("click", () => this.closeDeleteClientModal());
    if (btnEliminarClienteConfirmar) btnEliminarClienteConfirmar.addEventListener("click", window.App.handleEliminarCliente);
    if (btnAbrirAdjunto) btnAbrirAdjunto.addEventListener("click", this.abrirAdjunto);
    if (thSortID) thSortID.addEventListener("click", window.App.toggleSortById);
    if (btnCalCenter) btnCalCenter.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleCalCenter();
    });
    if (btnCerrarCalCenter) btnCerrarCalCenter.addEventListener("click", () => this.closeCalCenter());
    if (btnResponderCalCenter) btnResponderCalCenter.addEventListener("click", window.App.handleResponderCalCenter);
    if (btnEliminarCalCenter) btnEliminarCalCenter.addEventListener("click", window.App.handleEliminarCalCenter);

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

    if (this.els.modalNuevoCliente) {
      this.els.modalNuevoCliente.addEventListener("click", (e) => {
        if (e.target === this.els.modalNuevoCliente) this.closeNewClientModal();
      });
    }

    if (this.els.modalEliminarCliente) {
      this.els.modalEliminarCliente.addEventListener("click", (e) => {
        if (e.target === this.els.modalEliminarCliente) this.closeDeleteClientModal();
      });
    }

    document.addEventListener("click", (e) => {
      if (!this.els.calCenterDropdown || this.els.calCenterDropdown.classList.contains("hidden")) return;
      if (this.els.btnCalCenter?.contains(e.target)) return;
      if (this.els.calCenterDropdown.contains(e.target)) return;
      this.closeCalCenter();
    });
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


  canAccessModule(modulo) {
    return !!window.Auth?.hasPermiso?.(modulo);
  },

  toggleModuleButtons() {
    if (this.els.btnServiciosExternos) {
      this.els.btnServiciosExternos.classList.toggle("hidden", !this.canAccessModule("ServiciosExternos"));
    }
    if (this.els.btnPanelGerencial) {
      this.els.btnPanelGerencial.classList.toggle("hidden", !this.canAccessModule("Gerencia"));
    }
    if (this.els.btnFacturasClientes) {
      this.els.btnFacturasClientes.classList.toggle("hidden", !this.canAccessModule("FacturasClientes"));
    }
    if (this.els.btnLogisticaEntregas) {
      this.els.btnLogisticaEntregas.classList.toggle("hidden", !this.canAccessModule("Logistica"));
    }
  },

  showLogin() {
    if (this.els.loginView) this.els.loginView.classList.add("active");
    if (this.els.mainView) this.els.mainView.classList.remove("active");
    this.toggleModuleButtons();
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
    if (this.els.btnNuevoCliente) {
      this.els.btnNuevoCliente.classList.toggle("hidden", !user?.administrador);
    }
    if (this.els.btnEliminarCliente) {
      this.els.btnEliminarCliente.classList.toggle("hidden", !user?.administrador);
    }
    this.toggleModuleButtons();
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

  setNewClientMessage(text, type = "") {
    if (!this.els.newClientMessage) return;
    this.els.newClientMessage.textContent = text || "";
    this.els.newClientMessage.className = `message ${type}`.trim();
  },

  setDeleteClientMessage(text, type = "") {
    if (!this.els.deleteClientMessage) return;
    this.els.deleteClientMessage.textContent = text || "";
    this.els.deleteClientMessage.className = `message ${type}`.trim();
  },

  formatBadgeCount(value) {
    const num = Number(value || 0);
    if (!num || num < 1) return "";
    if (num > 99) return "99+";
    return String(num);
  },

  setNavBadge(el, count) {
    if (!el) return;
    const txt = this.formatBadgeCount(count);
    el.textContent = txt || "0";
    el.classList.toggle("hidden", !txt);
  },


  setCalCenterMessage(text, type = "") {
    if (!this.els.calCenterMessage) return;
    this.els.calCenterMessage.textContent = text || "";
    this.els.calCenterMessage.className = `message ${type}`.trim();
  },

  toggleCalCenter() {
    if (!this.els.calCenterDropdown) return;
    const isHidden = this.els.calCenterDropdown.classList.contains("hidden");
    if (isHidden) {
      this.openCalCenter();
      return;
    }
    this.closeCalCenter();
  },

  async openCalCenter() {
    if (!this.els.calCenterDropdown) return;
    this.els.calCenterDropdown.classList.remove("hidden");
    this.setCalCenterMessage("", "");
    await this.refreshCalCenterInbox();
  },

  closeCalCenter() {
    if (!this.els.calCenterDropdown) return;
    this.els.calCenterDropdown.classList.add("hidden");
    this.setCalCenterMessage("", "");
  },

  normalizeCalCenterRecord(key, raw = {}) {
    return {
      _firebaseKey: key,
      ID: window.Utils.normalizarTexto(raw.ID || key),
      _From: window.Utils.normalizarTexto(raw._From),
      _To: window.Utils.normalizarTexto(raw._To),
      _Body: window.Utils.normalizarTexto(raw._Body)
    };
  },

  formatCalCenterDate(value) {
    const parsed = window.Utils.parseFechaFlexible(value);
    if (!parsed) return window.Utils.normalizarTexto(value) || "Sin fecha";
    return parsed.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  },

  extractCalCenterDate(msg) {
    const body = window.Utils.normalizarTexto(msg?._Body);
    if (!body) return msg?.ID || "";
    const match = body.match(/\((\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2}\s+(?:a\. m\.|p\. m\.|am|pm))?)\)/i);
    return match ? match[1] : (msg?.ID || "");
  },

  getCalCenterPreview(body) {
    const txt = window.Utils.normalizarTexto(body).replace(/\s+/g, " ").trim();
    return txt.length > 140 ? `${txt.slice(0, 140)}…` : txt;
  },

  async refreshCalCenterInbox() {
    try {
      const usuario = window.Utils.normalizarTexto(window.Auth.currentUser?.usuario).toLowerCase();
      const snap = await window.database.ref("CalCenter").once("value");
      const data = snap.val() || {};

      const inbox = Object.keys(data)
        .map((key) => this.normalizeCalCenterRecord(key, data[key] || {}))
        .filter((msg) => window.Utils.normalizarTexto(msg._To).toLowerCase() === usuario)
        .sort((a, b) => Number(b._firebaseKey) - Number(a._firebaseKey));

      this.calCenterInbox = inbox;
      this.renderCalCenterList();

      if (!inbox.length) {
        this.calCenterSelectedKey = null;
        this.renderCalCenterThread(null);
        return;
      }

      const stillExists = inbox.find((x) => x._firebaseKey === this.calCenterSelectedKey);
      if (stillExists) {
        this.renderCalCenterThread(stillExists);
        return;
      }

      this.selectCalCenterMessage(inbox[0]._firebaseKey);
    } catch (err) {
      console.error("Error al cargar CalCenter:", err);
      this.calCenterInbox = [];
      this.renderCalCenterList();
      this.renderCalCenterThread(null);
      this.setCalCenterMessage("No fue posible cargar los mensajes.", "error");
    }
  },

  renderCalCenterList() {
    const container = this.els.calCenterList;
    if (!container) return;

    container.innerHTML = "";

    if (!this.calCenterInbox.length) {
      container.innerHTML = `<div class="calcenter-empty">No tienes mensajes pendientes.</div>`;
      return;
    }

    this.calCenterInbox.forEach((msg) => {
      const item = document.createElement("div");
      item.className = "calcenter-item";
      if (msg._firebaseKey === this.calCenterSelectedKey) {
        item.classList.add("active");
      }

      item.innerHTML = `
        <div class="calcenter-item-top">
          <div class="calcenter-item-from">${window.Utils.escapeHtml(msg._From || "Sin remitente")}</div>
          <div class="calcenter-item-date">${window.Utils.escapeHtml(this.formatCalCenterDate(this.extractCalCenterDate(msg)))}</div>
        </div>
        <div class="calcenter-item-preview">${window.Utils.escapeHtml(this.getCalCenterPreview(msg._Body))}</div>
      `;

      item.addEventListener("click", () => this.selectCalCenterMessage(msg._firebaseKey));
      container.appendChild(item);
    });
  },

  selectCalCenterMessage(key) {
    this.calCenterSelectedKey = key;
    this.renderCalCenterList();
    const selected = this.calCenterInbox.find((x) => x._firebaseKey === key) || null;
    this.renderCalCenterThread(selected);
    this.setCalCenterMessage("", "");
  },

  renderCalCenterThread(msg) {
    if (!this.els.calCenterThread || !this.els.calCenterThreadEmpty) return;

    if (!msg) {
      this.els.calCenterThread.classList.add("hidden");
      this.els.calCenterThreadEmpty.classList.remove("hidden");
      if (this.els.calCenterReplyText) this.els.calCenterReplyText.value = "";
      return;
    }

    this.els.calCenterThread.classList.remove("hidden");
    this.els.calCenterThreadEmpty.classList.add("hidden");

    if (this.els.calCenterThreadTitle) {
      this.els.calCenterThreadTitle.textContent = `Conversación con ${msg._From || "usuario"}`;
    }
    if (this.els.calCenterThreadMeta) {
      this.els.calCenterThreadMeta.textContent = `Mensaje ${msg.ID || msg._firebaseKey}`;
    }
    if (this.els.calCenterThreadBody) {
      this.els.calCenterThreadBody.textContent = msg._Body || "";
    }
    if (this.els.calCenterReplyText) {
      this.els.calCenterReplyText.value = "";
    }
  },

  getSelectedCalCenterMessage() {
    if (!this.calCenterSelectedKey) return null;
    return this.calCenterInbox.find((x) => x._firebaseKey === this.calCenterSelectedKey) || null;
  },

  async refreshNavBadges() {
    try {
      const usuario = window.Utils.normalizarTexto(window.Auth.currentUser?.usuario).toLowerCase();

      const [estudiosSnap, paquetesSnap, calCenterSnap] = await Promise.all([
        window.database.ref("estudios").once("value"),
        window.database.ref("paquetes").once("value"),
        window.database.ref("CalCenter").once("value")
      ]);

      const estudios = estudiosSnap.val() || {};
      const paquetes = paquetesSnap.val() || {};
      const calcenter = calCenterSnap.val() || {};

      const normalizaEstado = (valor) => {
        return String(valor || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      };

      let revisionCount = 0;
      let liberadoImpresionCount = 0;

      Object.keys(estudios).forEach((key) => {
        const item = estudios[key] || {};
        const estado = normalizaEstado(item.estado);

        if (estado === "para revision" || estado === "corregido") {
          revisionCount += 1;
        }

        if (estado === "liberado para impresion") {
          liberadoImpresionCount += 1;
        }
      });

      let logisticaCount = 0;
      Object.keys(paquetes).forEach((key) => {
        const item = paquetes[key] || {};
        const estado = normalizaEstado(item.estado);

        if (estado === "pendiente") {
          logisticaCount += 1;
        }
      });

      let calCenterCount = 0;
      Object.keys(calcenter).forEach((key) => {
        const item = calcenter[key] || {};
        const toUser = window.Utils.normalizarTexto(item._To).toLowerCase();
        if (toUser === usuario) {
          calCenterCount += 1;
        }
      });

      this.setNavBadge(this.els.badgePanelRevision, revisionCount);
      this.setNavBadge(this.els.badgePanelRevisionLiberado, liberadoImpresionCount);
      this.setNavBadge(this.els.badgeLogisticaEntregas, logisticaCount);
      this.setNavBadge(this.els.badgeCalCenter, calCenterCount);
    } catch (err) {
      console.error("No se pudieron cargar los badges del menú:", err);
      this.setNavBadge(this.els.badgePanelRevision, 0);
      this.setNavBadge(this.els.badgePanelRevisionLiberado, 0);
      this.setNavBadge(this.els.badgeLogisticaEntregas, 0);
      this.setNavBadge(this.els.badgeCalCenter, 0);
    }
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

  renderDeleteClientOptions() {
    const clienteSel = document.getElementById("clienteEliminarSelect");
    if (!clienteSel) return;

    const current = clienteSel.value;
    clienteSel.innerHTML = `<option value="">Selecciona un cliente</option>`;

    (window.Proyectos.catalogoClientes || []).forEach((x) => {
      clienteSel.innerHTML += `<option value="${window.Utils.escapeHtml(x)}">${window.Utils.escapeHtml(x)}</option>`;
    });

    clienteSel.value = current;
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

  parseEntregaDetalle(entregadoRaw) {
    const parsed = window.Utils.parseCampoEntregado(entregadoRaw || "");

    return {
      quienEntrega: parsed.quienEntrega || "",
      quienRecibe: parsed.quienRecibe || "",
      observaciones: parsed.observaciones || ""
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

    const entregaInfo = this.parseEntregaDetalle(registro.Entregado);
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

    const quienEntrega = window.Utils.normalizarTexto(getValue("fieldQuienEntrega"));
    const quienRecibe = window.Utils.normalizarTexto(getValue("fieldQuienRecibe"));
    const observacionesEntrega = window.Utils.normalizarTexto(getValue("fieldObservacionesEntrega"));

    registro.Entregado = (quienEntrega || quienRecibe || observacionesEntrega)
      ? `${quienEntrega}_${quienRecibe}_${observacionesEntrega}`
      : "";

    registro.FechaEntrega = selected.FechaEntrega || "";
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

  openNewClientModal() {
    if (!this.els.modalNuevoCliente) return;
    this.clearNewClientForm();
    this.els.modalNuevoCliente.classList.remove("hidden");
  },

  closeNewClientModal() {
    if (!this.els.modalNuevoCliente) return;
    this.els.modalNuevoCliente.classList.add("hidden");
  },

  openDeleteClientModal() {
    if (!this.els.modalEliminarCliente) return;
    this.renderDeleteClientOptions();
    this.clearDeleteClientForm();
    this.els.modalEliminarCliente.classList.remove("hidden");
  },

  closeDeleteClientModal() {
    if (!this.els.modalEliminarCliente) return;
    this.els.modalEliminarCliente.classList.add("hidden");
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

  clearNewClientForm() {
    const el = document.getElementById("nuevoClienteNombre");
    if (el) el.value = "";
    this.setNewClientMessage("", "");
  },

  clearDeleteClientForm() {
    const el = document.getElementById("clienteEliminarSelect");
    if (el) el.value = "";
    this.setDeleteClientMessage("", "");
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
  },

  getNewClientForm() {
    return document.getElementById("nuevoClienteNombre")?.value || "";
  },

  getDeleteClientForm() {
    return document.getElementById("clienteEliminarSelect")?.value || "";
  }
};
