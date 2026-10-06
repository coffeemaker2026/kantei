# サイトデザインの作り直し 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1ファイルの試作 `frontend/shinki-kantei.html` を、Vite でビルドする4ページ構成（①受付→②申請→③審査→④交付の手続き画面＋読み物3ページ）に作り直す。判定とカードの絵柄は変えない。

**Architecture:** `frontend/` を Vite の root にし、`index.html`・`about.html`・`privacy.html`・`contact.html` を入口に登録する。JS は ES モジュールに分け、判定（`appraise.js`）は DOM に触れない純粋な関数にして Vitest で試作との一致を確かめる。①〜④は `index.html` の中の4つの `<section>` を `main.js` が URL のハッシュで切り替える。

**Tech Stack:** Vite 8（`^8.3.3`。設計書の 8.3.2 より新しい版が 2026年10月6日時点で出ている）、Vitest 5（`^5.0.3`）、Playwright（`^1.63.0`、今のまま）、nginx 1.28.3（今のまま）、素の JS・CSS（フレームワークなし）

**Spec:** [docs/superpowers/specs/2026-10-05-site-design-design.md](../specs/2026-10-05-site-design-design.md)

**画面見本：** `.superpowers/brainstorm/10768-1791185966/content/screens.html`（スマホ幅の見本。色・部品の形はこれに合わせる）

## Global Constraints

- サイトの動作中に AI もサーバーも使わない。外部への通信は Google Fonts だけ
- 写真は外に送らない・保存しない（`localStorage` などにも入れない）
- 「カードダス」の語・デザインを使わない。神社・寺院の見た目（鳥居・しめ縄など）に寄せない。笑いの対象は「お役所仕事」
- 判定（乱数の種・ランクの出やすさ SSR 3%・SR 10%・R 25%・N 40%・Z 22%・単語の表・再審回数のリセット条件）は試作と完全に同じ
- カードの描画（750×1050、枠・判子・写真窓・ステータス・伝承文）は試作の `draw()` / `renderWindow()` をそのまま移す
- 色（ダーク）：背景 `#141A2E`、文字 `#ECE6D6`、補助 `#A3A8BC`、金 `#D4B05A`、朱 `#B8372B`、紙 `#F4EEDC`、注意書きの黄 `#F7E36A`
- 色（ライト）：背景 `#E8E4D8`、文字 `#1B2340`、補助 `#4A5270`、金 `#7A5A16`（いずれも背景とのコントラスト比 5.0 以上を確認済み）。紙・注意書き・電光掲示板はダークと同じ色
- 朱 `#B8372B` は文字色に使わない（紺の上で 2.97:1）。白い文字を載せるボタンの地にだけ使う（5.8:1）
- 紙の上の文字：本文 `#1B2340`、補助 `#6B6450`（5.08:1）
- 書体：見出し・ボタン・申請書の題は Zen Antique、本文は Zen Kaku Gothic New（Google Fonts）。読み込めないときは端末の明朝体・ゴシック体
- テーマの切り替えは試作と同じ形（`@media (prefers-color-scheme: dark)` を `:root:not([data-theme="light"])` で、加えて `:root[data-theme="dark"]`）
- スマホ幅 360px 以上で横スクロールを出さない
- 文言はすべて日本語。ブラウザ標準の英語の部品（「Choose File」など）を見せない
- このフォルダは Git 管理になっていないので、Task 1 の最初に `git init` する

## Review Focus

1. **読み込めないファイルを添付したとき**：画像でないファイルや壊れた画像を選んでも②にとどまり、「この写真は読み込めませんでした。別の写真をお試しください。」が出る。すでに添付済みの写真があればそれは残る（Task 3 でテスト）
2. **③の途中で「戻る」を押したとき**：審査の待ち時間のタイマーが残って、②に戻ったあとで勝手に④へ飛ばない（Task 4 でテスト）
3. **再審のあとで品名・分類・写真を変えて申請し直したとき**：再審の回数がリセットされて「第一審」になる（Task 4 でテスト）
4. **「申請する」「異議を申し立てる」を素早く2回押したとき**：手続きは1回だけ進み、再審の回数は1つしか増えない（Task 4 でテスト）
5. **「別の持ち物を鑑定する」のあと**：前の写真が残っておらず、そのまま「申請する」を押すと品名と写真の両方の案内が出る（Task 4 でテスト）

---

## ファイルの分担

| ファイル | 役割 |
|---|---|
| `vite.config.js` | root を `frontend/`、出力を `frontend/dist/`、4ページを入口に。開発サーバーは `0.0.0.0:5173`。Vitest の対象は `src/**/*.test.js` だけ |
| `frontend/index.html` | 手続きの画面。①〜④の `<section>` |
| `frontend/about.html`・`privacy.html`・`contact.html` | 読み物3ページ。ヘッダー・フッターは4ページに同じ HTML を書く（テンプレートの仕組みは入れない） |
| `frontend/src/css/site.css` | 色・書体・ヘッダー・フッター・手続きの表示・紙・黄色い注意書き・ボタン・広告枠 |
| `frontend/src/css/kantei.css` | ①〜④だけで使うもの（扇形のカード・申請書の記入欄・写真の調整欄・電光掲示板・カードのめくれ） |
| `frontend/src/js/appraise.js` | 乱数と判定。DOM に触れない |
| `frontend/src/js/appraise.golden.json` | 試作で取った判定の記録 |
| `frontend/src/js/signature.js` | 写真の署名 |
| `frontend/src/js/editor.js` | 写真窓の座標計算と、写真の調整欄の操作 |
| `frontend/src/js/card.js` | カードの描画 |
| `frontend/src/js/samples.js` | 見本の写真 |
| `frontend/src/js/main.js` | 画面の切り替え・入力・エラー・審査の待ち時間・交付 |
| `frontend/src/js/page.js` | 読み物3ページ用の入口（`site.css` を読み込むだけ） |
| `tests/*.spec.js` | Playwright。`smoke.spec.js` は Task 2 で消す |

