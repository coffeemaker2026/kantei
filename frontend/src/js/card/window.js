// 写真窓：切り抜き・後光・スポットライト。写真の調整は 638×440 の基準の枠で行うので、
// 型ごとの窓ではその基準の枠を中央に置き、はみ出した部分や写真のない部分も描く
import { PW, PH, imgRect, pathOf, drawPhoto } from "../editor.js";
import { hexA } from "./draw-util.js";
import { drawEmblem } from "./emblems.js";

const GLOW = { SSR:"#FFF2B8", SR:"#F3D27A", R:"#DCE4F2", N:"#E8C9A0", Z:"#BDB5A6" };

// 基準の枠を窓の中央に置く。窓が小さければ縮め、大きければ等倍のまま
export function placeBase(win){
  const scale = Math.min(1, win.w / PW, win.h / PH);
  return { x: win.x + (win.w - PW * scale) / 2, y: win.y + (win.h - PH * scale) / 2, scale };
}
// 背景・後光・スポットライトを塗る範囲は、基準の枠ではなく窓全体
export const backgroundRect = win => ({ x: win.x, y: win.y, w: win.w, h: win.h });

function rays(ctx,cx,cy,color,alpha,n){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;for(let i=0;i<n;i++){const a=i*2*Math.PI/n;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,3000,a,a+Math.PI/n);ctx.closePath();ctx.fill();}ctx.restore();}
function bbox(lasso,r){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[ix,iy]of lasso){const x=r.x+ix*r.s,y=r.y+iy*r.s;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return{cx:(x0+x1)/2,cy:(y0+y1)/2,w:x1-x0,h:y1-y0};}

// 神界の背景（暗い紺のグラデーション）。Z は灰色寄り
function sky(ctx, b, cx, cy, isZ){
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(b.w, b.h) * .8);
  g.addColorStop(0, isZ ? "#8C8576" : "#3A4A8A"); g.addColorStop(1, isZ ? "#4F4A42" : "#0E1428");
  ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h);
}

// 写真の端が窓の内側に来るとき（窓が大きい型）、その端をぼかして神界の背景になじませる
const FEATHER = 80;
function drawFeathered(ctx, photo, r, b, gray){
  const pw = photo.width * r.s, ph = photo.height * r.s;
  const edges = [["left", r.x > b.x], ["right", r.x + pw < b.x + b.w], ["top", r.y > b.y], ["bottom", r.y + ph < b.y + b.h]].filter(e => e[1]);
  if (!edges.length){ drawPhoto(ctx, photo, r, gray); return; }
  const c = document.createElement("canvas"); c.width = Math.ceil(b.w); c.height = Math.ceil(b.h);
  const x = c.getContext("2d"); x.translate(-b.x, -b.y);
  drawPhoto(x, photo, r, gray);
  x.globalCompositeOperation = "destination-out";
  for (const [side] of edges){
    const [x0, y0, x1, y1] = { left:[r.x, 0, r.x + FEATHER, 0], right:[r.x + pw, 0, r.x + pw - FEATHER, 0], top:[0, r.y, 0, r.y + FEATHER], bottom:[0, r.y + ph, 0, r.y + ph - FEATHER] }[side];
    const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(b.x, b.y, b.w, b.h);
  }
  ctx.drawImage(c, b.x, b.y);
}

// place は基準の枠を置く範囲（省略時は窓）。SSR は文字の欄にかからないよう上に寄せる
export function renderWindow(ctx, rank, attr, { photo, view, lasso }, win, place = win){
  const base = placeBase(place), s = base.scale, isZ = rank === "Z", glow = GLOW[rank];
  ctx.save();
  ctx.beginPath(); ctx.rect(win.x, win.y, win.w, win.h); ctx.clip();
  // ここからは基準の枠の座標（0〜PW, 0〜PH）。b は窓全体をその座標で表したもの
  ctx.translate(base.x, base.y); ctx.scale(s, s);
  const bg = backgroundRect(win);
  const b = { x: (bg.x - base.x) / s, y: (bg.y - base.y) / s, w: bg.w / s, h: bg.h / s };
  const cx = PW / 2, cy = PH / 2, long = Math.max(b.w, b.h), short = Math.min(b.w, b.h);

  if (!photo){
    sky(ctx, b, cx, cy, isZ);
    rays(ctx, cx, cy, glow, isZ ? .06 : .16, isZ ? 12 : 24);
    drawEmblem(ctx, attr, cx, cy, b.h * .5, .25);
  } else if (lasso){
    const r = imgRect(photo, view), o = bbox(lasso, r);
    sky(ctx, b, o.cx, o.cy, isZ);
    rays(ctx, o.cx, o.cy, glow, isZ ? .06 : .16, isZ ? 12 : 24);
    const halo = ctx.createRadialGradient(o.cx, o.cy, 0, o.cx, o.cy, Math.max(o.w, o.h) * .85);
    halo.addColorStop(0, hexA(glow, isZ ? .15 : .6)); halo.addColorStop(1, hexA(glow, 0));
    ctx.fillStyle = halo; ctx.fillRect(b.x, b.y, b.w, b.h);
    // 切り抜いた写真を窓の大きさの一時 Canvas に描き、ふちを光らせて重ねる
    const c = document.createElement("canvas"); c.width = Math.ceil(b.w); c.height = Math.ceil(b.h);
    const x = c.getContext("2d"); x.translate(-b.x, -b.y);
    drawPhoto(x, photo, r, isZ); x.globalCompositeOperation = "destination-in"; x.beginPath(); pathOf(x, lasso, r); x.fill();
    ctx.save(); ctx.shadowColor = hexA(glow, isZ ? .3 : .95); ctx.shadowBlur = (isZ ? 10 : 40) * s; ctx.drawImage(c, b.x, b.y); ctx.restore();
    ctx.drawImage(c, b.x, b.y);
  } else {
    // 写真が届かない部分のために、先に神界の背景を塗る
    sky(ctx, b, cx, cy, isZ);
    drawFeathered(ctx, photo, imgRect(photo, view), b, isZ);
    ctx.save(); ctx.globalCompositeOperation = "screen"; rays(ctx, cx, cy, glow, isZ ? .04 : .10, 24); ctx.restore();
    const v = ctx.createRadialGradient(cx, cy, short * .22, cx, cy, long * .62);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, isZ ? "rgba(40,36,30,.6)" : "rgba(5,8,25,.75)");
    ctx.fillStyle = v; ctx.fillRect(b.x, b.y, b.w, b.h);
    if (rank === "SSR" || rank === "SR"){
      ctx.save(); ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, long * .5);
      g.addColorStop(0, hexA(glow, .28)); g.addColorStop(1, hexA(glow, 0));
      ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.restore();
    }
  }
  ctx.restore();
}
