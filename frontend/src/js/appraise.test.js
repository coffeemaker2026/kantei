import { describe, it, expect } from "vitest";
import golden from "./appraise.golden.json";
import { appraise, hash, CATEGORIES } from "./appraise.js";

describe("appraise", () => {
  it.each(golden.map(g => [`${g.input.name}/${g.input.category}/${g.input.appeals}`, g]))(
    "試作と同じ判定になる：%s", (_, g) => {
      expect(appraise(g.input)).toEqual(g.output);
    });
  it("種類は試作の7つ", () => {
    expect(CATEGORIES).toEqual(["文房具","家電","台所用品","衣類・小物","ガジェット","食べ物","その他"]);
  });
  it("hash は FNV-1a", () => {
    expect(hash("")).toBe(2166136261);
  });
});
