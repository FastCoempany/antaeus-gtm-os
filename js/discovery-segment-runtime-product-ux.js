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
    quickActions:[
      {
        title:"Pick one live decision",
        copy:"Anchor the call to one release, workflow, or adoption question currently moving with thin evidence.",
        action:jumpNode("Open live decision", "current-state-truth", "live-decision", "blu")
      },
      {
        title:"Name the signal gap",
        copy:"Make the pain specific: research debt, documentation sprawl, adoption blind spots, or enablement drag.",
        action:jumpNode("Open signal pain", "pain-and-consequence", "signal-gap", "org")
      },
      {
        title:"Lock the review",
        copy:"Leave with product ops or the PM owner reviewing one live decision cycle.",
        action:jumpNode("Lock decision review", "next-step-lock", "decision-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"already-have-tools",
        label:"We already have docs and research tools",
        reply:"That is fine. I am not asking whether tools exist. I am asking where teams still re-stitch the same truth by hand because the workflow never turns signal into a usable decision fast enough.",
        actions:[
          jumpNode("Inspect the current stack", "current-vendor-and-displacement", "tool-sprawl", "blu"),
          jumpNode("Name the signal gap", "pain-and-consequence", "signal-gap", "org")
        ]
      },
      {
        id:"nobody-uses-docs",
        label:"Nobody uses what we publish",
        reply:"That usually means the workflow is failing upstream. Either the signal is not trusted, not timely, or not embedded where the team actually decides.",
        actions:[
          jumpNode("Map the live decision", "current-state-truth", "live-decision", "blu"),
          jumpNode("Open enablement drag", "pain-and-consequence", "enablement-drag", "org")
        ]
      },
      {
        id:"we-dont-do-this-formally",
        label:"We do not really do this formally",
        reply:"That is useful. Then the question is where the absence of process creates the most repeated work or weakest product decision today.",
        actions:[
          jumpNode("Map the workflow break", "current-state-truth", "workflow-break", "blu"),
          jumpNode("Open the signal gap", "pain-and-consequence", "signal-gap", "org")
        ]
      },
      {
        id:"too-small",
        label:"We are too small for dedicated tooling",
        reply:"Maybe. The only reason to keep going is if one live decision cycle is costly enough that a lightweight workflow change still matters.",
        actions:[
          jumpNode("Test the urgency", "trigger-and-urgency", "small-team-check", "red"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
        ]
      },
      {
        id:"send-overview",
        label:"Send an overview",
        reply:"I can. First tell me which decision or workflow the overview should help your team decide on so the follow-up becomes a real review.",
        actions:[
          jumpNode("Open live decision", "current-state-truth", "live-decision", "blu"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening frame","Start on re-learning and signal sprawl.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most product teams already have tools for research, docs, analytics, or enablement. The question is where teams still have to re-learn or re-stitch the same truth by hand before they trust a decision. Is that true in your world too?\"","Use this when they will diagnose before seeing product.",true,[
          branch("CONFIRMS","ok","\"Yes. The tools exist, but insight still gets scattered and re-synthesized manually.\"","\"Where does that break first: feedback intake, synthesis, release decisions, adoption visibility, or enablement handoff?\"",[
            jumpNode("Map the live decision", "current-state-truth", "live-decision", "blu"),
            jumpNode("Name the signal gap", "pain-and-consequence", "signal-gap", "grn")
          ],"Manual signal stitching is part of the current motion.","You still need the exact decision or workflow where it breaks first."),
          branch("TOOL DEFENSE","ly","\"We already have docs, analytics, and research tooling in place.\"","\"Good. Then where do teams still have to translate between those systems by hand before acting?\"",[
            jumpNode("Inspect the current stack", "current-vendor-and-displacement", "tool-sprawl", "org"),
            jumpNode("Open the signal gap", "pain-and-consequence", "signal-gap", "blu")
          ],"The buyer is defending tooling, not denying the workflow gap.","You still need the first manual bridge."),
          branch("NO PROCESS","fl","\"We do not even do this very formally yet.\"","\"That is useful. Then where does the lack of process create the most rework or weakest product calls today?\"",[
            jumpNode("Map the workflow break", "current-state-truth", "workflow-break", "red"),
            jumpNode("Open the trigger", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"The motion may be immature, not over-tooled.","You still need the highest-cost absence of process.")
        ]),
        node("opening-frame","decision-wedge","fu","Start from one live decision","\"Pick one feature, release, onboarding flow, or enablement motion that is moving right now. Where is that decision running with thinner signal than it should?\"","Use this when the room is already operational.",false,[
          branch("DECISION READY","ok","\"We have a release decision moving without enough usable evidence.\"","\"Good. What is missing most: user signal, product adoption read, internal alignment, or enablement readiness?\"",[
            jumpNode("Open live decision", "current-state-truth", "live-decision", "grn"),
            jumpNode("Open signal pain", "pain-and-consequence", "signal-gap", "blu")
          ],"A live decision is now anchoring the call.","You still need the specific missing truth inside it."),
          branch("NO LIVE EXAMPLE","fl","\"I do not have one in mind right now.\"","\"Then use the last time the team had to re-open a decision because the evidence was too thin or too scattered.\"",[
            jumpNode("Open signal pain", "pain-and-consequence", "signal-gap", "red"),
            jumpNode("Open the trigger", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"No live decision is ready yet.","You still need one recent cycle failure.")
        ])
      ]),
      segment("current-state-truth","02","Current-state truth","Map the decision workflow.",true,[
        node("current-state-truth","live-decision","fu","Map one live decision","\"Walk me through one live decision cycle. Where does the team still spend the most human effort: collecting signal, synthesizing it, socializing it, documenting it, or getting the right teams to act on it?\"","Start here when the room is willing to get concrete.",true,[
          branch("WORKFLOW CLEAR","ok","\"The synthesis and handoff still eat the most time.\"","\"What makes that heavy today: too many sources, weak ownership, unclear relevance, or no single place teams trust?\"",[
            jumpNode("Open the signal gap", "pain-and-consequence", "signal-gap", "grn"),
            jumpNode("Find who feels it", "stakeholder-and-ownership", "product-owner", "blu")
          ],"The live workflow break is visible.","You still need the source of that burden."),
          branch("ADOPTION BLIND","ly","\"The bigger issue is we do not know if teams actually adopt or use what we ship.\"","\"Then where does that blind spot hurt most: release validation, onboarding, expansion, or enablement?\"",[
            jumpNode("Open adoption blind spot", "pain-and-consequence", "adoption-blind", "org"),
            jumpNode("Set the proof bar", "proof-threshold", "live-cycle-proof", "blu")
          ],"Adoption visibility may be the dominant wedge.","You still need the decision it blocks."),
          branch("ENABLEMENT DRAG","fl","\"CS and enablement keep rebuilding context after product ships.\"","\"Then what gets lost in the handoff: feature intent, use cases, workflow guidance, or measurement?\"",[
            jumpNode("Open enablement drag", "pain-and-consequence", "enablement-drag", "red"),
            jumpNode("Find the cross-functional owner", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"The break may be between product and downstream teams.","You still need the first lost object.")
        ]),
        node("current-state-truth","workflow-break","pr","Map the workflow break","\"Is the bigger issue missing research signal, fragmented documentation, adoption visibility, or cross-functional handoff?\"","Use this when they speak in generalities.",false,[
          branch("RESEARCH DEBT","ok","\"We keep relearning the same user truth because research never gets reused cleanly.\"","\"Where does that re-learning hurt first: roadmap calls, design choices, or launch readiness?\"",[
            jumpNode("Open signal pain", "pain-and-consequence", "signal-gap", "grn"),
            jumpNode("Find the trigger", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"Research debt is explicit.","You still need the decision it compromises."),
          branch("CONTENT SPRAWL","ly","\"The issue is more docs and knowledge sprawl than pure research debt.\"","\"Then what is the damage: slower onboarding, inconsistent execution, or teams ignoring what exists?\"",[
            jumpNode("Open enablement drag", "pain-and-consequence", "enablement-drag", "org"),
            jumpNode("Inspect the current stack", "current-vendor-and-displacement", "tool-sprawl", "blu")
          ],"Knowledge fragmentation may be the main wedge.","You still need the user-facing or team-facing cost."),
          branch("LOW MATURITY","fl","\"We do not really have a formal process here yet.\"","\"Then where does that lack of process create the most repeated work right now?\"",[
            jumpNode("Open signal pain", "pain-and-consequence", "signal-gap", "red"),
            jumpNode("Test small-team reality", "trigger-and-urgency", "small-team-check", "blu")
          ],"The problem may be low process maturity.","You still need the highest-cost repeated motion.")
        ])
      ]),
      segment("pain-and-consequence","03","Pain and consequence","Make the signal problem expensive.",true,[
        node("pain-and-consequence","signal-gap","ri","Name the signal gap","\"What is the actual damage today: slow product decisions, repeated research, bad release calls, weak adoption visibility, or teams moving with conflicting truth?\"","Start here when the workflow break is visible.",true,[
          branch("DECISION PAIN CLEAR","ok","\"We move decisions with thin evidence and end up revisiting them later.\"","\"What does that cost most: roadmap churn, engineering waste, weak launches, or leadership trust?\"",[
            jumpNode("Find who feels it", "stakeholder-and-ownership", "product-owner", "grn"),
            jumpNode("Find the trigger", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"Decision pain is explicit.","You still need the business or execution consequence of it."),
          branch("NOT SEVERE","fl","\"It is messy, but not always painful.\"","\"Then what has to happen before this becomes worth changing the workflow?\"",[
            jumpNode("Test urgency", "trigger-and-urgency", "small-team-check", "red"),
            jumpNode("Open enablement drag", "pain-and-consequence", "enablement-drag", "blu")
          ],"The pain may still be below the action threshold.","You still need the forcing event.")
        ]),
        node("pain-and-consequence","enablement-drag","pr","Name the enablement drag","\"Where does context break after product ships: onboarding, internal training, CS handoff, launch readiness, or field guidance?\"","Use this when teams downstream keep rebuilding context.",false,[
          branch("HANDOFF CLEAR","ok","\"Enablement and CS keep recreating product context because it never arrives cleanly.\"","\"What gets lost most often: workflow guidance, use case context, feature intent, or proof of value?\"",[
            jumpNode("Find the cross-functional owner", "stakeholder-and-ownership", "cross-functional-owner", "grn"),
            jumpNode("Open live-cycle proof", "proof-threshold", "live-cycle-proof", "blu")
          ],"The downstream handoff break is visible.","You still need the first missing object."),
          branch("DOCS EXIST","fl","\"The docs exist. People just do not use them.\"","\"Then what would have to change for the workflow to surface the right guidance at the right moment instead of just storing it?\"",[
            jumpNode("Inspect the stack", "current-vendor-and-displacement", "tool-sprawl", "red"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"The issue is workflow adoption, not mere documentation presence.","You still need the usage failure point.")
        ]),
        node("pain-and-consequence","adoption-blind","fu","Name the adoption blind spot","\"Where does weak adoption visibility hurt most today: feature rollout, onboarding, self-serve growth, or proving whether a product bet actually landed?\"","Use this when the pain is validation after launch.",false,[
          branch("BLIND SPOT CLEAR","ok","\"We cannot tell fast enough whether usage is real or just anecdotal.\"","\"What should that visibility change first: roadmap decisions, enablement action, or customer follow-through?\"",[
            jumpNode("Set the proof bar", "proof-threshold", "live-cycle-proof", "grn"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "product-owner", "blu")
          ],"Adoption visibility is a real wedge.","You still need the decision it should change."),
          branch("NOT MAIN ISSUE","fl","\"Adoption is not the main issue. It is more about synthesis and alignment.\"","\"Then stay with that. Where does the team still re-stitch the same truth manually?\"",[
            jumpNode("Return to signal gap", "pain-and-consequence", "signal-gap", "red"),
            jumpNode("Return to live decision", "current-state-truth", "live-decision", "blu")
          ],"Adoption is secondary here.","You still need the actual repeated-work wedge.")
        ])
      ]),
      segment("trigger-and-urgency","04","Trigger and urgency","Find the forcing event.",true,[
        node("trigger-and-urgency","miss-or-pressure","ri","Find the forcing event","\"What changed that made this worth looking at now: a bad launch, research debt becoming visible, leadership asking for better evidence, enablement drag, or weak adoption after release?\"","Start here when urgency exists but is not yet specific.",true,[
          branch("PRESSURE CLEAR","ok","\"A launch or decision cycle exposed how thin the evidence and handoff still are.\"","\"Which live decision or release cycle would prove the case fastest if it improved?\"",[
            jumpNode("Pick the live decision", "current-state-truth", "live-decision", "grn"),
            jumpNode("Lock the review", "next-step-lock", "decision-review", "blu")
          ],"The forcing event is explicit.","You still need the cycle it attaches to."),
          branch("LEADERSHIP ASK","ly","\"Leadership just wants cleaner visibility and evidence now.\"","\"What decision are they currently struggling to make with confidence?\"",[
            jumpNode("Return to live decision", "current-state-truth", "live-decision", "org"),
            jumpNode("Open the signal gap", "pain-and-consequence", "signal-gap", "blu")
          ],"Executive demand is the frame, not the whole wedge.","You still need the concrete decision."),
          branch("SOFT INTEREST","fl","\"Nothing broke. We just know we need to get better.\"","\"Then what would have to happen before this becomes a real workflow priority instead of a nice-to-have?\"",[
            jumpNode("Test the small-team reality", "trigger-and-urgency", "small-team-check", "red"),
            jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
          ],"Interest may still be soft.","You still need the condition that makes it real.")
        ]),
        node("trigger-and-urgency","small-team-check","fu","Check small-team reality","\"Is the team large enough and the signal problem costly enough that a workflow change matters now, or is this still too small and informal to justify?\"","Use this when maturity or org size may disqualify the motion.",false,[
          branch("REAL ENOUGH","ok","\"The team is small, but the repeated work and weak decisions are still costly enough.\"","\"Good. Then which live decision or workflow should the next review center on?\"",[
            jumpNode("Return to live decision", "current-state-truth", "live-decision", "grn"),
            jumpNode("Lock the review", "next-step-lock", "decision-review", "blu")
          ],"The motion is real enough despite team size.","You still need the review object."),
          branch("TOO SMALL","fl","\"Honestly, one PM still does most of this manually.\"","\"Then this may stay light for now. What would have to change before the workflow pain becomes worth solving?\"",[
            jumpNode("Keep it exploratory", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Open Future Autopsy route", "post-call-routing", "autopsy-flag", "blu")
          ],"The org may be below the tooling threshold.","You still need the reactivation condition.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Stakeholder and ownership","Map who can carry or kill it.",true,[
        node("stakeholder-and-ownership","product-owner","fu","Find the product owner","\"Who feels this pain enough to move it first: PM leadership, product ops, research ops, enablement, CS, or growth?\"","Start here when the workflow is clear but sponsorship is not.",true,[
          branch("OWNER CLEAR","ok","\"Product ops and PM leadership would carry it, but downstream teams also need to buy in.\"","\"Good. Which question matters more first: decision speed, signal trust, or cross-functional adoption?\"",[
            jumpNode("Set the proof bar", "proof-threshold", "live-cycle-proof", "grn"),
            jumpNode("Find the cross-functional owner", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"A sponsor path is visible.","You still need the first gating question."),
          branch("NO OWNER","fl","\"No one fully owns this end to end.\"","\"Then who would have to carry the first review for this not to die after today?\"",[
            jumpNode("Lock the review", "next-step-lock", "decision-review", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "small-team-check", "blu")
          ],"Ownership is not yet assigned.","You still need a named person for the next meeting.")
        ]),
        node("stakeholder-and-ownership","cross-functional-owner","pr","Find the cross-functional owner","\"What team feels the downstream pain most: enablement, CS, engineering, RevOps, design, or growth?\"","Use this when the problem crosses product and execution teams.",false,[
          branch("DOWNSTREAM CLEAR","ok","\"Enablement and CS feel it because they rebuild context after product decisions are made.\"","\"What would they need to see to believe the workflow is actually improving?\"",[
            jumpNode("Open live-cycle proof", "proof-threshold", "live-cycle-proof", "grn"),
            jumpNode("Map the approval path", "decision-architecture", "approval-path", "blu")
          ],"The downstream owner is visible.","You still need the proof condition that earns trust."),
          branch("PRODUCT ONLY","fl","\"This is mainly a product team problem right now.\"","\"Then what makes it expensive enough for leadership to care beyond PM frustration?\"",[
            jumpNode("Return to pain", "pain-and-consequence", "signal-gap", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "miss-or-pressure", "blu")
          ],"Cross-functional stake may still be weak.","You still need the leadership consequence.")
        ])
      ]),
      segment("proof-threshold","06","Proof threshold","Define the trust bar.",true,[
        node("proof-threshold","live-cycle-proof","pur","Set the live-cycle proof bar","\"Before this could move, what would the team have to trust: better decision speed, cleaner synthesis, more usable adoption signal, stronger enablement handoff, or all of the above?\"","Start here when the buyer goes straight to usefulness and proof.",true,[
          branch("LIVE DECISION FIRST","ok","\"It has to improve a real decision cycle, not just organize content better.\"","\"Then what is the fairest live decision or release cycle to test that on?\"",[
            jumpNode("Choose the pilot cycle", "proof-threshold", "pilot-cycle", "grn"),
            jumpNode("Open approval path", "decision-architecture", "approval-path", "blu")
          ],"The proof bar is tied to a live cycle.","You still need the safest live cycle to test against it."),
          branch("ADOPTION FIRST","ly","\"We need proof that the signal actually changes downstream action.\"","\"Then where should that action show up first: product changes, enablement behavior, or customer-facing execution?\"",[
            jumpNode("Find the downstream owner", "stakeholder-and-ownership", "cross-functional-owner", "org"),
            jumpNode("Choose the pilot cycle", "proof-threshold", "pilot-cycle", "blu")
          ],"The buyer wants behavioral proof, not just organization.","You still need the first downstream action target."),
          branch("SHOW ROI","fl","\"Show me time saved or output gain first.\"","\"Fair. Which workflow would prove ROI fastest without becoming just another content repository?\"",[
            jumpNode("Choose the pilot cycle", "proof-threshold", "pilot-cycle", "red"),
            jumpNode("Return to signal gap", "pain-and-consequence", "signal-gap", "blu")
          ],"The buyer is forcing business case first.","You still need a safe ROI workflow.")
        ]),
        node("proof-threshold","pilot-cycle","pr","Choose the pilot cycle","\"What is the safest meaningful cycle to test first: one release, one onboarding flow, one enablement motion, one feedback loop, or one adoption question?\"","Use this when the buyer is open but needs a narrow start.",false,[
          branch("CYCLE CLEAR","ok","\"One release or one onboarding flow would be the cleanest place to start.\"","\"Good. Then who needs to join the review so that cycle becomes real, not theoretical?\"",[
            jumpNode("Lock the review", "next-step-lock", "decision-review", "grn"),
            jumpNode("Map the approval path", "decision-architecture", "approval-path", "blu")
          ],"A pilot cycle is visible.","You still need the review group and date."),
          branch("NO SAFE PILOT","fl","\"Everything feels too broad or too messy right now.\"","\"Then which workflow is narrow enough to pressure-test without trying to fix the whole operating model at once?\"",[
            jumpNode("Return to workflow break", "current-state-truth", "workflow-break", "red"),
            jumpNode("Return to current stack", "current-vendor-and-displacement", "tool-sprawl", "blu")
          ],"The buyer does not yet see a safe entry point.","You still need a narrower cycle.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor and displacement","Map the status quo to replace.",true,[
        node("current-vendor-and-displacement","tool-sprawl","fu","Inspect the current stack","\"What is already in place today: docs, wikis, research repos, analytics, feedback tools, onboarding content, enablement systems, and whatever teams still do around them by hand?\"","Start here when the buyer defends the current tool set.",true,[
          branch("STACK CLEAR","ok","\"The tools are all there, but no single workflow turns them into usable signal at the right moment.\"","\"Which handoff fails first: collecting signal, synthesizing it, publishing it, or getting teams to act on it?\"",[
            jumpNode("Return to live decision", "current-state-truth", "live-decision", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "live-cycle-proof", "blu")
          ],"System presence is not equal to signal usability.","You still need the first failing handoff."),
          branch("INCUMBENT GOOD ENOUGH","ly","\"We have an incumbent people actually use and do not want to switch.\"","\"That is fine. Then where does the incumbent still stop short of the outcome you need?\"",[
            jumpNode("Return to signal gap", "pain-and-consequence", "signal-gap", "org"),
            jumpNode("Choose the pilot cycle", "proof-threshold", "pilot-cycle", "blu")
          ],"The motion may need to work around an incumbent, not replace it.","You still need the workflow gap outside that incumbent."),
          branch("NOBODY USES IT","fl","\"The bigger issue is that teams do not use what already exists.\"","\"Then what would have to change in the workflow for usage to become natural instead of optional?\"",[
            jumpNode("Open enablement drag", "pain-and-consequence", "enablement-drag", "red"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"Workflow adoption is the blocker, not tool availability.","You still need the trigger for actual use.")
        ]),
        node("current-vendor-and-displacement","workflow-adoption","pr","Inspect how teams route around the stack","\"Where do teams route around the current stack most: Slack threads, Notion pages, one-off meetings, spreadsheets, or pure PM intuition?\"","Use this when the tools are present but behavior still escapes them.",false,[
          branch("SLACK / MEETINGS","ok","\"A lot of the real coordination happens in Slack or meetings, not in the systems.\"","\"Then what truth is the team still carrying verbally instead of structurally?\"",[
            jumpNode("Return to signal gap", "pain-and-consequence", "signal-gap", "grn"),
            jumpNode("Find the product owner", "stakeholder-and-ownership", "product-owner", "blu")
          ],"The workflow is escaping the official stack.","You still need the truth object that keeps leaking out."),
          branch("DOCS EXIST, MISSED","ly","\"The artifacts exist, but they do not show up where teams actually decide or act.\"","\"Then what downstream motion should the workflow influence first if it starts working?\"",[
            jumpNode("Open enablement drag", "pain-and-consequence", "enablement-drag", "org"),
            jumpNode("Set the proof bar", "proof-threshold", "live-cycle-proof", "blu")
          ],"The issue is timing and placement, not just content creation.","You still need the first downstream action."),
          branch("ANALYTICS ONLY","fl","\"We mostly look at analytics and make judgment calls from there.\"","\"Then what decision is still running on too much intuition because the workflow does not pull in the rest of the truth?\"",[
            jumpNode("Return to live decision", "current-state-truth", "live-decision", "red"),
            jumpNode("Open approval path", "decision-architecture", "approval-path", "blu")
          ],"The stack may be over-indexed on measurement and under-indexed on workflow.","You still need the decision it weakens.")
        ])
      ]),
      segment("decision-architecture","08","Decision architecture","Map the approval path.",true,[
        node("decision-architecture","approval-path","fu","Map the approval path","\"If this became real, what would the review path actually look like from first live cycle to approval?\"","Start here when proof is getting concrete.",true,[
          branch("PATH CLEAR","ok","\"PM leadership would sponsor, product ops would evaluate, and downstream teams would need to agree on the workflow.\"","\"Good. What does the first review need to decide so the motion stays real?\"",[
            jumpNode("Lock the review", "next-step-lock", "decision-review", "grn"),
            jumpNode("Set the pilot cycle", "next-step-lock", "pilot-design", "blu")
          ],"The approval path is visible.","You still need the first review outcome."),
          branch("IT OR DATA REVIEW","ly","\"Some data or IT review would matter depending on the workflow.\"","\"Then which cycle is narrow enough to evaluate without triggering broad architectural fear?\"",[
            jumpNode("Choose the pilot cycle", "proof-threshold", "pilot-cycle", "org"),
            jumpNode("Open cross-functional owner", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"Operational review may shape the path.","You still need a scope that can survive it."),
          branch("MURKY PATH","fl","\"We have not mapped that path yet.\"","\"That is fine. Then the next step should be the people who can map it together around one live cycle.\"",[
            jumpNode("Lock the review", "next-step-lock", "decision-review", "red"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "product-owner", "blu")
          ],"The decision path is still murky.","You still need the minimum viable review group.")
        ]),
        node("decision-architecture","review-ownership","pr","Map who can bless the workflow","\"If a live cycle were reviewed next week, who would have to say yes that the scope and proof bar are real: PM leadership, product ops, research ops, enablement, or downstream teams?\"","Use this when the path exists but the owning review group is fuzzy.",false,[
          branch("OWNER CLEAR","ok","\"PM leadership and product ops would lead it, but enablement has to trust the downstream fit.\"","\"Good. Then what should that first review actually decide so each group sees its value?\"",[
            jumpNode("Lock the review", "next-step-lock", "decision-review", "grn"),
            jumpNode("Set the pilot cycle", "next-step-lock", "pilot-design", "blu")
          ],"The review group is visible.","You still need the first concrete decision."),
          branch("DATA / IT CHECK","ly","\"Data or IT will want to understand the workflow implications too.\"","\"Then which live cycle is narrow enough to review without triggering broad technical fear?\"",[
            jumpNode("Choose the pilot cycle", "proof-threshold", "pilot-cycle", "org"),
            jumpNode("Find the cross-functional owner", "stakeholder-and-ownership", "cross-functional-owner", "blu")
          ],"Technical review matters, but scope still controls the motion.","You still need the smallest survivable cycle."),
          branch("NO OWNER YET","fl","\"No one has really claimed that review yet.\"","\"Then who would have to convene it for this not to stay a good idea with no owner?\"",[
            jumpNode("Find the product owner", "stakeholder-and-ownership", "product-owner", "red"),
            jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
          ],"The missing piece is ownership, not just approval.","You still need the convening owner.")
        ])
      ]),
      segment("next-step-lock","09","Next-step lock","Leave with a real review.",true,[
        node("next-step-lock","decision-review","gr","Lock the live-cycle review","\"The next step should probably be a working review with product ops or the PM owner and one live cycle in scope. Does that sound right?\"","Start here when the cycle and owner are named.",true,[
          branch("AGREES","ok","\"Yes. That makes sense.\"","\"Good. Which cycle should that review center on, and who needs to be there so it can actually decide something?\"",[
            jumpNode("Set the pilot cycle", "next-step-lock", "pilot-design", "grn"),
            jumpRoom("Carry into Call Planner", "call-planner", "blu")
          ],"A real review motion is now possible.","You still need the attendee set, cycle, and date."),
          branch("TOO EARLY","ly","\"That feels a little early.\"","\"That is fair. What is missing before that review would feel earned: cycle scope, proof detail, or sponsor alignment?\"",[
            jumpNode("Return to proof bar", "proof-threshold", "pilot-cycle", "org"),
            jumpNode("Return to owner map", "stakeholder-and-ownership", "product-owner", "blu")
          ],"The buyer is not ready for the review yet.","You still need the missing condition."),
          branch("SEND SOMETHING","fl","\"Just send something first.\"","\"I can. What should it help your team decide so the follow-up becomes a working review instead of polite circulation?\"",[
            jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to proof bar", "proof-threshold", "live-cycle-proof", "blu")
          ],"They are trying to defer with no meeting.","You still need the decision the follow-up is supposed to support.")
        ]),
        node("next-step-lock","soft-deferral","pr","Keep soft deferral honest","\"If I send material, what should it help the team answer before we meet again?\"","Use this whenever the buyer tries to end with passive follow-up.",false,[
          branch("DECISION NAMED","ok","\"It should help us decide whether this cycle is worth pressure-testing with product ops and the PM owner.\"","\"Good. Then let us name the cycle now so the follow-up earns that meeting.\"",[
            jumpNode("Return to live decision", "current-state-truth", "live-decision", "grn"),
            jumpNode("Lock the review", "next-step-lock", "decision-review", "blu")
          ],"The follow-up has a real decision attached to it.","You still need the cycle it is about."),
          branch("NO COMMITMENT","fl","\"I cannot commit to another meeting yet.\"","\"Understood. Then what would have to be true for a next meeting to be worth it?\"",[
            jumpNode("Return to trigger", "trigger-and-urgency", "small-team-check", "red"),
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "product-owner", "blu")
          ],"There is no meeting commitment yet.","You still need the threshold for a real next step.")
        ]),
        node("next-step-lock","pilot-design","fu","Lock the pilot cycle","\"If the review goes well, what is the smallest credible test: one release, one handoff, one research loop, or one adoption workflow?\"","Use this when they are already thinking beyond the first review.",false,[
          branch("PILOT CLEAR","ok","\"One release or one onboarding cycle would be the right start.\"","\"Good. Then the first review should decide that scope, the proof bar, and the success criteria.\"",[
            jumpRoom("Take scope into Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Carry the meeting into Call Planner", "call-planner", "blu")
          ],"The pilot can now be shaped concretely.","You still need the meeting date and owner."),
          branch("NOT READY","fl","\"We are not ready to talk pilot shape yet.\"","\"Then the first review should stay diagnostic. What would make that review feel worth taking?\"",[
            jumpNode("Return to trigger", "trigger-and-urgency", "miss-or-pressure", "red"),
            jumpNode("Return to live decision", "current-state-truth", "live-decision", "blu")
          ],"The buyer is not yet ready for pilot language.","You still need the condition that would justify it.")
        ])
      ]),
      segment("post-call-routing","10","Post-call routing","Carry the truth into the next room.",false,[
        node("post-call-routing","room-route","sl","Carry the cycle truth forward","\"We have the signal gap, the owner map, the proof bar, and the next review condition. Carry only those into the next room.\"","Use this once the live-cycle review motion is grounded.",true,[
          branch("CYCLE READY","ok","\"Use Deal Workspace to shape the live-cycle review and pilot boundary.\"","\"Then move the cycle, owner map, proof threshold, and review goal into the deal record now.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The cycle is concrete enough for the next room.","You still need the date and attendee set if they are not locked."),
          branch("MEETING READY","ly","\"Use Call Planner because the next win is the live-cycle review meeting itself.\"","\"Then carry the cycle, who must join, and what the review has to decide.\"",[
            jumpRoom("Open Call Planner", "call-planner", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The meeting design is the next priority.","You still need the review scope and proof question."),
          branch("DRIFT RISK","fl","\"Use Future Autopsy if ownership or urgency is still too soft and this may stall.\"","\"Then carry the missing sponsor, proof blocker, and soft next-step condition as drift clues.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"There is visible stall risk.","You still need the dominant drift reason.")
        ]),
        node("post-call-routing","autopsy-flag","pr","Carry the stall clues","\"If this slips, what will probably cause it: weak sponsor, fuzzy cycle scope, no measurable proof, or no cross-functional owner?\"","Use this when the motion is interesting but not yet earned.",false,[
          branch("SPONSOR SOFT","ok","\"Sponsor softness is the risk.\"","\"Then flag the missing sponsor and keep the next meeting built around one cycle and one decision.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The likely drift cause is visible.","You still need the sponsor trigger."),
          branch("SCOPE MISSING","fl","\"We still do not have a clear live cycle in scope.\"","\"Then do not pretend the motion is real yet. Carry that as the primary missing truth.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"Cycle scope is still missing.","You still need the first live cycle candidate.")
        ])
      ])
    ]
  };
})();
