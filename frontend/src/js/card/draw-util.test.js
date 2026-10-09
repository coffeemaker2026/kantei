import { describe, it, expect } from "vitest";
import { fitFont, fitLines, hexA } from "./draw-util.js";

// 仮の ctx：font の "<N>px ..." から N を読み、1文字を N の幅として測る
function fakeCtx(){
  let size = 10;
  return {
    get font(){ return this._font; },
    set font(v){ this._font = v; size = parseInt(v, 10); },
    measureText: t => ({ width: [...t].length * size }),
  };
}

describe("draw-util", () => {
  it("fitFont：収まる大きさまで縮める", () => {
    const ctx = fakeCtx();
    expect(fitFont(ctx, "あ".repeat(10), "F", 58, 32, 480)).toBe(48); // 10×48=480
    expect(ctx.font).toBe("48px F");
  });
  it("fitFont：最小でも収まらなければ最小を返す（長い品名の Z）", () => {
    expect(fitFont(fakeCtx(), "ただの" + "あ".repeat(16), "F", 58, 32, 480)).toBe(32);
  });
  it("fitLines：短い文は 29px のまま", () => {
    const r = fitLines(fakeCtx(), "あ".repeat(40), "F", { width: 638, maxLines: 4, max: 29, min: 24 });
    expect(r.size).toBe(29); expect(r.lines.length).toBe(2);
  });
  it("fitLines：長い文は縮めて4行に収める", () => {
    const r = fitLines(fakeCtx(), "あ".repeat(100), "F", { width: 638, maxLines: 4, max: 29, min: 24 });
    expect(r.size).toBeLessThan(29); expect(r.size).toBeGreaterThanOrEqual(24);
    expect(r.lines.length).toBeLessThanOrEqual(4); expect(r.lines.join("")).toBe("あ".repeat(100));
  });
  it("fitLines：24px でも収まらなければ4行で切る", () => {
    const r = fitLines(fakeCtx(), "あ".repeat(200), "F", { width: 638, maxLines: 4, max: 29, min: 24 });
    expect(r.size).toBe(24); expect(r.lines.length).toBe(4);
  });
  it("hexA", () => { expect(hexA("#D4B05A", 0.5)).toBe("rgba(212,176,90,0.5)"); });
});
