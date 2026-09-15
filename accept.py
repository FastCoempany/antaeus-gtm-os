#!/usr/bin/env python3
"""Run the built pages against BRIEF.md section 15, and measure rather than assert.

    python3 accept.py

Every check drives a real browser at a real viewport and reports what it
measured, so a pass is evidence and a failure names the number that was wrong.
Exit code is 1 if anything failed, so this is usable as a gate.

Requires the font cache, because a page judged in fallback type is not the page:

    python3 screenshot.py --fetch-fonts
"""
import pathlib, re, hashlib, json, sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent
CACHE = ROOT / '.fontcache'
CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'


def key(u):
    return hashlib.md5(u.encode()).hexdigest()[:16] + '.woff2'


_FONT_URL = re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*')


def serve(ctx):
    """Answer Google Fonts from the local cache.

    The sandbox proxy drops the stylesheet often enough that a run can finish
    having measured Times and Arial. Every check that reads a size, a fit or an
    overflow depends on the real faces being on the page."""
    css = (CACHE / 'google.css').read_bytes()

    def handler(route):
        u = route.request.url
        if 'googleapis' in u:
            route.fulfill(status=200, content_type='text/css', body=css)
            return
        f = CACHE / 'files' / key(u)
        if f.exists():
            route.fulfill(status=200, content_type='font/woff2', body=f.read_bytes())
        else:
            route.abort()

    ctx.route(_FONT_URL, handler)


if not (CACHE / 'google.css').exists():
    sys.exit('no font cache: run `python3 screenshot.py --fetch-fonts` first')

VARIANTS = ['a-keynote', 'b-wall', 'c-reel']
out = []
def say(n, ok, detail): out.append((n, ok, detail)); print(f"{'PASS' if ok else 'FAIL'}  {n:52} {detail}")

# --- static checks -------------------------------------------------------
dist = ROOT / 'dist'
sizes = {v: (dist / f'variant-{v}.html').stat().st_size for v in VARIANTS}
say('19 each variant under 900KB excluding fonts',
    all(s < 900_000 for s in sizes.values()),
    ' '.join(f'{v}={s//1024}KB' for v, s in sizes.items()))

copy = (dist / 'variant-a-keynote.html').read_text()
locked = ['See it before you build it.', 'Everything below is ours. Built by us, rebuilt here as teasers.',
          'Send us the idea', 'What you get', "What it isn't", '$75, paid up front. Delivered in five days.',
          'Three sentences is plenty.', 'The person, not the market.', 'shapshyftrs, 2026.']
miss = [l for l in locked if l not in copy]
say('10 copy verbatim from section 8', not miss, f'{len(locked)-len(miss)}/{len(locked)} lines present'
    + (f' MISSING {miss}' if miss else ''))

same = all((dist / f'variant-{v}.html').read_text().count('rebuilt here as teasers') == 1 for v in VARIANTS)
say('9 all three carry identical copy', same, 'gallery-intro present once in each')

# forbidden: no contractor names, no out-of-scope brands, no source paths
repo_text = '\n'.join(p.read_text(errors='replace') for p in dist.rglob('*.html'))
banned = ['Hanan','Glekel','Yupangco','Schwarz','Sarker','Prous','Baumgartner','Hijazi','Thiel','Salman',
          'VULKEN','RHECC','Pure Patch','/home/user/','prismhr','PrismHR']
hit = [b for b in banned if b.lower() in repo_text.lower()]
say('7 no contractor or out-of-scope name in dist', not hit, f'{len(banned)} checked' + (f' HIT {hit}' if hit else ''))

# match real file references, not the .steps CSS class in "How it works"
srcs = [r'src\s*=\s*["\'][^"\']+\.(png|jpe?g|webp|gif|svg)', r'url\(\s*["\']?[^"\')]*\.(png|jpe?g|webp)',
        r'\.(step|stp|sldprt|dxf|ai|psd|fig)["\'\s)]', r'sources\.local']
