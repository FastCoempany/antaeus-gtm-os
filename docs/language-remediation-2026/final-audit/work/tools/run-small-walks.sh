#!/bin/bash
S=/tmp/claude-0/-home-user-antaeus-gtm-os/c1076100-1640-537d-8f08-c3ca52bdf503/scratchpad/final-audit
cd /home/user/antaeus-gtm-os
export TRANSCRIPT_CHROMIUM=/opt/pw-browsers/chromium
node tools/preview/walk-onboarding.js --out $S/onboarding-walk > $S/onboarding-walk.log 2>&1; echo "onboarding-walk rc=$? files=$(ls $S/onboarding-walk 2>/dev/null | tr '\n' ' ')" >> $S/variants-pre/summary.txt
node tools/preview/walk-public-pages.js --out $S/public-walk > $S/public-walk.log 2>&1; echo "public-walk rc=$? files=$(ls $S/public-walk 2>/dev/null | tr '\n' ' ')" >> $S/variants-pre/summary.txt
