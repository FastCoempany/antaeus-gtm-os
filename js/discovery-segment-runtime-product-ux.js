(function(){
  var runtime = window.DISCOVERY_SEGMENT_RUNTIME;
  if(!runtime || !runtime.frameworks || !runtime.frameworks["product-ux"]) return;

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

  var base = runtime.frameworks["product-ux"];

  var supportDossier = [
    { title:"Where it breaks", items:["Whether the pain is research / discovery, synthesis, onboarding, enablement, or adoption measurement", "What gets lost between research → product → engineering → GTM → customer-facing teams", "Manual documentation burden and who carries it"] },
    { title:"What they need to see", items:["Adoption or activation lift on a feature or workflow the team already cares about", "How fast docs and training get done compared with relying on what people just know", "Cross-functional visibility: does the data actually reach product, CS, and enablement in one place"] },
    { title:"Decision path", items:["Head of Product or CPO sponsor who feels the adoption or velocity pressure", "Product ops or enablement lead who owns the documentation and adoption story", "Design research or UXR owner if research synthesis is the main use"] }
  ];
  var objectionLibrary = [
    { trigger:"we already have docs and wikis", reply:"Good. How often do they get used, and how often does the same question get re-asked in Slack anyway? If people do not trust the documentation, they will not use it." },
    { trigger:"we use Pendo already", reply:"Fair. What does Pendo tell you that actually changes a product decision, and what does it leave you wondering about that you still go ask in other channels?" },
    { trigger:"our PMs do not want more tooling", reply:"Understandable. The question is whether this tooling replaces a burden or adds one. Which part of the PM week is currently lost to work that should not require a person?" },
    { trigger:"show me the ROI", reply:"Happy to. Before I send generic numbers, tell me which feature or workflow is currently under-adopted, because the business case looks different when it is tied to a real loss in revenue or retention." }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from Scribe or Pendo?", bridge:"Depends on the use. Scribe-style is documentation generation; Pendo-style is adoption analytics. Which of those is the bigger problem for your team right now?" },
    { question:"Does it replace user research?", bridge:"No. More useful: how does research get summarized and turned into product decisions today, and where do findings get lost along the way?" },
    { question:"Can it integrate with Notion / Confluence / Intercom?", bridge:"In most cases yes. The more telling question: if the integration worked perfectly, which of those tools would your team actually trust to make a decision?" }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing makes sense once we know whether low product usage or lost research findings cost enough to justify change. What is the business cost of the current gap?" },
    { trigger:"asks for demo too early", reply:"I can show it. First tell me which feature or research process you would want the demo to show working in your environment — otherwise it becomes a tour." },
    { trigger:"sends me to PM team", reply:"Happy to talk to them. Before that, which outcome is the tool supposed to improve — adoption, speed of synthesis, or cross-team visibility? Each asks different questions of the PM team." }
  ];

  runtime.frameworks["product-ux"] = {
    id:base.id,
    label:base.label,
    short:base.short,
    storageKey:base.storageKey,
    aliases:base.aliases,
    persona:"Product ops / PM leadership",
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
        title:"Pick one live decision",
        copy:"Anchor the call to one release, workflow, or adoption question currently moving with limited evidence.",
        action:jumpNode("Ask about one live decision", "current-state-truth", "live-decision", "blu")
      },
      {
        title:"Name the signal gap",
        copy:"Make the pain specific: research debt, documentation sprawl, adoption blind spots, or enablement drag.",
        action:jumpNode("Ask what scattered feedback is costing them", "pain-and-consequence", "signal-gap", "org")
      },
      {
        title:"Lock the review",
        copy:"Leave with product ops or the PM owner reviewing one live decision cycle.",
        action:jumpNode("Book a review meeting on one product cycle", "next-step-lock", "decision-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"already-have-tools",
        label:"We already have docs and research tools",
        reply:"That is fine. I am not asking whether tools exist. I am asking where teams still piece the same information together by hand because feedback never turns into a usable decision fast enough.",
        actions:[
          jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "tool-sprawl", "blu"),
          jumpNode("Ask what scattered feedback is costing them", "pain-and-consequence", "signal-gap", "org")
        ]
      },
      {
        id:"nobody-uses-docs",
        label:"Nobody uses what we publish",
        reply:"That usually means the workflow is failing upstream. Either people don't trust the information, it arrives too late, or it isn't where the team actually makes decisions.",
        actions:[
          jumpNode("Walk through one decision in progress", "current-state-truth", "live-decision", "blu"),
          jumpNode("Ask about enablement time", "pain-and-consequence", "enablement-drag", "org")
        ]
      },
      {
        id:"we-dont-do-this-formally",
        label:"We do not really do this formally",
        reply:"That is useful. Then the question is where having no formal process creates the most repeated work or the weakest product decisions today.",
        actions:[
          jumpNode("Ask where the work breaks down", "current-state-truth", "workflow-break", "blu"),
          jumpNode("Ask what customer feedback they miss", "pain-and-consequence", "signal-gap", "org")
        ]
      },
      {
        id:"too-small",
        label:"We are too small for dedicated tooling",
        reply:"Maybe. The only reason to keep going is if one decision in progress is costly enough that a small change to how you work still matters.",
        actions:[
          jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "small-team-check", "red"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ]
      },
      {
        id:"send-overview",
        label:"Send an overview",
        reply:"I can. First tell me which decision or workflow the overview should help your team decide on so the follow-up becomes a real review.",
        actions:[
          jumpNode("Ask about one live decision", "current-state-truth", "live-decision", "blu"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening","Ask how often the team re-learns things it already knew about customers.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most product teams already have tools for research, docs, analytics, or enablement. The question is where teams still have to re-learn or piece the same information back together by hand before they trust a decision. Is that true in your world too?\"","Use this when they're willing to talk through the problem before seeing the product.",true,[
          branch("CONFIRMS","ok","\"Yes. The tools exist, but insight still gets scattered and re-synthesized manually.\"","\"Where does that break first: feedback intake, synthesis, release decisions, adoption visibility, or enablement handoff?\"",[
            jumpNode("Walk through one decision in progress", "current-state-truth", "live-decision", "blu"),
            jumpNode("Ask what scattered feedback is costing them", "pain-and-consequence", "signal-gap", "grn")
          ],"People still piece feedback together by hand today.","You still need the exact decision or workflow where it breaks first."),
          branch("TOOL DEFENSE","ly","\"We already have docs, analytics, and research tooling in place.\"","\"Good. Then where do teams still have to translate between those systems by hand before acting?\"",[
            jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "tool-sprawl", "org"),
            jumpNode("Ask what customer feedback they miss", "pain-and-consequence", "signal-gap", "blu")
          ],"The buyer is defending tooling, not denying the workflow gap.","You still need the first manual bridge."),
          branch("NO PROCESS","fl","\"We do not even do this very formally yet.\"","\"That is useful. Then where does the lack of process create the most rework or weakest product calls today?\"",[
            jumpNode("Ask where the work breaks down", "current-state-truth", "workflow-break", "red"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"The process may be immature, not over-tooled.","You still need the highest-cost absence of process.")
        ]),
        node("opening-frame","decision-scope","fu","Start from one live decision","\"Pick one feature, release, onboarding flow, or enablement process that is moving right now. Where is that decision running with less evidence than it needs?\"","Use this when the buyer already runs the workflow day to day.",false,[
          branch("DECISION READY","ok","\"We have a release decision moving without enough usable evidence.\"","\"Good. What is missing most: user signal, product adoption evidence, internal alignment, or enablement readiness?\"",[
            jumpNode("Ask about one live decision", "current-state-truth", "live-decision", "grn"),
            jumpNode("Ask what scattered feedback is costing them", "pain-and-consequence", "signal-gap", "blu")
          ],"The call is now focused on one decision in progress.","You still need the specific open question inside it."),
          branch("NO LIVE EXAMPLE","fl","\"I do not have one in mind right now.\"","\"Then think of the last time the team had to re-open a decision because the evidence was too weak or too scattered. What happened?\"",[
            jumpNode("Ask what scattered feedback is costing them", "pain-and-consequence", "signal-gap", "red"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"No live decision is ready yet.","You still need one recent cycle failure.")
        ])
      ]),
      segment("current-state-truth","02","How they work today","Ask how customer feedback turns into a product decision today.",true,[
        node("current-state-truth","live-decision","fu","Walk through one decision in progress","\"Walk me through one live decision cycle. Where does the team still spend the most human effort: collecting signal, synthesizing it, socializing it, documenting it, or getting the right teams to act on it?\"","Start here when the buyer is willing to get concrete.",true,[
          branch("WORKFLOW CLEAR","ok","\"The synthesis and handoff still eat the most time.\"","\"What makes that heavy today: too many sources, weak ownership, unclear relevance, or no single place teams trust?\"",[
            jumpNode("Ask what customer feedback they miss", "pain-and-consequence", "signal-gap", "grn"),
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "product-owner", "blu")
          ],"You know where a real workflow breaks down.","You still need the source of that burden."),
          branch("ADOPTION BLIND","ly","\"The bigger issue is we do not know if teams actually adopt or use what we ship.\"","\"Then where does that blind spot hurt most: release validation, onboarding, expansion, or enablement?\"",[
            jumpNode("Ask what they can't see about product usage", "pain-and-consequence", "adoption-blind", "org"),
            jumpNode("Agree what they need to see", "proof-threshold", "live-cycle-proof", "blu")
          ],"Seeing how people use the product may be the main problem.","You still need the decision it blocks."),
          branch("ENABLEMENT DRAG","fl","\"CS and enablement keep rebuilding context after product ships.\"","\"Then what gets lost in the handoff: feature intent, use cases, workflow guidance, or measurement?\"",[
            jumpNode("Ask about enablement time", "pain-and-consequence", "enablement-drag", "red"),
            jumpNode("Ask which team feels the problem most", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"The break may be between product and downstream teams.","You still need the first lost object.")
        ]),
        node("current-state-truth","workflow-break","pr","Ask where the work breaks down","\"Is the bigger issue missing research signal, fragmented documentation, adoption visibility, or cross-functional handoff?\"","Use this when they speak in generalities.",false,[
          branch("RESEARCH DEBT","ok","\"We keep relearning the same things about users because research never gets reused cleanly.\"","\"Where does that re-learning hurt first: roadmap calls, design choices, or launch readiness?\"",[
            jumpNode("Ask what scattered feedback is costing them", "pain-and-consequence", "signal-gap", "grn"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"They admit research findings are going unused.","You still need the decision it compromises."),
          branch("CONTENT SPRAWL","ly","\"The issue is more scattered docs and knowledge than unused research.\"","\"Then what is the damage: slower onboarding, inconsistent execution, or teams ignoring what exists?\"",[
            jumpNode("Ask about enablement time", "pain-and-consequence", "enablement-drag", "org"),
            jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "tool-sprawl", "blu")
          ],"Scattered knowledge may be the main problem.","You still need the user-facing or team-facing cost."),
          branch("LOW MATURITY","fl","\"We do not really have a formal process here yet.\"","\"Then where does that lack of process create the most repeated work right now?\"",[
            jumpNode("Ask what scattered feedback is costing them", "pain-and-consequence", "signal-gap", "red"),
            jumpNode("Check whether the team is big enough to need this", "trigger-and-urgency", "small-team-check", "blu")
          ],"The problem may be low process maturity.","You still need the most expensive repeated work.")
        ])
      ]),
      segment("pain-and-consequence","03","The problem and its cost","Find out what scattered or lost feedback costs them.",true,[
        node("pain-and-consequence","signal-gap","ri","Ask what scattered feedback is costing them","\"What is the actual damage today: slow product decisions, repeated research, bad release calls, weak adoption visibility, or teams moving with conflicting information?\"","Start here once you know where the work breaks down.",true,[
          branch("DECISION PAIN CLEAR","ok","\"We move decisions with limited evidence and end up revisiting them later.\"","\"What does that cost most: roadmap churn, engineering waste, weak launches, or leadership trust?\"",[
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "product-owner", "grn"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"They said slow or weak decisions are a real problem.","You still need the business or execution consequence of it."),
          branch("NOT SEVERE","fl","\"It is messy, but not always painful.\"","\"Then what has to happen before this becomes worth changing the workflow?\"",[
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "small-team-check", "red"),
            jumpNode("Ask about enablement time", "pain-and-consequence", "enablement-drag", "blu")
          ],"The problem may not yet hurt enough to act on.","You still need the trigger.")
        ]),
        node("pain-and-consequence","enablement-drag","pr","Ask how much time training and handoffs take","\"Where does context break after product ships: onboarding, internal training, CS handoff, launch readiness, or field guidance?\"","Use this when other teams keep having to piece the same information back together.",false,[
          branch("HANDOFF CLEAR","ok","\"Enablement and CS keep recreating product context because it never arrives cleanly.\"","\"What gets lost most often: workflow guidance, use case context, feature intent, or evidence of value?\"",[
            jumpNode("Ask which team feels the problem most", "stakeholder-and-ownership", "cross-functional-owner", "grn"),
            jumpNode("Ask what one live product cycle should show", "proof-threshold", "live-cycle-proof", "blu")
          ],"You know where things break after the product ships.","You still need the first missing object."),
          branch("DOCS EXIST","fl","\"The docs exist. People just do not use them.\"","\"Then what would have to change for the workflow to show the right guidance at the right moment instead of just storing it?\"",[
            jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "tool-sprawl", "red"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"The issue is workflow adoption, not mere documentation presence.","You still need the usage failure point.")
        ]),
        node("pain-and-consequence","adoption-blind","fu","Ask what they can't see about product usage","\"Where does weak adoption visibility hurt most today: feature rollout, onboarding, self-serve growth, or proving whether a product bet actually landed?\"","Use this when the pain is validation after launch.",false,[
          branch("BLIND SPOT CLEAR","ok","\"We cannot tell fast enough whether usage is real or just anecdotal.\"","\"What should that visibility change first: roadmap decisions, enablement action, or customer follow-through?\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "live-cycle-proof", "grn"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "product-owner", "blu")
          ],"Seeing how people use the product is a real problem for them.","You still need the decision it should change."),
          branch("NOT MAIN ISSUE","fl","\"Adoption is not the main issue. It is more about synthesis and alignment.\"","\"Then stay with that. Where does the team still piece the same information together by hand?\"",[
            jumpNode("Go back to what scattered feedback costs", "pain-and-consequence", "signal-gap", "red"),
            jumpNode("Go back to the decision in progress", "current-state-truth", "live-decision", "blu")
          ],"Adoption is secondary here.","You still need the actual repeated-work scope.")
        ])
      ]),
      segment("trigger-and-urgency","04","Why now","Find out what changed that makes this worth solving now.",true,[
        node("trigger-and-urgency","miss-or-pressure","ri","Find what makes this urgent now","\"What changed that made this worth looking at now: a bad launch, unused research becoming obvious, leadership asking for better evidence, enablement drag, or weak adoption after release?\"","Start here when urgency exists but is not yet specific.",true,[
          branch("TRIGGER CLEAR","ok","\"A launch or decision cycle exposed how limited the evidence and handoff still are.\"","\"Which live decision or release cycle would prove the case fastest if it improved?\"",[
            jumpNode("Walk through one decision in progress", "current-state-truth", "live-decision", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "decision-review", "blu")
          ],"They said why it matters now.","You still need the cycle it attaches to."),
          branch("LEADERSHIP ASK","ly","\"Leadership just wants cleaner visibility and evidence now.\"","\"What decision are they currently struggling to make with confidence?\"",[
            jumpNode("Go back to the decision in progress", "current-state-truth", "live-decision", "org"),
            jumpNode("Ask what customer feedback they miss", "pain-and-consequence", "signal-gap", "blu")
          ],"Leadership is asking for it, but that is not the whole problem.","You still need the concrete decision."),
          branch("SOFT INTEREST","fl","\"Nothing broke. We just know we need to get better.\"","\"Then what would have to happen before this becomes a real workflow priority instead of a nice-to-have?\"",[
            jumpNode("Check whether the team is big enough to need this", "trigger-and-urgency", "small-team-check", "red"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ],"Interest may still be weak.","You still need the condition that makes it real.")
        ]),
        node("trigger-and-urgency","small-team-check","fu","Check whether the team is big enough to need this","\"Is the team large enough and the signal problem costly enough that a workflow change matters now, or is this still too small and informal to justify?\"","Use this when maturity or org size may disqualify the deal.",false,[
          branch("REAL ENOUGH","ok","\"The team is small, but the repeated work and weak decisions are still costly enough.\"","\"Good. Then which live decision or workflow should the next review center on?\"",[
            jumpNode("Go back to the decision in progress", "current-state-truth", "live-decision", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "decision-review", "blu")
          ],"The need is real enough despite team size.","You still need the review object."),
          branch("TOO SMALL","fl","\"Honestly, one PM still does most of this manually.\"","\"Then this may stay light for now. What would have to change before the workflow pain becomes worth solving?\"",[
            jumpNode("Ask what would make this urgent", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Open Future Autopsy", "post-call-routing", "autopsy-flag", "blu")
          ],"The team may be too small to need a tool for this.","You still need the reactivation condition.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Who's involved","Find out who would push for this and who could stop it.",true,[
        node("stakeholder-and-ownership","product-owner","fu","Find the product owner","\"Who feels this pain enough to move it first: PM leadership, product ops, research ops, enablement, CS, or growth?\"","Start here when the workflow is clear but sponsorship is not.",true,[
          branch("OWNER CLEAR","ok","\"Product ops and PM leadership would carry it, but downstream teams also need to buy in.\"","\"Good. Which question matters more first: decision speed, signal trust, or cross-functional adoption?\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "live-cycle-proof", "grn"),
            jumpNode("Ask which team feels the problem most", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"You know who might sponsor this.","You still need the first gating question."),
          branch("NO OWNER","fl","\"No one fully owns this end to end.\"","\"Then who would have to carry the first review to keep this moving after today?\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "decision-review", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "small-team-check", "blu")
          ],"Ownership is not yet assigned.","You still need a named person for the next meeting.")
        ]),
        node("stakeholder-and-ownership","cross-functional-owner","pr","Ask which team feels the problem most","\"What team feels the downstream pain most: enablement, CS, engineering, RevOps, design, or growth?\"","Use this when the problem crosses product and execution teams.",false,[
          branch("DOWNSTREAM CLEAR","ok","\"Enablement and CS feel it because they rebuild context after product decisions are made.\"","\"What would they need to see to believe the workflow is actually improving?\"",[
            jumpNode("Ask what one live product cycle should show", "proof-threshold", "live-cycle-proof", "grn"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "approval-path", "blu")
          ],"You know which team depends on this.","You still need the evidence that would win their trust."),
          branch("PRODUCT ONLY","fl","\"This is mainly a product team problem right now.\"","\"Then what makes it expensive enough for leadership to care beyond PM frustration?\"",[
            jumpNode("Go back to the problem", "pain-and-consequence", "signal-gap", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"Cross-functional stake may still be weak.","You still need the leadership consequence.")
        ])
      ]),
      segment("proof-threshold","06","What they need to see","Agree on what they would need to see to trust the output.",true,[
        node("proof-threshold","live-cycle-proof","pur","Agree what one live product cycle should show","\"Before this could move, what would the team have to trust: better decision speed, cleaner synthesis, more usable adoption signal, stronger enablement handoff, or all of the above?\"","Start here when the buyer jumps straight to whether it works and what proves it.",true,[
          branch("LIVE DECISION FIRST","ok","\"It has to improve a real decision cycle, not just organize content better.\"","\"Then what is the fairest live decision or release cycle to test that on?\"",[
            jumpNode("Pick one product cycle to test first", "proof-threshold", "pilot-cycle", "grn"),
            jumpNode("Ask about the approval path", "decision-architecture", "approval-path", "blu")
          ],"What they need to see is tied to a live cycle.","You still need the safest live cycle to test against it."),
          branch("ADOPTION FIRST","ly","\"We need evidence that the signal actually changes downstream action.\"","\"Then where should that action show up first: product changes, enablement behavior, or customer-facing execution?\"",[
            jumpNode("Ask which team feels the problem most", "stakeholder-and-ownership", "cross-functional-owner", "org"),
            jumpNode("Pick one product cycle to test first", "proof-threshold", "pilot-cycle", "blu")
          ],"The buyer wants behavioral evidence, not just organization.","You still need the first downstream action target."),
          branch("SHOW ROI","fl","\"Show me time saved or output gain first.\"","\"Fair. Which workflow would prove ROI fastest without becoming just another content repository?\"",[
            jumpNode("Pick one product cycle to test first", "proof-threshold", "pilot-cycle", "red"),
            jumpNode("Go back to what scattered feedback costs", "pain-and-consequence", "signal-gap", "blu")
          ],"The buyer wants the business case first.","You still need a safe ROI workflow.")
        ]),
        node("proof-threshold","pilot-cycle","pr","Pick one product cycle to test first","\"What is the safest meaningful cycle to test first: one release, one onboarding flow, one enablement process, one feedback loop, or one adoption question?\"","Use this when the buyer is open but needs a narrow start.",false,[
          branch("CYCLE CLEAR","ok","\"One release or one onboarding flow would be the cleanest place to start.\"","\"Good. Then who needs to join the review so that cycle becomes real, not theoretical?\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "decision-review", "grn"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "approval-path", "blu")
          ],"You have a possible product cycle to pilot.","You still need the review group and date."),
          branch("NO SAFE PILOT","fl","\"Everything feels too broad or too messy right now.\"","\"Then which workflow is narrow enough to test without trying to fix everything about how the team works at once?\"",[
            jumpNode("Go back to where the work breaks down", "current-state-truth", "workflow-break", "red"),
            jumpNode("Go back to the tools they use today", "current-vendor-and-displacement", "tool-sprawl", "blu")
          ],"The buyer does not yet see a safe entry point.","You still need a narrower cycle.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor","Find out what they use today and why it has lasted.",true,[
        node("current-vendor-and-displacement","tool-sprawl","fu","Ask what tools they use today","\"What is already in place today: docs, wikis, research repos, analytics, feedback tools, onboarding content, enablement systems, and whatever teams still do around them by hand?\"","Start here when the buyer defends the current tool set.",true,[
          branch("STACK CLEAR","ok","\"The tools are all there, but no single workflow turns them into usable signal at the right moment.\"","\"Which handoff fails first: collecting signal, synthesizing it, publishing it, or getting teams to act on it?\"",[
            jumpNode("Go back to the decision in progress", "current-state-truth", "live-decision", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "live-cycle-proof", "blu")
          ],"Having the tools doesn't mean the feedback is usable.","You still need the first failing handoff."),
          branch("INCUMBENT GOOD ENOUGH","ly","\"We have a tool people actually use, and they do not want to switch.\"","\"That is fine. Then where does your current tool still fall short of what you need?\"",[
            jumpNode("Go back to what scattered feedback costs", "pain-and-consequence", "signal-gap", "org"),
            jumpNode("Pick one product cycle to test first", "proof-threshold", "pilot-cycle", "blu")
          ],"The product may need to work alongside their current tool, not replace it.","You still need the workflow gap outside that incumbent."),
          branch("NOBODY USES IT","fl","\"The bigger issue is that teams do not use what already exists.\"","\"Then what would have to change in the workflow for usage to become natural instead of optional?\"",[
            jumpNode("Ask about enablement time", "pain-and-consequence", "enablement-drag", "red"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"Workflow adoption is the blocker, not tool availability.","You still need the trigger for actual use.")
        ]),
        node("current-vendor-and-displacement","workflow-adoption","pr","Ask how teams work around their tools","\"Where do teams route around the current stack most: Slack threads, Notion pages, one-off meetings, spreadsheets, or pure PM intuition?\"","Use this when the tools are in place but reps still don't change their habits.",false,[
          branch("SLACK / MEETINGS","ok","\"A lot of the real coordination happens in Slack or meetings, not in the systems.\"","\"Then what does the team still only know by word of mouth instead of structurally?\"",[
            jumpNode("Go back to what scattered feedback costs", "pain-and-consequence", "signal-gap", "grn"),
            jumpNode("Find the product owner", "stakeholder-and-ownership", "product-owner", "blu")
          ],"The workflow is escaping the official stack.","You still need the piece of information that keeps getting lost."),
          branch("DOCS EXIST, MISSED","ly","\"The artifacts exist, but they do not show up where teams actually decide or act.\"","\"Then what downstream work should the workflow influence first if it starts working?\"",[
            jumpNode("Ask about enablement time", "pain-and-consequence", "enablement-drag", "org"),
            jumpNode("Agree what they need to see", "proof-threshold", "live-cycle-proof", "blu")
          ],"The issue is timing and placement, not just content creation.","You still need the first downstream action."),
          branch("ANALYTICS ONLY","fl","\"We mostly look at analytics and make judgment calls from there.\"","\"Then what decision is still running on too much intuition because the workflow does not pull in the rest of the facts?\"",[
            jumpNode("Go back to the decision in progress", "current-state-truth", "live-decision", "red"),
            jumpNode("Ask about the approval path", "decision-architecture", "approval-path", "blu")
          ],"The stack may be over-indexed on measurement and under-indexed on workflow.","You still need the decision it weakens.")
        ])
      ]),
      segment("decision-architecture","08","How they'll decide","Find out who signs off and in what order.",true,[
        node("decision-architecture","approval-path","fu","Ask who approves this, in what order","\"If this became real, what would the review path actually look like from first live cycle to approval?\"","Start here once they are getting specific about what they need to see.",true,[
          branch("PATH CLEAR","ok","\"PM leadership would sponsor, product ops would evaluate, and downstream teams would need to agree on the workflow.\"","\"Good. What does the first review need to decide so the process can continue?\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "decision-review", "grn"),
            jumpNode("Agree what a small test would include", "next-step-lock", "pilot-design", "blu")
          ],"You know who approves this and in what order.","You still need the first review outcome."),
          branch("IT OR DATA REVIEW","ly","\"Some data or IT review would matter depending on the workflow.\"","\"Then which cycle is narrow enough to evaluate without triggering broad architectural fear?\"",[
            jumpNode("Pick one product cycle to test first", "proof-threshold", "pilot-cycle", "org"),
            jumpNode("Ask who owns it across teams", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"Operational review may shape the path.","You still need a scope that can pass that review."),
          branch("MURKY PATH","fl","\"We have not mapped that path yet.\"","\"That is fine. Then the next step should be the people who can map it together around one live cycle.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "decision-review", "red"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "product-owner", "blu")
          ],"It is still unclear how they would decide.","You still need the minimum viable review group.")
        ]),
        node("decision-architecture","review-ownership","pr","Ask who has to approve the test","\"If a live cycle were reviewed next week, who would have to agree that the scope and the evidence they need are real: PM leadership, product ops, research ops, enablement, or downstream teams?\"","Use this when the path exists but the owning review group is fuzzy.",false,[
          branch("OWNER CLEAR","ok","\"PM leadership and product ops would lead it, but enablement has to trust the downstream fit.\"","\"Good. Then what should that first review actually decide so each group sees its value?\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "decision-review", "grn"),
            jumpNode("Agree what a small test would include", "next-step-lock", "pilot-design", "blu")
          ],"You know who should be in the review.","You still need the first concrete decision."),
          branch("DATA / IT CHECK","ly","\"Data or IT will want to understand the workflow implications too.\"","\"Then which live cycle is narrow enough to review without triggering broad technical fear?\"",[
            jumpNode("Pick one product cycle to test first", "proof-threshold", "pilot-cycle", "org"),
            jumpNode("Ask which team feels the problem most", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"Technical review matters, but agreeing the scope is what will move the deal.","You still need the smallest survivable cycle."),
          branch("NO OWNER YET","fl","\"No one has really claimed that review yet.\"","\"Then who would have to convene it for this not to stay a good idea with no owner?\"",[
            jumpNode("Find the product owner", "stakeholder-and-ownership", "product-owner", "red"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ],"The missing piece is ownership, not just approval.","You still need the convening owner.")
        ])
      ]),
      segment("next-step-lock","09","Next step","Leave with a dated review meeting and a named owner.",true,[
        node("next-step-lock","decision-review","gr","Book a review meeting on one product cycle","\"The next step should probably be a working review with product ops or the PM owner and one live cycle in scope. Does that sound right?\"","Start here when the cycle and owner are named.",true,[
          branch("AGREES","ok","\"Yes. That makes sense.\"","\"Good. Which cycle should that review center on, and who needs to be there so it can actually decide something?\"",[
            jumpNode("Agree what a small test would include", "next-step-lock", "pilot-design", "grn"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"A real review is now possible.","You still need the attendee set, cycle, and date."),
          branch("TOO EARLY","ly","\"That feels a little early.\"","\"That is fair. What is missing before that review would feel worth it: cycle scope, evidence detail, or sponsor alignment?\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "pilot-cycle", "org"),
            jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "product-owner", "blu")
          ],"The buyer is not ready for the review yet.","You still need the missing condition."),
          branch("SEND SOMETHING","fl","\"Just send something first.\"","\"I can. What should it help your team decide so the follow-up becomes a working review instead of polite circulation?\"",[
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to what they need to see", "proof-threshold", "live-cycle-proof", "blu")
          ],"They are trying to defer with no meeting.","You still need the decision the follow-up is supposed to support.")
        ]),
        node("next-step-lock","soft-deferral","pr","Ask what they need in order to decide","\"If I send material, what should it help the team answer before we meet again?\"","Use this when the buyer tries to end the call with a vague \"we'll follow up.\"",false,[
          branch("DECISION NAMED","ok","\"It should help us decide whether this cycle is worth testing with product ops and the PM owner.\"","\"Good. Then let us name the cycle now so the follow-up justifies that meeting.\"",[
            jumpNode("Go back to the decision in progress", "current-state-truth", "live-decision", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "decision-review", "blu")
          ],"The follow-up has a real decision attached to it.","You still need the cycle it is about."),
          branch("NO COMMITMENT","fl","\"I cannot commit to another meeting yet.\"","\"Understood. Then what would have to be true for a next meeting to be worth it?\"",[
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "small-team-check", "red"),
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "product-owner", "blu")
          ],"There is no meeting commitment yet.","You still need the threshold for a real next step.")
        ]),
        node("next-step-lock","pilot-design","fu","Agree what a small test would include","\"If the review goes well, what is the smallest credible test: one release, one handoff, one research process, or one adoption workflow?\"","Use this when they are already thinking beyond the first review.",false,[
          branch("PILOT CLEAR","ok","\"One release or one onboarding cycle would be the right start.\"","\"Good. Then the first review should decide that scope, the evidence needed, and how success is measured.\"",[
            jumpRoom("Save the scope to the deal in Deal Workspace", "deal-workspace", "grn"),
            action("Go to After the call", "segment:post-call-routing", "blu")
          ],"The pilot can now be shaped concretely.","You still need the meeting date and owner."),
          branch("NOT READY","fl","\"We are not ready to talk pilot shape yet.\"","\"Then the first review should stay diagnostic. What would make that review feel worth taking?\"",[
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "miss-or-pressure", "red"),
            jumpNode("Go back to the decision in progress", "current-state-truth", "live-decision", "blu")
          ],"The buyer is not yet ready for pilot language.","You still need the condition that would justify it.")
        ])
      ]),
      segment("post-call-routing","10","After the call","Record what you learned and decide where it goes next.",false,[
        node("post-call-routing","room-route","sl","Record what you learned about the cycle","\"We have the feedback gap, who owns what, what they need to see, and what the next review depends on. Take only those into the next step.\"","Use this once the review of one product cycle has a clear scope.",true,[
          branch("CYCLE READY","ok","\"Use Deal Workspace to shape the live-cycle review and pilot boundary.\"","\"Then add the product cycle, who owns what, what they need to see, and the goal of the review to the deal record now.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The product cycle is concrete enough to take to the next step.","You still need the date and attendee set if they are not locked."),
          branch("MEETING READY","ly","\"The next step is the review meeting for that product cycle.\"","\"Then carry the cycle, who must join, and what the review has to decide.\"",[
            action("Set the next meeting", "segment:next-step-lock", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The meeting design is the next priority.","You still need the review scope and evidence question."),
          branch("DRIFT RISK","fl","\"Use Future Autopsy if ownership or urgency is still too weak and this may stall.\"","\"Then note the missing sponsor, what's blocking the evidence, and the weak next step as reasons it could stall.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"There is a clear risk this stalls.","You still need the dominant drift reason.")
        ]),
        node("post-call-routing","autopsy-flag","pr","Record what could stall it","\"If this slips, what will probably cause it: weak sponsor, fuzzy cycle scope, no measurable evidence, or no cross-functional owner?\"","Use this when the opportunity is interesting but not yet justified.",false,[
          branch("SPONSOR SOFT","ok","\"The risk is a weak sponsor.\"","\"Then flag the missing sponsor and keep the next meeting built around one cycle and one decision.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"You can see the most likely reason this could stall.","You still need the sponsor trigger."),
          branch("SCOPE MISSING","fl","\"We still do not have a clear live cycle in scope.\"","\"Then do not pretend the deal is real yet. Carry that as the main open question.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"You still don't know which product cycle to focus on.","You still need the first live cycle candidate.")
        ])
      ])
    ]
  };
})();
