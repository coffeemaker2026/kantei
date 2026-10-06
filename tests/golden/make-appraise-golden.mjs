// 試作（frontend/shinki-kantei.html）の判定をそのまま動かして記録を取る
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("frontend/shinki-kantei.html", "utf8");
const start = html.indexOf("/* ---------- deterministic randomness ---------- */");
const end = html.indexOf("// 写真の特徴");
const { appraise } = new Function(html.slice(start, end) + "\nreturn { appraise };")();

const NAMES = ["マグカップ", "ボールペン", "目覚まし時計", "靴下", "謎の石"];
const SIGS = ["0".repeat(64), "7".repeat(64), "01234567".repeat(8)];
const CATEGORIES = ["文房具", "家電", "台所用品", "衣類・小物", "ガジェット", "食べ物", "その他"];

const out = [];
for (const category of CATEGORIES)
  for (let appeals = 0; appeals < 3; appeals++)
    NAMES.forEach((name, i) => {
      const signature = SIGS[i % 3];
      out.push({
        input: { name, signature, category, appeals },
        output: appraise(name + "|" + signature, category, appeals, name),
      });
    });
writeFileSync("frontend/src/js/appraise.golden.json", JSON.stringify(out, null, 2) + "\n");
