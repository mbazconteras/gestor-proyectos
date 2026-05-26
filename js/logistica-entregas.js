// Logística / Entregas v2.4 - notificaciones CalCenter configurables
window.Logistica = {
  plantas: {},
  zonas: {},
  paquetes: {},
  viajes: {},
  proyectos: {},
  usuarios: [],
  configLogistica: {},
  sugerenciasActuales: [],
  filters: { paquetes: "", estado: "Pendiente" },
  plantFilters: { search: "", estado: "activas" },
  selectedPlantaKey: "",
  realtimeActivo: false,
  listeners: [],

  els: {},

  async init() {
    this.cacheEls();
    this.bindEvents();
    window.Auth.logout();
    this.showLogin();
  },

  cacheEls() {
    const ids = [
      "loginView", "mainView", "loginMessage", "loginUsuario", "loginPassword", "btnLogin", "btnLogout", "btnReload",
      "sessionBadge", "kpiPendientes", "kpiUrgentes", "kpiViajes", "kpiEntregados",
      "paqueteProyectoSearch", "paqueteProyectoKey", "paqueteProyectoResults", "paqueteProyectoSeleccionado", "paqueteEditId", "paqueteFormTitle",
      "paquetePlanta", "paquetePlantaInfo", "paqueteTipo", "paquetePrioridad",
      "paqueteFechaLimite", "paqueteObservaciones", "btnCrearPaquete", "btnCancelarEdicionPaquete", "paqueteMessage",
      "filterPaquetes", "filterEstadoPaquete", "paquetesTableBody", "viajesTableBody", "oportunidadesContainer",
      "btnDetectarOportunidades", "viajeFecha", "viajeHora", "viajeUsuario", "viajePlanta", "viajePlantaInfo",
      "viajeObservaciones", "btnCrearViaje", "viajeMessage", "sugerenciasTableBody",
      "modalEntrega", "btnCerrarEntrega", "entregaPaqueteId", "entregaEntregadoPor", "entregaRecibidoPor",
      "entregaObservaciones", "btnConfirmarEntrega", "entregaMessage",
      "plantasTableBody", "filterPlantas", "filterPlantasEstado", "btnNuevaPlanta", "btnExtraerTodasCoords", "plantasMessage",
      "origenNombre", "origenCoords", "btnRutaOrigenMaps", "modalPlanta", "modalPlantaTitle", "btnCerrarPlanta", "plantaEditKey",
      "plantaCliente", "plantaNombre", "plantaDireccion", "plantaCP", "plantaMapsUrl", "btnExtraerCoordsPlanta", "btnAbrirMapsPlanta", "btnRutaPlantaOrigen",
      "plantaZonaReadonly", "plantaSubzonaReadonly", "plantaGrupoReadonly", "plantaLat", "plantaLng", "plantaCoordValidada", "plantaContacto",
      "plantaHorario", "plantaRequiereCita", "plantaObsAcceso", "plantaObservaciones", "plantaActivo", "btnGuardarPlanta", "plantaMessage",
      "cfgCalCenterActivo", "cfgNotifCreacionPaquete", "cfgNotifAsignacionViaje", "cfgNotifEntregaPaquete", "cfgNotifNoEntregado",
      "btnGuardarConfigNotificaciones", "configNotificacionesMessage"
    ];
    ids.forEach((id) => this.els[id] = document.getElementById(id));
  },

  bindEvents() {
    if (this.els.btnLogin) this.els.btnLogin.addEventListener("click", () => this.handleLogin());
    if (this.els.btnLogout) this.els.btnLogout.addEventListener("click", () => this.handleLogout());
    if (this.els.btnReload) this.els.btnReload.addEventListener("click", () => this.recargarManual());
    if (this.els.btnCrearPaquete) this.els.btnCrearPaquete.addEventListener("click", () => this.crearPaquete());
    if (this.els.btnCancelarEdicionPaquete) this.els.btnCancelarEdicionPaquete.addEventListener("click", () => this.cancelarEdicionPaquete());
    if (this.els.paquetePlanta) this.els.paquetePlanta.addEventListener("change", () => this.renderPlantaInfo("paquete"));
    if (this.els.paqueteProyectoSearch) {
      this.els.paqueteProyectoSearch.addEventListener("input", () => this.renderProyectoResultados());
      this.els.paqueteProyectoSearch.addEventListener("focus", () => this.renderProyectoResultados());
      this.els.paqueteProyectoSearch.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.ocultarProyectoResultados();
      });
    }
    document.addEventListener("click", (e) => {
      const box = this.els.paqueteProyectoResults;
      const input = this.els.paqueteProyectoSearch;
      if (!box || !input) return;
      if (e.target !== input && !box.contains(e.target)) this.ocultarProyectoResultados();
    });
    if (this.els.viajePlanta) this.els.viajePlanta.addEventListener("change", () => {
      this.renderPlantaInfo("viaje");
      this.calcularSugerencias();
    });
    if (this.els.btnCrearViaje) this.els.btnCrearViaje.addEventListener("click", () => this.crearViaje());
    if (this.els.btnDetectarOportunidades) this.els.btnDetectarOportunidades.addEventListener("click", async () => this.detectarYRenderOportunidades(true));
    if (this.els.btnCerrarEntrega) this.els.btnCerrarEntrega.addEventListener("click", () => this.closeEntregaModal());
    if (this.els.btnConfirmarEntrega) this.els.btnConfirmarEntrega.addEventListener("click", () => this.confirmarEntrega());

    if (this.els.filterPaquetes) this.els.filterPaquetes.addEventListener("input", () => {
      this.filters.paquetes = this.els.filterPaquetes.value || "";
      this.renderPaquetes();
    });
    if (this.els.filterEstadoPaquete) this.els.filterEstadoPaquete.addEventListener("change", () => {
      this.filters.estado = this.els.filterEstadoPaquete.value || "";
      this.renderPaquetes();
    });

    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => this.activateTab(btn.dataset.tab));
    });


    if (this.els.filterPlantas) this.els.filterPlantas.addEventListener("input", () => {
      this.plantFilters.search = this.els.filterPlantas.value || "";
      this.renderPlantasMantenimiento();
    });
    if (this.els.filterPlantasEstado) this.els.filterPlantasEstado.addEventListener("change", () => {
      this.plantFilters.estado = this.els.filterPlantasEstado.value || "activas";
      this.renderPlantasMantenimiento();
    });
    if (this.els.btnNuevaPlanta) this.els.btnNuevaPlanta.addEventListener("click", () => this.openPlantaModal());
    if (this.els.btnCerrarPlanta) this.els.btnCerrarPlanta.addEventListener("click", () => this.closePlantaModal());
    if (this.els.btnGuardarPlanta) this.els.btnGuardarPlanta.addEventListener("click", () => this.guardarPlanta());
    if (this.els.btnExtraerCoordsPlanta) this.els.btnExtraerCoordsPlanta.addEventListener("click", () => this.extraerCoordsPlantaModal());
    if (this.els.btnAbrirMapsPlanta) this.els.btnAbrirMapsPlanta.addEventListener("click", () => this.abrirMapsPlantaModal());
    if (this.els.btnRutaPlantaOrigen) this.els.btnRutaPlantaOrigen.addEventListener("click", () => this.abrirRutaPlantaOrigenModal());
    if (this.els.btnExtraerTodasCoords) this.els.btnExtraerTodasCoords.addEventListener("click", () => this.extraerTodasCoordsDesdeUrls());
    if (this.els.btnRutaOrigenMaps) this.els.btnRutaOrigenMaps.addEventListener("click", () => this.abrirOrigenMaps());
    if (this.els.btnGuardarConfigNotificaciones) this.els.btnGuardarConfigNotificaciones.addEventListener("click", () => this.guardarConfigNotificaciones());

    if (this.els.modalEntrega) {
      this.els.modalEntrega.addEventListener("click", (e) => {
        if (e.target === this.els.modalEntrega) this.closeEntregaModal();
      });
    }
    if (this.els.modalPlanta) {
      this.els.modalPlanta.addEventListener("click", (e) => {
        if (e.target === this.els.modalPlanta) this.closePlantaModal();
      });
    }
  },

  activateTab(tabId) {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === tabId));
    document.querySelectorAll(".tab-panel").forEach((x) => x.classList.toggle("active", x.id === tabId));
  },

  showLogin() {
    this.els.loginView?.classList.add("active");
    this.els.mainView?.classList.remove("active");
  },

  showMain() {
  this.els.loginView?.classList.remove("active");
  this.els.mainView?.classList.add("active");

  const user = window.Auth.currentUser;
  const esAdmin = !!user?.administrador;

  if (this.els.sessionBadge) {
    this.els.sessionBadge.textContent = `${user?.nombre || user?.usuario || ""}${esAdmin ? " · Admin" : ""}`;
  }

  document.querySelectorAll(".admin-only").forEach((el) => {
    el.classList.toggle("hidden", !esAdmin);
    el.style.display = esAdmin ? "" : "none";
  });
},

  setMessage(el, text, type = "") {
    if (!el) return;
    el.textContent = text || "";
    el.className = `message ${type}`.trim();
  },

  async handleLogin() {
    this.setMessage(this.els.loginMessage, "", "");
    try {
      await window.Auth.login(this.els.loginUsuario.value, this.els.loginPassword.value);
      this.showMain();
      await this.cargarSistema();
    } catch (err) {
      console.error(err);
      this.setMessage(this.els.loginMessage, err.message || "No fue posible iniciar sesión.", "error");
    }
  },

  handleLogout() {
    this.detenerListenersRealtime();
    window.Auth.logout();
    this.plantas = {};
    this.zonas = {};
    this.paquetes = {};
    this.viajes = {};
    this.proyectos = {};
    this.usuarios = [];
    this.configLogistica = {};
    this.sugerenciasActuales = [];
    if (this.els.loginPassword) this.els.loginPassword.value = "";
    this.showLogin();
  },

  async cargarSistema() {
    try {
      await Promise.all([
        this.cargarPlantas(),
        this.cargarZonas(),
        this.cargarConfigLogistica(),
        this.cargarProyectos(),
        this.cargarUsuarios(),
        this.cargarPaquetes(),
        this.cargarViajes()
      ]);
      await this.asegurarConfigLogistica();
      this.renderSelects();
      this.renderAll();
      this.iniciarListenersRealtime();
      this.setMessage(this.els.viajeMessage, "Sistema actualizado.", "success");
      setTimeout(() => this.setMessage(this.els.viajeMessage, "", ""), 1800);
    } catch (err) {
      console.error(err);
      alert("Error al cargar logística: " + (err.message || err));
    }
  },


  async recargarManual() {
    try {
      if (this.els.btnReload) this.els.btnReload.disabled = true;
      await Promise.all([
        this.cargarPlantas(),
        this.cargarZonas(),
        this.cargarConfigLogistica(),
        this.cargarProyectos(),
        this.cargarUsuarios(),
        this.cargarPaquetes(),
        this.cargarViajes()
      ]);
      this.renderSelects();
      this.renderAll();
      this.setMessage(this.els.viajeMessage, "Información actualizada.", "success");
      setTimeout(() => this.setMessage(this.els.viajeMessage, "", ""), 1500);
    } catch (err) {
      console.error(err);
      alert("No fue posible actualizar: " + (err.message || err));
    } finally {
      if (this.els.btnReload) this.els.btnReload.disabled = false;
    }
  },

  iniciarListenersRealtime() {
    if (this.realtimeActivo) return;
    this.realtimeActivo = true;

    const paquetesRef = window.database.ref("paquetes");
    const viajesRef = window.database.ref("viajes");
    const plantasRef = window.database.ref("plantas");
    const configRef = window.database.ref("config_logistica");

    const onPaquetes = (snap) => {
      this.paquetes = snap.val() || {};
      this.renderAll();
    };

    const onViajes = (snap) => {
      this.viajes = snap.val() || {};
      this.renderAll();
    };

    const onPlantas = (snap) => {
      this.plantas = snap.val() || {};
      this.renderSelects();
      this.renderAll();
    };

    const onConfig = (snap) => {
      this.configLogistica = snap.val() || {};
      this.renderOrigenInfo();
      this.renderConfigNotificaciones();
    };

    paquetesRef.on("value", onPaquetes);
    viajesRef.on("value", onViajes);
    plantasRef.on("value", onPlantas);
    configRef.on("value", onConfig);

    this.listeners.push({ ref: paquetesRef, event: "value", handler: onPaquetes });
    this.listeners.push({ ref: viajesRef, event: "value", handler: onViajes });
    this.listeners.push({ ref: plantasRef, event: "value", handler: onPlantas });
    this.listeners.push({ ref: configRef, event: "value", handler: onConfig });
  },

  detenerListenersRealtime() {
    this.listeners.forEach((x) => x.ref.off(x.event, x.handler));
    this.listeners = [];
    this.realtimeActivo = false;
  },

  async cargarPlantas() {
    const snap = await window.database.ref("plantas").once("value");
    this.plantas = snap.val() || {};
  },

  async cargarZonas() {
    const snap = await window.database.ref("zonas_logisticas").once("value");
    this.zonas = snap.val() || {};
  },

  async cargarConfigLogistica() {
    const snap = await window.database.ref("config_logistica").once("value");
    this.configLogistica = snap.val() || {};
  },

  async asegurarConfigLogistica() {
    const updates = {};
    const punto = this.getPuntoSalida();
    if (!this.configLogistica.punto_salida) {
      this.configLogistica.punto_salida = punto;
      updates["punto_salida"] = punto;
    }

    const notificaciones = this.getConfigNotificaciones();
    if (!this.configLogistica.notificaciones) {
      this.configLogistica.notificaciones = notificaciones;
      updates["notificaciones"] = notificaciones;
    }

    if (Object.keys(updates).length) {
      await window.database.ref("config_logistica").update(updates);
    }

    this.renderOrigenInfo();
    this.renderConfigNotificaciones();
  },

  getPuntoSalida() {
    const actual = this.configLogistica?.punto_salida || {};
    return {
      nombre: actual.nombre || "Origen Oficina",
      direccion: actual.direccion || "Origen Oficina",
      lat: this.toNumberOrDefault(actual.lat, 20.622975),
      lng: this.toNumberOrDefault(actual.lng, -100.392190),
      google_maps_url: actual.google_maps_url || "",
      coordenada_validada: actual.coordenada_validada !== false,
      activo: actual.activo !== false
    };
  },

  getConfigNotificaciones() {
    const actual = this.configLogistica?.notificaciones || {};
    return {
      calcenter_activo: actual.calcenter_activo !== false,
      notificar_creacion_paquete: actual.notificar_creacion_paquete === true,
      notificar_asignacion_viaje: actual.notificar_asignacion_viaje !== false,
      notificar_entrega_paquete: actual.notificar_entrega_paquete === true,
      notificar_no_entregado: actual.notificar_no_entregado !== false
    };
  },

  renderConfigNotificaciones() {
    const cfg = this.getConfigNotificaciones();
    const setChecked = (el, value) => { if (el) el.checked = !!value; };
    setChecked(this.els.cfgCalCenterActivo, cfg.calcenter_activo);
    setChecked(this.els.cfgNotifCreacionPaquete, cfg.notificar_creacion_paquete);
    setChecked(this.els.cfgNotifAsignacionViaje, cfg.notificar_asignacion_viaje);
    setChecked(this.els.cfgNotifEntregaPaquete, cfg.notificar_entrega_paquete);
    setChecked(this.els.cfgNotifNoEntregado, cfg.notificar_no_entregado);
  },

  async guardarConfigNotificaciones() {
    if (!window.Auth.currentUser?.administrador) {
      this.setMessage(this.els.configNotificacionesMessage, "Solo un administrador puede modificar esta configuración.", "error");
      return;
    }

    const cfg = {
      calcenter_activo: !!this.els.cfgCalCenterActivo?.checked,
      notificar_creacion_paquete: !!this.els.cfgNotifCreacionPaquete?.checked,
      notificar_asignacion_viaje: !!this.els.cfgNotifAsignacionViaje?.checked,
      notificar_entrega_paquete: !!this.els.cfgNotifEntregaPaquete?.checked,
      notificar_no_entregado: !!this.els.cfgNotifNoEntregado?.checked
    };

    try {
      await window.database.ref("config_logistica/notificaciones").set(cfg);
      this.configLogistica.notificaciones = cfg;
      this.renderConfigNotificaciones();
      this.setMessage(this.els.configNotificacionesMessage, "Configuración de notificaciones guardada.", "success");
    } catch (err) {
      console.error(err);
      this.setMessage(this.els.configNotificacionesMessage, err.message || "No fue posible guardar la configuración.", "error");
    }
  },

  debeNotificarCalCenter(evento) {
    const cfg = this.getConfigNotificaciones();
    if (!cfg.calcenter_activo) return false;
    const mapa = {
      creacion_paquete: cfg.notificar_creacion_paquete,
      asignacion_viaje: cfg.notificar_asignacion_viaje,
      entrega_paquete: cfg.notificar_entrega_paquete,
      no_entregado: cfg.notificar_no_entregado
    };
    return mapa[evento] === true;
  },

  renderOrigenInfo() {
    const punto = this.getPuntoSalida();
    if (this.els.origenNombre) this.els.origenNombre.textContent = punto.nombre;
    if (this.els.origenCoords) this.els.origenCoords.textContent = `${punto.lat}, ${punto.lng}`;
  },

  async cargarPaquetes() {
    const snap = await window.database.ref("paquetes").once("value");
    this.paquetes = snap.val() || {};
  },

  async cargarViajes() {
    const snap = await window.database.ref("viajes").once("value");
    this.viajes = snap.val() || {};
  },

  async cargarProyectos() {
    const snap = await window.database.ref("Registros").once("value");
    const data = snap.val() || {};
    this.proyectos = {};
    Object.keys(data).forEach((key) => {
      const raw = data[key] || {};
      const normalizado = window.Utils.normalizarRegistro(key, raw);
      this.proyectos[key] = normalizado;
    });
  },

  async cargarUsuarios() {
    const snap = await window.database.ref("Usuarios").once("value");
    const data = snap.val() || {};
    this.usuarios = Object.keys(data)
      .map((key) => data[key] || {})
      .filter((u) => u.status === true || String(u.status).toLowerCase() === "true")
      .map((u) => window.Utils.normalizarTexto(u.Nombre))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  },

  renderAll() {
    this.renderKPIs();
    this.renderPaquetes();
    this.renderViajes();
    this.renderPlantasMantenimiento();
    this.renderOrigenInfo();
    this.renderConfigNotificaciones();
    this.detectarYRenderOportunidades(false);
    this.calcularSugerencias();
  },

  renderSelects() {
    if (this.els.filterEstadoPaquete) this.els.filterEstadoPaquete.value = this.filters.estado || "Pendiente";
    this.renderProyectoSelect();
    this.renderPlantaSelect(this.els.paquetePlanta);
    this.renderPlantaSelect(this.els.viajePlanta);
    this.renderUsuarioSelect();
    this.renderPlantaInfo("paquete");
    this.renderPlantaInfo("viaje");
    if (this.els.viajeFecha && !this.els.viajeFecha.value) this.els.viajeFecha.value = this.getTodayISO();
  },

  renderProyectoSelect() {
    this.limpiarProyectoSeleccionado(false);
  },

  getProyectosOrdenados() {
    return Object.values(this.proyectos)
      .sort((a, b) => Number(b.ID || 0) - Number(a.ID || 0));
  },

  proyectoLabel(p) {
    return `${p.ID || ""} · ${p.Cliente || ""} · ${p.Proyecto || ""}${p.PO ? " · PO " + p.PO : ""}`;
  },

  renderProyectoResultados() {
    const input = this.els.paqueteProyectoSearch;
    const box = this.els.paqueteProyectoResults;
    if (!input || !box) return;

    const txt = window.Utils.normalizarTexto(input.value).toLowerCase();
    if (!txt) {
      box.innerHTML = `<button type="button" class="search-result muted" data-clear="1">Sin proyecto relacionado</button>`;
      box.classList.remove("hidden");
      box.querySelector("[data-clear]").addEventListener("click", () => this.limpiarProyectoSeleccionado());
      return;
    }

    const resultados = this.getProyectosOrdenados()
      .filter((p) => {
        const cadena = `${p.ID || ""} ${p.Proyecto || ""} ${p.Cliente || ""} ${p.PO || ""} ${p.Nombre || ""}`.toLowerCase();
        return cadena.includes(txt);
      })
      .slice(0, 12);

    if (!resultados.length) {
      box.innerHTML = `<div class="search-empty">No se encontraron proyectos.</div>`;
      box.classList.remove("hidden");
      return;
    }

    box.innerHTML = resultados.map((p) => `
      <button type="button" class="search-result" data-key="${window.Utils.escapeHtml(p._firebaseKey)}">
        <strong>${window.Utils.escapeHtml(String(p.ID || ""))}</strong>
        <span>${window.Utils.escapeHtml(p.Proyecto || "Sin proyecto")}</span>
        <small>${window.Utils.escapeHtml(p.Cliente || "Sin cliente")}${p.PO ? " · PO " + window.Utils.escapeHtml(p.PO) : ""}</small>
      </button>
    `).join("");

    box.querySelectorAll("[data-key]").forEach((btn) => {
      btn.addEventListener("click", () => this.seleccionarProyectoPaquete(btn.dataset.key));
    });
    box.classList.remove("hidden");
  },

  seleccionarProyectoPaquete(key) {
    const proyecto = this.proyectos[key];
    if (!proyecto) return;
    if (this.els.paqueteProyectoKey) this.els.paqueteProyectoKey.value = key;
    if (this.els.paqueteProyectoSearch) this.els.paqueteProyectoSearch.value = this.proyectoLabel(proyecto);
    if (this.els.paqueteProyectoSeleccionado) {
      this.els.paqueteProyectoSeleccionado.innerHTML = `Seleccionado: <strong>${window.Utils.escapeHtml(String(proyecto.ID || ""))}</strong> · ${window.Utils.escapeHtml(proyecto.Proyecto || "")} · ${window.Utils.escapeHtml(proyecto.Cliente || "")}`;
    }
    this.ocultarProyectoResultados();
  },

  limpiarProyectoSeleccionado(clearText = true) {
    if (this.els.paqueteProyectoKey) this.els.paqueteProyectoKey.value = "";
    if (clearText && this.els.paqueteProyectoSearch) this.els.paqueteProyectoSearch.value = "";
    if (this.els.paqueteProyectoSeleccionado) this.els.paqueteProyectoSeleccionado.textContent = "Sin proyecto relacionado.";
    this.ocultarProyectoResultados();
  },

  ocultarProyectoResultados() {
    if (this.els.paqueteProyectoResults) this.els.paqueteProyectoResults.classList.add("hidden");
  },

  renderPlantaSelect(sel) {
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = `<option value="">Selecciona planta</option>`;
    const plantas = Object.values(this.plantas)
      .filter((p) => p.activo !== false)
      .sort((a, b) => `${a.cliente || ""} ${a.planta || ""}`.localeCompare(`${b.cliente || ""} ${b.planta || ""}`));
    plantas.forEach((p) => {
      const id = p.planta_id || this.getPlantaKeyByObject(p);
      const label = `${p.cliente || ""} · ${p.planta || ""} · ${p.zona_logistica || "Sin zona"}`;
      sel.innerHTML += `<option value="${window.Utils.escapeHtml(id)}">${window.Utils.escapeHtml(label)}</option>`;
    });
    sel.value = current;
  },

  renderUsuarioSelect() {
    const sel = this.els.viajeUsuario;
    if (!sel) return;
    const actual = window.Auth.currentUser?.usuario || "";
    sel.innerHTML = "";
    const usuarios = this.usuarios.length ? this.usuarios : [actual].filter(Boolean);
    usuarios.forEach((u) => {
      sel.innerHTML += `<option value="${window.Utils.escapeHtml(u)}">${window.Utils.escapeHtml(u)}</option>`;
    });
    if (actual) sel.value = actual;
  },

  renderPlantaInfo(tipo) {
    const sel = tipo === "paquete" ? this.els.paquetePlanta : this.els.viajePlanta;
    const box = tipo === "paquete" ? this.els.paquetePlantaInfo : this.els.viajePlantaInfo;
    if (!sel || !box) return;
    const planta = this.getPlanta(sel.value);
    if (!planta) {
      box.textContent = "Selecciona una planta.";
      return;
    }
    const coords = this.getCoordsPlanta(planta);
    const maps = planta.google_maps_url ? `<br><a href="${window.Utils.escapeHtml(planta.google_maps_url)}" target="_blank" rel="noopener noreferrer">Abrir ubicación en Maps</a>` : "";
    const ruta = coords ? `<br><a href="${window.Utils.escapeHtml(this.crearUrlRuta([coords]))}" target="_blank" rel="noopener noreferrer">Ruta desde Origen Oficina</a>` : "";
    box.innerHTML = `
      <strong>${window.Utils.escapeHtml(planta.cliente || "")}</strong><br>
      ${window.Utils.escapeHtml(planta.planta || "")}<br>
      ${window.Utils.escapeHtml(planta.direccion || "Sin dirección")}<br>
      <span>Zona: ${window.Utils.escapeHtml(planta.zona_logistica || "Sin zona")}</span><br>
      <span>Grupo ruta: ${window.Utils.escapeHtml(planta.grupo_ruta || "Sin grupo")}</span><br>
      <span>Coordenadas: ${coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Pendientes"}</span>${maps}${ruta}
    `;
  },

  getPlanta(plantaId) {
    if (!plantaId) return null;
    return this.plantas[plantaId] || Object.values(this.plantas).find((p) => p.planta_id === plantaId) || null;
  },

  getPlantaKeyByObject(obj) {
    for (const key of Object.keys(this.plantas)) {
      if (this.plantas[key] === obj) return key;
    }
    return obj?.planta_id || "";
  },

  getTodayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  },

  isEditingPaquete() {
    return !!window.Utils.normalizarTexto(this.els.paqueteEditId?.value);
  },

  setPaqueteFormMode(mode = "create") {
    const editing = mode === "edit";
    if (this.els.paqueteFormTitle) this.els.paqueteFormTitle.textContent = editing ? "Editar paquete" : "Nuevo paquete";
    if (this.els.btnCrearPaquete) this.els.btnCrearPaquete.textContent = editing ? "Guardar cambios" : "Crear paquete";
    if (this.els.btnCancelarEdicionPaquete) this.els.btnCancelarEdicionPaquete.classList.toggle("hidden", !editing);
  },

  cancelarEdicionPaquete() {
    this.clearPaqueteForm();
    this.setMessage(this.els.paqueteMessage, "Edición cancelada.", "");
  },

  editarPaquete(id) {
    const p = this.paquetes[id];
    if (!p) return;
    if (p.estado !== "Pendiente") {
      this.setMessage(this.els.paqueteMessage, "Solo se pueden editar paquetes pendientes.", "error");
      return;
    }

    if (this.els.paqueteEditId) this.els.paqueteEditId.value = p.paquete_id || id;
    if (this.els.paqueteProyectoKey) this.els.paqueteProyectoKey.value = p.proyecto_key || "";

    const proyecto = p.proyecto_key ? this.proyectos[p.proyecto_key] : null;
    if (proyecto) {
      if (this.els.paqueteProyectoSearch) this.els.paqueteProyectoSearch.value = this.proyectoLabel(proyecto);
      if (this.els.paqueteProyectoSeleccionado) {
        this.els.paqueteProyectoSeleccionado.innerHTML = `Seleccionado: <strong>${window.Utils.escapeHtml(String(proyecto.ID || ""))}</strong> · ${window.Utils.escapeHtml(proyecto.Proyecto || "")} · ${window.Utils.escapeHtml(proyecto.Cliente || "")}`;
      }
    } else {
      if (this.els.paqueteProyectoSearch) this.els.paqueteProyectoSearch.value = "";
      if (this.els.paqueteProyectoSeleccionado) this.els.paqueteProyectoSeleccionado.textContent = "Sin proyecto relacionado.";
    }

    if (this.els.paquetePlanta) this.els.paquetePlanta.value = p.planta_id || "";
    if (this.els.paqueteTipo) this.els.paqueteTipo.value = p.tipo_paquete || "Documentos";
    if (this.els.paquetePrioridad) this.els.paquetePrioridad.value = p.prioridad || "Normal";
    if (this.els.paqueteFechaLimite) this.els.paqueteFechaLimite.value = p.fecha_limite || "";
    if (this.els.paqueteObservaciones) this.els.paqueteObservaciones.value = p.observaciones || "";
    this.renderPlantaInfo("paquete");
    this.setPaqueteFormMode("edit");
    this.activateTab("paquetesTab");
    this.setMessage(this.els.paqueteMessage, `Editando paquete ${p.paquete_id}.`, "success");
  },

  async crearPaquete() {
    this.setMessage(this.els.paqueteMessage, "", "");
    try {
      const planta = this.getPlanta(this.els.paquetePlanta.value);
      if (!planta) throw new Error("Debes seleccionar la planta destino.");

      const proyectoKey = this.els.paqueteProyectoKey?.value || "";
      const proyecto = this.proyectos[proyectoKey] || null;
      const usuario = window.Auth.currentUser?.usuario || "sistema";
      const editId = window.Utils.normalizarTexto(this.els.paqueteEditId?.value);
      const baseId = editId || `PKT_${Date.now()}`;
      const existente = editId ? (this.paquetes[editId] || null) : null;

      if (editId && !existente) {
        throw new Error("No se encontró el paquete a editar.");
      }
      if (existente && existente.estado !== "Pendiente") {
        throw new Error("Solo se pueden editar paquetes pendientes.");
      }

      const payload = {
        paquete_id: baseId,
        proyecto_key: proyecto?._firebaseKey || "",
        proyecto_id: proyecto?.ID || "",
        proyecto_nombre: proyecto?.Proyecto || "",
        cliente: planta.cliente || proyecto?.Cliente || "",
        planta_id: planta.planta_id || this.els.paquetePlanta.value,
        planta: planta.planta || "",
        direccion: planta.direccion || "",
        zona_logistica: planta.zona_logistica || "",
        grupo_ruta: planta.grupo_ruta || "",
        tipo_paquete: this.els.paqueteTipo.value || "Documentos",
        prioridad: this.els.paquetePrioridad.value || "Normal",
        fecha_limite: this.els.paqueteFechaLimite.value || "",
        estado: existente?.estado || "Pendiente",
        responsable: proyecto?.Nombre || existente?.responsable || usuario,
        creado_por: existente?.creado_por || usuario,
        creado_en: existente?.creado_en || Date.now(),
        viaje_id: existente?.viaje_id || "",
        observaciones: window.Utils.normalizarTexto(this.els.paqueteObservaciones.value),
        evidencia_url: existente?.evidencia_url || "",
        recibido_por: existente?.recibido_por || "",
        fecha_entrega: existente?.fecha_entrega || "",
        entregado_por: existente?.entregado_por || ""
      };

      await window.database.ref(`paquetes/${baseId}`).set(payload);
      await this.cargarPaquetes();

      if (payload.proyecto_key) {
        const textoHistorial = editId
          ? `Se editó el paquete de entrega ${baseId} para ${payload.cliente} / ${payload.planta}.`
          : `Se creó paquete de entrega ${baseId} para ${payload.cliente} / ${payload.planta}.`;
        await this.agregarHistorialProyecto(payload.proyecto_key, textoHistorial);
      }

      if (!editId && this.debeNotificarCalCenter("creacion_paquete")) {
        await this.enviarMensajeCalCenter(payload.responsable || usuario, this.construirMensajePaqueteCreado(payload));
      }

      this.clearPaqueteForm();
      await this.cargarPaquetes();
      this.renderAll();
      this.activateTab("paquetesTab");
      this.setMessage(this.els.paqueteMessage, editId ? "Paquete actualizado correctamente." : "Paquete creado correctamente.", "success");
    } catch (err) {
      console.error(err);
      this.setMessage(this.els.paqueteMessage, err.message || "No fue posible guardar el paquete.", "error");
    }
  },

  clearPaqueteForm() {
    this.limpiarProyectoSeleccionado();
    if (this.els.paqueteEditId) this.els.paqueteEditId.value = "";
    if (this.els.paquetePlanta) this.els.paquetePlanta.value = "";
    if (this.els.paqueteTipo) this.els.paqueteTipo.value = "Documentos";
    if (this.els.paquetePrioridad) this.els.paquetePrioridad.value = "Normal";
    if (this.els.paqueteFechaLimite) this.els.paqueteFechaLimite.value = "";
    if (this.els.paqueteObservaciones) this.els.paqueteObservaciones.value = "";
    this.renderPlantaInfo("paquete");
    this.setPaqueteFormMode("create");
  },

  normalizarEstadoPaquete(valor) {
    return window.Utils.normalizarTexto(valor).toLowerCase();
  },

