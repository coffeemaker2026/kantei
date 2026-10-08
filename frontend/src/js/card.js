// 鑑定カード（750×1050）の描画。描く内容は試作の draw() / renderWindow() のまま
import { hash, rng } from "./appraise.js";
import { PW, PH, imgRect, pathOf, drawPhoto } from "./editor.js";

const W = 750, H = 1050;

// 書体を読み込んでから描く。読み込めなくても端末の書体で描く
export async function ensureFonts(){
  try { await Promise.all([document.fonts.load('40px "Zen Antique"'),document.fonts.load('24px "Zen Kaku Gothic New"'),document.fonts.load('700 24px "Zen Kaku Gothic New"')]); } catch(_) {}
}

/* ---------- 写真窓：切り抜き・後光・スポットライト ---------- */
function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}
function rays(ctx,cx,cy,color,alpha,n){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;for(let i=0;i<n;i++){const a=i*2*Math.PI/n;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,1000,a,a+Math.PI/n);ctx.closePath();ctx.fill();}ctx.restore();}
function bbox(lasso,r){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[ix,iy]of lasso){const x=r.x+ix*r.s,y=r.y+iy*r.s;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return{cx:(x0+x1)/2,cy:(y0+y1)/2,w:x1-x0,h:y1-y0};}
const GLOW={SSR:"#FFF2B8",SR:"#F3D27A",R:"#DCE4F2",N:"#E8C9A0",Z:"#BDB5A6"};

function renderWindow(ctx,rank,{ photo, view, lasso }){
  const r=imgRect(photo,view), isZ=rank==="Z", glow=GLOW[rank];
  if (lasso){
    const b=bbox(lasso,r);
    const bg=ctx.createRadialGradient(b.cx,b.cy,10,b.cx,b.cy,PW*.8);
    bg.addColorStop(0,isZ?"#8C8576":"#3A4A8A"); bg.addColorStop(1,isZ?"#4F4A42":"#0E1428");
    ctx.fillStyle=bg; ctx.fillRect(0,0,PW,PH);
    rays(ctx,b.cx,b.cy,glow,isZ?.06:.16,isZ?12:24);
    const halo=ctx.createRadialGradient(b.cx,b.cy,0,b.cx,b.cy,Math.max(b.w,b.h)*.85);
    halo.addColorStop(0,hexA(glow,isZ?.15:.6)); halo.addColorStop(1,hexA(glow,0));
    ctx.fillStyle=halo; ctx.fillRect(0,0,PW,PH);
    const c=document.createElement("canvas"); c.width=PW; c.height=PH; const x=c.getContext("2d");
    drawPhoto(x,photo,r,isZ); x.globalCompositeOperation="destination-in"; x.beginPath(); pathOf(x,lasso,r); x.fill();
    ctx.save(); ctx.shadowColor=hexA(glow,isZ?.3:.95); ctx.shadowBlur=isZ?10:40; ctx.drawImage(c,0,0); ctx.restore();
    ctx.drawImage(c,0,0);
  } else {
    drawPhoto(ctx,photo,r,isZ);
    ctx.save(); ctx.globalCompositeOperation="screen"; rays(ctx,PW/2,PH/2,glow,isZ?.04:.10,24); ctx.restore();
    const v=ctx.createRadialGradient(PW/2,PH/2,PH*.22,PW/2,PH/2,PW*.62);
    v.addColorStop(0,"rgba(0,0,0,0)"); v.addColorStop(1,isZ?"rgba(40,36,30,.6)":"rgba(5,8,25,.75)");
    ctx.fillStyle=v; ctx.fillRect(0,0,PW,PH);
    if (rank==="SSR"||rank==="SR"){ctx.save();ctx.globalCompositeOperation="screen";const g=ctx.createRadialGradient(PW/2,PH/2,0,PW/2,PH/2,PW*.5);g.addColorStop(0,hexA(glow,.28));g.addColorStop(1,hexA(glow,0));ctx.fillStyle=g;ctx.fillRect(0,0,PW,PH);ctx.restore();}
  }
}

/* ---------- カード ---------- */
const FRAMES = {
  SSR:["#E85D75","#F0B84A","#6CC7A0","#5A8FE0","#A66FD8"],
  SR:["#8A6A22","#E6C66A","#9C7A2C","#F3DC8C","#8A6A22"],
  R:["#6F7888","#E3E7EE","#8E96A4","#D5DAE3"],
  N:["#6B4A2F","#B98A5C","#7A5636"],
  Z:["#A89A84","#BFB39E"]
};
function rr(ctx,x,y,w,h,rad){ctx.beginPath();ctx.moveTo(x+rad,y);ctx.arcTo(x+w,y,x+w,y+h,rad);ctx.arcTo(x+w,y+h,x,y+h,rad);ctx.arcTo(x,y+h,x,y,rad);ctx.arcTo(x,y,x+w,y,rad);ctx.closePath();}
function fitFont(ctx,text,family,max,min,width){let s=max;do{ctx.font=`${s}px ${family}`;if(ctx.measureText(text).width<=width)break;s-=2;}while(s>min);return s;}
function wrap(ctx,text,x,y,width,lh,maxLines){
  let line="",lines=[];
  for (const ch of text){ if (ctx.measureText(line+ch).width > width){ lines.push(line); line=ch; } else line+=ch; }
  if (line) lines.push(line);
  lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lh));
}

