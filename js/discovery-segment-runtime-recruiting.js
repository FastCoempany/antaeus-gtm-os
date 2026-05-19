(function(){
  var runtime = window.DISCOVERY_SEGMENT_RUNTIME;
  if(!runtime || !runtime.frameworks || !runtime.frameworks["recruiting"]) return;

  function action(label, target, tone){
    return { label:label, target:target, tone:tone || "blu" };
  }

  function jumpNode(label, segmentId, nodeSlug, tone){
    return action(label, "node:" + segmentId + "--" + nodeSlug, tone);
  }

  function jumpRoom(label, roomId, tone){
    return action(label, "room:" + roomId, tone);
  }

  function branch(tag, cls, quote, move, actions, clear, missing){
    return {
      tag:tag,
      cls:cls,
      quote:quote,
      move:move,
      actions:actions || [],
      clear:clear || "",
      missing:missing || ""
    };
  }

  function node(segmentId, slug, tone, badge, text, note, essential, branches){
    return {
      id:segmentId + "--" + slug,
      essential:!!essential,
      tone:tone,
      badge:badge,
      text:text,
      note:note,
      branches:branches || []
    };
  }

  function segment(segmentId, num, title, cue, essential, nodes){
    return {
      key:segmentId,
      num:num,
      title:title,
      cue:cue,
      essential:!!essential,
      nodes:nodes || []
    };
  }

  var base = runtime.frameworks["recruiting"];

  var supportDossier = [
    { title:"Funnel pain", items:["Which stage is bleeding time: sourcing, screening, scheduling, interviewing, or closing", "Whether recruiter pain and hiring-manager pain are different problems in the org", "Drop-off points and candidate-experience concerns at the relevant roles"] },
    { title:"Proof burden", items:["Time-to-fill or offer-acceptance lift against their last two quarters on comparable roles", "Evaluation-consistency improvement on a role family that suffers from calibration gaps", "Fairness / bias / compliance posture documented against their regulatory environment"] },
    { title:"Decision path", items:["CHRO or VP Talent sponsor who feels the hiring-velocity cost", "TA operations or systems evaluator who owns the stack (ATS, CRM, sourcing, assessment)", "Hiring managers whose experience has to survive the change"] }
  ];
  var objectionLibrary = [
    { trigger:"our ATS already does this", reply:"Which part? ATS tracking and AI screening are different layers. Which piece of the funnel is the ATS genuinely solving, and which piece are recruiters still carrying manually?" },
    { trigger:"you cannot automate human judgment in hiring", reply:"Agreed on the final decision. The question is whether the time spent getting to that decision is all human judgment or mostly coordination, scheduling, and triage. Which of those is eating your team this quarter?" },
    { trigger:"we are in a hiring freeze", reply:"Understood. Then the question is what you want ready when the freeze lifts. Is the pain before the freeze a candidate-pipeline hygiene problem or a funnel-conversion problem? Those prepare differently." },
    { trigger:"bias and compliance will block this", reply:"Fair. Those are live gates especially under NYC 144 or EU AI Act. What specifically would satisfy your counsel — audit methodology, demographic reporting, or evaluation transparency?" }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from HeyMilo or Moonhub?", bridge:"Depends on where the funnel breaks for you. Moonhub-style is sourcing coverage; HeyMilo-style is interview automation. Which bottleneck is currently loudest?" },
    { question:"Does this replace our ATS?", bridge:"No. The question is whether the ATS is hiding pain that a layer above it could surface. What work still happens in spreadsheets or Slack despite the ATS being there?" },
    { question:"What about DEI compliance?", bridge:"Serious concern. What posture does your counsel hold — full audit trail, demographic neutrality at scoring, or evaluation transparency? Each implies different evaluation architecture." }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing fits once we know whether the funnel cost is material enough to justify change. What did the last quarter of hiring cost you in time-to-fill or failed hires?" },
    { trigger:"asks for demo too early", reply:"I can demo it. First tell me which role family or funnel stage you would want it to prove — otherwise it becomes a generic tour." },
    { trigger:"routes to procurement or legal", reply:"Happy to engage them directly. Before that, which hiring outcome is this supposed to improve? Procurement and legal will need that to evaluate fit beyond policy review." }
  ];

  runtime.frameworks["recruiting"] = {
    id:base.id,
    label:base.label,
    short:base.short,
    storageKey:base.storageKey,
    aliases:base.aliases,
    persona:"Talent leadership",
    platform:base.platform,
    target:base.target,
    proof:base.proof,
    nextReview:base.nextReview,
    routeFocus:base.routeFocus,
    supportDossier:supportDossier,
    objectionLibrary:objectionLibrary,
    inboundQuestionHandlers:inboundQuestionHandlers,
    skipAheadHandlers:skipAheadHandlers,
    quickActions:[
      {
        title:"Pick one live req",
        copy:"Anchor the conversation to a role where the funnel still needs human rescue.",
        action:jumpNode("Open live req", "current-state-truth", "live-req", "blu")
      },
      {
        title:"Name the bottleneck",
        copy:"Make the pain specific: sourcing, screening, scheduling, interview quality, or closing.",
        action:jumpNode("Open funnel pain", "pain-and-consequence", "funnel-break", "org")
      },
      {
        title:"Lock the req review",
        copy:"Leave with recruiting ops and one hiring owner reviewing a real req.",
        action:jumpNode("Lock req review", "next-step-lock", "req-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"cant-automate-judgment",
        label:"You cannot automate hiring judgment",
        reply:"Agreed. The first question is where coordination, screening, or workflow structure can improve without replacing the final human decision.",
        actions:[
          jumpNode("Set the judgment boundary", "proof-threshold", "judgment-boundary", "pur"),
          jumpNode("Choose a safe req", "proof-threshold", "pilot-req", "blu")
        ]
      },
      {
        id:"ats-lock-in",
        label:"We are locked into the ATS",
        reply:"That is fine. I am not asking whether the ATS stays. I am asking where the team still rescues the funnel around it.",
        actions:[
          jumpNode("Inspect the stack", "current-vendor-and-displacement", "ats-stack", "blu"),
          jumpNode("Name the bottleneck", "pain-and-consequence", "funnel-break", "org")
        ]
      },
      {
        id:"hiring-freeze",
        label:"We are in a hiring freeze",
        reply:"Then the question is whether there is still enough active hiring pressure to justify workflow change now.",
        actions:[
          jumpNode("Test urgency", "trigger-and-urgency", "freeze-check", "red"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
        ]
      },
      {
        id:"quality-matters-more",
        label:"Quality matters more than speed",
        reply:"Then the proof bar is whether better workflow improves quality and calibration instead of just pushing candidates through faster.",
        actions:[
          jumpNode("Set the proof bar", "proof-threshold", "quality-bar", "pur"),
          jumpNode("Find who feels it", "stakeholder-and-ownership", "hiring-manager", "blu")
        ]
      },
      {
        id:"send-material",
        label:"Send me something",
        reply:"I can. First tell me which req or workflow the material should help you decide on so the follow-up becomes a real review.",
        actions:[
          jumpNode("Pick one live req", "current-state-truth", "live-req", "blu"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening frame","Start on recruiter rescue work.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most TA teams already have an ATS and basic tooling. The question is where recruiters or coordinators still have to rescue the expensive parts of the funnel by hand. Is that true in your world too?\"","Use this when they will diagnose before seeing product.",true,[
          branch("CONFIRMS","ok","\"Yes. The systems are there, but the team still spends too much time triaging and coordinating.\"","\"Where does that rescue happen most painfully: sourcing, screening, scheduling, interviews, or closing?\"",[
            jumpNode("Map the live req", "current-state-truth", "live-req", "blu"),
            jumpNode("Name the bottleneck", "pain-and-consequence", "funnel-break", "grn")
          ],"Human rescue is part of the funnel today.","You still need the exact workflow step where it shows up first."),
          branch("JUDGMENT PUSHBACK","fl","\"You cannot automate hiring judgment.\"","\"Agreed. So where would workflow support still help without touching the final judgment call?\"",[
            jumpNode("Set the judgment boundary", "proof-threshold", "judgment-boundary", "pur"),
            jumpNode("Map the live req", "current-state-truth", "live-req", "blu")
          ],"Judgment is the first objection, not the only objection.","You still need the safe part of the workflow.")
        ]),
        node("opening-frame","req-scope","fu","Start from one req","\"Pick one open role that still feels heavier than it should. Where is that req slowing down or demanding too much recruiter intervention?\"","Use this when the room is already operational.",false,[
          branch("REQ READY","ok","\"Screening and scheduling are eating too much recruiter time on one of our priority roles.\"","\"Good. Which part hurts more first: candidate quality, recruiter bandwidth, or hiring-manager frustration?\"",[
            jumpNode("Open live req", "current-state-truth", "live-req", "grn"),
            jumpNode("Open funnel pain", "pain-and-consequence", "funnel-break", "blu")
          ],"A real req is now anchoring the call.","You still need the specific failure pattern inside it."),
          branch("NO LIVE EXAMPLE","fl","\"I do not have one specific req in mind.\"","\"Then use the last hiring cycle that felt inefficient. Where did the funnel break down?\"",[
            jumpNode("Open the funnel break", "pain-and-consequence", "funnel-break", "red"),
            jumpNode("Open the trigger", "trigger-and-urgency", "headcount-pressure", "blu")
          ],"No live req is ready yet.","You still need one recent hiring incident.")
        ])
      ]),
      segment("current-state-truth","02","Current-state truth","Map the live funnel.",true,[
        node("current-state-truth","live-req","fu","Map one live req","\"Walk me through one open req. Where does the team still spend the most human time today: sourcing, screening, scheduling, calibration, or close coordination?\"","Start here when the room is willing to get concrete.",true,[
          branch("WORKFLOW CLEAR","ok","\"Screening and back-and-forth coordination still eat the most time.\"","\"What makes that heavy today: volume, poor signals, slow manager response, or inconsistent evaluation?\"",[
            jumpNode("Name the funnel break", "pain-and-consequence", "funnel-break", "grn"),
            jumpNode("Find who feels it", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"The live funnel break is visible.","You still need the source of that burden."),
          branch("MANAGER DELAY","fl","\"Hiring managers are the real delay more than recruiters.\"","\"Then what work keeps bouncing back onto recruiting because the manager side is too slow or unclear?\"",[
            jumpNode("Name the manager drag", "pain-and-consequence", "manager-drag", "red"),
            jumpNode("Find the hiring owner", "stakeholder-and-ownership", "hiring-manager", "blu")
          ],"Manager behavior may be the real bottleneck.","You still need the exact handoff that breaks.")
        ]),
        node("current-state-truth","funnel-shape","pr","Map the funnel shape","\"Is the bigger pain at the top of funnel, middle of funnel, or close: getting candidates in, evaluating them well, or getting them to accept?\"","Use this when they speak in generalities.",false,[
          branch("TOP OF FUNNEL","ok","\"Getting the right candidates in is still the hardest part.\"","\"Good. Is that a sourcing problem, a triage problem, or a role-calibration problem?\"",[
            jumpNode("Open funnel pain", "pain-and-consequence", "funnel-break", "grn"),
            jumpNode("Inspect current stack", "current-vendor-and-displacement", "ats-stack", "blu")
          ],"Top-of-funnel pain is explicit.","You still need the first failing motion inside it."),
          branch("LATE STAGE","fl","\"We lose time later with slow closes and candidate drop-off.\"","\"What causes that most: compensation, process lag, weak conviction, or candidate experience?\"",[
            jumpNode("Open candidate loss pain", "pain-and-consequence", "candidate-drop", "red"),
            jumpNode("Find the trigger", "trigger-and-urgency", "headcount-pressure", "blu")
          ],"Late-stage drag may be the real issue.","You still need the main cause of it.")
        ])
      ]),
      segment("pain-and-consequence","03","Pain and consequence","Make hiring friction expensive.",true,[
        node("pain-and-consequence","funnel-break","ri","Name the funnel break","\"What is the actual damage today: recruiter bandwidth burned, slower time-to-fill, candidate loss, or hiring managers losing trust in the process?\"","Start here when the workflow break is visible.",true,[
          branch("BANDWIDTH CLEAR","ok","\"Recruiters spend too much time triaging and coordinating instead of actually recruiting.\"","\"What does that crowd out first: speed, candidate quality, or stakeholder trust?\"",[
            jumpNode("Find who feels it", "stakeholder-and-ownership", "recruiting-ops", "grn"),
            jumpNode("Find the trigger", "trigger-and-urgency", "headcount-pressure", "blu")
          ],"Recruiter bandwidth loss is explicit.","You still need the business consequence of it."),
          branch("NOT BIG ENOUGH","fl","\"It is annoying, but not severe.\"","\"Then what would have to happen before it becomes worth changing the workflow?\"",[
            jumpNode("Test urgency", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Open candidate loss", "pain-and-consequence", "candidate-drop", "blu")
          ],"Pain may still be below the threshold.","You still need the forcing event.")
        ]),
        node("pain-and-consequence","manager-drag","pr","Name the manager drag","\"What is the actual damage when managers are the bottleneck: slower feedback, weaker calibration, candidates cooling off, or recruiters doing follow-up they should not own?\"","Use this when the friction sits more with hiring teams than TA.",false,[
          branch("DRAG CLEAR","ok","\"Managers are slow to respond and it creates avoidable recruiter rework.\"","\"What should improve first if that changes: cycle speed, quality, or candidate experience?\"",[
            jumpNode("Find the manager owner", "stakeholder-and-ownership", "hiring-manager", "grn"),
            jumpNode("Set the quality bar", "proof-threshold", "quality-bar", "blu")
          ],"Manager behavior is part of the funnel cost.","You still need the outcome that matters most."),
          branch("QUALITY ISSUE","fl","\"The issue is not speed. It is inconsistent interview quality.\"","\"Then stay there. Where does evaluation quality break most visibly?\"",[
            jumpNode("Return to quality gap", "pain-and-consequence", "quality-break", "red"),
            jumpNode("Return to manager stake", "stakeholder-and-ownership", "hiring-manager", "blu")
          ],"Manager drag may really be calibration drag.","You still need the first visible quality break.")
        ]),
        node("pain-and-consequence","quality-break","pr","Name the quality and calibration gap","\"Where does evaluation quality drift today: inconsistent screens, untrained interviewers, weak scorecards, or different managers reading talent differently?\"","Use this when they frame the problem as quality over speed.",false,[
          branch("CALIBRATION CLEAR","ok","\"Interview quality and calibration are inconsistent across managers.\"","\"What is the damage when that happens: bad hires, slower decisions, or candidate confusion?\"",[
            jumpNode("Find the owner", "stakeholder-and-ownership", "hiring-manager", "grn"),
            jumpNode("Set the quality bar", "proof-threshold", "quality-bar", "blu")
          ],"The quality gap is visible.","You still need the cost of that inconsistency."),
          branch("QUALITY FINE","fl","\"Quality is mostly fine. The issue is speed.\"","\"Then stay with speed. Where is the human rescue work still slowing the req down?\"",[
            jumpNode("Return to funnel break", "pain-and-consequence", "funnel-break", "red"),
            jumpNode("Return to live req", "current-state-truth", "live-req", "blu")
          ],"Quality is not the main scope.","You still need the operational drag.")
        ]),
        node("pain-and-consequence","candidate-drop","fu","Name candidate drop-off","\"Where do strong candidates leak out today: slow response, weak experience, too many steps, or poor close coordination?\"","Use this when the pain shows up later in the funnel.",false,[
          branch("DROP CLEAR","ok","\"Strong candidates cool off because the process drags and communication gets uneven.\"","\"What part of that should improve first: response speed, manager follow-through, or process simplicity?\"",[
            jumpNode("Return to owner map", "stakeholder-and-ownership", "hiring-manager", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "quality-bar", "blu")
          ],"Candidate loss is a real late-stage scope.","You still need the first fix that would reduce it."),
          branch("NOT MAIN ISSUE","fl","\"Candidate drop-off is secondary. The bigger issue is earlier in the funnel.\"","\"Then stay there. Where does the rescue work still start?\"",[
            jumpNode("Return to live req", "current-state-truth", "live-req", "red"),
            jumpNode("Return to funnel break", "pain-and-consequence", "funnel-break", "blu")
          ],"Candidate loss is not the dominant scope.","You still need the earlier funnel bottleneck.")
        ])
      ]),
      segment("trigger-and-urgency","04","Trigger and urgency","Find the forcing event.",true,[
        node("trigger-and-urgency","headcount-pressure","ri","Find the hiring pressure","\"What changed that made this worth looking at now: more req volume, executive headcount goals, recruiter capacity strain, quality concerns, or rising agency spend?\"","Start here when urgency exists but is not yet specific.",true,[
          branch("PRESSURE CLEAR","ok","\"Volume and speed targets moved up, and the current team cannot keep pace.\"","\"Which req class or funnel step would prove the case fastest if it improved?\"",[
            jumpNode("Pick the live req", "current-state-truth", "live-req", "grn"),
            jumpNode("Lock the req review", "next-step-lock", "req-review", "blu")
          ],"The forcing event is explicit.","You still need the req or workflow it attaches to."),
          branch("AGENCY COST","ly","\"We are spending too much on agencies because the internal team cannot absorb the load.\"","\"What part of the funnel would need to improve first to reduce that dependence?\"",[
            jumpNode("Open candidate loss", "pain-and-consequence", "candidate-drop", "org"),
            jumpNode("Inspect the status quo", "current-vendor-and-displacement", "agency-status-quo", "blu")
          ],"Agency pressure is part of the trigger.","You still need the internal workflow gap behind it."),
          branch("FREEZE RISK","fl","\"Hiring is active, but things could change fast.\"","\"Then what would have to stay true for this to still be worth a real workflow review?\"",[
            jumpNode("Run the freeze check", "trigger-and-urgency", "freeze-check", "red"),
            jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
          ],"Urgency may be unstable.","You still need the condition that keeps it real.")
        ]),
        node("trigger-and-urgency","freeze-check","fu","Check freeze or low-volume risk","\"Is there enough live hiring volume and enough pain right now to justify change, or would this die if hiring slows further?\"","Use this whenever the motion may be too soft or volume too low.",false,[
          branch("STILL ACTIVE","ok","\"Yes. The req volume is real enough that the team still needs relief now.\"","\"Good. Then which req or funnel step should the next review center on?\"",[
            jumpNode("Return to live req", "current-state-truth", "live-req", "grn"),
            jumpNode("Lock the req review", "next-step-lock", "req-review", "blu")
          ],"The motion is still active despite risk.","You still need the scoped review object."),
          branch("TOO SOFT","fl","\"Honestly, this probably becomes secondary if volume drops any further.\"","\"Then let us keep this honest. What would have to happen before it becomes a real priority again?\"",[
            jumpNode("Keep it exploratory", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Open Future Autopsy route", "post-call-routing", "autopsy-flag", "blu")
          ],"The motion may not be real enough yet.","You still need the reactivation condition.")
        ]),
        node("trigger-and-urgency","soft-trigger","pr","Keep soft urgency honest","\"If this is still early, what would need to happen before this becomes a funded workflow review instead of general curiosity?\"","Use this when the buyer is interested but not yet committed.",false,[
          branch("TRIGGER NAMED","ok","\"If we could show a safer, faster hiring flow on one live req, it would get attention.\"","\"Good. Then let us define the req and the proof bar now.\"",[
            jumpNode("Choose the pilot req", "proof-threshold", "pilot-req", "grn"),
            jumpNode("Lock the req review", "next-step-lock", "req-review", "blu")
          ],"A usable threshold has been named.","You still need the exact req and review group."),
          branch("NO REAL SPONSOR","fl","\"We would need a real sponsor to care first.\"","\"Then who is most likely to care first, and what pain would they need to see clearly?\"",[
            jumpNode("Find the owner", "stakeholder-and-ownership", "recruiting-ops", "red"),
            jumpNode("Return to funnel pain", "pain-and-consequence", "funnel-break", "blu")
          ],"No real sponsor is active yet.","You still need the person and problem pairing.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Stakeholder and ownership","Map who can carry or kill it.",true,[
        node("stakeholder-and-ownership","recruiting-ops","fu","Find the recruiting owner","\"Who feels this pain enough to move it first: talent leadership, recruiting ops, frontline recruiters, or finance looking at hiring efficiency?\"","Start here when the workflow is clear but sponsorship is not.",true,[
          branch("OWNER CLEAR","ok","\"Recruiting ops and talent leadership would drive it, but hiring managers have to buy into it.\"","\"Good. Which question matters more first: recruiter relief, quality control, or hiring-manager trust?\"",[
            jumpNode("Set the proof bar", "proof-threshold", "quality-bar", "grn"),
            jumpNode("Map the manager owner", "stakeholder-and-ownership", "hiring-manager", "blu")
          ],"The sponsor path is visible.","You still need the first gating question."),
          branch("NO OWNER","fl","\"No one fully owns this yet.\"","\"Then who would have to carry the first req review for this not to die after today?\"",[
            jumpNode("Lock the req review", "next-step-lock", "req-review", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "freeze-check", "blu")
          ],"Ownership is not yet assigned.","You still need a named person for the next meeting.")
        ]),
        node("stakeholder-and-ownership","hiring-manager","pr","Find the hiring-manager stake","\"What part of this pain lands on hiring managers most: slow feedback loops, weak candidate quality, poor calibration, or too much process overhead?\"","Use this when the problem crosses TA and hiring teams.",false,[
          branch("MANAGER PAIN CLEAR","ok","\"Managers do not trust the funnel and hate slow cycles.\"","\"What would they need to see to believe the process is actually improving?\"",[
            jumpNode("Open quality bar", "proof-threshold", "quality-bar", "grn"),
            jumpNode("Map the approval path", "decision-architecture", "approval-path", "blu")
          ],"The manager stake is visible.","You still need the proof condition that earns trust."),
          branch("RECRUITER ONLY","fl","\"This is really more of a recruiter problem.\"","\"Then what makes it expensive enough for leadership to care, not just recruiters to complain?\"",[
            jumpNode("Return to pain", "pain-and-consequence", "funnel-break", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "headcount-pressure", "blu")
          ],"Manager stake may be weak.","You still need the leadership consequence.")
        ])
      ]),
      segment("proof-threshold","06","Proof threshold","Define the trust bar.",true,[
        node("proof-threshold","quality-bar","pur","Set the quality bar","\"Before this could move, what would the team have to trust: better candidate quality, faster screening, fairer evaluation, cleaner calibration, or all of the above?\"","Start here when the buyer goes straight to quality and trust.",true,[
          branch("QUALITY FIRST","ok","\"Candidate quality and calibration matter most. Speed alone would not be enough.\"","\"Then what is the fairest live req to test quality without creating hiring risk?\"",[
            jumpNode("Choose the pilot req", "proof-threshold", "pilot-req", "grn"),
            jumpNode("Open approval path", "decision-architecture", "approval-path", "blu")
          ],"The quality bar is explicit.","You still need the safest live req to test against it."),
          branch("FAIRNESS FIRST","ly","\"Bias, fairness, and compliance come first for us.\"","\"Then where would a human-in-the-loop boundary need to sit for this to be acceptable?\"",[
            jumpNode("Open judgment boundary", "proof-threshold", "judgment-boundary", "org"),
            jumpNode("Map the approval path", "decision-architecture", "risk-review", "blu")
          ],"Compliance and fairness outrank speed.","You still need the control boundary."),
          branch("ROI FIRST","fl","\"Show me time saved first.\"","\"Fair. Which req or funnel step would prove ROI fastest without lowering quality?\"",[
            jumpNode("Choose the pilot req", "proof-threshold", "pilot-req", "red"),
            jumpNode("Return to bottleneck", "pain-and-consequence", "funnel-break", "blu")
          ],"The buyer is forcing business case first.","You still need a safe ROI req.")
        ]),
        node("proof-threshold","judgment-boundary","pr","Set the judgment boundary","\"Where must the human stay fully in control for this to be acceptable: screening decision, interview evaluation, final decision, or every sensitive role?\"","Use this when they worry about automating hiring judgment.",false,[
          branch("BOUNDARY CLEAR","ok","\"Humans stay on the final decision, but workflow support earlier is acceptable.\"","\"Good. Which req lets us test that boundary safely?\"",[
            jumpNode("Choose the pilot req", "proof-threshold", "pilot-req", "grn"),
            jumpNode("Lock the req review", "next-step-lock", "req-review", "blu")
          ],"A safe control boundary is visible.","You still need the live req that proves it."),
          branch("EVERYTHING HUMAN","fl","\"We want humans touching everything important.\"","\"Then which part of the workflow still creates pain even if final judgment never moves?\"",[
            jumpNode("Return to live req", "current-state-truth", "live-req", "red"),
            jumpNode("Return to funnel pain", "pain-and-consequence", "funnel-break", "blu")
          ],"The safe zone is narrower than the buyer first wants.","You still need the non-judgment workflow scope.")
        ]),
        node("proof-threshold","pilot-req","fu","Choose the pilot req","\"What is the safest meaningful req to test first: one role family, one hiring team, one workflow step, and one proof bar for quality and speed?\"","Use this when the buyer is open but needs a narrow start.",false,[
          branch("REQ CLEAR","ok","\"One priority req class with a cooperative hiring team would be the cleanest place to start.\"","\"Good. Then who needs to join the review so that req becomes a real test, not a theory deck?\"",[
            jumpNode("Lock the req review", "next-step-lock", "req-review", "grn"),
            jumpNode("Map the approval path", "decision-architecture", "approval-path", "blu")
          ],"A pilot req is visible.","You still need the review group and date."),
          branch("NO SAFE REQ","fl","\"Everything feels too broad or too risky right now.\"","\"Then which workflow step is narrow enough to pressure-test without trying to fix the whole funnel at once?\"",[
            jumpNode("Return to live req", "current-state-truth", "live-req", "red"),
            jumpNode("Return to current stack", "current-vendor-and-displacement", "ats-stack", "blu")
          ],"The buyer does not yet see a safe entry point.","You still need a narrower req or workflow slice.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor and displacement","Map the status quo to replace.",true,[
        node("current-vendor-and-displacement","ats-stack","fu","Inspect the current stack","\"What is already in place today: ATS, sourcing tools, scheduling, assessments, CRM, HRIS, and recruiter workflows around them?\"","Start here when the buyer defends the existing stack.",true,[
          branch("STACK CLEAR","ok","\"The stack is there, but recruiters still carry too much of the workflow by hand.\"","\"Which layer stops short first: sourcing signal, screening quality, scheduling, or manager follow-through?\"",[
            jumpNode("Return to live req", "current-state-truth", "live-req", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "quality-bar", "blu")
          ],"System presence is not equal to funnel relief.","You still need the first failing layer in the stack."),
          branch("LOCKED IN","fl","\"We are deeply tied to our ATS contract for years.\"","\"That is fine. Then what workflow still needs help around the ATS instead of replacing it?\"",[
            jumpNode("Return to bottleneck", "pain-and-consequence", "funnel-break", "red"),
            jumpNode("Choose the pilot req", "proof-threshold", "pilot-req", "blu")
          ],"The motion has to work around the incumbent.","You still need the workflow outside the contract wall.")
        ]),
        node("current-vendor-and-displacement","agency-status-quo","pr","Inspect agency dependence","\"Where is the current status quo still relying on agencies or contractor help because the internal team cannot absorb the load?\"","Use this when agency spend is part of the story.",false,[
          branch("AGENCY CLEAR","ok","\"We use agencies when speed and volume outrun the internal team.\"","\"What would have to improve in the funnel for that dependence to fall?\"",[
            jumpNode("Return to bottleneck", "pain-and-consequence", "funnel-break", "grn"),
            jumpNode("Lock the req review", "next-step-lock", "req-review", "blu")
          ],"Agency reliance is a real scope.","You still need the internal workflow improvement behind it."),
          branch("NOT ABOUT AGENCIES","fl","\"Agency spend is not the main issue.\"","\"Then what is the harder status quo to break: manager behavior, recruiter load, or candidate quality?\"",[
            jumpNode("Return to owner map", "stakeholder-and-ownership", "hiring-manager", "red"),
            jumpNode("Return to pain", "pain-and-consequence", "quality-break", "blu")
          ],"Agencies are not the main blocker.","You still need the real incumbent behavior.")
        ])
      ]),
      segment("decision-architecture","08","Decision architecture","Map the approval path.",true,[
        node("decision-architecture","approval-path","fu","Map the approval path","\"If this became real, what would the evaluation path actually look like from first req review to approval?\"","Start here when the proof bar is getting concrete.",true,[
          branch("PATH CLEAR","ok","\"Talent leadership would sponsor, recruiting ops would evaluate, and people systems or HR leadership would review.\"","\"Good. What does the first review need to decide so the motion stays real?\"",[
            jumpNode("Lock the req review", "next-step-lock", "req-review", "grn"),
            jumpNode("Set the pilot req", "next-step-lock", "pilot-design", "blu")
          ],"The approval path is visible.","You still need the first review outcome."),
          branch("RISK REVIEW","ly","\"Legal or HR compliance would want to review anything that touches evaluation.\"","\"Then which req or workflow is narrow enough to evaluate without triggering broad policy fear?\"",[
            jumpNode("Choose the pilot req", "proof-threshold", "pilot-req", "org"),
            jumpNode("Open risk review", "decision-architecture", "risk-review", "blu")
          ],"Risk review may dominate the path.","You still need a scope that can survive it."),
          branch("MURKY PATH","fl","\"We have not mapped that yet.\"","\"That is fine. Then the next step should be the people who can map it together around one real req.\"",[
            jumpNode("Lock the req review", "next-step-lock", "req-review", "red"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"The decision path is still murky.","You still need the minimum viable review group.")
        ]),
        node("decision-architecture","risk-review","pr","Map fairness and compliance review","\"What fairness, bias, audit, or compliance questions would have to be answered before this could move beyond exploration?\"","Use this when they are nervous about automated hiring risk.",false,[
          branch("QUESTIONS CLEAR","ok","\"Bias controls, auditability, and human review are the main gates.\"","\"Good. Then the next review has to include whoever can answer those with TA leadership present.\"",[
            jumpNode("Lock the review group", "next-step-lock", "req-review", "grn"),
            jumpNode("Set the boundary", "proof-threshold", "judgment-boundary", "blu")
          ],"The real blockers are now named.","You still need the meeting that can answer them."),
          branch("NOT SURE","fl","\"We are not fully sure yet.\"","\"Then the first review should probably define those questions before anything broader.\"",[
            jumpNode("Lock the review", "next-step-lock", "req-review", "red"),
            jumpNode("Find the risk owner", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"The gating questions are not yet mapped.","You still need the people who can define them.")
        ])
      ]),
      segment("next-step-lock","09","Next-step lock","Leave with a real req review.",true,[
        node("next-step-lock","req-review","gr","Lock the req review","\"The next step should probably be a working review with recruiting ops, one hiring owner, and one live req in scope. Does that sound right?\"","Start here when the req and owner are named.",true,[
          branch("AGREES","ok","\"Yes. That makes sense.\"","\"Good. Which req should that review center on, and who needs to be there so the meeting can actually decide something?\"",[
            jumpNode("Set the pilot req", "next-step-lock", "pilot-design", "grn"),
            jumpRoom("Carry into Call Planner", "call-planner", "blu")
          ],"A real req review is now possible.","You still need the attendee set, req, and date."),
          branch("TOO EARLY","ly","\"That feels a little early.\"","\"That is fair. What is missing before that review would feel earned: req scope, proof detail, or sponsor alignment?\"",[
            jumpNode("Return to proof bar", "proof-threshold", "pilot-req", "org"),
            jumpNode("Return to owner map", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"The buyer is not ready for the review yet.","You still need the missing condition."),
          branch("SEND SOMETHING","fl","\"Just send something first.\"","\"I can. What should it help your team decide so the follow-up becomes a working review instead of polite circulation?\"",[
            jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to proof bar", "proof-threshold", "quality-bar", "blu")
          ],"They are trying to defer with no meeting.","You still need the decision the follow-up is supposed to support.")
        ]),
        node("next-step-lock","soft-deferral","pr","Keep soft deferral honest","\"If I send material, what should it help the team answer before we meet again?\"","Use this whenever the buyer tries to end with passive follow-up.",false,[
          branch("DECISION NAMED","ok","\"It should help us decide whether this req workflow is worth pressure-testing with recruiting ops and a hiring owner.\"","\"Good. Then let us name the req now so the follow-up earns that meeting.\"",[
            jumpNode("Return to live req", "current-state-truth", "live-req", "grn"),
            jumpNode("Lock the req review", "next-step-lock", "req-review", "blu")
          ],"The follow-up has a real decision attached to it.","You still need the req it is about."),
          branch("NO COMMITMENT","fl","\"I cannot commit to another meeting yet.\"","\"Understood. Then what would have to be true for a next meeting to be worth it?\"",[
            jumpNode("Return to trigger", "trigger-and-urgency", "freeze-check", "red"),
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"There is no meeting commitment yet.","You still need the threshold for a real next step.")
        ]),
        node("next-step-lock","pilot-design","fu","Lock the pilot req","\"If the review goes well, what is the smallest credible test: one req type, one team, and one proof bar for quality and speed?\"","Use this when they are already thinking beyond the first review.",false,[
          branch("PILOT CLEAR","ok","\"One priority req class with recruiting ops and one hiring team would be the right start.\"","\"Good. Then the first review should decide that scope, the control boundary, and the success criteria.\"",[
            jumpRoom("Take scope into Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Carry the meeting into Call Planner", "call-planner", "blu")
          ],"The pilot can now be shaped concretely.","You still need the meeting date and owner."),
          branch("NOT READY","fl","\"We are not ready to talk pilot shape yet.\"","\"Then the first review should stay diagnostic. What would make that review feel worth taking?\"",[
            jumpNode("Return to trigger", "trigger-and-urgency", "headcount-pressure", "red"),
            jumpNode("Return to live req", "current-state-truth", "live-req", "blu")
          ],"The buyer is not yet ready for pilot language.","You still need the condition that would justify it.")
        ])
      ]),
      segment("post-call-routing","10","Post-call routing","Carry the truth into the next room.",false,[
        node("post-call-routing","room-route","sl","Carry the req truth forward","\"We have the funnel bottleneck, the owner map, the proof bar, and the next review condition. Carry only those into the next room.\"","Use this once the req review motion is grounded.",true,[
          branch("REQ READY","ok","\"Use Deal Workspace to shape the req review and pilot boundary.\"","\"Then move the req, owner map, proof threshold, and review goal into the deal record now.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The req is concrete enough for the next room.","You still need the date and attendee set if they are not locked."),
          branch("MEETING READY","ly","\"Use Call Planner because the next win is the req review meeting itself.\"","\"Then carry the req, who must join, and what the review has to decide.\"",[
            jumpRoom("Open Call Planner", "call-planner", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The meeting design is the next priority.","You still need the review scope and proof question."),
          branch("DRIFT RISK","fl","\"Use Future Autopsy if ownership or urgency is still too soft and this may stall.\"","\"Then carry the missing sponsor, proof blocker, and soft next-step condition as drift clues.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"There is visible stall risk.","You still need the dominant drift reason.")
        ]),
        node("post-call-routing","autopsy-flag","pr","Carry the stall clues","\"If this slips, what will probably cause it: low hiring volume, weak sponsor, quality anxiety, or no clear req in scope?\"","Use this when the motion is interesting but not yet earned.",false,[
          branch("SPONSOR SOFT","ok","\"Sponsor softness is the risk.\"","\"Then flag the missing sponsor and keep the next meeting built around one req and one decision.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The likely drift cause is visible.","You still need the sponsor trigger."),
          branch("SCOPE MISSING","fl","\"We still do not have a clear req in scope.\"","\"Then do not pretend the motion is real yet. Carry that as the primary missing truth.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"Req scope is still missing.","You still need the first req candidate.")
        ])
      ])
    ]
  };
})();
