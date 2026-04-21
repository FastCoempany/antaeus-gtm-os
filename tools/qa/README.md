# QA Bootstrap

These scripts seed the canonical demo workspace through `demo-seed.html` before opening an app room. This avoids ad hoc localStorage seeding and keeps QA aligned with the app's real demo contract.

Example:

```powershell
.\tools\qa\start-static-server.ps1
node tools/qa/capture-demo-room.js --path /app/deal-workspace/ --scenario mm --screenshot tmp-deal.png
node tools/qa/capture-demo-room.js --path /app/discovery-studio/ --scenario mm --qa --screenshot tmp-discovery-qa.png
```

Notes:

- `start-static-server.ps1` serves the repo root on `127.0.0.1:4173` by default.
- `--path` is the room route you want to inspect.
- `--scenario` accepts `mm` or `ent`.
- The script appends `?demo=1` automatically.
- Add `--qa` to append `?qa=1` and suppress tours / guided overlays during inspection.
- The capture script assumes the static server is running at `http://127.0.0.1:4173` unless `--base-url` is provided.
