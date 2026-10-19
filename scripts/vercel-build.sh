#!/usr/bin/env bash
# Vercel build: install the pinned Compact compiler, compile the contract
# (simulator profile, no proving keys) and build the web workspace.
set -euo pipefail

COMPACT_VERSION="0.35.0"
COMPACT_DIR="$PWD/.compactc"

if ! command -v compactc >/dev/null 2>&1; then
  url="https://github.com/midnightntwrk/compact/releases/download/compactc-v${COMPACT_VERSION}/compactc_v${COMPACT_VERSION}_x86_64-unknown-linux-musl.zip"
  curl -fsSL -o /tmp/compactc.zip "$url"
  mkdir -p "$COMPACT_DIR"
  if command -v unzip >/dev/null 2>&1; then
    unzip -q -o /tmp/compactc.zip -d "$COMPACT_DIR"
  else
    python3 -m zipfile -e /tmp/compactc.zip "$COMPACT_DIR"
  fi
  chmod +x "$COMPACT_DIR"/* || true
  export PATH="$COMPACT_DIR:$PATH"
fi

npm run compact -w contract
npm run build -w web
