import { describe, it, expect } from "vitest";
import { placeBase, backgroundRect } from "./window.js";

describe("写真窓", () => {
  it("N・R の窓（638×440）では等倍でそのまま", () => {
    expect(placeBase({ x:56, y:184, w:638, h:440 })).toEqual({ x:56, y:184, scale:1 });
  });
  it("Z の窓（550×440）では縮める", () => {
    const p = placeBase({ x:100, y:185, w:550, h:440 });
    expect(p.scale).toBeCloseTo(550/638); expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(185 + (440 - 440*550/638)/2);
  });
  it("SR・SSR の窓では等倍で中央に置く", () => {
    expect(placeBase({ x:25, y:170, w:700, h:480 })).toEqual({ x:56, y:190, scale:1 });
    expect(placeBase({ x:25, y:25, w:700, h:1000 })).toEqual({ x:56, y:305, scale:1 });
  });
  it("背景は窓全体に塗る（SSR）", () => {
    expect(backgroundRect({ x:25, y:25, w:700, h:1000 })).toEqual({ x:25, y:25, w:700, h:1000 });
  });
});
