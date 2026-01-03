const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let scale = 1;
let stitches = [];
let bounds = null;

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (typeof Embroidery === "undefined") {
    alert("EmbroideryJS no se cargó");
    return;
  }

  const buffer = await file.arrayBuffer();
  const design = Embroidery.read(buffer);

  stitches = [];
  let x = 0;
  let y = 0;

  // 🔴 FIX IMPORTANTE: dx / dy son relativos
  design.stitches.forEach(s => {
    if (s.command === "stitch") {
      x += s.dx;
      y += s.dy;
      stitches.push({
        x,
        y,
        color: s.color || "#000000"
      });
    }
  });

  if (!stitches.length) {
    alert("El archivo no contiene puntadas visibles");
    return;
  }

  calcularBounds();
  scale = 1;
  render();
});

function calcularBounds() {
  const xs = stitches.map(p => p.x);
  const ys = stitches.map(p => p.y);

  bounds = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!bounds) return;

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  const s = Math.min(
    canvas.width / width,
    canvas.height / height
  ) * 0.9 * scale;

  ctx.save();

  // Centro del canvas
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Escala real y eje Y invertido
  ctx.scale(s, -s);

  // Centrar diseño
  ctx.translate(
    -(bounds.minX + width / 2),
    -(bounds.minY + height / 2)
  );

  ctx.lineWidth = 1 / s;

  // 🔵 Dibujo en ORDEN REAL DE PUNTADAS
  stitches.forEach(p => {
    ctx.strokeStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  });

  ctx.restore();
}

function zoom(factor) {
  scale *= factor;
  render();
}

function resetView() {
  scale = 1;
  render();
}

// PNG TRANSPARENTE
function exportPNG() {
  const link = document.createElement("a");
  link.download = "bordado.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
