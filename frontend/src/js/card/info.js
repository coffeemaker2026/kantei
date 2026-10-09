// 4種類の型で共通の部分：名前・（※元の名前）・情報欄（属性・ステータス・伝承文・番号）
// 位置はここだけで決める（型で変えない。並べたときに比べやすくするため）
import { rr, fitFont, fitLines } from "./draw-util.js";
import { drawEmblem } from "./emblems.js";

export const D = '"Zen Antique","Hiragino Mincho ProN",serif', B = '"Zen Kaku Gothic New","Hiragino Sans",sans-serif';
export const INFO = { x:45, y:655, w:660, h:370 };
const NAME_W = 480;

export function drawName(ctx, card, c){
  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = c.name;
  if (c.nameGlow){ ctx.shadowColor = c.nameGlow; ctx.shadowBlur = 18; }
  fitFont(ctx, card.title, D, 58, 32, NAME_W);
  ctx.fillText(card.title, 60, 110, NAME_W); // 最小でも収まらない長い名前は横に詰める
  ctx.restore();
  if (card.sub){
    ctx.save(); ctx.font = `26px ${B}`; ctx.fillStyle = c.sub;
    if (c.nameGlow){ ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 6; }
    ctx.fillText(card.sub, 62, 150, NAME_W); ctx.restore();
  }
}

export function drawInfo(ctx, card, c){
  const { x, y, w } = INFO;
  ctx.save(); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

  // 属性・種別
  drawEmblem(ctx, card.attr, x + 24, y + 24, 48);
  ctx.font = `26px ${B}`; ctx.fillStyle = c.label;
  ctx.fillText(`属性：${card.attr}　種別：${card.category}`, x + 62, y + 34);

  // ステータス（2列×2段）
  card.stats.forEach(([k, v], i) => {
    const sx = x + (i % 2) * 345, sy = y + 92 + Math.floor(i / 2) * 50;
    ctx.font = `26px ${B}`; ctx.fillStyle = c.text; ctx.fillText(k, sx, sy);
    ctx.fillStyle = c.barBg; rr(ctx, sx + 140, sy - 17, 110, 14, 7); ctx.fill();
    ctx.fillStyle = typeof c.bar === "function" ? c.bar(ctx, sx + 140, 110) : c.bar;
    rr(ctx, sx + 140, sy - 17, Math.max(8, 110 * v / 100), 14, 7); ctx.fill();
    ctx.font = `700 35px ${B}`; ctx.fillStyle = c.text; ctx.textAlign = "right"; ctx.fillText(v, sx + 315, sy + 2); ctx.textAlign = "left";
  });

  // 伝承文：29px・4行まで。収まらなければ 24px まで縮め、それでも収まらなければ4行で切る
  const ly = y + 157, lh = 170;
  ctx.fillStyle = c.loreBg; rr(ctx, x, ly, w, lh, 10); ctx.fill();
  if (c.loreBorder){ ctx.lineWidth = 2; ctx.strokeStyle = c.loreBorder; rr(ctx, x, ly, w, lh, 10); ctx.stroke(); }
  const { size, lines } = fitLines(ctx, card.lore, B, { width: w - 36, maxLines: 4, max: 29, min: 24 });
  ctx.fillStyle = c.text;
  lines.forEach((l, i) => ctx.fillText(l, x + 18, ly + 18 + size + i * Math.round(size * 1.32)));

  // 番号・鑑定所
  ctx.font = `24px ${B}`; ctx.fillStyle = c.label;
  ctx.fillText(`No.${card.serial}`, x + 4, y + 362);
  ctx.textAlign = "right"; ctx.font = `26px ${D}`; ctx.fillText("八百万神器鑑定所", x + w - 4, y + 362);
  ctx.restore();
}
