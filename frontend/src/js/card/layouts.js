// カードの4つの型：Z（紙っぺら）／N・R（標準）／SR（金装飾）／SSR（写真全面）
// 型が持つのは写真窓の位置・色の一式・地と枠・小物・判子だけ。名前と情報欄の位置は info.js で共通
import { hash, rng } from "../appraise.js";
import { rr } from "./draw-util.js";
import { D } from "./info.js";

const W = 750, H = 1050;

function gradientFrame(ctx, colors){
  const g = ctx.createLinearGradient(0, 0, W, H);
  colors.forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col));
  rr(ctx, 0, 0, W, H, 34); ctx.fillStyle = g; ctx.fill();
}
function panel(ctx, color){ rr(ctx, 25, 25, W - 50, H - 50, 20); ctx.fillStyle = color; ctx.fill(); }
function winLine(ctx, win, color, width){ ctx.lineWidth = width; ctx.strokeStyle = color; rr(ctx, win.x, win.y, win.w, win.h, 6); ctx.stroke(); }

// 判子：右上。fill は色か (ctx, r) => 塗り
function stamp(ctx, rank, { r, fill, ring, ink, alpha = 1, shadow = null, dashed = false }){
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(W - 40 - r, 40 + r - 5); ctx.rotate(-0.14);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  if (fill){ ctx.fillStyle = typeof fill === "function" ? fill(ctx, r) : fill; ctx.fill(); }
  ctx.lineWidth = 4; ctx.strokeStyle = ring; if (dashed) ctx.setLineDash([10, 6]);
  ctx.beginPath(); ctx.arc(0, 0, r - 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (shadow){ ctx.shadowColor = shadow; ctx.shadowBlur = 8; }
  const size = rank.length > 2 ? r * .62 : rank.length > 1 ? r * .74 : r * .92;
  ctx.font = `${Math.round(size)}px ${D}`; ctx.fillText(rank, 0, 4);
  ctx.restore();
}
const RAINBOW = ["#E85D75", "#F0B84A", "#6CC7A0", "#5A8FE0", "#A66FD8"];

/* ---------- Z：紙っぺら ---------- */
const paper = {
  win: { x:100, y:185, w:550, h:440 },
  colors: () => ({ name:"#3E3A33", sub:"#6E685D", text:"#3E3A33", label:"#5A5448", bar:"#7D7465", barBg:"rgba(0,0,0,.12)", loreBg:"rgba(0,0,0,.07)", loreBorder:null, nameGlow:null }),
  drawFrame(ctx){
    rr(ctx, 0, 0, W, H, 34); ctx.fillStyle = "#CFC4AE"; ctx.fill();
    ctx.save(); rr(ctx, 0, 0, W, H, 34); ctx.clip();
    ctx.fillStyle = "#C6BAA2"; for (let y = 6; y < H; y += 10) ctx.fillRect(0, y, W, 2); // 再生紙のすじ
    ctx.restore();
    ctx.save(); ctx.setLineDash([16, 10]); ctx.lineWidth = 5; ctx.strokeStyle = "#A89A84"; rr(ctx, 14, 14, W - 28, H - 28, 24); ctx.stroke(); ctx.restore();
  },
  drawDeco(ctx){
    winLine(ctx, this.win, "#8C8576", 2);
    ctx.save(); ctx.translate(W / 2, this.win.y); ctx.rotate(-0.07); // セロハンテープ
    ctx.fillStyle = "rgba(255,255,240,.55)"; ctx.fillRect(-75, -22, 150, 44);
    ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1; ctx.strokeRect(-75, -22, 150, 44);
    ctx.restore();
  },
  drawStamp(ctx, card){ stamp(ctx, card.rank, { r:65, fill:null, ring:"#6E685D", ink:"#6E685D", alpha:.7, dashed:true }); },
};

/* ---------- N・R：標準（N は銅、R は銀） ---------- */
const METAL = {
  N: { frame:["#6B4A2F","#B98A5C","#7A5636"], light:"#D9AE80" },
  R: { frame:["#6F7888","#E3E7EE","#8E96A4","#D5DAE3"], light:"#D5DAE3" },
};
const metalOf = rank => METAL[rank] || METAL.R;
const standard = {
  win: { x:56, y:184, w:638, h:440 },
  colors: rank => ({ name:"#F1EAD8", sub:metalOf(rank).light, text:"#F1EAD8", label:metalOf(rank).light, bar:metalOf(rank).light, barBg:"rgba(255,255,255,.15)", loreBg:"rgba(255,255,255,.06)", loreBorder:null, nameGlow:null }),
  drawFrame(ctx, card){ gradientFrame(ctx, metalOf(card.rank).frame); panel(ctx, "#16203A"); },
  drawDeco(ctx, card){ winLine(ctx, this.win, metalOf(card.rank).light, 4); },
  drawStamp(ctx, card){ stamp(ctx, card.rank, { r:65, fill:"#B8372B", ring:"rgba(255,255,255,.75)", ink:"#fff" }); },
};

/* ---------- SR：金装飾 ---------- */
const gold = {
  win: { x:25, y:170, w:700, h:480 },
  colors: () => ({ name:"#F3DC8C", sub:"#E6C66A", text:"#F1EAD8", label:"#E6C66A", bar:"#E6C66A", barBg:"rgba(255,255,255,.18)", loreBg:"rgba(243,220,140,.08)", loreBorder:"rgba(243,220,140,.3)", nameGlow:"rgba(243,210,122,.7)" }),
  drawFrame(ctx){ gradientFrame(ctx, ["#8A6A22","#F3DC8C","#9C7A2C","#F3DC8C","#8A6A22"]); panel(ctx, "#16203A"); },
  drawDeco(ctx){
    const { x, y, w, h } = this.win;
    ctx.fillStyle = "#E6C66A"; ctx.fillRect(x, y - 2, w, 5); ctx.fillRect(x, y + h - 3, w, 5);
    // 写真窓の上の角に金の飾り
    ctx.save(); ctx.strokeStyle = "#F3DC8C"; ctx.lineWidth = 7; ctx.lineCap = "square";
    for (const [cx, dx] of [[x + 12, 1], [x + w - 12, -1]]){
      ctx.beginPath(); ctx.moveTo(cx, y + 70); ctx.lineTo(cx, y + 12); ctx.lineTo(cx + dx * 58, y + 12); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + dx * 22, y + 34, 6, 0, Math.PI * 2); ctx.fillStyle = "#F3DC8C"; ctx.fill();
    }
    ctx.restore();
  },
  drawStamp(ctx, card){
    stamp(ctx, card.rank, { r:65, ring:"#FFF6D0", ink:"#3A2A08",
      fill:(c, r) => { const g = c.createRadialGradient(0, -r * .3, 4, 0, 0, r); g.addColorStop(0, "#FFF2B8"); g.addColorStop(.5, "#F3DC8C"); g.addColorStop(1, "#9C7A2C"); return g; } });
  },
};

