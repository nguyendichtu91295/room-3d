#!/usr/bin/env bash
set -eu
exec google-chrome \
  --remote-debugging-port=9222 \
  --remote-debugging-address=127.0.0.1 \
  --user-data-dir="${XDG_CACHE_HOME:-$HOME/.cache}/room-3d-chrome" \
  --no-first-run --no-default-browser-check \
  --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader \
  http://127.0.0.1:5173/
