# カードのデザインの作り直し 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5ランクとも同じ配置だったカードを、ランクで型が変わる4種類（Z／N・R／SR／SSR）に作り直し、属性の紋・写真なしの描き方・④のめくる演出を足す。

**Architecture:** `frontend/src/js/card.js` を `frontend/src/js/card/` の6ファイルに分ける。型（`layouts.js`）は写真窓の位置・色の一式・枠と小物と判子の描き方だけを持ち、名前と情報欄（`info.js`）は全型共通で1か所で描く。写真窓（`window.js`）は今の 638×440 の基準の枠を型ごとの窓の中央に置いて描く。演出は `main.js` が `.stage` にランクのクラスを付け、動きは `kantei.css` に書く。

**Tech Stack:** 素の JS（ES モジュール）・Canvas 2D・CSS、Vite 8、Vitest 5（environment は `node`。Canvas・Path2D はない）、Playwright（desktop と mobile＝Pixel 7）

**Spec:** [docs/superpowers/specs/2026-10-09-card-design-design.md](../specs/2026-10-09-card-design-design.md)

**画面見本：** `.superpowers/brainstorm/1735-1791530626/content/four-types.html`（型）、`attr-emblem.html`（紋。SVG のパスはここから写す）

## Global Constraints

- カードは 750×1050px の Canvas。`drawCard(card, photoState)` の引数と戻り値は今と同じ
- `appraise.js` の判定は変えない（`ATTRS` を export するだけ）。`appraise.test.js`・`appraise.golden.json` はそのまま通る
- `editor.js`（`PW=638`・`PH=440`・`imgRect`・切り抜きの座標）は変えない
- カード内の文字は 24px 以上（伝承文の縮小の下限も 24px）
- 4種類で共通：名前 x60・下端 y110・Zen Antique 最大 58px／最小 32px・幅 480px、（※元の名前）x62・下端 y150・26px、情報欄 x45〜705・y655〜1025、紋の直径 48px、属性・種別の行 26px、ステータスの項目名 26px・数値 35px 太字、伝承文 29px・4行まで、番号の行 24px
- 書体：名前・判子・「八百万神器鑑定所」は Zen Antique、それ以外は Zen Kaku Gothic New（今の `D`・`B` の指定のまま）
- 演出は CSS の transform・opacity・filter だけ。`prefers-reduced-motion: reduce` では出さない
- サイトの動作中に AI・サーバーを使わない。写真は外に送らない・保存しない
- 既存のカード（カードダスなど）に寄せない
- コミット・PR に Claude の名前を入れない（`.githooks/` が止める）。main に直接 push しない

## Review Focus

1. **長い品名の Z（「ただの」＋16文字＝19文字）**：32px まで縮めても幅 480px に収まらない。判子に重ならず、幅 480px に押し込んで描く（`fillText` の maxWidth を使う）（Task 1 でテスト）
2. **一番長い伝承文**：由来＋効果＋弱点で 90 字前後になる。4行・24px 以上に収まり、収まらなければ4行で切る（Task 1 でテスト）
3. **SSR のあとで異議を申し立てる**：前のランクのクラスが残らず、新しいランクのクラスだけが付く（Task 5 でテスト）
4. **Z のあとで「別の持ち物を鑑定する」**：傾いたままのカードが次の鑑定に持ち越されない（Task 5 でテスト）
5. **切り抜きありで SSR の全面の窓**：神界の背景・後光が窓全体を埋め、基準の枠の外に塗り残しが出ない（Task 3 で `backgroundRect` をテストし、Task 5 の5ランクの画像で目で確かめる）

---

## ファイルの分担

| ファイル | 役割 |
|---|---|
| `frontend/src/js/card/draw-util.js` | 角丸・色の透明度・名前の自動縮小・伝承文の折り返しと縮小 |
| `frontend/src/js/card/emblems.js` | 属性ごとの紋（SVG のパス文字列と色）と、紋を描く関数 |
| `frontend/src/js/card/window.js` | 写真窓：基準の枠の置き方、光の効果、写真なし |
| `frontend/src/js/card/layouts.js` | 4つの型とランクとの対応 |
| `frontend/src/js/card/info.js` | 名前・（※元の名前）・情報欄 |
| `frontend/src/js/card/index.js` | `drawCard`・`ensureFonts` |
| `frontend/src/js/card/*.test.js` | Vitest（Canvas を使わない部分） |
| `frontend/src/js/card.js` | 消す |
| `frontend/src/js/main.js` | 読み込み先の変更、`showCard()` の演出 |
| `frontend/src/css/kantei.css` | 演出の動き |
| `frontend/index.html` | `.stage` に `id="stage"` を付ける |
| `tests/card.spec.js` | Playwright：5ランクのカードと演出 |
| `CLAUDE.md` | カードの仕様とファイルの分担を新しくする |

