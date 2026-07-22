if(window.gtmDemoStorageBootstrap&&typeof window.gtmDemoStorageBootstrap.bootstrapEnvironmentMode==='function'){
  window.gtmDemoStorageBootstrap.bootstrapEnvironmentMode({forceMode:'demo'});
}

function ensureDemoAnalytics(){
  if(document.querySelector('script[data-gtmos-analytics-config]')) return;
  var configScript=document.createElement('script');
  configScript.src='/js/analytics-site-config.js';
  configScript.setAttribute('data-gtmos-analytics-config','true');
  document.head.appendChild(configScript);

  var analyticsScript=document.createElement('script');
  analyticsScript.src='/js/analytics.js';
  analyticsScript.setAttribute('data-gtmos-analytics-runtime','true');
  document.head.appendChild(analyticsScript);
}

function trackDemo(name,props){
  try{
    if(window.gtmAnalytics&&typeof window.gtmAnalytics.track==='function'){
      window.gtmAnalytics.track(name,Object.assign({stage:'demo_lane'},props||{}));
    }
  }catch(e){}
}

function renderDemoLane(){
  var card=document.querySelector('.card');
  if(!card) return;
  card.innerHTML='' +
    '<div class="eyebrow">Self-Serve Demo Lane</div>' +
    '<div class="hero">' +
      '<div class="hero-copy">' +
        '<div class="logo">antaeus<span>.</span></div>' +
        '<div class="sub">Sample workspace, real system flow</div>' +
        '<h1>Pick the demo that makes Antaeus believable in one session.</h1>' +
        '<p>This is the guided sample workspace for seeing how signal, territory, outbound, discovery, deal motion, proof, and handoff all stack inside one operating system.</p>' +
        '<div class="note-list">' +
          '<div class="note"><strong>What is sample</strong>Accounts, deals, touches, advisor moves, PoC motion, and handoff evidence are seeded so the product never feels empty.</div>' +
          '<div class="note"><strong>What is real</strong>The module logic, module handshakes, saved state, tour path, and shell behavior are the real app. Demo data just makes the story legible.</div>' +
        '</div>' +
        '<div class="quick-links">' +
          '<a class="link-chip" href="/purchase/?entry=demo-lane">See Annual Plan</a>' +
          '<a class="link-chip" href="/login.html">Sign In</a>' +
          '<a class="link-chip" href="/methodology/">Read Methodology</a>' +
        '</div>' +
      '</div>' +
      '<div class="hero-side">' +
        '<h2>What this demo should prove</h2>' +
        '<p>By the time you hit dashboard, the path should feel coherent enough to explain in a Loom, a live demo, or a founder handoff conversation.</p>' +
        '<ul class="proof-list">' +
          '<li>Signal Console feeds territory, deal, and outbound context instead of living in isolation.</li>' +
          '<li>Discovery, autopsy, and PoC work look like one system, not separate templates.</li>' +
          '<li>The handoff path is visible, not theoretical.</li>' +
          '<li>Sample data is clearly marked as sample, and real workspace return is easy.</li>' +
        '</ul>' +
      '</div>' +
    '</div>' +
    '<div class="scenario-grid">' +
      '<button class="btn btn-mm" onclick="seed(\'smb\')"><span class="scenario-type">Book one</span><span class="scenario-title">SMB book</span><span class="scenario-meta">$55K deals - $800K number - 29 accounts</span><span class="scenario-body">Jordan Park\'s book at Luca Industries: growth brands and scale-ups, fast cycles, a pilot running at Notion, and a deal at the finish line with Sweetgreen.</span></button>' +
      '<button class="btn btn-ent" onclick="seed(\'ent\')"><span class="scenario-type">Book two</span><span class="scenario-title">Enterprise book</span><span class="scenario-meta">$280K deals - $2M number - 29 accounts</span><span class="scenario-body">Elena Vasquez\'s book at Luca Industries: Boeing at the security-review front, a pilot running at OpenAI, and household names across aviation, retail, and AI.</span></button>' +
    '</div>' +
    '<div class="toolbar">' +
      '<div class="toolbar-copy">Choose one narrative, seed the workspace, and move straight into dashboard.</div>' +
      '<button class="btn-clear" onclick="clearAll()">Reset Demo Workspace</button>' +
    '</div>' +
    '<div class="status" id="status"></div>' +
    '<div class="count" id="count"></div>';
}

// Pages that carry their own static lane markup (the bright
// 2026-07-09 rebuild of demo-seed.html) opt out of the injected
// legacy card + title.
if(!document.querySelector('[data-demo-lane="static"]')){
  document.title='Antaeus Demo Workspace';
  renderDemoLane();
}
ensureDemoAnalytics();

