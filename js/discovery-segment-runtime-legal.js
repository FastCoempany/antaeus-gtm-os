(function(){
  var runtime = window.DISCOVERY_SEGMENT_RUNTIME;
  if(!runtime || !runtime.frameworks || !runtime.frameworks["legal"]) return;

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

  var base = runtime.frameworks["legal"];

  var supportDossier = [
    { title:"Matter burden", items:["Which matter type carries the most turnaround pressure right now", "Where partner, associate, or paralegal time is being spent on low-judgment work", "Human review requirements — where a person must stay in the loop by policy or preference"] },
    { title:"What they need to see", items:["Benchmark on a non-sensitive matter against their current output quality", "Evidence that wrong or made-up answers are caught, at a level their risk tolerance accepts", "How confidentiality, privilege, and data residency are handled at their size"] },
    { title:"Decision path", items:["GC or managing partner sponsor who feels the turnaround or cost pressure", "Legal ops or IT evaluator who runs the stack today (iManage, NetDocuments, Clio, Relativity)", "Security and compliance review if the data touches privileged content"] }
  ];
  var objectionLibrary = [
    { trigger:"AI cannot be trusted with legal work", reply:"Understood. That caution is right for some workflows and wrong for others. Which specific workflow are you picturing when you say that — drafting, review, research, or document management?" },
    { trigger:"our partners will never adopt this", reply:"That's worth knowing. The question is whether this makes associate and paralegal work better, which may or may not free up partner time. Where does partner time currently get wasted that shouldn't?" },
    { trigger:"billable-hour model makes this hard", reply:"It complicates it, but not always the way people assume. Are you billing hourly across all of this work, or is some of it on alternative fee arrangements where efficiency actually helps?" },
    { trigger:"send me a security document", reply:"Happy to. Which specific concern does it need to answer — privilege, data residency, retention, or model training — so I do not send a generic packet that misses the real question?" }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from Harvey or Clearbrief?", bridge:"Depends on which workflow is actually wasting the most time right now. Is the pain in drafting, review, research, or document management? The right tool depends on which of those it is." },
    { question:"Can you work with our DMS?", bridge:"In most cases yes. More useful: which DMS is it, and is the pain that documents are stuck there, or that the workflow around them is manual?" },
    { question:"What about hallucination?", bridge:"Real concern. What is your zero-tolerance line, and what is the workflow where draft-quality output is acceptable as a starting point? Those lines matter more than the general risk." }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing makes sense once we know whether a specific workflow is expensive enough to justify any change. Which matter type costs you most to run today?" },
    { trigger:"asks for demo too early", reply:"I can show it. First tell me which type of matter or workflow you want the demo to handle well — otherwise the demo becomes a feature tour instead of a test." },
    { trigger:"wants to route to IT", reply:"Happy to involve IT. Before that, which workflow or matter type is this supposed to help? IT will need that to evaluate fit, not just security." }
  ];

  runtime.frameworks["legal"] = {
    id:base.id,
    label:base.label,
    short:base.short,
    storageKey:base.storageKey,
    aliases:base.aliases,
    persona:"GC / legal ops",
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
        title:"Scope one painful workflow",
        copy:"Pick the contract, matter, or review path that still burns senior legal time.",
        action:jumpNode("Ask where legal review slows the work", "current-state-truth", "workflow-break", "blu")
      },
      {
        title:"Name the review burden",
        copy:"Make the pain concrete in lawyer time, cycle time, or outside counsel spend.",
        action:jumpNode("Ask about legal workload", "pain-and-consequence", "lawyer-time", "org")
      },
      {
        title:"Lock the GC review",
        copy:"Leave the call with legal ops, the GC, and one workflow path named.",
        action:jumpNode("Book a review meeting on one workflow", "next-step-lock", "scoped-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"hallucination-risk",
        label:"Hallucination risk is unacceptable",
        reply:"Agreed. The question is where help with drafts or faster review can work safely, with a person clearly in control.",
        actions:[
          jumpNode("Agree what they need to see", "proof-threshold", "accuracy-bar", "pur"),
          jumpNode("Ask where a person must review the output", "proof-threshold", "human-loop", "blu")
        ]
      },
      {
        id:"already-have-clm",
        label:"We already have CLM / DMS",
        reply:"I am not asking whether systems exist. I am asking where legal still carries repetitive review by hand.",
        actions:[
          jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "clm-stack", "blu"),
          jumpNode("Ask where legal review slows the work", "current-state-truth", "workflow-break", "org")
        ]
      },
      {
        id:"lawyers-wont-use-it",
        label:"Our lawyers will not use it",
        reply:"Then adoption is as important as the model. Which lawyers feel the pain today, and where would they reject the workflow first?",
        actions:[
          jumpNode("Find out who would resist using it, and why", "stakeholder-and-ownership", "adoption-politics", "org"),
          jumpNode("Pick a low-risk workflow to test first", "proof-threshold", "pilot-scope", "blu")
        ]
      },
      {
        id:"billable-hours",
        label:"Efficiency can hurt billable economics",
        reply:"That is real. Where would doing more with the same people improve client service or margin without threatening how the practice gets paid?",
        actions:[
          jumpNode("Ask who feels the cost, not just who has an opinion", "stakeholder-and-ownership", "economic-owner", "org"),
          jumpNode("Ask what outside counsel costs them", "pain-and-consequence", "outside-counsel-cost", "blu")
        ]
      },
      {
        id:"send-case-study",
        label:"Send a case study",
        reply:"I can. First tell me which workflow you would actually test so the follow-up answers a real internal question.",
        actions:[
          jumpNode("Pick the workflow to talk through", "current-state-truth", "workflow-break", "blu"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening","Ask where lawyers still spend time on repetitive review or drafting.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most legal teams already have systems in place. The question is where repetitive review or drafting still pulls expensive human time into work that should move faster. Is that true in your world too?\"","Use this when they're willing to talk through the problem before seeing the product.",true,[
          branch("CONFIRMS","ok","\"Yes. The systems exist, but lawyers still end up doing too much by hand.\"","\"Where does that happen most painfully: contract review, research, drafting, matter intake, or outside counsel overflow?\"",[
            jumpNode("Ask where legal review slows the work", "current-state-truth", "workflow-break", "blu"),
            jumpNode("Ask how much lawyer time this takes", "pain-and-consequence", "lawyer-time", "grn")
          ],"Manual legal burden is part of the current process.","You still need the exact workflow where it shows up first."),
          branch("RISK PUSHBACK","fl","\"Anything AI-related gets hard because hallucination risk is unacceptable.\"","\"That is fair. So where would a human-in-the-loop workflow still be worth testing if it were clear where a person reviews the output?\"",[
            jumpNode("Agree how accurate it has to be", "proof-threshold", "accuracy-bar", "pur"),
            jumpNode("Ask where a person must review the output", "proof-threshold", "human-loop", "blu")
          ],"Risk is the first objection, not the whole objection.","You still need the safest workflow boundary.")
        ]),
        node("opening-frame","workflow-scope","fu","Start from one workflow","\"Pick one workflow that still drags more than it should. Which path would the GC or legal ops owner fix first if they could?\"","Use this when the buyer already runs the workflow day to day.",false,[
          branch("WORKFLOW READY","ok","\"Commercial contracts and redlines are the obvious one.\"","\"What part of that workflow still burns the most expensive time: first pass, fallback review, turnaround, or approvals?\"",[
            jumpNode("Ask where the work breaks down", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Ask where legal delays show up for the business", "pain-and-consequence", "cycle-time", "blu")
          ],"The call is now focused on one concrete workflow.","You still need the specific friction inside it."),
          branch("NO CLEAR TARGET","fl","\"Nothing jumps out immediately.\"","\"Then use the last time legal became the bottleneck. What kind of work created the pressure?\"",[
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "gc-pressure", "red"),
            jumpNode("Ask where legal review slows the work", "current-state-truth", "workflow-break", "blu")
          ],"No priority workflow is named yet.","You still need a recent event that put pressure on legal.")
        ])
      ]),
      segment("current-state-truth","02","How they work today","Ask them to walk you through how a contract or matter moves today.",true,[
        node("current-state-truth","workflow-break","fu","Ask where legal review slows the work","\"Walk me through the workflow as it runs today. Where does human legal review still become the bottleneck: intake, drafting, redlines, research, approvals, or outside counsel overflow?\"","Start here when the workflow needs to get concrete.",true,[
          branch("BREAK CLEAR","ok","\"The first pass and fallback review still eat too much time.\"","\"What makes that review heavy today: lack of trust, too many exceptions, or no structured playbook?\"",[
            jumpNode("Ask how much lawyer time this takes", "pain-and-consequence", "lawyer-time", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "accuracy-bar", "blu")
          ],"They said where the work breaks down.","You still need the specific source of the burden."),
          branch("OUTSIDE COUNSEL","fl","\"The issue is overflow and outside counsel more than internal workflow.\"","\"What kind of work are you sending out that you wish could stay inside?\"",[
            jumpNode("Ask about outside counsel cost", "pain-and-consequence", "outside-counsel-cost", "red"),
            jumpNode("Ask what they rely on today and why", "current-vendor-and-displacement", "outside-counsel-status-quo", "blu")
          ],"Overflow is part of the current system.","You still need the type of matter driving it.")
        ]),
        node("current-state-truth","review-owner","pr","Ask who does the review work today","\"Who actually carries the painful part of the work today: partner, associate, paralegal, legal ops, or outside counsel?\"","Use this when the pain exists but ownership is fuzzy.",false,[
          branch("OWNER CLEAR","ok","\"Associates and legal ops carry most of it, but senior review still gets pulled in too often.\"","\"What work keeps escalating upward that should not need that level of human attention every time?\"",[
            jumpNode("Ask how much lawyer time this takes", "pain-and-consequence", "lawyer-time", "grn"),
            jumpNode("Find out who would resist using it, and why", "stakeholder-and-ownership", "adoption-politics", "blu")
          ],"You know who does which part of the work.","You still need the repeatable escalation pattern."),
          branch("GC INVOLVEMENT","fl","\"The GC still gets pulled into too much of it.\"","\"What makes that happen: risk sensitivity, no trust in the workflow, or bad escalation design?\"",[
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "gc-pressure", "org"),
            jumpNode("Agree what record of human oversight they need to see", "proof-threshold", "human-loop", "blu")
          ],"Senior legal attention is part of the burden.","You still need the cause of that escalation.")
        ])
      ]),
      segment("pain-and-consequence","03","The problem and its cost","Find out what slow or manual legal work costs them.",true,[
        node("pain-and-consequence","lawyer-time","ri","Ask how much lawyer time this takes","\"What is the actual damage today: expensive lawyer time burned on low-value work, slower turnaround to the business, or too much repetitive review for the same output?\"","Start here once you can see how much work is done by hand.",true,[
          branch("TIME LOSS CLEAR","ok","\"Senior legal time is going to work that should be handled lower in the stack or faster.\"","\"What does that crowd out: strategic work, client service, or overall throughput?\"",[
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "economic-owner", "grn"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "gc-pressure", "blu")
          ],"They said how much lawyer time this takes.","You still need the business consequence of it."),
          branch("NO BIG ISSUE","fl","\"It is annoying, but not catastrophic.\"","\"Then what has to happen before it becomes big enough to deserve change?\"",[
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Go back to outside counsel costs", "pain-and-consequence", "outside-counsel-cost", "blu")
          ],"The problem may not yet hurt enough to act on.","You still need the trigger.")
        ]),
        node("pain-and-consequence","cycle-time","pr","Ask where legal delays show up for the business","\"Where does legal delay become visible to the business or client today: contract turnaround, negotiation back-and-forth, matter intake, or internal approvals?\"","Use this when the pain is responsiveness as much as lawyer time.",false,[
          branch("TURNAROUND CLEAR","ok","\"Commercial contracts and redlines take too long and the business feels it.\"","\"How much of that delay is real legal judgment versus repetitive review or coordination drag?\"",[
            jumpNode("Go back to where the work breaks down", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Pick the workflow to test first", "proof-threshold", "pilot-scope", "blu")
          ],"The business feels the delays.","You still need the part automation or workflow structure could safely relieve."),
          branch("INTERNAL ONLY","fl","\"The business feels it less than the legal team does internally.\"","\"Then where does internal drag still show up in spend, workload, or missed attention on higher-value work?\"",[
            jumpNode("Go back to how much lawyer time this takes", "pain-and-consequence", "lawyer-time", "red"),
            jumpNode("Find out who would resist using it, and why", "stakeholder-and-ownership", "adoption-politics", "blu")
          ],"The consequence may be internal, not external.","You still need the cost of that internal drag.")
        ]),
        node("pain-and-consequence","outside-counsel-cost","fu","Ask what outside counsel costs them","\"Where does overflow or specialist review leave the building today, and what does that cost you in spend or lost control?\"","Use this when the pain shows up as budget and overflow.",false,[
          branch("SPEND CLEAR","ok","\"We send too much repetitive work out because the internal team cannot absorb it cleanly.\"","\"What kind of work should stay inside if the workflow were more controlled?\"",[
            jumpNode("Ask what they send to outside counsel today", "current-vendor-and-displacement", "outside-counsel-status-quo", "grn"),
            jumpNode("Book a review meeting on one workflow", "next-step-lock", "scoped-review", "blu")
          ],"Outside counsel spend is a real problem.","You still need the workflow class that drives it."),
          branch("NOT MATERIAL","fl","\"Outside counsel is not the main issue here.\"","\"Understood. Then stay with internal burden. Where is the repetitive work still slowing your own team down?\"",[
            jumpNode("Go back to how much lawyer time this takes", "pain-and-consequence", "lawyer-time", "red"),
            jumpNode("Go back to where the work breaks down", "current-state-truth", "workflow-break", "blu")
          ],"Spend is not the main problem.","You still need the internal burden that is.")
        ])
      ]),
      segment("trigger-and-urgency","04","Why now","Find out what changed that makes this worth solving now.",true,[
        node("trigger-and-urgency","gc-pressure","ri","Ask what the General Counsel cares about now","\"What changed that made this worth looking at now: visible delay, spend pressure, diligence load, hiring pressure, or executive expectation to modernize legal ops?\"","Start here when there is some urgency but it is not yet specific.",true,[
          branch("TRIGGER CLEAR","ok","\"The GC wants throughput up and spend down without adding headcount.\"","\"Which workflow would prove the case fastest if it moved safely?\"",[
            jumpNode("Pick the workflow to talk through", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "scoped-review", "blu")
          ],"Leadership is pushing on this.","You still need the workflow that can carry the review."),
          branch("NOTHING CHANGED","fl","\"Nothing has really changed yet.\"","\"Then what would have to happen before the GC treated this like a real priority?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Agree what they need to see", "proof-threshold", "pilot-scope", "blu")
          ],"There may be no trigger yet.","You still need the condition that would make it real.")
        ]),
        node("trigger-and-urgency","soft-trigger","fu","Ask whether anything makes this urgent","\"If this is still early, what would need to happen before this becomes a funded workflow review instead of general curiosity?\"","Use this when the buyer is interested but not yet committed.",false,[
          branch("TRIGGER NAMED","ok","\"If we could show a safe workflow with measurable turnaround improvement, it would get attention.\"","\"Good. Then let us define the safest workflow and what they need to see now.\"",[
            jumpNode("Pick the workflow to test first", "proof-threshold", "pilot-scope", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "scoped-review", "blu")
          ],"They named a clear point at which this becomes a priority.","You still need the exact workflow and review group."),
          branch("SPONSOR NEEDED","fl","\"We would need the GC or a partner to really care first.\"","\"Then who is most likely to care first, and what problem would they need to see clearly?\"",[
            jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "economic-owner", "red"),
            jumpNode("Ask what the problem costs them", "pain-and-consequence", "lawyer-time", "blu")
          ],"No real sponsor is active yet.","You still need the person and problem pairing.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Who's involved","Find out who would push for this and who could stop it.",true,[
        node("stakeholder-and-ownership","economic-owner","fu","Ask who feels the cost enough to act","\"Who actually feels the pain enough to move this: GC, legal ops, practice leadership, CFO pressure on outside counsel, or the business teams waiting on legal?\"","Start here when the workflow is clear but sponsorship is not.",true,[
          branch("OWNER CLEAR","ok","\"Legal ops will drive it, but the GC has to believe it is safe.\"","\"Good. Then whose question matters more first: workflow efficiency or risk control?\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "accuracy-bar", "grn"),
            jumpNode("Ask who can block this on risk", "stakeholder-and-ownership", "risk-owner", "blu")
          ],"You know who might sponsor this.","You still need the first gating question."),
          branch("NO SPONSOR","fl","\"No one fully owns this yet.\"","\"Then who would have to carry the first review to keep this moving after today?\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "scoped-review", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "soft-trigger", "blu")
          ],"Ownership is not yet assigned.","You still need a named person for the next meeting.")
        ]),
        node("stakeholder-and-ownership","adoption-politics","pr","Find out who would resist using it, and why","\"Who benefits if this works, and who is most likely to resist it: partners, associates, legal ops, paralegals, or the GC?\"","Use this when workflow pain exists but adoption may be the real blocker.",false,[
          branch("POLITICS CLEAR","ok","\"Associates and legal ops would benefit, but some senior lawyers will worry about trust and role erosion.\"","\"What would they need to see to believe this supports legal judgment instead of threatening it?\"",[
            jumpNode("Ask where a person must review the output", "proof-threshold", "human-loop", "grn"),
            jumpNode("Pick a low-risk workflow to test first", "proof-threshold", "pilot-scope", "blu")
          ],"You know who would push for it and who would resist it.","You still need the first trust bridge."),
          branch("LAW FIRM TENSION","fl","\"In a firm, anything that looks like efficiency can create weird economics.\"","\"Then where does efficiency help the practice anyway: client service, margin, staffing, or quality?\"",[
            jumpNode("Ask what they send to outside counsel today", "current-vendor-and-displacement", "outside-counsel-status-quo", "red"),
            jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "economic-owner", "blu")
          ],"Billable politics may be part of the blocker.","You still need the positive economic case.")
        ]),
        node("stakeholder-and-ownership","risk-owner","ri","Ask who can block this on risk","\"Who has veto power if trust or confidentiality gets shaky: GC, IT, security, privacy, or practice leadership?\"","Use this when what they need to see and who approves are likely to decide this.",false,[
          branch("RISK OWNER CLEAR","ok","\"The GC and IT both matter, but confidentiality and human review are the real questions.\"","\"Then let us define exactly where a person would need to review the output.\"",[
            jumpNode("Agree what record of human oversight they need to see", "proof-threshold", "human-loop", "grn"),
            jumpNode("Ask about the approval path", "decision-architecture", "approval-path", "blu")
          ],"You know who owns the controls.","You still need the approval sequence."),
          branch("UNCLEAR RISK OWNER","fl","\"It depends on the workflow and the data involved.\"","\"Then use the first workflow in scope. Who would have to approve that one?\"",[
            jumpNode("Go back to where legal review slows the work", "current-state-truth", "workflow-break", "red"),
            jumpNode("Ask about the approval path", "decision-architecture", "approval-path", "blu")
          ],"The veto path changes by workflow.","You still need the first scoped approval map.")
        ])
      ]),
      segment("proof-threshold","06","What they need to see","Agree on the accuracy and safeguards they would need to see.",true,[
        node("proof-threshold","accuracy-bar","pur","Agree how accurate it has to be","\"Before this could move, what would you have to trust: output quality, auditability, human control, data handling, or all of the above?\"","Start here when the buyer goes straight to risk and evidence.",true,[
          branch("QUALITY FIRST","ok","\"Accuracy and consistency are first. If those break, nothing else matters.\"","\"Then what is the fairest first workflow to test quality without exposing the highest-risk matters?\"",[
            jumpNode("Pick the workflow to test first", "proof-threshold", "pilot-scope", "grn"),
            jumpNode("Ask how the review works", "decision-architecture", "approval-path", "blu")
          ],"They said exactly what quality they need.","You still need the safest workflow to test against it."),
          branch("SHOW ROI","fl","\"Show me ROI first.\"","\"Fair. Which workflow would prove ROI fastest without making the trust question impossible?\"",[
            jumpNode("Pick the workflow to test first", "proof-threshold", "pilot-scope", "red"),
            jumpNode("Ask what the problem costs them", "pain-and-consequence", "lawyer-time", "blu")
          ],"The buyer is pushing to business case first.","You still need a safe ROI workflow.")
        ]),
        node("proof-threshold","human-loop","pr","Ask where a person must review the output","\"Where does the human need to stay in control for this to be acceptable: first draft, final review, issue spotting, escalation, or every sensitive matter?\"","Use this when trust depends on limiting what the AI is allowed to do.",false,[
          branch("BOUNDARY CLEAR","ok","\"A human can stay on final review, but the earlier repetitive work could move.\"","\"Good. Which workflow lets us prove that boundary cleanly?\"",[
            jumpNode("Pick the workflow to test first", "proof-threshold", "pilot-scope", "grn"),
            jumpNode("Book a review meeting on one workflow", "next-step-lock", "scoped-review", "blu")
          ],"They named which decisions must stay with a person.","You still need the workflow that proves it."),
          branch("EVERYTHING HUMAN","fl","\"For sensitive matters, a human has to touch almost everything.\"","\"Then which lower-risk workflow would still be worth testing without threatening that rule?\"",[
            jumpNode("Pick a low-risk workflow to test first", "proof-threshold", "pilot-scope", "red"),
            jumpNode("Go back to who does the review work", "current-state-truth", "review-owner", "blu")
          ],"High-risk matters may be out of scope.","You still need the lower-risk entry point.")
        ]),
        node("proof-threshold","pilot-scope","fu","Pick the workflow to test first","\"What is the safest meaningful workflow to test first: high-volume NDAs, commercial paper, employment docs, research support, or another repeatable path?\"","Use this when the buyer is open but needs a low-risk entry point.",false,[
          branch("SAFE PILOT CLEAR","ok","\"Commercial paper or NDAs would be the cleanest place to start.\"","\"Good. Then who needs to join the first scoped review so the pilot is real, not theoretical?\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "scoped-review", "grn"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "approval-path", "blu")
          ],"You have a possible workflow to pilot.","You still need the review group and date."),
          branch("NO SAFE PILOT","fl","\"Everything here feels too sensitive.\"","\"Then what nearby workflow is repetitive enough to test this without touching the highest-risk matters?\"",[
            jumpNode("Go back to where the work breaks down", "current-state-truth", "workflow-break", "red"),
            jumpNode("Go back to the tools they use today", "current-vendor-and-displacement", "clm-stack", "blu")
          ],"The buyer does not yet see a safe entry point.","You still need an adjacent lower-risk workflow.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor","Find out what they use today and why it has lasted.",true,[
        node("current-vendor-and-displacement","clm-stack","fu","Ask what tools they use today","\"What is already in place today: CLM, DMS, document review, research tools, practice management, or internal workflows that people still work around?\"","Start here when the buyer defends current systems.",true,[
          branch("STACK CLEAR","ok","\"The stack exists, but it still does not remove the repetitive review burden.\"","\"Which part of the stack stops short first: drafting help, redlines, routing, search, or playbook use?\"",[
            jumpNode("Go back to where the work breaks down", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "accuracy-bar", "blu")
          ],"Having the tools hasn't made the work easier.","You still need the first failing layer in the stack."),
          branch("INTERNAL BUILD","fl","\"We are trying to build around this ourselves.\"","\"What part of the build is actually hardest: workflow design, legal trust, or getting lawyers to use it?\"",[
            jumpNode("Find out who would resist using it, and why", "stakeholder-and-ownership", "adoption-politics", "red"),
            jumpNode("Agree what they need to see", "proof-threshold", "human-loop", "blu")
          ],"Internal build is a real competing path.","You still need the weakest point in that path.")
        ]),
        node("current-vendor-and-displacement","outside-counsel-status-quo","pr","Ask what they send to outside counsel today","\"Where does the current status quo feel safest even if it is expensive: specialist review, overflow, risk sensitivity, or just habit?\"","Use this when the buyer frames outside counsel as necessary.",false,[
          branch("SAFETY DEFENSE","ok","\"It is expensive, but we trust the outside lawyers more on certain work.\"","\"Which part of that work is true legal judgment and which part is repetitive preparation around it?\"",[
            jumpNode("Ask where a person must review the output", "proof-threshold", "human-loop", "grn"),
            jumpNode("Go back to where the work breaks down", "current-state-truth", "workflow-break", "blu")
          ],"Trust in the status quo is part of the blocker.","You still need the line between judgment and repetitive work."),
          branch("OVERFLOW ONLY","fl","\"Mostly it would free up time so the team can handle more work.\"","\"What would need to change internally for that overflow to stay inside?\"",[
            jumpNode("Go back to how much lawyer time this takes", "pain-and-consequence", "lawyer-time", "red"),
            jumpNode("Agree what a small pilot would include", "next-step-lock", "pilot-design", "blu")
          ],"Capacity pressure is the main issue.","You still need the operating change that would reduce overflow.")
        ])
      ]),
      segment("decision-architecture","08","How they'll decide","Find out who signs off and in what order.",true,[
        node("decision-architecture","approval-path","fu","Ask who approves this, in what order","\"If this became real, what would the review path actually look like from first workflow test to approval?\"","Start here once they are getting specific about what they need to see.",true,[
          branch("PATH CLEAR","ok","\"Legal ops would scope it, the GC would sponsor it, and IT/security would review before anything expanded.\"","\"Good. What would the first review need to decide so the process can continue?\"",[
            jumpNode("Book a review meeting on one workflow", "next-step-lock", "scoped-review", "grn"),
            jumpNode("Agree what a small pilot would include", "next-step-lock", "pilot-design", "blu")
          ],"You know who approves this and in what order.","You still need the first review outcome."),
          branch("MURKY PATH","fl","\"Honestly, we have not mapped that yet.\"","\"That is fine. Then the next step should probably be the people who can map it together around one workflow.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "scoped-review", "red"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "economic-owner", "blu")
          ],"It is still unclear how they would decide.","You still need the minimum viable review group.")
        ]),
        node("decision-architecture","security-privilege","pr","Ask about confidentiality and privilege review","\"What security, privacy, privilege, or residency questions would need to be answered before legal would let a workflow move forward?\"","Use this when the buyer keeps coming back to trust and control.",false,[
          branch("CONTROL QUESTIONS CLEAR","ok","\"Privilege, data handling, and human review are the real hurdles.\"","\"Good. Then the next review has to include whoever can answer those with the GC and legal ops owner present.\"",[
            jumpNode("Agree who attends the review meeting", "next-step-lock", "scoped-review", "grn"),
            jumpNode("Agree what record of human oversight they need to see", "proof-threshold", "human-loop", "blu")
          ],"The real blockers are now named.","You still need the meeting that can answer them."),
          branch("IT FIRST","fl","\"IT and security would slow this down before legal even got comfortable.\"","\"Then which workflow is narrow enough that those teams could evaluate it without broad architectural fear?\"",[
            jumpNode("Pick one small workflow to test first", "proof-threshold", "pilot-scope", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "soft-trigger", "blu")
          ],"Technical review may matter more than what the team wants.","You still need a scope that can pass that review.")
        ])
      ]),
      segment("next-step-lock","09","Next step","Leave with a dated review meeting and a named owner.",true,[
        node("next-step-lock","scoped-review","gr","Book a review meeting on one workflow","\"The next step should probably be a working review with legal ops, the GC or sponsor, and one workflow in scope. Does that sound right?\"","Start here when the workflow and owner are named.",true,[
          branch("AGREES","ok","\"Yes. That makes sense.\"","\"Good. Which workflow should that review center on, and who needs to be in it so the meeting can actually decide something?\"",[
            jumpNode("Agree what a small pilot would include", "next-step-lock", "pilot-design", "grn"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"A real review is now possible.","You still need the attendee set, workflow, and date."),
          branch("SEND SOMETHING","fl","\"Just send something first.\"","\"I can. What should it help your team decide so the follow-up becomes a working review instead of polite circulation?\"",[
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to what they need to see", "proof-threshold", "accuracy-bar", "blu")
          ],"They are trying to defer with no meeting.","You still need the decision the follow-up is supposed to support.")
        ]),
        node("next-step-lock","soft-deferral","pr","Ask what they need in order to decide","\"If I send material, what should it help the team answer before we meet again?\"","Use this when the buyer tries to end the call with a vague \"we'll follow up.\"",false,[
          branch("DECISION NAMED","ok","\"It should help us decide whether this workflow is worth testing with the GC and legal ops.\"","\"Good. Then let us name the workflow now so the follow-up justifies that meeting.\"",[
            jumpNode("Go back to where legal review slows the work", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "scoped-review", "blu")
          ],"The follow-up has a real decision attached to it.","You still need the workflow it is about."),
          branch("NO COMMITMENT","fl","\"I cannot commit to another meeting yet.\"","\"Understood. Then what would have to be true for a next meeting to be worth it?\"",[
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "economic-owner", "blu")
          ],"There is no meeting commitment yet.","You still need the threshold for a real next step.")
        ]),
        node("next-step-lock","pilot-design","fu","Agree what a small pilot would include","\"If the review goes well, what would the smallest credible pilot look like: one workflow, one team, one type of matter, and a clear point where a person reviews the output?\"","Use this when the buyer is already thinking beyond the first review.",false,[
          branch("PILOT SHAPE CLEAR","ok","\"Yes. We would start with one contract path and keep human review explicit.\"","\"Good. Then the first review should decide that scope, which decisions stay with a person, and how success is measured.\"",[
            jumpRoom("Save the scope to the deal in Deal Workspace", "deal-workspace", "grn"),
            action("Go to After the call", "segment:post-call-routing", "blu")
          ],"The pilot can now be shaped concretely.","You still need the meeting date and owner."),
          branch("NOT READY","fl","\"We are not ready to talk pilot shape yet.\"","\"Then the first review should stay diagnostic. What would make that review feel worth taking?\"",[
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Go back to where the work breaks down", "current-state-truth", "workflow-break", "blu")
          ],"The buyer is not yet ready for pilot language.","You still need the condition that would justify it.")
        ])
      ]),
      segment("post-call-routing","10","After the call","Record what you learned and decide where it goes next.",false,[
        node("post-call-routing","room-route","sl","Record the workflow and next review","\"We have the workflow problem, who owns what, what they need to see, and what the next review depends on. Take only those into the next step.\"","Use this once the legal review has a clear scope.",true,[
          branch("WORKFLOW READY","ok","\"Use Deal Workspace to shape the scoped review and pilot boundary.\"","\"Then add the workflow, who owns what, what they need to see, and the goal of the review to the deal record now.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The workflow is concrete enough to take to the next step.","You still need the date and attendee set if they are not locked."),
          branch("DRIFT RISK","fl","\"Use Future Autopsy if trust or ownership is still too weak and this is likely to stall.\"","\"Then note the missing sponsor, what's blocking the evidence, and the weak next step as reasons it could stall.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"There is a clear risk this stalls.","You still need the dominant drift reason.")
        ]),
        node("post-call-routing","call-plan","pr","Record the meeting plan","\"If the next step is a review, what does that review have to accomplish so this does not turn into another polite legal-tech meeting?\"","Use this when another meeting is the right next step.",false,[
          branch("REVIEW CLEAR","ok","\"It needs to decide the workflow, where a person reviews the output, and whether a pilot is worth scoping.\"","\"Good. Those three decisions are what to record and carry forward.\"",[
            action("Set the next meeting", "segment:next-step-lock", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The next meeting already has a job.","You still need the right attendees and date."),
          branch("TOO SOFT","fl","\"We are not there yet.\"","\"Then write down the weak spots honestly so no one later assumes this is further along than it is.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The opportunity is still fragile.","You still need the missing owner or trigger.")
        ])
      ])
    ]
  };
})();
