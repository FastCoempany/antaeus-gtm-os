import json
D=json.load(open('ds.json'))
H = r'''<title>Darkest Shades Directions</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Archivo:wdth,wght@100..125,400..900&family=Jost:wght@300;400;500;600&display=swap">
<style>
:root{
  color-scheme:light;
  --bg:#F4F3F1; --card:#FBFAF9; --ink:#16161A;
  --mute:rgba(22,22,26,.60); --faint:rgba(22,22,26,.36);
  --rule:rgba(22,22,26,.14); --hair:rgba(22,22,26,.08);
  --sans:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --ow:"Archivo",var(--sans);      /* stand-in for Owners Wide */
  --st:"Jost",var(--sans);          /* stand-in for Stolzl    */
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  color-scheme:dark;
  --bg:#151517; --card:#1C1C1F; --ink:#F1F0EE;
  --mute:rgba(241,240,238,.62); --faint:rgba(241,240,238,.38);
  --rule:rgba(241,240,238,.16); --hair:rgba(241,240,238,.09);
}}
:root[data-theme="dark"]{
  color-scheme:dark;
  --bg:#151517; --card:#1C1C1F; --ink:#F1F0EE;
  --mute:rgba(241,240,238,.62); --faint:rgba(241,240,238,.38);
  --rule:rgba(241,240,238,.16); --hair:rgba(241,240,238,.09);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.6 var(--sans);-webkit-font-smoothing:antialiased}
.doc{max-width:1120px;margin:0 auto;padding-inline:20px;padding-block:44px 80px}
a{color:inherit}

.kick{font:500 10.5px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--faint)}
h1{font:700 clamp(30px,4.6vw,50px)/1.03 var(--sans);letter-spacing:-.03em;margin:14px 0 0;text-wrap:balance;max-width:17ch}
.stand{margin:18px 0 0;font-size:17.5px;line-height:1.55;color:var(--mute);max-width:60ch}
.byline{margin-top:26px;padding-top:16px;border-top:1px solid var(--rule);
  font:400 12.5px/1.5 var(--mono);color:var(--faint);display:flex;flex-wrap:wrap;gap:6px 22px}

h2{font:600 clamp(21px,2.6vw,28px)/1.2 var(--sans);letter-spacing:-.02em;margin:0;text-wrap:balance}
h3{font:600 16px/1.3 var(--sans);letter-spacing:-.01em;margin:0 0 6px}
p{margin:0 0 13px;max-width:66ch}
p:last-child{margin-bottom:0}
em{font-style:italic}
b{font-weight:600}
code{font:400 13px/1 var(--mono);background:var(--hair);padding:2px 5px;border-radius:2px}

.sec{margin-top:54px}
.sec-h{display:flex;align-items:baseline;gap:16px;padding-bottom:14px;border-bottom:1px solid var(--rule);margin-bottom:22px}
.sec-h .n{font:500 11px/1 var(--mono);letter-spacing:.14em;color:var(--faint)}

/* the three constraints */
.cons{display:grid;gap:14px;grid-template-columns:1fr}
@media(min-width:800px){.cons{grid-template-columns:repeat(3,1fr)}}
.con{background:var(--card);border:1px solid var(--rule);border-radius:2px;padding:18px 18px 20px}
.con .t{font:500 10.5px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--faint);display:block;margin-bottom:9px}
.con p{font-size:14.5px;line-height:1.55;color:var(--mute)}
.con b{color:var(--ink)}

/* ── a direction ── */
.dir{margin-top:60px;padding-top:26px;border-top:2px solid var(--ink)}
.dir-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 18px}
.dir-h .num{font:500 11px/1 var(--mono);letter-spacing:.16em;color:var(--faint)}
.dir-h .nm{font:700 clamp(25px,3.4vw,38px)/1 var(--sans);letter-spacing:-.025em}
.dir .thesis{margin-top:12px;font-size:17px;line-height:1.5;max-width:62ch}
.dir .thesis b{font-weight:600}

/* the screen frame */
.screen{margin-top:26px;border:1px solid var(--rule);border-radius:3px;overflow:hidden;
  box-shadow:0 1px 0 var(--hair),0 18px 40px -28px rgba(0,0,0,.45)}
.chrome{display:flex;align-items:center;gap:7px;padding:9px 13px;background:var(--card);border-bottom:1px solid var(--rule)}
.chrome i{width:8px;height:8px;border-radius:99px;background:var(--rule);display:block}
.chrome span{margin-left:8px;font:400 11px/1 var(--mono);color:var(--faint);letter-spacing:.03em}

/* notes under a screen */
.notes{display:grid;gap:18px;margin-top:22px;grid-template-columns:1fr}
@media(min-width:860px){.notes{grid-template-columns:1.15fr .85fr}}
.spec-list{margin:0;padding:0;list-style:none;font-size:14.5px}
.spec-list li{display:flex;gap:14px;padding:8px 0;border-bottom:1px solid var(--hair)}
.spec-list dt,.spec-list .k{flex:0 0 116px;font:400 11px/1.5 var(--mono);letter-spacing:.06em;
  text-transform:uppercase;color:var(--faint)}
.spec-list .v{flex:1;color:var(--mute)}
.spec-list .v b{color:var(--ink)}
.box{background:var(--card);border:1px solid var(--rule);border-left:3px solid var(--ink);
  border-radius:2px;padding:16px 18px}
.box h3{margin-bottom:7px}
.box p{font-size:14.5px;line-height:1.55;color:var(--mute);max-width:none}
.box.risk{border-left-color:#B4402A}
.box.risk h3{color:#B4402A}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .box.risk{border-left-color:#E08268}
 :root:not([data-theme="light"]) .box.risk h3{color:#E08268}}
:root[data-theme="dark"] .box.risk{border-left-color:#E08268}
:root[data-theme="dark"] .box.risk h3{color:#E08268}

/* comparison */
.tw{overflow-x:auto;margin-top:22px}
table{border-collapse:collapse;width:100%;min-width:700px;font-size:14px}
th,td{text-align:left;padding:12px 16px 12px 0;border-bottom:1px solid var(--rule);vertical-align:top}
thead th{font:500 10.5px/1.3 var(--mono);letter-spacing:.13em;text-transform:uppercase;color:var(--faint);padding-bottom:10px}
tbody th{font:400 11.5px/1.45 var(--mono);letter-spacing:.05em;text-transform:uppercase;color:var(--mute);
  width:158px;padding-right:22px}
td b{font-weight:600}

/* ══ SCREEN 01 · AFTER DARK ══ */
.s1{background:#08080A;color:#F2F1EF;padding:0;position:relative;overflow:hidden;font-family:var(--st)}
.s1 .nav{display:flex;align-items:center;gap:26px;padding:20px 30px;
  border-bottom:1px solid rgba(242,241,239,.10);position:relative;z-index:3}
.s1 .nav .lg{width:150px;color:#F2F1EF;display:block;flex:0 0 auto}
.s1 .nav .lg svg{width:100%;height:auto;display:block}
.s1 .nav ul{display:flex;gap:22px;margin:0 0 0 auto;padding:0;list-style:none;
  font:400 12px/1 var(--st);letter-spacing:.1em;text-transform:uppercase;color:rgba(242,241,239,.66)}
.s1 .hero{position:relative;padding:54px 30px 44px;text-align:center}
.s1 .shard{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);
  display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1}
.s1 .shard svg{width:min(86%,640px);height:auto;color:#F2F1EF;opacity:.30;
  fill:none;stroke:currentColor;stroke-width:1.2;vector-effect:non-scaling-stroke}
.s1 .shard svg path{fill:none;stroke:currentColor}
.s1 h4{position:relative;z-index:2;margin:0;font:800 clamp(27px,5.6vw,58px)/.98 var(--ow);
  font-stretch:118%;letter-spacing:.005em;text-transform:uppercase;max-width:14ch;
  margin-inline:auto;text-wrap:balance}
.s1 .sub{position:relative;z-index:2;margin:16px auto 0;max-width:40ch;
  font:300 14px/1.6 var(--st);color:rgba(242,241,239,.62)}
.s1 .prod{position:relative;z-index:2;margin:34px auto 0;width:min(78%,520px);display:block;
  filter:drop-shadow(0 26px 40px rgba(0,0,0,.85))}
.s1 .meta{display:flex;justify-content:center;gap:34px;margin-top:26px;position:relative;z-index:2;
  font:400 10.5px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:rgba(242,241,239,.42)}
.s1 .cta{position:relative;z-index:2;display:inline-block;margin-top:26px;
  border:1px solid rgba(242,241,239,.5);padding:13px 30px;
  font:500 11.5px/1 var(--st);letter-spacing:.17em;text-transform:uppercase}

/* ══ SCREEN 02 · DAYLIGHT ══ */
.s2{background:#F2F1EF;color:#0B0B0B;font-family:var(--st)}
.s2 .bar{display:flex;align-items:center;gap:22px;padding:15px 28px;border-bottom:1px solid rgba(11,11,11,.16);
  font:400 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:rgba(11,11,11,.55)}
.s2 .bar .lg{width:126px;color:#0B0B0B;flex:0 0 auto}
.s2 .bar .lg svg{width:100%;height:auto;display:block}
.s2 .bar .r{margin-left:auto;display:flex;gap:20px}
.s2 .wrap{display:grid;grid-template-columns:1fr;gap:0}
@media(min-width:760px){.s2 .wrap{grid-template-columns:1.35fr 1fr}}
.s2 .left{padding:34px 28px 30px;border-right:1px solid rgba(11,11,11,.12);
  display:flex;flex-direction:column}
.s2 h4{margin:0;font:900 clamp(30px,6.4vw,66px)/.9 var(--ow);font-stretch:122%;
  letter-spacing:-.005em;text-transform:uppercase;max-width:9ch}
.s2 .lede{margin:16px 0 0;max-width:34ch;font:300 14px/1.6 var(--st);color:rgba(11,11,11,.62)}
.s2 .shot{margin:24px 0 auto;width:min(90%,400px);display:block;
  filter:drop-shadow(0 18px 26px rgba(11,11,11,.20))}
.s2 .right{padding:26px 28px 30px}
.s2 .sh{font:400 10.5px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;
  color:rgba(11,11,11,.42);padding-bottom:10px;border-bottom:1px solid rgba(11,11,11,.14)}
.s2 dl{margin:0;padding:0}
.s2 .row{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(11,11,11,.08);
  font:400 12.5px/1.45 var(--st)}
.s2 .row .k{flex:0 0 96px;color:rgba(11,11,11,.5);
  font:400 10.5px/1.5 var(--mono);letter-spacing:.05em;text-transform:uppercase}
.s2 .row .v{flex:1;font-variant-numeric:tabular-nums}
.s2 .vlt{margin-top:16px}
.s2 .track{position:relative;height:7px;background:linear-gradient(90deg,#0B0B0B 0%,#0B0B0B 22%,#BFBDB8 100%);
  border:1px solid rgba(11,11,11,.2)}
.s2 .pin{position:absolute;top:-5px;bottom:-5px;width:2px;background:#0B0B0B;left:14%}
.s2 .scale{display:flex;justify-content:space-between;margin-top:7px;
  font:400 10px/1 var(--mono);letter-spacing:.07em;color:rgba(11,11,11,.5)}
.s2 .cmp{margin-top:20px;border:1px solid rgba(11,11,11,.18);padding:12px 13px 13px}
.s2 .cmp .t{font:500 10.5px/1 var(--mono);letter-spacing:.13em;text-transform:uppercase;
  color:rgba(11,11,11,.55);display:flex;justify-content:space-between}
.s2 .tray{display:flex;gap:9px;margin-top:11px;align-items:center}
.s2 .tray img{width:30%;display:block}
.s2 .slot{width:30%;aspect-ratio:2/1;border:1px dashed rgba(11,11,11,.28);
  display:flex;align-items:center;justify-content:center;
  font:400 9.5px/1 var(--mono);letter-spacing:.1em;color:rgba(11,11,11,.36)}

/* ══ SCREEN 03 · THE CHAIN ══ */
.s3{font-family:var(--st);background:#F2F1EF}
.s3 .bar{display:flex;align-items:center;padding:15px 24px;background:#08080A;color:#F2F1EF}
.s3 .bar .lg{width:132px;color:#F2F1EF}
.s3 .bar .lg svg{width:100%;height:auto;display:block}
.s3 .bar .t{margin-left:auto;font:400 10.5px/1 var(--mono);letter-spacing:.14em;
  text-transform:uppercase;color:rgba(242,241,239,.55)}
.s3 .chain{display:flex;overflow:hidden}
.s3 .facet{flex:1 1 0;min-width:0;padding:26px 16px 22px;display:flex;flex-direction:column;
  align-items:center;text-align:center;position:relative}
.s3 .facet:nth-child(odd){background:#08080A;color:#F2F1EF}
.s3 .facet:nth-child(even){background:#F2F1EF;color:#0B0B0B}
.s3 .facet img{width:100%;max-width:150px;display:block;margin-bottom:14px}
.s3 .facet:nth-child(odd) img{filter:drop-shadow(0 12px 18px rgba(0,0,0,.8))}
.s3 .facet:nth-child(even) img{filter:drop-shadow(0 10px 16px rgba(11,11,11,.22))}
.s3 .facet .fn{font:400 9.5px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;opacity:.5}
.s3 .facet .fm{margin-top:9px;font:800 clamp(13px,1.7vw,19px)/1 var(--ow);font-stretch:118%;
  text-transform:uppercase;letter-spacing:.01em}
.s3 .facet .fd{margin-top:7px;font:300 11px/1.45 var(--st);opacity:.62;max-width:18ch}
.s3 .band{background:#08080A;color:#F2F1EF;padding:16px 24px;display:flex;align-items:center;gap:18px;
  overflow:hidden;white-space:nowrap}
.s3 .band .run{font:900 clamp(20px,3.6vw,38px)/1 var(--ow);font-stretch:122%;text-transform:uppercase;
  letter-spacing:.01em;opacity:.92}
.s3 .band .m{flex:0 0 auto;width:34px;color:#F2F1EF;opacity:.7}
.s3 .band .m svg{width:100%;height:auto;display:block}

.foot{margin-top:56px;padding-top:20px;border-top:1px solid var(--rule);
  font-size:13.5px;line-height:1.6;color:var(--mute);max-width:74ch}
.foot b{color:var(--ink)}

@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media(max-width:620px){
  .s2 .left{border-right:0;border-bottom:1px solid rgba(11,11,11,.12)}
  .s3 .chain{flex-wrap:wrap}
  .s3 .facet{flex:1 1 50%}
  .s1 .nav ul{display:none}
  .s2 .bar .r{display:none}
}
</style>

<div class="doc">

<header>
  <p class="kick">Darkest Shades &middot; Website &middot; Direction study</p>
  <h1>Three ways to build a site for a brand that sells not being seen.</h1>
  <p class="stand">The product is a super-dark lens. The proposition is privacy, mystery, and
    &ldquo;the power of keeping things hidden.&rdquo; A commerce site&rsquo;s entire job is to show.
    Each of these resolves that contradiction differently &mdash; and that, not which one looks
    best, is what you are choosing between.</p>
  <p class="byline"><span>Visual &amp; UI</span><span>Content design</span>
    <span>Analytical UX</span><span>Drawn from the 2025 brand guidelines, 45pp</span></p>
</header>

<section class="sec">
  <div class="sec-h"><span class="n">00</span><h2>What the guidelines already decided</h2></div>
  <div class="cons">
    <div class="con"><span class="t">There is no palette</span>
      <p>Forty-five pages and <b>not one colour page</b>. Black, white, grey, and photography.
        Any direction that reaches for an accent is inventing something the brand deliberately
        does not have.</p></div>
    <div class="con"><span class="t">High-end, minimal</span>
      <p>The opportunity map puts the star at <b>high-end &times; minimal design</b> &mdash; away
        from Ray-Ban&rsquo;s maximalism and Komono&rsquo;s high street. That rules out a busy site
        however much fun it would be to build.</p></div>
    <div class="con"><span class="t">Four buyers, 29 to 50</span>
      <p>Emma, 29, LA content creator. Marcus, 34, Atlanta filmmaker. Charlotte, 42, Manhattan
        CEO. David, 50, San Francisco, collects wine and classic cars. <b>$70K to $250K+.</b>
        One site has to hold all four.</p></div>
  </div>
</section>

<!-- ═══════════ 01 ═══════════ -->
<section class="dir">
  <div class="dir-h"><span class="num">Direction 01</span><span class="nm">After Dark</span></div>
  <p class="thesis"><b>Conceal, then reveal on attention.</b> The site behaves the way the lens
    does. The ground is the darkest thing on the screen, the product emerges from it under a
    single light, and nothing is shown until you look directly at it.</p>

  <div class="screen">
    <div class="chrome"><i></i><i></i><i></i><span>darkestshades.com</span></div>
    <div class="s1">
      <div class="nav">
        <span class="lg"><svg viewBox="0 0 1080 105">__LOGO__</svg></span>
        <ul><li>Frames</li><li>Lenses</li><li>Stockists</li><li>Account</li></ul>
      </div>
      <div class="hero">
        <div class="shard"><svg viewBox="0 0 429 220">__MARK__</svg></div>
        <h4>Not just sunglasses. A statement.</h4>
        <p class="sub">Four frames this season. Ultra-dark lenses, hand-finished acetate,
          and nothing you did not ask for.</p>
        <img class="prod" src="__AVIATOR__" alt="A Darkest Shades aviator emerging from black: thick acetate frame, gradient lens.">
        <div class="meta"><span>Cat. 3 lens</span><span>Acetate</span><span>Made in limited run</span></div>
        <div><span class="cta">See the frames</span></div>
      </div>
    </div>
  </div>

  <div class="notes">
    <ul class="spec-list">
      <li><span class="k">Ground</span><span class="v"><b>#08080A</b> &mdash; below the lens, so the product is never the darkest thing on screen</span></li>
      <li><span class="k">Ink</span><span class="v">#F2F1EF at 100 / 62 / 42% &mdash; three levels, no fourth</span></li>
      <li><span class="k">Display</span><span class="v">Owners Wide, 118% width, uppercase, set to <b>14 characters a line</b></span></li>
      <li><span class="k">Body</span><span class="v">Stolzl Light 14/1.6 &mdash; light weight only, it stops the page shouting</span></li>
      <li><span class="k">Structure</span><span class="v">One centred column. No sidebar, no grid on show</span></li>
      <li><span class="k">Voice</span><span class="v">Withholding. <em>&ldquo;Four frames this season&rdquo;</em> &mdash; scarcity stated as fact, never as urgency</span></li>
    </ul>
    <div>
      <div class="box"><h3>The mechanic: the aperture</h3>
        <p>The brand mark is a torn facet, and here it is used as a <b>mask, not a logo</b>.
          Product sits behind it; the facet widens as you scroll or focus, so the frame is
          revealed through the shape of the brand rather than beside it. It is the one idea
          that keeps this from being every other dark eyewear site.</p></div>
      <div class="box risk" style="margin-top:14px"><h3>Where it breaks</h3>
        <p>Dark is the category default &mdash; strip the aperture and this is a template.
          It also fights commerce: specs, sizing and returns all read worse on black, so the
          shop would need a lighter sub-system, which is a second design job hiding inside
          this one.</p></div>
    </div>
  </div>
</section>

<!-- ═══════════ 02 ═══════════ -->
<section class="dir">
  <div class="dir-h"><span class="num">Direction 02</span><span class="nm">Daylight</span></div>
  <p class="thesis"><b>Reveal everything, and let the restraint carry the mystery.</b> Invert
    the category. Bone ground, black type at a size that is almost rude, every fact stated
    plainly. <em>&ldquo;Luxury for those who don&rsquo;t follow the rules&rdquo;</em> &mdash; and the
    rule in eyewear is that the website is black.</p>

  <div class="screen">
    <div class="chrome"><i></i><i></i><i></i><span>darkestshades.com/frames/oversized-geometric</span></div>
    <div class="s2">
      <div class="bar">
        <span class="lg"><svg viewBox="0 0 1080 105">__LOGO__</svg></span>
        <span class="r"><span>Frames</span><span>Lenses</span><span>Fit</span><span>Compare&nbsp;(2)</span></span>
      </div>
      <div class="wrap">
        <div class="left">
          <h4>Oversized geometric</h4>
          <p class="lede">Hand-finished acetate, 8&nbsp;mm front. The darkest lens we make.</p>
          <img class="shot" src="__GEO__" alt="The oversized geometric frame in black acetate, three-quarter view.">
        </div>
        <div class="right">
          <div class="sh">The numbers</div>
          <dl>
            <div class="row"><span class="k">Lens</span><span class="v">Category 3 &middot; 12% VLT</span></div>
            <div class="row"><span class="k">Lens width</span><span class="v">54 mm</span></div>
            <div class="row"><span class="k">Bridge</span><span class="v">21 mm</span></div>
            <div class="row"><span class="k">Temple</span><span class="v">145 mm</span></div>
            <div class="row"><span class="k">Front</span><span class="v">8 mm acetate</span></div>
            <div class="row"><span class="k">Weight</span><span class="v">38 g</span></div>
          </dl>
          <div class="vlt">
            <div class="sh" style="border:0;padding-bottom:7px">How dark, exactly</div>
            <div class="track"><span class="pin"></span></div>
            <div class="scale"><span>3% Darkest</span><span>12%</span><span>43% Cat.&nbsp;1</span></div>
          </div>
          <div class="cmp">
            <div class="t"><span>Compare</span><span>2 of 3</span></div>
            <div class="tray">
              <img src="__BURGUNDY__" alt="Burgundy tortoiseshell round frame, in the compare tray.">
              <img src="__BLUE__" alt="Blue tortoiseshell frame with blue lenses, in the compare tray.">
              <span class="slot">Add</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="notes">
    <ul class="spec-list">
      <li><span class="k">Ground</span><span class="v"><b>#F2F1EF</b> bone &mdash; warm enough that black acetate reads as material, not silhouette</span></li>
      <li><span class="k">Ink</span><span class="v">#0B0B0B. The product stays the darkest thing on the page, which is the point</span></li>
      <li><span class="k">Display</span><span class="v">Owners Wide Black, 122% width, <b>set huge</b> &mdash; at that scale on bone it is more severe than white on black</span></li>
      <li><span class="k">Data</span><span class="v">Stolzl with tabular figures, and a mono key column so numbers line up down the rail</span></li>
      <li><span class="k">Structure</span><span class="v">Object left, evidence right. The rail is persistent and never collapses into a tab</span></li>
      <li><span class="k">Voice</span><span class="v">Unembellished. <em>&ldquo;The darkest lens we make&rdquo;</em> &mdash; a claim you can check, next to the number that proves it</span></li>
    </ul>
    <div>
      <div class="box"><h3>The mechanic: the spec</h3>
        <p>Eyewear sites hide the two things a considered buyer actually needs &mdash;
          <b>how dark the lens is</b> and <b>whether it fits</b>. Here they lead: visible light
          transmission on a real scale, fit in millimetres, and a compare tray that holds three
          frames at once. Charlotte and David do not buy on mood; they buy on evidence, and this
          is the direction that hands it to them.</p></div>
      <div class="box risk" style="margin-top:14px"><h3>Where it breaks</h3>
        <p>It can read clinical &mdash; a lab, not a luxury house. All the seduction has to come
          from the photography, which means the shoot stops being a nice-to-have and becomes the
          load-bearing element. It is also the furthest from the guidelines&rsquo; own mockups,
          so it needs arguing for rather than pointing at.</p></div>
    </div>
  </div>
</section>

<!-- ═══════════ 03 ═══════════ -->
<section class="dir">
  <div class="dir-h"><span class="num">Direction 03</span><span class="nm">The Chain</span></div>
  <p class="thesis"><b>Conceal and reveal as a rhythm, not a state.</b> Graphic Element 3 in the
    guidelines is the mark repeated into a chain. Here that chain <em>is</em> the page: alternating
    black and bone facets you move along, so the site is never dark or light &mdash; it is both,
    in sequence.</p>

  <div class="screen">
    <div class="chrome"><i></i><i></i><i></i><span>darkestshades.com</span></div>
    <div class="s3">
      <div class="bar">
        <span class="lg"><svg viewBox="0 0 1080 105">__LOGO__</svg></span>
        <span class="t">Spring 2025 &middot; four frames</span>
      </div>
      <div class="chain">
        <div class="facet"><img src="__C1__" alt="Darkest Shades aviator, three-quarter view.">
          <span class="fn">01</span><span class="fm">Aviator</span>
          <span class="fd">Gradient lens. The one people recognise.</span></div>
        <div class="facet"><img src="__C2__" alt="A squared black acetate frame, side angle.">
          <span class="fn">02</span><span class="fm">Squared</span>
          <span class="fd">Flat top, 8&nbsp;mm front, no taper.</span></div>
        <div class="facet"><img src="__C3__" alt="A Darkest Shades frame showing the name stamped into the temple.">
          <span class="fn">03</span><span class="fm">Stamped</span>
          <span class="fd">The name is cut into the temple, not printed.</span></div>
        <div class="facet"><img src="__C4__" alt="A slim black frame with fine metal temples.">
          <span class="fn">04</span><span class="fm">Slim</span>
          <span class="fd">Wire temple. The quiet one.</span></div>
      </div>
      <div class="band">
        <span class="m"><svg viewBox="0 0 429 220">__MARK__</svg></span>
        <span class="run">For those who dare to see differently</span>
      </div>
    </div>
  </div>

  <div class="notes">
    <ul class="spec-list">
      <li><span class="k">Ground</span><span class="v"><b>Both</b> &mdash; #08080A and #F2F1EF alternating per facet, never blended</span></li>
      <li><span class="k">Ink</span><span class="v">Each facet inverts. A frame is lit or silhouetted depending where it sits in the chain</span></li>
      <li><span class="k">Display</span><span class="v">Owners Wide running across the seam and <b>cropped by the facet edge</b>, per Graphic Element 1</span></li>
      <li><span class="k">Structure</span><span class="v">The chain from Graphic Element 3, promoted from ornament to layout</span></li>
      <li><span class="k">Pattern</span><span class="v">The line construction on p.38 becomes the underlying grid, not a background</span></li>
      <li><span class="k">Voice</span><span class="v">Cultural rather than commercial. Each facet names a moment, not a feature</span></li>
    </ul>
    <div>
      <div class="box"><h3>The mechanic: the chain is the navigation</h3>
        <p>The guidelines draw the chain and then use it as decoration. Making it the
          <b>structure</b> is the only move here that the brand has already half-invented for
          itself &mdash; which means this direction can be argued from the document rather than
          from taste. It is also the one where the four buyers take different things from the
          same page: Emma reads the cultural facets, David reads the product ones.</p></div>
      <div class="box risk" style="margin-top:14px"><h3>Where it breaks</h3>
        <p>Horizontal movement is a usability tax, and it collapses awkwardly on a phone &mdash;
          the very device Emma and Marcus live on. It is also the direction most likely to tip
          <b>maximal</b>, which the opportunity map explicitly rules out. It only survives if
          the palette stays two colours and the discipline never slips.</p></div>
    </div>
  </div>
</section>

<!-- comparison -->
<section class="sec" style="margin-top:62px">
  <div class="sec-h"><span class="n">04</span><h2>Choosing between them</h2></div>
  <p>Ranked on the axes that actually differ. The visual preference is the least useful of them,
    so it is not a row.</p>
  <div class="tw">
    <table>
      <thead><tr><th scope="col"></th><th scope="col">01 After Dark</th><th scope="col">02 Daylight</th><th scope="col">03 The Chain</th></tr></thead>
      <tbody>
        <tr><th scope="row">Resolves conceal / reveal by</th>
          <td>Hiding until asked</td><td>Showing everything</td><td>Alternating</td></tr>
        <tr><th scope="row">Serves best</th>
          <td>Emma, Marcus<br><span style="color:var(--faint)">the mood buyers</span></td>
          <td>Charlotte, David<br><span style="color:var(--faint)">the evidence buyers</span></td>
          <td>All four, differently</td></tr>
        <tr><th scope="row">Fidelity to the deck</th>
          <td><b>Highest</b> &mdash; it is p.33, 39 and 42</td>
          <td>Lowest visually, <b>highest to the opportunity map</b></td>
          <td>Highest to the graphic system</td></tr>
        <tr><th scope="row">Commerce readiness</th>
          <td>Weak &mdash; needs a second light sub-system for the shop</td>
          <td><b>Strongest</b> &mdash; the spec rail is the shop</td>
          <td>Weakest &mdash; sells a mood, not a size</td></tr>
        <tr><th scope="row">Phone</th>
          <td>Good</td><td><b>Good</b></td><td>Compromised &mdash; the chain stacks</td></tr>
        <tr><th scope="row">Main risk</th>
          <td>Category-generic</td><td>Clinical</td><td>Tips maximal</td></tr>
        <tr><th scope="row">Build effort</th>
          <td>Low</td><td>Medium</td><td>High</td></tr>
      </tbody>
    </table>
  </div>
</section>

<p class="foot"><b>What I would put money on.</b> 02 as the site, with 01 as the campaign. Daylight
  is the harder argument and the better business: it is the only one that can take payment without
  a second design system underneath it, it is the position the brand&rsquo;s own opportunity map
  already chose, and inverting a category that is uniformly black is a stronger claim to
  <em>refined rebellion</em> than being black more beautifully. After Dark is what the brand
  already looks like &mdash; which makes it the right register for a launch film, a lookbook and
  the first screen of a campaign, not for the page where someone picks a bridge width.
  <br><br>Every product shot here is a cutout on transparent ground, which is why the same four
  frames appear on black, on bone, and alternating between them without a re-shoot. Type is
  standing in on free faces &mdash; <code>Archivo</code> expanded for Owners Wide,
  <code>Jost</code> for Stolzl &mdash; but the mark and the logotype are the real vectors,
  pulled from the identity files.</p>

</div>
'''
sub = {'__LOGO__':D['logo'],'__MARK__':D['mark'],'__AVIATOR__':D['aviator'],'__GEO__':D['geo'],
       '__BURGUNDY__':D['burgundy'],'__BLUE__':D['blue'],
       '__C1__':D['c1'],'__C2__':D['c2'],'__C3__':D['c3'],'__C4__':D['c4']}
for k,v in sub.items(): H=H.replace(k,v)
open('ds-directions.html','w',encoding='utf-8').write(H)
import re
left=set(re.findall(r'__[A-Z0-9_]+__',H))
print('written %.2fMB  unresolved:%s'%(len(H.encode())/1e6, left or 'none'))
