#!/usr/bin/env python3
"""Add a Google Fonts css2 URL's faces to .fontcache/ (shared with the captures)."""
import hashlib, pathlib, re, sys, urllib.request
CACHE = pathlib.Path("/home/user/shapshyftrs/.fontcache")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
def key(u): return hashlib.md5(u.encode()).hexdigest()[:16] + ".woff2"
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=40).read()
(CACHE/"files").mkdir(parents=True, exist_ok=True)
merged = (CACHE/"google.css").read_text() if (CACHE/"google.css").exists() else ""
added = 0
for url in sys.argv[1:]:
    css = get(url).decode()
    if css not in merged: merged += "\n" + css
    for u in sorted(set(re.findall(r"https://fonts\.gstatic\.com[^)]+", css))):
        d = CACHE/"files"/key(u)
        if d.exists() and d.read_bytes()[:4] == b"wOF2": continue
        d.write_bytes(get(u)); added += 1
(CACHE/"google.css").write_text(merged)
print(f"cached {added} new face(s); stylesheet now {len(merged)//1024}KB")