function d(n){return new Date(Date.now()-n*86400000).toISOString()}
function uid(pre){return(pre||'id')+'_'+Date.now()+'_'+Math.random().toString(36).substr(2,6)}

// ══════════════════════════════════════════════════════════════
// SEED WRITER
// ══════════════════════════════════════════════════════════════
function countGtmKeys(){
  try{
    if(window.gtmDemoStorageBootstrap&&typeof window.gtmDemoStorageBootstrap.countVisibleGtmKeys==='function'){
      return window.gtmDemoStorageBootstrap.countVisibleGtmKeys();
    }
  }catch(e){}
  var c=0;
  try{
    for(var i=0;i<localStorage.length;i++){
      var key=localStorage.key(i);
      if(key&&key.indexOf('gtmos_')===0)c++;
    }
  }catch(e){}
  return c;
}

function updateCount(){
  var c=countGtmKeys();
  var countNode=document.getElementById('count');
  if(countNode){
    countNode.textContent=c+' demo keys currently live in this browser';
  }
}

function purgeVisibleGtmKeysFallback(){
  var removed=0;
  var keys=[];
  try{
    for(var i=0;i<localStorage.length;i++){
      var key=localStorage.key(i);
      if(key&&key.indexOf('gtmos_')===0){
        keys.push(key);
      }
    }
    keys.forEach(function(key){
      localStorage.removeItem(key);
      removed++;
    });
  }catch(e){}
  return removed;
}

// ══════════════════════════════════════════════════════════════
// LUCA SEED WRITER — data lives in js/demo-seed-data-ent.js and
// js/demo-seed-data-smb.js (window.__LUCA_SEED__). This file only
// writes it into the demo namespace. Plan:
// deliverables/plans/antaeus-demo-seed-luca-plan-2026-07-16.md
// ══════════════════════════════════════════════════════════════
function getScenarioMeta(mode){
  return mode==='ent'
    ? {name:'Enterprise book',label:'enterprise',redirect:'/dashboard/?demo=1'}
    : {name:'SMB book',label:'smb',redirect:'/dashboard/?demo=1'};
}
function buildStatusMarkup(meta,data,returnUrl){
  var live=data.deals.filter(function(x){return x.stage!=='closed-won'&&x.stage!=='closed-lost'}).length;
  return 'The '+meta.name+' is loaded - '+data.accounts.length+' accounts being watched, '
    +live+' live deals, a pilot in flight.<br>'
    +'<a href="'+returnUrl+'">Open the workspace &rarr;</a>';
}
function localDayStr(offset){
  var t=new Date(Date.now()-offset*86400000);
  function p(n){return n<10?('0'+n):String(n)}
  return t.getFullYear()+'-'+p(t.getMonth()+1)+'-'+p(t.getDate());
}

