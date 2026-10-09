// 鑑定カード（750×1050）の描画の入口。ランクから型を選び、
// 地と枠 → 写真窓 → 型の小物 → 名前 → 判子 → 情報欄 の順に描く
import { layoutOf } from "./layouts.js";
import { renderWindow } from "./window.js";
import { drawName, drawInfo } from "./info.js";

const W = 750, H = 1050;

// 書体を読み込んでから描く。読み込めない・時間がかかりすぎるときは端末の書体で描く
const FONT_TIMEOUT_MS = 2000;
export async function ensureFonts(){
  const load = Promise.all([document.fonts.load('40px "Zen Antique"'),document.fonts.load('24px "Zen Kaku Gothic New"'),document.fonts.load('700 24px "Zen Kaku Gothic New"')]);
  try { await Promise.race([load, new Promise(r => setTimeout(r, FONT_TIMEOUT_MS))]); } catch(_) {}
}

// photoState.photo が null のときは写真なし（窓に属性の紋を薄く描く）
export function drawCard(card, photoState){
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const layout = layoutOf(card.rank), colors = layout.colors(card.rank);
  layout.drawFrame(ctx, card);
  renderWindow(ctx, card.rank, card.attr, photoState, layout.win, layout.place);
  layout.drawDeco(ctx, card);
  drawName(ctx, card, colors);
  layout.drawStamp(ctx, card);
  drawInfo(ctx, card, colors);
  return c;
}
