const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const info = document.getElementById("info");

document.getElementById("fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();

  reader.onload = () => {
    const buffer = reader.result;
    loadDesign(ext, buffer);
  };

  reader.readAsArrayBuffer(file);
});

function loadDesign(ext, buffer) {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if (ext === "dst") {
    const design = parseDST(buffer);
    renderDesign(design);
  } else if (["pes","jef","exp"].includes(ext)) {
    alert("Formato detectado. Parser básico aún en desarrollo.");
  } else if (["emb","art","vp3","vip","hus"].includes(ext)) {
    alert("Formato de diseño propietario. No se puede previsualizar en web.");
  } else {
    alert("Formato no soportado.");
  }
}

function parseDST(buffer) {
  const data = new Uint8Array(buffer);
  let x=0, y=0;
  let stitches=[];
  let colorIndex=0;

  for (let i=512;i<data.length;i+=3) {
    let b1=data[i], b2=data[i+1], b3=data[i+2];

    if ((b3 & 0xF3) === 0xF3) break;

    let dx = ((b1 & 0x01)?1:0)*1 + ((b1 & 0x04)?1:0)*9
           - ((b1 & 0x02)?1:0)*1 - ((b1 & 0x08)?1:0)*9;

    let dy = ((b2 & 0x01)?1:0)*1 + ((b2 & 0x04)?1:0)*9
           - ((b2 & 0x02)?1:0)*1 - ((b2 & 0x08)?1:0)*9;

    x += dx;
    y += dy;

    if (b3 & 0x40) colorIndex++;

    stitches.push({x,y,color:colorIndex});
  }

  return stitches;
}

function renderDesign(stitches) {
  if (!stitches.length) return;

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
  ctx.scale(scale,scale);
  ctx.translate(- (minX+maxX)/2, - (minY+maxY)/2);

  ctx.lineWidth=1/scale;

  let last=null;
  stitches.forEach(s=>{
    if (!last) { last=s; return; }
    ctx.strokeStyle = colorFromIndex(s.color);
    ctx.beginPath();
    ctx.moveTo(last.x,last.y);
    ctx.lineTo(s.x,s.y);
    ctx.stroke();
    last=s;
  });

  ctx.setTransform(1,0,0,1,0,0);

  info.textContent =
    `Puntadas: ${stitches.length} | Tamaño aprox: ${(w/10).toFixed(1)} x ${(h/10).toFixed(1)} mm`;
}

function colorFromIndex(i) {
  const palette=[
    "#000","#f00","#0f0","#00f","#ff0","#f0f","#0ff","#fff"
  ];
  return palette[i%palette.length];
}

function exportPNG() {
  const link=document.createElement("a");
  link.download="bordado.png";
  link.href=canvas.toDataURL("image/png");
  link.click();
}