---

### Task 1: 判定を `appraise.js` に移し、試作と一致することを確かめる

**Files:**
- Create: `.gitignore` に追記、`vite.config.js`、`tests/golden/make-appraise-golden.mjs`、`frontend/src/js/appraise.golden.json`、`frontend/src/js/appraise.js`、`frontend/src/js/appraise.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces（`frontend/src/js/appraise.js`）:
  - `hash(str: string): number` — FNV-1a（試作の `hash` そのまま）
  - `rng(seed: number): () => number` — mulberry32（試作の `rng` そのまま）
  - `CATEGORIES: string[]` — `["文房具","家電","台所用品","衣類・小物","ガジェット","食べ物","その他"]`（試作の `CORES` のキーの順）
  - `appraise({ name: string, signature: string, category: string, appeals: number }): Card`
  - `Card = { rank: "SSR"|"SR"|"R"|"N"|"Z", title: string, sub: string, attr: string, category: string, stats: [string, number][], lore: string, serial: string }`（試作の戻り値と同じ形）

- [ ] **Step 1: Git を始める**

```bash
cd /workspace
git init
git config --global --add safe.directory /workspace   # Windows のフォルダをマウントしているので所有者の警告が出る場合
printf 'frontend/dist/\n' >> .gitignore
git add -A && git commit -m "chore: 試作の状態を記録"
```
Expected: `git log --oneline` に1件。`node_modules/` などが入っていないこと（`git ls-files | grep -c node_modules` が 0）

- [ ] **Step 2: Vite と Vitest を入れ、`package.json` のスクリプトを書き換える**

```bash
npm install --save-dev vite@^8.3.3 vitest@^5.0.3
```
`scripts` を次にする（`test` は Vitest に変わる）：
```json
"dev": "vite",
"build": "vite build",
"preview": "vite preview",
"test": "vitest run",
"test:e2e": "playwright test",
"test:e2e:preview": "vite build && E2E_PREVIEW=1 playwright test",
"test:report": "playwright show-report"
```
`description` は「八百万神器鑑定所。frontend/ を Vite でビルドし、frontend/dist/ を静的配信する」に変える。

`vite.config.js`（この Task では Vitest の設定だけ。入口と開発サーバーは Task 2 で足す）：`defineConfig` を `vitest/config` から読み、`root: "frontend"`、`test: { include: ["src/**/*.test.js"], environment: "node" }`。`tests/` の Playwright のファイルを Vitest が拾わないようにするため、`include` は必ず指定する。

- [ ] **Step 3: 試作から判定の記録を取るスクリプトを書いて実行する**

`tests/golden/make-appraise-golden.mjs`：`frontend/shinki-kantei.html` を読み、`/* ---------- deterministic randomness ---------- */` から `// 写真の特徴` の直前までを切り出して `new Function(code + "\nreturn { appraise };")()` で試作の `appraise` をそのまま動かす。試作の呼び方は `appraise(name + "|" + signature, category, appeals, name)`。

入力の組み合わせ（105通り）：
```js
const NAMES = ["マグカップ", "ボールペン", "目覚まし時計", "靴下", "謎の石"];
const SIGS = ["0".repeat(64), "7".repeat(64), "01234567".repeat(8)];
// 7種類 × 再審 0〜2 × 名前5つ（名前 i には SIGS[i % 3] を組み合わせる）
```
出力は `frontend/src/js/appraise.golden.json` に `[{ "input": { name, signature, category, appeals }, "output": Card }, ...]` の形で、2スペースのインデントで書く。

Run: `node tests/golden/make-appraise-golden.mjs && node -e 'const g=require("./frontend/src/js/appraise.golden.json");console.log(g.length,[...new Set(g.map(x=>x.output.rank))].sort())'`
Expected: `105 [ 'N', 'R', 'SR', 'SSR', 'Z' ]`。5つのランクがそろわなければ、そろうまで `NAMES` に名前を足して作り直す（記録が全ランクの描き分けを含むようにするため）

- [ ] **Step 4: 失敗するテストを書く**

`frontend/src/js/appraise.test.js`：
```js
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
```

- [ ] **Step 5: テストが失敗することを確かめる**

Run: `npm test`
Expected: FAIL（`appraise.js` が見つからない）

- [ ] **Step 6: `frontend/src/js/appraise.js` を書く**

試作の 177〜235 行目（`hash`・`rng`・`pick`・`between`・単語の表・`fill`・`appraise`）を ES モジュールに移す。単語の表と計算の順番は1文字も変えない（乱数を引く順が変わると判定が変わる）。`appraise` は引数をオブジェクトにし、中で `seedText = name + "|" + signature`、`salt = appeals` として試作と同じ計算をする。

- [ ] **Step 7: テストが通ることを確かめる**

Run: `npm test`
Expected: すべて PASS（記録の件数＋2件。記録が105件なら107件）

- [ ] **Step 8: Commit**

```bash
git add .gitignore package.json package-lock.json vite.config.js tests/golden frontend/src/js
git commit -m "feat: 判定を appraise.js に分け、試作と同じ結果になることをテストで確かめる"
```

---

### Task 2: ビルドと配信の仕組み、4ページ共通の見た目、読み物3ページ

