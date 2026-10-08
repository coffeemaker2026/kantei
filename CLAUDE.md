# 八百万神器鑑定所（仮）プロジェクト引き継ぎ

最終更新：2026年10月8日（C：サイトデザインを実装。claude.ai のチャットで試作した内容を引き継いだメモを、新しい構成に合わせて更新）

## このプロジェクトは何か

架空の宗教「八百万神器鑑定所」をネタにしたWebサイト。利用者が持ち物の写真と名前を出すと、神が「神器ランク」を判定し、トレーディングカード風の画像にする。SNSでシェアされるネタ画像生成器として人を集め、広告とアフィリエイトで収益化する。

- 作業フォルダ：`D:\control\projectC`
- 現在のサイト：`frontend/index.html`（手続きの画面：①受付→②申請→③審査→④交付）、読み物の `frontend/about.html`・`privacy.html`・`contact.html`。JS・CSS は `frontend/src/`（Vite でビルドする）
  - 2026年10月8日に、1ファイルの試作 `frontend/shinki-kantei.html` を置き換えて削除した（中身は Git の履歴にある）
- フォルダ構成：`frontend/`＝サイトの元のファイル。`npm run build` で `frontend/dist/` にビルドし、これを配信する（S3 に置くもの）。`docs/`＝記事・ドキュメント（Markdown）

## 運営者の前提

- 職業はSE。作業時間は週3〜7時間。英語名のハンドルネームで匿名運営する
- 収益はアフィリエイト＋広告（AdSense等）
- WordPressは使わない。**AWS S3の静的サイトで運用する**
- 記事やドキュメントの成果物はMarkdownで残す
- データや情報を出すときは基準日・発表日を確認し、確認できないときはその旨を明記する

## 守る方針

1. **サイトの動作中にAIを使わない**。判定も文章もブラウザ内の組み合わせで作る。AIは制作時に部品（単語や文章）をまとめて作るときだけ使う。サーバー（Lambda等）も今は使わない
2. **写真は外に送らない・保存しない**。ブラウザの中でカードに合成するだけ
3. **「カードダス」はバンダイの商標なので、サイト名・説明・デザインに使わない**。既存の特定のカードに寄せないオリジナルデザインにする
4. 実在の宗教を茶化さない。「ご利益がある」として物を売らない。寄付を「お布施」として集めない

## サイトの仕様（frontend/index.html）

### ファイルの分担（frontend/src/js/）
- `appraise.js`：判定（乱数・単語の表・ランク）。`appraise.golden.json` と `appraise.test.js` で試作と同じ結果になることを確かめている
- `card.js`：カード（750×1050）の描画。`editor.js`：写真の調整欄。`signature.js`：写真の署名。`samples.js`：見本の写真
- `main.js`：手続きの画面の切り替え・入力・審査・交付。`page.js`：読み物ページの入口
- CSS：`frontend/src/css/site.css`（4ページ共通）、`kantei.css`（手続きの画面だけ）

### 入力
- 写真（必須）、持ち物の名前（16文字まで）、種類（文房具／家電／台所用品／衣類・小物／ガジェット／食べ物／その他）
- 写真はファイル選択のほか、貼り付け・ドラッグ＆ドロップでも読み込める
- 見本の写真（マグカップ・ボールペン・目覚まし時計）。②の「見本で試す」から選ぶ。Canvasで描いた画像で、claude.ai の表示環境でファイル選択が効かなかったために追加したもの。本番で残すかは D で決める
- 読み込めないファイルは「この写真は読み込めませんでした。別の写真をお試しください。」と出し、前の写真は残す

### 判定の決まり方
- 乱数の種 ＝ 名前＋写真の署名＋種類＋再審回数 をハッシュ（FNV-1a）した値。乱数は mulberry32
- 写真の署名：写真を8×8に縮め、明るさを8段階にした64文字。**同じ写真なら同じ判定、撮り直すと変わる**
- 「異議を申し立てる」で再審（再審回数が増えて結果が変わる）。名前・種類・写真が変わると回数はリセット
- 申請・再審のボタンを続けて押しても、手続きは1回だけ進む
- ランクの出やすさ：SSR 3%、SR 10%、R 25%、N 40%、Z 22%

### カードの中身（750×1050px のCanvasで描画、PNG保存）
- 神器名：Zは「ただの〇〇」、それ以外は「二つ名＋種類ごとの名詞」と「（※元の名前）」
- 属性、種別、ステータス4つ（攻撃力・神性・生活感・くたびれ度）。ランクごとに値の範囲が違う。Zは生活感だけ高い
- 伝承文：由来＋効果＋弱点（SSRは弱点の代わりに「神界でも三つしか存在しない」）。Zは専用の文
- 通し番号（乱数の種から作る7桁）、「八百万神器鑑定所」の表記
- 枠の色：SSRは虹色＋粒の光、SRは金、Rは銀、Nは銅、Zは段ボール色。表示上はSSR・SRにキラキラが流れる演出