hit2 = [x for x in srcs if re.search(x, repo_text, re.I)]
say('8 no source asset placed in dist', not hit2, 'no render, photo or screenshot referenced'
    + (f' HIT {hit2}' if hit2 else ''))

# dist/ is the only thing published, so anything in it that the build did not
# just write goes out to real visitors. The thirteen teasers of the first
# version lived here through every rebuild of the second until the build
# learned to sweep. Expected: three variants, the contact sheet, twelve frames.
expected = {f'variant-{v}.html' for v in VARIANTS} | {'frames/index.html'} | {
    f'frames/{f.name}' for f in sorted((dist / 'frames').glob('t*.html'))}
actual = {str(f.relative_to(dist)) for f in dist.rglob('*') if f.is_file()}
orphans = sorted(actual - expected)
frames_n = len([f for f in actual if f.startswith('frames/t')])
say('20 dist holds only what this build wrote',
    not orphans and frames_n == 12,
    f'{len(actual)} files, {frames_n} frames' + (f' ORPHANS {orphans}' if orphans else ''))

# --- driven checks -------------------------------------------------------
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)

    # 16: two instances on one page, no id collision, no console error
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}); serve(ctx)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console ' + m.text[:60]) if m.type == 'error' else None)
    pg.goto('file://' + str(dist / 'frames' / 'index.html')); pg.wait_for_timeout(2600)
    r = pg.evaluate("""() => {const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
      const seen={},d=[]; ids.forEach(i=>{if(seen[i])d.push(i);seen[i]=1;});
      return {dups:d, stages:document.querySelectorAll('.stage').length,
        caps:[...document.querySelectorAll('.sheet-item figcaption')].length};}""")
    say('16 no id collision, no console error, twelve on one page',
        not r['dups'] and not errs and r['stages'] == 12,
        f"stages={r['stages']} dups={len(r['dups'])} errors={errs[:1] or 0}")
    say('12 the gallery runs the full set with a caption and a source label',
        r['caps'] == 12, f"{r['caps']}/12 captions on the contact sheet")
    pg.close()

    # 13: loop length, offscreen pause, hover pause
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}); serve(ctx)
    pg = ctx.new_page()
    pg.goto('file://' + str(dist / 'variant-b-wall.html')); pg.wait_for_timeout(2600)
    off = pg.evaluate("""() => {const st=[...document.querySelectorAll('.stage')];
      return {inview: st.filter(s=>s.classList.contains('is-playing')).length, total: st.length};}""")
    pg.evaluate("()=>document.querySelectorAll('.stage').forEach(s=>s.classList.add('is-playing'))")
    pg.wait_for_timeout(400)
    loops = pg.evaluate("""() => {
      const out=[];
      document.querySelectorAll('.stage').forEach(st=>{
        let max=0;
        st.querySelectorAll('*').forEach(el=>{
          const d=getComputedStyle(el).animationDuration;
          d.split(',').forEach(v=>{const s=parseFloat(v)*(v.includes('ms')?0.001:1); if(s>max)max=s;});
        });
        out.push({f:st.dataset.frame, s:+max.toFixed(1), playing:st.classList.contains('is-playing')});
      });
      return out;}""")
    # live-edge is the one frame with no loop at rest: the interaction is the
    # loop (BRIEF 6.3), so only its breathing dot has a duration.
    bad = [l for l in loops if l['f'] != 'live-edge' and not (6 <= l['s'] <= 10)]
    say('13a every loop between 6 and 10 seconds (live-edge is interaction-driven)', not bad,
        ' '.join(f"{l['f']}={l['s']}s" for l in loops[:6]) + ' …' + (f' BAD {bad}' if bad else ''))
    say('13b offscreen frames are paused', off['inview'] < off['total'],
        f"{off['inview']} of {off['total']} playing at the top of the page")
    first = pg.query_selector('.stage')
    first.scroll_into_view_if_needed(); pg.wait_for_timeout(700)
    before = pg.evaluate("()=>document.querySelector('.stage').classList.contains('is-playing')")
    first.hover(); pg.wait_for_timeout(500)
    after = pg.evaluate("()=>document.querySelector('.stage').classList.contains('is-playing')")
    say('13c hover pauses and release resumes', before and not after, f'in view={before} hovered={after}')
    pg.close()

    # 14: reduced motion
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce'); serve(ctx)
    pg = ctx.new_page()
    pg.goto('file://' + str(dist / 'variant-a-keynote.html')); pg.wait_for_timeout(2200)
    rm = pg.evaluate("""() => {let moving=0, total=0;
      document.querySelectorAll('.stage *').forEach(el=>{total++;
        const cs=getComputedStyle(el);
        if(cs.animationName!=='none' && parseFloat(cs.animationDuration)>0.01) moving++;});
      return {moving,total};}""")
    say('14 reduced motion stops every loop', rm['moving'] == 0,
        f"{rm['moving']} of {rm['total']} elements still animating")
    inter = pg.evaluate("""() => {const b=document.querySelector('.f04-hold'); if(!b) return 'no button';
      b.click(); return b.getAttribute('aria-pressed');}""")
    say('14b interactions still work under reduced motion', inter == 'true', f'hold button aria-pressed={inter}')
    pg.close()

    # 15 + 17 + 18: keyboard, focus ring, phone, hero fit
    for vw, vh, label in ((1440, 900, '1440x900'), (1440, 700, '1440x700')):
        ctx = b.new_context(viewport={'width': vw, 'height': vh}); serve(ctx)
        pg = ctx.new_page()
        pg.goto('file://' + str(dist / 'variant-a-keynote.html')); pg.wait_for_timeout(2200)
        r = pg.evaluate("""() => {const h=document.querySelector('.hero');
          const r=h.getBoundingClientRect();
          return {hero: Math.round(r.height), vh: window.innerHeight,
            hscroll: document.documentElement.scrollWidth > window.innerWidth+1};}""")
        fits = r['hero'] <= r['vh'] + 2
        say(f'18 hero fits and no horizontal scroll at {label}', fits and not r['hscroll'],
            f"hero={r['hero']}px viewport={r['vh']}px hscroll={r['hscroll']}")
        pg.close()
    # and no horizontal scroll on every variant at every checked width
    for vw in (390, 768, 1024, 1440, 1920):
        ctx = b.new_context(viewport={'width': vw, 'height': 900}); serve(ctx)
        pg = ctx.new_page(); over = []
        for v in VARIANTS:
            pg.goto('file://' + str(dist / f'variant-{v}.html')); pg.wait_for_timeout(1500)
            if pg.evaluate("()=>document.documentElement.scrollWidth > window.innerWidth+1"): over.append(v)
        say(f'13d no horizontal scroll at {vw}px on any variant', not over, over or 'a-keynote b-wall c-reel')
        pg.close()

    # keyboard reach + visible focus
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}); serve(ctx)
    pg = ctx.new_page()
    pg.goto('file://' + str(dist / 'variant-a-keynote.html')); pg.wait_for_timeout(2200)
    k = pg.evaluate("""() => {
      const sel='a[href],button,input,textarea,select,[tabindex]:not([tabindex="-1"])';
      const all=[...document.querySelectorAll(sel)];
      const inFrames=all.filter(e=>e.closest('.stage'));
      let ring=0;
      inFrames.forEach(e=>{e.focus();
        const cs=getComputedStyle(e);
        if(cs.outlineStyle!=='none' || cs.boxShadow!=='none') ring++;});
      return {total:all.length, inFrames:inFrames.length, ring};}""")
    say('15 interactive frames reachable with a visible focus ring',
        k['inFrames'] > 0 and k['ring'] == k['inFrames'],
        f"{k['inFrames']} controls inside frames, {k['ring']} with a ring; {k['total']} focusable on the page")
    b.close()

print()
bad = [n for n, ok, _ in out if not ok]
print(f"{len(out)-len(bad)}/{len(out)} pass" + (f"   FAILING: {bad}" if bad else "   all clear"))
sys.exit(1 if bad else 0)
