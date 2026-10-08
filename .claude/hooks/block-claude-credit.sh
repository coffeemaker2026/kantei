#!/usr/bin/env bash
# Claude Code が実行しようとするコマンドに Co-Authored-By・Claude の署名が入っていたら止める
dir="$(cd "$(dirname "$0")/../.." && pwd)"
pat="$(grep -v '^#' "$dir/.githooks/claude-credit-pattern" | paste -sd'|')"
cmd="$(jq -r '.tool_input.command // ""')"
if printf '%s' "$cmd" | grep -E -i -q "$pat"; then
  echo "Co-Authored-By・Claude の署名はコミット・PR に入れられません（この利用者の指示）。その行を消してやり直してください" >&2
  exit 2
fi
exit 0
