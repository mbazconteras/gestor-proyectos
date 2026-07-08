window.ServiciosExternosApp = {
  state: {
    servicios: [],
    serviciosFiltrados: [],
    proyectos: [],
    proveedores: [],
    cursosCatalogo: [],
    proveedoresCursos: {},
    selectedKey: null,
    puedeVerModulo: false,
    puedeVerMontos: false
  },

  async init() {
    this.bindEvents();
    this.renderToday();
    window.Auth.logout();
    this.showLogin();
  },

  bindEvents() {
    const byId = (id) => document.getElementById(id);

    const btnLogin = byId("btnLogin");
    const btnLogout = byId("btnLogout");
    const btnNuevoServicioExterno = byId("btnNuevoServicioExterno");
    const btnNuevoProveedorExterno = byId("btnNuevoProveedorExterno");
    const btnCerrarModalNuevoServicioExterno = byId("btnCerrarModalNuevoServicioExterno");
    const btnCerrarModalNuevoProveedorExterno = byId("btnCerrarModalNuevoProveedorExterno");
    const btnCrearServicioExterno = byId("btnCrearServicioExterno");
    const btnCrearProveedorExterno = byId("btnCrearProveedorExterno");
    const btnGuardarServicioExterno = byId("btnGuardarServicioExterno");
    const nuevoProyectoSearch = byId("nuevoProyectoSearch");
    const nuevoTipoServicio = byId("nuevoTipoServicio");
    const nuevoCursoSelect = byId("nuevoCursoSelect");
    const fieldTipoServicio = byId("fieldTipoServicio");
    const fieldCurso = byId("fieldCurso");

    if (btnLogin) btnLogin.addEventListener("click", () => this.handleLogin());
    if (btnLogout) btnLogout.addEventListener("click", () => this.handleLogout());
    if (btnNuevoServicioExterno) btnNuevoServicioExterno.addEventListener("click", () => this.openNewServiceModal());
    if (btnNuevoProveedorExterno) btnNuevoProveedorExterno.addEventListener("click", () => this.openNewProviderModal());
    if (btnCerrarModalNuevoServicioExterno) btnCerrarModalNuevoServicioExterno.addEventListener("click", () => this.closeNewServiceModal());
    if (btnCerrarModalNuevoProveedorExterno) btnCerrarModalNuevoProveedorExterno.addEventListener("click", () => this.closeNewProviderModal());
    if (btnCrearServicioExterno) btnCrearServicioExterno.addEventListener("click", () => this.handleCreateService());
    if (btnCrearProveedorExterno) btnCrearProveedorExterno.addEventListener("click", () => this.handleCreateProvider());
    if (btnGuardarServicioExterno) btnGuardarServicioExterno.addEventListener("click", () => this.handleSaveService());

    if (nuevoProyectoSearch) {
      nuevoProyectoSearch.addEventListener("input", () => this.renderProjectSearchResults());
    }

    if (nuevoTipoServicio) {
      nuevoTipoServicio.addEventListener("change", () => this.handleTipoServicioNuevoChange());
    }

    if (nuevoCursoSelect) {
      nuevoCursoSelect.addEventListener("change", () => this.handleCursoNuevoChange());
    }

    if (fieldTipoServicio) {
      fieldTipoServicio.addEventListener("change", () => this.handleTipoServicioDetalleChange());
    }

    if (fieldCurso) {
      fieldCurso.addEventListener("change", () => this.handleCursoDetalleChange());
    }

    ["searchInput", "filterProyecto", "filterCliente", "filterProveedor", "filterEstatus"].forEach((id) => {
      const el = byId(id);
      if (el) {
        el.addEventListener("input", () => this.refreshFilters());
        el.addEventListener("change", () => this.refreshFilters());
      }
    });

    const modalNuevoServicio = byId("modalNuevoServicioExterno");
    const modalNuevoProveedor = byId("modalNuevoProveedorExterno");

    if (modalNuevoServicio) {
      modalNuevoServicio.addEventListener("click", (e) => {
        if (e.target === modalNuevoServicio) this.closeNewServiceModal();
      });
    }

    if (modalNuevoProveedor) {
      modalNuevoProveedor.addEventListener("click", (e) => {
        if (e.target === modalNuevoProveedor) this.closeNewProviderModal();
      });
    }
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

  formatNowStamp() {
    return window.Utils?.formatDateStampNow
      ? window.Utils.formatDateStampNow()
      : new Date().toLocaleString("es-MX");
  },

  showLogin() {
    const loginView = document.getElementById("loginView");
    const mainView = document.getElementById("mainView");
    if (loginView) loginView.classList.add("active");
    if (mainView) mainView.classList.remove("active");
  },

  showMain() {
    const loginView = document.getElementById("loginView");
    const mainView = document.getElementById("mainView");
    if (loginView) loginView.classList.remove("active");
    if (mainView) mainView.classList.add("active");

    const user = window.Auth.currentUser;
    const sessionBadge = document.getElementById("sessionBadge");
    const btnNuevoServicioExterno = document.getElementById("btnNuevoServicioExterno");
    const btnNuevoProveedorExterno = document.getElementById("btnNuevoProveedorExterno");

    if (sessionBadge) {
      const tags = [];
      if (this.state.puedeVerModulo) tags.push("Servicios externos");
      if (this.state.puedeVerMontos) tags.push("Montos");
      sessionBadge.textContent = `${user?.nombre || user?.usuario || ""}${tags.length ? " · " + tags.join(" · ") : ""}`;
    }

    if (btnNuevoServicioExterno) {
      btnNuevoServicioExterno.classList.toggle("hidden", !this.state.puedeVerModulo);
    }
    if (btnNuevoProveedorExterno) {
      btnNuevoProveedorExterno.classList.toggle("hidden", !this.state.puedeVerModulo);
    }
  },

  setMessage(id, text, type = "") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || "";
    el.className = `message ${type}`.trim();
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
      await this.loadUserPermissions();

      if (!this.state.puedeVerModulo) {
        window.Auth.logout();
        throw new Error("No tienes permiso para acceder a Servicios Externos. Solicita al administrador el permiso Permisos.ServiciosExternos=true.");
      }

      this.showMain();
      await this.loadAllData();
    } catch (err) {
      console.error("Error en login:", err);
      this.setMessage("loginMessage", err.message || "No fue posible iniciar sesión.", "error");
    }
  },

  handleLogout() {
    window.Auth.logout();
    this.state.servicios = [];
    this.state.serviciosFiltrados = [];
    this.state.proyectos = [];
    this.state.proveedores = [];
    this.state.cursosCatalogo = [];
    this.state.proveedoresCursos = {};
    this.state.selectedKey = null;
    this.state.puedeVerModulo = false;
    this.showLogin();
    this.showEmptyDetail();
    this.setMessage("loginMessage", "", "");
    const pwd = document.getElementById("loginPassword");
    if (pwd) pwd.value = "";
  },

  async loadUserPermissions() {
    const current = window.Auth.currentUser;
    const raw = current?.raw || {};
    const permisos = raw?.Permisos && typeof raw.Permisos === "object" ? raw.Permisos : {};

    this.state.puedeVerModulo = this.getBool(permisos.ServiciosExternos);
    this.state.puedeVerMontos = this.getBool(permisos.Montos);

    document.querySelectorAll('[data-montos="true"]').forEach((el) => {
      el.classList.toggle("hidden", !this.state.puedeVerMontos);
    });
  },

  async loadAllData() {
    await Promise.all([
      this.loadProjects(),
      this.loadProviders(),
      this.loadServices(),
      this.loadCursosCatalogo()
    ]);

    this.renderProjectFilterOptions();
    this.renderClientFilterOptions();
    this.renderProviderFilterOptions();
    this.renderProviderSelectOptions("nuevoProveedorSelect");
    this.renderProviderSelectOptions("fieldProveedor");
    this.renderCursosOptions("nuevoCursoSelect");
    this.renderCursosOptions("fieldCurso");
    this.refreshFilters();
    this.showEmptyDetail();
  },

  async loadProjects() {
    const snap = await window.database.ref("Registros").once("value");
    const data = snap.val() || {};
    const proyectos = [];

    Object.keys(data).forEach((key) => {
      const raw = data[key] || {};
      proyectos.push({
        _firebaseKey: key,
        ID: raw.ID || Number(key) || Date.now(),
        Proyecto: this.getText(raw.Proyecto),
        Cliente: this.getText(raw.Cliente),
        POProyecto: this.getText(raw.PO),
        Nombre: this.getText(raw.Nombre)
      });
    });

    proyectos.sort((a, b) => Number(b.ID) - Number(a.ID));
    this.state.proyectos = proyectos;
  },

  async loadProviders() {
    const snap = await window.database.ref("ProveedoresExternos").once("value");
    const data = snap.val() || {};
    const proveedores = [];

    Object.keys(data).forEach((key) => {
      const raw = data[key] || {};
      proveedores.push({
        _firebaseKey: key,
        ID: this.getText(raw.ID || key),
        Empresa: this.getText(raw.Empresa),
        Contacto: this.getText(raw.Contacto),
        Telefono: this.getText(raw.Telefono),
        Email: this.getText(raw.Email),
        Activo: this.getBool(raw.Activo),
        Observaciones: this.getText(raw.Observaciones)
      });
    });

    proveedores.sort((a, b) => a.Empresa.localeCompare(b.Empresa));
    this.state.proveedores = proveedores;
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
        CursoID: this.getText(raw.CursoID),
        CursoNombre: this.getText(raw.CursoNombre),
        Estatus: this.getText(raw.Estatus || "Solicitado"),
        Observaciones: this.getText(raw.Observaciones),
        Monto: raw.Monto ?? "",
        Moneda: this.getText(raw.Moneda || "MXN"),
        FacturaProveedor: this.getText(raw.FacturaProveedor),
        FechaSolicitud: this.getText(raw.FechaSolicitud),
        FechaCompromiso: this.getText(raw.FechaCompromiso),
        FechaFactura: this.getText(raw.FechaFactura),
        FechaPago: this.getText(raw.FechaPago),
        CreadoPor: this.getText(raw.CreadoPor),
        FechaCreacion: this.getText(raw.FechaCreacion),
        UltimaEdicionPor: this.getText(raw.UltimaEdicionPor),
        FechaUltimaEdicion: this.getText(raw.FechaUltimaEdicion)
      });
    });

    servicios.sort((a, b) => Number(b.ID || 0) - Number(a.ID || 0));
    this.state.servicios = servicios;
    this.state.serviciosFiltrados = [...servicios];
  },

  async loadCursosCatalogo() {
    const snap = await window.database.ref("catalogo_cursos").once("value");
    const data = snap.val() || {};
    const cursos = [];
    const proveedoresCursos = {};

    Object.keys(data).forEach((key) => {
      const raw = data[key] || {};
      const nombre = this.getText(raw.nombre || raw.Nombre || key);
      const proveedoresObj = raw.proveedores || {};
      const proveedores = Object.keys(proveedoresObj).filter((k) => proveedoresObj[k] === true);

      cursos.push({
        ID: key,
        Nombre: nombre,
        Norma: this.getText(raw.norma),
        Duracion: this.getText(raw.duracion),
        Area: this.getText(raw.area),
        ProveedoresKeys: proveedores
      });

      proveedoresCursos[key] = proveedores;
    });

    cursos.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
    this.state.cursosCatalogo = cursos;
    this.state.proveedoresCursos = proveedoresCursos;
  },

  mapProveedorCursoKeyToName(key) {
    const limpio = this.getText(key).replace(/^prov_/, "");
    return limpio
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  },

  getProveedoresPermitidosParaCurso(cursoId) {
    const keys = this.state.proveedoresCursos[cursoId] || [];
    const nombresPermitidos = keys.map((k) => this.mapProveedorCursoKeyToName(k));

    return this.state.proveedores.filter((prov) => {
      const empresa = this.getText(prov.Empresa).toUpperCase();
      return nombresPermitidos.includes(empresa);
    });
  },

  renderCursosOptions(id, currentValue = "") {
    const sel = document.getElementById(id);
    if (!sel) return;

    sel.innerHTML = `<option value="">Selecciona un curso</option>`;
    this.state.cursosCatalogo.forEach((curso) => {
      sel.innerHTML += `<option value="${this.escapeHtml(curso.ID)}">${this.escapeHtml(curso.Nombre)}</option>`;
    });

    sel.value = currentValue || "";
  },

  renderProjectFilterOptions() {
    const sel = document.getElementById("filterProyecto");
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = `<option value="">Proyecto</option>`;
    this.state.proyectos.forEach((p) => {
      sel.innerHTML += `<option value="${this.escapeHtml(p.ID)}">${this.escapeHtml(p.Proyecto || String(p.ID))}</option>`;
    });
    sel.value = current;
  },

  renderClientFilterOptions() {
    const sel = document.getElementById("filterCliente");
    if (!sel) return;
    const current = sel.value;
    const clientes = [...new Set(this.state.proyectos.map((p) => p.Cliente).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    sel.innerHTML = `<option value="">Cliente</option>`;
    clientes.forEach((c) => {
      sel.innerHTML += `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}</option>`;
    });
    sel.value = current;
  },

  renderProviderFilterOptions() {
    const sel = document.getElementById("filterProveedor");
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = `<option value="">Proveedor</option>`;
    this.state.proveedores.filter((p) => p.Activo).forEach((p) => {
      sel.innerHTML += `<option value="${this.escapeHtml(p.ID)}">${this.escapeHtml(p.Empresa)}</option>`;
    });
    sel.value = current;
  },

  renderProviderSelectOptions(id, lista = null, currentValue = "") {
    const sel = document.getElementById(id);
    if (!sel) return;

    const actual = currentValue || sel.value;
    const proveedores = lista || this.state.proveedores.filter((p) => p.Activo);

    sel.innerHTML = `<option value="">Selecciona un proveedor</option>`;
    proveedores.forEach((p) => {
      sel.innerHTML += `<option value="${this.escapeHtml(p.ID)}">${this.escapeHtml(p.Empresa)}</option>`;
    });

    sel.value = actual || "";
  },

  setCursoVisibility(prefix, visible) {
    const wrapperId = prefix === "nuevo" ? "nuevoCursoWrapper" : "fieldCursoWrapper";
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) wrapper.classList.toggle("hidden", !visible);
  },

  handleTipoServicioNuevoChange() {
    const tipo = this.getText(document.getElementById("nuevoTipoServicio")?.value);
    const esCap = tipo === "Capacitacion";
    this.setCursoVisibility("nuevo", esCap);

    if (esCap) {
      this.renderCursosOptions("nuevoCursoSelect");
      this.renderProviderSelectOptions("nuevoProveedorSelect", []);
    } else {
      this.setValue("nuevoCursoSelect", "");
      this.renderProviderSelectOptions("nuevoProveedorSelect");
    }
  },

  handleCursoNuevoChange() {
    const cursoId = this.getText(document.getElementById("nuevoCursoSelect")?.value);
    if (!cursoId) {
      this.renderProviderSelectOptions("nuevoProveedorSelect", []);
      return;
    }
    const permitidos = this.getProveedoresPermitidosParaCurso(cursoId);
    this.renderProviderSelectOptions("nuevoProveedorSelect", permitidos);
  },

  handleTipoServicioDetalleChange() {
    const tipo = this.getText(document.getElementById("fieldTipoServicio")?.value);
    const esCap = tipo === "Capacitacion";
    this.setCursoVisibility("field", esCap);

    if (esCap) {
      this.renderCursosOptions("fieldCurso", document.getElementById("fieldCurso")?.value || "");
      const cursoId = this.getText(document.getElementById("fieldCurso")?.value);
      if (cursoId) {
        const permitidos = this.getProveedoresPermitidosParaCurso(cursoId);
        this.renderProviderSelectOptions("fieldProveedor", permitidos, document.getElementById("fieldProveedor")?.value || "");
      } else {
        this.renderProviderSelectOptions("fieldProveedor", []);
      }
    } else {
      this.setValue("fieldCurso", "");
      this.renderProviderSelectOptions("fieldProveedor");
    }
  },

  handleCursoDetalleChange() {
    const cursoId = this.getText(document.getElementById("fieldCurso")?.value);
    if (!cursoId) {
      this.renderProviderSelectOptions("fieldProveedor", []);
      return;
    }
    const permitidos = this.getProveedoresPermitidosParaCurso(cursoId);
    this.renderProviderSelectOptions("fieldProveedor", permitidos);
  },

  renderProjectSearchResults() {
    const q = this.getText(document.getElementById("nuevoProyectoSearch")?.value).toLowerCase();
    const body = document.getElementById("nuevoProyectoResultadosBody");
    if (!body) return;

    if (!q) {
      body.innerHTML = `<tr><td colspan="3">Escribe un ID para buscar proyectos.</td></tr>`;
      return;
    }

    const matches = this.state.proyectos
      .filter((p) => String(p.ID).toLowerCase().includes(q))
      .slice(0, 10);

    if (!matches.length) {
      body.innerHTML = `<tr><td colspan="3">No se encontraron proyectos.</td></tr>`;
      return;
    }

    body.innerHTML = "";
    matches.forEach((p) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.innerHTML = `
        <td>${this.escapeHtml(String(p.ID))}</td>
        <td>${this.escapeHtml(p.Proyecto)}</td>
        <td>${this.escapeHtml(p.Cliente)}</td>
      `;
      tr.addEventListener("click", () => this.selectProjectForNewService(p.ID));
      body.appendChild(tr);
    });
  },

  selectProjectForNewService(projectId) {
    const proyecto = this.state.proyectos.find((p) => String(p.ID) === String(projectId));
    if (!proyecto) return;

    this.setValue("nuevoProyectoSelect", proyecto.ID);
    this.setValue("nuevoProyectoSearch", String(proyecto.ID));
    this.setValue("nuevoClientePreview", proyecto.Cliente);
    this.setValue("nuevoPOProyectoPreview", proyecto.POProyecto);

    const body = document.getElementById("nuevoProyectoResultadosBody");
    if (body) {
      body.innerHTML = `
        <tr>
          <td>${this.escapeHtml(String(proyecto.ID))}</td>
          <td>${this.escapeHtml(proyecto.Proyecto)}</td>
          <td>${this.escapeHtml(proyecto.Cliente)}</td>
        </tr>
      `;
    }
  },

  getFilters() {
    return {
      search: document.getElementById("searchInput")?.value || "",
      proyecto: document.getElementById("filterProyecto")?.value || "",
      cliente: document.getElementById("filterCliente")?.value || "",
      proveedor: document.getElementById("filterProveedor")?.value || "",
      estatus: document.getElementById("filterEstatus")?.value || ""
    };
  },

  refreshFilters() {
    const { search, proyecto, cliente, proveedor, estatus } = this.getFilters();
    const s = this.getText(search).toLowerCase();
    const p = this.getText(proyecto);
    const c = this.getText(cliente).toLowerCase();
    const prov = this.getText(proveedor);
    const est = this.getText(estatus).toLowerCase();

    this.state.serviciosFiltrados = this.state.servicios.filter((item) => {
      const okSearch =
        !s ||
        this.getText(item.Proyecto).toLowerCase().includes(s) ||
        this.getText(item.Cliente).toLowerCase().includes(s) ||
        this.getText(item.Proveedor).toLowerCase().includes(s) ||
        this.getText(item.Concepto).toLowerCase().includes(s) ||
        this.getText(item.CursoNombre).toLowerCase().includes(s) ||
        this.getText(item.ID).toLowerCase().includes(s);

      const okProyecto = !p || String(item.ProyectoID) === String(p);
      const okCliente = !c || this.getText(item.Cliente).toLowerCase() === c;
      const okProveedor = !prov || String(item.ProveedorID) === String(prov);
      const okEstatus = !est || this.getText(item.Estatus).toLowerCase() === est;

      return okSearch && okProyecto && okCliente && okProveedor && okEstatus;
    });

    this.renderTable();
    this.renderKPIs();

    if (this.state.selectedKey) {
      const selected = this.state.servicios.find((x) => x._firebaseKey === this.state.selectedKey);
      if (selected) {
        this.renderDetail(selected);
      }
    }
  },

  renderKPIs() {
    const rows = this.state.serviciosFiltrados;
    const count = (estatus) => rows.filter((x) => this.getText(x.Estatus) === estatus).length;

    this.setText("kpiTotalServicios", rows.length);
    this.setText("kpiSolicitados", count("Solicitado"));
    this.setText("kpiEnProceso", count("En proceso"));
    this.setText("kpiServicioRecibido", count("Servicio recibido"));
    this.setText("kpiFacturaRecibida", count("Factura recibida"));
    this.setText("kpiPagados", count("Pagado"));
  },

  renderTable() {
    const body = document.getElementById("serviciosExternosTableBody");
    const tableEmpty = document.getElementById("tableEmpty");
    if (!body) return;

    body.innerHTML = "";

    this.state.serviciosFiltrados.forEach((item) => {
      const tr = document.createElement("tr");
      tr.dataset.key = item._firebaseKey;
      if (item._firebaseKey === this.state.selectedKey) tr.classList.add("selected");

      const montoCell = this.state.puedeVerMontos
        ? `<td>${this.escapeHtml(this.formatMoney(item.Monto, item.Moneda))}</td>
           <td>${this.escapeHtml(item.FacturaProveedor || "")}</td>
           <td>${this.escapeHtml(item.FechaPago || "")}</td>`
        : "";

      tr.innerHTML = `
        <td>${this.escapeHtml(item.ID)}</td>
        <td>${this.escapeHtml(item.Proyecto)}</td>
        <td>${this.escapeHtml(item.Cliente)}</td>
        <td>${this.escapeHtml(item.Proveedor)}</td>
        <td>${this.escapeHtml(item.Concepto)}</td>
        <td>${this.escapeHtml(item.TipoServicio)}</td>
        <td>${this.escapeHtml(item.CursoNombre || "")}</td>
        <td>${this.escapeHtml(item.Estatus)}</td>
        <td>${this.escapeHtml(item.FechaSolicitud)}</td>
        ${montoCell}
      `;

      tr.addEventListener("click", () => {
        this.selectService(item._firebaseKey);
      });

      body.appendChild(tr);
    });

    if (tableEmpty) {
      tableEmpty.classList.toggle("hidden", this.state.serviciosFiltrados.length > 0);
    }
  },

  selectService(key) {
    this.state.selectedKey = key;
    const servicio = this.state.servicios.find((x) => x._firebaseKey === key);
    this.renderTable();
    this.renderDetail(servicio);
    this.setMessage("saveMessage", "", "");
  },

  showEmptyDetail() {
    const detailEmpty = document.getElementById("detailEmpty");
    const detailContent = document.getElementById("detailContent");
    if (detailEmpty) detailEmpty.classList.remove("hidden");
    if (detailContent) detailContent.classList.add("hidden");
  },

  renderDetail(servicio) {
    if (!servicio) {
      this.showEmptyDetail();
      return;
    }

    const detailEmpty = document.getElementById("detailEmpty");
    const detailContent = document.getElementById("detailContent");
    if (detailEmpty) detailEmpty.classList.add("hidden");
    if (detailContent) detailContent.classList.remove("hidden");

    this.setText("detailTitle", servicio.Concepto || "Servicio externo");
    this.setText("detailProyectoMini", servicio.Proyecto || "");
    this.setText("detailProveedorMini", servicio.Proveedor || "");
    this.setText("detailIDMini", `ID ${servicio.ID || ""}`);
    this.setText("detailEstadoBadge", servicio.Estatus || "Solicitado");

    this.setValue("fieldID", servicio.ID);
    this.setValue("fieldProyecto", servicio.Proyecto);
    this.setValue("fieldCliente", servicio.Cliente);
    this.setValue("fieldPOProyecto", servicio.POProyecto);
    this.setValue("fieldTipoServicio", servicio.TipoServicio);
    this.renderCursosOptions("fieldCurso", servicio.CursoID);
    this.setCursoVisibility("field", servicio.TipoServicio === "Capacitacion");

    if (servicio.TipoServicio === "Capacitacion" && servicio.CursoID) {
      const permitidos = this.getProveedoresPermitidosParaCurso(servicio.CursoID);
      this.renderProviderSelectOptions("fieldProveedor", permitidos, servicio.ProveedorID);
    } else {
      this.renderProviderSelectOptions("fieldProveedor", null, servicio.ProveedorID);
    }

    this.setValue("fieldConcepto", servicio.Concepto);
    this.setValue("fieldEstatus", servicio.Estatus);
    this.setValue("fieldFechaSolicitud", servicio.FechaSolicitud);
    this.setValue("fieldFechaCompromiso", servicio.FechaCompromiso);
    this.setValue("fieldObservaciones", servicio.Observaciones);

    if (this.state.puedeVerMontos) {
      this.setValue("fieldMonto", servicio.Monto);
      this.setValue("fieldMoneda", servicio.Moneda || "MXN");
      this.setValue("fieldFacturaProveedor", servicio.FacturaProveedor);
      this.setValue("fieldFechaFactura", servicio.FechaFactura);
      this.setValue("fieldFechaPago", servicio.FechaPago);
    }
  },

  getSelectedServiceForm() {
    const selected = this.state.servicios.find((x) => x._firebaseKey === this.state.selectedKey);
    if (!selected) return null;

    const tipoServicio = document.getElementById("fieldTipoServicio")?.value || "";
    const cursoId = tipoServicio === "Capacitacion" ? (document.getElementById("fieldCurso")?.value || "") : "";
    const cursoObj = this.state.cursosCatalogo.find((c) => c.ID === cursoId);
    const proveedorId = document.getElementById("fieldProveedor")?.value || "";
    const proveedorObj = this.state.proveedores.find((p) => String(p.ID) === String(proveedorId));

    const payload = { ...selected };
    payload.TipoServicio = tipoServicio;
    payload.CursoID = cursoId;
    payload.CursoNombre = cursoObj?.Nombre || "";
    payload.ProveedorID = proveedorId;
    payload.Proveedor = proveedorObj?.Empresa || "";
    payload.Concepto = document.getElementById("fieldConcepto")?.value || "";
    payload.Estatus = document.getElementById("fieldEstatus")?.value || "Solicitado";
    payload.FechaSolicitud = document.getElementById("fieldFechaSolicitud")?.value || "";
    payload.FechaCompromiso = document.getElementById("fieldFechaCompromiso")?.value || "";
    payload.Observaciones = document.getElementById("fieldObservaciones")?.value || "";

    if (this.state.puedeVerMontos) {
      payload.Monto = document.getElementById("fieldMonto")?.value || "";
      payload.Moneda = document.getElementById("fieldMoneda")?.value || "MXN";
      payload.FacturaProveedor = document.getElementById("fieldFacturaProveedor")?.value || "";
      payload.FechaFactura = document.getElementById("fieldFechaFactura")?.value || "";
      payload.FechaPago = document.getElementById("fieldFechaPago")?.value || "";
    }

    return payload;
  },

  async handleSaveService() {
    this.setMessage("saveMessage", "", "");
    try {
      const payload = this.getSelectedServiceForm();
      if (!payload) throw new Error("No hay servicio seleccionado.");
      if (!this.getText(payload.TipoServicio)) throw new Error("Debes seleccionar el tipo de servicio.");
      if (payload.TipoServicio === "Capacitacion" && !this.getText(payload.CursoID)) {
        throw new Error("Debes seleccionar el curso.");
      }
      if (!this.getText(payload.ProveedorID)) throw new Error("Debes seleccionar un proveedor.");
      if (!this.getText(payload.Concepto)) throw new Error("Debes capturar el concepto.");

      payload.UltimaEdicionPor = window.Auth.currentUser?.usuario || "";
      payload.FechaUltimaEdicion = this.formatNowStamp();

      await window.database.ref(`ServiciosExternos/${payload._firebaseKey}`).set(this.toFirebaseServicePayload(payload));
      await this.loadServices();
      this.refreshFilters();
      this.selectService(payload._firebaseKey);
      this.setMessage("saveMessage", "Servicio externo guardado correctamente.", "success");
    } catch (err) {
      console.error(err);
      this.setMessage("saveMessage", err.message || "No fue posible guardar.", "error");
    }
  },

  openNewServiceModal() {
    const modal = document.getElementById("modalNuevoServicioExterno");
    if (!modal) return;
    this.clearNewServiceForm();
    this.renderCursosOptions("nuevoCursoSelect");
    this.renderProviderSelectOptions("nuevoProveedorSelect");
    const idPreview = document.getElementById("nuevoProyectoIDPreview");
    if (idPreview) idPreview.value = String(Date.now());
    modal.classList.remove("hidden");
  },

  closeNewServiceModal() {
    const modal = document.getElementById("modalNuevoServicioExterno");
    if (!modal) return;
    modal.classList.add("hidden");
  },

  openNewProviderModal() {
    const modal = document.getElementById("modalNuevoProveedorExterno");
    if (!modal) return;
    this.clearNewProviderForm();
    modal.classList.remove("hidden");
  },

  closeNewProviderModal() {
    const modal = document.getElementById("modalNuevoProveedorExterno");
    if (!modal) return;
    modal.classList.add("hidden");
  },

  clearNewServiceForm() {
    [
      "nuevoProyectoSelect",
      "nuevoProyectoSearch",
      "nuevoClientePreview",
      "nuevoPOProyectoPreview",
      "nuevoTipoServicio",
      "nuevoCursoSelect",
      "nuevoProveedorSelect",
      "nuevoConcepto",
      "nuevoFechaSolicitud",
      "nuevoFechaCompromiso",
      "nuevoObservaciones",
      "nuevoMonto",
      "nuevoFacturaProveedor",
      "nuevoFechaFactura",
      "nuevoFechaPago"
    ].forEach((id) => this.setValue(id, ""));

    this.setCursoVisibility("nuevo", false);
    this.renderProviderSelectOptions("nuevoProveedorSelect");

    const resultadosBody = document.getElementById("nuevoProyectoResultadosBody");
    if (resultadosBody) {
      resultadosBody.innerHTML = `<tr><td colspan="3">Escribe un ID para buscar proyectos.</td></tr>`;
    }

    this.setValue("nuevoEstatus", "Solicitado");
    this.setValue("nuevoMoneda", "MXN");
    this.setMessage("newServiceMessage", "", "");
  },

  clearNewProviderForm() {
    [
      "nuevoProveedorEmpresa",
      "nuevoProveedorContacto",
      "nuevoProveedorTelefono",
      "nuevoProveedorEmail",
      "nuevoProveedorObservaciones"
    ].forEach((id) => this.setValue(id, ""));
    this.setMessage("newProviderMessage", "", "");
  },

  async handleCreateProvider() {
    this.setMessage("newProviderMessage", "", "");
    try {
      if (!this.state.puedeVerModulo) {
        throw new Error("No tienes permiso para crear proveedores externos.");
      }

      const empresa = this.getText(document.getElementById("nuevoProveedorEmpresa")?.value);
      const contacto = this.getText(document.getElementById("nuevoProveedorContacto")?.value);
      const telefono = this.getText(document.getElementById("nuevoProveedorTelefono")?.value);
      const email = this.getText(document.getElementById("nuevoProveedorEmail")?.value);
      const observaciones = this.getText(document.getElementById("nuevoProveedorObservaciones")?.value);

      if (!empresa) throw new Error("Debes capturar la empresa.");

      const existe = this.state.proveedores.some(
        (p) => this.getText(p.Empresa).toLowerCase() === empresa.toLowerCase()
      );
      if (existe) throw new Error("Ese proveedor ya existe.");

      const id = String(Date.now());
      const payload = {
        ID: id,
        Empresa: empresa,
        Contacto: contacto,
        Telefono: telefono,
        Email: email,
        Activo: true,
        Observaciones: observaciones,
        CreadoPor: window.Auth.currentUser?.usuario || "",
        FechaCreacion: this.formatNowStamp(),
        UltimaEdicionPor: window.Auth.currentUser?.usuario || "",
        FechaUltimaEdicion: this.formatNowStamp()
      };

      await window.database.ref(`ProveedoresExternos/${id}`).set(payload);
      await this.loadProviders();
      this.renderProviderFilterOptions();
      this.renderProviderSelectOptions("nuevoProveedorSelect");
      this.renderProviderSelectOptions("fieldProveedor");
      this.setMessage("newProviderMessage", "Proveedor externo creado correctamente.", "success");
      this.closeNewProviderModal();
    } catch (err) {
      console.error(err);
      this.setMessage("newProviderMessage", err.message || "No fue posible crear el proveedor.", "error");
    }
  },

  async handleCreateService() {
    this.setMessage("newServiceMessage", "", "");
    try {
      if (!this.state.puedeVerModulo) {
        throw new Error("No tienes permiso para crear servicios externos.");
      }

      const projectId = document.getElementById("nuevoProyectoSelect")?.value || "";
      const proyecto = this.state.proyectos.find((p) => String(p.ID) === String(projectId));
      if (!proyecto) throw new Error("Debes seleccionar un proyecto.");

      const tipoServicio = this.getText(document.getElementById("nuevoTipoServicio")?.value);
      const cursoId = tipoServicio === "Capacitacion" ? this.getText(document.getElementById("nuevoCursoSelect")?.value) : "";
      const cursoObj = this.state.cursosCatalogo.find((c) => c.ID === cursoId);

      if (!tipoServicio) throw new Error("Debes seleccionar el tipo de servicio.");
      if (tipoServicio === "Capacitacion" && !cursoId) {
        throw new Error("Debes seleccionar el curso.");
      }

      const proveedorId = document.getElementById("nuevoProveedorSelect")?.value || "";
      const proveedor = this.state.proveedores.find((p) => String(p.ID) === String(proveedorId));
      if (!proveedor) throw new Error("Debes seleccionar un proveedor.");

      const conceptoCapturado = this.getText(document.getElementById("nuevoConcepto")?.value);
      const concepto = conceptoCapturado || (tipoServicio === "Capacitacion" ? (cursoObj?.Nombre || "") : "");
      const estatus = this.getText(document.getElementById("nuevoEstatus")?.value || "Solicitado");
      const fechaSolicitud = this.getText(document.getElementById("nuevoFechaSolicitud")?.value);
      const fechaCompromiso = this.getText(document.getElementById("nuevoFechaCompromiso")?.value);
      const observaciones = this.getText(document.getElementById("nuevoObservaciones")?.value);

      if (!concepto) throw new Error("Debes capturar el concepto.");

      const id = String(Date.now());
      const payload = {
        ID: id,
        ProyectoID: String(proyecto.ID),
        Proyecto: proyecto.Proyecto,
        Cliente: proyecto.Cliente,
        POProyecto: proyecto.POProyecto,
        ProveedorID: proveedor.ID,
        Proveedor: proveedor.Empresa,
        Concepto: concepto,
        TipoServicio: tipoServicio,
        CursoID: cursoId,
        CursoNombre: cursoObj?.Nombre || "",
        Estatus: estatus,
        Observaciones: observaciones,
        Monto: this.state.puedeVerMontos ? (document.getElementById("nuevoMonto")?.value || "") : "",
        Moneda: this.state.puedeVerMontos ? (document.getElementById("nuevoMoneda")?.value || "MXN") : "MXN",
        FacturaProveedor: this.state.puedeVerMontos ? (document.getElementById("nuevoFacturaProveedor")?.value || "") : "",
        FechaSolicitud: fechaSolicitud,
        FechaCompromiso: fechaCompromiso,
        FechaFactura: this.state.puedeVerMontos ? (document.getElementById("nuevoFechaFactura")?.value || "") : "",
        FechaPago: this.state.puedeVerMontos ? (document.getElementById("nuevoFechaPago")?.value || "") : "",
        CreadoPor: window.Auth.currentUser?.usuario || "",
        FechaCreacion: this.formatNowStamp(),
        UltimaEdicionPor: window.Auth.currentUser?.usuario || "",
        FechaUltimaEdicion: this.formatNowStamp()
      };

      await window.database.ref(`ServiciosExternos/${id}`).set(payload);
      await this.loadServices();
      this.refreshFilters();
      this.closeNewServiceModal();
      this.selectService(id);
    } catch (err) {
      console.error(err);
      this.setMessage("newServiceMessage", err.message || "No fue posible crear el servicio externo.", "error");
    }
  },

  toFirebaseServicePayload(payload) {
    return {
      ID: this.getText(payload.ID),
      ProyectoID: this.getText(payload.ProyectoID),
      Proyecto: this.getText(payload.Proyecto),
      Cliente: this.getText(payload.Cliente),
      POProyecto: this.getText(payload.POProyecto),
      ProveedorID: this.getText(payload.ProveedorID),
      Proveedor: this.getText(payload.Proveedor),
      Concepto: this.getText(payload.Concepto),
      TipoServicio: this.getText(payload.TipoServicio),
      CursoID: this.getText(payload.CursoID),
      CursoNombre: this.getText(payload.CursoNombre),
      Estatus: this.getText(payload.Estatus),
      Observaciones: this.getText(payload.Observaciones),
      Monto: this.state.puedeVerMontos ? (payload.Monto === "" ? "" : Number(payload.Monto)) : (payload.Monto ?? ""),
      Moneda: this.getText(payload.Moneda || "MXN"),
      FacturaProveedor: this.getText(payload.FacturaProveedor),
      FechaSolicitud: this.getText(payload.FechaSolicitud),
      FechaCompromiso: this.getText(payload.FechaCompromiso),
      FechaFactura: this.getText(payload.FechaFactura),
      FechaPago: this.getText(payload.FechaPago),
      CreadoPor: this.getText(payload.CreadoPor),
      FechaCreacion: this.getText(payload.FechaCreacion),
      UltimaEdicionPor: this.getText(payload.UltimaEdicionPor),
      FechaUltimaEdicion: this.getText(payload.FechaUltimaEdicion)
    };
  },

  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  },

  setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  },

  formatMoney(value, currency = "MXN") {
    if (value === "" || value === null || value === undefined || Number.isNaN(Number(value))) return "";
    try {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: currency || "MXN"
      }).format(Number(value));
    } catch {
      return String(value);
    }
  },

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

document.addEventListener("DOMContentLoaded", function () {
  window.ServiciosExternosApp.init();
});