---

### Task 1: 描画の道具（draw-util.js）

**Files:**
- Create: `frontend/src/js/card/draw-util.js`
- Test: `frontend/src/js/card/draw-util.test.js`

**Interfaces:**
- Produces:
  - `rr(ctx, x, y, w, h, rad): void`：角丸の形を作る（今の `card.js` の `rr` を移す）
  - `hexA(hex: string, a: number): string`：`"#RRGGBB"` → `"rgba(r,g,b,a)"`（今の `hexA` を移す）
  - `fitFont(ctx, text, family, max, min, width): number`：2px ずつ縮めて幅に収まる大きさを返し、`ctx.font` をその大きさにする。min でも収まらなければ min を返す
  - `fitLines(ctx, text, family, { width, maxLines, max, min }): { size: number, lines: string[] }`：max から 2px ずつ縮め、1文字ずつ折り返した行が maxLines 以内に収まる最大の大きさを返す。min でも収まらなければ min で折り返し、先頭 maxLines 行だけ返す。`ctx.font` はその大きさにする
  - `wrapLines(ctx, text, width): string[]`：今の `wrap` の折り返し部分（描かずに行を返す）

- [ ] **Step 1: 失敗するテストを書く**

`ctx` は仮のもの：`font` に代入された `"<N>px ..."` から N を読み、`measureText(t)` は `{ width: t.length * N }` を返す。

```js
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
```

- [ ] **Step 2: 失敗を確かめる**

Run: `npx vitest run frontend/src/js/card/draw-util.test.js`
Expected: FAIL（`draw-util.js` がない）

- [ ] **Step 3: `draw-util.js` を書く**（上の Interfaces どおり）

- [ ] **Step 4: 通ることを確かめる**

Run: `npx vitest run frontend/src/js/card/draw-util.test.js`
Expected: PASS（6件）

- [ ] **Step 5: コミット**

```bash
git add frontend/src/js/card/draw-util.js frontend/src/js/card/draw-util.test.js
git commit -m "feat: カードの描画の道具を card/draw-util.js に分ける"
```

---

### Task 2: 属性の紋（emblems.js）

**Files:**
- Create: `frontend/src/js/card/emblems.js`
- Modify: `frontend/src/js/appraise.js:19`（`const ATTRS` を `export const ATTRS` にする。中身・順番は変えない）
- Test: `frontend/src/js/card/emblems.test.js`

**Interfaces:**
- Produces:
  - `EMBLEMS: { [attr: string]: { color: string, ink: string, parts: Array<{ d: string, fill?: true, width?: number }> } }`：パスは見本 `attr-emblem.html` の SVG（44×44）のもの。`fill: true` は塗り、`width` は線（丸い線端）。`ink` は図形の色（光だけ `#3A2A08`、ほかは `#fff`）
  - `drawEmblem(ctx, attr, cx, cy, size, alpha = 1): void`：直径 `size` の色の丸（白い縁 不透明度 0.7）と図形を描く。Path2D はこの関数の中で作る（Vitest の node 環境で読み込めるように）

丸の色（設計書 6.1）：雷 `#C9A227`、炎 `#C8462E`、水 `#2F6FB0`、風 `#3E9A7A`、土 `#8A6440`、闇 `#4B3A78`、光 `#E8C860`、無 `#7A808E`、生活 `#A89A84`。

- [ ] **Step 1: 失敗するテストを書く**

```js
import { ATTRS } from "../appraise.js";
it("9つの属性すべてに紋がある", () => {
  expect(ATTRS).toEqual(["雷","炎","水","風","土","闇","光","無","生活"]);
  for (const a of ATTRS){ expect(EMBLEMS[a].parts.length).toBeGreaterThan(0); }
  expect(Object.keys(EMBLEMS).sort()).toEqual([...ATTRS].sort());
});
it("丸の色は設計書どおり", () => {
  expect(EMBLEMS["雷"].color).toBe("#C9A227"); expect(EMBLEMS["光"].ink).toBe("#3A2A08");
});
```

- [ ] **Step 2: 失敗を確かめる** — Run: `npx vitest run frontend/src/js/card/emblems.test.js` / Expected: FAIL

- [ ] **Step 3: `emblems.js` を書き、`ATTRS` を export する**

- [ ] **Step 4: 通ることを確かめる** — Run: `npm test` / Expected: PASS（判定のテストも含めてすべて）