window.seed=function(mode){
  mode=(mode==='mm')?'smb':mode;
  var data=(window.__LUCA_SEED__||{})[mode];
  var status=document.getElementById('status');
  if(!data){
    if(status){status.className='status err';status.textContent='The sample data did not load. Refresh and try again.'}
    return;
  }
  var meta=getScenarioMeta(mode);
  var keys=0;
  var params;
  var autoSeed='';
  var returnUrl=meta.redirect;

  function w(k,v){localStorage.setItem(k,JSON.stringify(v));keys++}
  function wRaw(k,v){localStorage.setItem(k,String(v));keys++}

  try{
    params=new URLSearchParams(window.location.search||'');
    autoSeed=(params.get('autoseed')||'').toLowerCase();
    if(autoSeed==='mm')autoSeed='smb';
    returnUrl=params.get('return')||meta.redirect;
  }catch(e){}

  try{
    if(window.gtmDemoStorageBootstrap&&typeof window.gtmDemoStorageBootstrap.purgeDemoNamespace==='function'){
      window.gtmDemoStorageBootstrap.purgeDemoNamespace();
    }else{
      purgeVisibleGtmKeysFallback();
    }
  }catch(e){}

  var nowIso=new Date().toISOString();
  wRaw('gtmos_noauth_mode','1');
  wRaw('gtmos_noauth_email',data.operator.email);
  w('gtmos_profile_cache',{id:'demo-workspace',full_name:data.operator.name,company_name:'Luca Industries',email:data.operator.email,role:'ae',onboarding_completed:true});
  w('gtmos_onboarding',{completed:true,completedAt:nowIso,answers:data.onboardingAnswers});
  wRaw('gtmos_onboarding_completed_at',nowIso);
  w('gtmos_activation_context',{company:'Luca Industries',role:data.operator.role,productCategory:'recruiting',productCategoryLabel:'Recruiting / Talent / HR',categoryLabel:'Recruiting / Talent / HR'});
  w('gtmos_outbound_seed',data.seed);
  w('gtmos_playbook',data.playbook);
  w('gtmos_product_category','recruiting');
  w('gtmos_icp_analytics',{icps:data.icps,totalWorked:data.icps.filter(function(i){return i.worked}).length});
  w('gtmos_sc_v4',{accounts:data.accounts,mode:'complex'});
  w('gtmos_deal_workspaces',data.deals);
  w('gtmos_deal_stage_history',data.stageHistory);

  var outcomes={};
  data.deals.forEach(function(x){
    if(x.stage==='closed-won') outcomes[x.id]={type:'won',date:x.closeDate};
    if(x.stage==='closed-lost') outcomes[x.id]={type:'lost',date:x.closeDate,reason:x.lossReason};
  });
  w('gtmos_deal_outcomes',outcomes);
  w('gtmos_advisor_registry',{advisors:data.advisors});
  w('gtmos_advisor_deployments',{deployments:data.deployments});

  var sh=data.shared;
  w('gtmos_outbound_touches',sh.outboundTouches);
  w('gtmos_cold_call_log',sh.coldCallLog);
  w('gtmos_linkedin_log',sh.linkedinLog);
  w('gtmos_angles',sh.angles);
  w('gtmos_discovery_stats',sh.discoveryStats);
  w('gtmos_discovery_worked',sh.discoveryWorked);
  w('gtmos_discovery_call_log',sh.discoveryCallLog);
  w('gtmos_discovery_agenda',sh.discoveryAgenda);
  w('gtmos_autopsy_log_v1',sh.autopsyLog);
  w('gtmos_autopsy_snapshots',sh.autopsySnapshots);
  w('gtmos_poc_data',sh.pocData);
  w('gtmos_playbook_notes',sh.playbookNotes);

  var t=data.territory;
  w('gtmos_territory',t.territory);
  w('gtmos_ta_setup',t.setup);
  w('gtmos_ta_focuses',t.focuses);
  w('gtmos_ta_approaches',t.approaches);
  w('gtmos_ta_accounts',t.accounts);
  w('gtmos_ta_dispositions',t.dispositions);
  w('gtmos_ta_signals',t.signals);
  w('gtmos_ta_swap_history',t.swapHistory);
  w('gtmos_ta_retier_history',t.retierHistory);
  w('gtmos_ta_calibrations',t.calibrations);

  var sw=data.sourcing;
  w('gtmos_sw_query_cards',sw.queryCards);
  w('gtmos_sw_prospects',sw.prospects);
  w('gtmos_sw_persona_maps',sw.personaMaps);

  w('gtmos_qw_inputs',{quota:data.seed.annual_quota,acv:data.seed.avg_deal_size,winRate:data.seed.win_rate,cycle:data.seed.cycle_days});
  w('gtmos_quota_targets',data.quotaTargets);
  var bulk={};
  (data.bulkDays||[]).forEach(function(n,i){bulk[localDayStr(i)]=n});
  w('gtmos_bulk_outreach_v1',bulk);
  var mNow=new Date();
  function p2(n){return n<10?('0'+n):String(n)}
  w('gtmos_captured_meetings_v1',{month:mNow.getFullYear()+'-'+p2(mNow.getMonth()+1),held:data.capturedHeld||0});
  w('gtmos_pilot_desk_v1',data.pilotDesk||{});
  w('gtmos_getting_to_signed_v1',data.gts||{});
  w('gtmos_cold_call_custom_pushbacks_v1',data.customPushbacks||[]);
  // Signal Console v4 is cloud-native: accounts hydrate from the
  // demo-local `signal_console_accounts` table (signals ride each
  // account row's data blob; the standalone `signals` table gets the
  // same rows) — without these, every card reads "no signals yet".
  var scRows=[]; var sigRows=[];
  (data.accounts||[]).forEach(function(a){
    var sigs=(a.signals||[]).map(function(g){
      return {id:g.id,signal_type:g.cat||'other',headline:g.headline||'',source:g.source_name||'',
        published_date:g.published_date||null,fetched_at:g.fetched_at||g.published_date||null,
        confidence:(typeof g.confidence==='number')?g.confidence:null,is_ai:!!g.is_ai,flagged:false,
        note:'',data:{detail:g.detail||'',why_it_matters:g.why_it_matters||'',status:g.status||''}};
    });
    scRows.push({id:a.id,account_name:a.name,ticker:a.ticker||null,domain:a.domain||null,
      industry:a.industry||null,relationship_type:'prospect',last_enriched_at:null,
      created_at:a.created_at||new Date().toISOString(),updated_at:a.updated_at||new Date().toISOString(),
      data:{hq:a.hq||'',employees:a.employees||'',signals:sigs}});
    sigs.forEach(function(g){sigRows.push(Object.assign({account_id:a.id},g))});
  });
  try{localStorage.setItem('gtmos_demo__signal_console_accounts',JSON.stringify(scRows));keys++}catch(e){}
  try{localStorage.setItem('gtmos_demo__signals',JSON.stringify(sigRows));keys++}catch(e){}

  // The LinkedIn + Outbound rooms boot from the cloud `sequences`
  // table (demo-local: gtmos_demo__sequences) and REPLACE local state
  // when cloud rows exist. Pre-seed that table in cloud row shape so
  // both rooms boot deterministically on the seeded history instead of
  // running a boot-time migration.
  var seqRows=[];
  (sh.linkedinLog.actions||[]).forEach(function(a,i){
    seqRows.push({id:'seq_li_'+mode+'_'+i,sequence_key:'linkedin',name:a.accountName||'',title:'',created_at:a.createdAt,
      data:{contactName:a.contactName||'',actionType:a.actionType||a.type||'connection',temperature:'cool',content:'',
        motionKey:'credibility',motionLabel:'',cueLabel:a.cueLabel||'',whyNow:'',recommendedNext:'',
        outcome:a.outcome||null,outcomeDate:a.outcomeDate||null}});
  });
  (sh.outboundTouches.touches||[]).forEach(function(x,i){
    seqRows.push({id:'seq_ob_'+mode+'_'+i,sequence_key:'outbound',name:x.accountName||'',title:x.content||'',created_at:x.createdAt,
      data:{account:x.account||'',accountName:x.accountName||'',contactName:x.contactName||'',contactTitle:x.contactTitle||'',
        persona:x.persona,temperature:x.temperature,channel:x.channel,trigger:x.trigger,ctaType:x.ctaType,
        assetUsed:x.assetUsed,outcome:x.outcome||null,outcomeDate:x.outcomeDate||null,dealId:x.dealId||null,
        qualityScore:x.qualityScore||0,motionBand:x.motionBand||'workable'}});
  });
  try{localStorage.setItem('gtmos_demo__sequences',JSON.stringify(seqRows));keys++}catch(e){}

  // Outdoors Events rows land on the demo-local data client's key —
  // already namespaced, so the shim passes it through untouched.
  try{
    localStorage.setItem('gtmos_demo__outdoors_events',JSON.stringify(data.outdoorsEvents||[]));
    keys++;
  }catch(e){}

  w('gtmos_demo_seed_meta',{mode:mode,scenario:meta.label,seededAt:nowIso,version:'v3-luca',entry:'demo_lane'});

  if(status){
    status.className='status ok';
    status.innerHTML=buildStatusMarkup(meta,data,returnUrl);
  }
  updateCount();
  trackDemo('demo_seed_complete',{demo_mode:mode,scenario:meta.label,accounts:data.accounts.length,deals:data.deals.length,touches:sh.outboundTouches.touches.length,return_path:returnUrl});

  try{
    if(autoSeed&&autoSeed===String(mode||'').toLowerCase()){
      trackDemo('demo_autoseed_requested',{demo_mode:mode,scenario:meta.label,return_path:returnUrl});
      if(status)status.innerHTML+='<br><br>Opening the workspace...';
      setTimeout(function(){window.location.href=returnUrl;},700);
      return;
    }
  }catch(e){}

  if(status)status.innerHTML+='<br><br>Opening the workspace...';
  setTimeout(function(){window.location.href=returnUrl;},900);
};

window.clearAll=function(){
  var cleared=countGtmKeys();
  try{
    if(window.gtmDemoStorageBootstrap&&typeof window.gtmDemoStorageBootstrap.purgeDemoNamespace==='function'){
      window.gtmDemoStorageBootstrap.purgeDemoNamespace();
    }else{
      purgeVisibleGtmKeysFallback();
    }
  }catch(e){}
  document.getElementById('status').className='status';
  document.getElementById('status').textContent=cleared+' demo keys cleared. You can seed a fresh workspace.';
  updateCount();
  trackDemo('demo_reset_click',{cleared_keys:cleared});
};
updateCount();
trackDemo('demo_lane_loaded',{path:window.location.pathname});
try{
  var autoParams=new URLSearchParams(window.location.search||'');
  var autoMode=(autoParams.get('autoseed')||'').toLowerCase();
  if(autoMode==='mm')autoMode='smb';
  if(autoMode==='smb'||autoMode==='ent'){
    setTimeout(function(){seed(autoMode)},120);
  }
}catch(e){}