**Files:**
- Create: `frontend/index.html`（この Task では①の静的な見た目だけ）、`frontend/about.html`、`frontend/privacy.html`、`frontend/contact.html`、`frontend/src/css/site.css`、`frontend/src/css/kantei.css`（空でよい）、`frontend/src/js/page.js`、`frontend/src/js/main.js`（CSS の import だけ）、`frontend/public/favicon.svg`、`tests/pages.spec.js`
- Modify: `vite.config.js`、`playwright.config.js`、`nginx/default.conf`、`Dockerfile`、`compose.yml`、`.devcontainer/docker-compose.yml`、`.devcontainer/devcontainer.json`、`.devcontainer/post-create.sh`
- Delete: `tests/smoke.spec.js`（試作の画面用。新しい画面のテストは Task 3〜5 で書く）

**Interfaces:**
- Produces（4ページ共通の HTML。Task 3〜5 はこの形に合わせる）:
  - `<header class="site-header">` の中に `<a class="site-name" href="./">八百万神器鑑定所</a>` と、右側の札 `<span class="tag">`
  - `<footer class="site-footer">` の中に `about.html`・`privacy.html`・`contact.html` への3つのリンク（文言は「鑑定所について」「プライバシーポリシー・免責事項」「お問い合わせ」）
  - 部品のクラス：`.paper`（生成りの紙＋金の二重線）、`.notice`（黄色い注意書き。左に濃い線）、`.btn-primary`（朱の地＋白い明朝）、`.btn`（線だけのボタン）、`.slot`（広告枠などの空の枠）、`.visually-hidden`
- Produces（`playwright.config.js`）：`E2E_PREVIEW=1` のとき `vite preview` を `http://127.0.0.1:4173/` で立ててそこを見る。それ以外は今どおり `BASE_URL` か `http://web/`

- [ ] **Step 1: 失敗するテストを書く**

`tests/pages.spec.js`（CommonJS、今のテストと同じ書き方）：
```js
const pages = [
  ["/", /八百万神器鑑定所/],
  ["/about.html", /鑑定所について/],
  ["/privacy.html", /プライバシーポリシー/],
  ["/contact.html", /お問い合わせ/],
];
for (const [path, title] of pages) {
  test(`${path} が開き、ヘッダーとフッターが出る`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator(".site-header .site-name")).toHaveText("八百万神器鑑定所");
    await expect(page.locator(".site-footer a")).toHaveCount(3);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
test("鑑定所についてに、架空の団体であることとランクの出やすさが書いてある", async ({ page }) => {
  await page.goto("/about.html");
  await expect(page.locator("main")).toContainText("架空の団体");
  await expect(page.locator("main")).toContainText("SSR 3%");
});
test("お問い合わせは準備中と出る", async ({ page }) => {
  await page.goto("/contact.html");
  await expect(page.locator("main")).toContainText("お問い合わせ窓口は準備中です");
});
test("設定ファイルは配信されない", async ({ request }) => {
  for (const p of ["/vite.config.js", "/package.json", "/src/js/main.js"]) {
    expect((await request.get(p)).status()).toBe(404);
  }
});
```

- [ ] **Step 2: テストが失敗することを確かめる**

`playwright.config.js` を先に直す：`const preview = process.env.E2E_PREVIEW === "1";`、`baseURL` は `preview ? "http://127.0.0.1:4173/" : (process.env.BASE_URL || "http://web/")`、`preview` のときだけ `webServer: { command: "npx vite preview --port 4173 --strictPort --host 127.0.0.1", url: "http://127.0.0.1:4173/", reuseExistingServer: true }`。冒頭のコメントに「devcontainer を作り直すまで web コンテナは古い配信元を見ているので、それまでは `npm run test:e2e:preview` を使う」と書く。

Run: `npm run test:e2e:preview -- tests/pages.spec.js`
Expected: FAIL（`index.html` などがないのでビルドが失敗する）

- [ ] **Step 3: `vite.config.js` に入口と開発サーバーを足す**

`build: { outDir: "dist", emptyOutDir: true, rolldownOptions: { input: { index, about, privacy, contact } } }`（各値は `frontend/` の中の HTML の絶対パス。Vite 8 では `rollupOptions` ではなく `rolldownOptions`。ビルドで非推奨の警告が出たら名前を見直す）、`server: { host: "0.0.0.0", port: 5173, strictPort: true }`、`preview: { port: 4173 }`、`appType: "mpa"`（既定の `"spa"` のままだと、ないパスにも `index.html` を返して 404 にならず、nginx・S3 と振る舞いが変わる）。

- [ ] **Step 4: `site.css` を書く**

Global Constraints の色・書体・テーマの切り替えで作る。決まりごと：
- ヘッダー：紺の地、下に金の細線。`.site-name` は Zen Antique・金・字間 .08em。右の `.tag` は紙の地に紺の太字、金の枠（見本の `.tag`）
- `.steps`（手続きの表示）：`<ol>` の4つの `<li>` を横に等分。今の画面は `aria-current="step"` で金の地に紺の文字、終わった画面は `.done` で薄い色（見本の `.steps i.on` / `.done`）
- `main` は中央1列、最大幅 640px、左右の余白 16px
- `.paper`：紙 `#F4EEDC`、`border: 3px double #9A7426`、中の文字 `#1B2340`
- `.notice`：地 `#F7E36A`、文字 `#2B2B2B`、左に `4px solid #2B2B2B`
- `.btn-primary`：地 `#B8372B`、白、Zen Antique、字間 .3em、幅いっぱい。`.btn`：`1.5px solid` の線、文字色と同じ
- フォーカスの輪：`3px solid` 金、`outline-offset: 2px`（試作と同じ）
- `.slot`：`1px dashed` の補助色の線、`min-height: 90px`、中は空
- `.visually-hidden`：よく使われるクリップの書き方
- フッター：中央寄せ、補助色の小さい文字、3つのリンクを横に並べ、狭いときは折り返す

