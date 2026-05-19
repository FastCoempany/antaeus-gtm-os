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
    { title:"Proof burden", items:["Benchmark on a non-sensitive matter against their current output quality", "Evidence of hallucination risk mitigation at a level their risk posture accepts", "Confidentiality, privilege, and data-residency story at their specific scale"] },
    { title:"Decision path", items:["GC or managing partner sponsor who feels the turnaround or cost pressure", "Legal ops or IT evaluator who runs the stack today (iManage, NetDocuments, Clio, Relativity)", "Security and compliance review if the data touches privileged content"] }
  ];
  var objectionLibrary = [
    { trigger:"AI cannot be trusted with legal work", reply:"Understood. That posture is correct for some workflows and wrong for others. Which specific workflow are you picturing when you say that — drafting, review, research, or document management?" },
    { trigger:"our partners will never adopt this", reply:"Fair signal. The question is whether this makes the associate and paralegal work better, which either frees the partner or doesn't. Where does partner time currently get wasted that shouldn't?" },
    { trigger:"billable-hour model makes this hard", reply:"It complicates it, but not always the way people assume. Are you billing hourly across all of this work, or is some of it on alternative fee arrangements where efficiency actually helps?" },
    { trigger:"send me a security document", reply:"Happy to. Which specific concern does it need to answer — privilege, data residency, retention, or model training — so I do not send a generic packet that misses the real question?" }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from Harvey or Clearbrief?", bridge:"Depends on which workflow is actually bleeding time right now. Is the pain in drafting, review, research, or document management? The best tool differs per lane." },
    { question:"Can you work with our DMS?", bridge:"In most cases yes. More useful: which DMS is it, and is the pain that documents are stuck there, or that the workflow around them is manual?" },
    { question:"What about hallucination?", bridge:"Real concern. What is your zero-tolerance line, and what is the workflow where draft-quality output is acceptable as a starting point? Those lines matter more than the general risk." }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing makes sense once we know whether a specific workflow is expensive enough to justify any change. Which matter type costs you most to run today?" },
    { trigger:"asks for demo too early", reply:"I can show it. First tell me which matter or workflow you would want the demo to survive — otherwise the demo becomes a feature tour instead of a test." },
    { trigger:"wants to route to IT", reply:"Happy to involve IT. Before that, which workflow or matter type is this supposed to help? IT will need that to evaluate fit, not just security posture." }
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
        action:jumpNode("Open workflow scope", "current-state-truth", "workflow-break", "blu")
      },
      {
        title:"Name the review burden",
        copy:"Make the pain concrete in lawyer time, cycle time, or outside counsel spend.",
        action:jumpNode("Open legal pain", "pain-and-consequence", "lawyer-time", "org")
      },
      {
        title:"Lock the GC review",
        copy:"Leave the call with legal ops, the GC, and one workflow path named.",
        action:jumpNode("Lock scoped review", "next-step-lock", "scoped-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"hallucination-risk",
        label:"Hallucination risk is unacceptable",
        reply:"Agreed. The question is where draft support or review acceleration can move safely under explicit human control.",
        actions:[
          jumpNode("Set the proof bar", "proof-threshold", "accuracy-bar", "pur"),
          jumpNode("Map the human loop", "proof-threshold", "human-loop", "blu")
        ]
      },
      {
        id:"already-have-clm",
        label:"We already have CLM / DMS",
        reply:"I am not asking whether systems exist. I am asking where legal still carries repetitive review by hand.",
        actions:[
          jumpNode("Inspect the current stack", "current-vendor-and-displacement", "clm-stack", "blu"),
          jumpNode("Scope the workflow", "current-state-truth", "workflow-break", "org")
        ]
      },
      {
        id:"lawyers-wont-use-it",
        label:"Our lawyers will not use it",
        reply:"Then adoption is as important as the model. Which lawyers feel the pain today, and where would they reject the workflow first?",
        actions:[
          jumpNode("Map adoption politics", "stakeholder-and-ownership", "adoption-politics", "org"),
          jumpNode("Choose a safe pilot", "proof-threshold", "pilot-scope", "blu")
        ]
      },
      {
        id:"billable-hours",
        label:"Efficiency can hurt billable economics",
        reply:"That is real. Where does leverage improve client service or margin without threatening how the practice gets paid?",
        actions:[
          jumpNode("Separate pain from politics", "stakeholder-and-ownership", "economic-owner", "org"),
          jumpNode("Name the outside counsel cost", "pain-and-consequence", "outside-counsel-cost", "blu")
        ]
      },
      {
        id:"send-case-study",
        label:"Send a case study",
        reply:"I can. First tell me which workflow you would actually test so the follow-up answers a real internal question.",
        actions:[
          jumpNode("Pick the workflow", "current-state-truth", "workflow-break", "blu"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening frame","Start on repetitive legal burden.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most legal teams already have systems in place. The question is where repetitive review or drafting still pulls expensive human time into work that should move faster. Is that true in your world too?\"","Use this when they will diagnose before seeing product.",true,[
          branch("CONFIRMS","ok","\"Yes. The systems exist, but lawyers still end up doing too much by hand.\"","\"Where does that happen most painfully: contract review, research, drafting, matter intake, or outside counsel overflow?\"",[
            jumpNode("Scope the workflow", "current-state-truth", "workflow-break", "blu"),
            jumpNode("Name the burden", "pain-and-consequence", "lawyer-time", "grn")
          ],"Manual legal burden is part of the current motion.","You still need the exact workflow where it shows up first."),
          branch("RISK PUSHBACK","fl","\"Anything AI-related gets hard because hallucination risk is unacceptable.\"","\"That is fair. So where would a human-in-the-loop workflow still be worth testing if the control path were explicit?\"",[
            jumpNode("Set the accuracy bar", "proof-threshold", "accuracy-bar", "pur"),
            jumpNode("Map the human loop", "proof-threshold", "human-loop", "blu")
          ],"Risk is the first objection, not the whole objection.","You still need the safest workflow boundary.")
        ]),
        node("opening-frame","workflow-scope","fu","Start from one workflow","\"Pick one workflow that still drags more than it should. Which path would the GC or legal ops owner fix first if they could?\"","Use this when the room is already operational.",false,[
          branch("WORKFLOW READY","ok","\"Commercial contracts and redlines are the obvious one.\"","\"What part of that workflow still burns the most expensive time: first pass, fallback review, turnaround, or approvals?\"",[
            jumpNode("Map the workflow break", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Name the cycle-time pain", "pain-and-consequence", "cycle-time", "blu")
          ],"A concrete workflow is now anchoring the call.","You still need the specific friction inside it."),
          branch("NO CLEAR TARGET","fl","\"Nothing jumps out immediately.\"","\"Then use the last time legal became the bottleneck. What kind of work created the pressure?\"",[
            jumpNode("Find the trigger", "trigger-and-urgency", "gc-pressure", "red"),
            jumpNode("Scope the workflow", "current-state-truth", "workflow-break", "blu")
          ],"No priority workflow is named yet.","You still need a live legal pressure event.")
        ])
      ]),
      segment("current-state-truth","02","Current-state truth","Map the actual legal workflow.",true,[
        node("current-state-truth","workflow-break","fu","Scope the workflow break","\"Walk me through the workflow as it runs today. Where does human legal review still become the bottleneck: intake, drafting, redlines, research, approvals, or outside counsel overflow?\"","Start here when the workflow needs to get concrete.",true,[
          branch("BREAK CLEAR","ok","\"The first pass and fallback review still eat too much time.\"","\"What makes that review heavy today: lack of trust, too many exceptions, or no structured playbook?\"",[
            jumpNode("Name the lawyer burden", "pain-and-consequence", "lawyer-time", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "accuracy-bar", "blu")
          ],"The workflow break is now explicit.","You still need the specific source of the burden."),
          branch("OUTSIDE COUNSEL","fl","\"The issue is overflow and outside counsel more than internal workflow.\"","\"What kind of work are you sending out that you wish could stay inside?\"",[
            jumpNode("Open outside counsel cost", "pain-and-consequence", "outside-counsel-cost", "red"),
            jumpNode("Inspect the status quo", "current-vendor-and-displacement", "outside-counsel-status-quo", "blu")
          ],"Overflow is part of the current system.","You still need the matter class driving it.")
        ]),
        node("current-state-truth","review-owner","pr","Map the review owner","\"Who actually carries the painful part of the work today: partner, associate, paralegal, legal ops, or outside counsel?\"","Use this when the pain exists but ownership is fuzzy.",false,[
          branch("OWNER CLEAR","ok","\"Associates and legal ops carry most of it, but senior review still gets pulled in too often.\"","\"What work keeps escalating upward that should not need that level of human attention every time?\"",[
            jumpNode("Name the lawyer burden", "pain-and-consequence", "lawyer-time", "grn"),
            jumpNode("Map the political owner", "stakeholder-and-ownership", "adoption-politics", "blu")
          ],"The labor distribution is visible.","You still need the repeatable escalation pattern."),
          branch("GC INVOLVEMENT","fl","\"The GC still gets pulled into too much of it.\"","\"What makes that happen: risk sensitivity, no trust in the workflow, or bad escalation design?\"",[
            jumpNode("Name the trigger", "trigger-and-urgency", "gc-pressure", "org"),
            jumpNode("Set the control proof", "proof-threshold", "human-loop", "blu")
          ],"Senior legal attention is part of the burden.","You still need the cause of that escalation.")
        ])
      ]),
      segment("pain-and-consequence","03","Pain and consequence","Make legal friction expensive.",true,[
        node("pain-and-consequence","lawyer-time","ri","Name the lawyer burden","\"What is the actual damage today: expensive lawyer time burned on low-value work, slower turnaround to the business, or too much repetitive review for the same output?\"","Start here when manual burden is visible.",true,[
          branch("TIME LOSS CLEAR","ok","\"Senior legal time is going to work that should be handled lower in the stack or faster.\"","\"What does that crowd out: strategic work, client service, or overall throughput?\"",[
            jumpNode("Find who feels it", "stakeholder-and-ownership", "economic-owner", "grn"),
            jumpNode("Quantify the urgency", "trigger-and-urgency", "gc-pressure", "blu")
          ],"Lawyer time loss is now explicit.","You still need the business consequence of it."),
          branch("NO BIG ISSUE","fl","\"It is annoying, but not catastrophic.\"","\"Then what has to happen before it becomes big enough to deserve change?\"",[
            jumpNode("Test the trigger", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Return to outside counsel cost", "pain-and-consequence", "outside-counsel-cost", "blu")
          ],"The pain may still be below the action threshold.","You still need the forcing event.")
        ]),
        node("pain-and-consequence","cycle-time","pr","Name the cycle-time drag","\"Where does legal delay become visible to the business or client today: contract turnaround, negotiation back-and-forth, matter intake, or internal approvals?\"","Use this when the pain is responsiveness as much as lawyer time.",false,[
          branch("TURNAROUND CLEAR","ok","\"Commercial contracts and redlines take too long and the business feels it.\"","\"How much of that delay is real legal judgment versus repetitive review or coordination drag?\"",[
            jumpNode("Return to workflow break", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Choose the pilot scope", "proof-threshold", "pilot-scope", "blu")
          ],"Business-facing delay is visible.","You still need the part automation or workflow structure could safely relieve."),
          branch("INTERNAL ONLY","fl","\"The business feels it less than the legal team does internally.\"","\"Then where does internal drag still show up in spend, workload, or missed attention on higher-value work?\"",[
            jumpNode("Return to lawyer burden", "pain-and-consequence", "lawyer-time", "red"),
            jumpNode("Find the political owner", "stakeholder-and-ownership", "adoption-politics", "blu")
          ],"The consequence may be internal, not external.","You still need the cost of that internal drag.")
        ]),
        node("pain-and-consequence","outside-counsel-cost","fu","Name outside counsel cost","\"Where does overflow or specialist review leave the building today, and what does that cost you in spend or lost control?\"","Use this when the pain shows up as budget and overflow.",false,[
          branch("SPEND CLEAR","ok","\"We send too much repetitive work out because the internal team cannot absorb it cleanly.\"","\"What kind of work should stay inside if the workflow were more controlled?\"",[
            jumpNode("Inspect outside counsel status quo", "current-vendor-and-displacement", "outside-counsel-status-quo", "grn"),
            jumpNode("Lock the scoped review", "next-step-lock", "scoped-review", "blu")
          ],"Outside counsel spend is a real scope.","You still need the workflow class that drives it."),
          branch("NOT MATERIAL","fl","\"Outside counsel is not the main issue here.\"","\"Understood. Then stay with internal burden. Where is the repetitive work still slowing your own team down?\"",[
            jumpNode("Return to lawyer burden", "pain-and-consequence", "lawyer-time", "red"),
            jumpNode("Return to workflow break", "current-state-truth", "workflow-break", "blu")
          ],"Spend is not the primary scope.","You still need the internal burden that is.")
        ])
      ]),
      segment("trigger-and-urgency","04","Trigger and urgency","Find the forcing event.",true,[
        node("trigger-and-urgency","gc-pressure","ri","Find the GC pressure","\"What changed that made this worth looking at now: visible delay, spend pressure, diligence load, hiring pressure, or executive expectation to modernize legal ops?\"","Start here when there is some urgency but it is not yet specific.",true,[
          branch("PRESSURE CLEAR","ok","\"The GC wants throughput up and spend down without adding headcount.\"","\"Which workflow would prove the case fastest if it moved safely?\"",[
            jumpNode("Choose the workflow", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Lock the review", "next-step-lock", "scoped-review", "blu")
          ],"The executive pressure is now visible.","You still need the workflow that can carry the review."),
          branch("NO PRESSURE","fl","\"Nothing has really changed yet.\"","\"Then what would have to happen before the GC treated this like a real priority?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Set the proof bar", "proof-threshold", "pilot-scope", "blu")
          ],"There may be no forcing event yet.","You still need the condition that would make it real.")
        ]),
        node("trigger-and-urgency","soft-trigger","fu","Keep soft urgency honest","\"If this is still early, what would need to happen before this becomes a funded workflow review instead of general curiosity?\"","Use this when the buyer is interested but not yet committed.",false,[
          branch("TRIGGER NAMED","ok","\"If we could show a safe workflow with measurable turnaround improvement, it would get attention.\"","\"Good. Then let us define the safest workflow and the proof bar now.\"",[
            jumpNode("Choose the pilot", "proof-threshold", "pilot-scope", "grn"),
            jumpNode("Lock the review", "next-step-lock", "scoped-review", "blu")
          ],"A usable threshold has been named.","You still need the exact workflow and review group."),
          branch("SPONSOR NEEDED","fl","\"We would need the GC or a partner to really care first.\"","\"Then who is most likely to care first, and what problem would they need to see clearly?\"",[
            jumpNode("Find the sponsor", "stakeholder-and-ownership", "economic-owner", "red"),
            jumpNode("Name the pain", "pain-and-consequence", "lawyer-time", "blu")
          ],"No real sponsor is active yet.","You still need the person and problem pairing.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Stakeholder and ownership","Map who can carry or kill it.",true,[
        node("stakeholder-and-ownership","economic-owner","fu","Find the economic owner","\"Who actually feels the pain enough to move this: GC, legal ops, practice leadership, CFO pressure on outside counsel, or the business teams waiting on legal?\"","Start here when the workflow is clear but sponsorship is not.",true,[
          branch("OWNER CLEAR","ok","\"Legal ops will drive it, but the GC has to believe it is safe.\"","\"Good. Then whose question matters more first: workflow efficiency or risk control?\"",[
            jumpNode("Set the proof bar", "proof-threshold", "accuracy-bar", "grn"),
            jumpNode("Map the risk owner", "stakeholder-and-ownership", "risk-owner", "blu")
          ],"A sponsor path is visible.","You still need the first gating question."),
          branch("NO SPONSOR","fl","\"No one fully owns this yet.\"","\"Then who would have to carry the first review for this not to die after today?\"",[
            jumpNode("Lock the review", "next-step-lock", "scoped-review", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "soft-trigger", "blu")
          ],"Ownership is not yet assigned.","You still need a named person for the next meeting.")
        ]),
        node("stakeholder-and-ownership","adoption-politics","pr","Map the adoption politics","\"Who benefits if this works, and who is most likely to resist it: partners, associates, legal ops, paralegals, or the GC?\"","Use this when workflow pain exists but adoption may be the real blocker.",false,[
          branch("POLITICS CLEAR","ok","\"Associates and legal ops would benefit, but some senior lawyers will worry about trust and role erosion.\"","\"What would they need to see to believe this supports legal judgment instead of threatening it?\"",[
            jumpNode("Map the human loop", "proof-threshold", "human-loop", "grn"),
            jumpNode("Choose a safe pilot", "proof-threshold", "pilot-scope", "blu")
          ],"Adoption politics are now visible.","You still need the first trust bridge."),
          branch("LAW FIRM TENSION","fl","\"In a firm, anything that looks like efficiency can create weird economics.\"","\"Then where does efficiency help the practice anyway: client service, margin, staffing, or quality?\"",[
            jumpNode("Separate economics", "current-vendor-and-displacement", "outside-counsel-status-quo", "red"),
            jumpNode("Find the sponsor", "stakeholder-and-ownership", "economic-owner", "blu")
          ],"Billable politics may be part of the blocker.","You still need the positive economic case.")
        ]),
        node("stakeholder-and-ownership","risk-owner","ri","Find the risk owner","\"Who has veto power if trust or confidentiality gets shaky: GC, IT, security, privacy, or practice leadership?\"","Use this when proof and approval are likely to dominate.",false,[
          branch("RISK OWNER CLEAR","ok","\"The GC and IT both matter, but confidentiality and human review are the real questions.\"","\"Then let us define the exact control path they would need to see.\"",[
            jumpNode("Set the control proof", "proof-threshold", "human-loop", "grn"),
            jumpNode("Open approval path", "decision-architecture", "approval-path", "blu")
          ],"The control owner is visible.","You still need the approval sequence."),
          branch("UNCLEAR RISK OWNER","fl","\"It depends on the workflow and the data involved.\"","\"Then use the first workflow in scope. Who would have to approve that one?\"",[
            jumpNode("Return to workflow scope", "current-state-truth", "workflow-break", "red"),
            jumpNode("Open approval path", "decision-architecture", "approval-path", "blu")
          ],"The veto path changes by workflow.","You still need the first scoped approval map.")
        ])
      ]),
      segment("proof-threshold","06","Proof threshold","Define the trust bar.",true,[
        node("proof-threshold","accuracy-bar","pur","Set the accuracy bar","\"Before this could move, what would you have to trust: output quality, auditability, human control, data handling, or all of the above?\"","Start here when the buyer goes straight to risk and proof.",true,[
          branch("QUALITY FIRST","ok","\"Accuracy and consistency are first. If those break, nothing else matters.\"","\"Then what is the fairest first workflow to test quality without exposing the highest-risk matters?\"",[
            jumpNode("Choose the pilot", "proof-threshold", "pilot-scope", "grn"),
            jumpNode("Open the review path", "decision-architecture", "approval-path", "blu")
          ],"The quality bar is explicit.","You still need the safest workflow to test against it."),
          branch("SHOW ROI","fl","\"Show me ROI first.\"","\"Fair. Which workflow would prove ROI fastest without making the trust question impossible?\"",[
            jumpNode("Choose the pilot", "proof-threshold", "pilot-scope", "red"),
            jumpNode("Name the pain", "pain-and-consequence", "lawyer-time", "blu")
          ],"The buyer is pushing to business case first.","You still need a safe ROI workflow.")
        ]),
        node("proof-threshold","human-loop","pr","Map the human loop","\"Where does the human need to stay in control for this to be acceptable: first draft, final review, issue spotting, escalation, or every sensitive matter?\"","Use this when trust depends on workflow boundaries.",false,[
          branch("BOUNDARY CLEAR","ok","\"A human can stay on final review, but the earlier repetitive work could move.\"","\"Good. Which workflow lets us prove that boundary cleanly?\"",[
            jumpNode("Choose the pilot", "proof-threshold", "pilot-scope", "grn"),
            jumpNode("Lock the scoped review", "next-step-lock", "scoped-review", "blu")
          ],"A safe control boundary is visible.","You still need the workflow that proves it."),
          branch("EVERYTHING HUMAN","fl","\"For sensitive matters, a human has to touch almost everything.\"","\"Then which lower-risk workflow would still be worth testing without threatening that rule?\"",[
            jumpNode("Choose the safest pilot", "proof-threshold", "pilot-scope", "red"),
            jumpNode("Return to review owner", "current-state-truth", "review-owner", "blu")
          ],"High-risk matters may be out of scope.","You still need the lower-risk entry point.")
        ]),
        node("proof-threshold","pilot-scope","fu","Choose the pilot scope","\"What is the safest meaningful workflow to test first: high-volume NDAs, commercial paper, employment docs, research support, or another repeatable path?\"","Use this when the buyer is open but needs a low-risk entry point.",false,[
          branch("SAFE PILOT CLEAR","ok","\"Commercial paper or NDAs would be the cleanest place to start.\"","\"Good. Then who needs to join the first scoped review so the pilot is real, not theoretical?\"",[
            jumpNode("Lock the review", "next-step-lock", "scoped-review", "grn"),
            jumpNode("Map the approval path", "decision-architecture", "approval-path", "blu")
          ],"A pilot candidate is now visible.","You still need the review group and date."),
          branch("NO SAFE PILOT","fl","\"Everything here feels too sensitive.\"","\"Then what adjacent workflow is repetitive enough to test the operating model without touching the highest-risk matters?\"",[
            jumpNode("Return to workflow break", "current-state-truth", "workflow-break", "red"),
            jumpNode("Return to current stack", "current-vendor-and-displacement", "clm-stack", "blu")
          ],"The buyer does not yet see a safe entry point.","You still need an adjacent lower-risk workflow.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor and displacement","Map the status quo to replace.",true,[
        node("current-vendor-and-displacement","clm-stack","fu","Inspect the current stack","\"What is already in place today: CLM, DMS, document review, research tools, practice management, or internal workflows that people still work around?\"","Start here when the buyer defends current systems.",true,[
          branch("STACK CLEAR","ok","\"The stack exists, but it still does not remove the repetitive review burden.\"","\"Which part of the stack stops short first: drafting help, redlines, routing, search, or playbook use?\"",[
            jumpNode("Return to workflow break", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "accuracy-bar", "blu")
          ],"System presence is not equal to workflow relief.","You still need the first failing layer in the stack."),
          branch("INTERNAL BUILD","fl","\"We are trying to build around this ourselves.\"","\"What part of the build is actually hardest: workflow design, legal trust, or getting lawyers to use it?\"",[
            jumpNode("Map adoption politics", "stakeholder-and-ownership", "adoption-politics", "red"),
            jumpNode("Set the proof bar", "proof-threshold", "human-loop", "blu")
          ],"Internal build is a real competing path.","You still need the weakest point in that path.")
        ]),
        node("current-vendor-and-displacement","outside-counsel-status-quo","pr","Inspect outside counsel status quo","\"Where does the current status quo feel safest even if it is expensive: specialist review, overflow, risk sensitivity, or just habit?\"","Use this when the buyer frames outside counsel as necessary.",false,[
          branch("SAFETY DEFENSE","ok","\"It is expensive, but we trust the outside lawyers more on certain work.\"","\"Which part of that work is true legal judgment and which part is repetitive preparation around it?\"",[
            jumpNode("Map the human loop", "proof-threshold", "human-loop", "grn"),
            jumpNode("Return to workflow break", "current-state-truth", "workflow-break", "blu")
          ],"Trust in the status quo is part of the blocker.","You still need the line between judgment and repetitive work."),
          branch("OVERFLOW ONLY","fl","\"It is mainly a capacity release valve.\"","\"What would need to change internally for that overflow to stay inside?\"",[
            jumpNode("Return to lawyer burden", "pain-and-consequence", "lawyer-time", "red"),
            jumpNode("Lock the pilot review", "next-step-lock", "pilot-design", "blu")
          ],"Capacity pressure is the main issue.","You still need the operating change that would reduce overflow.")
        ])
      ]),
      segment("decision-architecture","08","Decision architecture","Map the approval path.",true,[
        node("decision-architecture","approval-path","fu","Map the approval path","\"If this became real, what would the review path actually look like from first workflow test to approval?\"","Start here when proof is getting concrete.",true,[
          branch("PATH CLEAR","ok","\"Legal ops would scope it, the GC would sponsor it, and IT/security would review before anything expanded.\"","\"Good. What would the first review need to decide so the motion stays real?\"",[
            jumpNode("Lock the scoped review", "next-step-lock", "scoped-review", "grn"),
            jumpNode("Set the pilot design", "next-step-lock", "pilot-design", "blu")
          ],"The approval path is visible.","You still need the first review outcome."),
          branch("MURKY PATH","fl","\"Honestly, we have not mapped that yet.\"","\"That is fine. Then the next step should probably be the people who can map it together around one workflow.\"",[
            jumpNode("Lock the review", "next-step-lock", "scoped-review", "red"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "economic-owner", "blu")
          ],"The decision path is still murky.","You still need the minimum viable review group.")
        ]),
        node("decision-architecture","security-privilege","pr","Map confidentiality and privilege review","\"What security, privacy, privilege, or residency questions would need to be answered before legal would let a workflow move forward?\"","Use this when the buyer keeps circling trust and control.",false,[
          branch("CONTROL QUESTIONS CLEAR","ok","\"Privilege, data handling, and human review are the real gates.\"","\"Good. Then the next review has to include whoever can answer those with the GC and legal ops owner present.\"",[
            jumpNode("Lock the review group", "next-step-lock", "scoped-review", "grn"),
            jumpNode("Set the control proof", "proof-threshold", "human-loop", "blu")
          ],"The real blockers are now named.","You still need the meeting that can answer them."),
          branch("IT FIRST","fl","\"IT and security would slow this down before legal even got comfortable.\"","\"Then which workflow is narrow enough that those teams could evaluate it without broad architectural fear?\"",[
            jumpNode("Choose the narrow pilot", "proof-threshold", "pilot-scope", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "soft-trigger", "blu")
          ],"Technical review may outrank workflow desire.","You still need a scope that can survive it.")
        ])
      ]),
      segment("next-step-lock","09","Next-step lock","Leave with a real review.",true,[
        node("next-step-lock","scoped-review","gr","Lock the scoped review","\"The next step should probably be a working review with legal ops, the GC or sponsor, and one workflow in scope. Does that sound right?\"","Start here when the workflow and owner are named.",true,[
          branch("AGREES","ok","\"Yes. That makes sense.\"","\"Good. Which workflow should that review center on, and who needs to be in it so the meeting can actually decide something?\"",[
            jumpNode("Set the pilot design", "next-step-lock", "pilot-design", "grn"),
            jumpRoom("Carry into Call Planner", "call-planner", "blu")
          ],"A real review motion is now possible.","You still need the attendee set, workflow, and date."),
          branch("SEND SOMETHING","fl","\"Just send something first.\"","\"I can. What should it help your team decide so the follow-up becomes a working review instead of polite circulation?\"",[
            jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to proof bar", "proof-threshold", "accuracy-bar", "blu")
          ],"They are trying to defer with no meeting.","You still need the decision the follow-up is supposed to support.")
        ]),
        node("next-step-lock","soft-deferral","pr","Keep soft deferral honest","\"If I send material, what should it help the team answer before we meet again?\"","Use this whenever the buyer tries to end with passive follow-up.",false,[
          branch("DECISION NAMED","ok","\"It should help us decide whether this workflow is worth pressure-testing with the GC and legal ops.\"","\"Good. Then let us name the workflow now so the follow-up earns that meeting.\"",[
            jumpNode("Return to workflow scope", "current-state-truth", "workflow-break", "grn"),
            jumpNode("Lock the review", "next-step-lock", "scoped-review", "blu")
          ],"The follow-up has a real decision attached to it.","You still need the workflow it is about."),
          branch("NO COMMITMENT","fl","\"I cannot commit to another meeting yet.\"","\"Understood. Then what would have to be true for a next meeting to be worth it?\"",[
            jumpNode("Return to trigger", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "economic-owner", "blu")
          ],"There is no meeting commitment yet.","You still need the threshold for a real next step.")
        ]),
        node("next-step-lock","pilot-design","fu","Lock the pilot design","\"If the review goes well, what would the smallest credible pilot look like: one workflow, one team, one matter class, and one control path?\"","Use this when the buyer is already thinking beyond the first review.",false,[
          branch("PILOT SHAPE CLEAR","ok","\"Yes. We would start with one contract path and keep human review explicit.\"","\"Good. Then the first review should decide that scope, the control boundary, and the success criteria.\"",[
            jumpRoom("Take scope into Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Carry the meeting into Call Planner", "call-planner", "blu")
          ],"The pilot can now be shaped concretely.","You still need the meeting date and owner."),
          branch("NOT READY","fl","\"We are not ready to talk pilot shape yet.\"","\"Then the first review should stay diagnostic. What would make that review feel worth taking?\"",[
            jumpNode("Return to trigger", "trigger-and-urgency", "soft-trigger", "red"),
            jumpNode("Return to workflow break", "current-state-truth", "workflow-break", "blu")
          ],"The buyer is not yet ready for pilot language.","You still need the condition that would justify it.")
        ])
      ]),
      segment("post-call-routing","10","Post-call routing","Carry the truth into the next room.",false,[
        node("post-call-routing","room-route","sl","Carry the workflow forward","\"We have the workflow pressure, the owner map, the proof bar, and the next review condition. Carry only those into the next room.\"","Use this once the legal review motion is grounded.",true,[
          branch("WORKFLOW READY","ok","\"Use Deal Workspace to shape the scoped review and pilot boundary.\"","\"Then move the workflow, owner map, proof threshold, and review goal into the deal record now.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The workflow is concrete enough for the next room.","You still need the date and attendee set if they are not locked."),
          branch("DRIFT RISK","fl","\"Use Future Autopsy if trust or ownership is still too soft and this is likely to stall.\"","\"Then carry the missing sponsor, proof blocker, and soft next-step condition as drift clues.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"There is visible stall risk.","You still need the dominant drift reason.")
        ]),
        node("post-call-routing","call-plan","pr","Carry the meeting plan","\"If the next move is a review, what does that review have to accomplish so this does not turn into another polite legal-tech meeting?\"","Use this when the meeting is the immediate next room.",false,[
          branch("REVIEW CLEAR","ok","\"It needs to decide the workflow, the control path, and whether a pilot is worth scoping.\"","\"Good. Those three decisions are the carry-forward truth.\"",[
            jumpRoom("Open Call Planner", "call-planner", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The next meeting already has a job.","You still need the right attendees and date."),
          branch("TOO SOFT","fl","\"We are not there yet.\"","\"Then carry the soft spots honestly so the next room does not pretend this is firmer than it is.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The motion is still fragile.","You still need the missing owner or trigger.")
        ])
      ])
    ]
  };
})();
