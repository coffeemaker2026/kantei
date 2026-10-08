// 写真窓の座標計算と、写真の調整欄（位置を動かす・なぞって切り抜く・大きさ）の操作
export const PW = 638, PH = 440;

export function imgRect(photo, view){const s0=Math.max(PW/photo.width,PH/photo.height), s=s0*view.zoom; return {s,x:(PW-photo.width*s)/2+view.offX,y:(PH-photo.height*s)/2+view.offY};}
export function pathOf(ctx,pts,r){pts.forEach(([ix,iy],i)=>{const x=r.x+ix*r.s,y=r.y+iy*r.s; (i===0)?ctx.moveTo(x,y):ctx.lineTo(x,y);}); ctx.closePath();}
export function drawPhoto(ctx,photo,r,gray){ if(gray) ctx.filter="grayscale(.85) contrast(.9)"; ctx.drawImage(photo,r.x,r.y,photo.width*r.s,photo.height*r.s); ctx.filter="none"; }

export function createEditor({ canvas, modeMove, modeLasso, clearLasso, zoom, hint, onChange, onStatus }){
  const ed=canvas, ex=ed.getContext("2d");
  let photo=null, lasso=null; // 切り抜きは写真上の座標で持つ（位置を動かしても付いてくる）
  const view={zoom:1,offX:0,offY:0};
  let mode="move", drawing=null, drag=null;
  const rect=()=>imgRect(photo,view);

  function strokePts(pts,closed){ if(pts.length<2) return; const r=rect(); ex.save(); ex.lineWidth=4; ex.strokeStyle="#F3D27A"; ex.setLineDash(closed?[]:[10,8]); ex.beginPath(); pts.forEach(([ix,iy],i)=>{const x=r.x+ix*r.s,y=r.y+iy*r.s;i?ex.lineTo(x,y):ex.moveTo(x,y);}); if(closed) ex.closePath(); ex.stroke(); ex.restore(); }
  function drawEditor(){
    ex.fillStyle="#222"; ex.fillRect(0,0,PW,PH); if(!photo) return;
    const r=rect(); drawPhoto(ex,photo,r,false);
    if (lasso){ ex.save(); ex.fillStyle="rgba(0,0,0,.6)"; ex.beginPath(); ex.rect(0,0,PW,PH); pathOf(ex,lasso,r); ex.fill("evenodd"); ex.restore(); strokePts(lasso,true); }
    if (drawing) strokePts(drawing,false);
  }
  function syncEditUI(){
    modeMove.setAttribute("aria-pressed",mode==="move"); modeLasso.setAttribute("aria-pressed",mode==="lasso");
    ed.classList.toggle("lasso",mode==="lasso"); clearLasso.hidden=!lasso;
    hint.textContent = mode==="move" ? "ドラッグで位置を調整できます。" : "対象のまわりをぐるっとなぞってください。指を離すと切り抜きます。";
  }
  function pt(e){const b=ed.getBoundingClientRect();return [(e.clientX-b.left)*PW/b.width,(e.clientY-b.top)*PH/b.height];}
  function toImg([x,y]){const r=rect();return [(x-r.x)/r.s,(y-r.y)/r.s];}

  ed.addEventListener("pointerdown",e=>{ if(!photo) return; ed.setPointerCapture(e.pointerId); const p=pt(e);
    if(mode==="move") drag={p,ox:view.offX,oy:view.offY}; else drawing=[toImg(p)]; });
  ed.addEventListener("pointermove",e=>{ const p=pt(e);
    if(drag){ view.offX=drag.ox+p[0]-drag.p[0]; view.offY=drag.oy+p[1]-drag.p[1]; drawEditor(); }
    else if(drawing){ const q=toImg(p), l=drawing[drawing.length-1], r=rect(); if(Math.hypot((q[0]-l[0])*r.s,(q[1]-l[1])*r.s)>4){ drawing.push(q); drawEditor(); } } });
  const endPtr=()=>{ if(drag){ drag=null; onChange(); }
    if(drawing){ if(drawing.length>=8){ lasso=drawing; onStatus("切り抜きました。"); } else onStatus("なぞる線が短すぎます。対象のまわりを一周なぞってください。"); drawing=null; syncEditUI(); drawEditor(); onChange(); } };
  ed.addEventListener("pointerup",endPtr); ed.addEventListener("pointercancel",endPtr);
  modeMove.addEventListener("click",()=>{mode="move";syncEditUI();});
  modeLasso.addEventListener("click",()=>{mode="lasso";syncEditUI();});
  clearLasso.addEventListener("click",()=>{lasso=null;syncEditUI();drawEditor();onChange();onStatus("切り抜きを消しました。");});
  zoom.addEventListener("input",e=>{view.zoom=+e.target.value;drawEditor();});
  zoom.addEventListener("change",()=>onChange());

  // 写真を替えると、位置・大きさ・切り抜きは最初に戻す
  function setPhoto(img){
    photo=img; view.zoom=1; view.offX=0; view.offY=0; lasso=null; drawing=null; drag=null;
    zoom.value=1; syncEditUI(); drawEditor();
  }
  function reset(){
    setPhoto(null); mode="move"; syncEditUI();
  }
  const getState=()=>({ photo, view:{...view}, lasso });

  syncEditUI(); drawEditor();
  return { setPhoto, reset, getState };
}