- [ ] **Step 5: 4つの HTML と入口の JS を書く**

- 4ページとも `<html lang="ja">`、試作と同じ `<meta viewport>`、Google Fonts の `<link>`（試作の 7〜9 行目）、`<link rel="icon" href="/favicon.svg">`。`index.html` は `<script type="module" src="/src/js/main.js">`、ほか3ページは `/src/js/page.js`。CSS は JS から `import "../css/site.css"`（`main.js` はさらに `kantei.css`）
- タイトル：`八百万神器鑑定所`、`鑑定所について｜八百万神器鑑定所`、`プライバシーポリシー・免責事項｜八百万神器鑑定所`、`お問い合わせ｜八百万神器鑑定所`
- 読み物3ページの右の札は「鑑定所について」へのリンク（about.html では「受付へ戻る」で `./` へ）。本文は `<main><article class="paper">` の中に置く
- `index.html` はこの Task では①の見出し・説明・「番号札を取る」・注意書きだけ置く（ボタンはまだ動かなくてよい。Task 3 で作り直す）
- `favicon.svg`：紺の丸に金の「鑑」の1文字
- 文章：
  - **about.html**：設計書 7章「鑑定所について」の5項目を、それぞれ見出し＋短い段落で。冒頭に「八百万神器鑑定所は、神様の役所に置かれた、持ち物を神器として鑑定する窓口です。」と「架空の団体で、実在の宗教・団体とは関係ありません。」。ランクの出やすさは `SSR 3%・SR 10%・R 25%・N 40%・Z 22%` と書き、ステータス4つ（攻撃力・神性・生活感・くたびれ度）を一言ずつ説明する
  - **privacy.html**：設計書 7章の4項目。広告の項は「現在、広告は掲載していません。今後、Google AdSense 等の広告配信を利用する予定で、その際は Cookie を使用することがあります。」。免責は「鑑定の結果は娯楽のためのもので、ご利益などの効果はありません。」を含める。最後に「制定日：（この Step を実装した日）」。冒頭に HTML コメントで「文案。公開前に運営者が確認する」と残す
  - **contact.html**：「お問い合わせ窓口は準備中です。」の1段落だけ。Google フォームの URL が決まったらリンクに差し替える旨を HTML コメントで残す

- [ ] **Step 6: 配信の設定を `frontend/dist/` に変える**

- `nginx/default.conf`：`index index.html;`。`location = /healthz { access_log off; return 204; }` を足す（`dist/` がまだ空でもコンテナを「正常」と判定させるため。空のまま `/` を見ると 403 になり、devcontainer の `workspace` が起動しなくなる）
- `Dockerfile`：`COPY frontend/dist/ /usr/share/nginx/html/`、HEALTHCHECK の URL を `http://127.0.0.1/healthz` に。先頭のコメントに「先に `npm run build` を実行しておく」と書く
- `compose.yml`：マウント元を `./frontend/dist` に。コメントも「ビルドし直したらブラウザの再読み込みで反映される」に直す
- `.devcontainer/docker-compose.yml`：`web` のマウント元を `../frontend/dist`、healthcheck を `http://127.0.0.1/healthz` に
- `.devcontainer/devcontainer.json`：`forwardPorts` に `5173` を足し、`portsAttributes` に `"5173": { "label": "神器鑑定所 (Vite 開発サーバー)", "onAutoForward": "notify" }`
- `.devcontainer/post-create.sh`：`npx playwright install` のあとに `npm run build`。最後の確認の文言は「http://web/ で配信中（npm run build の結果）」に

- [ ] **Step 7: テストが通ることを確かめる**

Run: `npm run test:e2e:preview -- tests/pages.spec.js`
Expected: desktop・mobile とも PASS。続けて `npm run build` の出力に警告がないこと、`ls frontend/dist` に4つの HTML と `assets/`・`favicon.svg` があることを確かめる

- [ ] **Step 8: Commit**

```bash
git rm tests/smoke.spec.js
git add -A frontend nginx Dockerfile compose.yml .devcontainer vite.config.js playwright.config.js tests/pages.spec.js
git commit -m "feat: Vite の4ページ構成と共通の見た目、読み物3ページを作る"
```

---

### Task 3: 画面の切り替えと ① 受付・② 申請

**Files:**
- Create: `frontend/src/js/signature.js`、`frontend/src/js/editor.js`、`frontend/src/js/samples.js`、`tests/apply.spec.js`
- Modify: `frontend/index.html`、`frontend/src/js/main.js`、`frontend/src/css/kantei.css`

