window.QRModule = {
  qrInstance: null,

  render(containerId, text) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    this.qrInstance = new QRCode(container, {
      text: String(text || ""),
      width: 160,
      height: 160
    });
  },

  descargar(containerId, fileName = "qr.png") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const canvas = container.querySelector("canvas");
    const img = container.querySelector("img");

    let dataUrl = "";

    if (canvas) {
      dataUrl = canvas.toDataURL("image/png");
    } else if (img) {
      dataUrl = img.src;
    }

    if (!dataUrl) return;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