/* ---------- SSR：写真全面 ---------- */
const full = {
  win: { x:25, y:25, w:700, h:1000 },
  place: { x:25, y:25, w:700, h:630 }, // 写真の中心は情報欄より上（下は暗くして文字を重ねるため）
  colors: () => ({ name:"#FFFFFF", sub:"#FFFFFF", text:"#FFFFFF", label:"#F3DC8C", barBg:"rgba(255,255,255,.2)", loreBg:"rgba(255,255,255,.08)", loreBorder:null, nameGlow:"#F0B84A",
    bar:(ctx, x, w) => { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, "#F0B84A"); g.addColorStop(.5, "#E85D75"); g.addColorStop(1, "#A66FD8"); return g; } }),
  drawFrame(ctx, card){
    gradientFrame(ctx, RAINBOW);
    const r = rng(hash(card.serial)); ctx.fillStyle = "rgba(255,255,255,.8)";
    for (let i = 0; i < 40; i++){ const x = r() * W, y = r() * H; if (x > 30 && x < W - 30 && y > 30 && y < H - 30) continue; ctx.beginPath(); ctx.arc(x, y, r() * 3 + 1, 0, Math.PI * 2); ctx.fill(); }
    panel(ctx, "#0A0E22");
  },
  drawDeco(ctx, card){
    const { x, y, w, h } = this.win, top = y + h * .38;
    // 下 62% を暗くして文字を読めるようにする
    const g = ctx.createLinearGradient(0, top, 0, y + h);
    g.addColorStop(0, "rgba(8,10,28,0)"); g.addColorStop(.32, "rgba(8,10,28,.88)"); g.addColorStop(1, "rgba(8,10,28,.92)");
    ctx.save(); rr(ctx, x, y, w, h, 20); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(x, top, w, y + h - top);
    // 写真の上の粒の光
    const r = rng(hash("spark" + card.serial));
    ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 12;
    for (let i = 0; i < 12; i++){ ctx.beginPath(); ctx.arc(x + 20 + r() * (w - 40), y + 180 + r() * 380, r() * 3 + 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  drawStamp(ctx, card){
    stamp(ctx, card.rank, { r:75, ring:"#fff", ink:"#fff", shadow:"rgba(0,0,0,.6)",
      fill:(c, r) => {
        if (!c.createConicGradient){ const g = c.createLinearGradient(-r, -r, r, r); RAINBOW.forEach((col, i) => g.addColorStop(i / 4, col)); return g; }
        const g = c.createConicGradient(0, 0, 0); [...RAINBOW, RAINBOW[0]].forEach((col, i) => g.addColorStop(i / 5, col)); return g;
      } });
  },
};

export const LAYOUTS = { paper, standard, gold, full };
const BY_RANK = { Z: paper, N: standard, R: standard, SR: gold, SSR: full };
export const layoutOf = rank => BY_RANK[rank];