### 写真の調整
- 「位置を動かす」：ドラッグで移動、スライダーで大きさ（0.5〜3倍）
- 「なぞって切り抜く」：対象のまわりを一周なぞると切り抜く。座標は写真上の座標で持つので、あとで動かしても切り抜きが付いてくる
- 切り抜きあり：暗い神界の背景＋後光＋対象のふちが光る
- 切り抜きなし：周囲を暗くしてスポットライト＋うっすら後光。SSR・SRは金色の光を重ねる
- 光の色はランク別。Zは写真を白黒寄りにする
- カードを出したあとに調整すると、判定はそのままで画像だけ描き直す

### 見た目と手続き（設計書：`docs/superpowers/specs/2026-10-05-site-design-design.md`）
- 世界観は「神様の役所」（お役所仕事のパロディ）。紺・金・朱、明朝の見出し、生成りの申請書に、黄色い注意書き・様式番号・番号札・電光掲示板の小ネタを混ぜる
- ①受付：見出し、見本のカード3枚（開いたときに `card.js` で描く）、「番号札を取る」。受付番号は開いた時刻から作る見た目だけの4桁で、判定には使わない
- ②申請：申請書（品名・分類・現物写真）。写真を添付すると同じ紙の中に「添付写真の調整」欄が開く。空の欄には案内を出し、最初の空欄にフォーカスを移す
- ③審査：電光掲示板に受付番号、文言を約1秒ずつ3つ（再審は「再審請求を受理しました」を約1秒）。画面のどこかをタップするかキーを押すと飛ばせる。動きを減らす設定の人には出さない
- ④交付：カードが裏から表にめくれる。「第一審／再審 N 回目」「判定：〇〇」、異議を申し立てる・画像を保存・別の持ち物を鑑定する、広告枠とアフィリエイト枠。幅 820px 以上では2列
- 画面は URL のハッシュ（なし・`#apply`・`#review`・`#issue`）で表し、ブラウザの「戻る」で戻れる。④で戻ると②。写真は保存しないので、③・④で再読み込みすると②に戻る
- 色（ダーク）：背景 `#141A2E`、文字 `#ECE6D6`、補助 `#A3A8BC`、金 `#D4B05A`、朱 `#B8372B`、紙 `#F4EEDC`、注意書きの黄 `#F7E36A`。ライトは背景 `#E8E4D8`、文字 `#1B2340`、補助 `#4A5270`、金 `#7A5A16`。紙・注意書き・電光掲示板はどちらも同じ色。朱は文字色に使わない
- フォント：Zen Antique（見出し・ボタン・カードの名前）、Zen Kaku Gothic New（本文）。Google Fonts
- 画面見本は `.superpowers/brainstorm/` の `screens.html`（Git・配信の対象外）

## Git の決まり（2026年10月8日追加）

- **コミット・PR に Claude の名前を入れない**（Co-Authored-By の行、「Generated with Claude Code」など）。全プロジェクト共通の決まり
  - 止める仕組み：`.githooks/commit-msg`（コミットを止める）、`.githooks/pre-push`（push を止める）、`.claude/hooks/block-claude-credit.sh`（Claude Code のコマンドを止める）、`.claude/settings.json` の `attribution`。止める文字列は `.githooks/claude-credit-pattern`
  - git の仕組みは `git config core.hooksPath .githooks` で有効になる（`post-create.sh` が設定する）
- main に直接 push しない。ブランチで作業し、ブランチから取り込む

## 開発の手順

- `npm run dev`：開発サーバー（5173番。編集するとすぐ反映される）
- `npm run build`：`frontend/dist/` にビルドする（Docker の配信はこれを見る）
- `npm run preview`：ビルドした結果を確かめる

## Dockerで起動する（2026年10月5日追加）

projectB（`D:\control\projectB`）の `compose.yml` の書き方にならい、nginx で静的配信するだけのコンテナにした。サーバー側の処理は持たない（本番の S3 静的サイトと同じ条件）。

- 起動：先に `npm run build` を実行してから `docker compose up -d --build` → http://localhost:8080/
- 停止：`docker compose down`
- ポートを変える：`SHINKI_PORT=8081 docker compose up -d`（projectB が 4001・8090 を使うので 8080 にした）
- 配信元は `frontend/dist/`（ビルドの結果）。読み取り専用でマウントしているので、`npm run build` でビルドし直したらブラウザの再読み込みで反映される。部品を JSON に分けた場合は `frontend/public/` に置くか JS から読み込めばビルドに入る（`docs/` などそれ以外は配信されない）
- コンテナの正常の判定は `/healthz`（`dist/` が空でも正常になる）
- `.md`・`.yml`・`.conf`・`Dockerfile`・`nginx/`・ドットファイルは配信しない（`nginx/default.conf`）
- 関連ファイル：`Dockerfile`、`compose.yml`、`nginx/default.conf`、`.dockerignore`、`.gitattributes`