**Interfaces:**
- Consumes: `CATEGORIES`（Task 1）、共通の部品クラス（Task 2）
- Produces:
  - `signature.js`：`signature(img: CanvasImageSource & {width, height}): string`（試作の 238〜244 行目のまま）
  - `editor.js`：
    - `PW = 638`、`PH = 440`
    - `imgRect(photo, view): { s, x, y }`、`pathOf(ctx, pts, r): void`、`drawPhoto(ctx, photo, r, gray: boolean): void`（試作の同名関数に、グローバルだった `photo`・`view` を引数で渡す形）
    - `createEditor({ canvas, modeMove, modeLasso, clearLasso, zoom, hint, onChange: () => void, onStatus: (msg: string) => void }): { setPhoto(img): void, reset(): void, getState(): PhotoState }`
    - `PhotoState = { photo, view: { zoom, offX, offY }, lasso: [number, number][] | null }`
    - `onChange` はドラッグを離したとき・切り抜きの確定／消去・大きさのスライダーの `change` で呼ぶ（試作で `refreshCard()` を呼んでいた所）
  - `samples.js`：`SAMPLES = { mug: { name: "マグカップ", category: "台所用品" }, pen: { name: "ボールペン", category: "文房具" }, clock: { name: "目覚まし時計", category: "家電" } }`、`drawSample(kind): HTMLCanvasElement`（試作の 417〜438 行目。800×600 の Canvas をそのまま返し、`Image` には変えない）
  - `index.html` の要素（Task 4・5 とテストが使う）：
    - `<body data-step="1|2|3|4">`（今の画面。`main.js` が書き換える）
    - `<section id="step-reception">`・`#step-apply`・`#step-review`・`#step-issue`。今の画面以外は `hidden`
    - 各 section の最初の見出しに `tabindex="-1"`（画面が変わったらそこへフォーカス）。①は `<h1>` 「その持ち物、神器かもしれない。」、②は `<h2>` 「神器鑑定申請書」、③は見えない `<h2>` 「審査中」、④は見えない `<h2>` 「鑑定カードの交付」
    - ヘッダーの札：①では `<a id="aboutTag" class="tag" href="about.html">鑑定所について</a>`、②〜④では `<span id="ticketTag" class="tag">受付番号 0427</span>`
    - ①：`#takeTicket`（番号札を取る）
    - ②：`<form id="applyForm" novalidate>`、`#itemName`（`maxlength="16"`、`aria-describedby="nameError"`）、`#nameError`、`#category`（`CATEGORIES` から作る）、`#photo`（`type=file`・`accept="image/*"`・`.visually-hidden`・`tabindex="-1"`）、`#attachPhoto`（写真を添付する、`aria-describedby="photoError"`）、`#photoError`、`#editorWrap`（試作と同じ中身と id：`#modeMove`・`#modeLasso`・`#editor`・`#editHint`・`#clearLasso`・`#zoom`）、`#applyStatus`（`role="status"`）、送信ボタン `#submitApply`（申請する）、`#showSamples`（見本で試す）、`#sampleList`（最初は `hidden`。中に `[data-sample="mug|pen|clock"]` の3つのボタン）
- `main.js` の画面の切り替え（ここで決める決まり）：
  - URL のハッシュで画面を表す：なし＝①、`#apply`＝②、`#review`＝③、`#issue`＝④
  - `go(step, { replace })`：①→②・②→③・②→④（動きを減らす設定）・④→③（再審）・④→②（別の持ち物）は `pushState`、③→④は `replaceState`。だから④で「戻る」を押すと②に戻る（③の待ち時間を見直す意味はないため）
  - `popstate` で画面を合わせる。ページを開いたとき・`popstate` のときに、③か④なのに判定済みのカードがなければ `replaceState` で②にする
  - 受付番号：ページを開いた時刻から `String(Date.now() % 10000).padStart(4, "0")`。判定には使わない

- [ ] **Step 1: 失敗するテストを書く**

`tests/apply.spec.js`（共通の下準備として `test.beforeEach` で `page.goto("/")`）：
- 「番号札を取ると②に進み、受付番号が出る」：`#takeTicket` を押す → `body` の `data-step` が `"2"`、`#ticketTag` が `/^受付番号 \d{4}$/`、`#aboutTag` が見えない、`#step-apply h2` にフォーカスがある
- 「ブラウザの戻るで①に戻る」：②に進んで `page.goBack()` → `data-step` が `"1"`
- 「②で再読み込みしても②のまま」：②で `page.reload()` → `data-step` が `"2"`
- 「品名と写真が空なら、両方の欄に案内が出て、品名にフォーカスが移る」：`#submitApply` → `#nameError` が「品名をご記入ください。」、`#photoError` が「現物写真を添付してください。」、`#itemName` にフォーカス、`#itemName` の `aria-invalid` が `"true"`
- 「品名だけ書くと、写真の案内が出て添付ボタンにフォーカスが移る」：`#itemName` に「ボールペン」→ `#submitApply` → `#nameError` が空、`#attachPhoto` にフォーカス
- 「見本で試すと品名・分類が入り、写真の調整欄が出る」：`#showSamples` → `[data-sample="pen"]` → `#itemName` が「ボールペン」、`#category` が「文房具」、`#editorWrap` が見える、`#photoError` が空
- 「画像でないファイルは読み込めないと案内し、前の写真は残る」（Review Focus 1）：見本の写真を選んだあと `#photo` に `{ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not an image") }` を `setInputFiles` → `#photoError` が「この写真は読み込めませんでした。別の写真をお試しください。」、`#editorWrap` は見えたまま
- 「ブラウザ標準のファイル選択は見えない」：`#photo` が `toBeHidden()` ではなく、`boundingBox()` の幅が 1 以下（`.visually-hidden`）。`#attachPhoto` は見える
- 「横スクロールが出ない」：②で見本を選んだ状態で確かめる

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npm run test:e2e:preview -- tests/apply.spec.js`
Expected: FAIL（`#takeTicket` などがない）

- [ ] **Step 3: `signature.js`・`editor.js`・`samples.js` を書く**

試作のコードを Interfaces の形に移す。`editor.js` の操作（ドラッグ・なぞる・切り抜きを消す・スライダー）と案内の文言は試作の 283〜312 行目のまま。試作の `status(...)` は `onStatus(...)` に、`refreshCard()` は `onChange()` に置き換える。

- [ ] **Step 4: `index.html` の①・②と `main.js` の切り替え・入力を書く**

