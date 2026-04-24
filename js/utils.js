window.STEP_NAMES = [
  "Recorrido en planta",
  "Estudio en desarrollo",
  "Solicitud de información adicional",
  "Revisión QEHS",
  "Revisión Cliente",
  "Aplicando correcciones",
  "VoBo cliente",
  "VoBo Laboratorio",
  "Impreso",
  "Entregado",
  "Facturado",
  "Pagado"
];

window.Utils = {
  normalizarTexto(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor).replace(/^"+|"+$/g, "").trim();
  },

  normalizarBoolean(valor) {
    if (valor === true || valor === false) return valor;
    if (valor === 1 || valor === "1") return true;
    if (valor === 0 || valor === "0") return false;

    const txt = this.normalizarTexto(valor).toLowerCase();
    if (txt === "true") return true;
    if (txt === "false") return false;
    return false;
  },

  normalizarFechaTexto(valor) {
    const txt = this.normalizarTexto(valor);
    if (!txt) return "";
    if (txt.toLowerCase() === "dd/mm/yyyy") return "";
    return txt.replace(/\\"/g, "").replace(/\\\//g, "/");
  },

  parseCampoEntregado(valor) {
    const txt = this.normalizarTexto(valor);
    if (!txt) {
      return {
        quienEntrega: "",
        quienRecibe: "",
        observaciones: ""
      };
    }

    const partes = txt.split("_").map(x => this.normalizarTexto(x));

    return {
      quienEntrega: partes[0] || "",
      quienRecibe: partes[1] || "",
      observaciones: partes.length > 2 ? partes.slice(2).join("_") : ""
    };
  },

  parseFechaFlexible(valor) {
    const txt = this.normalizarFechaTexto(valor);
    if (!txt) return null;

    const match = txt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)?$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);

      let hours = 0;
      let minutes = 0;

      const timeMatch = txt.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);

        const lower = txt.toLowerCase();
        if (lower.includes("p. m.") || lower.includes("pm")) {
          if (hours < 12) hours += 12;
        }
        if (lower.includes("a. m.") || lower.includes("am")) {
          if (hours === 12) hours = 0;
        }
      }

      const d = new Date(year, month, day, hours, minutes, 0, 0);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const alt = new Date(txt);
    if (!Number.isNaN(alt.getTime())) return alt;

    return null;
  },

  formatFechaHoy() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  },

  formatDateStampNow() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    let h = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const isPM = h >= 12;
    const suffix = isPM ? "p. m." : "a. m.";
    h = h % 12 || 12;
    const hh = String(h).padStart(2, "0");

    return `${dd}/${mm}/${yyyy} ${hh}:${min} ${suffix}`;
  },

  diffDiasEntreFechas(fecha1, fecha2) {
    const d1 = this.parseFechaFlexible(fecha1);
    const d2 = this.parseFechaFlexible(fecha2);
    if (!d1 || !d2) return null;

    const ms = d2.getTime() - d1.getTime();
    const dias = Math.round(ms / (1000 * 60 * 60 * 24));
    return dias;
  },

  getEstadoCalculado(registro) {
    for (let i = 12; i >= 1; i--) {
      if (this.normalizarBoolean(registro[`Step${i}`])) {
        switch (i) {
          case 12: return "Pagado";
          case 11: return "Facturado";
          case 10: return "Entregado";
          case 9: return "Impreso";
          case 8:
          case 7:
          case 5:
          case 4:
          case 3:
            return "En espera";
          case 6:
          case 2:
            return "En desarrollo";
          case 1:
            return "Iniciado";
          default:
            return "Sin iniciar";
        }
      }
    }
    return "Sin iniciar";
  },

  getEstadoClass(estado) {
    switch (estado) {
      case "Iniciado": return "status-iniciado";
      case "En desarrollo": return "status-en-desarrollo";
      case "En espera": return "status-en-espera";
      case "Impreso": return "status-impreso";
      case "Entregado": return "status-entregado";
      case "Facturado": return "status-facturado";
      case "Pagado": return "status-pagado";
      default: return "status-sin-iniciar";
    }
  },

  getUltimaFechaActiva(registro) {
    for (let i = 12; i >= 1; i--) {
      if (this.normalizarBoolean(registro[`Step${i}`])) {
        return this.normalizarFechaTexto(registro[`Step${i}_Date`]) || "—";
      }
    }
    return "—";
  },

  normalizarRegistro(rawKey, raw = {}) {
    const clean = { ...raw };

    clean._firebaseKey = rawKey;
    clean.ID = clean.ID || Number(rawKey) || Date.now();
    clean.Cliente = this.normalizarTexto(clean.Cliente);
    clean.Proyecto = this.normalizarTexto(clean.Proyecto);
    clean.PO = this.normalizarTexto(clean.PO);
    clean.Nombre = this.normalizarTexto(clean.Nombre);
    clean.Link = this.normalizarTexto(clean.Link);
    clean.Historial = this.normalizarTexto(clean.Historial);
    clean.Entregado = this.normalizarTexto(clean.Entregado);
    clean.FechaEntrega = this.normalizarFechaTexto(clean.FechaEntrega);
    clean.In_DateStamp = this.normalizarTexto(clean.In_DateStamp);
    clean.URLSign = this.normalizarTexto(clean.URLSign);

    for (let i = 1; i <= 12; i++) {
      clean[`Step${i}`] = this.normalizarBoolean(clean[`Step${i}`]);
      clean[`Step${i}_Date`] = this.normalizarFechaTexto(clean[`Step${i}_Date`]);
    }

    clean._estadoCalculado = this.getEstadoCalculado(clean);
    clean._ultimaFechaActiva = this.getUltimaFechaActiva(clean);

    return clean;
  },

  escapeHtml(str) {
    return this.normalizarTexto(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
};
