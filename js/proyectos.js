window.Proyectos = {
  all: [],
  filtered: [],
  selectedKey: null,
  catalogoClientes: [],
  catalogoResponsables: [],
  sortDirection: "desc",

  usuarioActualNormalizado() {
    return window.Utils.normalizarTexto(window.Auth.currentUser?.usuario).toLowerCase();
  },

  responsableNormalizado(item) {
    return window.Utils.normalizarTexto(item?.Nombre).toLowerCase();
  },

  usuarioPuedeVer(item) {
    if (window.Auth.currentUser?.administrador) return true;

    const responsable = this.responsableNormalizado(item);
    const usuario = this.usuarioActualNormalizado();

    return !!responsable && !!usuario && responsable === usuario;
  },

  usuarioPuedeEditar(item) {
    return this.usuarioPuedeVer(item);
  },

  construirEntradaHistorial(texto, usuario) {
    const limpio = window.Utils.normalizarTexto(texto);
    if (!limpio) return "";
    return `${window.Utils.formatDateStampNow()} - ${usuario} escribió:\n${limpio}`;
  },

  ordenarLista(lista) {
    lista.sort((a, b) => {
      const idA = Number(a.ID || 0);
      const idB = Number(b.ID || 0);
      return this.sortDirection === "asc" ? idA - idB : idB - idA;
    });
    return lista;
  },

  toggleSortById() {
    this.sortDirection = this.sortDirection === "desc" ? "asc" : "desc";
    this.ordenarLista(this.all);
    this.ordenarLista(this.filtered);
  },

  async cargarCatalogos() {
    const [usersSnap, clientsSnap] = await Promise.all([
      window.database.ref("Usuarios").once("value"),
      window.databaseClientes.ref("QEHSClients").once("value")
    ]);

    const users = usersSnap.val() || {};
    const clients = clientsSnap.val() || {};

    this.catalogoResponsables = Object.keys(users)
      .map((key) => users[key] || {})
      .filter((u) => {
        const activo = u.status === true || String(u.status).toLowerCase() === "true";
        return activo;
      })
      .map((u) => window.Utils.normalizarTexto(u.Nombre))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    this.catalogoClientes = Object.keys(clients)
      .map((key) => window.Utils.normalizarTexto(key))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  },

  async cargar() {
    await this.cargarCatalogos();

    const snap = await window.database.ref("Registros").once("value");
    const data = snap.val() || {};
    const arr = [];

    for (const key of Object.keys(data)) {
      try {
        const normalizado = window.Utils.normalizarRegistro(key, data[key]);

        if (this.usuarioPuedeVer(normalizado)) {
          arr.push(normalizado);
        }
      } catch (err) {
        console.error("Error normalizando registro", key, err);
      }
    }

    this.ordenarLista(arr);

    this.all = arr;
    this.filtered = [...arr];
    return arr;
  },

  aplicarFiltros({ search = "", cliente = "", responsable = "", estado = "" } = {}) {
    const txt = window.Utils.normalizarTexto(search).toLowerCase();
    const cli = window.Utils.normalizarTexto(cliente).toLowerCase();
    const resp = window.Utils.normalizarTexto(responsable).toLowerCase();
    const est = window.Utils.normalizarTexto(estado).toLowerCase();

    this.filtered = this.all.filter((item) => {
      const estadoActual = (item._estadoCalculado || "").toLowerCase();

      const cumpleSearch =
        !txt ||
        String(item.ID).toLowerCase().includes(txt) ||
        (item.Proyecto || "").toLowerCase().includes(txt) ||
        (item.Cliente || "").toLowerCase().includes(txt) ||
        (item.PO || "").toLowerCase().includes(txt) ||
        (item.Nombre || "").toLowerCase().includes(txt);

      const cumpleCliente = !cli || (item.Cliente || "").toLowerCase() === cli;
      const cumpleResp = !resp || (item.Nombre || "").toLowerCase() === resp;
      const cumpleEstado = !est || estadoActual === est;

      return cumpleSearch && cumpleCliente && cumpleResp && cumpleEstado;
    });

    this.ordenarLista(this.filtered);
    return this.filtered;
  },

  getByKey(key) {
    return this.all.find((x) => x._firebaseKey === key) || null;
  },

  seleccionar(key) {
    this.selectedKey = key;
    return this.getByKey(key);
  },

  async guardarDesdeFormulario(registroEditado) {
    const key = registroEditado._firebaseKey;
    if (!key) throw new Error("No se encontró la clave del registro.");

    const original = this.getByKey(key) || {};
    if (!this.usuarioPuedeEditar(original)) {
      throw new Error("No tienes permiso para editar este proyecto.");
    }

    const payload = { ...original, ...registroEditado };

    payload.ID = Number(payload.ID) || Number(key);
    payload.Cliente = window.Utils.normalizarTexto(payload.Cliente);
    payload.Proyecto = window.Utils.normalizarTexto(payload.Proyecto);
    payload.PO = window.Utils.normalizarTexto(payload.PO);
    payload.Nombre = window.Utils.normalizarTexto(payload.Nombre);
    payload.Link = window.Utils.normalizarTexto(payload.Link);
    payload.Entregado = window.Utils.normalizarTexto(payload.Entregado);
    payload.FechaEntrega = window.Utils.normalizarFechaTexto(payload.FechaEntrega);
    payload.In_DateStamp = window.Utils.normalizarTexto(payload.In_DateStamp);
    payload.URLSign = window.Utils.normalizarTexto(payload.URLSign);
    payload.LastEditUser = window.Auth.currentUser?.usuario || "";
    payload.LastEditDate = new Date().toISOString();

    for (let i = 1; i <= 12; i++) {
      payload[`Step${i}`] = window.Utils.normalizarBoolean(payload[`Step${i}`]);
      payload[`Step${i}_Date`] = window.Utils.normalizarFechaTexto(payload[`Step${i}_Date`]);
    }

    const usuario = window.Auth.currentUser?.usuario || "sistema";
    const historialAnterior = window.Utils.normalizarTexto(original.Historial);
    const historialCapturado = window.Utils.normalizarTexto(registroEditado.Historial);

    let nuevoBloque = "";
    if (historialCapturado && historialCapturado !== historialAnterior) {
      nuevoBloque = this.construirEntradaHistorial(historialCapturado, usuario);
    } else {
      nuevoBloque = `${window.Utils.formatDateStampNow()} - ${usuario} actualizó el proyecto`;
    }

    payload.Historial = historialAnterior
      ? `${nuevoBloque}\n\n${historialAnterior}`
      : nuevoBloque;

    await window.database.ref(`Registros/${key}`).set(payload);

    const idx = this.all.findIndex((x) => x._firebaseKey === key);
    const normalized = window.Utils.normalizarRegistro(key, payload);

    if (idx >= 0) {
      this.all[idx] = normalized;
      this.ordenarLista(this.all);
    }

    this.aplicarFiltros(window.UI.getFilters());
    return normalized;
  },

  async enviarMensajeAsignacion({ proyectoId, proyecto, responsable, detallesAdicionales }) {
    const fromUser = window.Utils.normalizarTexto(window.Auth.currentUser?.usuario || "");
    const toUser = window.Utils.normalizarTexto(responsable || "");

    if (!fromUser || !toUser) {
      console.warn("No se envió mensaje interno: faltan _From o _To.");
      return;
    }

    const msgId = String(Date.now());
    const detalles = window.Utils.normalizarTexto(detallesAdicionales);

    const body =
      `Se te asignó el proyecto ID: ${proyectoId}\n\n` +
      `Proyecto: ${window.Utils.normalizarTexto(proyecto)}\n\n` +
      `Detalles adicionales:\n${detalles || "Sin detalles adicionales"}\n\n` +
      `Puede ir al gestor de proyectos y revisar y actualizar los detalles de avance.`;

    const payload = {
      ID: msgId,
      _From: fromUser,
      _To: toUser,
      _Body: body
    };

    await window.database.ref(`CalCenter/${msgId}`).set(payload);
  },

  async crearNuevo(datos) {
    if (!window.Auth.currentUser?.administrador) {
      throw new Error("Solo un administrador puede crear proyectos.");
    }

    const id = Date.now();
    const key = String(id);
    const usuario = window.Auth.currentUser?.usuario || "sistema";
    const historialInicial = this.construirEntradaHistorial(datos.Historial, usuario);

    const payload = {
      ID: id,
      Proyecto: window.Utils.normalizarTexto(datos.Proyecto),
      Cliente: window.Utils.normalizarTexto(datos.Cliente),
      PO: window.Utils.normalizarTexto(datos.PO),
      Nombre: window.Utils.normalizarTexto(datos.Nombre),
      Link: "",
      Historial: historialInicial || `${window.Utils.formatDateStampNow()} - ${usuario} creó el proyecto`,
      Entregado: "",
      FechaEntrega: "",
      In_DateStamp: window.Utils.formatDateStampNow(),
      URLSign: "",
      LastEditUser: usuario,
      LastEditDate: new Date().toISOString()
    };

    for (let i = 1; i <= 12; i++) {
      payload[`Step${i}`] = false;
      payload[`Step${i}_Date`] = "";
    }

    await window.database.ref(`Registros/${key}`).set(payload);

    try {
      await this.enviarMensajeAsignacion({
        proyectoId: id,
        proyecto: payload.Proyecto,
        responsable: payload.Nombre,
        detallesAdicionales: datos.Historial
      });
    } catch (err) {
      console.error("No se pudo enviar el mensaje interno de asignación:", err);
    }

    const normalized = window.Utils.normalizarRegistro(key, payload);

    if (this.usuarioPuedeVer(normalized) || window.Auth.currentUser?.administrador) {
      this.all.push(normalized);
      this.ordenarLista(this.all);
      this.aplicarFiltros(window.UI.getFilters());
    }

    return normalized;
  },

  getClientesUnicos() {
    return [...new Set(this.all.map(x => x.Cliente).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  },

  getResponsablesUnicos() {
    return [...new Set(this.all.map(x => x.Nombre).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }
};
