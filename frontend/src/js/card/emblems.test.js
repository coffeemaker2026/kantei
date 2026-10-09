import { describe, it, expect } from "vitest";
import { ATTRS } from "../appraise.js";
import { EMBLEMS } from "./emblems.js";

describe("emblems", () => {
  it("9つの属性すべてに紋がある", () => {
    expect(ATTRS).toEqual(["雷","炎","水","風","土","闇","光","無","生活"]);
    for (const a of ATTRS){ expect(EMBLEMS[a].parts.length).toBeGreaterThan(0); }
    expect(Object.keys(EMBLEMS).sort()).toEqual([...ATTRS].sort());
  });
  it("丸の色は設計書どおり", () => {
    expect(EMBLEMS["雷"].color).toBe("#C9A227"); expect(EMBLEMS["光"].ink).toBe("#3A2A08");
  });
});
