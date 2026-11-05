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
    { title:"Funnel pain", items:["Which stage is losing the most time: sourcing, screening, scheduling, interviewing, or closing", "Whether recruiter pain and hiring-manager pain are different problems in the org", "Drop-off points and candidate-experience concerns at the relevant roles"] },
    { title:"What they need to see", items:["Time-to-fill or offer-acceptance lift against their last two quarters on comparable roles", "More consistent interviews on a type of role where interviewers judge candidates differently", "Documented fairness, bias, and compliance controls for their regulations"] },
    { title:"Decision path", items:["CHRO or VP Talent sponsor who feels the hiring-velocity cost", "TA operations or systems evaluator who owns the stack (ATS, CRM, sourcing, assessment)", "Hiring managers whose experience must not get worse with the change"] }
  ];
  var objectionLibrary = [
    { trigger:"our ATS already does this", reply:"Which part? ATS tracking and AI screening do different jobs. Which piece of the funnel is the ATS genuinely solving, and which piece are recruiters still carrying manually?" },
    { trigger:"you cannot automate human judgment in hiring", reply:"Agreed on the final decision. The question is whether the time spent getting to that decision is all human judgment or mostly coordination, scheduling, and triage. Which of those is taking most of your team's time this quarter?" },
    { trigger:"we are in a hiring freeze", reply:"Understood. Then the question is what you want ready when the freeze lifts. Before the freeze, was the problem keeping candidate records clean, or getting enough candidates through to an offer? You'd prepare differently for each." },
    { trigger:"bias and compliance will block this", reply:"Fair. Those are real requirements, especially under NYC Local Law 144 or the EU AI Act. What specifically would satisfy your counsel — audit methodology, demographic reporting, or evaluation transparency?" }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from HeyMilo or Moonhub?", bridge:"Depends on where the funnel breaks for you. Moonhub-style is sourcing coverage; HeyMilo-style is interview automation. Which bottleneck is the biggest right now?" },
    { question:"Does this replace our ATS?", bridge:"No. The question is whether there is work the ATS doesn't handle that a tool on top of it could. What work still happens in spreadsheets or Slack despite the ATS being there?" },
    { question:"What about DEI compliance?", bridge:"Serious concern. What does your counsel require — a full audit trail, scoring that is neutral across demographic groups, or transparency about how candidates are evaluated? Each needs a different setup." }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing makes sense once we know whether slow hiring costs enough to justify change. What did the last quarter of hiring cost you in time-to-fill or failed hires?" },
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
        copy:"Start the conversation from a role where recruiters still have to step in by hand.",
        action:jumpNode("Ask about one open role", "current-state-truth", "live-req", "blu")
      },
      {
        title:"Name the bottleneck",
        copy:"Make the pain specific: sourcing, screening, scheduling, interview quality, or closing.",
        action:jumpNode("Ask about hiring funnel problems", "pain-and-consequence", "funnel-break", "org")
      },
      {
        title:"Lock the req review",
        copy:"Leave with recruiting ops and one hiring owner reviewing a real req.",
        action:jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"cant-automate-judgment",
        label:"You cannot automate hiring judgment",
        reply:"Agreed. The first question is where coordination, screening, or process can improve without replacing the final decision a person makes.",
        actions:[
          jumpNode("Agree which decisions stay with a person", "proof-threshold", "judgment-boundary", "pur"),
          jumpNode("Pick a low-risk role to test first", "proof-threshold", "pilot-req", "blu")
        ]
      },
      {
        id:"ats-lock-in",
        label:"We are locked into the ATS",
        reply:"That is fine. I am not asking whether the ATS stays. I am asking where the team still does the work around it by hand.",
        actions:[
          jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "ats-stack", "blu"),
          jumpNode("Ask where hiring slows down", "pain-and-consequence", "funnel-break", "org")
        ]
      },
      {
        id:"hiring-freeze",
        label:"We are in a hiring freeze",
        reply:"Then the question is whether you are still hiring enough to justify changing how you work now.",
        actions:[
          jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "freeze-check", "red"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ]
      },
      {
        id:"quality-matters-more",
        label:"Quality matters more than speed",
        reply:"Then they need to see whether a better process improves candidate quality and interviewer consistency, instead of just moving candidates through faster.",
        actions:[
          jumpNode("Agree what they need to see", "proof-threshold", "quality-bar", "pur"),
          jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "hiring-manager", "blu")
        ]
      },
      {
        id:"send-material",
        label:"Send me something",
        reply:"I can. First tell me which req or workflow the material should help you decide on so the follow-up becomes a real review.",
        actions:[
          jumpNode("Walk through one open role", "current-state-truth", "live-req", "blu"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening","Ask where recruiters still do manual work to keep hiring moving.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most TA teams already have an ATS and basic tooling. The question is where recruiters or coordinators still have to do the expensive parts of hiring by hand. Is that true in your world too?\"","Use this when they're willing to talk through the problem before seeing the product.",true,[
          branch("CONFIRMS","ok","\"Yes. The systems are there, but the team still spends too much time triaging and coordinating.\"","\"Where does that manual work hurt most: sourcing, screening, scheduling, interviews, or closing?\"",[
            jumpNode("Walk through one open role", "current-state-truth", "live-req", "blu"),
            jumpNode("Ask where hiring slows down", "pain-and-consequence", "funnel-break", "grn")
          ],"Recruiters still step in by hand to keep hiring moving.","You still need the exact workflow step where it shows up first."),
          branch("JUDGMENT PUSHBACK","fl","\"You cannot automate hiring judgment.\"","\"Agreed. So where would workflow support still help without touching the final judgment call?\"",[
            jumpNode("Agree which decisions stay with a person", "proof-threshold", "judgment-boundary", "pur"),
            jumpNode("Walk through one open role", "current-state-truth", "live-req", "blu")
          ],"Judgment is the first objection, not the only objection.","You still need the safe part of the workflow.")
        ]),
        node("opening-frame","req-scope","fu","Start from one req","\"Pick one open role that still feels heavier than it should. Where is that req slowing down or demanding too much recruiter intervention?\"","Use this when the buyer already runs the workflow day to day.",false,[
          branch("REQ READY","ok","\"Screening and scheduling are eating too much recruiter time on one of our priority roles.\"","\"Good. Which part hurts more first: candidate quality, recruiter bandwidth, or hiring-manager frustration?\"",[
            jumpNode("Ask about one open role", "current-state-truth", "live-req", "grn"),
            jumpNode("Ask about hiring funnel problems", "pain-and-consequence", "funnel-break", "blu")
          ],"The call is now focused on one real open role.","You still need the specific failure pattern inside it."),
          branch("NO LIVE EXAMPLE","fl","\"I do not have one specific req in mind.\"","\"Then use the last hiring cycle that felt inefficient. Where did the funnel break down?\"",[
            jumpNode("Ask where the funnel breaks", "pain-and-consequence", "funnel-break", "red"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "headcount-pressure", "blu")
          ],"No live req is ready yet.","You still need one recent hiring incident.")
        ])
      ]),
      segment("current-state-truth","02","How they work today","Ask them to walk you through how a candidate moves from applied to hired.",true,[
        node("current-state-truth","live-req","fu","Walk through one open role","\"Walk me through one open req. Where does the team still spend the most human time today: sourcing, screening, scheduling, calibration, or close coordination?\"","Start here when the buyer is willing to get concrete.",true,[
          branch("WORKFLOW CLEAR","ok","\"Screening and back-and-forth coordination still eat the most time.\"","\"What makes that heavy today: volume, poor signals, slow manager response, or inconsistent evaluation?\"",[
            jumpNode("Ask where hiring slows down", "pain-and-consequence", "funnel-break", "grn"),
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"You know where hiring slows down on a real role.","You still need the source of that burden."),
          branch("MANAGER DELAY","fl","\"Hiring managers are the real delay more than recruiters.\"","\"Then what work keeps bouncing back onto recruiting because the manager side is too slow or unclear?\"",[
            jumpNode("Name the time managers lose", "pain-and-consequence", "manager-drag", "red"),
            jumpNode("Ask how hiring managers are affected", "stakeholder-and-ownership", "hiring-manager", "blu")
          ],"Manager behavior may be the real bottleneck.","You still need the exact handoff that breaks.")
        ]),
        node("current-state-truth","funnel-shape","pr","Ask which hiring stage hurts most","\"Is the bigger pain at the top of funnel, middle of funnel, or close: getting candidates in, evaluating them well, or getting them to accept?\"","Use this when they speak in generalities.",false,[
          branch("TOP OF FUNNEL","ok","\"Getting the right candidates in is still the hardest part.\"","\"Good. Is that a sourcing problem, a triage problem, or a role-calibration problem?\"",[
            jumpNode("Ask about hiring funnel problems", "pain-and-consequence", "funnel-break", "grn"),
            jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "ats-stack", "blu")
          ],"They said finding candidates is a real problem.","You still need the first step that fails inside it."),
          branch("LATE STAGE","fl","\"We lose time later with slow closes and candidate drop-off.\"","\"What causes that most: compensation, process lag, weak conviction, or candidate experience?\"",[
            jumpNode("Ask about lost candidates", "pain-and-consequence", "candidate-drop", "red"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "headcount-pressure", "blu")
          ],"Delays late in hiring may be the real issue.","You still need the main cause of it.")
        ])
      ]),
      segment("pain-and-consequence","03","The problem and its cost","Find out what slow or manual hiring costs them.",true,[
        node("pain-and-consequence","funnel-break","ri","Ask where hiring slows down","\"What is the actual damage today: recruiter bandwidth burned, slower time-to-fill, candidate loss, or hiring managers losing trust in the process?\"","Start here once you know where the work breaks down.",true,[
          branch("BANDWIDTH CLEAR","ok","\"Recruiters spend too much time triaging and coordinating instead of actually recruiting.\"","\"What does that crowd out first: speed, candidate quality, or stakeholder trust?\"",[
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "recruiting-ops", "grn"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "headcount-pressure", "blu")
          ],"They said recruiters are stretched too thin.","You still need the business consequence of it."),
          branch("NOT BIG ENOUGH","fl","\"It is annoying, but not severe.\"","\"Then what would have to happen before it becomes worth changing the workflow?\"",[
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Ask about lost candidates", "pain-and-consequence", "candidate-drop", "blu")
          ],"The problem may not yet hurt enough to act on.","You still need the trigger.")
        ]),
        node("pain-and-consequence","manager-drag","pr","Name the time managers lose","\"What is the actual damage when managers are the bottleneck: slower feedback, weaker calibration, candidates cooling off, or recruiters doing follow-up they should not own?\"","Use this when the friction sits more with hiring teams than TA.",false,[
          branch("DRAG CLEAR","ok","\"Managers are slow to respond and it creates avoidable recruiter rework.\"","\"What should improve first if that changes: cycle speed, quality, or candidate experience?\"",[
            jumpNode("Ask which managers feel this first", "stakeholder-and-ownership", "hiring-manager", "grn"),
            jumpNode("Agree what quality they need to see", "proof-threshold", "quality-bar", "blu")
          ],"Manager behavior is part of the funnel cost.","You still need the outcome that matters most."),
          branch("QUALITY ISSUE","fl","\"The issue is not speed. It is inconsistent interview quality.\"","\"Then stay there. Where does evaluation quality break most visibly?\"",[
            jumpNode("Go back to where interview quality slips", "pain-and-consequence", "quality-break", "red"),
            jumpNode("Go back to how hiring managers are affected", "stakeholder-and-ownership", "hiring-manager", "blu")
          ],"Slow hiring managers may really be a sign that interviewers judge candidates inconsistently.","You still need the first visible quality break.")
        ]),
        node("pain-and-consequence","quality-break","pr","Ask where interview quality slips","\"Where does interview quality slip today: inconsistent screens, untrained interviewers, weak scorecards, or different managers reading talent differently?\"","Use this when they frame the problem as quality over speed.",false,[
          branch("CALIBRATION CLEAR","ok","\"Interview quality and calibration are inconsistent across managers.\"","\"What is the damage when that happens: bad hires, slower decisions, or candidate confusion?\"",[
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "hiring-manager", "grn"),
            jumpNode("Agree what quality they need to see", "proof-threshold", "quality-bar", "blu")
          ],"You know where quality falls short.","You still need the cost of that inconsistency."),
          branch("QUALITY FINE","fl","\"Quality is mostly fine. The issue is speed.\"","\"Then let's stay with speed. Where is manual work still slowing the role down?\"",[
            jumpNode("Go back to where hiring slows down", "pain-and-consequence", "funnel-break", "red"),
            jumpNode("Go back to the open role", "current-state-truth", "live-req", "blu")
          ],"Quality is not the main problem.","You still need the operational drag.")
        ]),
        node("pain-and-consequence","candidate-drop","fu","Ask where strong candidates drop out","\"Where do strong candidates drop out today: slow response, weak experience, too many steps, or poor close coordination?\"","Use this when the pain shows up later in the funnel.",false,[
          branch("DROP CLEAR","ok","\"Strong candidates cool off because the process drags and communication gets uneven.\"","\"What part of that should improve first: response speed, manager follow-through, or process simplicity?\"",[
            jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "hiring-manager", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "quality-bar", "blu")
          ],"Losing candidates late in the process is a real problem.","You still need the first fix that would reduce it."),
          branch("NOT MAIN ISSUE","fl","\"Candidate drop-off is secondary. The bigger issue is earlier in the funnel.\"","\"Then let's stay there. Where does the manual work usually start?\"",[
            jumpNode("Go back to the open role", "current-state-truth", "live-req", "red"),
            jumpNode("Go back to where hiring slows down", "pain-and-consequence", "funnel-break", "blu")
          ],"Losing candidates is not the main problem.","You still need the earlier funnel bottleneck.")
        ])
      ]),
      segment("trigger-and-urgency","04","Why now","Find out what changed that makes this worth solving now.",true,[
        node("trigger-and-urgency","headcount-pressure","ri","Find the hiring pressure","\"What changed that made this worth looking at now: more req volume, executive headcount goals, recruiter capacity strain, quality concerns, or rising agency spend?\"","Start here when urgency exists but is not yet specific.",true,[
          branch("TRIGGER CLEAR","ok","\"Volume and speed targets moved up, and the current team cannot keep pace.\"","\"Which req class or funnel step would prove the case fastest if it improved?\"",[
            jumpNode("Walk through one open role", "current-state-truth", "live-req", "grn"),
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "blu")
          ],"They said why it matters now.","You still need the req or workflow it attaches to."),
          branch("AGENCY COST","ly","\"We are spending too much on agencies because the internal team cannot absorb the load.\"","\"What part of the funnel would need to improve first to reduce that dependence?\"",[
            jumpNode("Ask about lost candidates", "pain-and-consequence", "candidate-drop", "org"),
            jumpNode("Ask what they rely on today and why", "current-vendor-and-displacement", "agency-status-quo", "blu")
          ],"Agency pressure is part of the trigger.","You still need the internal workflow gap behind it."),
          branch("FREEZE RISK","fl","\"Hiring is active, but things could change fast.\"","\"Then what would have to stay true for this to still be worth a real workflow review?\"",[
            jumpNode("Check whether hiring volume could dry up", "trigger-and-urgency", "freeze-check", "red"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ],"Urgency may be unstable.","You still need the condition that keeps it real.")
        ]),
        node("trigger-and-urgency","freeze-check","fu","Check whether hiring volume could dry up","\"Is there enough live hiring volume and enough pain right now to justify change, or would this stall if hiring slows further?\"","Use this when the need may be too small or hiring volume too low.",false,[
          branch("STILL ACTIVE","ok","\"Yes. The req volume is real enough that the team still needs relief now.\"","\"Good. Then which req or funnel step should the next review center on?\"",[
            jumpNode("Go back to the open role", "current-state-truth", "live-req", "grn"),
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "blu")
          ],"The project is still active despite risk.","You still need the scoped review object."),
          branch("TOO SOFT","fl","\"Honestly, this probably becomes secondary if volume drops any further.\"","\"Then let us keep this honest. What would have to happen before it becomes a real priority again?\"",[
            jumpNode("Ask what would make this urgent", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Open Future Autopsy", "post-call-routing", "autopsy-flag", "blu")
          ],"The need may not be real enough yet.","You still need the reactivation condition.")
        ]),
        node("trigger-and-urgency","soft-trigger","pr","Ask whether anything makes this urgent","\"If this is still early, what would need to happen before this becomes a funded workflow review instead of general curiosity?\"","Use this when the buyer is interested but not yet committed.",false,[
          branch("TRIGGER NAMED","ok","\"If we could show a safer, faster hiring flow on one live req, it would get attention.\"","\"Good. Then let us define the req and what they need to see now.\"",[
            jumpNode("Pick one role to test first", "proof-threshold", "pilot-req", "grn"),
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "blu")
          ],"They named a clear point at which this becomes a priority.","You still need the exact req and review group."),
          branch("NO REAL SPONSOR","fl","\"We would need a real sponsor to care first.\"","\"Then who is most likely to care first, and what pain would they need to see clearly?\"",[
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "recruiting-ops", "red"),
            jumpNode("Go back to where hiring slows down", "pain-and-consequence", "funnel-break", "blu")
          ],"No real sponsor is active yet.","You still need the person and problem pairing.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Who's involved","Find out who would push for this and who could stop it.",true,[
        node("stakeholder-and-ownership","recruiting-ops","fu","Find the recruiting owner","\"Who feels this pain enough to move it first: talent leadership, recruiting ops, frontline recruiters, or finance looking at hiring efficiency?\"","Start here when the workflow is clear but sponsorship is not.",true,[
          branch("OWNER CLEAR","ok","\"Recruiting ops and talent leadership would drive it, but hiring managers have to buy into it.\"","\"Good. Which question matters more first: recruiter relief, quality control, or hiring-manager trust?\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "quality-bar", "grn"),
            jumpNode("Ask how hiring managers are affected", "stakeholder-and-ownership", "hiring-manager", "blu")
          ],"You know who might sponsor this.","You still need the first gating question."),
          branch("NO OWNER","fl","\"No one fully owns this yet.\"","\"Then who would have to carry the first req review to keep this moving after today?\"",[
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "freeze-check", "blu")
          ],"Ownership is not yet assigned.","You still need a named person for the next meeting.")
        ]),
        node("stakeholder-and-ownership","hiring-manager","pr","Ask how hiring managers are affected","\"What part of this pain falls on hiring managers most: slow feedback loops, weak candidate quality, poor calibration, or too much process overhead?\"","Use this when the problem crosses TA and hiring teams.",false,[
          branch("MANAGER PAIN CLEAR","ok","\"Managers do not trust the funnel and hate slow cycles.\"","\"What would they need to see to believe the process is actually improving?\"",[
            jumpNode("Ask what quality they need", "proof-threshold", "quality-bar", "grn"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "approval-path", "blu")
          ],"You know how hiring managers are affected.","You still need the evidence that would win their trust."),
          branch("RECRUITER ONLY","fl","\"This is really more of a recruiter problem.\"","\"Then what makes it expensive enough for leadership to care, not just recruiters to complain?\"",[
            jumpNode("Go back to the problem", "pain-and-consequence", "funnel-break", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "headcount-pressure", "blu")
          ],"Manager stake may be weak.","You still need the leadership consequence.")
        ])
      ]),
      segment("proof-threshold","06","What they need to see","Agree on what they would need to see to trust it with candidates.",true,[
        node("proof-threshold","quality-bar","pur","Agree what quality they need to see","\"Before this could move, what would the team have to trust: better candidate quality, faster screening, fairer evaluation, cleaner calibration, or all of the above?\"","Start here when the buyer goes straight to quality and trust.",true,[
          branch("QUALITY FIRST","ok","\"Candidate quality and calibration matter most. Speed alone would not be enough.\"","\"Then what is the fairest live req to test quality without creating hiring risk?\"",[
            jumpNode("Pick one role to test first", "proof-threshold", "pilot-req", "grn"),
            jumpNode("Ask about the approval path", "decision-architecture", "approval-path", "blu")
          ],"They said exactly what quality they need.","You still need the safest live req to test against it."),
          branch("FAIRNESS FIRST","ly","\"Bias, fairness, and compliance come first for us.\"","\"Then which steps would need to stay with a person for this to be acceptable?\"",[
            jumpNode("Ask which decisions must stay with a person", "proof-threshold", "judgment-boundary", "org"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "risk-review", "blu")
          ],"Compliance and fairness matter more than speed.","You still need the control boundary."),
          branch("ROI FIRST","fl","\"Show me time saved first.\"","\"Fair. Which req or funnel step would prove ROI fastest without lowering quality?\"",[
            jumpNode("Pick one role to test first", "proof-threshold", "pilot-req", "red"),
            jumpNode("Go back to where hiring slows down", "pain-and-consequence", "funnel-break", "blu")
          ],"The buyer wants the business case first.","You still need a safe ROI req.")
        ]),
        node("proof-threshold","judgment-boundary","pr","Agree which decisions stay with a person","\"Where must the human stay fully in control for this to be acceptable: screening decision, interview evaluation, final decision, or every sensitive role?\"","Use this when they worry about automating hiring judgment.",false,[
          branch("BOUNDARY CLEAR","ok","\"Humans stay on the final decision, but workflow support earlier is acceptable.\"","\"Good. Which req lets us test that boundary safely?\"",[
            jumpNode("Pick one role to test first", "proof-threshold", "pilot-req", "grn"),
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "blu")
          ],"They named which decisions must stay with a person.","You still need the live req that proves it."),
          branch("EVERYTHING HUMAN","fl","\"We want humans touching everything important.\"","\"Then which part of the workflow still creates pain even if final judgment never moves?\"",[
            jumpNode("Go back to the open role", "current-state-truth", "live-req", "red"),
            jumpNode("Go back to where hiring slows down", "pain-and-consequence", "funnel-break", "blu")
          ],"The safe zone is narrower than the buyer first wants.","You still need the non-judgment workflow scope.")
        ]),
        node("proof-threshold","pilot-req","fu","Pick one role to test first","\"What is the safest meaningful req to test first: one role family, one hiring team, one workflow step, and one clear standard for quality and speed?\"","Use this when the buyer is open but needs a narrow start.",false,[
          branch("REQ CLEAR","ok","\"One priority req class with a cooperative hiring team would be the cleanest place to start.\"","\"Good. Then who needs to join the review so that req becomes a real test, not a theory deck?\"",[
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "grn"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "approval-path", "blu")
          ],"You have a possible role to pilot.","You still need the review group and date."),
          branch("NO SAFE REQ","fl","\"Everything feels too broad or too risky right now.\"","\"Then which workflow step is narrow enough to test without trying to fix the whole funnel at once?\"",[
            jumpNode("Go back to the open role", "current-state-truth", "live-req", "red"),
            jumpNode("Go back to the tools they use today", "current-vendor-and-displacement", "ats-stack", "blu")
          ],"The buyer does not yet see a safe entry point.","You still need a narrower req or workflow slice.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor","Find out what they use today and why it has lasted.",true,[
        node("current-vendor-and-displacement","ats-stack","fu","Ask what tools they use today","\"What is already in place today: ATS, sourcing tools, scheduling, assessments, CRM, HRIS, and recruiter workflows around them?\"","Start here when the buyer defends the existing stack.",true,[
          branch("STACK CLEAR","ok","\"The stack is there, but recruiters still carry too much of the workflow by hand.\"","\"Which step falls short first: finding candidates, screening quality, scheduling, or manager follow-through?\"",[
            jumpNode("Go back to the open role", "current-state-truth", "live-req", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "quality-bar", "blu")
          ],"Having the tools hasn't fixed hiring.","You still need the first failing layer in the stack."),
          branch("LOCKED IN","fl","\"We are deeply tied to our ATS contract for years.\"","\"That is fine. Then what workflow still needs help around the ATS instead of replacing it?\"",[
            jumpNode("Go back to where hiring slows down", "pain-and-consequence", "funnel-break", "red"),
            jumpNode("Pick one role to test first", "proof-threshold", "pilot-req", "blu")
          ],"The product has to work alongside their current tool.","You still need the workflow outside the contract wall.")
        ]),
        node("current-vendor-and-displacement","agency-status-quo","pr","Ask how much they rely on agencies","\"Where is the current status quo still relying on agencies or contractor help because the internal team cannot absorb the load?\"","Use this when agency spend is part of the story.",false,[
          branch("AGENCY CLEAR","ok","\"We use agencies when speed and volume outrun the internal team.\"","\"What would have to improve in the funnel for that dependence to fall?\"",[
            jumpNode("Go back to where hiring slows down", "pain-and-consequence", "funnel-break", "grn"),
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "blu")
          ],"Relying on agencies is a real problem for them.","You still need the internal workflow improvement behind it."),
          branch("NOT ABOUT AGENCIES","fl","\"Agency spend is not the main issue.\"","\"Then what is the harder status quo to break: manager behavior, recruiter load, or candidate quality?\"",[
            jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "hiring-manager", "red"),
            jumpNode("Go back to the problem", "pain-and-consequence", "quality-break", "blu")
          ],"Agencies are not the main blocker.","You still need the real incumbent behavior.")
        ])
      ]),
      segment("decision-architecture","08","How they'll decide","Find out who signs off and in what order.",true,[
        node("decision-architecture","approval-path","fu","Ask who approves this, in what order","\"If this became real, what would the evaluation path actually look like from first req review to approval?\"","Start here when what they need to see is getting concrete.",true,[
          branch("PATH CLEAR","ok","\"Talent leadership would sponsor, recruiting ops would evaluate, and people systems or HR leadership would review.\"","\"Good. What does the first review need to decide so the process can continue?\"",[
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "grn"),
            jumpNode("Agree what a small test would include", "next-step-lock", "pilot-design", "blu")
          ],"You know who approves this and in what order.","You still need the first review outcome."),
          branch("RISK REVIEW","ly","\"Legal or HR compliance would want to review anything that touches evaluation.\"","\"Then which req or workflow is narrow enough to evaluate without triggering broad policy fear?\"",[
            jumpNode("Pick one role to test first", "proof-threshold", "pilot-req", "org"),
            jumpNode("Ask about fairness and compliance review", "decision-architecture", "risk-review", "blu")
          ],"The risk review may decide how this goes.","You still need a scope that can pass that review."),
          branch("MURKY PATH","fl","\"We have not mapped that yet.\"","\"That is fine. Then the next step should be the people who can map it together around one real req.\"",[
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "red"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"It is still unclear how they would decide.","You still need the minimum viable review group.")
        ]),
        node("decision-architecture","risk-review","pr","Ask about fairness and compliance review","\"What fairness, bias, audit, or compliance questions would have to be answered before this could move beyond exploration?\"","Use this when they are nervous about automated hiring risk.",false,[
          branch("QUESTIONS CLEAR","ok","\"Bias controls, auditability, and human review are the main hurdles.\"","\"Good. Then the next review has to include whoever can answer those with TA leadership present.\"",[
            jumpNode("Agree who attends the review meeting", "next-step-lock", "req-review", "grn"),
            jumpNode("Agree which decisions stay with a person", "proof-threshold", "judgment-boundary", "blu")
          ],"The real blockers are now named.","You still need the meeting that can answer them."),
          branch("NOT SURE","fl","\"We are not fully sure yet.\"","\"Then the first review should probably define those questions before anything broader.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "req-review", "red"),
            jumpNode("Ask who can block this on risk", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"The gating questions are not yet mapped.","You still need the people who can define them.")
        ])
      ]),
      segment("next-step-lock","09","Next step","Leave with a dated review of one open role and a named owner.",true,[
        node("next-step-lock","req-review","gr","Book a review meeting on one open role","\"The next step should probably be a working review with recruiting ops, one hiring owner, and one live req in scope. Does that sound right?\"","Start here when the req and owner are named.",true,[
          branch("AGREES","ok","\"Yes. That makes sense.\"","\"Good. Which req should that review center on, and who needs to be there so the meeting can actually decide something?\"",[
            jumpNode("Agree what a small test would include", "next-step-lock", "pilot-design", "grn"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"A real req review is now possible.","You still need the attendee set, req, and date."),
          branch("TOO EARLY","ly","\"That feels a little early.\"","\"That is fair. What is missing before that review would feel worth it: req scope, evidence detail, or sponsor alignment?\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "pilot-req", "org"),
            jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"The buyer is not ready for the review yet.","You still need the missing condition."),
          branch("SEND SOMETHING","fl","\"Just send something first.\"","\"I can. What should it help your team decide so the follow-up becomes a working review instead of polite circulation?\"",[
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to what they need to see", "proof-threshold", "quality-bar", "blu")
          ],"They are trying to defer with no meeting.","You still need the decision the follow-up is supposed to support.")
        ]),
        node("next-step-lock","soft-deferral","pr","Ask what they need in order to decide","\"If I send material, what should it help the team answer before we meet again?\"","Use this when the buyer tries to end the call with a vague \"we'll follow up.\"",false,[
          branch("DECISION NAMED","ok","\"It should help us decide whether this req workflow is worth testing with recruiting ops and a hiring owner.\"","\"Good. Then let us name the req now so the follow-up justifies that meeting.\"",[
            jumpNode("Go back to the open role", "current-state-truth", "live-req", "grn"),
            jumpNode("Book a review meeting on one open role", "next-step-lock", "req-review", "blu")
          ],"The follow-up has a real decision attached to it.","You still need the req it is about."),
          branch("NO COMMITMENT","fl","\"I cannot commit to another meeting yet.\"","\"Understood. Then what would have to be true for a next meeting to be worth it?\"",[
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "freeze-check", "red"),
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "recruiting-ops", "blu")
          ],"There is no meeting commitment yet.","You still need the threshold for a real next step.")
        ]),
        node("next-step-lock","pilot-design","fu","Agree what a small test would include","\"If the review goes well, what is the smallest credible test: one req type, one team, and one clear standard for quality and speed?\"","Use this when they are already thinking beyond the first review.",false,[
          branch("PILOT CLEAR","ok","\"One priority req class with recruiting ops and one hiring team would be the right start.\"","\"Good. Then the first review should decide that scope, which decisions stay with a person, and how success is measured.\"",[
            jumpRoom("Save the scope to the deal in Deal Workspace", "deal-workspace", "grn"),
            action("Go to After the call", "segment:post-call-routing", "blu")
          ],"The pilot can now be shaped concretely.","You still need the meeting date and owner."),
          branch("NOT READY","fl","\"We are not ready to talk pilot shape yet.\"","\"Then the first review should stay diagnostic. What would make that review feel worth taking?\"",[
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "headcount-pressure", "red"),
            jumpNode("Go back to the open role", "current-state-truth", "live-req", "blu")
          ],"The buyer is not yet ready for pilot language.","You still need the condition that would justify it.")
        ])
      ]),
      segment("post-call-routing","10","After the call","Record what you learned and decide where it goes next.",false,[
        node("post-call-routing","room-route","sl","Record what you learned about the role","\"We have the hiring bottleneck, who owns what, what they need to see, and what the next review depends on. Take only those into the next step.\"","Use this once the review of one open role has a clear scope.",true,[
          branch("REQ READY","ok","\"Use Deal Workspace to shape the req review and pilot boundary.\"","\"Then add the open role, who owns what, what they need to see, and the goal of the review to the deal record now.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The open role is concrete enough to take to the next step.","You still need the date and attendee set if they are not locked."),
          branch("MEETING READY","ly","\"The next step is the review meeting for that open role.\"","\"Then carry the req, who must join, and what the review has to decide.\"",[
            action("Set the next meeting", "segment:next-step-lock", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The meeting design is the next priority.","You still need the review scope and evidence question."),
          branch("DRIFT RISK","fl","\"Use Future Autopsy if ownership or urgency is still too weak and this may stall.\"","\"Then note the missing sponsor, what's blocking the evidence, and the weak next step as reasons it could stall.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"There is a clear risk this stalls.","You still need the dominant drift reason.")
        ]),
        node("post-call-routing","autopsy-flag","pr","Record what could stall it","\"If this slips, what will probably cause it: low hiring volume, weak sponsor, quality anxiety, or no clear req in scope?\"","Use this when the opportunity is interesting but not yet justified.",false,[
          branch("SPONSOR SOFT","ok","\"The risk is a weak sponsor.\"","\"Then flag the missing sponsor and keep the next meeting built around one req and one decision.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"You can see the most likely reason this could stall.","You still need the sponsor trigger."),
          branch("SCOPE MISSING","fl","\"We still do not have a clear req in scope.\"","\"Then do not pretend the deal is real yet. Carry that as the main open question.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"You still don't know which open role to focus on.","You still need the first req candidate.")
        ])
      ])
    ]
  };
})();
