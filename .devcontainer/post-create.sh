#!/usr/bin/env bash
set -euo pipefail

# Named volumes mount as root:root; postCreateCommand runs as the non-root
# remoteUser (vscode), so the Claude Code config mount needs ownership fixed first.
sudo chown "$(id -u):$(id -g)" /home/vscode/.claude

# 確認テスト用の Playwright と Chromium を入れる（ブラウザはコンテナ内に置くので作り直すたびに入れ直す）
cd /workspace
npm ci
npx playwright install --with-deps chromium

# サイトが配信されているかを確認する（workspace から web コンテナへ）
if curl --silent --fail --output /dev/null http://web/; then
  echo "神器鑑定所: http://web/ で配信中"
else
  echo "警告: http://web/ に接続できません。docker compose の web サービスを確認してください" >&2
fi