renderKPIs() {
  const paquetes = Object.values(this.paquetes);
  const viajes = Object.values(this.viajes);
  const set = (el, v) => { if (el) el.textContent = v; };

  set(
    this.els.kpiPendientes,
    paquetes.filter((p) => this.normalizarEstadoPaquete(p.estado) === "pendiente").length
  );

  set(
    this.els.kpiUrgentes,
    paquetes.filter((p) => {
      const estado = this.normalizarEstadoPaquete(p.estado);
      const prioridad = window.Utils.normalizarTexto(p.prioridad);
      return ["Urgente", "Alta"].includes(prioridad) && estado !== "entregado" && estado !== "cancelado";
    }).length
  );

  set(
    this.els.kpiViajes,
    viajes.filter((v) => ["Programado", "En ruta", "Propuesto"].includes(window.Utils.normalizarTexto(v.estado))).length
  );

  set(
    this.els.kpiEntregados,
    paquetes.filter((p) => this.normalizarEstadoPaquete(p.estado) === "entregado").length
  );
},

renderPaquetes() {
    const body = this.els.paquetesTableBody;
    if (!body) return;
    body.innerHTML = "";
    const txt = window.Utils.normalizarTexto(this.filters.paquetes).toLowerCase();
    const estado = window.Utils.normalizarTexto(this.filters.estado).toLowerCase();

    const rows = Object.values(this.paquetes)
      .filter((p) => {
        const cadena = `${p.paquete_id} ${p.proyecto_id} ${p.proyecto_nombre} ${p.cliente} ${p.planta} ${p.zona_logistica}`.toLowerCase();
        const okTxt = !txt || cadena.includes(txt);

        const estadoPaquete = this.normalizarEstadoPaquete(p.estado);

        let okEstado = true;
        if (estado === "pendiente") {
          okEstado = estadoPaquete === "pendiente";
        } else if (estado === "entregado") {
          okEstado = estadoPaquete === "entregado";
        } else if (estado === "cancelado") {
          okEstado = estadoPaquete === "cancelado";
        } else if (estado === "todos" || !estado) {
          okEstado = true;
        }

        return okTxt && okEstado;
      })
      .sort((a, b) => Number(b.creado_en || 0) - Number(a.creado_en || 0));

    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="7" class="small-muted">No hay paquetes con los filtros actuales.</td></tr>`;
      return;
    }

    rows.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${window.Utils.escapeHtml(p.paquete_id || "")}</strong><div class="small-muted">${this.formatMs(p.creado_en)}</div></td>
        <td>${window.Utils.escapeHtml(p.proyecto_id || "Sin proyecto")}<div class="small-muted">${window.Utils.escapeHtml(p.proyecto_nombre || "")}</div></td>
        <td>${window.Utils.escapeHtml(p.cliente || "")}<div class="small-muted">${window.Utils.escapeHtml(p.planta || "")}</div></td>
        <td>${window.Utils.escapeHtml(p.zona_logistica || "Sin zona")}<div class="small-muted">${window.Utils.escapeHtml(p.grupo_ruta || "")}</div></td>
        <td><span class="priority-${window.Utils.escapeHtml(p.prioridad || "Normal")}">${window.Utils.escapeHtml(p.prioridad || "Normal")}</span><div class="small-muted">Límite: ${window.Utils.escapeHtml(p.fecha_limite || "—")}</div></td>
        <td>${this.statusBadgePaquete(p.estado)}</td>
        <td><div class="row-actions">${this.renderAccionesPaquete(p)}</div></td>
      `;
      body.appendChild(tr);
    });

    body.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => this.handlePaqueteAction(btn.dataset.action, btn.dataset.id));
    });
  },

  renderAccionesPaquete(p) {
    const id = window.Utils.escapeHtml(p.paquete_id || "");
    const actions = [];
    if (["Pendiente", "Asignado a viaje", "En ruta"].includes(p.estado)) {
      actions.push(`<button class="btn ghost" data-action="entregar" data-id="${id}">Entregar</button>`);
    }
    if (p.estado === "Pendiente") {
      actions.push(`<button class="btn ghost" data-action="editar" data-id="${id}">Editar</button>`);
      actions.push(`<button class="btn danger-outline" data-action="cancelar" data-id="${id}">Cancelar</button>`);
    }
    const planta = this.getPlanta(p.planta_id);
    if (planta?.google_maps_url || this.getCoordsPlanta(planta)) {
      actions.push(`<button class="btn ghost" data-action="maps" data-id="${id}">Mapa</button>`);
      actions.push(`<button class="btn ghost" data-action="ruta-origen" data-id="${id}">Ruta</button>`);
    }
    return actions.join("") || `<span class="small-muted">Sin acciones</span>`;
  },

  async handlePaqueteAction(action, id) {
    const p = this.paquetes[id];
    if (!p) return;
    if (action === "entregar") return this.openEntregaModal(id);
    if (action === "editar") return this.editarPaquete(id);
    if (action === "cancelar") return this.cancelarPaquete(id);
    if (action === "maps") {
      const planta = this.getPlanta(p.planta_id);
      const url = planta?.google_maps_url || this.crearUrlMapsPlanta(planta);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
    if (action === "ruta-origen") {
      const planta = this.getPlanta(p.planta_id);
      this.abrirRutaAPlanta(planta);
    }
  },

  async cancelarPaquete(id) {
    const confirmar = window.confirm(`¿Cancelar el paquete ${id}?`);
    if (!confirmar) return;
    const p = this.paquetes[id];
    await window.database.ref(`paquetes/${id}`).update({ estado: "Cancelado", cancelado_en: Date.now(), cancelado_por: window.Auth.currentUser?.usuario || "" });
    this.paquetes[id].estado = "Cancelado";
    if (p.proyecto_key) await this.agregarHistorialProyecto(p.proyecto_key, `Se canceló el paquete de entrega ${id}.`);
    this.renderAll();
  },

statusBadgePaquete(estado = "Pendiente") {
  const estadoLimpio = this.normalizarEstadoPaquete(estado);

  const cls = {
    "pendiente": "status-pendiente",
    "asignado a viaje": "status-asignado",
    "en ruta": "status-ruta",
    "entregado": "status-entregado",
    "no entregado": "status-cancelado",
    "cancelado": "status-cancelado"
  }[estadoLimpio] || "status-pendiente";

  return `<span class="status ${cls}">${window.Utils.escapeHtml(window.Utils.normalizarTexto(estado))}</span>`;
},

statusBadgeViaje(estado = "Programado") {
    const cls = {
      "Propuesto": "status-pendiente",
      "Programado": "status-asignado",
      "En ruta": "status-ruta",
      "Finalizado": "status-entregado",
      "Cancelado": "status-cancelado"
    }[estado] || "status-asignado";
    return `<span class="status ${cls}">${window.Utils.escapeHtml(estado)}</span>`;
  },

  renderViajes() {
    const body = this.els.viajesTableBody;
    if (!body) return;
    body.innerHTML = "";
    const rows = Object.values(this.viajes).sort((a, b) => `${b.fecha || ""} ${b.hora || ""}`.localeCompare(`${a.fecha || ""} ${a.hora || ""}`));
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="7" class="small-muted">Aún no hay viajes registrados.</td></tr>`;
      return;
    }
    rows.forEach((v) => {
      const count = Object.keys(v.paquetes_asignados || {}).length;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${window.Utils.escapeHtml(v.fecha || "")}</strong><div class="small-muted">${window.Utils.escapeHtml(v.hora || "")}</div></td>
        <td>${window.Utils.escapeHtml(v.usuario || "")}</td>
        <td>${window.Utils.escapeHtml(v.cliente || "")}<div class="small-muted">${window.Utils.escapeHtml(v.destino_principal || "")}</div></td>
        <td>${window.Utils.escapeHtml(v.zona_logistica || "")}</td>
        <td>${count}</td>
        <td>${this.statusBadgeViaje(v.estado)}</td>
        <td><div class="row-actions">${this.renderAccionesViaje(v)}</div></td>
      `;
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-viaje-action]").forEach((btn) => {
      btn.addEventListener("click", () => this.handleViajeAction(btn.dataset.viajeAction, btn.dataset.id));
    });
  },

  renderAccionesViaje(v) {
    const id = window.Utils.escapeHtml(v.viaje_id || "");
    const actions = [];
    actions.push(`<button class="btn ghost" data-viaje-action="maps" data-id="${id}">Ruta Maps</button>`);
    if (v.estado === "Programado") actions.push(`<button class="btn ghost" data-viaje-action="ruta" data-id="${id}">En ruta</button>`);
    if (["Programado", "En ruta"].includes(v.estado)) actions.push(`<button class="btn ghost" data-viaje-action="finalizar" data-id="${id}">Finalizar</button>`);
    if (!["Finalizado", "Cancelado"].includes(v.estado)) actions.push(`<button class="btn danger-outline" data-viaje-action="cancelar" data-id="${id}">Cancelar</button>`);
    return actions.join("") || `<span class="small-muted">Sin acciones</span>`;
  },

  async handleViajeAction(action, id) {
    const v = this.viajes[id];
    if (!v) return;
    if (action === "maps") {
      this.abrirRutaViaje(id);
      return;
    }
    if (action === "ruta") {
      await window.database.ref(`viajes/${id}`).update({ estado: "En ruta", iniciado_en: Date.now() });
      this.viajes[id].estado = "En ruta";
      await this.actualizarPaquetesDeViaje(id, "En ruta");
    }
    if (action === "finalizar") {
      await window.database.ref(`viajes/${id}`).update({ estado: "Finalizado", finalizado_en: Date.now() });
      this.viajes[id].estado = "Finalizado";
    }
    if (action === "cancelar") {
      const confirmar = window.confirm(`¿Cancelar el viaje ${id}? Los paquetes regresarán a Pendiente.`);
      if (!confirmar) return;
      await window.database.ref(`viajes/${id}`).update({ estado: "Cancelado", cancelado_en: Date.now() });
      this.viajes[id].estado = "Cancelado";
      const updates = {};
      Object.keys(v.paquetes_asignados || {}).forEach((pktId) => {
        updates[`paquetes/${pktId}/estado`] = "Pendiente";
        updates[`paquetes/${pktId}/viaje_id`] = "";
        if (this.paquetes[pktId]) {
          this.paquetes[pktId].estado = "Pendiente";
          this.paquetes[pktId].viaje_id = "";
        }
      });
      if (Object.keys(updates).length) await window.database.ref().update(updates);
    }
    this.renderAll();
  },

  async actualizarPaquetesDeViaje(viajeId, estado) {
    const v = this.viajes[viajeId];
    const updates = {};
    Object.keys(v?.paquetes_asignados || {}).forEach((pktId) => {
      updates[`paquetes/${pktId}/estado`] = estado;
      if (this.paquetes[pktId]) this.paquetes[pktId].estado = estado;
    });
    if (Object.keys(updates).length) await window.database.ref().update(updates);
  },

  calcularSugerencias() {
    const planta = this.getPlanta(this.els.viajePlanta?.value);
    const body = this.els.sugerenciasTableBody;
    this.sugerenciasActuales = [];
    if (!body) return [];
    body.innerHTML = "";

    if (!planta) {
      body.innerHTML = `<tr><td colspan="5" class="small-muted">Selecciona destino para calcular sugerencias.</td></tr>`;
      return [];
    }

    const viajeVirtual = {
      planta_id: planta.planta_id,
      zona_logistica: planta.zona_logistica,
      grupo_ruta: planta.grupo_ruta,
      coords: this.getCoordsPlanta(planta)
    };
    const zonasCompatibles = this.getZonasCompatibles(planta.zona_logistica);
    const pendientes = Object.values(this.paquetes).filter((p) => p.estado === "Pendiente");

    this.sugerenciasActuales = pendientes
      .map((p) => ({ paquete: p, ...this.calcularScorePaquete(p, viajeVirtual, zonasCompatibles) }))
      .filter((x) => x.score >= 40)
      .sort((a, b) => b.score - a.score);

    if (!this.sugerenciasActuales.length) {
      body.innerHTML = `<tr><td colspan="5" class="small-muted">No se detectaron paquetes compatibles.</td></tr>`;
      return [];
    }

    this.sugerenciasActuales.forEach((s) => {
      const p = s.paquete;
      const checked = s.score >= 70 ? "checked" : "";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" class="sugerencia-check" value="${window.Utils.escapeHtml(p.paquete_id)}" ${checked}></td>
        <td><strong>${window.Utils.escapeHtml(p.paquete_id)}</strong><div class="small-muted">${window.Utils.escapeHtml(p.proyecto_nombre || p.proyecto_id || "Sin proyecto")}</div></td>
        <td>${window.Utils.escapeHtml(p.cliente || "")}<div class="small-muted">${window.Utils.escapeHtml(p.planta || "")}</div></td>
        <td>${s.score}<div class="suggestion-motivos">${window.Utils.escapeHtml(s.motivos.join(" · "))}</div></td>
        <td>${window.Utils.escapeHtml(s.recomendacion)}</td>
      `;
      body.appendChild(tr);
    });
    return this.sugerenciasActuales;
  },

  getZonasCompatibles(nombreZona) {
    const zona = Object.values(this.zonas).find((z) => z.nombre === nombreZona || z.zona_id === nombreZona);
    if (!zona) return [];
    const comp = zona.zonas_compatibles || [];
    if (Array.isArray(comp)) return comp;
    if (typeof comp === "object") return Object.keys(comp).filter((k) => comp[k]);
    return [];
  },

  calcularScorePaquete(paquete, viaje, zonasCompatibles) {
    let score = 0;
    const motivos = [];

    if (paquete.planta_id && viaje.planta_id && paquete.planta_id === viaje.planta_id) {
      score += 100;
      motivos.push("Misma planta");
    }
    if (paquete.zona_logistica && viaje.zona_logistica && paquete.zona_logistica === viaje.zona_logistica) {
      score += 80;
      motivos.push("Misma zona");
    }
    if (paquete.zona_logistica && zonasCompatibles.includes(paquete.zona_logistica)) {
      score += 50;
      motivos.push("Zona compatible");
    }
    const plantaPaquete = this.getPlanta(paquete.planta_id);
    const coordsPaquete = this.getCoordsPlanta(plantaPaquete);
    if (viaje.coords && coordsPaquete) {
      const km = this.distanciaKm(viaje.coords.lat, viaje.coords.lng, coordsPaquete.lat, coordsPaquete.lng);
      paquete._distancia_destino_km = km;
      if (km <= 3) { score += 80; motivos.push(`Distancia ${km.toFixed(1)} km`); }
      else if (km <= 8) { score += 50; motivos.push(`Distancia ${km.toFixed(1)} km`); }
      else if (km <= 15) { score += 25; motivos.push(`Distancia ${km.toFixed(1)} km`); }
      else { motivos.push(`Distancia ${km.toFixed(1)} km`); }
    }
    if (paquete.prioridad === "Urgente") {
      score += 40;
      motivos.push("Urgente");
    }
    if (paquete.prioridad === "Alta") {
      score += 25;
      motivos.push("Prioridad alta");
    }
    if (this.fechaLimiteProxima(paquete.fecha_limite)) {
      score += 30;
      motivos.push("Fecha límite próxima");
    }
    if (paquete.estado !== "Pendiente") {
      score = 0;
      motivos.push("No pendiente");
    }
    return { score, recomendacion: this.obtenerRecomendacion(score), motivos };
  },

  fechaLimiteProxima(fechaISO) {
    if (!fechaISO) return false;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const fecha = new Date(`${fechaISO}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return false;
    const diff = Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3;
  },

  obtenerRecomendacion(score) {
    if (score >= 100) return "Muy recomendable";
    if (score >= 70) return "Recomendable";
    if (score >= 40) return "Revisar";
    return "No sugerido";
  },

  async crearViaje() {
    this.setMessage(this.els.viajeMessage, "", "");
    try {
      const planta = this.getPlanta(this.els.viajePlanta.value);
      if (!planta) throw new Error("Debes seleccionar el destino principal.");
      if (!this.els.viajeFecha.value) throw new Error("Debes seleccionar la fecha del viaje.");
      const seleccionados = [...document.querySelectorAll(".sugerencia-check:checked")].map((x) => x.value);
      const id = `VIAJE_${Date.now()}`;
      const usuario = this.els.viajeUsuario.value || window.Auth.currentUser?.usuario || "";
      const paquetesAsignados = {};
      seleccionados.forEach((pktId) => paquetesAsignados[pktId] = true);

      const payload = {
        viaje_id: id,
        fecha: this.els.viajeFecha.value,
        hora: this.els.viajeHora.value || "",
        usuario,
        destino_principal: planta.planta || "",
        planta_id: planta.planta_id || this.els.viajePlanta.value,
        cliente: planta.cliente || "",
        direccion: planta.direccion || "",
        zona_logistica: planta.zona_logistica || "",
        grupo_ruta: planta.grupo_ruta || "",
        origen: this.getPuntoSalida(),
        destino_coords: this.getCoordsPlanta(planta) || null,
        google_maps_url: planta.google_maps_url || "",
        estado: "Programado",
        observaciones: window.Utils.normalizarTexto(this.els.viajeObservaciones.value),
        paquetes_asignados: paquetesAsignados,
        creado_por: window.Auth.currentUser?.usuario || "sistema",
        creado_en: Date.now(),
        finalizado_en: ""
      };

      const updates = {};
      updates[`viajes/${id}`] = payload;
      seleccionados.forEach((pktId) => {
        updates[`paquetes/${pktId}/estado`] = "Asignado a viaje";
        updates[`paquetes/${pktId}/viaje_id`] = id;
      });
      await window.database.ref().update(updates);

      await Promise.all([this.cargarPaquetes(), this.cargarViajes()]);

      this.viajes[id] = payload;
      seleccionados.forEach((pktId) => {
        if (this.paquetes[pktId]) {
          this.paquetes[pktId].estado = "Asignado a viaje";
          this.paquetes[pktId].viaje_id = id;
        }
      });

      if (this.debeNotificarCalCenter("asignacion_viaje")) {
        await this.enviarMensajeCalCenter(usuario, this.construirMensajeViaje(payload, seleccionados));
      }
      for (const pktId of seleccionados) {
        const p = this.paquetes[pktId];
        if (p?.proyecto_key) await this.agregarHistorialProyecto(p.proyecto_key, `Paquete ${pktId} asignado al viaje ${id} del ${payload.fecha}.`);
      }

      this.clearViajeForm();
      this.renderAll();
      this.activateTab("viajesTab");
      this.setMessage(this.els.viajeMessage, "Viaje creado correctamente.", "success");
    } catch (err) {
      console.error(err);
      this.setMessage(this.els.viajeMessage, err.message || "No fue posible crear el viaje.", "error");
    }
  },

  clearViajeForm() {
    if (this.els.viajeFecha) this.els.viajeFecha.value = this.getTodayISO();
    if (this.els.viajeHora) this.els.viajeHora.value = "09:00";
    if (this.els.viajePlanta) this.els.viajePlanta.value = "";
    if (this.els.viajeObservaciones) this.els.viajeObservaciones.value = "";
    this.renderPlantaInfo("viaje");
    this.calcularSugerencias();
  },

  construirMensajePaqueteCreado(paquete) {
    return (
      `Se creó un paquete de entrega.\n\n` +
      `Paquete: ${paquete.paquete_id}\n` +
      `Proyecto: ${paquete.proyecto_id || "Sin proyecto"} ${paquete.proyecto_nombre || ""}\n` +
      `Cliente / Planta: ${paquete.cliente || ""} / ${paquete.planta || ""}\n` +
      `Zona: ${paquete.zona_logistica || "Sin zona"}\n` +
      `Prioridad: ${paquete.prioridad || "Normal"}\n` +
      `Fecha límite: ${paquete.fecha_limite || "Sin fecha límite"}\n\n` +
      `Observaciones: ${paquete.observaciones || "Sin observaciones"}`
    );
  },

  construirMensajeEntrega(paquete, entrega) {
    return (
      `Se confirmó la entrega de un paquete logístico.\n\n` +
      `Paquete: ${paquete.paquete_id}\n` +
      `Proyecto: ${paquete.proyecto_id || "Sin proyecto"} ${paquete.proyecto_nombre || ""}\n` +
      `Cliente / Planta: ${paquete.cliente || ""} / ${paquete.planta || ""}\n` +
      `Entregado por: ${entrega.entregado_por || ""}\n` +
      `Recibió: ${entrega.recibido_por || ""}\n` +
      `Observaciones: ${entrega.observaciones_entrega || "Sin observaciones"}`
    );
  },

  construirMensajeViaje(viaje, paquetesIds) {
    const paquetesTexto = paquetesIds.length ? paquetesIds.join(", ") : "Sin paquetes asignados inicialmente";
    return (
      `Se creó un viaje logístico.\n\n` +
      `Viaje: ${viaje.viaje_id}\n` +
      `Fecha: ${viaje.fecha} ${viaje.hora || ""}\n` +
      `Destino: ${viaje.cliente} / ${viaje.destino_principal}\n` +
      `Zona: ${viaje.zona_logistica}\n\n` +
      `Paquetes asignados: ${paquetesTexto}\n\n` +
      `Observaciones: ${viaje.observaciones || "Sin observaciones"}`
    );
  },

  async enviarMensajeCalCenter(destinatario, body) {
    const cfg = this.getConfigNotificaciones();
    if (!cfg.calcenter_activo) return;
    const toUser = window.Utils.normalizarTexto(destinatario);
    const fromUser = window.Utils.normalizarTexto(window.Auth.currentUser?.usuario || "Sistema Logística");
    if (!toUser) return;
    const msgId = String(Date.now());
    const payload = {
      ID: msgId,
      _From: fromUser,
      _To: toUser,
      _Body: body
    };
    await window.database.ref(`CalCenter/${msgId}`).set(payload);
  },

  async detectarYRenderOportunidades(showMessage = true) {
    const container = this.els.oportunidadesContainer;
    if (!container) return;
    const pendientes = Object.values(this.paquetes).filter((p) => p.estado === "Pendiente");
    const porZona = {};
    pendientes.forEach((p) => {
      const zona = p.zona_logistica || "Sin zona";
      if (!porZona[zona]) porZona[zona] = [];
      porZona[zona].push(p);
    });

    const oportunidades = Object.keys(porZona)
      .map((zona) => {
        const items = porZona[zona];
        const urgentes = items.filter((p) => ["Urgente", "Alta"].includes(p.prioridad) || this.fechaLimiteProxima(p.fecha_limite));
        const aplica = items.length >= 2 || urgentes.length >= 1;
        const prioridad = urgentes.length >= 2 ? "Alta" : (urgentes.length === 1 || items.length >= 4 ? "Media" : "Baja");
        const motivo = items.length >= 2
          ? `Concentración de ${items.length} paquete(s) pendiente(s) en la zona.`
          : "Paquete con prioridad alta/urgente o fecha límite próxima.";
        return { zona, items, urgentes, aplica, prioridad, motivo };
      })
      .filter((x) => x.aplica)
      .sort((a, b) => (b.urgentes.length - a.urgentes.length) || (b.items.length - a.items.length));

    container.innerHTML = "";
    if (!oportunidades.length) {
      container.innerHTML = `<div class="readonly-box">No hay oportunidades activas. Se crearán cuando exista acumulación de paquetes por zona o paquetes urgentes.</div>`;
      if (showMessage) await this.guardarOportunidadesDetectadas([]);
      return;
    }

    oportunidades.forEach((op) => {
      const lista = op.items.slice(0, 5).map((p) => `
        <li><strong>${window.Utils.escapeHtml(p.paquete_id)}</strong> · ${window.Utils.escapeHtml(p.cliente || "")} / ${window.Utils.escapeHtml(p.planta || "")}</li>
      `).join("");
      const card = document.createElement("article");
      card.className = "opportunity-card";
      card.innerHTML = `
        <h3>${window.Utils.escapeHtml(op.zona)}</h3>
        <div class="opportunity-meta">
          Prioridad: <strong>${window.Utils.escapeHtml(op.prioridad)}</strong><br>
          Paquetes pendientes: <strong>${op.items.length}</strong><br>
          Urgentes / próximos: <strong>${op.urgentes.length}</strong><br>
          Motivo: ${window.Utils.escapeHtml(op.motivo)}
        </div>
        <ul class="opportunity-list">${lista}</ul>
        <button class="btn ghost full" data-op-zona="${window.Utils.escapeHtml(op.zona)}">Ver paquetes</button>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll("[data-op-zona]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.filters.paquetes = btn.dataset.opZona;
        if (this.els.filterPaquetes) this.els.filterPaquetes.value = btn.dataset.opZona;
        if (this.els.filterEstadoPaquete) this.els.filterEstadoPaquete.value = "Pendiente";
        this.filters.estado = "Pendiente";
        this.renderPaquetes();
        this.activateTab("paquetesTab");
      });
    });

    if (showMessage) {
      await this.guardarOportunidadesDetectadas(oportunidades);
      this.setMessage(this.els.viajeMessage, "Oportunidades actualizadas y guardadas.", "success");
    }
  },

  async guardarOportunidadesDetectadas(oportunidades) {
    const updates = {};
    const ahora = Date.now();

    const snap = await window.database.ref("oportunidades_logisticas").once("value");
    const existentes = snap.val() || {};
    Object.keys(existentes).forEach((key) => {
      if (existentes[key]?.estado === "Nueva") updates[`oportunidades_logisticas/${key}/estado`] = "Reemplazada";
    });

    oportunidades.forEach((op) => {
      const cleanZona = this.makeSafeKey(op.zona || "SIN_ZONA");
      const id = `OP_${cleanZona}_${ahora}`;
      const paquetes = {};
      op.items.forEach((p) => paquetes[p.paquete_id] = true);
      updates[`oportunidades_logisticas/${id}`] = {
        oportunidad_id: id,
        zona_logistica: op.zona,
        paquetes_sugeridos: paquetes,
        cantidad_paquetes: op.items.length,
        urgentes: op.urgentes.length,
        prioridad: op.prioridad,
        motivo: op.motivo,
        estado: "Nueva",
        creada_en: ahora,
        convertida_en_viaje_id: ""
      };
    });

    if (Object.keys(updates).length) await window.database.ref().update(updates);
  },


  toNumberOrDefault(value, fallback = null) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  },

  normalizeCoord(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return null;

    // Importante: Number("") devuelve 0. Eso hacía que plantas sin coordenadas
    // se interpretaran como 0,0 y la distancia apareciera siempre como 0.0 km.
    const normalized = raw.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  },

  esCoordenadaMexico(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= 14 && lat <= 33 &&
      lng >= -118 && lng <= -86;
  },

  normalizarParCoordenadas(latRaw, lngRaw) {
    const lat = this.normalizeCoord(latRaw);
    const lng = this.normalizeCoord(lngRaw);
    if (lat === null || lng === null) return null;

    // Caso correcto para plantas en México.
    if (this.esCoordenadaMexico(lat, lng)) return { lat, lng };

    // Caso común de error: se capturó Longitud en Latitud y Latitud en Longitud.
    if (this.esCoordenadaMexico(lng, lat)) return { lat: lng, lng: lat, corregida: true };

    return null;
  },

  getCoordsPlanta(planta) {
    if (!planta) return null;

    const desdeCampos = this.normalizarParCoordenadas(planta.lat, planta.lng);
    if (desdeCampos) return desdeCampos;

    const extraidas = this.extraerCoordenadasDesdeUrl(planta.google_maps_url || "");
    if (extraidas) return extraidas;

    return null;
  },

  extraerCoordenadasDesdeUrl(url) {
    const txt = window.Utils.normalizarTexto(url);
    if (!txt) return null;
    const decoded = (() => {
      try { return decodeURIComponent(txt); } catch (e) { return txt; }
    })();

    const candidatos = [];
    const add = (lat, lng) => {
      const normal = this.normalizarParCoordenadas(lat, lng);
      if (normal) candidatos.push(normal);
    };

    // Formatos habituales: @lat,lng y query=lat,lng
    const directPatterns = [
      /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/g,
      /[?&](?:q|query|ll)=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/gi,
      /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/gi,
      /(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/g
    ];

    for (const re of directPatterns) {
      let m;
      while ((m = re.exec(decoded)) !== null) {
        add(m[1], m[2]);
      }
    }

    // Formato frecuente en Google Maps: !2d{lng}!3d{lat}
    const lngLatPatterns = [
      /!2d(-?\d{1,3}\.\d+)!3d(-?\d{1,3}\.\d+)/gi,
      /!4d(-?\d{1,3}\.\d+)!3d(-?\d{1,3}\.\d+)/gi
    ];

    for (const re of lngLatPatterns) {
      let m;
      while ((m = re.exec(decoded)) !== null) {
        add(m[2], m[1]);
      }
    }

    return candidatos.length ? candidatos[0] : null;
  },

  distanciaKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (deg) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  crearUrlMapsPlanta(planta) {
    if (!planta) return "";
    const coords = this.getCoordsPlanta(planta);
    if (coords) return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    if (planta.direccion) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(planta.direccion)}`;
    return planta.google_maps_url || "";
  },

  crearUrlRuta(destinos = []) {
    const origen = this.getPuntoSalida();
    const origin = `${origen.lat},${origen.lng}`;
    const validos = destinos.filter(Boolean);
    if (!validos.length) return `https://www.google.com/maps/search/?api=1&query=${origin}`;
    const destinoFinal = validos[validos.length - 1];
    const waypoints = validos.slice(0, -1).map((x) => `${x.lat},${x.lng}`).join("|");
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(`${destinoFinal.lat},${destinoFinal.lng}`)}`;
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
    return url;
  },

  abrirOrigenMaps() {
    const origen = this.getPuntoSalida();
    window.open(`https://www.google.com/maps/search/?api=1&query=${origen.lat},${origen.lng}`, "_blank", "noopener,noreferrer");
  },

  abrirRutaAPlanta(planta) {
    const coords = this.getCoordsPlanta(planta);
    if (!coords) {
      const url = this.crearUrlMapsPlanta(planta);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(this.crearUrlRuta([coords]), "_blank", "noopener,noreferrer");
  },

  abrirRutaViaje(viajeId) {
    const viaje = this.viajes[viajeId];
    if (!viaje) return;
    const destinos = [];
    Object.keys(viaje.paquetes_asignados || {}).forEach((pktId) => {
      const p = this.paquetes[pktId];
      const coords = this.getCoordsPlanta(this.getPlanta(p?.planta_id));
      if (coords && !destinos.some((x) => Math.abs(x.lat-coords.lat)<0.000001 && Math.abs(x.lng-coords.lng)<0.000001)) destinos.push(coords);
    });
    const destinoPrincipal = this.getCoordsPlanta(this.getPlanta(viaje.planta_id));
    if (destinoPrincipal && !destinos.some((x) => Math.abs(x.lat-destinoPrincipal.lat)<0.000001 && Math.abs(x.lng-destinoPrincipal.lng)<0.000001)) destinos.push(destinoPrincipal);
    if (!destinos.length) {
      const planta = this.getPlanta(viaje.planta_id);
      const url = planta?.google_maps_url || this.crearUrlMapsPlanta(planta);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(this.crearUrlRuta(destinos), "_blank", "noopener,noreferrer");
  },

  renderPlantasMantenimiento() {
    const body = this.els.plantasTableBody;
    if (!body) return;
    const isAdmin = !!window.Auth.currentUser?.administrador;
    const tabBtn = document.querySelector('[data-tab="plantasTab"]');
    if (tabBtn) tabBtn.classList.toggle("hidden", !isAdmin);
    if (!isAdmin) {
      if (document.getElementById("plantasTab")?.classList.contains("active")) this.activateTab("paquetesTab");
      return;
    }
    const search = window.Utils.normalizarTexto(this.plantFilters.search).toLowerCase();
    const estado = this.plantFilters.estado || "activas";
    let rows = Object.keys(this.plantas).map((key) => ({ key, ...(this.plantas[key] || {}) }));
    rows = rows.filter((p) => {
      const coords = this.getCoordsPlanta(p);
      const tieneUrl = !!window.Utils.normalizarTexto(p.google_maps_url);
      const activo = p.activo !== false;
      const validada = p.coordenada_validada === true || String(p.coordenada_validada).toLowerCase() === "true";
      if (estado === "activas" && !activo) return false;
      if (estado === "inactivas" && activo) return false;
      if (estado === "sin_maps" && tieneUrl) return false;
      if (estado === "sin_coords" && coords) return false;
      if (estado === "sin_validar" && (!coords || validada)) return false;
      if (search) {
        const cad = `${p.cliente || ""} ${p.planta || ""} ${p.direccion || ""} ${p.zona_logistica || ""}`.toLowerCase();
        if (!cad.includes(search)) return false;
      }
      return true;
    }).sort((a,b)=>`${a.cliente||""} ${a.planta||""}`.localeCompare(`${b.cliente||""} ${b.planta||""}`));

    body.innerHTML = "";
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="7" class="small-muted">No hay plantas con esos filtros.</td></tr>`;
      return;
    }
    rows.forEach((p) => {
      const coords = this.getCoordsPlanta(p);
      const validada = p.coordenada_validada === true || String(p.coordenada_validada).toLowerCase() === "true";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${window.Utils.escapeHtml(p.cliente || "")}</strong><div class="small-muted">${window.Utils.escapeHtml(p.planta || "")}</div></td>
        <td>${window.Utils.escapeHtml(p.direccion || "Sin dirección")}</td>
        <td>${window.Utils.escapeHtml(p.zona_logistica || "Pendiente de clasificación")}<div class="small-muted">${window.Utils.escapeHtml(p.grupo_ruta || "")}</div></td>
        <td>${p.google_maps_url ? "Sí" : "No"}</td>
        <td>${coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Pendiente"}<div class="small-muted">${validada ? "Validada" : "Sin validar"}</div></td>
        <td>${p.activo !== false ? "Sí" : "No"}</td>
        <td><div class="row-actions">
          <button class="btn ghost" data-planta-action="editar" data-key="${window.Utils.escapeHtml(p.key)}">Editar</button>
          <button class="btn ghost" data-planta-action="maps" data-key="${window.Utils.escapeHtml(p.key)}">Maps</button>
          <button class="btn ghost" data-planta-action="ruta" data-key="${window.Utils.escapeHtml(p.key)}">Ruta</button>
          <button class="btn danger-outline" data-planta-action="toggle" data-key="${window.Utils.escapeHtml(p.key)}">${p.activo !== false ? "Desactivar" : "Activar"}</button>
        </div></td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-planta-action]").forEach((btn) => {
      btn.addEventListener("click", () => this.handlePlantaAction(btn.dataset.plantaAction, btn.dataset.key));
    });
  },

  handlePlantaAction(action, key) {
    const planta = this.plantas[key];
    if (!planta) return;
    if (action === "editar") return this.openPlantaModal(key);
    if (action === "maps") {
      const url = planta.google_maps_url || this.crearUrlMapsPlanta(planta);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "ruta") return this.abrirRutaAPlanta(planta);
    if (action === "toggle") return this.togglePlantaActiva(key);
  },

  openPlantaModal(key = "") {
    if (!window.Auth.currentUser?.administrador) return;
    this.selectedPlantaKey = key;
    const planta = key ? (this.plantas[key] || {}) : {};
    const set = (id, value) => { if (this.els[id]) this.els[id].value = value ?? ""; };
    const check = (id, value) => { if (this.els[id]) this.els[id].checked = !!value; };
    if (this.els.modalPlantaTitle) this.els.modalPlantaTitle.textContent = key ? "Editar planta" : "Nueva planta";
    set("plantaEditKey", key);
    set("plantaCliente", planta.cliente || "");
    set("plantaNombre", planta.planta || "");
    set("plantaDireccion", planta.direccion || "");
    set("plantaCP", planta.codigo_postal || "");
    set("plantaMapsUrl", planta.google_maps_url || "");
    const coords = this.getCoordsPlanta(planta);
    set("plantaLat", planta.lat || coords?.lat || "");
    set("plantaLng", planta.lng || coords?.lng || "");
    check("plantaCoordValidada", planta.coordenada_validada === true || String(planta.coordenada_validada).toLowerCase() === "true");
    set("plantaContacto", planta.contacto || "");
    set("plantaHorario", planta.horario_recepcion || "");
    check("plantaRequiereCita", planta.requiere_cita === true || String(planta.requiere_cita).toLowerCase() === "true");
    set("plantaObsAcceso", planta.observaciones_acceso || "");
    set("plantaObservaciones", planta.observaciones || "");
    check("plantaActivo", planta.activo !== false);
    if (this.els.plantaZonaReadonly) this.els.plantaZonaReadonly.textContent = planta.zona_logistica || "Pendiente de clasificación";
    if (this.els.plantaSubzonaReadonly) this.els.plantaSubzonaReadonly.textContent = planta.subzona || "—";
    if (this.els.plantaGrupoReadonly) this.els.plantaGrupoReadonly.textContent = planta.grupo_ruta || "—";
    this.setMessage(this.els.plantaMessage, "", "");
    this.els.modalPlanta?.classList.remove("hidden");
  },

  closePlantaModal() {
    this.els.modalPlanta?.classList.add("hidden");
  },

  extraerCoordsPlantaModal() {
    const url = this.els.plantaMapsUrl?.value || "";
    const coords = this.extraerCoordenadasDesdeUrl(url);
    if (!coords) {
      this.setMessage(this.els.plantaMessage, "No pude extraer coordenadas. Usa una URL expandida de Google Maps o captura lat/lng manualmente.", "error");
      return;
    }
    if (this.els.plantaLat) this.els.plantaLat.value = coords.lat;
    if (this.els.plantaLng) this.els.plantaLng.value = coords.lng;
    if (this.els.plantaCoordValidada) this.els.plantaCoordValidada.checked = false;
    this.setMessage(this.els.plantaMessage, "Coordenadas extraídas. Revisa la ubicación y marca como validada si corresponde.", "success");
  },

  abrirMapsPlantaModal() {
    const url = this.els.plantaMapsUrl?.value || "";
    const coords = { lat: this.normalizeCoord(this.els.plantaLat?.value), lng: this.normalizeCoord(this.els.plantaLng?.value) };
    if (url) return window.open(url, "_blank", "noopener,noreferrer");
    if (coords.lat !== null && coords.lng !== null) return window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, "_blank", "noopener,noreferrer");
  },

  abrirRutaPlantaOrigenModal() {
    const coords = { lat: this.normalizeCoord(this.els.plantaLat?.value), lng: this.normalizeCoord(this.els.plantaLng?.value) };
    if (coords.lat === null || coords.lng === null) {
      this.setMessage(this.els.plantaMessage, "Captura o extrae coordenadas para abrir ruta desde oficina.", "error");
      return;
    }
    window.open(this.crearUrlRuta([coords]), "_blank", "noopener,noreferrer");
  },

  async guardarPlanta() {
    this.setMessage(this.els.plantaMessage, "", "");
    try {
      if (!window.Auth.currentUser?.administrador) throw new Error("Solo un administrador puede editar plantas.");
      const cliente = window.Utils.normalizarTexto(this.els.plantaCliente?.value);
      const plantaNombre = window.Utils.normalizarTexto(this.els.plantaNombre?.value);
      if (!cliente) throw new Error("Debes capturar el cliente.");
      if (!plantaNombre) throw new Error("Debes capturar el nombre de la planta.");
      let key = this.els.plantaEditKey?.value || "";
      const original = key ? (this.plantas[key] || {}) : {};
      if (!key) key = this.generarPlantaKey(cliente, plantaNombre);
      const lat = this.normalizeCoord(this.els.plantaLat?.value);
      const lng = this.normalizeCoord(this.els.plantaLng?.value);
      const payload = {
        ...original,
        planta_id: original.planta_id || key,
        cliente,
        planta: plantaNombre,
        direccion: window.Utils.normalizarTexto(this.els.plantaDireccion?.value),
        codigo_postal: window.Utils.normalizarTexto(this.els.plantaCP?.value),
        google_maps_url: window.Utils.normalizarTexto(this.els.plantaMapsUrl?.value),
        lat: lat === null ? "" : lat,
        lng: lng === null ? "" : lng,
        coordenada_validada: !!this.els.plantaCoordValidada?.checked,
        contacto: window.Utils.normalizarTexto(this.els.plantaContacto?.value),
        horario_recepcion: window.Utils.normalizarTexto(this.els.plantaHorario?.value),
        requiere_cita: !!this.els.plantaRequiereCita?.checked,
        observaciones_acceso: window.Utils.normalizarTexto(this.els.plantaObsAcceso?.value),
        observaciones: window.Utils.normalizarTexto(this.els.plantaObservaciones?.value),
        activo: !!this.els.plantaActivo?.checked,
        zona_logistica: original.zona_logistica || "Pendiente de clasificación",
        subzona: original.subzona || "",
        grupo_ruta: original.grupo_ruta || "Pendiente de clasificación",
        actualizado_por: window.Auth.currentUser?.usuario || "",
        actualizado_en: Date.now()
      };
      await window.database.ref(`plantas/${key}`).update(payload);
      this.plantas[key] = payload;
      this.renderSelects();
      this.renderAll();
      this.setMessage(this.els.plantaMessage, "Planta guardada correctamente.", "success");
      setTimeout(() => this.closePlantaModal(), 800);
    } catch (err) {
      console.error(err);
      this.setMessage(this.els.plantaMessage, err.message || "No fue posible guardar la planta.", "error");
    }
  },

  generarPlantaKey(cliente, planta) {
    const base = `PLANTA_${this.makeSafeKey(`${cliente}_${planta}`) || Date.now()}`;
    let key = base;
    let i = 2;
    while (this.plantas[key]) {
      key = `${base}_${i}`;
      i++;
    }
    return key;
  },

  async togglePlantaActiva(key) {
    if (!window.Auth.currentUser?.administrador) return;
    const planta = this.plantas[key];
    if (!planta) return;
    const nuevo = planta.activo === false;
    await window.database.ref(`plantas/${key}`).update({ activo: nuevo, actualizado_en: Date.now(), actualizado_por: window.Auth.currentUser?.usuario || "" });
    planta.activo = nuevo;
    this.renderSelects();
    this.renderAll();
  },

  async extraerTodasCoordsDesdeUrls() {
    if (!window.Auth.currentUser?.administrador) return;
    let count = 0;
    const updates = {};
    Object.keys(this.plantas).forEach((key) => {
      const p = this.plantas[key] || {};
      const yaTiene = this.normalizeCoord(p.lat) !== null && this.normalizeCoord(p.lng) !== null;
      if (yaTiene || !p.google_maps_url) return;
      const coords = this.extraerCoordenadasDesdeUrl(p.google_maps_url);
      if (!coords) return;
      updates[`plantas/${key}/lat`] = coords.lat;
      updates[`plantas/${key}/lng`] = coords.lng;
      updates[`plantas/${key}/coordenada_validada`] = false;
      updates[`plantas/${key}/actualizado_en`] = Date.now();
      updates[`plantas/${key}/actualizado_por`] = window.Auth.currentUser?.usuario || "";
      this.plantas[key].lat = coords.lat;
      this.plantas[key].lng = coords.lng;
      this.plantas[key].coordenada_validada = false;
      count++;
    });
    if (Object.keys(updates).length) await window.database.ref().update(updates);
    this.renderAll();
    this.setMessage(this.els.plantasMessage, count ? `Se extrajeron coordenadas para ${count} planta(s). Revisa y valida.` : "No se encontraron URLs con coordenadas extraíbles.", count ? "success" : "error");
  },

  makeSafeKey(value) {
    return window.Utils.normalizarTexto(value)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toUpperCase() || "SIN_DATO";
  },

  openEntregaModal(paqueteId) {
    const p = this.paquetes[paqueteId];
    if (!p) return;
    this.els.entregaPaqueteId.value = paqueteId;
    this.els.entregaEntregadoPor.value = window.Auth.currentUser?.usuario || "";
    this.els.entregaRecibidoPor.value = "";
    this.els.entregaObservaciones.value = "";
    this.setMessage(this.els.entregaMessage, "", "");
    this.els.modalEntrega.classList.remove("hidden");
  },

  closeEntregaModal() {
    this.els.modalEntrega?.classList.add("hidden");
  },

  async confirmarEntrega() {
    this.setMessage(this.els.entregaMessage, "", "");
    try {
      const id = this.els.entregaPaqueteId.value;
      const p = this.paquetes[id];
      if (!p) throw new Error("No se encontró el paquete.");
      const entregadoPor = window.Utils.normalizarTexto(this.els.entregaEntregadoPor.value);
      const recibidoPor = window.Utils.normalizarTexto(this.els.entregaRecibidoPor.value);
      const observaciones = window.Utils.normalizarTexto(this.els.entregaObservaciones.value);
      if (!recibidoPor) throw new Error("Debes capturar quién recibió.");

      const fechaEntrega = new Date().toISOString();
      const updates = {
        estado: "Entregado",
        entregado_por: entregadoPor,
        recibido_por: recibidoPor,
        observaciones_entrega: observaciones,
        fecha_entrega: fechaEntrega
      };
      await window.database.ref(`paquetes/${id}`).update(updates);
      this.paquetes[id] = { ...p, ...updates };
      await this.cargarPaquetes();

      if (p.proyecto_key) {
        await this.agregarHistorialProyecto(
          p.proyecto_key,
          `Paquete ${id} entregado por ${entregadoPor}. Recibió: ${recibidoPor}. Observaciones: ${observaciones || "Sin observaciones"}.`
        );
      }

      if (this.debeNotificarCalCenter("entrega_paquete")) {
        await this.enviarMensajeCalCenter(p.responsable || entregadoPor, this.construirMensajeEntrega({ ...p, paquete_id: id }, updates));
      }

      this.closeEntregaModal();
      this.renderAll();
    } catch (err) {
      console.error(err);
      this.setMessage(this.els.entregaMessage, err.message || "No fue posible confirmar la entrega.", "error");
    }
  },

  async agregarHistorialProyecto(proyectoKey, texto) {
    if (!proyectoKey || !this.proyectos[proyectoKey]) return;
    const proyecto = this.proyectos[proyectoKey];
    const usuario = "Sistema Logística";
    const nuevoBloque = `${window.Utils.formatDateStampNow()} - ${usuario} escribió:\n${texto}`;
    const historialAnterior = window.Utils.normalizarTexto(proyecto.Historial);
    const nuevoHistorial = historialAnterior ? `${nuevoBloque}\n\n${historialAnterior}` : nuevoBloque;
    await window.database.ref(`Registros/${proyectoKey}/Historial`).set(nuevoHistorial);
    this.proyectos[proyectoKey].Historial = nuevoHistorial;
  },

  formatMs(ms) {
    if (!ms) return "";
    const d = new Date(Number(ms));
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
  }
};

document.addEventListener("DOMContentLoaded", function () {
  if (!window.firebase || !window.database || !window.Auth || !window.Utils) {
    alert("Faltan dependencias: firebase-config.js, utils.js o auth.js. Revisa el orden de scripts.");
    return;
  }
  window.Logistica.init();
});