- [ ] **Step 5: コミット**

```bash
git add frontend/src/js/card/emblems.js frontend/src/js/card/emblems.test.js frontend/src/js/appraise.js
git commit -m "feat: 属性の紋を足す"
```

---

### Task 3: 写真窓（window.js）

**Files:**
- Create: `frontend/src/js/card/window.js`
- Test: `frontend/src/js/card/window.test.js`

**Interfaces:**
- Consumes: `PW`・`PH`・`imgRect`・`pathOf`・`drawPhoto`（`editor.js`）、`hexA`（Task 1）、`drawEmblem`（Task 2）
- Produces:
  - `placeBase(win: {x,y,w,h}): { x, y, scale }`：基準の枠（PW×PH）を窓の中央に置く。`scale = Math.min(1, win.w / PW, win.h / PH)`、`x = win.x + (win.w - PW*scale)/2`、`y` も同じ
  - `backgroundRect(win): {x,y,w,h}`：背景・後光・スポットライトを塗る範囲。窓そのもの（基準の枠ではない）
  - `renderWindow(ctx, rank, attr, photoState, win): void`：窓で clip して描く。`photoState.photo` が null なら写真なし

描き方（今の `card.js` の `renderWindow` からの変更点だけ）：
- 背景のグラデーション・後光の筋・切り抜きなしのスポットライト（周囲を暗くする円）は `backgroundRect(win)` 全体に塗る。スポットライトの円の中心は窓の中央、半径は窓の大きさに比例させる（今の `PH*.22`〜`PW*.62` を、窓の短い辺・長い辺に置き換える）
- 写真・切り抜き・後光の中心（切り抜きの外接の箱）は、`placeBase` の位置に translate・scale してから今と同じ座標で描く。切り抜きの一時 Canvas は窓の大きさで作る
- 切り抜きなしのときも、写真の外側（写真が届かない部分）には先に神界の背景を塗っておく
- 写真なし：神界の背景＋後光の筋を塗り、窓の中央に `drawEmblem(ctx, attr, 中心, 窓の高さ×0.5, 0.25)`
- Z は背景を灰色寄り（今の `#8C8576`→`#4F4A42`）、写真は白黒寄り（今と同じ）

- [ ] **Step 1: 失敗するテストを書く**

```js
it("N・R の窓（638×440）では等倍でそのまま", () => {
  expect(placeBase({ x:56, y:184, w:638, h:440 })).toEqual({ x:56, y:184, scale:1 });
});
it("Z の窓（550×440）では縮める", () => {
  const p = placeBase({ x:100, y:185, w:550, h:440 });
  expect(p.scale).toBeCloseTo(550/638); expect(p.x).toBe(100);
  expect(p.y).toBeCloseTo(185 + (440 - 440*550/638)/2);
});
it("SR・SSR の窓では等倍で中央に置く", () => {
  expect(placeBase({ x:25, y:170, w:700, h:480 })).toEqual({ x:56, y:190, scale:1 });
  expect(placeBase({ x:25, y:25, w:700, h:1000 })).toEqual({ x:56, y:305, scale:1 });
});
it("背景は窓全体に塗る（SSR）", () => {
  expect(backgroundRect({ x:25, y:25, w:700, h:1000 })).toEqual({ x:25, y:25, w:700, h:1000 });
});
```

- [ ] **Step 2: 失敗を確かめる** — Run: `npx vitest run frontend/src/js/card/window.test.js` / Expected: FAIL

- [ ] **Step 3: `window.js` を書く**

- [ ] **Step 4: 通ることを確かめる** — Run: `npx vitest run frontend/src/js/card/window.test.js` / Expected: PASS（4件）

- [ ] **Step 5: コミット**

```bash
git add frontend/src/js/card/window.js frontend/src/js/card/window.test.js
git commit -m "feat: 型ごとの大きさに合わせて写真窓を描く"
```

---

### Task 4: 4つの型・情報欄・入口（layouts.js・info.js・index.js）

**Files:**
- Create: `frontend/src/js/card/layouts.js`、`frontend/src/js/card/info.js`、`frontend/src/js/card/index.js`
- Delete: `frontend/src/js/card.js`
- Modify: `frontend/src/js/main.js:8`（`from "./card.js"` → `from "./card/index.js"`）
- Test: `frontend/src/js/card/layouts.test.js`

