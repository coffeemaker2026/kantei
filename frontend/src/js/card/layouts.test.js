import { describe, it, expect } from "vitest";
import { LAYOUTS, layoutOf } from "./layouts.js";
import { INFO } from "./info.js";

describe("カードの型", () => {
  it("5ランクすべてに型があり、N と R は同じ型", () => {
    expect(layoutOf("Z")).toBe(LAYOUTS.paper);
    expect(layoutOf("N")).toBe(LAYOUTS.standard);
    expect(layoutOf("R")).toBe(LAYOUTS.standard);
    expect(layoutOf("SR")).toBe(LAYOUTS.gold);
    expect(layoutOf("SSR")).toBe(LAYOUTS.full);
  });
  it("写真窓は設計書どおり", () => {
    expect(LAYOUTS.paper.win).toEqual({ x:100, y:185, w:550, h:440 });
    expect(LAYOUTS.standard.win).toEqual({ x:56, y:184, w:638, h:440 });
    expect(LAYOUTS.gold.win).toEqual({ x:25, y:170, w:700, h:480 });
    expect(LAYOUTS.full.win).toEqual({ x:25, y:25, w:700, h:1000 });
  });
  it("SSR 以外の窓は情報欄に重ならない", () => {
    for (const k of ["paper","standard","gold"]){ const w = LAYOUTS[k].win; expect(w.y + w.h).toBeLessThanOrEqual(INFO.y); }
  });
  it("情報欄は x45〜705・y655〜1025", () => {
    expect(INFO).toEqual({ x:45, y:655, w:660, h:370 });
  });
});

describe("SSR の写真の置き場所", () => {
  it("基準の枠は情報欄より上の範囲の中央に置く", () => {
    const p = LAYOUTS.full.place;
    expect(p).toEqual({ x:25, y:25, w:700, h:630 });
    expect(p.y + p.h).toBe(INFO.y);
  });
});
