window.App = {
  async init() {
    if (!window.Auth) {
      alert("Auth no está cargado. Revisa js/auth.js y el orden de scripts en index.html");
      return;
    }

    window.UI.init();
    window.Auth.logout();
    window.UI.showLogin();
  },

  async handleLogin() {
    window.UI.setLoginMessage("", "");
    try {
      const usuario = document.getElementById("loginUsuario").value;
      const password = document.getElementById("loginPassword").value;

      await window.Auth.login(usuario, password);
      window.UI.showMain();
      await window.App.cargarSistema();
    } catch (err) {
      console.error("Error en login:", err);
      window.UI.setLoginMessage(err.message || "No fue posible iniciar sesión.", "error");
    }
  },

  handleLogout() {
    window.Auth.logout();
    window.Proyectos.all = [];
    window.Proyectos.filtered = [];
    window.Proyectos.selectedKey = null;
    window.UI.showLogin();
    window.UI.showEmptyDetail();
    window.UI.setLoginMessage("", "");
    document.getElementById("loginPassword").value = "";
  },

  async cargarSistema() {
    try {
      await window.Proyectos.cargar();
      window.UI.renderFilterOptions();
      window.App.refreshFilters();
      window.UI.showEmptyDetail();
    } catch (err) {
      console.error("Error en cargarSistema:", err);
      alert("Error al cargar sistema: " + (err.message || err));
    }
  },

  refreshFilters() {
    window.Proyectos.aplicarFiltros(window.UI.getFilters());
    window.UI.renderTable();

    if (window.Proyectos.selectedKey) {
      const selected = window.Proyectos.getByKey(window.Proyectos.selectedKey);
      if (selected) {
        window.UI.renderDetail(selected);
      }
    }
  },

  selectProject(key) {
    const registro = window.Proyectos.seleccionar(key);
    window.UI.renderTable();
    window.UI.renderDetail(registro);
    window.UI.setSaveMessage("", "");
  },

  toggleSortById() {
    window.Proyectos.toggleSortById();
    window.UI.renderTable();

    if (window.Proyectos.selectedKey) {
      const selected = window.Proyectos.getByKey(window.Proyectos.selectedKey);
      if (selected) {
        window.UI.renderDetail(selected);
      }
    }
  },

  previewEstadoFromForm() {
    const registro = window.UI.getFormRegistro();
    if (!registro) return;
    window.UI.previewEstado(window.Utils.getEstadoCalculado(registro));
  },

  async handleGuardarProyecto() {
    window.UI.setSaveMessage("", "");
    try {
      const registro = window.UI.getFormRegistro();
      if (!registro) {
        throw new Error("No hay proyecto seleccionado.");
      }

      const guardado = await window.Proyectos.guardarDesdeFormulario(registro);
      window.UI.setSaveMessage("Proyecto guardado correctamente.", "success");
      window.App.refreshFilters();
      window.App.selectProject(guardado._firebaseKey);
    } catch (err) {
      console.error(err);
      window.UI.setSaveMessage(err.message || "No fue posible guardar.", "error");
    }
  },

  handleDescargarQR() {
    const selected = window.Proyectos.getByKey(window.Proyectos.selectedKey);
    if (!selected) return;
    window.QRModule.descargar("qrContainer", `QR_${selected.ID}.png`);
  },

  async handleCrearProyecto() {
    window.UI.setNewProjectMessage("", "");
    try {
      const form = window.UI.getNewProjectForm();

      if (!window.Utils.normalizarTexto(form.Proyecto)) {
        throw new Error("Debes capturar el proyecto.");
      }
      if (!window.Utils.normalizarTexto(form.Cliente)) {
        throw new Error("Debes capturar el cliente.");
      }
      if (!window.Utils.normalizarTexto(form.Nombre)) {
        throw new Error("Debes capturar el responsable.");
      }

      const nuevo = await window.Proyectos.crearNuevo(form);
      window.UI.setNewProjectMessage("Proyecto creado correctamente.", "success");
      window.UI.renderFilterOptions();
      window.App.refreshFilters();
      window.UI.closeNewModal();
      window.App.selectProject(nuevo._firebaseKey);
    } catch (err) {
      console.error(err);
      window.UI.setNewProjectMessage(err.message || "No fue posible crear el proyecto.", "error");
    }
  },

  async handleCrearCliente() {
    window.UI.setNewClientMessage("", "");
    try {
      const nombre = window.UI.getNewClientForm();

      if (!window.Utils.normalizarTexto(nombre)) {
        throw new Error("Debes capturar el nombre del cliente.");
      }

      await window.Proyectos.crearNuevoCliente(nombre);
      window.UI.setNewClientMessage("Cliente creado correctamente.", "success");
      window.UI.renderFilterOptions();
      window.UI.renderNewProjectOptions();
      window.UI.renderDeleteClientOptions();
      window.UI.closeNewClientModal();
    } catch (err) {
      console.error(err);
      window.UI.setNewClientMessage(err.message || "No fue posible crear el cliente.", "error");
    }
  },

  async handleEliminarCliente() {
    window.UI.setDeleteClientMessage("", "");
    try {
      const nombre = window.UI.getDeleteClientForm();

      if (!window.Utils.normalizarTexto(nombre)) {
        throw new Error("Debes seleccionar un cliente.");
      }

      const confirmar = window.confirm(
        `¿Deseas eliminar el cliente "${nombre}" del catálogo?\n\n` +
        "Seguirá apareciendo en proyectos ya existentes, pero dejará de estar disponible en las listas."
      );

      if (!confirmar) {
        throw new Error("Eliminación cancelada.");
      }

      await window.Proyectos.eliminarCliente(nombre);
      window.UI.setDeleteClientMessage("Cliente eliminado correctamente.", "success");
      window.UI.renderFilterOptions();
      window.UI.renderNewProjectOptions();
      window.UI.renderDeleteClientOptions();
      window.UI.closeDeleteClientModal();
    } catch (err) {
      console.error(err);
      window.UI.setDeleteClientMessage(err.message || "No fue posible eliminar el cliente.", "error");
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  window.App.init();
});