- ①：見出し、説明「写真と名前を申請すると、神々が審査して鑑定カードを交付します。」、扇形のカードを置く空の `<div class="fan" id="fan">`（中身は Task 5）、`#takeTicket`、`.notice`「※ 写真はこの端末の中で使うだけで、どこにも送りません」、`<div class="slot" data-slot="ad">`
- ②：`.paper` の中に題「神器鑑定申請書」、`.form-no`「様式第8号（第3条関係）」、右上に朱の丸い判子「受付」（`aria-hidden="true"`。文字・枠とも `#B8372B`、紙の上なので 4.5:1 を満たす）、太枠の表で 品名・分類・現物写真。写真を添付すると同じ紙の中に「添付写真の調整」の見出しと `#editorWrap` を出す。紙の下に `.notice`「※ 太枠内をご記入ください」、`#submitApply`（文言は「申請する」）、小さく「写真がないときは」＋ `#showSamples`（文言は「見本で試す」）と `#sampleList`
- 写真の受け付け：`#attachPhoto` で `#photo.click()`。貼り付け・ドラッグ＆ドロップは試作の 411〜413 行目と同じく `document` で受け付け、②にいるときだけ使う。`type` が `image/` で始まらないファイルと、`Image` の `onerror` は、どちらも Review Focus 1 の案内にする（前の写真はそのまま）
- 読み込めたら `signature()` で署名を取り、`editor.setPhoto(img)`、`#photoError` を消す。`#applyStatus` に試作と同じ「写真を読み込みました。必要なら位置を調整するか、対象をなぞって切り抜いてください。」
- 見本：`drawSample(kind)` の Canvas をそのまま写真として使い、`SAMPLES[kind]` で品名と分類を入れ、`#nameError` も消す
- 送信：空の欄の案内を全部出し、DOM の順で最初の欄（品名→添付ボタン）にフォーカス。`aria-invalid` を付け外しする。品名を入力したら品名の案内を消す。どちらも満たしていれば③へ（③・④の中身は Task 4。この Task では `go(3)` まで）

- [ ] **Step 5: `kantei.css` に①・②の見た目を足す**

見本の `.paper .row`・`.row.thick`（太枠は `2px solid #1B2340`、項目名の地は `#E9DFC2`）・`.tools`（位置を動かす／なぞって切り抜くの切り替え。押されている方は紺の地に紙の色の文字）・`.stamp` に合わせる。写真の調整の Canvas は試作の `#editor` の決まり（`aspect-ratio: 638/440`、`touch-action: none`）を引き継ぐ。`.form-no` は補助 `#6B6450`。

- [ ] **Step 6: テストが通ることを確かめる**

Run: `npm run test:e2e:preview -- tests/apply.spec.js tests/pages.spec.js`
Expected: すべて PASS

- [ ] **Step 7: Commit**

```bash
git add frontend tests/apply.spec.js
git commit -m "feat: ①受付・②申請の画面と、画面の切り替えを作る"
```

---

### Task 4: ③ 審査・④ 交付と、試作の削除

**Files:**
- Create: `frontend/src/js/card.js`、`tests/flow.spec.js`
- Modify: `frontend/index.html`、`frontend/src/js/main.js`、`frontend/src/css/kantei.css`
- Delete: `frontend/shinki-kantei.html`、`tests/golden/`（記録は `appraise.golden.json` に残っているので、取り出しのスクリプトは要らなくなる）

**Interfaces:**
- Consumes: `appraise`・`hash`・`rng`（Task 1）、`PW`・`PH`・`imgRect`・`pathOf`・`drawPhoto`・`PhotoState`（Task 3）
- Produces（`card.js`）:
  - `ensureFonts(): Promise<void>` — 試作 453 行目の3つの `document.fonts.load`。失敗しても resolve する
  - `drawCard(card: Card, photoState: PhotoState): HTMLCanvasElement` — 750×1050。試作の `draw()`・`renderWindow()`・`rays`・`bbox`・`hexA`・`rr`・`fitFont`・`wrap`・`FRAMES`・`GLOW` をそのまま移し、グローバルだった `photo`・`view`・`lasso` は `photoState` から読む
- Produces（`index.html` の要素）：③は `#reviewNumber`（電光掲示板の数字）・`#reviewLines`・`#skipHint`、④は `#flipper`・`#front`・`#cardImg`・`#count`・`#rankText`・`#appeal`・`#save`・`#newItem`・`#issueStatus`（`role="status"`）・`<div class="slot" data-slot="ad">`・`<div class="slot" data-slot="affiliate">`
- `main.js` で決める値：
  - `REVIEW_LINES = ["神々が協議しています", "前例を確認しています…", "担当の神が席を外しています…"]`、1行あたり `1000` ms（計約3秒）
  - `APPEAL_LINE = "再審請求を受理しました"`、`1000` ms

- [ ] **Step 1: 失敗するテストを書く**

`tests/flow.spec.js`。下準備の関数 `applyWithSample(page, kind)`：①で `#takeTicket` → `#showSamples` → `[data-sample=kind]` → `#editorWrap` が見えるのを待つ → `#submitApply`。