**Interfaces:**
- Consumes: Task 1〜3 のすべて
- Produces:
  - `LAYOUTS: { paper, standard, gold, full }`。各型は `{ win: {x,y,w,h}, colors: { name, sub, text, label, bar, barBg, loreBg, loreBorder|null, nameGlow|null }, drawFrame(ctx, card), drawDeco(ctx, card), drawStamp(ctx, card) }`
    - `paper.win = {x:100,y:185,w:550,h:440}`、`standard.win = {x:56,y:184,w:638,h:440}`、`gold.win = {x:25,y:170,w:700,h:480}`、`full.win = {x:25,y:25,w:700,h:1000}`
    - `standard.drawFrame` は `card.rank` で枠の色を変える（N は今の `FRAMES.N`、R は `FRAMES.R`）。`full` の虹・粒の光は今の `FRAMES.SSR` と粒の描き方を使う
    - `full.drawDeco` は窓の下 62% に暗くするグラデーション（透明 → `rgba(8,10,28,.88)`、32% の位置で最も濃く）を重ねる
    - `bar` は色の文字列か、`full` だけ `(ctx, x, w) => CanvasGradient`（虹色）でもよい
  - `layoutOf(rank): Layout`：Z→paper、N・R→standard、SR→gold、SSR→full
  - `info.js`：`INFO = { x:45, y:655, w:660, h:370 }`、`drawName(ctx, card, colors): void`、`drawInfo(ctx, card, colors): void`
  - `index.js`：`drawCard(card, photoState): HTMLCanvasElement`、`ensureFonts(): Promise<void>`（今の `card.js` のものを移す）。描く順は drawFrame → `renderWindow(ctx, card.rank, card.attr, photoState, layout.win)` → drawDeco → drawName → drawStamp → drawInfo

型ごとの見た目は設計書 4.1 の表と見本 `four-types.html` に合わせる（見本は 0.4 倍なので、寸法は 2.5 倍する）。判子は右上、`full` だけ直径 150px、ほかは 130px。

名前は `fitFont(…, 58, 32, 480)` で大きさを決め、`ctx.fillText(title, 60, 110, 480)` と maxWidth を付けて描く（Review Focus 1）。伝承文は `fitLines(…, { width: 情報欄の伝承文の欄の内側の幅, maxLines: 4, max: 29, min: 24 })`。

- [ ] **Step 1: 失敗するテストを書く**

```js
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
```

- [ ] **Step 2: 失敗を確かめる** — Run: `npx vitest run frontend/src/js/card/layouts.test.js` / Expected: FAIL

- [ ] **Step 3: `layouts.js`・`info.js`・`index.js` を書き、`card.js` を消し、`main.js` の読み込み先を変える**

- [ ] **Step 4: Vitest とビルドが通ることを確かめる**

Run: `npm test && npm run build`
Expected: すべて PASS、ビルドがエラーなく終わる

- [ ] **Step 5: 既存の画面テストが通ることを確かめる**

Run: `npm run test:e2e:preview -- --workers=2`
Expected: すべて PASS（①の見本カード、④のカード 750×1050 など）

- [ ] **Step 6: 見た目を確かめる**

`npm run dev` で開き、①の見本カード3枚と、②で見本の写真（切り抜きあり・なし）を使った④のカードを、スマホ幅で目で見る。見本 `four-types.html` と大きく違うところ、文字の重なり・はみ出しがあれば直す。

- [ ] **Step 7: コミット**

```bash
git add -A frontend/src/js/card frontend/src/js/card.js frontend/src/js/main.js
git commit -m "feat: カードをランクで4種類の型に描き分ける"
```

---

### Task 5: ④のめくる演出

**Files:**
- Modify: `frontend/index.html:106`（`<div class="stage">` に `id="stage"`）
- Modify: `frontend/src/js/main.js`（`showCard()`、`newItem` の処理）
- Modify: `frontend/src/css/kantei.css`（④交付の部分）
- Test: `tests/card.spec.js`

**Interfaces:**
- Consumes: `drawCard`（Task 4）
- Produces: `#stage` に付くクラス `fx-ssr`・`fx-sr`・`fx-z`（R・N は付かない）

決まり（設計書 7章）：
- `showCard()` の最初に `fx-ssr`・`fx-sr`・`fx-z` を外し、`reveal` でランクのクラスを付ける。クラスは動きを減らす設定でも付ける（動きは CSS で止める）
- SR・SSR で動きを減らす設定でないときは、クラスを付けてから 400ms 待って `flipped` を付ける（その 400ms で裏面が震えて光る）
- めくった直後の光（`#stage::after` などで、SR は金 `#F3DC8C`、SSR は虹色）は、めくる動き 0.9 秒のあとに約 0.6 秒で消える
- Z は、めくる動きのあとに 0.5 秒かけて `#flipper` を `rotate(-3deg)` と少し下へ（`.flipped` の `rotateY(180deg)` と組み合わせる）。`forwards` で止める
- `@media (prefers-reduced-motion: reduce)` で、上の動きをすべて `animation: none` にし、Z の傾きも付けない
- 「別の持ち物を鑑定する」では3つのクラスを外す
- 再審（`flipped` を外して 650ms 後にめくり直す）のときも、最初にクラスを外す

