#!/bin/bash
# Local-only (no model calls): oldest-screen walk, then the onboarding and public-page walks.
S=/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit
cd /home/user/antaeus-gtm-os
export TRANSCRIPT_CHROMIUM=/opt/pw-browsers/chromium
OUT=$S/variants-pre
rm -rf $OUT/legacy; start=$(date +%s)
TRANSCRIPT_OUT="$OUT/legacy/transcript" TRANSCRIPT_SEED=ent TRANSCRIPT_QUERY="v4=0&ds=0&today=0" TRANSCRIPT_PORT=4321 node $S/tools/build-transcript-variant.js > $OUT/legacy.log 2>&1; rc=$?
COPY_TRANSCRIPT_DIR="$OUT/legacy/transcript" COPY_OUT_DIR="$OUT/legacy" node $S/tools/build-copy-inventory-variant.js >> $OUT/legacy.log 2>&1
echo "legacy seed=ent query=v4=0&ds=0&today=0 rc=$rc secs=$(( $(date +%s)-start )) lines=$(wc -l < $OUT/legacy/rendered-corpus.txt 2>/dev/null)" >> $OUT/summary.txt
mkdir -p $S/corpus-legacy
node -e "
const fs=require('fs');const p='$OUT/legacy/rendered-corpus.txt';if(!fs.existsSync(p))process.exit(0);
const by={};for(const l of fs.readFileSync(p,'utf8').split('\n').filter(Boolean)){let m=l.match(/^\[([^|\]]+) \| ([^|]*) \| ([^\]]+)\] ([\s\S]*)$/);if(m){(by[m[1]]=by[m[1]]||[]).push('['+m[2]+' | '+m[3]+'] '+m[4]);continue}m=l.match(/^\[([^|\]]+) \| ([^\]]*)\] ([\s\S]*)$/);if(m)(by[m[1]]=by[m[1]]||[]).push('['+m[2]+' | hover or field text] '+m[3])}
for(const [k,v] of Object.entries(by))fs.writeFileSync('$S/corpus-legacy/'+k+'.txt',v.join('\n')+'\n');"
echo "LEGACY SLICED" >> $OUT/summary.txt
node tools/preview/walk-onboarding.js --out $S/onboarding-walk > $S/onboarding-walk.log 2>&1; echo "onboarding-walk rc=$? files=$(ls $S/onboarding-walk 2>/dev/null | tr '\n' ' ')" >> $OUT/summary.txt
node tools/preview/walk-public-pages.js --out $S/public-walk > $S/public-walk.log 2>&1; echo "public-walk rc=$? files=$(ls $S/public-walk 2>/dev/null | tr '\n' ' ')" >> $OUT/summary.txt
echo "LOCAL WALKS DONE" >> $OUT/summary.txt
