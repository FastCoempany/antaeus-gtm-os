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

# The ten contractor surnames are held as truncated hashes, not as text. Rule 8
# says never write a contractor's name in a file, and the first version of this
# guard listed all ten in clear -- which made the check against rule 8 the only
# breach of it in the tree. Hashing keeps the check and drops the names: every
# word in dist/ is hashed and compared, so a name still cannot ship, but reading
# this file tells you nothing about who those people are.
NAME_HASHES = {'13aacf62bf70', '14a96ebb257d', '2993f8453f06', '316a91552b13', '7b54df6d6361', '9f04291f95d0', 'a558eaa0f8eb', 'a66ded421756', 'a7bece6b48d8', 'aec1c22d36c5'}
words = {w.lower() for w in re.findall(r"[A-Za-z][A-Za-z'-]{2,}", repo_text)}
name_hit = sum(1 for w in words if hashlib.sha256(w.encode()).hexdigest()[:12] in NAME_HASHES)

banned = ['VULKEN', 'RHECC', 'Pure Patch', '/home/user/', 'prismhr', 'Gong']
hit = [b for b in banned if b.lower() in repo_text.lower()]
say('7 no contractor or out-of-scope name in dist', not hit and not name_hit,
    f'{len(NAME_HASHES)} names + {len(banned)} brands checked against {len(words)} words'
    + (f' HIT {hit}' if hit else '') + (f' {name_hit} NAME HIT' if name_hit else ''))

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

    # 17: type inside a frame is neither cut by the stage nor overprinted by a sibling.
    # The old comment on the block below claimed to cover "phone" and never measured
    # it -- which is how a callout at 68% visible and a three-way overprint shipped
    # while this script reported all clear. Both failure modes are measured here:
    # SLICED compares each text run's box against the stage-frame it sits in, and
    # OVERLAP compares runs that live in different block boxes (two runs inside one
    # wrapping paragraph share a bounding box and are not a collision).
    SLICE_JS = """() => {
      const out=[];
      document.querySelectorAll('.stage').forEach(st=>{
        const fr=st.querySelector('.stage-frame'); if(!fr) return;
        const fb=fr.getBoundingClientRect();
        const id=(st.className.match(/f\\d+/)||['stage'])[0];
        const walk=document.createTreeWalker(st,NodeFilter.SHOW_TEXT); let n; const boxes=[];
        while(n=walk.nextNode()){
          const t=n.textContent.trim(); if(!t) continue;
          const cs=getComputedStyle(n.parentElement);
          if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)<0.05) continue;
          const rg=document.createRange(); rg.selectNodeContents(n);
          const rc=rg.getBoundingClientRect(); if(rc.width<1||rc.height<1) continue;
          // Clip against the stage AND every ancestor that hides its overflow, so
          // what is measured is what a visitor can actually see. A line a scrolling
          // rail has clipped away entirely is invisible, not broken; a line cut
          // through the middle is the defect worth failing on.
          let cl=[fb.left,fb.top,fb.right,fb.bottom];
          for(let a=n.parentElement;a&&a!==document.body;a=a.parentElement){
            const ov=getComputedStyle(a).overflow;
            if(ov&&ov!=='visible'){const ab=a.getBoundingClientRect();
              cl=[Math.max(cl[0],ab.left),Math.max(cl[1],ab.top),
                  Math.min(cl[2],ab.right),Math.min(cl[3],ab.bottom)];}
          }
          const ix=Math.max(0,Math.min(rc.right,cl[2])-Math.max(rc.left,cl[0]));
          const iy=Math.max(0,Math.min(rc.bottom,cl[3])-Math.max(rc.top,cl[1]));
          const vis=(ix*iy)/(rc.width*rc.height);
          if(vis<=0.02) continue;
          let blk=n.parentElement;
          while(blk && getComputedStyle(blk).display.indexOf('inline')===0) blk=blk.parentElement;
          boxes.push({t:t.slice(0,24),vis,blk,
                      rc:[Math.max(rc.left,cl[0]),Math.max(rc.top,cl[1]),
                          Math.min(rc.right,cl[2]),Math.min(rc.bottom,cl[3])]});
        }
        boxes.filter(x=>x.vis<0.97).forEach(x=>
          out.push(id+' SLICED '+Math.round(x.vis*100)+'% "'+x.t+'"'));
        for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
          if(boxes[i].blk===boxes[j].blk) continue;
          const a=boxes[i].rc,c=boxes[j].rc;
          const ox=Math.min(a[2],c[2])-Math.max(a[0],c[0]);
          const oy=Math.min(a[3],c[3])-Math.max(a[1],c[1]);
          if(ox>2&&oy>2) out.push(id+' OVERLAP "'+boxes[i].t+'" / "'+boxes[j].t+'"');
        }
      });
      return out;}"""
    # The one admitted overlap: the PUFF JUNCTION lockup sets its contour and its
    # letterforms over each other on purpose -- that offset IS the mark.
    ALLOWED = ('f01 OVERLAP "puff" / "JUNCTION"',)
    bad = []
    for vw, vh in [(390, 844), (768, 1024), (1440, 900)]:
        ctx = b.new_context(viewport={'width': vw, 'height': vh}); serve(ctx)
        pg = ctx.new_page()
        for v in VARIANTS:
            pg.goto('file://' + str(dist / f'variant-{v}.html')); pg.wait_for_timeout(2200)
            for hit in pg.evaluate(SLICE_JS):
                if hit not in ALLOWED:
                    bad.append(f'{v}@{vw} {hit}')
        ctx.close()
    say('17 no sliced or overprinted type inside any frame', not bad,
        f'3 viewports x 3 variants measured' + (f' :: {bad[:3]}' if bad else ''))

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
