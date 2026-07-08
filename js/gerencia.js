window.GerenciaApp = {
  state: {
    proyectos: [],
    servicios: [],
    facturas: [],
    periodProyectos: [],
    periodServicios: [],
    periodFacturas: [],
    alertas: [],
    filteredAlertas: [],
    filteredProyectos: [],
    criticalProjects: [],
    filteredCriticalProjects: [],
    puedeVerGerencia: false,
    puedeVerMontos: false,
    selected: null
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
    const btnLimpiarPeriodo = byId("btnLimpiarPeriodo");

    if (btnLogin) btnLogin.addEventListener("click", () => this.handleLogin());
    if (btnLogout) btnLogout.addEventListener("click", () => this.handleLogout());
    if (btnActualizar) btnActualizar.addEventListener("click", () => this.loadAllData());
    if (btnLimpiarPeriodo) btnLimpiarPeriodo.addEventListener("click", () => this.clearPeriodFilters());

    ["searchInput", "filterCliente", "filterResponsable", "filterTipoAlerta"].forEach((id) => {
      const el = byId(id);
      if (el) {
        el.addEventListener("input", () => this.refreshFilters());
        el.addEventListener("change", () => this.refreshFilters());
      }
    });

    ["filterFechaInicio", "filterFechaFin", "filterCriterioPeriodo"].forEach((id) => {
      const el = byId(id);
      if (el) {
        el.addEventListener("input", () => this.applyPeriodAndRender());
        el.addEventListener("change", () => this.applyPeriodAndRender());
      }
    });
  },

  getText(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  },

  getBool(value) {
    if (value === true || value === false) return value;
    const txt = String(value ?? "").trim().toLowerCase();
    return txt === "true" || txt === "1" || txt === "si" || txt === "sí";
  },

  getNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  },

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  formatMoney(value, currency = "MXN") {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    try {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: currency || "MXN"
      }).format(n);
    } catch {
      return String(value);
    }
  },

  parseDate(value) {
    if (window.Utils?.parseFechaFlexible) return window.Utils.parseFechaFlexible(value);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  },

  daysSince(value) {
    const d = this.parseDate(value);
    if (!d) return null;
    const today = new Date();
    return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  },

  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "";
  },

  setMessage(id, text, type = "") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || "";
    el.className = `message ${type}`.trim();
  },

  showLogin() {
    document.getElementById("loginView")?.classList.add("active");
    document.getElementById("mainView")?.classList.remove("active");
  },

  showMain() {
    document.getElementById("loginView")?.classList.remove("active");
    document.getElementById("mainView")?.classList.add("active");

    const user = window.Auth.currentUser;
    const badge = document.getElementById("sessionBadge");
    if (badge) {
      const tags = [];
      if (user?.administrador) tags.push("Admin");
      if (this.state.puedeVerGerencia) tags.push("Gerencia");
      if (this.state.puedeVerMontos) tags.push("Montos");
      badge.textContent = `${user?.nombre || user?.usuario || ""}${tags.length ? " · " + tags.join(" · ") : ""}`;
    }
  },

  renderToday() {
    const todayBadge = document.getElementById("todayBadge");
    if (!todayBadge) return;
    const d = new Date();
    todayBadge.textContent = d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  },

  async handleLogin() {
    this.setMessage("loginMessage", "", "");
    try {
      const usuario = document.getElementById("loginUsuario")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";

      await window.Auth.login(usuario, password);
      this.loadUserPermissions();

      if (!this.state.puedeVerGerencia) {
        window.Auth.logout();
        throw new Error("No tienes permiso para acceder al Panel Gerencial. Solicita al administrador el permiso Permisos.Gerencia=true.");
      }

      this.showMain();
      await this.loadAllData();
    } catch (err) {
      console.error("Error en login gerencial:", err);
      this.setMessage("loginMessage", err.message || "No fue posible iniciar sesión.", "error");
    }
  },

  handleLogout() {
    window.Auth.logout();
    this.state.proyectos = [];
    this.state.servicios = [];
    this.state.facturas = [];
    this.state.periodProyectos = [];
    this.state.periodServicios = [];
    this.state.periodFacturas = [];
    this.state.alertas = [];
    this.state.filteredAlertas = [];
    this.state.filteredProyectos = [];
    this.state.criticalProjects = [];
    this.state.filteredCriticalProjects = [];
    this.state.selected = null;
    this.showLogin();
    this.setMessage("loginMessage", "", "");
    const pwd = document.getElementById("loginPassword");
    if (pwd) pwd.value = "";
  },

  loadUserPermissions() {
    const current = window.Auth.currentUser;
    const raw = current?.raw || {};
    const permisos = raw?.Permisos && typeof raw.Permisos === "object" ? raw.Permisos : {};

    this.state.puedeVerGerencia = this.getBool(permisos.Gerencia);
    this.state.puedeVerMontos = this.getBool(permisos.Montos);

    document.querySelectorAll('[data-montos="true"]').forEach((el) => {
      el.classList.toggle("hidden", !this.state.puedeVerMontos);
    });
  },

  async loadAllData() {
    try {
      await Promise.all([
        this.loadProjects(),
        this.loadServices(),
        this.loadFacturas()
      ]);
      this.updateScopedData();
      this.buildAlerts();
      this.buildCriticalProjects();
      this.renderFilterOptions();
      this.refreshFilters();
      this.renderKpis();
      this.renderSummaries();
      this.renderPeriodInfo();
    } catch (err) {
      console.error("Error cargando Panel Gerencial:", err);
      alert("Error al cargar Panel Gerencial: " + (err.message || err));
    }
  },

  async loadProjects() {
    const snap = await window.database.ref("Registros").once("value");
    const data = snap.val() || {};
    const proyectos = [];

    Object.keys(data).forEach((key) => {
      const raw = data[key] || {};
      const normalizado = window.Utils?.normalizarRegistro
        ? window.Utils.normalizarRegistro(key, raw)
        : { ...raw, _firebaseKey: key };
      proyectos.push(normalizado);
    });

    proyectos.sort((a, b) => Number(b.ID || 0) - Number(a.ID || 0));
    this.state.proyectos = proyectos;
  },

  async loadServices() {
    const snap = await window.database.ref("ServiciosExternos").once("value");
    const data = snap.val() || {};
    const servicios = [];

    Object.keys(data).forEach((key) => {
      const raw = data[key] || {};
      servicios.push({
        _firebaseKey: key,
        ID: this.getText(raw.ID || key),
        ProyectoID: this.getText(raw.ProyectoID),
        Proyecto: this.getText(raw.Proyecto),
        Cliente: this.getText(raw.Cliente),
        POProyecto: this.getText(raw.POProyecto),
        ProveedorID: this.getText(raw.ProveedorID),
        Proveedor: this.getText(raw.Proveedor),
        Concepto: this.getText(raw.Concepto),
        TipoServicio: this.getText(raw.TipoServicio),
        CursoNombre: this.getText(raw.CursoNombre),
        Estatus: this.getText(raw.Estatus || "Solicitado"),
        Observaciones: this.getText(raw.Observaciones),
        Monto: raw.Monto ?? "",
        Moneda: this.getText(raw.Moneda || "MXN"),
        FacturaProveedor: this.getText(raw.FacturaProveedor),
        FechaSolicitud: this.getText(raw.FechaSolicitud),
        FechaCompromiso: this.getText(raw.FechaCompromiso),
        FechaFactura: this.getText(raw.FechaFactura),
        FechaPago: this.getText(raw.FechaPago)
      });
    });

    servicios.sort((a, b) => Number(b.ID || 0) - Number(a.ID || 0));
    this.state.servicios = servicios;
  },


  async loadFacturas() {
    const snap = await window.database.ref("FacturasClientes").once("value");
    const data = snap.val() || {};
    const facturas = [];

    Object.keys(data).forEach((key) => {
      const raw = data[key] || {};
      facturas.push({
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
        Observaciones: this.getText(raw.Observaciones)
      });
    });

    facturas.sort((a, b) => Number(b.ID || 0) - Number(a.ID || 0));
    this.state.facturas = facturas;
  },

  getEstadoFactura(f) {
    const estado = this.getText(f.EstadoCobro) || "Pendiente";
    if (estado.toLowerCase() === "pagada") return "Pagada";
    if (estado.toLowerCase() === "cancelada") return "Cancelada";
    const venc = this.parseDate(f.FechaVencimiento);
    if (venc) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (venc.getTime() < hoy.getTime()) return "Vencida";
    }
    return "Pendiente";
  },

  isFacturaPorCobrar(f) {
    return ["Pendiente", "Vencida"].includes(this.getEstadoFactura(f));
  },

  proyectoTieneFacturaCliente(p) {
    const proyectoId = this.getText(p.ID).toLowerCase();
    return this.getActiveData().facturas.some((f) => {
      if (!["Pendiente", "Vencida", "Pagada"].includes(this.getEstadoFactura(f))) return false;
      return this.getText(f.ProyectoID).toLowerCase() === proyectoId;
    });
  },

  isEstado(proyecto, estado) {
    return this.getText(proyecto._estadoCalculado).toLowerCase() === this.getText(estado).toLowerCase();
  },

  isEntregadoSinFacturar(p) {
    return this.getBool(p.Step10) && !this.getBool(p.Step11) && !this.getBool(p.Step12) && !this.proyectoTieneFacturaCliente(p);
  },

  isFacturadoSinPagar(p) {
    return this.getBool(p.Step11) && !this.getBool(p.Step12);
  },

  isActivo(p) {
    return !this.getBool(p.Step12);
  },

  isSinPO(p) {
    return !this.getText(p.PO);
  },

  isSinResponsable(p) {
    return !this.getText(p.Nombre);
  },

  isSinAvanceReciente(p) {
    if (this.getBool(p.Step12)) return false;
    const last = p._ultimaFechaActiva;
    const days = this.daysSince(last);
    return days !== null && days >= 10;
  },

  isServicioPorPagar(s) {
    const est = this.getText(s.Estatus).toLowerCase();
    if (est === "pagado" || est === "cancelado") return false;
    return est === "factura recibida" || !!this.getText(s.FacturaProveedor) || !!this.getNumber(s.Monto);
  },

  parseInputDate(value, endOfDay = false) {
    const txt = this.getText(value);
    if (!txt) return null;
    const parts = txt.split("-").map((x) => Number(x));
    if (parts.length === 3 && parts.every((x) => Number.isFinite(x))) {
      const d = new Date(parts[0], parts[1] - 1, parts[2], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(txt);
    if (Number.isNaN(d.getTime())) return null;
    if (endOfDay) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d;
  },

  getDateFromProjectId(p) {
    const id = Number(this.getText(p?.ID));
    if (!Number.isFinite(id) || id <= 0) return null;
    const d = new Date(id);
    return Number.isNaN(d.getTime()) ? null : d;
  },

  getDateValue(value) {
    const d = this.parseDate(value);
    return d && !Number.isNaN(d.getTime()) ? d : null;
  },

  getPeriodConfig() {
    const criterio = this.getText(document.getElementById("filterCriterioPeriodo")?.value || "proyecto_alta") || "proyecto_alta";
    const inicio = this.parseInputDate(document.getElementById("filterFechaInicio")?.value, false);
    const fin = this.parseInputDate(document.getElementById("filterFechaFin")?.value, true);
    const hasPeriod = !!inicio || !!fin;
    return { criterio, inicio, fin, hasPeriod };
  },

  getCriterioPeriodoLabel(criterio) {
    const labels = {
      proyecto_alta: "Proyectos creados en el periodo",
      proyecto_ultima: "Proyectos con avance/movimiento en el periodo",
      proyecto_entrega: "Proyectos entregados en el periodo",
      factura_fecha: "Facturas emitidas a clientes en el periodo",
      factura_vencimiento: "Facturas de clientes que vencen/vencieron en el periodo",
      factura_pago: "Facturas cobradas a clientes en el periodo",
      servicio_solicitud: "Servicios externos solicitados en el periodo",
      servicio_factura: "Facturas de proveedor recibidas en el periodo",
      servicio_pago: "Pagos a proveedores realizados en el periodo"
    };
    return labels[criterio] || labels.proyecto_alta;
  },

  isDateWithinPeriod(dateValue, config = this.getPeriodConfig()) {
    if (!config.hasPeriod) return true;
    if (!dateValue) return false;
    const d = dateValue instanceof Date ? dateValue : this.getDateValue(dateValue);
    if (!d || Number.isNaN(d.getTime())) return false;
    if (config.inicio && d.getTime() < config.inicio.getTime()) return false;
    if (config.fin && d.getTime() > config.fin.getTime()) return false;
    return true;
  },

  getProjectPeriodDate(p, criterio) {
    if (criterio === "proyecto_alta") return this.getDateFromProjectId(p);
    if (criterio === "proyecto_ultima") return this.getDateValue(p?._ultimaFechaActiva);
    if (criterio === "proyecto_entrega") return this.getDateValue(p?.FechaEntrega || p?._ultimaFechaActiva);
    return null;
  },

  getFacturaPeriodDate(f, criterio) {
    if (criterio === "factura_fecha") return this.getDateValue(f?.FechaFactura);
    if (criterio === "factura_vencimiento") return this.getDateValue(f?.FechaVencimiento);
    if (criterio === "factura_pago") return this.getDateValue(f?.FechaPago);
    return null;
  },

  getServicioPeriodDate(s, criterio) {
    if (criterio === "servicio_solicitud") return this.getDateValue(s?.FechaSolicitud);
    if (criterio === "servicio_factura") return this.getDateValue(s?.FechaFactura);
    if (criterio === "servicio_pago") return this.getDateValue(s?.FechaPago);
    return null;
  },

  getScopedData() {
    const config = this.getPeriodConfig();
    if (!config.hasPeriod) {
      return {
        proyectos: [...this.state.proyectos],
        servicios: [...this.state.servicios],
        facturas: [...this.state.facturas]
      };
    }

    let proyectos = [];
    let servicios = [];
    let facturas = [];

    if (config.criterio.startsWith("proyecto_")) {
      proyectos = this.state.proyectos.filter((p) => this.isDateWithinPeriod(this.getProjectPeriodDate(p, config.criterio), config));
      const idsProyecto = new Set(proyectos.map((p) => this.getText(p.ID).toLowerCase()).filter(Boolean));
      servicios = this.state.servicios.filter((s) => idsProyecto.has(this.getText(s.ProyectoID).toLowerCase()));
      facturas = this.state.facturas.filter((f) => idsProyecto.has(this.getText(f.ProyectoID).toLowerCase()));
    } else if (config.criterio.startsWith("factura_")) {
      facturas = this.state.facturas.filter((f) => this.isDateWithinPeriod(this.getFacturaPeriodDate(f, config.criterio), config));
      const idsProyecto = new Set(facturas.map((f) => this.getText(f.ProyectoID).toLowerCase()).filter(Boolean));
      proyectos = this.state.proyectos.filter((p) => idsProyecto.has(this.getText(p.ID).toLowerCase()));
      servicios = this.state.servicios.filter((s) => idsProyecto.has(this.getText(s.ProyectoID).toLowerCase()));
    } else if (config.criterio.startsWith("servicio_")) {
      servicios = this.state.servicios.filter((s) => this.isDateWithinPeriod(this.getServicioPeriodDate(s, config.criterio), config));
      const idsProyecto = new Set(servicios.map((s) => this.getText(s.ProyectoID).toLowerCase()).filter(Boolean));
      proyectos = this.state.proyectos.filter((p) => idsProyecto.has(this.getText(p.ID).toLowerCase()));
      facturas = this.state.facturas.filter((f) => idsProyecto.has(this.getText(f.ProyectoID).toLowerCase()));
    } else {
      proyectos = [...this.state.proyectos];
      servicios = [...this.state.servicios];
      facturas = [...this.state.facturas];
    }

    return { proyectos, servicios, facturas };
  },

  updateScopedData() {
    const scoped = this.getScopedData();
    this.state.periodProyectos = scoped.proyectos;
    this.state.periodServicios = scoped.servicios;
    this.state.periodFacturas = scoped.facturas;
    return scoped;
  },

  getActiveData() {
    const hasScopedData =
      Array.isArray(this.state.periodProyectos) &&
      Array.isArray(this.state.periodServicios) &&
      Array.isArray(this.state.periodFacturas) &&
      (this.state.periodProyectos.length || this.state.periodServicios.length || this.state.periodFacturas.length || this.getPeriodConfig().hasPeriod);

    if (hasScopedData) {
      return {
        proyectos: this.state.periodProyectos || [],
        servicios: this.state.periodServicios || [],
        facturas: this.state.periodFacturas || []
      };
    }

    return {
      proyectos: this.state.proyectos || [],
      servicios: this.state.servicios || [],
      facturas: this.state.facturas || []
    };
  },

  renderPeriodInfo() {
    const el = document.getElementById("periodInfo");
    if (!el) return;
    const config = this.getPeriodConfig();
    if (!config.hasPeriod) {
      el.textContent = "Sin filtro de periodo aplicado. Captura una fecha de inicio y/o fin para limitar los resultados; por defecto se usarán los proyectos creados en el periodo.";
      return;
    }
    const inicioTxt = document.getElementById("filterFechaInicio")?.value || "inicio abierto";
    const finTxt = document.getElementById("filterFechaFin")?.value || "fin abierto";
    el.textContent = `Periodo aplicado: ${this.getCriterioPeriodoLabel(config.criterio)} · ${inicioTxt} a ${finTxt}.`;
  },

  applyPeriodAndRender() {
    this.updateScopedData();
    this.buildAlerts();
    this.buildCriticalProjects();
    this.renderFilterOptions();
    this.refreshFilters();
    this.renderKpis();
    this.renderSummaries();
    this.renderPeriodInfo();
  },

  clearPeriodFilters() {
    const inicio = document.getElementById("filterFechaInicio");
    const fin = document.getElementById("filterFechaFin");
    const criterio = document.getElementById("filterCriterioPeriodo");
    if (inicio) inicio.value = "";
    if (fin) fin.value = "";
    if (criterio) criterio.value = "proyecto_alta";
    this.applyPeriodAndRender();
  },

  buildAlerts() {
    const alertas = [];
    const scoped = this.getActiveData();

    scoped.proyectos.forEach((p) => {
      const id = this.getText(p.ID);
      const base = {
        refType: "proyecto",
        refKey: p._firebaseKey,
        ID: id,
        Proyecto: this.getText(p.Proyecto),
        Cliente: this.getText(p.Cliente),
        Responsable: this.getText(p.Nombre),
        Estado: this.getText(p._estadoCalculado),
        PO: this.getText(p.PO)
      };

      if (this.isEntregadoSinFacturar(p)) {
        alertas.push({
          ...base,
          tipo: "Entregado sin facturar",
          severidad: "high",
          titulo: `Proyecto ${id} entregado sin facturar`,
          descripcion: `${base.Cliente || "Sin cliente"} · ${base.Proyecto || "Sin nombre"}`
        });
      }

      if (this.isFacturadoSinPagar(p)) {
        alertas.push({
          ...base,
          tipo: "Facturado sin pagar",
          severidad: "medium",
          titulo: `Proyecto ${id} facturado sin pago registrado`,
          descripcion: `${base.Cliente || "Sin cliente"} · ${base.Proyecto || "Sin nombre"}`
        });
      }

      if (this.isSinPO(p)) {
        alertas.push({
          ...base,
          tipo: "Sin PO",
          severidad: "medium",
          titulo: `Proyecto ${id} sin PO`,
          descripcion: `${base.Cliente || "Sin cliente"} · Responsable: ${base.Responsable || "Sin responsable"}`
        });
      }

      if (this.isSinResponsable(p)) {
        alertas.push({
          ...base,
          tipo: "Sin responsable",
          severidad: "high",
          titulo: `Proyecto ${id} sin responsable`,
          descripcion: `${base.Cliente || "Sin cliente"} · ${base.Proyecto || "Sin nombre"}`
        });
      }

      if (this.isSinAvanceReciente(p)) {
        const dias = this.daysSince(p._ultimaFechaActiva);
        alertas.push({
          ...base,
          tipo: "Sin avance reciente",
          severidad: dias >= 20 ? "high" : "medium",
          titulo: `Proyecto ${id} sin avance reciente`,
          descripcion: `Última fecha: ${p._ultimaFechaActiva || "—"} · ${dias} días aprox.`
        });
      }
    });

    scoped.servicios.forEach((s) => {
      if (!this.isServicioPorPagar(s)) return;
      alertas.push({
        refType: "servicio",
        refKey: s._firebaseKey,
        tipo: "Servicio externo por pagar",
        severidad: "medium",
        ID: s.ID,
        Proyecto: s.Proyecto,
        Cliente: s.Cliente,
        Responsable: "",
        Estado: s.Estatus,
        PO: s.POProyecto,
        titulo: `Servicio externo pendiente de pago ${s.ID}`,
        descripcion: `${s.Cliente || "Sin cliente"} · ${s.Proveedor || "Sin proveedor"} · ${s.Concepto || "Sin concepto"}`
      });
    });



    scoped.facturas.forEach((f) => {
      const estado = this.getEstadoFactura(f);
      if (!["Pendiente", "Vencida"].includes(estado)) return;
      alertas.push({
        refType: "factura",
        refKey: f._firebaseKey,
        tipo: estado === "Vencida" ? "Factura cliente vencida" : "Factura cliente por cobrar",
        severidad: estado === "Vencida" ? "high" : "medium",
        ID: f.ID,
        Proyecto: f.Proyecto || f.ProyectoID,
        Cliente: f.Cliente,
        Responsable: f.Responsable,
        Estado: estado,
        PO: f.POProyecto,
        titulo: `Factura cliente ${f.NumeroFactura || f.ID} ${estado.toLowerCase()}`,
        descripcion: `${f.Cliente || "Sin cliente"} · Proyecto ${f.ProyectoID || f.Proyecto || "—"} · Vence: ${f.FechaVencimiento || "—"}`
      });
    });

    const severidadOrden = { high: 1, medium: 2, low: 3 };
    alertas.sort((a, b) => (severidadOrden[a.severidad] || 9) - (severidadOrden[b.severidad] || 9));
    this.state.alertas = alertas;
  },

  renderFilterOptions() {
    const scoped = this.getActiveData();
    const clientes = [...new Set(scoped.proyectos.map((p) => this.getText(p.Cliente)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const responsables = [...new Set(scoped.proyectos.map((p) => this.getText(p.Nombre)).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    this.fillSelect("filterCliente", "Cliente", clientes);
    this.fillSelect("filterResponsable", "Responsable", responsables);
  },

  fillSelect(id, label, values) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = `<option value="">${this.escapeHtml(label)}</option>`;
    values.forEach((v) => {
      sel.innerHTML += `<option value="${this.escapeHtml(v)}">${this.escapeHtml(v)}</option>`;
    });
    if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  },

  getFilters() {
    return {
      search: this.getText(document.getElementById("searchInput")?.value).toLowerCase(),
      cliente: this.getText(document.getElementById("filterCliente")?.value).toLowerCase(),
      responsable: this.getText(document.getElementById("filterResponsable")?.value).toLowerCase(),
      tipo: this.getText(document.getElementById("filterTipoAlerta")?.value).toLowerCase()
    };
  },


  getUiFilteredData() {
    const f = this.getFilters();
    const scoped = this.getActiveData();

    const filteredProyectos = scoped.proyectos.filter((p) => {
      const txt = [p.ID, p.Proyecto, p.Cliente, p.Nombre, p._estadoCalculado, p.PO].join(" ").toLowerCase();
      const okSearch = !f.search || txt.includes(f.search);
      const okCliente = !f.cliente || this.getText(p.Cliente).toLowerCase() === f.cliente;
      const okResp = !f.responsable || this.getText(p.Nombre).toLowerCase() === f.responsable;
      return okSearch && okCliente && okResp;
    });

    const idsProyecto = new Set(
      filteredProyectos.map((p) => this.getText(p.ID).toLowerCase()).filter(Boolean)
    );

    const filteredServicios = scoped.servicios.filter((s) => {
      const txt = [
        s.ID, s.ProyectoID, s.Proyecto, s.Cliente, s.Proveedor, s.Concepto,
        s.TipoServicio, s.CursoNombre, s.Estatus, s.POProyecto
      ].join(" ").toLowerCase();
      const proyectoId = this.getText(s.ProyectoID).toLowerCase();
      const okSearch = !f.search || txt.includes(f.search);
      const okCliente = !f.cliente || this.getText(s.Cliente).toLowerCase() === f.cliente;
      const okResp = !f.responsable || idsProyecto.has(proyectoId);
      return okSearch && okCliente && okResp;
    });

    const filteredFacturas = scoped.facturas.filter((fa) => {
      const txt = [
        fa.ID, fa.ProyectoID, fa.Proyecto, fa.Cliente, fa.Responsable,
        fa.NumeroFactura, fa.EstadoCobro, fa.POProyecto
      ].join(" ").toLowerCase();
      const proyectoId = this.getText(fa.ProyectoID).toLowerCase();
      const okSearch = !f.search || txt.includes(f.search);
      const okCliente = !f.cliente || this.getText(fa.Cliente).toLowerCase() === f.cliente;
      const okResp = !f.responsable || this.getText(fa.Responsable).toLowerCase() === f.responsable || idsProyecto.has(proyectoId);
      return okSearch && okCliente && okResp;
    });

    return {
      proyectos: filteredProyectos,
      servicios: filteredServicios,
      facturas: filteredFacturas
    };
  },

  refreshFilters() {
    const f = this.getFilters();

    this.state.filteredAlertas = this.state.alertas.filter((a) => {
      const txt = [a.ID, a.Proyecto, a.Cliente, a.Responsable, a.Estado, a.PO, a.tipo, a.descripcion].join(" ").toLowerCase();
      const okSearch = !f.search || txt.includes(f.search);
      const okCliente = !f.cliente || this.getText(a.Cliente).toLowerCase() === f.cliente;
      const okResp = !f.responsable || this.getText(a.Responsable).toLowerCase() === f.responsable;
      const okTipo = !f.tipo || this.getText(a.tipo).toLowerCase() === f.tipo;
      return okSearch && okCliente && okResp && okTipo;
    });

    const filteredData = this.getUiFilteredData();

    this.state.filteredProyectos = filteredData.proyectos;

    this.state.filteredCriticalProjects = this.state.criticalProjects.filter((c) => {
      const txt = [c.ID, c.Proyecto, c.Cliente, c.Responsable, c.Estado, c.PO, c.prioridad, c.motivos.join(" ")].join(" ").toLowerCase();
      const okSearch = !f.search || txt.includes(f.search);
      const okCliente = !f.cliente || this.getText(c.Cliente).toLowerCase() === f.cliente;
      const okResp = !f.responsable || this.getText(c.Responsable).toLowerCase() === f.responsable;
      const okTipo = !f.tipo || c.motivos.some((m) => this.getText(m).toLowerCase() === f.tipo);
      return okSearch && okCliente && okResp && okTipo;
    });

    this.renderAlerts();
    this.renderCriticalProjects();
    this.renderProjectsTable();
    this.renderKpis(filteredData);
    this.renderSummaries(filteredData);
    this.renderPeriodInfo();
  },

  getFacturasDeProyecto(p) {
    const proyectoId = this.getText(p?.ID).toLowerCase();
    if (!proyectoId) return [];
    return this.getActiveData().facturas.filter((f) => this.getText(f.ProyectoID).toLowerCase() === proyectoId);
  },

  getServiciosDeProyecto(p) {
    const proyectoId = this.getText(p?.ID).toLowerCase();
    if (!proyectoId) return [];
    return this.getActiveData().servicios.filter((s) => this.getText(s.ProyectoID).toLowerCase() === proyectoId);
  },

  getProjectPriority(p) {
    const motivos = [];
    let score = 0;

    const add = (points, motivo) => {
      score += points;
      if (!motivos.includes(motivo)) motivos.push(motivo);
    };

    const facturasProyecto = this.getFacturasDeProyecto(p);
    const tieneFacturaVencida = facturasProyecto.some((f) => this.getEstadoFactura(f) === "Vencida");
    const serviciosProyecto = this.getServiciosDeProyecto(p);
    const tieneServicioPorPagar = serviciosProyecto.some((s) => this.isServicioPorPagar(s));
    const diasSinAvance = this.daysSince(p._ultimaFechaActiva);

    if (tieneFacturaVencida) add(50, "Factura cliente vencida");
    if (this.isEntregadoSinFacturar(p)) add(45, "Entregado sin facturar");
    if (tieneServicioPorPagar) add(40, "Servicio externo por pagar");
    if (this.isSinResponsable(p)) add(35, "Sin responsable");
    if (diasSinAvance !== null && diasSinAvance >= 20 && !this.getBool(p.Step12)) {
      add(30, "Sin avance reciente");
    } else if (diasSinAvance !== null && diasSinAvance >= 10 && !this.getBool(p.Step12)) {
      add(10, "Sin avance reciente");
    }
    if (this.isFacturadoSinPagar(p)) add(25, "Facturado sin pagar");
    if (this.isSinPO(p)) add(20, "Sin PO");

    let prioridad = "Baja";
    let severidad = "low";
    if (score >= 70) {
      prioridad = "Alta";
      severidad = "high";
    } else if (score >= 30) {
      prioridad = "Media";
      severidad = "medium";
    }

    return { score, prioridad, severidad, motivos, diasSinAvance };
  },

  buildCriticalProjects() {
    const scoped = this.getActiveData();
    const critical = scoped.proyectos
      .map((p) => {
        const priority = this.getProjectPriority(p);
        return {
          ...priority,
          refType: "proyecto",
          refKey: p._firebaseKey,
          ID: this.getText(p.ID),
          Proyecto: this.getText(p.Proyecto),
          Cliente: this.getText(p.Cliente),
          Responsable: this.getText(p.Nombre),
          Estado: this.getText(p._estadoCalculado),
          PO: this.getText(p.PO),
          _record: p
        };
      })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.ID || 0) - Number(a.ID || 0));

    this.state.criticalProjects = critical;
    this.state.filteredCriticalProjects = [...critical];
  },

  renderKpis(dataOverride = null) {
    const scoped = dataOverride || this.getActiveData();
    const proyectos = scoped.proyectos;
    const servicios = scoped.servicios;
    const serviciosPorPagar = servicios.filter((s) => this.isServicioPorPagar(s));
    const facturas = scoped.facturas;
    const facturasVencidas = facturas.filter((f) => this.getEstadoFactura(f) === "Vencida");
    const facturasPorCobrar = facturas.filter((f) => this.isFacturaPorCobrar(f));

    this.setText("kpiTotalProyectos", proyectos.length);
    this.setText("kpiActivos", proyectos.filter((p) => this.isActivo(p)).length);
    this.setText("kpiEntregadosSinFacturar", proyectos.filter((p) => this.isEntregadoSinFacturar(p)).length);
    this.setText("kpiFacturadosSinPagar", proyectos.filter((p) => this.isFacturadoSinPagar(p)).length);
    this.setText("kpiSinPO", proyectos.filter((p) => this.isSinPO(p)).length);
    this.setText("kpiSinAvance", proyectos.filter((p) => this.isSinAvanceReciente(p)).length);
    this.setText("kpiServiciosExternos", servicios.length);
    this.setText("kpiServiciosPorPagar", serviciosPorPagar.length);
    this.setText("kpiFacturasClientes", facturas.length);
    this.setText("kpiFacturasVencidas", facturasVencidas.length);

    if (this.state.puedeVerMontos) {
      const montoAbierto = servicios
        .filter((s) => this.getText(s.Estatus).toLowerCase() !== "pagado" && this.getText(s.Estatus).toLowerCase() !== "cancelado")
        .reduce((sum, s) => sum + this.getNumber(s.Monto), 0);
      const montoPorPagar = serviciosPorPagar.reduce((sum, s) => sum + this.getNumber(s.Monto), 0);
      const montoPorCobrarClientes = facturasPorCobrar.reduce((sum, f) => sum + this.getNumber(f.Monto), 0);
      this.setText("kpiMontoServiciosAbiertos", this.formatMoney(montoAbierto));
      this.setText("kpiMontoPorPagar", this.formatMoney(montoPorPagar));
      this.setText("kpiMontoPorCobrarClientes", this.formatMoney(montoPorCobrarClientes));
    }
  },

  renderAlerts() {
    const el = document.getElementById("alertsList");
    if (!el) return;

    if (!this.state.filteredAlertas.length) {
      el.innerHTML = `<div class="empty-soft">No hay alertas con los filtros actuales.</div>`;
      return;
    }

    el.innerHTML = this.state.filteredAlertas.map((a) => `
      <div class="alert-card ${this.escapeHtml(a.severidad)}" data-ref-type="${this.escapeHtml(a.refType)}" data-ref-key="${this.escapeHtml(a.refKey)}">
        <div class="alert-title">${this.escapeHtml(a.titulo)}</div>
        <div class="alert-meta">${this.escapeHtml(a.tipo)} · ${this.escapeHtml(a.descripcion)}</div>
      </div>
    `).join("");

    el.querySelectorAll(".alert-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.selectRecord(card.dataset.refType, card.dataset.refKey);
      });
    });
  },

  renderProjectsTable() {
    const tbody = document.getElementById("projectsTableBody");
    if (!tbody) return;

    const rows = this.state.filteredProyectos.slice(0, 200);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7">No hay proyectos para mostrar.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((p) => `
      <tr data-key="${this.escapeHtml(p._firebaseKey)}" style="cursor:pointer;">
        <td>${this.escapeHtml(p.ID)}</td>
        <td>${this.escapeHtml(p.Proyecto)}</td>
        <td>${this.escapeHtml(p.Cliente)}</td>
        <td>${this.escapeHtml(p.Nombre)}</td>
        <td><span class="status-badge ${window.Utils?.getEstadoClass ? window.Utils.getEstadoClass(p._estadoCalculado) : ""}">${this.escapeHtml(p._estadoCalculado)}</span></td>
        <td>${this.escapeHtml(p.PO || "—")}</td>
        <td>${this.escapeHtml(p._ultimaFechaActiva || "—")}</td>
      </tr>
    `).join("");

    tbody.querySelectorAll("tr[data-key]").forEach((tr) => {
      tr.addEventListener("click", () => this.selectRecord("proyecto", tr.dataset.key));
    });
  },

  renderSummaries(dataOverride = null) {
    this.renderExecutiveSummary(dataOverride);
    this.renderCriticalProjects();
    this.renderClientesSummary(dataOverride);
    this.renderResponsablesSummary(dataOverride);
    this.renderServiciosPorPagar(dataOverride);
    this.renderFacturasPorCobrar(dataOverride);
  },

  renderExecutiveSummary(dataOverride = null) {
    const el = document.getElementById("executiveSummaryText");
    if (!el) return;

    const scoped = dataOverride || this.getActiveData();
    const proyectos = scoped.proyectos;
    const servicios = scoped.servicios;
    const facturas = scoped.facturas;

    const totalCriticos = this.state.filteredCriticalProjects.length;
    const alta = this.state.filteredCriticalProjects.filter((c) => c.prioridad === "Alta").length;
    const media = this.state.filteredCriticalProjects.filter((c) => c.prioridad === "Media").length;
    const entregadosSinFacturar = proyectos.filter((p) => this.isEntregadoSinFacturar(p)).length;
    const facturasVencidas = facturas.filter((f) => this.getEstadoFactura(f) === "Vencida").length;
    const facturasPorCobrar = facturas.filter((f) => this.isFacturaPorCobrar(f)).length;
    const serviciosPorPagar = servicios.filter((s) => this.isServicioPorPagar(s)).length;
    const sinAvance = proyectos.filter((p) => this.isSinAvanceReciente(p)).length;

    let topCliente = "";
    if (this.state.puedeVerMontos) {
      const porCliente = new Map();
      facturas
        .filter((f) => this.isFacturaPorCobrar(f))
        .forEach((f) => {
          const cliente = this.getText(f.Cliente) || "Sin cliente";
          porCliente.set(cliente, (porCliente.get(cliente) || 0) + this.getNumber(f.Monto));
        });
      const top = [...porCliente.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top) topCliente = ` El cliente con mayor monto por cobrar es <strong>${this.escapeHtml(top[0])}</strong>, con ${this.escapeHtml(this.formatMoney(top[1]))}.`;
    }

    const lineas = [
      `Hay <strong>${totalCriticos}</strong> proyectos críticos: <strong>${alta}</strong> de prioridad alta y <strong>${media}</strong> de prioridad media.`,
      `Se detectan <strong>${entregadosSinFacturar}</strong> proyectos entregados sin factura cliente registrada.`,
      `Hay <strong>${facturasVencidas}</strong> facturas vencidas y <strong>${facturasPorCobrar}</strong> facturas por cobrar.${topCliente}`,
      `Hay <strong>${serviciosPorPagar}</strong> servicios externos pendientes de pago y <strong>${sinAvance}</strong> proyectos sin avance reciente.`
    ];

    el.innerHTML = lineas.map((l) => `<div class="summary-line">${l}</div>`).join("");
  },

  renderCriticalProjects() {
    const tbody = document.getElementById("criticalProjectsBody");
    if (!tbody) return;

    const rows = this.state.filteredCriticalProjects.slice(0, 100);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8">No hay proyectos críticos con los filtros actuales.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((c) => `
      <tr data-key="${this.escapeHtml(c.refKey)}" style="cursor:pointer;">
        <td><span class="alert-pill ${this.escapeHtml(c.severidad)}">${this.escapeHtml(c.prioridad)}</span></td>
        <td>${this.escapeHtml(c.score)}</td>
        <td>${this.escapeHtml(c.ID)}</td>
        <td>${this.escapeHtml(c.Proyecto || "—")}</td>
        <td>${this.escapeHtml(c.Cliente || "—")}</td>
        <td>${this.escapeHtml(c.Responsable || "—")}</td>
        <td>${this.escapeHtml(c.Estado || "—")}</td>
        <td>${this.escapeHtml(c.motivos.join(" / "))}</td>
      </tr>
    `).join("");

    tbody.querySelectorAll("tr[data-key]").forEach((tr) => {
      tr.addEventListener("click", () => this.selectRecord("proyecto", tr.dataset.key));
    });
  },

  renderClientesSummary(dataOverride = null) {
    const tbody = document.getElementById("clientesSummaryBody");
    if (!tbody) return;

    const scoped = dataOverride || this.getActiveData();
    const map = new Map();
    const ensure = (cliente) => {
      const key = this.getText(cliente) || "Sin cliente";
      if (!map.has(key)) {
        map.set(key, {
          proyectos: 0,
          entregadosSinFacturar: 0,
          facturadosSinPagar: 0,
          servicios: 0,
          facturasPorCobrar: 0
        });
      }
      return map.get(key);
    };

    scoped.proyectos.forEach((p) => {
      const item = ensure(p.Cliente);
      item.proyectos++;
      if (this.isEntregadoSinFacturar(p)) item.entregadosSinFacturar++;
      if (this.isFacturadoSinPagar(p)) item.facturadosSinPagar++;
    });

    scoped.servicios.forEach((s) => {
      ensure(s.Cliente).servicios++;
    });

    scoped.facturas.forEach((f) => {
      if (this.isFacturaPorCobrar(f)) ensure(f.Cliente).facturasPorCobrar++;
    });

    const rows = [...map.entries()].sort((a, b) => b[1].proyectos - a[1].proyectos || a[0].localeCompare(b[0]));
    tbody.innerHTML = rows.map(([cliente, r]) => `
      <tr>
        <td>${this.escapeHtml(cliente)}</td>
        <td>${r.proyectos}</td>
        <td>${r.entregadosSinFacturar}</td>
        <td>${r.facturadosSinPagar}</td>
        <td>${r.servicios}</td>
        <td>${r.facturasPorCobrar}</td>
      </tr>
    `).join("") || `<tr><td colspan="6">Sin datos.</td></tr>`;
  },

  renderResponsablesSummary(dataOverride = null) {
    const tbody = document.getElementById("responsablesSummaryBody");
    if (!tbody) return;

    const scoped = dataOverride || this.getActiveData();
    const map = new Map();
    scoped.proyectos.forEach((p) => {
      const responsable = this.getText(p.Nombre) || "Sin responsable";
      if (!map.has(responsable)) map.set(responsable, { proyectos: 0, desarrollo: 0, espera: 0, entregados: 0 });
      const item = map.get(responsable);
      item.proyectos++;
      if (this.isEstado(p, "En desarrollo")) item.desarrollo++;
      if (this.isEstado(p, "En espera")) item.espera++;
      if (this.getBool(p.Step10)) item.entregados++;
    });

    const rows = [...map.entries()].sort((a, b) => b[1].proyectos - a[1].proyectos || a[0].localeCompare(b[0]));
    tbody.innerHTML = rows.map(([responsable, r]) => `
      <tr>
        <td>${this.escapeHtml(responsable)}</td>
        <td>${r.proyectos}</td>
        <td>${r.desarrollo}</td>
        <td>${r.espera}</td>
        <td>${r.entregados}</td>
      </tr>
    `).join("") || `<tr><td colspan="5">Sin datos.</td></tr>`;
  },

  renderServiciosPorPagar(dataOverride = null) {
    const tbody = document.getElementById("serviciosPorPagarBody");
    if (!tbody) return;

    if (!this.state.puedeVerMontos) {
      tbody.innerHTML = `<tr><td colspan="5">Usuario sin permiso para ver montos.</td></tr>`;
      return;
    }

    const scoped = dataOverride || this.getActiveData();
    const rows = scoped.servicios.filter((s) => this.isServicioPorPagar(s));
    tbody.innerHTML = rows.map((s) => `
      <tr>
        <td>${this.escapeHtml(s.Proyecto || s.ProyectoID)}</td>
        <td>${this.escapeHtml(s.Cliente)}</td>
        <td>${this.escapeHtml(s.Proveedor)}</td>
        <td>${this.escapeHtml(s.Estatus)}</td>
        <td>${this.escapeHtml(this.formatMoney(s.Monto, s.Moneda))}</td>
      </tr>
    `).join("") || `<tr><td colspan="5">No hay servicios por pagar.</td></tr>`;
  },


  renderFacturasPorCobrar(dataOverride = null) {
    const tbody = document.getElementById("facturasPorCobrarBody");
    if (!tbody) return;

    if (!this.state.puedeVerMontos) {
      tbody.innerHTML = `<tr><td colspan="6">Usuario sin permiso para ver montos.</td></tr>`;
      return;
    }

    const scoped = dataOverride || this.getActiveData();
    const rows = scoped.facturas.filter((f) => this.isFacturaPorCobrar(f));
    tbody.innerHTML = rows.map((f) => `
      <tr>
        <td>${this.escapeHtml(f.ProyectoID || f.Proyecto)}</td>
        <td>${this.escapeHtml(f.Cliente)}</td>
        <td>${this.escapeHtml(f.NumeroFactura || f.ID)}</td>
        <td>${this.escapeHtml(this.getEstadoFactura(f))}</td>
        <td>${this.escapeHtml(f.FechaVencimiento || "—")}</td>
        <td>${this.escapeHtml(this.formatMoney(f.Monto, f.Moneda))}</td>
      </tr>
    `).join("") || `<tr><td colspan="6">No hay facturas por cobrar.</td></tr>`;
  },

  selectRecord(type, key) {
    const record = type === "servicio"
      ? this.state.servicios.find((s) => s._firebaseKey === key)
      : type === "factura"
        ? this.state.facturas.find((f) => f._firebaseKey === key)
        : this.state.proyectos.find((p) => p._firebaseKey === key);

    if (!record) return;
    this.state.selected = { type, key };
    this.renderDetail(type, record);
  },

  renderDetail(type, record) {
    document.getElementById("detailEmpty")?.classList.add("hidden");
    document.getElementById("detailContent")?.classList.remove("hidden");

    if (type === "servicio") {
      this.renderServiceDetail(record);
      return;
    }
    if (type === "factura") {
      this.renderInvoiceDetail(record);
      return;
    }
    this.renderProjectDetail(record);
  },

  detailBox(label, value) {
    return `
      <div class="detail-box">
        <div class="detail-box-label">${this.escapeHtml(label)}</div>
        <div class="detail-box-value">${this.escapeHtml(value || "—")}</div>
      </div>
    `;
  },

  renderProjectDetail(p) {
    this.setText("detailMini", "Proyecto");
    this.setText("detailTitle", `${p.ID || ""} · ${p.Proyecto || "Sin nombre"}`);
    this.setText("detailMeta", `${p.Cliente || "Sin cliente"} · ${p.Nombre || "Sin responsable"}`);
    this.setText("detailBadge", p._estadoCalculado || "Sin estado");

    const grid = document.getElementById("detailGrid");
    if (!grid) return;

    const items = [
      ["ID", p.ID],
      ["Cliente", p.Cliente],
      ["Proyecto", p.Proyecto],
      ["Responsable", p.Nombre],
      ["PO", p.PO],
      ["Estado calculado", p._estadoCalculado],
      ["Fecha alta", p.In_DateStamp],
      ["Última fecha activa", p._ultimaFechaActiva],
      ["Fecha entrega", p.FechaEntrega],
      ["Link", p.Link],
      ["Step10 Entregado", this.getBool(p.Step10) ? "Sí" : "No"],
      ["Step11 Facturado", this.getBool(p.Step11) ? "Sí" : "No"],
      ["Step12 Pagado", this.getBool(p.Step12) ? "Sí" : "No"]
    ];

    const prioridad = this.getProjectPriority(p);
    if (prioridad.score > 0) {
      items.push(["Prioridad administrativa", `${prioridad.prioridad} (${prioridad.score} pts)`]);
      items.push(["Motivos de prioridad", prioridad.motivos.join(" / ")]);
    }

    grid.innerHTML = items.map(([label, value]) => this.detailBox(label, value)).join("");
  },


  renderInvoiceDetail(f) {
    const estado = this.getEstadoFactura(f);
    this.setText("detailMini", "Factura cliente");
    this.setText("detailTitle", `${f.ID || ""} · ${f.NumeroFactura || "Sin número"}`);
    this.setText("detailMeta", `${f.Cliente || "Sin cliente"} · Proyecto ${f.ProyectoID || f.Proyecto || "—"}`);
    this.setText("detailBadge", estado);

    const grid = document.getElementById("detailGrid");
    if (!grid) return;

    const items = [
      ["ID", f.ID],
      ["Proyecto", f.ProyectoID || f.Proyecto],
      ["Cliente", f.Cliente],
      ["Responsable", f.Responsable],
      ["PO proyecto", f.POProyecto],
      ["Número factura", f.NumeroFactura],
      ["Fecha factura", f.FechaFactura],
      ["Fecha vencimiento", f.FechaVencimiento],
      ["Estado", estado],
      ["Fecha pago", f.FechaPago],
      ["Monto", this.state.puedeVerMontos ? this.formatMoney(f.Monto, f.Moneda) : "Oculto por permiso"],
      ["Archivo factura", f.ArchivoFactura],
      ["Observaciones", f.Observaciones]
    ];

    grid.innerHTML = items.map(([label, value]) => this.detailBox(label, value)).join("");
  },

  renderServiceDetail(s) {
    this.setText("detailMini", "Servicio externo");
    this.setText("detailTitle", `${s.ID || ""} · ${s.Concepto || "Sin concepto"}`);
    this.setText("detailMeta", `${s.Cliente || "Sin cliente"} · ${s.Proveedor || "Sin proveedor"}`);
    this.setText("detailBadge", s.Estatus || "Sin estatus");

    const grid = document.getElementById("detailGrid");
    if (!grid) return;

    const items = [
      ["ID", s.ID],
      ["Proyecto", s.Proyecto || s.ProyectoID],
      ["Cliente", s.Cliente],
      ["Proveedor", s.Proveedor],
      ["Concepto", s.Concepto],
      ["Tipo", s.TipoServicio],
      ["Curso", s.CursoNombre],
      ["Estatus", s.Estatus],
      ["Fecha solicitud", s.FechaSolicitud],
      ["Fecha compromiso", s.FechaCompromiso],
      ["Factura proveedor", this.state.puedeVerMontos ? s.FacturaProveedor : "Oculto por permiso"],
      ["Fecha factura", this.state.puedeVerMontos ? s.FechaFactura : "Oculto por permiso"],
      ["Fecha pago", this.state.puedeVerMontos ? s.FechaPago : "Oculto por permiso"],
      ["Monto", this.state.puedeVerMontos ? this.formatMoney(s.Monto, s.Moneda) : "Oculto por permiso"],
      ["Observaciones", s.Observaciones]
    ];

    grid.innerHTML = items.map(([label, value]) => this.detailBox(label, value)).join("");
  }
};

document.addEventListener("DOMContentLoaded", function () {
  window.GerenciaApp.init();
});
