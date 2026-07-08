window.FacturasClientesApp = {
  state: {
    facturas: [],
    facturasFiltradas: [],
    proyectos: [],
    selectedKey: null,
    nuevoProyecto: null,
    puedeVer: false,
    puedeGestionar: false,
    puedeVerMontos: false
  },

  init() {
    this.bindEvents();
    this.renderToday();
    window.Auth.logout();
    this.showLogin();
  },

  bindEvents() {
    const byId = (id) => document.getElementById(id);
    const btnLogin = byId("btnLogin");
    const btnLogout = byId("btnLogout");
    const btnActualizar = byId("btnActualizar");
    const btnNuevaFactura = byId("btnNuevaFactura");
    const btnCerrarModalNuevaFactura = byId("btnCerrarModalNuevaFactura");
    const btnCrearFactura = byId("btnCrearFactura");
    const btnGuardarFactura = byId("btnGuardarFactura");
    const nuevoProyectoSearch = byId("nuevoProyectoSearch");
    const modalNuevaFactura = byId("modalNuevaFactura");

    if (btnLogin) btnLogin.addEventListener("click", () => this.handleLogin());
    if (btnLogout) btnLogout.addEventListener("click", () => this.handleLogout());
    if (btnActualizar) btnActualizar.addEventListener("click", () => this.loadAllData());
    if (btnNuevaFactura) btnNuevaFactura.addEventListener("click", () => this.openNewModal());
    if (btnCerrarModalNuevaFactura) btnCerrarModalNuevaFactura.addEventListener("click", () => this.closeNewModal());
    if (btnCrearFactura) btnCrearFactura.addEventListener("click", () => this.handleCreateFactura());
    if (btnGuardarFactura) btnGuardarFactura.addEventListener("click", () => this.handleSaveFactura());
    if (nuevoProyectoSearch) nuevoProyectoSearch.addEventListener("input", () => this.renderProjectSearchResults());
    if (modalNuevaFactura) modalNuevaFactura.addEventListener("click", (e) => { if (e.target === modalNuevaFactura) this.closeNewModal(); });

    ["searchInput", "filterCliente", "filterEstado", "filterProyecto"].forEach((id) => {
      const el = byId(id);
      if (el) {
        el.addEventListener("input", () => this.refreshFilters());
        el.addEventListener("change", () => this.refreshFilters());
      }
    });
  },

  getText(value) { if (value === null || value === undefined) return ""; return String(value).trim(); },
  getBool(value) {
    if (value === true || value === false) return value;
    const txt = String(value ?? "").trim().toLowerCase();
    return txt === "true" || txt === "1" || txt === "si" || txt === "sí";
  },
  getNumber(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; },
  escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  },
  formatNowStamp() { return window.Utils?.formatDateStampNow ? window.Utils.formatDateStampNow() : new Date().toLocaleString("es-MX"); },
  todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  parseDate(value) {
    const txt = this.getText(value);
    if (!txt) return null;
    const d = new Date(`${txt}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
    if (window.Utils?.parseFechaFlexible) return window.Utils.parseFechaFlexible(txt);
    return null;
  },
  formatDateForInput(value) {
    const txt = this.getText(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) return txt;
    const d = this.parseDate(txt);
    if (!d) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },
  formatMoney(value, currency = "MXN") {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    try { return new Intl.NumberFormat("es-MX", { style: "currency", currency: currency || "MXN" }).format(n); }
    catch { return String(value); }
  },
  setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value ?? ""; },
  setMessage(id, text, type = "") { const el = document.getElementById(id); if (!el) return; el.textContent = text || ""; el.className = `message ${type}`.trim(); },

  showLogin() { document.getElementById("loginView")?.classList.add("active"); document.getElementById("mainView")?.classList.remove("active"); },
  showMain() {
    document.getElementById("loginView")?.classList.remove("active");
    document.getElementById("mainView")?.classList.add("active");
    const user = window.Auth.currentUser;
    const tags = [];
    if (user?.administrador) tags.push("Admin");
    if (this.state.puedeGestionar) tags.push("Gestión facturas");
    if (this.state.puedeVerMontos) tags.push("Montos");
    this.setText("sessionBadge", `${user?.nombre || user?.usuario || ""}${tags.length ? " · " + tags.join(" · ") : ""}`);
    document.getElementById("btnNuevaFactura")?.classList.toggle("hidden", !this.state.puedeGestionar);
    document.getElementById("btnGuardarFactura")?.classList.toggle("hidden", !this.state.puedeGestionar);
  },
  renderToday() {
    const d = new Date();
    this.setText("todayBadge", d.toLocaleDateString("es-MX", { year:"numeric", month:"long", day:"numeric" }));
  },

  loadUserPermissions() {
    const current = window.Auth.currentUser;
    const raw = current?.raw || {};
    const permisos = raw?.Permisos && typeof raw.Permisos === "object" ? raw.Permisos : {};

    this.state.puedeGestionar = this.getBool(permisos.FacturasClientes);
    this.state.puedeVer = this.getBool(permisos.FacturasClientes);
    this.state.puedeVerMontos = this.getBool(permisos.Montos);

    document.querySelectorAll('[data-montos="true"]').forEach((el) => el.classList.toggle("hidden", !this.state.puedeVerMontos));
  },

  async handleLogin() {
    this.setMessage("loginMessage", "", "");
    try {
      const usuario = document.getElementById("loginUsuario")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";
      await window.Auth.login(usuario, password);
      this.loadUserPermissions();
      if (!this.state.puedeVer) {
        window.Auth.logout();
        throw new Error("No tienes permiso para acceder a Facturas Clientes. Solicita al administrador el permiso Permisos.FacturasClientes=true.");
      }
      this.showMain();
      await this.loadAllData();
    } catch (err) {
      console.error("Error login FacturasClientes:", err);
      this.setMessage("loginMessage", err.message || "No fue posible iniciar sesión.", "error");
    }
  },

  handleLogout() {
    window.Auth.logout();
    this.state.facturas = [];
    this.state.facturasFiltradas = [];
    this.state.proyectos = [];
    this.state.selectedKey = null;
    this.state.nuevoProyecto = null;
    this.showLogin();
    this.showEmptyDetail();
    this.setMessage("loginMessage", "", "");
    const pwd = document.getElementById("loginPassword");
    if (pwd) pwd.value = "";
  },

  async loadAllData() {
    await Promise.all([this.loadProjects(), this.loadFacturas()]);
    this.renderFilterOptions();
    this.refreshFilters();
    this.renderKpis();
    this.showEmptyDetail();
  },

  async loadProjects() {
    const snap = await window.database.ref("Registros").once("value");
    const data = snap.val() || {};
    const proyectos = [];
    Object.keys(data).forEach((key) => {
      const raw = data[key] || {};
      const normalizado = window.Utils?.normalizarRegistro ? window.Utils.normalizarRegistro(key, raw) : { ...raw, _firebaseKey:key };
      proyectos.push({
        _firebaseKey: key,
        ID: this.getText(normalizado.ID || key),
        Proyecto: this.getText(normalizado.Proyecto),
        Cliente: this.getText(normalizado.Cliente),
        POProyecto: this.getText(normalizado.PO),
        Responsable: this.getText(normalizado.Nombre),
        Estado: this.getText(normalizado._estadoCalculado)
      });
    });
    proyectos.sort((a,b) => Number(b.ID || 0) - Number(a.ID || 0));
    this.state.proyectos = proyectos;
  },

  normalizeFactura(key, raw = {}) {
    return {
      _firebaseKey: key,
      ID: this.getText(raw.ID || key),
      ProyectoID: this.getText(raw.ProyectoID),
      Proyecto: this.getText(raw.Proyecto),
      Cliente: this.getText(raw.Cliente),
      POProyecto: this.getText(raw.POProyecto),
      Responsable: this.getText(raw.Responsable),
      NumeroFactura: this.getText(raw.NumeroFactura),
      FechaFactura: this.getText(raw.FechaFactura),
      FechaVencimiento: this.getText(raw.FechaVencimiento),
      Monto: raw.Monto ?? "",
      Moneda: this.getText(raw.Moneda || "MXN"),
      EstadoCobro: this.getText(raw.EstadoCobro || "Pendiente"),
      FechaPago: this.getText(raw.FechaPago),
      ArchivoFactura: this.getText(raw.ArchivoFactura),
      Observaciones: this.getText(raw.Observaciones),
      CreadoPor: this.getText(raw.CreadoPor),
      FechaCreacion: this.getText(raw.FechaCreacion),
      UltimaEdicionPor: this.getText(raw.UltimaEdicionPor),
      FechaUltimaEdicion: this.getText(raw.FechaUltimaEdicion)
    };
  },

  async loadFacturas() {
    const snap = await window.database.ref("FacturasClientes").once("value");
    const data = snap.val() || {};
    const facturas = Object.keys(data).map((key) => this.normalizeFactura(key, data[key] || {}));
    facturas.sort((a,b) => Number(b.ID || 0) - Number(a.ID || 0));
    this.state.facturas = facturas;
    this.state.facturasFiltradas = [...facturas];
  },

  getEstadoEfectivo(f) {
    const estado = this.getText(f.EstadoCobro) || "Pendiente";
    if (estado.toLowerCase() === "pagada") return "Pagada";
    if (estado.toLowerCase() === "cancelada") return "Cancelada";
    const venc = this.parseDate(f.FechaVencimiento);
    if (venc) {
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      if (venc.getTime() < hoy.getTime()) return "Vencida";
    }
    return "Pendiente";
  },

  getEstadoClass(estado) {
    const e = this.getText(estado).toLowerCase();
    if (e === "pagada") return "status-paid";
    if (e === "vencida") return "status-overdue";
    if (e === "cancelada") return "status-canceled";
    return "status-pending";
  },

  renderKpis() {
    const facturas = this.state.facturas;
    const pendientes = facturas.filter((f) => this.getEstadoEfectivo(f) === "Pendiente");
    const vencidas = facturas.filter((f) => this.getEstadoEfectivo(f) === "Vencida");
    const pagadas = facturas.filter((f) => this.getEstadoEfectivo(f) === "Pagada");
    this.setText("kpiTotalFacturas", facturas.length);
    this.setText("kpiPendientes", pendientes.length);
    this.setText("kpiVencidas", vencidas.length);
    this.setText("kpiPagadas", pagadas.length);
    if (this.state.puedeVerMontos) {
      const total = facturas.filter((f) => this.getEstadoEfectivo(f) !== "Cancelada").reduce((s,f) => s + this.getNumber(f.Monto), 0);
      const porCobrar = facturas.filter((f) => ["Pendiente", "Vencida"].includes(this.getEstadoEfectivo(f))).reduce((s,f) => s + this.getNumber(f.Monto), 0);
      this.setText("kpiTotalFacturado", this.formatMoney(total));
      this.setText("kpiMontoPorCobrar", this.formatMoney(porCobrar));
    }
  },

  renderFilterOptions() {
    const clientes = [...new Set(this.state.facturas.map((f) => this.getText(f.Cliente)).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    const proyectos = [...new Set(this.state.facturas.map((f) => this.getText(f.ProyectoID || f.Proyecto)).filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b)));
    this.fillSelect("filterCliente", "Cliente", clientes);
    this.fillSelect("filterProyecto", "Proyecto", proyectos);
  },

  fillSelect(id, label, values) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = `<option value="">${this.escapeHtml(label)}</option>`;
    values.forEach((v) => sel.innerHTML += `<option value="${this.escapeHtml(v)}">${this.escapeHtml(v)}</option>`);
    if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  },

  getFilters() {
    return {
      search: this.getText(document.getElementById("searchInput")?.value).toLowerCase(),
      cliente: this.getText(document.getElementById("filterCliente")?.value).toLowerCase(),
      estado: this.getText(document.getElementById("filterEstado")?.value).toLowerCase(),
      proyecto: this.getText(document.getElementById("filterProyecto")?.value).toLowerCase()
    };
  },

  refreshFilters() {
    const f = this.getFilters();
    this.state.facturasFiltradas = this.state.facturas.filter((item) => {
      const estado = this.getEstadoEfectivo(item).toLowerCase();
      const txt = [item.ID, item.ProyectoID, item.Proyecto, item.Cliente, item.POProyecto, item.Responsable, item.NumeroFactura, item.FechaFactura, item.FechaVencimiento, estado].join(" ").toLowerCase();
      const okSearch = !f.search || txt.includes(f.search);
      const okCliente = !f.cliente || this.getText(item.Cliente).toLowerCase() === f.cliente;
      const okEstado = !f.estado || estado === f.estado;
      const okProyecto = !f.proyecto || this.getText(item.ProyectoID || item.Proyecto).toLowerCase() === f.proyecto;
      return okSearch && okCliente && okEstado && okProyecto;
    });
    this.renderTable();
  },

  renderTable() {
    const tbody = document.getElementById("facturasTableBody");
    const empty = document.getElementById("tableEmpty");
    if (!tbody) return;
    if (!this.state.facturasFiltradas.length) {
      tbody.innerHTML = "";
      empty?.classList.remove("hidden");
      return;
    }
    empty?.classList.add("hidden");
    tbody.innerHTML = this.state.facturasFiltradas.map((f) => {
      const estado = this.getEstadoEfectivo(f);
      return `<tr data-key="${this.escapeHtml(f._firebaseKey)}" style="cursor:pointer;">
        <td>${this.escapeHtml(f.ID)}</td>
        <td>${this.escapeHtml(f.ProyectoID || f.Proyecto || "—")}</td>
        <td>${this.escapeHtml(f.Cliente || "—")}</td>
        <td>${this.escapeHtml(f.NumeroFactura || "—")}</td>
        <td><span class="status-badge ${this.getEstadoClass(estado)}">${this.escapeHtml(estado)}</span></td>
        <td>${this.escapeHtml(f.FechaFactura || "—")}</td>
        <td>${this.escapeHtml(f.FechaVencimiento || "—")}</td>
        <td data-montos="true" class="${this.state.puedeVerMontos ? "" : "hidden"}">${this.escapeHtml(this.formatMoney(f.Monto, f.Moneda) || "—")}</td>
        <td>${this.escapeHtml(f.FechaPago || "—")}</td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll("tr[data-key]").forEach((tr) => tr.addEventListener("click", () => this.selectFactura(tr.dataset.key)));
  },

  selectFactura(key) {
    const f = this.state.facturas.find((x) => x._firebaseKey === key);
    if (!f) return;
    this.state.selectedKey = key;
    this.renderDetail(f);
  },

  showEmptyDetail() {
    document.getElementById("detailEmpty")?.classList.remove("hidden");
    document.getElementById("detailContent")?.classList.add("hidden");
  },

  renderDetail(f) {
    document.getElementById("detailEmpty")?.classList.add("hidden");
    document.getElementById("detailContent")?.classList.remove("hidden");
    const estado = this.getEstadoEfectivo(f);
    this.setText("detailTitle", `${f.ID || ""} · ${f.NumeroFactura || "Sin número"}`);
    this.setText("detailMeta", `${f.Cliente || "Sin cliente"} · ${f.ProyectoID || f.Proyecto || "Sin proyecto"}`);
    this.setText("detailEstadoBadge", estado);
    const badge = document.getElementById("detailEstadoBadge");
    if (badge) badge.className = `status-badge ${this.getEstadoClass(estado)}`;

    this.setInput("fieldID", f.ID);
    this.setInput("fieldProyecto", f.ProyectoID ? `${f.ProyectoID} · ${f.Proyecto}` : f.Proyecto);
    this.setInput("fieldCliente", f.Cliente);
    this.setInput("fieldPOProyecto", f.POProyecto);
    this.setInput("fieldResponsable", f.Responsable);
    this.setInput("fieldNumeroFactura", f.NumeroFactura);
    this.setInput("fieldFechaFactura", this.formatDateForInput(f.FechaFactura));
    this.setInput("fieldFechaVencimiento", this.formatDateForInput(f.FechaVencimiento));
    this.setInput("fieldEstadoCobro", ["Pagada", "Cancelada"].includes(f.EstadoCobro) ? f.EstadoCobro : "Pendiente");
    this.setInput("fieldFechaPago", this.formatDateForInput(f.FechaPago));
    this.setInput("fieldMonto", this.state.puedeVerMontos ? f.Monto : "");
    this.setInput("fieldMoneda", f.Moneda || "MXN");
    this.setInput("fieldArchivoFactura", f.ArchivoFactura);
    this.setInput("fieldObservaciones", f.Observaciones);
    this.setMessage("saveMessage", "", "");
    this.setDetailEditability();
  },

  setInput(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ""; },

  setDetailEditability() {
    const editable = this.state.puedeGestionar;
    ["fieldNumeroFactura", "fieldFechaFactura", "fieldFechaVencimiento", "fieldEstadoCobro", "fieldFechaPago", "fieldMonto", "fieldMoneda", "fieldArchivoFactura", "fieldObservaciones"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = !editable;
    });
    document.getElementById("btnGuardarFactura")?.classList.toggle("hidden", !editable);
  },

  openNewModal() {
    if (!this.state.puedeGestionar) return;
    this.state.nuevoProyecto = null;
    this.setMessage("newFacturaMessage", "", "");
    ["nuevoProyectoSearch", "nuevoProyectoSeleccionado", "nuevoNumeroFactura", "nuevoFechaFactura", "nuevoFechaVencimiento", "nuevoMonto", "nuevoArchivoFactura", "nuevoObservaciones"].forEach((id) => this.setInput(id, ""));
    this.setInput("nuevoMoneda", "MXN");
    this.setInput("nuevoFechaFactura", this.todayISO());
    document.getElementById("nuevoProyectoResultados")?.classList.add("hidden");
    document.getElementById("modalNuevaFactura")?.classList.remove("hidden");
  },

  closeNewModal() { document.getElementById("modalNuevaFactura")?.classList.add("hidden"); },

  renderProjectSearchResults() {
    const query = this.getText(document.getElementById("nuevoProyectoSearch")?.value).toLowerCase();
    const box = document.getElementById("nuevoProyectoResultados");
    if (!box) return;
    if (!query) { box.classList.add("hidden"); box.innerHTML = ""; return; }
    const rows = this.state.proyectos.filter((p) => [p.ID, p.Proyecto, p.Cliente, p.POProyecto, p.Responsable].join(" ").toLowerCase().includes(query)).slice(0, 25);
    if (!rows.length) { box.classList.remove("hidden"); box.innerHTML = `<div class="project-search-item">No hay coincidencias.</div>`; return; }
    box.classList.remove("hidden");
    box.innerHTML = rows.map((p) => `<div class="project-search-item" data-key="${this.escapeHtml(p._firebaseKey)}"><strong>${this.escapeHtml(p.ID)}</strong> · ${this.escapeHtml(p.Proyecto || "Sin nombre")}<div class="project-search-meta">${this.escapeHtml(p.Cliente || "Sin cliente")} · ${this.escapeHtml(p.Responsable || "Sin responsable")} · ${this.escapeHtml(p.Estado || "Sin estado")}</div></div>`).join("");
    box.querySelectorAll(".project-search-item[data-key]").forEach((el) => el.addEventListener("click", () => this.selectProjectForNew(el.dataset.key)));
  },

  selectProjectForNew(key) {
    const p = this.state.proyectos.find((x) => x._firebaseKey === key);
    if (!p) return;
    this.state.nuevoProyecto = p;
    this.setInput("nuevoProyectoSeleccionado", `${p.ID} · ${p.Cliente} · ${p.Proyecto}`);
    document.getElementById("nuevoProyectoResultados")?.classList.add("hidden");
  },

  getNewPayload() {
    const p = this.state.nuevoProyecto;
    if (!p) throw new Error("Selecciona un proyecto.");
    const id = String(Date.now());
    const numero = this.getText(document.getElementById("nuevoNumeroFactura")?.value);
    const fechaFactura = this.getText(document.getElementById("nuevoFechaFactura")?.value);
    const fechaVencimiento = this.getText(document.getElementById("nuevoFechaVencimiento")?.value);
    if (!numero) throw new Error("Captura el número de factura.");
    if (!fechaFactura) throw new Error("Captura la fecha de factura.");
    return {
      ID: id,
      ProyectoID: p.ID,
      Proyecto: p.Proyecto,
      Cliente: p.Cliente,
      POProyecto: p.POProyecto,
      Responsable: p.Responsable,
      NumeroFactura: numero,
      FechaFactura: fechaFactura,
      FechaVencimiento: fechaVencimiento,
      Monto: this.state.puedeVerMontos ? this.getNumber(document.getElementById("nuevoMonto")?.value) : "",
      Moneda: this.getText(document.getElementById("nuevoMoneda")?.value || "MXN"),
      EstadoCobro: "Pendiente",
      FechaPago: "",
      ArchivoFactura: this.getText(document.getElementById("nuevoArchivoFactura")?.value),
      Observaciones: this.getText(document.getElementById("nuevoObservaciones")?.value),
      CreadoPor: window.Auth.currentUser?.nombre || window.Auth.currentUser?.usuario || "",
      FechaCreacion: this.formatNowStamp(),
      UltimaEdicionPor: "",
      FechaUltimaEdicion: ""
    };
  },

  async handleCreateFactura() {
    this.setMessage("newFacturaMessage", "", "");
    try {
      if (!this.state.puedeGestionar) throw new Error("No tienes permiso para crear facturas.");
      const payload = this.getNewPayload();
      await window.database.ref(`FacturasClientes/${payload.ID}`).set(payload);
      this.closeNewModal();
      await this.loadAllData();
      this.selectFactura(payload.ID);
    } catch (err) {
      console.error(err);
      this.setMessage("newFacturaMessage", err.message || "No fue posible guardar la factura.", "error");
    }
  },

  getEditedPayload(original) {
    const payload = { ...original };
    payload.NumeroFactura = this.getText(document.getElementById("fieldNumeroFactura")?.value);
    payload.FechaFactura = this.getText(document.getElementById("fieldFechaFactura")?.value);
    payload.FechaVencimiento = this.getText(document.getElementById("fieldFechaVencimiento")?.value);
    payload.EstadoCobro = this.getText(document.getElementById("fieldEstadoCobro")?.value || "Pendiente");
    payload.FechaPago = this.getText(document.getElementById("fieldFechaPago")?.value);
    if (this.state.puedeVerMontos) {
      payload.Monto = this.getNumber(document.getElementById("fieldMonto")?.value);
      payload.Moneda = this.getText(document.getElementById("fieldMoneda")?.value || "MXN");
    }
    payload.ArchivoFactura = this.getText(document.getElementById("fieldArchivoFactura")?.value);
    payload.Observaciones = this.getText(document.getElementById("fieldObservaciones")?.value);
    payload.UltimaEdicionPor = window.Auth.currentUser?.nombre || window.Auth.currentUser?.usuario || "";
    payload.FechaUltimaEdicion = this.formatNowStamp();
    if (!payload.NumeroFactura) throw new Error("Captura el número de factura.");
    if (!payload.FechaFactura) throw new Error("Captura la fecha de factura.");
    return payload;
  },

  async handleSaveFactura() {
    this.setMessage("saveMessage", "", "");
    try {
      if (!this.state.puedeGestionar) throw new Error("No tienes permiso para editar facturas.");
      const key = this.state.selectedKey;
      const original = this.state.facturas.find((f) => f._firebaseKey === key);
      if (!key || !original) throw new Error("Selecciona una factura.");
      const payload = this.getEditedPayload(original);
      delete payload._firebaseKey;
      await window.database.ref(`FacturasClientes/${key}`).set(payload);
      this.setMessage("saveMessage", "Factura guardada correctamente.", "success");
      await this.loadAllData();
      this.selectFactura(key);
    } catch (err) {
      console.error(err);
      this.setMessage("saveMessage", err.message || "No fue posible guardar.", "error");
    }
  }
};

document.addEventListener("DOMContentLoaded", function () { window.FacturasClientesApp.init(); });