- 「見本で申請すると③→④でカードが出る」：`data-step` が `"3"` になり `#reviewNumber` が `#ticketTag` の数字と同じ → 待つと `"4"`、`#cardImg` の `src` が `data:image/png`、`naturalWidth/Height` が `[750, 1050]`、`#count` が「第一審」、`#rankText` が `/^判定：(SSR|SR|R|N|Z)$/`
- 「③はタップで飛ばせる」：`data-step` が `"3"` になったら `page.mouse.click(10, 10)` → `{ timeout: 1500 }` 以内に `"4"`
- 「③はキーでも飛ばせる」：同じく `page.keyboard.press("Space")`
- 「動きを減らす設定では③を出さずに④になる」：`page.emulateMedia({ reducedMotion: "reduce" })`。①を開いたあと `page.evaluate` で `MutationObserver` を仕掛けて `body` の `data-step` の変化を `window.__steps` に記録 → 申請 → `"4"` を待つ → `window.__steps` に `"3"` がない
- 「異議を申し立てると再審の回数が増える」：④で `#appeal` → `"3"` を経て（`#reviewLines` に「再審請求を受理しました」）`"4"` → `#count` が「再審 1 回目」→ もう一度で「再審 2 回目」
- 「同じ写真・名前・種類なら、開き直しても同じ判定になる」：`pen` で④まで進んで `#cardImg` の `alt` を記録 → `page.goto("/")` からやり直す → 同じ `alt`
- 「④で戻ると②に戻る」：④で `page.goBack()` → `"2"`。品名は「ボールペン」のまま
- 「④で再読み込みすると②に戻る」：④で `page.reload()` → `"2"`
- 「③の途中で戻っても④に飛ばない」（Review Focus 2）：`"3"` になったらすぐ `page.goBack()` → `"2"` → `page.waitForTimeout(3500)` → まだ `"2"`
- 「品名を変えて申請し直すと第一審に戻る」（Review Focus 3）：④で再審1回 → `goBack()` で② → 品名を「ボールペン改」→ 申請 → `#count` が「第一審」
- 「異議を素早く2回押しても再審は1回だけ」（Review Focus 4）：④で `#appeal` を `dblclick()` → `"4"` に戻ったら `#count` が「再審 1 回目」
- 「別の持ち物を鑑定すると②が空になる」（Review Focus 5）：④で `#newItem` → `"2"`、`#itemName` が空、`#editorWrap` が見えない → `#submitApply` → `#nameError` と `#photoError` の両方が出る
- 「④でもヘッダーの札は受付番号」：`#ticketTag` が見える
- 「④で横スクロールが出ない」

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npm run test:e2e:preview -- tests/flow.spec.js`
Expected: FAIL（`#reviewNumber` などがない）

- [ ] **Step 3: `card.js` を書く**

試作の 247〜281 行目と 315〜392 行目を Interfaces の形に移す。描く内容は変えない。

- [ ] **Step 4: ③・④の HTML・CSS を書く**

- ③：電光掲示板 `.board`（地 `#0A0D18`、枠 `2px solid #3A4366`）に、小さく「ただいま審査中の番号」、`#reviewNumber`（等幅、`#FF6A3D`、`text-shadow: 0 0 12px #FF6A3D99`、大きく）、小さく「神界待合室でお待ちください」。その下に `#reviewLines`（今の行は明朝で本文色、出し終えた行は薄い色）、`.notice`「※ 審査の順番に関するお問い合わせにはお答えできません」、`#skipHint`「タップで飛ばせます」
- ④：試作の `.stage`・`.flipper`・`.face.back`・`.front`・`.holo` と、裏面の「神器鑑定所」をそのまま移す。カードの下に `#count` と `#rankText`。ボタンは `#appeal`（異議を申し立てる）と `#save`（画像を保存）を横に並べ、その下に `#newItem`（別の持ち物を鑑定する）。その下に広告枠、アフィリエイト枠
- ④の並び：幅 820px 以上では2列（左にカード、右にボタン・説明・枠）で、`main` の最大幅をこの画面だけ広げる（`body[data-step="4"] main` に試作の 35・39 行目の決まりを移す）。①〜③は 640px の1列のまま
- 動きを減らす設定では、めくれる動きとキラキラを出さない（試作 67 行目）

- [ ] **Step 5: `main.js` に審査と交付を書く**

- 状態：`lastKey`・`appeals`・`card`・`canvas`・`lastBlob`・`downloads`（試作の同名の変数と同じ役割）
- 申請・再審：`key = name + "|" + category + "|" + photoSig` で試作 450〜452 行目と同じ規則で `appeals` を決める → `await ensureFonts()` → `appraise({ name, signature: photoSig, category, appeals })` → `drawCard(card, editor.getState())`。判定と描画は③に入った時点で行い、待ち時間とは別に終わらせる
- 二重押し（Review Focus 4）：③に入ってから④を出し終えるまで `busy` にして、申請・再審のボタンを押しても何もしない
- 待ち時間：`matchMedia("(prefers-reduced-motion: reduce)").matches` なら③を飛ばして `go(4)`（`pushState`）。そうでなければ `go(3)` して `#reviewNumber` に受付番号、`REVIEW_LINES`（再審なら `APPEAL_LINE` だけ）を1行ずつ出し、終わったら `go(4, { replace: true })`。`pointerdown`（③の section 全体）か `keydown`（`document`、`e.repeat` は無視）で飛ばす。③を離れたら（飛ばした・`popstate`・④を出した）タイマーと飛ばす操作の受け付けを必ず止める（Review Focus 2）
- ④を出す：試作 457〜472 行目の `show()` と同じ（`#cardImg` の `src`・`alt`、`holo` の付け外し、めくれる演出、`#count`・`#rankText`、保存ボタンと案内）。`alt` の形も試作と同じ `${rank}ランク：${title}${sub}。${lore}`
- 写真の調整を④のあとで変えた場合：`createEditor` の `onChange` で、`card` があれば `drawCard` で描き直して `#cardImg` と `lastBlob` を差し替える（判定はそのまま。試作の `refreshCard()`）
- 保存：試作 486〜499 行目の `window.claude.use("downloads")` の仕組みをそのまま移す（直すのは D）。案内は `#issueStatus` に
- `#newItem`：品名を空、分類を最初の種類、写真と切り抜きを消して `#editorWrap` を隠し、`card` を捨て、案内をすべて消して `go(2)`

