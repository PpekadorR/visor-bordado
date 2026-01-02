const fileInput = document.getElementById("fileInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Verificación CLAVE (evita tu error actual)
  if (!window.Embroidery || !Embroidery.Reader) {
    alert("EmbroideryJS no se cargó correctamente");
    return;
  }

  const buffer = await file.arrayBuffer();

  const reader = new Embroidery.Reader();
  const design = reader.read(buffer);

  // Información
  document.getElementById("format").textContent = file.name.split(".").pop().toUpperCase();
  document.getElementById("stitches").textContent = design.stitches.length;
  document.getElementById("colors").textContent = design.threads.length;

  // Medidas reales en mm
  const bounds = design.bounds;
  const widthMM = (bounds.maxX - bounds.minX).toFixed(1);
  const heightMM = (bounds.maxY - bounds.minY).toFixed(1);

  document.getElementById("width").textContent = widthMM;
  document.getElementById("height").textContent = heightMM;

  drawDesign(design);
});

// DIBUJO
function drawDesign(design) {
  const scale = 4;

  canvas.width = (design.bounds.maxX - design.bounds.minX) * scale;
  canvas.height = (design.bounds.maxY - design.bounds.minY) * scale;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);

  let lastX = 0;
  let lastY = 0;

  for (const stitch of design.stitches) {
    if (stitch.jump) {
      lastX = stitch.x;
      lastY = stitch.y;
      continue;
    }

    ctx.strokeStyle = stitch.color || "#000";
    ctx.beginPath();
    ctx.moveTo(lastX * scale, -lastY * scale);
    ctx.lineTo(stitch.x * scale, -stitch.y * scale);
    ctx.stroke();

    lastX = stitch.x;
    lastY = stitch.y;
  }

  ctx.resetTransform();
}

// EXPORTAR PNG TRANSPARENTE
document.getElementById("exportPNG").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "bordado.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
