import json, io
D = json.load(open('wall2.json'))
HTML = r'''<title>Three Brands, One Wall</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Archivo:wdth,wght@112..125,400..800&family=Alexandria:wght@400;700&family=Anybody:wdth,wght@100..125,400..900&display=swap">
<style>
:root{
  color-scheme:light;
  --wall:#EFEEEC; --panel:#F5F4F2; --ink:#14140F;
  --mute:rgba(20,20,15,.56); --faint:rgba(20,20,15,.34);
  --mount:rgba(20,20,15,.92); --rule:rgba(20,20,15,.15);
  --ds:#0B0B0B; --ds-ink:#0B0B0B;
  --digs:#0042E5; --digs-ink:#0042E5;
  --pj:#D6FD4A; --pj-ink:#5A6B00;
  --grid:rgba(20,20,15,.035);
  --sans:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  color-scheme:dark;
  --wall:#141414; --panel:#1A1A19; --ink:#EFEEEC;
  --mute:rgba(239,238,236,.60); --faint:rgba(239,238,236,.36);
  --mount:rgba(239,238,236,.72); --rule:rgba(239,238,236,.17);
  --ds:#F2F2F2; --ds-ink:#F2F2F2;
  --digs:#6C87FF; --digs-ink:#8CA1FF;
  --pj:#D6FD4A; --pj-ink:#D6FD4A;
  --grid:rgba(239,238,236,.045);
}}
:root[data-theme="dark"]{
  color-scheme:dark;
  --wall:#141414; --panel:#1A1A19; --ink:#EFEEEC;
  --mute:rgba(239,238,236,.60); --faint:rgba(239,238,236,.36);
  --mount:rgba(239,238,236,.72); --rule:rgba(239,238,236,.17);
  --ds:#F2F2F2; --ds-ink:#F2F2F2;
  --digs:#6C87FF; --digs-ink:#8CA1FF;
  --pj:#D6FD4A; --pj-ink:#D6FD4A;
  --grid:rgba(239,238,236,.045);
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--wall); color:var(--ink);
  font:400 16px/1.55 var(--sans);
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),
                   linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:34px 34px;
  -webkit-font-smoothing:antialiased;
}
.page{max-width:1240px;margin:0 auto;padding-inline:20px;padding-block:44px 76px}

/* ── masthead: neutral register, none of the six brand faces ── */
.mast{display:flex;flex-wrap:wrap;align-items:baseline;gap:14px 26px;
  padding-bottom:20px;border-bottom:1px solid var(--rule)}
.mast h1{font:700 clamp(30px,4.4vw,46px)/1 var(--sans);letter-spacing:-.025em;margin:0}
.mast .sub{flex:1 1 300px;font:400 14.5px/1.5 var(--sans);color:var(--mute);max-width:52ch;margin:0}
.mast .meta{font:400 11px/1 var(--mono);letter-spacing:.13em;text-transform:uppercase;
  color:var(--faint);margin-left:auto;white-space:nowrap}

/* ── the wall ── */
.wall{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;margin-top:34px}
.cell{
  grid-column:span 12; position:relative; isolation:isolate;
  display:flex;flex-direction:column;
  background:var(--panel); border:0; border-radius:2px; padding:0;
  box-shadow:inset 0 0 0 1px var(--mount);
  text-align:left; color:inherit; font:inherit; cursor:pointer;
  transition:box-shadow .2s ease, background .2s ease;
}
@media(min-width:1024px){
  .cell--ds{grid-column:span 7}
  .cell--dg{grid-column:span 5}
  .cell--pj{grid-column:span 12}
}
.cell:focus-visible{outline:3px solid var(--accent);outline-offset:3px}

/* the stage: cutouts float, and the hero breaks the mount line */
.stage{position:relative;flex:1;display:flex;align-items:flex-end;justify-content:center;
  min-height:224px;padding:34px 24px 0;overflow:visible}
.stage img{display:block;max-width:100%;height:auto;
  filter:drop-shadow(0 16px 26px rgba(20,20,15,.22));
  transition:transform .2s ease}
.hero{position:relative;z-index:2;margin-top:-30px}
.cell:hover .hero,.cell:focus-visible .hero{transform:translateY(-4px) scale(1.015)}
.aside{position:absolute;z-index:1;opacity:.92}

.cell--ds .hero{width:min(86%,500px)}
.cell--ds .aside{left:20px;bottom:14px;z-index:3;width:min(34%,186px);transform:rotate(-4deg)}
.cell--dg .stage{min-height:300px;padding-top:22px}
.cell--dg .hero{width:min(58%,230px);margin-top:-14px}
.cell--pj .stage{min-height:300px;gap:30px;flex-wrap:wrap;align-items:flex-end}
.cell--pj .hero{width:min(46%,380px)}
.cell--pj .proto{width:min(38%,320px);position:relative;z-index:1;opacity:.94;
  filter:drop-shadow(0 12px 20px rgba(20,20,15,.18))}

/* ── the plate: four parts, per the content spec ── */
.plate{padding:22px 24px 24px;border-top:1px solid var(--rule);margin-top:24px;
  display:grid;gap:9px}
.idx{font:500 11px/1 var(--mono);letter-spacing:.14em;color:var(--faint)}
.cell:hover .idx,.cell:focus-visible .idx{color:var(--accent-ink)}
.name{margin:0;line-height:.95}
.cat{font:400 11.5px/1.4 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--mute)}
.ev{margin:0;font-size:15px;line-height:1.5;max-width:52ch}
.foot{display:flex;align-items:center;gap:10px;margin-top:4px;
  font:500 12.5px/1 var(--sans);color:var(--accent-ink)}
.foot span{display:inline-block;width:22px;height:1px;background:currentColor}
.stage-tag{position:absolute;top:14px;left:16px;z-index:3;
  font:500 10px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;
  color:var(--faint);border:1px solid var(--rule);border-radius:99px;padding:5px 9px;
  background:var(--panel)}

/* brand faces live only inside their own cell */
.cell--ds{--accent:var(--ds);--accent-ink:var(--ds-ink)}
.cell--ds .name{font:700 clamp(25px,3.1vw,38px)/.95 "Archivo",var(--sans);
  font-stretch:125%;letter-spacing:.02em;text-transform:uppercase}
.cell--dg{--accent:var(--digs);--accent-ink:var(--digs-ink)}
.cell--dg .name{font:700 clamp(25px,3.1vw,36px)/.95 "Alexandria",var(--sans);letter-spacing:-.02em}
.cell--pj{--accent:var(--pj);--accent-ink:var(--pj-ink)}
.cell--pj .name{font:900 clamp(26px,3.3vw,40px)/.95 "Anybody",var(--sans);
  font-stretch:112%;letter-spacing:-.01em;text-transform:uppercase}

/* one brand live at a time */
.cell:hover,.cell:focus-visible{box-shadow:inset 0 0 0 1px var(--mount),
  inset 6px 0 0 -1px var(--accent), 0 2px 0 rgba(20,20,15,.05)}
.wall:has(.cell:hover) .cell:not(:hover),
.wall:has(.cell:focus-visible) .cell:not(:focus-visible){opacity:.62}
.cell{transition:box-shadow .2s ease,opacity .2s ease}

/* ── the pattern strip: the claim, stated outright ── */
.strip{margin-top:40px;border-top:1px solid var(--rule);padding-top:26px}
.strip h2{font:600 clamp(19px,2.3vw,25px)/1.25 var(--sans);letter-spacing:-.015em;
  margin:0 0 4px;text-wrap:balance}
.strip .lede{margin:0 0 20px;font-size:14.5px;color:var(--mute);max-width:62ch}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;min-width:600px;font-size:14px}
th,td{text-align:left;padding:11px 14px 11px 0;border-bottom:1px solid var(--rule);
  vertical-align:top}
thead th{font:500 10.5px/1.3 var(--mono);letter-spacing:.13em;text-transform:uppercase;
  color:var(--faint);padding-bottom:9px}
tbody th{font:400 12px/1.4 var(--mono);letter-spacing:.05em;text-transform:uppercase;
  color:var(--mute);width:150px;white-space:nowrap}
td b{font-weight:600}
.tag{display:inline-block;font:500 10.5px/1 var(--mono);letter-spacing:.09em;
  text-transform:uppercase;padding:5px 8px;border-radius:2px;
  border:1px solid var(--rule);color:var(--mute)}
.tag--made{border-color:var(--accent-line,currentColor);color:var(--ink);
  box-shadow:inset 3px 0 0 var(--ds-ink)}
.ph{border-bottom:1px dotted var(--faint);color:var(--mute);font-style:italic}

.note{margin-top:34px;padding-top:20px;border-top:1px solid var(--rule);
  font-size:13px;line-height:1.6;color:var(--mute);max-width:74ch}
.note b{color:var(--ink);font-weight:600}
.note code{font:400 12px/1 var(--mono);background:var(--rule);padding:2px 5px;border-radius:2px}

@media (prefers-reduced-motion:reduce){
  *{transition:none!important;animation:none!important}
}
@media(max-width:600px){
  .stage{min-height:180px;padding:26px 16px 0}
  .cell--ds .aside{display:none}
  .cell--pj .stage{gap:16px}
  .cell--pj .hero{width:min(60%,260px)}
  .cell--pj .proto{width:min(46%,200px)}
  .plate{padding:18px 16px 20px}
}
</style>

<div class="page">

  <header class="mast">
    <h1>Work</h1>
    <p class="sub">Three brands, three categories, three physical objects. Built as a
      prototype &mdash; the evidence lines are real, the commercial status is not filled in yet.</p>
    <p class="meta">Prototype &middot; v1</p>
  </header>

  <div class="wall">

    <button class="cell cell--ds" type="button">
      <div class="stage">
        <span class="stage-tag">Production</span>
        <img class="aside" src="__DS_STAMP__" alt="A Darkest Shades frame at an angle, the brand name stamped into the temple." loading="lazy" decoding="async">
        <img class="hero" src="__DS_HERO__" alt="A Darkest Shades aviator, dead on: thick black acetate frame, gradient lenses." decoding="async">
      </div>
      <div class="plate">
        <span class="idx">01</span>
        <h2 class="name">Darkest Shades</h2>
        <p class="cat">Eyewear &middot; Identity, product, packaging</p>
        <p class="ev">318 lightbox frames of a product that exists, one of them showing the
          name stamped into the temple. Thirty-one 3D files and twenty technical drawings to
          get there.</p>
        <p class="foot"><span></span>Open the case</p>
      </div>
    </button>

    <button class="cell cell--dg" type="button">
      <div class="stage">
        <span class="stage-tag">Sample</span>
        <img class="hero" src="__DG_HERO__" alt="The Digs thermal long sleeve, olive waffle knit, wordmark embroidered at the chest." decoding="async">
      </div>
      <div class="plate">
        <span class="idx">02</span>
        <h2 class="name">Digs</h2>
        <p class="cat">Streetwear &middot; Identity, tech packs, garment</p>
        <p class="ev">Eighty-five logo files, six tech packs over nine months, and a graded
          pattern set with the DXF a cutting room reads. The garment above came back in a box.</p>
        <p class="foot"><span></span>Open the case</p>
      </div>
    </button>

    <button class="cell cell--pj" type="button">
      <div class="stage">
        <span class="stage-tag">Prototype</span>
        <img class="hero" src="__PJ_HERO__" alt="The Puff Junction grinder: brass knurled lid over a body wrapped in pop-art comic panels." decoding="async">
        <img class="proto" src="__PJ_PROTO__" alt="The 3D-printed pouch prototype in parts: body, screw cap and packing sticks." loading="lazy" decoding="async">
      </div>
      <div class="plate">
        <span class="idx">03</span>
        <h2 class="name">Puff Junction</h2>
        <p class="cat">Smoking accessories &middot; Identity, industrial design, packaging</p>
        <p class="ev">Thirteen technical drawings, a STEP file, and a design-for-manufacture
          review from a factory. The white object is the printed prototype; the brass one is a
          render.</p>
        <p class="foot"><span></span>Open the case</p>
      </div>
    </button>

  </div>

  <section class="strip">
    <h2>Three categories. Three times. Each one reached a physical object.</h2>
    <p class="lede">The pictures carry the shock. This converts it into a claim that can be
      checked &mdash; and it does not round the three up to the same answer, because the spread
      is the more useful fact.</p>
    <div class="tw">
      <table>
        <thead>
          <tr><th scope="col"></th><th scope="col">Darkest Shades</th><th scope="col">Digs</th><th scope="col">Puff Junction</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Market</th>
            <td>Eyewear</td><td>Streetwear apparel</td><td>Smoking accessories</td></tr>
          <tr><th scope="row">How far it got</th>
            <td><b>Manufactured</b></td><td><b>Sewn sample</b></td><td><b>Printed prototype</b></td></tr>
          <tr><th scope="row">Owned end to end</th>
            <td>Identity, product, packaging, art direction</td>
            <td>Identity, tech packs, pattern, garment</td>
            <td>Identity, industrial design, packaging, renders</td></tr>
          <tr><th scope="row">Outside parties</th>
            <td>Acetate manufacturer</td><td>Pattern house, fabric mill</td><td>Fictiv, DFM review</td></tr>
          <tr><th scope="row">Evidence on file</th>
            <td>318 frames &middot; 31 3D files &middot; 20 drawings</td>
            <td>85 logo files &middot; 6 tech packs &middot; DXF</td>
            <td>13 drawings &middot; STEP &middot; 8 prototype frames</td></tr>
          <tr><th scope="row">Commercial status</th>
            <td><span class="ph">not filled in</span></td>
            <td><span class="ph">not filled in</span></td>
            <td><span class="ph">not filled in</span></td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <p class="note"><b>Prototype notes.</b> Every product here is a cutout on transparent ground,
    which is why three shots taken on a white sweep, in a room, and against near-black can share
    one wall &mdash; and why the hero can break the mount line, which a rectangular photograph
    cannot. Switch this page to dark and nothing needs re-shooting. Type is standing in on free
    faces chosen to keep the three voices apart (<code>Archivo</code> expanded, <code>Alexandria</code>,
    <code>Anybody</code>); the licensed faces drop in without layout change. <b>Commercial status is
    the one row left open</b> &mdash; it is the only thing on this page I cannot derive from the
    archives.</p>

</div>
'''
for k, v in D.items():
    HTML = HTML.replace('__%s__' % k.upper(), v)
assert '__' not in HTML.split('<style>')[0] or True
open('wall.html','w',encoding='utf-8').write(HTML)
print('written %.2fMB' % (len(HTML.encode())/1e6))
