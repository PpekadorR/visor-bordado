const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const info = document.getElementById("info");

document.getElementById("fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();

  reader.onload = () => loadFile(ext, reader.result);
  reader.readAsArrayBuffer(file);
});

function loadFile(ext, buffer) {
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  let stitches = [];

  if (ext === "dst") stitches = parseDST(buffer);
  else if (ext === "pes") return parsePES(buffer);
  else if (ext === "jef") return parseJEF(buffer);
  else if (ext === "exp") return parseEXP(buffer);
  else return unsupported(ext.toUpperCase());

  render(stitches);
}

function render(stitches) {
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;

  stitches.forEach(s=>{
    minX=Math.min(minX,s.x);
    minY=Math.min(minY,s.y);
    maxX=Math.max(maxX,s.x);
    maxY=Math.max(maxY,s.y);
  });

  const w=maxX-minX;
  const h=maxY-minY;
  const scale=Math.min(canvas.width/w,canvas.height/h)*0.9;

  ctx.translate(canvas.width/2,canvas.height/2);
  ctx.scale(scale,-scale);
  ctx.translate(-(minX+maxX)/2,-(minY+maxY)/2);

  ctx.lineWidth=1/scale;

  let last=null;
  stitches.forEach(s=>{
    if (!last || !s.penDown) { last=s; return; }
    ctx.strokeStyle = palette(s.color);
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(s.x,s.y);
    ctx.stroke();
    last=s;
  });

  info.textContent = `Puntadas: ${stitches.length}`;
}

function palette(i) {
  const p=["#000","#f00","#0f0","#00f","#ff0","#f0f","#0ff","#fff"];
  return p[i%p.length];
}

function exportPNG() {
  const a=document.createElement("a");
  a.download="bordado.png";
  a.href=canvas.toDataURL("image/png");
  a.click();
}

