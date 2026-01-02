
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const input = document.getElementById("fileInput");
const exportBtn = document.getElementById("exportBtn");

let stitches = [];

input.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const buffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop().toLowerCase();

  document.getElementById("format").textContent = ext.toUpperCase();

  if (ext === "dst") {
    const design = DSTParser.parse(new Uint8Array(buffer));
    stitches = design.stitches;
    document.getElementById("stitches").textContent = stitches.length;
    document.getElementById("colors").textContent = design.colors?.length || 1;
    renderDST(stitches);
  } 
  else if (ext === "pes") {
    const design = PES.read(buffer);
    stitches = design.stitches;
    document.getElementById("stitches").textContent = stitches.length;
    document.getElementById("colors").textContent = design.colors.length;
    renderPES(stitches);
  } 
  else {
    alert("Formato no soportado");
  }
});

function renderDST(data) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  let x = 0, y = 0;
  ctx.strokeStyle = "#ffffff";

  data.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(x, -y);
    x += s.dx;
    y += s.dy;
    ctx.lineTo(x, -y);
    ctx.stroke();
  });

  ctx.restore();
}

function renderPES(data) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  let x = 0, y = 0;

  data.forEach(s => {
    ctx.strokeStyle = s.color || "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x, -y);
    x += s.dx;
    y += s.dy;
    ctx.lineTo(x, -y);
    ctx.stroke();
  });

  ctx.restore();
}

exportBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "bordado.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