### 開発コンテナ（devcontainer）

projectB の `.devcontainer` と同じ形。VS Code でフォルダを開き「コンテナーで再度開く」を選ぶと使える。

- `workspace`：作業用（Ubuntu 24.04＋Node 22＋Claude Code）。フォルダは `/workspace` に見える。Claude Code の設定は名前付きボリュームに残る
- `web`：上と同じ nginx 設定で `frontend/dist/` を配信。workspace の中からは `http://web/`、Windows 側からは VS Code の「ポート」タブに出る転送先で開く
- 関連ファイル：`.devcontainer/devcontainer.json`、`docker-compose.yml`、`post-create.sh`、`devcontainer-lock.json`（バージョンは projectB と同じに固定）
- `compose.yml`（8080番）と devcontainer は別々のコンテナなので、同時に起動しても衝突しない
- Claude Code のアカウント：初回だけコンテナ内で `claude` → `/login` →「Claude アカウント」で kobuhei78@gmail.com を選ぶ。ログイン情報は `CLAUDE_CONFIG_DIR=/home/vscode/.claude`（名前付きボリューム `shinki-kantei-devcontainer_devcontainer-claude-config`）に残るので、作り直しても再ログイン不要。`.claude/settings.json` の `forceLoginMethod: claudeai` で API キーでのログインを選べないようにしている

### 確認テスト（Playwright）（2026年10月5日追加）

- `npm test`：Vitest で判定を確かめる（`frontend/src/js/appraise.test.js`）。判定の記録 `appraise.golden.json` は、A で部品を増やすときに作り直す
- `npm run test:e2e`：Playwright で `http://web/` の配信を、パソコン幅とスマホ幅の Chromium で確認する。**devcontainer を作り直すまでは `npm run test:e2e:preview`**（ビルドして `vite preview` で配信したものを見る）
- このコンテナはメモリが少ない（約 2GB）ので、画面テストが ENOMEM で落ちるときは `-- --workers=2` を付ける
- 結果をブラウザで見る：`npm run test:report`
- devcontainer の外で動かすときは `BASE_URL=http://localhost:8080/ npm run test:e2e`
- テストは `tests/`、設定は `playwright.config.js`。Playwright と Chromium はリビルド時に `post-create.sh` が入れる
- `package.json`・`node_modules/` は作業フォルダ直下にあり、`frontend/` の外なので配信されない

## 進行中の作業（2026年10月8日時点）

- 改善は C（サイトデザイン）→ B（カードのデザイン）→ A（言葉の部品を増やす）の順に進める。D（公開前の直し：保存ボタン・見本写真・切り抜き補正・2本指ズーム）と E（X 共有・OGP）は公開直前にまとめて行う
- **C は実装済み**（設計書 `docs/superpowers/specs/2026-10-05-site-design-design.md`、実装計画 `docs/superpowers/plans/2026-10-06-site-design.md`）。次は B（カードのデザイン）の設計
- **devcontainer の作り直しが必要**：`web` のマウント元を `frontend/dist/` に、healthcheck を `/healthz` に変えたため。作り直すまでは `npm run test:e2e:preview` で確かめる

## まだできていないこと（次にやる候補）

- **部品を大量に増やす**：二つ名・名詞・由来・効果・弱点・Zの文が数個ずつしかなく、すぐ同じ言い回しが出る。AIで数千個作り、JSONなどに分けて読み込む
- 切り抜きの線を少し内側に縮める補正（ざっくりなぞると背景が残るため）
- スマホでの2本指ズーム
- Xへの共有ボタン、シェアされたときの見栄え（OGP画像）
- 広告とアフィリエイト（「同じ系統の神器」として商品を紹介する枠）の置き場所
- サイト名・ドメイン・S3＋CloudFrontへの公開手順
- 将来の案：集める・戦う仕組み（神器帳・挑戦状 URL など。決まったことと案は `docs/ideas-collect-and-battle.md`）。基本機能とデザインを充実させたあとに足す
- 将来の案：ブラウザ内の画像認識で「神はこれを〇〇と見なした」演出、「背景を祓う」ボタン（背景除去。使うモデルの商用ライセンスは要確認）

## 同じ教団で検討中の別企画（メモ）

- 神の裁判所：読者のやらかしに神が判決を下す
- 転生案内所、神の値付け所、天使と悪魔の論争、神のレビュー（商品紹介と相性がいい）
