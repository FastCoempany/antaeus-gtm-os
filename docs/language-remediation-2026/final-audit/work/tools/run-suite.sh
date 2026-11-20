#!/bin/bash
# Usage: run-suite.sh <outdir> ; runs the engineering suite and records pass/fail per step.
OUT="$1"; mkdir -p "$OUT"; cd /home/user/antaeus-gtm-os
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium
: > "$OUT/summary.txt"
step(){ name="$1"; shift; start=$(date +%s); "$@" > "$OUT/$name.log" 2>&1; rc=$?; end=$(date +%s); echo "$name rc=$rc secs=$((end-start))" >> "$OUT/summary.txt"; }
step typecheck npm run -s typecheck
step typecheck-functions npm run -s typecheck:functions
step copy-test npm run -s copy:test
step unit npm test
step vite-build npm run -s build
step cloudflare-build npm run -s build:cloudflare
step e2e npm run -s test:e2e -- --trace off
echo "DONE" >> "$OUT/summary.txt"
