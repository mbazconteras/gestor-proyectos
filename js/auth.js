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

  async login(usuario, password) {
    const user = this.getText(usuario);
    const pass = this.getText(password);

    if (!user || !pass) {
      throw new Error("Debes ingresar usuario y contraseña.");
    }

    const snap = await window.database.ref("Usuarios").once("value");
    const users = snap.val();

    if (!users) {
      throw new Error("No existe el nodo Usuarios o está vacío.");
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
        throw new Error("Contraseña incorrecta.");
      }

      if (!activo) {
        throw new Error("Tu usuario está inactivo. No tienes acceso.");
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
      throw new Error("Usuario no encontrado.");
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
