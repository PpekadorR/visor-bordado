
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("fileInput");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const resetBtn = document.getElementById("reset");
const animateBtn = document.getElementById("animate");
const exportBtn = document.getElementById("exportBtn");

let stitches = [];
let bounds = {};
let scale = 1, offsetX = 0, offsetY = 0, animating = false;

function resizeCanvas() {
  const size = Math.min(window.innerWidth - 320, window.innerHeight - 20);
  canvas.width = size;
  canvas.height = size;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

input.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  const buffer = await file.arrayBuffer();
  const ext = file.name.split(".").pop().toLowerCase();
  document.getElementById("format").textContent = ext.toUpperCase();

  if (ext === "dst") {
    const d = DSTParser.parse(new Uint8Array(buffer));
    stitches = normalizeRelative(d.stitches, "#fff");
    document.getElementById("colors").textContent = 1;
  }
  else if (ext === "pes") {
    const d = PES.read(buffer);
    stitches = normalizeRelative(d.stitches);
    document.getElementById("colors").textContent = d.colors.length;
  }
  else if (ext === "exp") {
    const d = EXPParser.parse(new Uint8Array(buffer));
    stitches = normalizeRelative(d.stitches, "#fff");
    document.getElementById("colors").textContent = 1;
  }
  else if (ext === "jef") {
    const d = JEFParser.parse(new Uint8Array(buffer));
    stitches = normalizeRelative(d.stitches);
    document.getElementById("colors").textContent = d.colors?.length || 1;
  }
  else {
    alert("Formato no soportado en navegador");
    return;
  }

  document.getElementById("stitches").textContent = stitches.length;
  computeBounds();
  center();
  render();
});

function normalizeRelative(data, fallbackColor="#fff") {
  let x=0,y=0;
  return data.map(s=>{
    x+=s.dx; y+=s.dy;
    return {x,y,color:s.color||fallbackColor};
  });
}

function computeBounds() {
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  stitches.forEach(p=>{
    minX=Math.min(minX,p.x); maxX=Math.max(maxX,p.x);
    minY=Math.min(minY,p.y); maxY=Math.max(maxY,p.y);
  });
  bounds={minX,maxX,minY,maxY};
  document.getElementById("width").textContent=((maxX-minX)/10).toFixed(1);
  document.getElementById("height").textContent=((maxY-minY)/10).toFixed(1);
}

function center(){
  const w=bounds.maxX-bounds.minX, h=bounds.maxY-bounds.minY;
  scale=Math.min(canvas.width/w,canvas.height/h)*0.85;
  offsetX=canvas.width/2; offsetY=canvas.height/2;
}

function render(limit=stitches.length){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(offsetX,offsetY);
  ctx.scale(scale,-scale);
  ctx.lineWidth=1/scale;
  for(let i=1;i<limit;i++){
    ctx.strokeStyle=stitches[i].color;
    ctx.beginPath();
    ctx.moveTo(stitches[i-1].x,stitches[i-1].y);
    ctx.lineTo(stitches[i].x,stitches[i].y);
    ctx.stroke();
  }
  ctx.restore();
}

zoomInBtn.onclick=()=>{scale*=1.2;render();};
zoomOutBtn.onclick=()=>{scale/=1.2;render();};
resetBtn.onclick=()=>{center();render();};

animateBtn.onclick=async()=>{
  if(animating) return;
  animating=true;
  for(let i=1;i<stitches.length;i+=25){
    render(i); await new Promise(r=>setTimeout(r,10));
  }
  animating=false;
};

exportBtn.onclick=()=>{
  const a=document.createElement("a");
  a.download="bordado_wilcom.png";
  a.href=canvas.toDataURL("image/png");
  a.click();
};
