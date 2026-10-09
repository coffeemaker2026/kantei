// 属性の紋。色の丸の中に白い図形を描く。図形は 44×44 の SVG パス（見本 attr-emblem.html と同じ）
// fill: true は塗り、width は線の太さ（丸い線端）

const W = "#fff";
export const EMBLEMS = {
  "雷": { color: "#C9A227", ink: W, parts: [{ d: "M24 8 L13 25 H21 L18 36 L31 18 H23 Z", fill: true }] },
  "炎": { color: "#C8462E", ink: W, parts: [{ d: "M22 9 C27 16 31 20 31 26 A9 9 0 0 1 13 26 C13 21 17 19 18 14 C20 18 21 19 22 20 C23 16 23 12 22 9 Z", fill: true }] },
  "水": { color: "#2F6FB0", ink: W, parts: [{ d: "M22 9 C26 16 31 21 31 26 A9 9 0 0 1 13 26 C13 21 18 16 22 9 Z", fill: true }] },
  "風": { color: "#3E9A7A", ink: W, parts: [{ d: "M10 17 H26 A4 4 0 1 0 22 13 M10 23 H31 A4 4 0 1 1 27 27 M10 29 H20", width: 3 }] },
  "土": { color: "#8A6440", ink: W, parts: [{ d: "M9 31 L18 15 L23 23 L27 18 L35 31 Z", fill: true }] },
  "闇": { color: "#4B3A78", ink: W, parts: [{ d: "M26 10 A12 12 0 1 0 32 30 A10 10 0 1 1 26 10 Z", fill: true }] },
  "光": { color: "#E8C860", ink: "#3A2A08", parts: [
    { d: "M28 22 A6 6 0 1 1 16 22 A6 6 0 1 1 28 22 Z", fill: true },
    { d: "M22 9v4M22 31v4M9 22h4M31 22h4M13 13l3 3M28 28l3 3M31 13l-3 3M16 28l-3 3", width: 2.5 },
  ] },
  "無": { color: "#7A808E", ink: W, parts: [{ d: "M31 22 A9 9 0 1 1 13 22 A9 9 0 1 1 31 22 Z", width: 3 }] },
  "生活": { color: "#A89A84", ink: W, parts: [
    { d: "M13 18 H29 V24 A6 6 0 0 1 23 30 H19 A6 6 0 0 1 13 24 Z", fill: true },
    { d: "M29 20 h2 a3 3 0 0 1 0 6 h-2", width: 2.5 },
    { d: "M18 11 q2 2 0 4 M23 10 q2 2 0 4", width: 2 },
  ] },
};

// 直径 size の紋を (cx, cy) を中心に描く。Path2D はここで作る（Vitest の node 環境で読み込めるように）
export function drawEmblem(ctx, attr, cx, cy, size, alpha = 1){
  const e = EMBLEMS[attr] || EMBLEMS["無"], k = size / 44;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(k, k);
  ctx.beginPath(); ctx.arc(22, 22, 20, 0, Math.PI * 2);
  ctx.fillStyle = e.color; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.stroke();
  ctx.fillStyle = e.ink; ctx.strokeStyle = e.ink; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const p of e.parts){
    const path = new Path2D(p.d);
    if (p.fill) ctx.fill(path); else { ctx.lineWidth = p.width; ctx.stroke(path); }
  }
  ctx.restore();
}
