(function(){
  const variantMeta = {
    strict: {
      title: 'Framework rail',
      subtitle: 'Antaeus discovery surface with framework rail, emergency compress, collapsible segment stack, inline “they respond / your move”, and live dossier.',
      framework: 'customer-support'
    },
    jump: {
      title: 'Segment jump',
      subtitle: 'Antaeus discovery surface with faster mid-call movement via a sticky segment jump strip layered above the stack.',
      framework: 'sales-revenue'
    },
    quiet: {
      title: 'Panel quiet',
      subtitle: 'Antaeus discovery surface with less side-panel weight so the center stack dominates while the dossier stays docked.',
      framework: 'manufacturing'
    }
  };

  const evaluationBySegment = {
    'opening-frame':['p','q'],
    'current-state-truth':['q','x'],
    'pain-and-consequence':['q','x','f'],
    'trigger-and-urgency':['q','f'],
    'stakeholder-and-ownership':['x','q'],
    'proof-threshold':['x','v'],
    'current-vendor-and-displacement':['q','x','v'],
    'decision-architecture':['x','f'],
    'next-step-lock':['c','p'],
    'post-call-routing':['c','v']
  };

  const frameworks = [
    {
      key:'customer-support',
      name:'Customer Support / Operations',
      short:'CX / Support',
      persona:'VP Support Ops',
      target:'Support volume, workflow, escalation, and human fallback',
      platform:'Zendesk / Intercom / in-house bot',
      pain:'Deflection is cosmetic, escalations are expensive, workflow ownership is blurry',
      why:'Need to prove where automation breaks and whether humans are absorbing the expensive edge cases',
      proof:'Workflow map, escalation path, and one real next-step owner',
      nextRoom:'Call Planner or Deal Workspace',
      prompt:'The rep is diagnosing support workflow truth, not pitching AI in the abstract.',
      differentiators:[
        'Shows where automation fails, not just where tickets exist',
        'Keeps the rep inside the call instead of reading a playbook',
        'Every branch tells the rep what to ask or where to jump next'
      ],
      angles:[
        'Expensive human fallback',
        'Escalation path is unclear',
        'Workflow sounds standard but breaks under load',
        'Internal build may be masking pain'
      ]
    },
    {
      key:'sales-revenue',
      name:'Sales / Revenue Intelligence',
      short:'Sales / Revenue',
      persona:'VP Revenue Operations',
      target:'Forecast quality, rep behavior, and deal reality',
      platform:'CRM, sequence tools, call recording, spreadsheets',
      pain:'Pipeline is active but not real, qualification is thin, next steps drift',
      why:'Need to surface where the revenue machine is decorative versus dependable',
      proof:'One real deal with owner, dated next step, and decision path',
      nextRoom:'Deal Workspace or Future Autopsy',
      prompt:'The rep is proving whether the pipeline is real enough to trust.',
      differentiators:[
        'Turns vague pipeline talk into operating truth',
        'Keeps every move tied to a live deal',
        'Routes quickly into deal pressure if the buyer gets specific'
      ],
      angles:[
        'Forecast drift',
        'Manager inspection gap',
        'No proof of rep behavior change',
        'Too many “active” deals'
      ]
    },
    {
      key:'manufacturing',
      name:'Manufacturing / Supply Chain Engineering',
      short:'Supply Chain',
      persona:'Head of Supply Chain Risk',
      target:'Supplier resilience, disruption response, and planning',
      platform:'Planning tools, spreadsheets, monitoring feeds',
      pain:'Monitoring exists but does not change decisions fast enough',
      why:'Need to separate reactive monitoring from proactive operational planning',
      proof:'Named disruption scenario, owner, and next resilience review',
      nextRoom:'Call Planner or Discovery Studio follow-up',
      prompt:'The rep is sorting monitoring from simulation, and reaction from planning.',
      differentiators:[
        'Separates alerting from operational simulation',
        'Surfaces whether resilience is proactive or reactive',
        'Keeps the call usable while the buyer thinks through scenarios'
      ],
      angles:[
        'Supplier alerts everywhere',
        'Scenario planning is shallow',
        'No owner for disruption drills',
        'Tool overlap'
      ]
    },
    {
      key:'data-intelligence',
      name:'Data / Intelligence Infrastructure',
      short:'Data / Intel',
      persona:'Head of Product Data',
      target:'Real-time external data, retrieval, and platform fit',
      platform:'Search APIs, news feeds, internal retrieval layers',
      pain:'Teams say they need live data but can’t define what “live” changes',
      why:'Need to know whether this is infrastructure, feature fuel, or a platform wedge',
      proof:'One production use case with freshness requirement and owner',
      nextRoom:'Call Planner or Deal Workspace',
      prompt:'The rep is finding the real production dependency on external data.',
      differentiators:[
        'Keeps “data infrastructure” from becoming abstract',
        'Forces one production use case into the open',
        'Turns retrieval claims into operational criteria'
      ],
      angles:[
        'Freshness pressure',
        'Hallucination avoidance',
        'Developer adoption',
        'Procurement asks for reliability proof'
      ]
    },
    {
      key:'legal-ops',
      name:'Legal / Legal Ops / Law Workflow',
      short:'Legal Ops',
      persona:'Legal Operations Lead',
      target:'Intake, review, contract flow, and bottlenecks',
      platform:'CLM, email, ticketing, shared docs',
      pain:'Requests are tracked, but legal throughput is still manual and slow',
      why:'Need to know where workflow actually breaks before talking AI leverage',
      proof:'One request type with delay, owner, and acceptance condition',
      nextRoom:'Call Planner or Deal Workspace',
      prompt:'The rep is finding where legal work becomes operational drag.',
      differentiators:[
        'Pushes from “AI for legal” into workflow truth',
        'Finds one request type that deserves automation',
        'Anchors every move in a real operating path'
      ],
      angles:[
        'Intake chaos',
        'Clause review delay',
        'Approval path ambiguity',
        'Security or procurement drag'
      ]
    },
    {
      key:'recruiting',
      name:'Recruiting / Talent / HR / People Workflow',
      short:'Recruiting',
      persona:'Talent Operations Lead',
      target:'Candidate screening, recruiter load, and process handoff',
      platform:'ATS, scheduling, coordinator motion',
      pain:'The workflow has software but not control',
      why:'Need to learn whether the pain is recruiter capacity, hiring manager drag, or candidate experience',
      proof:'One funnel stage with owner, bottleneck, and measurable miss',
      nextRoom:'Call Planner',
      prompt:'The rep is locating the exact point where talent workflow breaks.',
      differentiators:[
        'Turns headcount talk into process truth',
        'Keeps the rep inside one real funnel stage',
        'Builds a live decision path from recruiter pain'
      ],
      angles:[
        'Coordinator overload',
        'Hiring manager latency',
        'Candidate dropoff',
        'Screening quality mismatch'
      ]
    },
    {
      key:'product-ux',
      name:'Product / UX / Enablement / Knowledge Workflow',
      short:'Product / UX',
      persona:'Head of Product Enablement',
      target:'Knowledge, research flow, and internal adoption',
      platform:'Docs, knowledge base, research repos, tickets',
      pain:'Teams say the knowledge exists, but the organization still cannot use it in time',
      why:'Need to expose whether the problem is findability, trust, freshness, or ownership',
      proof:'One workflow where knowledge delay changes output quality',
      nextRoom:'Call Planner',
      prompt:'The rep is proving whether the knowledge layer is actually usable.',
      differentiators:[
        'Finds the real workflow consequence of poor knowledge flow',
        'Keeps the call grounded in use, not theory',
        'Routes quickly into proof expectations'
      ],
      angles:[
        'Knowledge sprawl',
        'Search failure',
        'Documentation ownership',
        'Research buried in tools'
      ]
    },
    {
      key:'govtech',
      name:'GovTech / Compliance / Public-Sector Operations / Trust and Safety',
      short:'GovTech',
      persona:'Program Operations Director',
      target:'Case throughput, review burden, and compliance exposure',
      platform:'Case systems, review queues, policy steps',
      pain:'The queue is visible, but operational trust is still thin',
      why:'Need to know whether the value is faster review, tighter compliance, or lower case risk',
      proof:'One review path with policy threshold, approver, and failure mode',
      nextRoom:'Call Planner or Deal Workspace',
      prompt:'The rep is locating the real trust threshold in the workflow.',
      differentiators:[
        'Separates compliance theater from operational control',
        'Turns queue talk into one measurable review path',
        'Keeps proof burden visible in the call'
      ],
      angles:[
        'Backlog pressure',
        'Policy drift',
        'Approval bottlenecks',
        'Audit sensitivity'
      ]
    },
    {
      key:'ai-native',
      name:'AI-Native Buyer Discovery Framework',
      short:'AI-Native',
      persona:'Founding GTM lead',
      target:'Product wedge, workflow insertion, and proof burden',
      platform:'Agent, assistant, workflow layer, or API stack',
      pain:'The buyer likes the concept but the insertion point is still fuzzy',
      why:'Need to learn where the product becomes indispensable rather than interesting',
      proof:'One workflow insertion point, one before/after state, one buyer owner',
      nextRoom:'Call Planner or Deal Workspace',
      prompt:'The rep is locking the insertion point before talking scale.',
      differentiators:[
        'Built for AI-native ambiguity',
        'Forces one insertion point into focus',
        'Prevents the call from collapsing into generic AI enthusiasm'
      ],
      angles:[
        'Interesting but not urgent',
        'Unclear owner',
        'Proof burden is still undefined',
        'Pilot scope drift'
      ]
    }
  ];

  const segmentTemplates = [
    { key:'opening-frame', num:'01', title:'Opening frame', cue:'Set the surface clean', essential:true },
    { key:'current-state-truth', num:'02', title:'Current-state truth', cue:'Map the workflow', essential:true },
    { key:'pain-and-consequence', num:'03', title:'Pain and consequence', cue:'Name the cost', essential:true },
    { key:'trigger-and-urgency', num:'04', title:'Trigger and urgency', cue:'Find the now', essential:true },
    { key:'stakeholder-and-ownership', num:'05', title:'Stakeholder and ownership', cue:'Find the human', essential:false },
    { key:'proof-threshold', num:'06', title:'Proof threshold', cue:'Define proof', essential:false },
    { key:'current-vendor-and-displacement', num:'07', title:'Current vendor and displacement', cue:'Surface replacement risk', essential:false },
    { key:'decision-architecture', num:'08', title:'Decision architecture', cue:'Map the path', essential:true },
    { key:'next-step-lock', num:'09', title:'Next-step lock', cue:'Earn the move', essential:true },
    { key:'post-call-routing', num:'10', title:'Post-call routing', cue:'Hand it off', essential:false }
  ];

  function branchSet(meta, key){
    const defaults = {
      'opening-frame':[
        { tag:'OPEN', cls:'ok', say:'“Yes, that’s fine.”', move:'“Good. Start with the current workflow so I’m not guessing.”', jumps:[['→ Current-state truth','p-current-state-truth','grn']]},
        { tag:'RUSHED', cls:'fl', say:'“I only have a few minutes.”', move:'“Understood. I’ll stay with the essentials and earn one real next step.”', jumps:[['→ Trigger and urgency','p-trigger-and-urgency','red'],['→ Next-step lock','p-next-step-lock','red']]},
        { tag:'SKIP', cls:'fl', say:'“Just show me what it does.”', move:'“I can, but I want it to map to your world first. Let me ask two questions so the demo is not generic.”', jumps:[['→ Current-state truth','p-current-state-truth','blu']]}
      ],
      'current-state-truth':[
        { tag:'CONCRETE', cls:'ly', say:'“We use '+meta.platform+', but humans still pick up the expensive cases.”', move:'“Where do those human handoffs start hurting most?”', jumps:[['→ Pain and consequence','p-pain-and-consequence','grn']]},
        { tag:'BROAD', cls:'ly', say:'“It’s pretty standard. Nothing unusual.”', move:'“Walk me through one recent example so I can see where standard stops being cheap.”', jumps:[['→ Pain and consequence','p-pain-and-consequence','org']]},
        { tag:'PUSHBACK', cls:'ob', say:'“Why do you need this level of detail?”', move:'“Because the value changes depending on where a human still has to save the workflow.”', jumps:[['→ Trigger and urgency','p-trigger-and-urgency','blu']]}
      ],
      'pain-and-consequence':[
        { tag:'CONCRETE', cls:'ok', say:'“The team loses hours and supervisors end up triaging all day.”', move:'“When that happens, what does it cost you in practice: money, missed SLA, quality, or burnout?”', jumps:[['→ Trigger and urgency','p-trigger-and-urgency','grn']]},
        { tag:'SOFT', cls:'ly', say:'“It could be better, but it’s not a fire.”', move:'“If it stayed exactly like this for another quarter, what gets slower, more expensive, or harder to trust?”', jumps:[['→ Trigger and urgency','p-trigger-and-urgency','org']]},
        { tag:'NO PAIN', cls:'fl', say:'“Honestly, this is not a big issue right now.”', move:'“Then the test is whether there is any real trigger at all. What changed to make the meeting worth taking?”', jumps:[['→ Trigger and urgency','p-trigger-and-urgency','red']]}
      ],
      'trigger-and-urgency':[
        { tag:'REAL TRIGGER', cls:'ok', say:'“The volume changed / leadership noticed / a new target landed.”', move:'“Who is feeling the pressure hardest now that this is visible?”', jumps:[['→ Stakeholder and ownership','p-stakeholder-and-ownership','grn']]},
        { tag:'SOFT TRIGGER', cls:'ly', say:'“We’re just evaluating.”', move:'“Fair. What would have to become true for this to stop being evaluation and become priority?”', jumps:[['→ Stakeholder and ownership','p-stakeholder-and-ownership','org']]},
        { tag:'NO TRIGGER', cls:'fl', say:'“No major change. We’re just staying informed.”', move:'“Then I should keep this light. Is there even one scenario where staying informed turns into action?”', jumps:[['→ Proof threshold','p-proof-threshold','red']]}
      ],
      'stakeholder-and-ownership':[
        { tag:'CLEAR OWNER', cls:'ok', say:'“Ops owns it, IT must sign off, finance may care later.”', move:'“Good. What would each of them need to see before this gets real?”', jumps:[['→ Proof threshold','p-proof-threshold','grn'],['→ Decision architecture','p-decision-architecture','blu']]},
        { tag:'BLURRY', cls:'ly', say:'“A few people care, but no single owner.”', move:'“Then the risk is drift. Who feels the consequence most directly when the workflow breaks?”', jumps:[['→ Proof threshold','p-proof-threshold','org']]},
        { tag:'WRONG PERSON', cls:'fl', say:'“I’m probably not the main owner.”', move:'“That helps. Who should be in the next conversation so this becomes real instead of hypothetical?”', jumps:[['→ Next-step lock','p-next-step-lock','red']]}
      ],
      'proof-threshold':[
        { tag:'PILOT', cls:'ok', say:'“We’d need to see it in our own environment.”', move:'“Good. What has to be in that pilot so it proves the decision, not just interest?”', jumps:[['→ Decision architecture','p-decision-architecture','grn'],['→ Next-step lock','p-next-step-lock','blu']]},
        { tag:'REFERENCE', cls:'ly', say:'“We need to know others like us have done this.”', move:'“What similarity matters most: team shape, compliance, scale, or workflow?”', jumps:[['→ Current vendor and displacement','p-current-vendor-and-displacement','pur']]},
        { tag:'TOO EARLY', cls:'fl', say:'“We’re not even at proof yet.”', move:'“Then we should keep proving the problem before trying to prove the product.”', jumps:[['→ Pain and consequence','p-pain-and-consequence','red']]}
      ],
      'current-vendor-and-displacement':[
        { tag:'INCUMBENT', cls:'ly', say:'“We already have something in place.”', move:'“What does it do well enough that any change has to respect?”', jumps:[['→ Decision architecture','p-decision-architecture','org']]},
        { tag:'INTERNAL', cls:'fl', say:'“We’re building on our own.”', move:'“Makes sense. What part works, and what part is still expensive enough that this meeting happened?”', jumps:[['→ Pain and consequence','p-pain-and-consequence','red'],['→ Proof threshold','p-proof-threshold','blu']]},
        { tag:'NO VENDOR', cls:'ok', say:'“It’s mostly people and workarounds.”', move:'“Then the proof burden is operational. What human work disappears if this gets solved?”', jumps:[['→ Decision architecture','p-decision-architecture','grn']]}
      ],
      'decision-architecture':[
        { tag:'CLEAR PATH', cls:'ok', say:'“Ops, IT, and one exec sponsor would be involved.”', move:'“Good. What is the first conversation we should earn, and who has to be there?”', jumps:[['→ Next-step lock','p-next-step-lock','grn']]},
        { tag:'COMMITTEE', cls:'ly', say:'“A bunch of people will want opinions.”', move:'“Then we need a cleaner first move. Who would make this sharper instead of noisier?”', jumps:[['→ Next-step lock','p-next-step-lock','org']]},
        { tag:'PROCUREMENT FIRST', cls:'fl', say:'“Procurement or security gets involved very early.”', move:'“Then the next step needs to acknowledge them immediately. What would they ask before they say yes to more?”', jumps:[['→ Proof threshold','p-proof-threshold','red'],['→ Next-step lock','p-next-step-lock','blu']]}
      ],
      'next-step-lock':[
        { tag:'READY', cls:'ok', say:'“Yes, a deeper follow-up makes sense.”', move:'“Good. Let’s lock the meeting, the people, and the exact question it needs to answer.”', jumps:[['→ Post-call routing','p-post-call-routing','grn']]},
        { tag:'SOFT', cls:'ly', say:'“Send something and we’ll look.”', move:'“Happy to. What should that summary help your team decide, and who will actually read it?”', jumps:[['→ Post-call routing','p-post-call-routing','org']]},
        { tag:'NOT READY', cls:'fl', say:'“We’re not ready for a next step yet.”', move:'“Understood. What is missing: owner, proof, timing, or internal alignment?”', jumps:[['→ Proof threshold','p-proof-threshold','red'],['→ Stakeholder and ownership','p-stakeholder-and-ownership','red']]}
      ],
      'post-call-routing':[
        { tag:'CALL PLANNER', cls:'ok', say:'“Next call needs to force the real question.”', move:'“Route this to Call Planner with the missing truth and the decision owner.”', jumps:[['→ Call Planner handoff','#route-call-planner','grn']]},
        { tag:'DEAL PRESSURE', cls:'ly', say:'“There is already a live evaluation or deal around this.”', move:'“Route this to Deal Workspace so the operating truth stays attached to the deal.”', jumps:[['→ Deal Workspace handoff','#route-deal-workspace','org']]},
        { tag:'AUTOPSY', cls:'fl', say:'“This smells like drift or decorative activity.”', move:'“Route this to Future Autopsy so the failure pattern gets named before the deal ages out.”', jumps:[['→ Future Autopsy handoff','#route-future-autopsy','red']]}
      ]
    };
    return defaults[key] || [];
  }

  function genericNode(meta, segment){
    const labelMap = {
      'opening-frame':['pr','ESSENTIAL OPEN'],
      'current-state-truth':['fu','WORKFLOW READ'],
      'pain-and-consequence':['ri','PAIN READ'],
      'trigger-and-urgency':['ri','WHY NOW'],
      'stakeholder-and-ownership':['pr','OWNER MAP'],
      'proof-threshold':['va','PROOF TEST'],
      'current-vendor-and-displacement':['fu','STATUS QUO'],
      'decision-architecture':['pr','PATH MAP'],
      'next-step-lock':['cl','MUST REACH'],
      'post-call-routing':['cl','HANDOFF']
    };
    const [tone, badge] = labelMap[segment.key];
    const textMap = {
      'opening-frame': `“I’ve looked at teams like yours and the pattern is usually the same: ${meta.pain.toLowerCase()}. I’d rather understand how it looks in your world before I show anything. Fair?”`,
      'current-state-truth': `“Walk me through the current setup today. Where does ${meta.target.toLowerCase()} actually live, and where does a human still have to step in?”`,
      'pain-and-consequence': '“Where does the current setup start hurting: speed, cost, quality, risk, team bandwidth, or some mix of them?”',
      'trigger-and-urgency': '“What made this worth talking about now instead of three months from now?”',
      'stakeholder-and-ownership': '“Who actually owns this when it gets painful, and who gets pulled in once change becomes real?”',
      'proof-threshold': '“What would you need to see to believe this is real in your world, not just interesting on a slide?”',
      'current-vendor-and-displacement': '“What are you using today, what does it do well enough, and what would make replacing or changing it hard?”',
      'decision-architecture': '“If this stayed live, what would the decision path actually look like from here?”',
      'next-step-lock': '“What is the next concrete move that would tell both of us whether this is worth advancing?”',
      'post-call-routing': '“What do you need from me after this call so the next step is easy to carry forward?”'
    };
    return {
      id:`n-${segment.key}-1`,
      essential:segment.essential,
      tone,
      badge,
      text:textMap[segment.key],
      note:meta.prompt,
      branchLabel:'They respond — your moves',
      branches:branchSet(meta, segment.key)
    };
  }

  function buildSegments(meta){
    return segmentTemplates.map(segment => ({
      ...segment,
      nodes:[genericNode(meta, segment)]
    }));
  }

  const state = {
    variant: document.body.dataset.variant || 'strict',
    frameworkKey: document.body.dataset.framework || variantMeta[document.body.dataset.variant || 'strict'].framework,
    openSegments: new Set(['opening-frame']),
    emergency:false,
    timerOn:false,
    timerSecs:0,
    timerInterval:null
  };

  function getFramework(key){
    return frameworks.find(f => f.key === key) || frameworks[0];
  }

  function getSegments(){
    return buildSegments(getFramework(state.frameworkKey));
  }

  function progressKey(){
    return `antaeus_ds_lumana_progress_${state.frameworkKey}`;
  }

  function noteKey(id){
    return `antaeus_ds_lumana_note_${state.frameworkKey}_${id}`;
  }

  function loadChecks(){
    try{
      return JSON.parse(localStorage.getItem(progressKey()) || '{}');
    }catch(_){
      return {};
    }
  }

  function saveChecks(map){
    try{ localStorage.setItem(progressKey(), JSON.stringify(map)); }catch(_){}
  }

  function setCheck(id, checked){
    const map = loadChecks();
    map[id] = checked;
    saveChecks(map);
    render();
  }

  function isChecked(id){
    return !!loadChecks()[id];
  }

  function loadNote(id){
    try{ return localStorage.getItem(noteKey(id)) || ''; }catch(_){ return ''; }
  }

  function saveNote(id, value){
    try{ localStorage.setItem(noteKey(id), value); }catch(_){}
  }

  function escapeHtml(value){
    return value
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function countCheckedForFramework(key){
    const current = state.frameworkKey;
    state.frameworkKey = key;
    const count = getSegments().flatMap(s => s.nodes).filter(n => isChecked(n.id)).length;
    state.frameworkKey = current;
    return `${count}`;
  }

  function renderTopbar(){
    const meta = variantMeta[state.variant];
    const segments = getSegments();
    const nodeIds = segments.flatMap(s => s.nodes.map(n => n.id));
    const checked = nodeIds.filter(isChecked).length;
    document.getElementById('topTitle').textContent = `Discovery Studio · ${meta.title}`;
    document.getElementById('frameworkPrompt').innerHTML = `<h2>${getFramework(state.frameworkKey).name}</h2><p>${meta.subtitle}</p>`;
    document.getElementById('progressPill').textContent = `${checked}/${nodeIds.length}`;
  }

  function renderFrameworkRail(){
    const wrap = document.getElementById('frameworkRail');
    wrap.innerHTML = '';
    frameworks.forEach((fw, idx) => {
      const btn = document.createElement('button');
      btn.className = `lnav-item${fw.key === state.frameworkKey ? ' active' : ''}`;
      btn.type = 'button';
      btn.innerHTML = `<span class="num">${String(idx+1).padStart(2,'0')}</span><span>${fw.short}</span><span class="cnt">${countCheckedForFramework(fw.key)}</span>`;
      btn.addEventListener('click', () => {
        state.frameworkKey = fw.key;
        state.openSegments = new Set(['opening-frame']);
        render();
      });
      wrap.appendChild(btn);
    });
  }

  function renderSegmentStrip(){
    const strip = document.getElementById('segmentStrip');
    if(!strip) return;
    const active = Array.from(state.openSegments)[0] || 'opening-frame';
    strip.innerHTML = '';
    getSegments().forEach(seg => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sgbtn${seg.key === active ? ' active' : ''}`;
      btn.textContent = `${seg.num} ${seg.title}`;
      btn.addEventListener('click', () => goPhase(seg.key));
      strip.appendChild(btn);
    });
  }

  function renderQuickGrid(){
    const fw = getFramework(state.frameworkKey);
    document.getElementById('quickGrid').innerHTML = [
      `<div class="qcard"><h4>What matters</h4><p>${fw.target}</p></div>`,
      `<div class="qcard"><h4>Proof required</h4><p>${fw.proof}</p></div>`,
      `<div class="qcard"><h4>Next room if earned</h4><p>${fw.nextRoom}</p></div>`
    ].join('');
  }

  function renderRightPanel(){
    const fw = getFramework(state.frameworkKey);
    const wrap = document.getElementById('rightPanel');
    wrap.innerHTML = `
      <div class="rp-section">
        <h3>${fw.short} dossier</h3>
        <div class="rp-kv">
          <div class="rp-k"><div class="l">Persona</div><div class="v">${fw.persona}</div></div>
          <div class="rp-k"><div class="l">Target</div><div class="v">${fw.target}</div></div>
          <div class="rp-k"><div class="l">Current stack</div><div class="v">${fw.platform}</div></div>
          <div class="rp-k"><div class="l">Why this room exists</div><div class="v">${fw.why}</div></div>
        </div>
      </div>
      <div class="rp-section">
        <h3>Angles to surface</h3>
        <ul>${fw.angles.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
      <div class="rp-section">
        <h3>Antaeus differentiators</h3>
        <ul>${fw.differentiators.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
      <div class="rp-section">
        <h3>Must leave with</h3>
        <div class="rp-kv">
          <div class="rp-k"><div class="l">Owner</div><div class="v">A real human, not a department.</div></div>
          <div class="rp-k"><div class="l">Proof bar</div><div class="v">${fw.proof}</div></div>
          <div class="rp-k"><div class="l">Next room</div><div class="v">${fw.nextRoom}</div></div>
        </div>
      </div>
    `;
  }

  function renderEvalStrip(){
    const active = Array.from(state.openSegments)[0] || 'opening-frame';
    const evs = evaluationBySegment[active] || [];
    document.querySelectorAll('.etag').forEach(tag => tag.classList.remove('lit'));
    evs.forEach(key => {
      const el = document.querySelector(`.etag[data-e="${key}"]`);
      if(el) el.classList.add('lit');
    });
  }

  function updateTimer(){
    const btn = document.getElementById('timerBtn');
    const m = String(Math.floor(state.timerSecs / 60)).padStart(2,'0');
    const s = String(state.timerSecs % 60).padStart(2,'0');
    btn.textContent = `${m}:${s}`;
    btn.classList.remove('on','tw','to');
    if(!state.timerOn) return;
    btn.classList.add(state.timerSecs >= 1200 ? 'to' : state.timerSecs >= 900 ? 'tw' : 'on');
    document.querySelectorAll('.pdot').forEach((d,i) => {
      d.classList.remove('hit','warn','over');
      const marks = [0,120,300,540,720,900,1020,1200];
      if(state.timerSecs >= marks[i+1]) d.classList.add(state.timerSecs > marks[i+1] + 60 ? 'over' : 'hit');
      else if(state.timerSecs >= marks[i]) d.classList.add('hit');
    });
  }

  function goPhase(key){
    state.openSegments = new Set([key]);
    render();
    requestAnimationFrame(() => {
      const el = document.getElementById(`p-${key}`);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  function goTarget(target){
    if(target.startsWith('p-')){
      goPhase(target.replace(/^p-/, ''));
      return;
    }
    const el = document.querySelector(target.startsWith('#') ? target : `#${target}`);
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function renderCenter(){
    const fw = getFramework(state.frameworkKey);
    const center = document.getElementById('centerStack');
    const segments = getSegments();
    center.innerHTML = '';

    const skip = document.createElement('div');
    skip.className = 'nd';
    skip.id = 'n-skip';
    skip.innerHTML = `
      <div class="ndh">
        <div class="nq">
          <div class="nt fu">SKIP-AHEAD HANDLERS — USE ANYTIME</div>
          <div class="nsb">If they jump ahead, do not improvise. Use one of these ready moves.</div>
        </div>
      </div>
      <div class="brs">
        <div class="bt"><span class="ar">►</span>"Show me a demo" / "What does it cost?" / "Send info" / "We built this ourselves"</div>
        <div class="bb" style="display:block">
          <div class="b">
            <div class="bh"><span class="btg fl">SHOW ME A DEMO</span></div>
            <div class="bx"><strong>→</strong> “Happy to. I want it to map to your world, not a canned pitch. Give me two questions first.”</div>
            <div class="itrans"><button class="j blu" data-jump="p-current-state-truth">→ Current-state truth</button></div>
          </div>
          <div class="b">
            <div class="bh"><span class="btg fl">WHAT DOES IT COST?</span></div>
            <div class="bx"><strong>→</strong> “I can price responsibly once I know the footprint, owner, and proof bar.”</div>
            <div class="itrans"><button class="j blu" data-jump="p-proof-threshold">→ Proof threshold</button><button class="j org" data-jump="p-decision-architecture">→ Decision path</button></div>
          </div>
          <div class="b">
            <div class="bh"><span class="btg fl">WE BUILT THIS OURSELVES</span></div>
            <div class="bx"><strong>→</strong> “Makes sense. What part works, and what part is still expensive enough that this meeting happened?”</div>
            <div class="itrans"><button class="j red" data-jump="p-current-vendor-and-displacement">→ Status quo</button><button class="j blu" data-jump="p-pain-and-consequence">→ Pain read</button></div>
          </div>
        </div>
      </div>
    `;
    center.appendChild(skip);

    const compress = document.createElement('div');
    compress.className = 'nd ess';
    compress.id = 'n-compress';
    compress.style.display = state.emergency ? 'block' : 'none';
    compress.innerHTML = `
      <div class="ndh">
        <div class="nq">
          <div class="nt ri"><span class="esstag">★</span>EMERGENCY 5-QUESTION COMPRESS</div>
          <div class="ntx">Stay with only the must-earn moves if the call is compressed.</div>
        </div>
      </div>
      <div style="padding:0 14px 12px;display:flex;flex-direction:column;gap:4px">
        <button class="j red" data-jump="p-trigger-and-urgency" style="justify-content:flex-start">★1 Why now</button>
        <button class="j red" data-jump="p-pain-and-consequence" style="justify-content:flex-start">★2 Name the cost</button>
        <button class="j red" data-jump="p-stakeholder-and-ownership" style="justify-content:flex-start">★3 Find the owner</button>
        <button class="j red" data-jump="p-proof-threshold" style="justify-content:flex-start">★4 Learn the proof bar</button>
        <button class="j red" data-jump="p-next-step-lock" style="justify-content:flex-start">★5 Earn the next move</button>
      </div>
    `;
    center.appendChild(compress);

    segments.forEach(seg => {
      const phase = document.createElement('section');
      phase.id = `p-${seg.key}`;
      phase.className = `phase${state.openSegments.has(seg.key) ? ' open active' : ''}`;
      phase.innerHTML = `
        <div class="pm"><span>⌁</span> SEGMENT ${seg.num} · ${seg.cue}</div>
        <div class="phase-header" data-phase-toggle="${seg.key}">
          <div class="phase-header-left">
            <span class="phase-number">${seg.num}</span>
            <span class="phase-title">${seg.title}</span>
          </div>
          <div class="phase-header-right">
            <span class="phase-progress">${seg.cue}</span>
            <span class="phase-chevron">▼</span>
          </div>
        </div>
        <div class="phase-body"></div>
      `;
      const body = phase.querySelector('.phase-body');
      seg.nodes.forEach(node => {
        if(state.emergency && !node.essential) return;
        const nodeEl = document.createElement('div');
        nodeEl.className = `nd${node.essential ? ' ess' : ''}`;
        nodeEl.id = node.id;
        nodeEl.innerHTML = `
          <div class="ndh">
            <button class="nck${isChecked(node.id) ? ' on' : ''}" type="button" data-check="${node.id}">✓</button>
            <div class="nq">
              <div class="nt ${node.tone}">${node.essential ? '<span class="esstag">★</span>' : ''}${node.badge}</div>
              <div class="ntx">${node.text}</div>
              <div class="nsb"><b>Context:</b> ${node.note}</div>
            </div>
          </div>
          <div class="brs">
            <div class="bt" data-branch-toggle="${node.id}"><span class="ar">►</span>${node.branchLabel}</div>
            <div class="bb">
              ${node.branches.map(branch => `
                <div class="b">
                  <div class="bh"><span class="btg ${branch.cls}">${branch.tag}</span></div>
                  <div class="bs">${branch.say}</div>
                  <div class="bx"><strong>→</strong> ${branch.move}</div>
                  <div class="itrans">${branch.jumps.map(([label,target,cls]) => `<button type="button" class="j ${cls || ''}" data-jump="${target}">${label}</button>`).join('')}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <textarea class="n" data-note="${node.id}" placeholder="Call notes, exact quote, risk, next-step condition...">${escapeHtml(loadNote(node.id))}</textarea>
        `;
        body.appendChild(nodeEl);
      });
      center.appendChild(phase);
    });

    const routing = document.createElement('div');
    routing.className = 'card';
    routing.innerHTML = `
      <div class="framework-title" style="margin-bottom:0;border-bottom:0;padding-bottom:0">
        <div>
          <h2>Next-room routes</h2>
          <p>Every route is clickable. Nothing sits here unless it changes the next move.</p>
        </div>
      </div>
      <div class="quick-grid" style="margin-top:12px">
        <div class="qcard" id="route-call-planner"><h4>Call Planner</h4><p>Use when the next conversation needs a forced question and a tighter owner path.</p></div>
        <div class="qcard" id="route-deal-workspace"><h4>Deal Workspace</h4><p>Use when a live deal already exists and the operating truth has to stay attached to that deal.</p></div>
        <div class="qcard" id="route-future-autopsy"><h4>Future Autopsy</h4><p>Use when the signal smells like decorative motion, drift, or late-stage failure risk.</p></div>
      </div>
    `;
    center.appendChild(routing);
  }

  function bindEvents(){
    document.querySelectorAll('[data-phase-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.phaseToggle;
        if(state.openSegments.has(key)) state.openSegments.delete(key);
        else state.openSegments = new Set([key]);
        render();
      });
    });
    document.querySelectorAll('[data-check]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.check;
        setCheck(id, !isChecked(id));
      });
    });
    document.querySelectorAll('[data-branch-toggle]').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.nd').classList.toggle('xp'));
    });
    document.querySelectorAll('[data-jump]').forEach(btn => {
      btn.addEventListener('click', () => goTarget(btn.dataset.jump));
    });
    document.querySelectorAll('[data-note]').forEach(area => {
      area.addEventListener('input', () => saveNote(area.dataset.note, area.value));
    });
  }

  function render(){
    document.body.classList.toggle('variant-segment-jump', state.variant === 'jump');
    document.body.classList.toggle('variant-panel-quiet', state.variant === 'quiet');
    renderTopbar();
    renderFrameworkRail();
    renderQuickGrid();
    renderSegmentStrip();
    renderCenter();
    renderRightPanel();
    renderEvalStrip();
    updateTimer();
    bindEvents();
  }

  document.getElementById('timerBtn').addEventListener('click', () => {
    state.timerOn = !state.timerOn;
    if(state.timerOn){
      state.timerInterval = setInterval(() => {
        state.timerSecs += 1;
        updateTimer();
      }, 1000);
    }else{
      clearInterval(state.timerInterval);
    }
    updateTimer();
  });

  document.getElementById('emergencyBtn').addEventListener('click', () => {
    state.emergency = !state.emergency;
    document.getElementById('emergencyBtn').classList.toggle('act', state.emergency);
    document.getElementById('emergencyBar').classList.toggle('show', state.emergency);
    render();
  });

  const panel = document.getElementById('rightPanel');
  const panelToggle = document.getElementById('panelToggle');
  if(panelToggle){
    panelToggle.addEventListener('click', () => panel.classList.toggle('hidden'));
  }

  render();
})();
