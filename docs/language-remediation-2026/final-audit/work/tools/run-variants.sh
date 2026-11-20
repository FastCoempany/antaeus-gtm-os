#!/bin/bash
# Usage: run-variants.sh <outroot> <name:seed:query> ...   (builds a normal dist first)
S=/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit
OUTROOT="$1"; shift; mkdir -p "$OUTROOT"; cd /home/user/antaeus-gtm-os
export TRANSCRIPT_CHROMIUM=/opt/pw-browsers/chromium
if [ -x /opt/pw-browsers/chromium ]; then :; else unset TRANSCRIPT_CHROMIUM; fi
npm run -s build:cloudflare > "$OUTROOT/build.log" 2>&1 || { echo "BUILD FAILED" >> "$OUTROOT/summary.txt"; exit 1; }
for spec in "$@"; do
  name="${spec%%:*}"; rest="${spec#*:}"; seed="${rest%%:*}"; query="${rest#*:}"
  start=$(date +%s)
  TRANSCRIPT_OUT="$OUTROOT/$name/transcript" TRANSCRIPT_SEED="$seed" TRANSCRIPT_QUERY="$query" TRANSCRIPT_PORT=4321 node $S/tools/build-transcript-variant.js > "$OUTROOT/$name.log" 2>&1; rc=$?
  COPY_TRANSCRIPT_DIR="$OUTROOT/$name/transcript" COPY_OUT_DIR="$OUTROOT/$name" node $S/tools/build-copy-inventory-variant.js >> "$OUTROOT/$name.log" 2>&1
  end=$(date +%s); echo "$name seed=$seed query=$query rc=$rc secs=$((end-start)) lines=$(wc -l < "$OUTROOT/$name/rendered-corpus.txt" 2>/dev/null)" >> "$OUTROOT/summary.txt"
done
echo DONE >> "$OUTROOT/summary.txt"