- [ ] **Step 1: 失敗するテストを書く（`tests/card.spec.js`）**

補助：動きを減らす設定にして見本のマグカップで④まで進め、`#appeal` を押して `#count` が `再審 N 回目` になるのを待つことを、`#rankText` が目当てのランクになるまで繰り返す（上限 400 回）。動きを減らす設定では③が出ないので、1回は一瞬で終わる。

```js
for (const rank of ["Z","N","R","SR","SSR"]){
  test(`${rank} のカードが出て、演出のクラスが合っている`, async ({ page }, testInfo) => {
    await reachRank(page, rank);
    const cls = { SSR:"fx-ssr", SR:"fx-sr", Z:"fx-z" }[rank];
    const stage = page.locator("#stage");
    for (const c of ["fx-ssr","fx-sr","fx-z"]){
      if (c === cls) await expect(stage).toHaveClass(new RegExp(`\\b${c}\\b`));
      else await expect(stage).not.toHaveClass(new RegExp(`\\b${c}\\b`));
    }
    const src = await page.locator("#cardImg").getAttribute("src");
    await testInfo.attach(`card-${rank}.png`, { body: Buffer.from(src.split(",")[1], "base64"), contentType: "image/png" });
  });
}
test("Z のあとで別の持ち物を鑑定すると、演出のクラスが残らない", async ({ page }) => {
  await reachRank(page, "Z");
  await page.locator("#newItem").click();
  await expect(page.locator("#stage")).not.toHaveClass(/fx-/);
});
test("SSR のあとで異議を申し立てると、前のランクのクラスが残らない", async ({ page }) => {
  await reachRank(page, "SSR");
  // 再審でまた SSR になることがある（3%）ので、SSR 以外になるまで再審する
  await appealUntil(page, rank => rank !== "SSR");
  await expect(page.locator("#stage")).not.toHaveClass(/fx-ssr/);
});
test("動きを減らす設定では、演出の動きが出ない", async ({ page }) => {
  await reachRank(page, "Z");
  const anim = await page.locator("#flipper").evaluate(el => getComputedStyle(el).animationName);
  expect(anim).toBe("none");
});
```

補助の `reachRank(page, rank)` は `appealUntil(page, r => r === rank)` を使って書く。`appealUntil(page, pred)` は `#rankText` の「判定：」のあとの文字が `pred` を満たすまで再審を繰り返す（上限 400 回、超えたら失敗）。

- [ ] **Step 2: 失敗を確かめる**

Run: `npm run test:e2e:preview -- tests/card.spec.js --workers=2`
Expected: FAIL（`#stage` がない）

- [ ] **Step 3: `index.html`・`main.js`・`kantei.css` を変える**

- [ ] **Step 4: 通ることを確かめる**

Run: `npm run test:e2e:preview -- --workers=2`
Expected: `card.spec.js` を含めてすべて PASS

- [ ] **Step 5: 5ランクの画像と動きを目で確かめる**

`npm run test:report` で5ランクのカード画像を見る（Review Focus 5：SSR の窓に塗り残しがないこと）。`npm run dev` で SR・SSR・Z の動きをスマホ幅で見る。

- [ ] **Step 6: コミット**

```bash
git add frontend/index.html frontend/src/js/main.js frontend/src/css/kantei.css tests/card.spec.js
git commit -m "feat: SR・SSR はめくる前後に光り、Z はめくったあとしおれる"
```

---

### Task 6: CLAUDE.md を新しくする

**Files:**
- Modify: `CLAUDE.md`（「ファイルの分担」「カードの中身」「見た目と手続き」の④、「進行中の作業」）

- [ ] **Step 1: 書き換える**
  - ファイルの分担：`card.js` を `card/`（6ファイルの役割を1行ずつ）に置き換える
  - カードの中身：4種類の型、共通の位置、属性の紋、写真なしの描き方、写真窓の置き方（基準の枠を中央に置く）。設計書へのリンク
  - ④：SR・SSR・Z の演出
  - 進行中の作業：B は実装済み、次は A（言葉の部品）

- [ ] **Step 2: すべてのテストを流す**

Run: `npm test && npm run test:e2e:preview -- --workers=2`
Expected: すべて PASS

- [ ] **Step 3: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md をカードの新しいデザインに合わせる"
```
