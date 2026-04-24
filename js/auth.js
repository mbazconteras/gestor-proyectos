window.Auth = {
  currentUser: null,

  getText(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  },

  getBool(value) {
    if (value === true || value === false) return value;
    const txt = String(value ?? "").trim().toLowerCase();
    return txt === "true" || txt === "1" || txt === "si" || txt === "sí";
  },

  async crearCuentaPendiente(usuario, password) {
    const nombre = this.getText(usuario);
    const pwd = this.getText(password);

    if (!nombre || !pwd) {
      throw new Error("Debes ingresar usuario y contraseña.");
    }

    const id = String(Date.now());

    const nuevoUsuario = {
      ID: id,
      IsAdmin: false,
      Nombre: nombre,
      Password: pwd,
      eMail: "",
      status: false
    };

    await window.database.ref(`Usuarios/${id}`).set(nuevoUsuario);
    return nuevoUsuario;
  },

  async login(usuario, password) {
    const user = this.getText(usuario);
    const pass = this.getText(password);

    if (!user || !pass) {
      throw new Error("Debes ingresar usuario y contraseña.");
    }

    const snap = await window.database.ref("Usuarios").once("value");
    const users = snap.val();

    if (!users) {
      const confirmar = window.confirm(
        "El usuario no existe.\n\n" +
        `Usuario: ${user}\n\n` +
        "¿Deseas solicitar una cuenta nueva con estos datos?\n" +
        "Tu usuario y tu password serán creados cuando el administrador del sistema lo autorice."
      );

      if (!confirmar) {
        throw new Error("Solicitud de cuenta cancelada.");
      }

      await this.crearCuentaPendiente(user, pass);
      throw new Error(
        "Cuenta nueva registrada. Tu usuario y tu password serán creados y habilitados cuando el administrador del sistema lo autorice."
      );
    }

    let encontrado = null;

    for (const key in users) {
      const u = users[key] || {};

      const nombre = this.getText(u.Nombre);
      const pwd = this.getText(u.Password);
      const activo = this.getBool(u.status);
      const isAdmin = this.getBool(u.IsAdmin);

      if (nombre.toLowerCase() !== user.toLowerCase()) {
        continue;
      }

      if (pwd !== pass) {
        throw new Error("Contraseña incorrecta. Si ya tienes una cuenta, verifica tus datos.");
      }

      if (!activo) {
        throw new Error("Tu usuario existe pero está pendiente de autorización o inactivo. Consulta con el administrador del sistema.");
      }

      encontrado = {
        key: key,
        id: this.getText(u.ID || key),
        usuario: nombre,
        nombre: nombre,
        email: this.getText(u.eMail),
        administrador: isAdmin,
        activo: true,
        raw: u
      };

      break;
    }

    if (!encontrado) {
      const confirmar = window.confirm(
        "El usuario no existe.\n\n" +
        `Usuario: ${user}\n\n` +
        "¿Deseas solicitar una cuenta nueva con estos datos?\n" +
        "Tu usuario y tu password serán creados cuando el administrador del sistema lo autorice."
      );

      if (!confirmar) {
        throw new Error("Solicitud de cuenta cancelada.");
      }

      await this.crearCuentaPendiente(user, pass);
      throw new Error(
        "Cuenta nueva registrada. Tu usuario y tu password serán creados y habilitados cuando el administrador del sistema lo autorice."
      );
    }

    this.currentUser = encontrado;
    localStorage.setItem("gp_session", JSON.stringify(encontrado));
    return encontrado;
  },

  restoreSession() {
    try {
      const raw = localStorage.getItem("gp_session");
      if (!raw) return null;

      const session = JSON.parse(raw);
      if (!session || !session.usuario) return null;

      this.currentUser = session;
      return session;
    } catch (e) {
      return null;
    }
  },

  logout() {
    localStorage.removeItem("gp_session");
    this.currentUser = null;
  }
};