export function drawCard(card, photoState){
  const c = document.createElement("canvas"); c.width=W; c.height=H;
  const ctx = c.getContext("2d");
  const D = '"Zen Antique","Hiragino Mincho ProN",serif', B = '"Zen Kaku Gothic New","Hiragino Sans",sans-serif';
  const isZ = card.rank === "Z";

  // frame
  const g = ctx.createLinearGradient(0,0,W,H);
  FRAMES[card.rank].forEach((col,i,a)=>g.addColorStop(i/(a.length-1),col));
  rr(ctx,0,0,W,H,34); ctx.fillStyle=g; ctx.fill();
  if (card.rank==="SSR"){ const r=rng(hash(card.serial)); ctx.fillStyle="rgba(255,255,255,.8)"; for(let i=0;i<40;i++){const x=r()*W,y=r()*H; if(x>40&&x<W-40&&y>40&&y<H-40)continue; ctx.beginPath();ctx.arc(x,y,r()*3+1,0,7);ctx.fill();} }

  // inner panel
  const panel = isZ ? "#6E685D" : "#16203A";
  rr(ctx,26,26,W-52,H-52,20); ctx.fillStyle=panel; ctx.fill();
  ctx.lineWidth=3; ctx.strokeStyle = isZ ? "#968C7A" : "#D4B05A"; rr(ctx,36,36,W-72,H-72,14); ctx.stroke();

  const textCol = isZ ? "#ECE6DA" : "#F1EAD8", label = isZ ? "#D8CFBF" : "#D9B65C";

  // name
  ctx.fillStyle=textCol; ctx.textBaseline="alphabetic"; ctx.textAlign="left";
  fitFont(ctx,card.title,D,56,30,480); ctx.fillText(card.title,64,118);
  if (card.sub){ ctx.font=`26px ${B}`; ctx.fillStyle=label; ctx.fillText(card.sub,66,158); }

  // rank stamp
  ctx.save(); ctx.translate(W-112,112); ctx.rotate(-0.14);
  ctx.beginPath(); ctx.arc(0,0,62,0,7); ctx.fillStyle = isZ ? "#4F4A42" : "#B8372B"; ctx.fill();
  ctx.lineWidth=4; ctx.strokeStyle="rgba(255,255,255,.75)"; ctx.beginPath(); ctx.arc(0,0,52,0,7); ctx.stroke();
  ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.font=`${card.rank.length>2?40:card.rank.length>1?48:60}px ${D}`; ctx.fillText(card.rank,0,4);
  ctx.restore(); ctx.textAlign="left"; ctx.textBaseline="alphabetic";

  // photo window
  const px=56,py=184,pw=W-112,ph=440;
  ctx.save(); rr(ctx,px,py,pw,ph,10); ctx.clip(); ctx.translate(px,py);
  renderWindow(ctx,card.rank,photoState);
  ctx.restore();
  ctx.lineWidth=3; ctx.strokeStyle=label; rr(ctx,px,py,pw,ph,10); ctx.stroke();

  // type line
  ctx.font=`24px ${B}`; ctx.fillStyle=label;
  ctx.fillText(`属性：${card.attr}　種別：${card.category}`,60,664);

  // stats
  card.stats.forEach(([k,v],i)=>{
    const col=i%2, row=Math.floor(i/2), x=60+col*322, y=708+row*52;
    ctx.font=`22px ${B}`; ctx.fillStyle=textCol; ctx.fillText(k,x,y);
    ctx.fillStyle="rgba(255,255,255,.15)"; rr(ctx,x+128,y-17,118,14,7); ctx.fill();
    ctx.fillStyle=label; rr(ctx,x+128,y-17,Math.max(6,118*v/100),14,7); ctx.fill();
    ctx.font=`700 22px ${B}`; ctx.fillStyle=textCol; ctx.textAlign="right"; ctx.fillText(v,x+296,y); ctx.textAlign="left";
  });

  // lore
  ctx.fillStyle = isZ ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.06)"; rr(ctx,56,790,W-112,170,10); ctx.fill();
  ctx.font=`25px ${B}`; ctx.fillStyle=textCol; wrap(ctx,card.lore,78,834,W-156,38,4);

  // footer
  ctx.font=`20px ${B}`; ctx.fillStyle=label;
  ctx.fillText(`No.${card.serial}`,60,1000);
  ctx.textAlign="right"; ctx.font=`22px ${D}`; ctx.fillText("八百万神器鑑定所",W-60,1000); ctx.textAlign="left";
  return c;
}