- [ ] **Step 6: テストが通ることを確かめる**

Run: `npm run test:e2e:preview`
Expected: `pages`・`apply`・`flow` のすべてが desktop・mobile とも PASS

- [ ] **Step 7: 試作を消して、もう一度確かめる**

```bash
git rm frontend/shinki-kantei.html
git rm -r tests/golden
npm test && npm run test:e2e:preview
```
Expected: Vitest・Playwright ともすべて PASS

- [ ] **Step 8: Commit**

```bash
git add frontend tests/flow.spec.js
git commit -m "feat: ③審査・④交付の画面を作り、1ファイルの試作を置き換える"
```

---

### Task 5: ① の見本カード、仕上げの確認、CLAUDE.md

**Files:**
- Create: `tests/reception.spec.js`
- Modify: `frontend/src/js/main.js`、`frontend/src/css/kantei.css`、`CLAUDE.md`

**Interfaces:**
- Consumes: `appraise`（Task 1）、`signature`・`drawSample`・`SAMPLES`・`createEditor` の `PhotoState` の形（Task 3）、`ensureFonts`・`drawCard`（Task 4）
- Produces: `#fan` の中の `img.fan-card` 3枚（`alt` は「見本の鑑定カード：（品名）」）

- [ ] **Step 1: 失敗するテストを書く**

`tests/reception.spec.js`：
- 「①に見本のカードが3枚出る」：`#fan img.fan-card` が3枚、どれも `src` が `data:image/png`、`naturalWidth` が 750
- 「キーボードだけで④まで進める」：`page.emulateMedia({ reducedMotion: "reduce" })` → `Tab` を押して `#takeTicket` にフォーカスが来るまで繰り返す（最大20回）→ `Enter` → `#itemName` に `Tab` で移って「ボールペン」と入力 → `#showSamples` まで `Tab` → `Enter` → `[data-sample="pen"]` まで `Tab` → `Enter` → `#submitApply` まで `Shift+Tab`／`Tab` で移動 → `Enter` → `data-step` が `"4"`
- 「ライトモードでも本文の文字色と背景色のコントラスト比が 4.5 以上」：`page.emulateMedia({ colorScheme: "light" })` で①を開き、`body` の `color` と `background-color` を `getComputedStyle` で取って比を計算する。`colorScheme: "dark"` でも同じ
- 「①で横スクロールが出ない」

- [ ] **Step 2: テストが失敗することを確かめる**

Run: `npm run test:e2e:preview -- tests/reception.spec.js`
Expected: 見本のカードのテストが FAIL（ほかは通ってもよい。通らなければここで直す）

- [ ] **Step 3: 見本のカードを描く**

ページを開いたら `await ensureFonts()` のあと、`SAMPLES` の3つについて `drawSample(kind)` → `signature()` → `appraise({ name, signature, category, appeals: 0 })` → `drawCard(card, { photo: canvas, view: { zoom: 1, offX: 0, offY: 0 }, lasso: null })` → `toDataURL("image/png")` を `img.fan-card` に入れる。並びは見本どおり、左にマグカップ（-10°）、右に目覚まし時計（10°）、中央手前にボールペン。カード1枚の幅は ① の幅の約3分の1、扇の高さはスマホ幅でもボタンを押し下げすぎない大きさ（360px 幅で 150〜180px 程度）

- [ ] **Step 4: テストをすべて流す**

Run: `npm test && npm run test:e2e:preview`
Expected: すべて PASS

- [ ] **Step 5: 目で見て確かめる**

`npm run dev` を立て、Playwright の `page.screenshot` で①〜④と読み物3ページを、幅 360px と 1280px、ライトとダークで撮り（保存先はスクラッチの場所）、`screens.html` の見本と見比べる。崩れや見本との大きな違いがあれば直す。最後に、設計書 10章の「画面が切り替わったら、新しい画面の見出しにフォーカスを移す」を④・③でも確かめる（`document.activeElement` が `#step-issue h2`）

- [ ] **Step 6: CLAUDE.md を書き直す（設計書 13章）**

- 「作業フォルダ」の下の「現在の試作」を `frontend/index.html`（手続きの画面）・`about.html`・`privacy.html`・`contact.html`、JS・CSS は `frontend/src/` に改める
- 「試作の仕様」の節：入力・判定・カード・写真の調整の内容はそのまま残し、ファイルの場所（`appraise.js`・`card.js`・`editor.js` など）を添える。「見た目」の節は、設計書 2章・6章・9章の内容（神様の役所、①〜④の手続き、色・書体）に書き直す
- 「Dockerで起動する」：先に `npm run build` を実行すること、配信元が `frontend/dist/` になったこと、`/healthz` で正常を判定すること
- 「確認テスト」：`npm test` は Vitest（判定）、`npm run test:e2e` は Playwright（`http://web/`）、devcontainer を作り直すまでは `npm run test:e2e:preview`。判定の記録 `appraise.golden.json` は A で部品を増やすときに作り直す
- 開発の手順：`npm run dev`（5173番）・`npm run build`・`npm run preview`
- 「進行中の作業」：C を実装済みにし、次は B（カードのデザイン）の設計。**devcontainer の作り直しが必要**（`web` のマウント元と healthcheck を変えたため）と書く
- 最終更新の日付を実装した日に

- [ ] **Step 7: Commit**

```bash
git add frontend tests/reception.spec.js CLAUDE.md
git commit -m "feat: ①に見本のカードを並べ、CLAUDE.md を新しい構成に合わせる"
```
