(function(){
  var runtime = window.DISCOVERY_SEGMENT_RUNTIME;
  if(!runtime || !runtime.frameworks || !runtime.frameworks.manufacturing) return;

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

  var base = runtime.frameworks.manufacturing;

  var supportDossier = [
    { title:"Operational consequence", items:["Line-down risk or missed OTIF on the supplier under discussion", "Working-capital distortion when the disruption was last absorbed manually", "Executive visibility: whether the resilience story reaches the board or dies in a spreadsheet"] },
    { title:"Proof burden", items:["Accuracy of the supplier or N-tier map against what their ERP knows", "Credibility of one scenario they already simulated internally", "Freshness of monitoring signal on a supplier they care about right now"] },
    { title:"Decision path", items:["Supply chain risk or resilience owner who feels the disruption cost", "Procurement or sourcing lead who owns the supplier relationship", "Operations / manufacturing executive who absorbs the downstream pain"] }
  ];
  var objectionLibrary = [
    { trigger:"we already monitor suppliers", reply:"Good. Which supplier surprised you most in the last 18 months, and what was the monitoring layer doing the week before it did?" },
    { trigger:"we have an ERP for this", reply:"ERPs tell you what you bought. The question is whether they tell you which supplier is about to fail you. Walk me through how a real disruption becomes visible today." },
    { trigger:"just send a dashboard", reply:"Happy to. First tell me which decision the dashboard is supposed to inform — resilience, diligence, sourcing, or executive narrative — because the dashboards for each are different." },
    { trigger:"data is too messy for this to work", reply:"Fair. Then the first question is not about our product. It is whether the supplier data is good enough for anyone — internal or external — to run a risk system on. What state is it in?" }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from Craft or Vantive?", bridge:"Depends on which motion you are in. Craft-style is reactive supplier intelligence; Vantive-style is proactive scenario planning. Which one does your team actually need this quarter?" },
    { question:"Can you map N-tier suppliers?", bridge:"In many cases yes, but the real question is whether N-tier visibility would change a decision you are making. Which tier-two supplier surprise cost you most recently?" },
    { question:"What about cybersecurity and ESG risk?", bridge:"Both are real layers. The useful version is whether one of them is already creating executive pressure — if not, adding the layer is cosmetic." }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing makes sense once we know whether the last disruption was expensive enough to justify changing the review process. What did that one cost?" },
    { trigger:"asks for demo too early", reply:"I can show it. First tell me which supplier or scenario you would want the demo to survive — otherwise it becomes a tour instead of a test." },
    { trigger:"wants technical integration detail", reply:"Integration only matters if the resilience case is real enough to deserve fixing. Which operational decision would this need to support first?" }
  ];

  runtime.frameworks.manufacturing = {
    id:base.id,
    label:base.label,
    short:base.short,
    storageKey:base.storageKey,
    aliases:base.aliases,
    persona:"Supply chain / operations",
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
        title:"Classify the motion",
        copy:"Separate proactive scenario planning from reactive supplier monitoring first.",
        action:jumpNode("Classify the motion", "opening-frame", "motion-type", "blu")
      },
      {
        title:"Anchor on one disruption",
        copy:"Use one supplier or program event instead of abstract resilience language.",
        action:jumpNode("Use one disruption", "current-state-truth", "live-example", "org")
      },
      {
        title:"Lock the resilience review",
        copy:"Leave with operations, procurement, and one live risk path named.",
        action:jumpNode("Lock the review", "next-step-lock", "live-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"already-monitor-suppliers",
        label:"We already monitor suppliers",
        reply:"That helps. I am trying to learn whether you need better monitoring, or whether you still cannot model consequence before a disruption hits.",
        actions:[
          jumpNode("Classify the motion", "opening-frame", "motion-type", "blu"),
          jumpNode("Name the pain", "pain-and-consequence", "operational-consequence", "org")
        ]
      },
      {
        id:"we-live-in-erp",
        label:"Everything already sits in ERP",
        reply:"ERP gives record. It usually does not give the visibility a decision actually needs across risk, consequence, and response timing. Where does the picture still need manual stitching?",
        actions:[
          jumpNode("Map the current stitching", "current-state-truth", "stitching", "blu"),
          jumpNode("Find the blind spot", "pain-and-consequence", "network-blindness", "org")
        ]
      },
      {
        id:"just-show-platform",
        label:"Just show the platform",
        reply:"I can. First tell me whether we are solving proactive scenario planning or reactive supplier monitoring so I do not show the wrong operating motion.",
        actions:[
          jumpNode("Classify the motion", "opening-frame", "motion-type", "blu"),
          jumpNode("Set the proof bar", "proof-threshold", "real-proof", "pur")
        ]
      },
      {
        id:"procurement-only",
        label:"This is really just procurement",
        reply:"Maybe. The question is whether this is supplier diligence only, or whether operations and manufacturing still pay for the consequences later.",
        actions:[
          jumpNode("Map the owner split", "stakeholder-and-ownership", "owner-split", "blu"),
          jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "org")
        ]
      },
      {
        id:"no-disruption-right-now",
        label:"Nothing is on fire right now",
        reply:"Good. Then the test is whether you want a monitoring layer only, or whether you need a planning model before the next disruption lands.",
        actions:[
          jumpNode("Use soft trigger", "trigger-and-urgency", "soft-trigger", "red"),
          jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening frame","Start by classifying the motion.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most teams can monitor some suppliers. The real question is whether you can see operational consequence early enough to act before a disruption becomes expensive. Is that where this lives for you too?\"","Use this when they will diagnose before seeing product.",true,[
          branch("CONFIRMS","ok","\"Yes. We see pieces of the picture, but the real risk still gets stitched together manually.\"","\"Good. Is the live problem more proactive scenario planning or reactive supplier monitoring?\"",[
            jumpNode("Classify the motion", "opening-frame", "motion-type", "grn"),
            jumpNode("Map the stitching", "current-state-truth", "stitching", "blu")
          ],"Manual stitching is part of the current motion.","You still need the proactive vs reactive split."),
          branch("TOOL DEFENSE","ly","\"We already have ERP views, alerts, and supplier tools.\"","\"Understood. Then where does the picture still break: supplier visibility, consequence modeling, or cross-functional response?\"",[
            jumpNode("Map the stitching", "current-state-truth", "stitching", "org"),
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "blu")
          ],"The buyer is defending the stack, not denying the gap.","You still need the first broken decision layer."),
          branch("PITCH REQUEST","fl","\"Can you just show me the platform?\"","\"I can. First tell me whether this is about proactive scenario planning or reactive monitoring so I do not show the wrong operating motion.\"",[
            jumpNode("Classify the motion", "opening-frame", "motion-type", "blu"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "pur")
          ],"They are trying to skip diagnosis.","You still need the active operating motion before demo.")
        ]),
        node("opening-frame","motion-type","fu","Classify the motion","\"Which side is more urgent today: spotting supplier risk earlier, or modeling consequence before the disruption lands?\"","This has to be known early because the rest of the call changes.",false,[
          branch("REACTIVE MONITORING","ok","\"We need better supplier visibility and alerting first.\"","\"Good. Then what signal is still late, thin, or too noisy to act on?\"",[
            jumpNode("Map the current review", "current-state-truth", "supplier-review", "grn"),
            jumpNode("Name the blind spot", "pain-and-consequence", "network-blindness", "blu")
          ],"This is a reactive monitoring motion.","You still need the operational consequence of bad visibility."),
          branch("PROACTIVE PLANNING","ly","\"We need to understand consequence and plan around disruptions before they happen.\"","\"Good. What decision still gets made too late today because the organization cannot model impact early enough?\"",[
            jumpNode("Use one disruption", "current-state-truth", "live-example", "org"),
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "blu")
          ],"This is a proactive planning motion.","You still need the live planning failure."),
          branch("BOTH","fl","\"Honestly, it is both.\"","\"That is normal. Which one creates the first expensive miss today: weak visibility or weak consequence planning?\"",[
            jumpNode("Use one disruption", "current-state-truth", "live-example", "red"),
            jumpNode("Map the stitching", "current-state-truth", "stitching", "blu")
          ],"The motion spans both categories.","You still need the first visible failure.")
        ]),
        node("opening-frame","sideways","ri","If the call starts sideways","\"If this is still early, that is fine. What made this worth looking at now instead of after the next sourcing cycle or disruption?\"","Use this when they are curious but not yet committed.",false,[
          branch("RECENT EVENT","ok","\"A disruption, supplier issue, or resilience mandate pushed this into the foreground.\"","\"Then let us follow that pressure. What part of the response failed first?\"",[
            jumpNode("Test the trigger", "trigger-and-urgency", "recent-event", "grn"),
            jumpNode("Use one disruption", "current-state-truth", "live-example", "blu")
          ],"There is a real forcing event.","You still need the first operational break."),
          branch("GENERAL IMPROVEMENT","ly","\"We mostly want better visibility than we have today.\"","\"Visibility into what exactly: supplier health, line-down risk, scenario impact, or procurement diligence?\"",[
            jumpNode("Map the current review", "current-state-truth", "supplier-review", "org"),
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "blu")
          ],"There is directional interest, but the scope is still broad.","You still need the first use case that matters."),
          branch("NOTHING URGENT","fl","\"Nothing is urgent. We are just exploring.\"","\"That is workable. What would have to happen before this became a live operating priority?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The call may be exploratory only.","You still need the threshold that would make this move.")
        ])
      ]),
      segment("current-state-truth","02","Current-state truth","Map how the risk picture gets made.",true,[
        node("current-state-truth","stitching","fu","Map the current stitching","\"Walk me through how the team pieces together supplier risk or disruption consequence today. What systems, spreadsheets, and people still have to be stitched together before anyone trusts the picture?\"","Start here when they admit the workflow is fragmented.",true,[
          branch("STITCHING CLEAR","ok","\"It is ERP, supplier data, email, and spreadsheets, then someone assembles the picture manually.\"","\"Which part breaks first: data freshness, network visibility, or consequence modeling?\"",[
            jumpNode("Name the blind spot", "pain-and-consequence", "network-blindness", "grn"),
            jumpNode("Use one disruption", "current-state-truth", "live-example", "blu")
          ],"The current assembly path is visible.","You still need the first broken decision layer."),
          branch("PARTLY CENTRALIZED","ly","\"We have a system, but people still step in whenever things get messy.\"","\"What type of mess forces the manual step-in first: supplier health, production impact, or cross-functional response?\"",[
            jumpNode("Use one disruption", "current-state-truth", "live-example", "org"),
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "blu")
          ],"There is tooling, but humans still rescue the hard edge.","You still need the rescue trigger."),
          branch("NO CLEAR MAP","fl","\"It depends on the team and region.\"","\"Then pick the one supplier or program path leadership would care most about if it broke tomorrow.\"",[
            jumpNode("Use one disruption", "current-state-truth", "live-example", "red"),
            jumpNode("Map the owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The workflow is fragmented by region or team.","You still need one real path to anchor the call.")
        ]),
        node("current-state-truth","supplier-review","pr","Map the supplier review motion","\"How is supplier health actually reviewed today: alerts, audits, spreadsheets, periodic business reviews, consultants, or manual escalation?\"","Use this when the buyer frames the problem as monitoring or diligence.",false,[
          branch("POINT TOOLS PLUS MANUAL","ok","\"We have alerts and risk tools, but people still have to translate them into action.\"","\"Which alert or score still fails to tell the team what to do next?\"",[
            jumpNode("Name the blind spot", "pain-and-consequence", "network-blindness", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "risk-proof", "blu")
          ],"Monitoring exists, but action logic is still thin.","You still need the signal that fails in practice."),
          branch("AUDIT CADENCE","ly","\"We rely on periodic reviews and manual follow-up.\"","\"What stays invisible between reviews that later becomes expensive?\"",[
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "org"),
            jumpNode("Find the trigger", "trigger-and-urgency", "recent-event", "blu")
          ],"Cadence may be too slow for the actual risk.","You still need the invisible period that matters."),
          branch("NO REAL SYSTEM","fl","\"Honestly, there is not a real system yet.\"","\"Then which decision is operating with the least trustworthy supplier picture right now?\"",[
            jumpNode("Use one disruption", "current-state-truth", "live-example", "red"),
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "blu")
          ],"The motion may still be mostly manual.","You still need the first decision that suffers from it.")
        ]),
        node("current-state-truth","live-example","ri","Use one disruption or sourcing event","\"Give me one recent disruption, supplier warning, or sourcing decision where the organization did not have the picture early enough.\"","Use this whenever the conversation stays abstract.",false,[
          branch("LIVE EVENT READY","ok","\"We had a recent supplier or program event where the team reacted later than it should have.\"","\"What did the team not know early enough: the supplier risk, the operational consequence, or the response path?\"",[
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "grn"),
            jumpNode("Test the trigger", "trigger-and-urgency", "recent-event", "blu")
          ],"The call now has a real event to work from.","You still need the specific missing truth inside it."),
          branch("HYPOTHETICAL ONLY","ly","\"Nothing dramatic, but we can imagine where this would hurt.\"","\"Fine. Then which modeled downside worries the team most: line-down risk, missed OTIF, cost shock, or supplier failure?\"",[
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "org"),
            jumpNode("Set the proof bar", "proof-threshold", "scenario-proof", "blu")
          ],"The case may be planning-driven rather than event-driven.","You still need the consequence worth planning against."),
          branch("NO EXAMPLE","fl","\"I do not have one on hand.\"","\"Then use the last moment leadership asked a hard question the current system could not answer quickly.\"",[
            jumpNode("Test the trigger", "trigger-and-urgency", "recent-event", "red"),
            jumpNode("Map the owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The call is still too abstract.","You still need one real decision moment.")
        ])
      ]),
      segment("pain-and-consequence","03","Pain and consequence","Make the consequence expensive.",true,[
        node("pain-and-consequence","operational-consequence","ri","Name the operational consequence","\"When the current picture is late or thin, what becomes expensive first: line-down risk, missed OTIF, working-capital distortion, revenue loss, compliance exposure, or cyber supplier risk?\"","Start here once the workflow gap is visible.",true,[
          branch("CONSEQUENCE CLEAR","ok","\"We react late and the operational consequence becomes visible too late to shape the response well.\"","\"Which consequence hurts most in practice today?\"",[
            jumpNode("Quantify the consequence", "pain-and-consequence", "reactive-firefight", "grn"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "blu")
          ],"A real consequence is now named.","You still need its dominant cost and owner."),
          branch("MAINLY EFFICIENCY","ly","\"It is mostly team time and coordination pain.\"","\"What business downside sits underneath that coordination pain if it stays unresolved?\"",[
            jumpNode("Quantify the consequence", "pain-and-consequence", "reactive-firefight", "org"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The cost may still be framed too softly.","You still need the business downside beneath the process pain."),
          branch("NOTHING DRAMATIC","fl","\"Nothing catastrophic. It is just more reactive than we want.\"","\"Reactive to what exactly, and what does that reactivity cost the business when it repeats?\"",[
            jumpNode("Find the firefight", "pain-and-consequence", "reactive-firefight", "red"),
            jumpNode("Test urgency", "trigger-and-urgency", "soft-trigger", "blu")
          ],"The pain is being minimized.","You still need the repeated downside, not just the posture.")
        ]),
        node("pain-and-consequence","network-blindness","pr","Find the network blind spot","\"What part of the supplier or program network stays least visible today: N-tier mapping, supplier health, consequence path, or response ownership?\"","Use this when the problem sounds like missing visibility.",false,[
          branch("N-TIER GAP","ok","\"We do not see deep enough into the network to know where risk is compounding.\"","\"When that gap matters, what downstream decision gets weaker first?\"",[
            jumpNode("Name the consequence", "pain-and-consequence", "operational-consequence", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "risk-proof", "blu")
          ],"Network depth is part of the missing truth.","You still need the decision that suffers first."),
          branch("FRESHNESS GAP","ly","\"We eventually know enough, but not early enough to act well.\"","\"What does that delay actually cost: slower response, wrong sourcing move, or poor planning?\"",[
            jumpNode("Quantify the consequence", "pain-and-consequence", "reactive-firefight", "org"),
            jumpNode("Set the proof bar", "proof-threshold", "risk-proof", "blu")
          ],"The problem may be timing more than coverage.","You still need the downside of late truth."),
          branch("OWNERSHIP GAP","fl","\"The data exists, but no one owns the response clearly.\"","\"Then where does the response stall first when the signal lands?\"",[
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Use one disruption", "current-state-truth", "live-example", "blu")
          ],"The blind spot may be response ownership, not data.","You still need the stalled response path.")
        ]),
        node("pain-and-consequence","reactive-firefight","fu","Quantify the reactive firefight","\"When the team has to scramble, what does it actually spend: time, premium freight, working capital, lost output, or leadership attention?\"","Use this when they name consequence but not scale.",false,[
          branch("COST IS REAL","ok","\"The scramble burns real money, attention, and operational confidence.\"","\"Who feels that pain first: plant operations, procurement, finance, or leadership?\"",[
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Test urgency", "trigger-and-urgency", "recent-event", "blu")
          ],"The firefight cost is now attached to business pain.","You still need the accountable owner."),
          branch("COST IS HARD TO SIZE","ly","\"It is real, but hard to quantify cleanly.\"","\"Ballpark it for me. Is this a nuisance, or something people escalate upward when it happens?\"",[
            jumpNode("Test urgency", "trigger-and-urgency", "recent-event", "org"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The cost is real but still fuzzy.","You still need scale or escalation evidence."),
          branch("MOSTLY STRESS","fl","\"It mostly creates stress more than a hard number.\"","\"Whose number or operational target is most likely to miss when that stress repeats?\"",[
            jumpNode("Return to consequence", "pain-and-consequence", "operational-consequence", "red"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Stress is hiding a business consequence.","You still need the target that gets hit.")
        ])
      ]),
      segment("trigger-and-urgency","04","Trigger and urgency","Find why this matters now.",true,[
        node("trigger-and-urgency","recent-event","ri","Use the recent disruption or mandate","\"What changed recently that made this worth attention now instead of next quarter: disruption, geopolitical risk, cyber incident, ESG mandate, sourcing failure, or executive pressure?\"","Start here when there is active momentum.",true,[
          branch("CLEAR TRIGGER","ok","\"A real event or mandate forced this out of the background.\"","\"What deadline or operational moment makes that pressure active right now?\"",[
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"There is a real forcing event.","You still need the deadline and owner of the pressure."),
          branch("GENERAL RESILIENCE PUSH","ly","\"This sits inside a broader resilience or procurement push.\"","\"What made this workflow rise above the rest inside that bigger push?\"",[
            jumpNode("Return to consequence", "pain-and-consequence", "operational-consequence", "org"),
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Urgency may be real but still generic.","You still need the specific forcing event."),
          branch("NO LIVE EVENT","fl","\"Nothing specific happened. We just know we need to get better.\"","\"Then what would have to happen before this became a live operational priority instead of a good idea?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"There may be no active forcing event.","You still need the future trigger or an honest downgrade.")
        ]),
        node("trigger-and-urgency","soft-trigger","pr","If urgency is soft","\"If nothing changed in the next six months, what would get more fragile first: supply continuity, cost, supplier visibility, or leadership confidence?\"","Use this when they want improvement but not urgency.",false,[
          branch("FUTURE COST","ok","\"The current posture would get materially riskier or more expensive.\"","\"Who feels that early enough to sponsor change before the next disruption lands?\"",[
            jumpNode("Find the owner", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "scenario-proof", "blu")
          ],"There is future cost even if today is calm.","You still need the owner who cares enough now."),
          branch("ONLY NICE TO HAVE","ly","\"It would mostly just be better to have.\"","\"Then this may still be early. What would have to become true before it stopped being optional?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "org"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The case may be idea-stage only.","You still need the threshold that would make it real."),
          branch("NO FUTURE COST","fl","\"Nothing really changes if we wait.\"","\"Then the call should stay honest. Who would tell you first if that changed?\"",[
            jumpNode("Find the owner", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"There is no pressure worth forcing.","You still need the watchpoint or an explicit no.")
        ]),
        node("trigger-and-urgency","exploratory","fu","Keep an exploratory call honest","\"If this is still early, what would have to happen before the organization treated supplier risk or resilience modeling as a real operating priority?\"","Use this when urgency is not active.",false,[
          branch("TRIGGER NAMED","ok","\"A disruption, board question, cyber event, or sourcing miss would make it active immediately.\"","\"Good. Then the right next step is to anchor on the earliest warning sign before that happens.\"",[
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "grn"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"The future trigger is now named.","You still need the signal that would prove it is starting."),
          branch("NO TRIGGER YET","ly","\"We are not there yet.\"","\"Understood. Then leave with the right watchpoint instead of a fake next step.\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "org"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The call should stay light and honest.","You still need the reason to re-open later."),
          branch("WRONG PERSON","fl","\"Leadership would have to answer that.\"","\"Then the fastest truth is getting that owner into the next conversation instead of guessing here.\"",[
            jumpNode("Find the owner", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Shape the next review", "next-step-lock", "live-review", "blu")
          ],"The trigger owner is not in the room.","You still need the right leadership seat.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Stakeholder and ownership","Find who can move this.",true,[
        node("stakeholder-and-ownership","owner-split","pr","Map the owner split","\"Who feels the problem first today: supply chain ops, procurement, manufacturing, a resilience office, finance, or program leadership?\"","Start here once consequence and trigger are visible.",true,[
          branch("OPS LEADS","ok","\"Operations or supply chain owns the downside because continuity is the main issue.\"","\"Good. What would they need to believe before changing the current planning or review cadence?\"",[
            jumpNode("Set scenario proof", "proof-threshold", "scenario-proof", "grn"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"Operations is a real pain owner.","You still need the proof bar that would move them."),
          branch("PROCUREMENT LEADS","ly","\"Procurement or supplier risk owns most of this today.\"","\"Is that because the problem is monitoring and diligence, or because procurement is carrying consequence for the rest of the org?\"",[
            jumpNode("Map procurement path", "stakeholder-and-ownership", "procurement-path", "org"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"Procurement is central, but the exact role is still unclear.","You still need whether this is diligence or resilience."),
          branch("NO CLEAR OWNER","fl","\"It is split across too many groups.\"","\"Then the next move is not product. It is finding the first leader who pays most when the response is late.\"",[
            jumpNode("Find the wrong owner", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Shape the next review", "next-step-lock", "live-review", "blu")
          ],"Ownership is fragmented or absent.","You still need the first real economic owner.")
        ]),
        node("stakeholder-and-ownership","procurement-path","fu","Map the procurement path","\"What exactly does procurement own here: supplier diligence, sourcing decisions, executive risk visibility, or the full response motion?\"","Use this whenever procurement is named early.",false,[
          branch("DILIGENCE ONLY","ok","\"Procurement mainly owns supplier diligence and risk review.\"","\"Then who pays when diligence is clean but operations still gets surprised later?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Return to consequence", "pain-and-consequence", "operational-consequence", "blu")
          ],"Procurement owns only part of the problem.","You still need the downstream consequence owner."),
          branch("PROCUREMENT IS BUYER","ly","\"Procurement drives the workflow and the buying motion.\"","\"What would procurement need to prove before the operating teams trust the change?\"",[
            jumpNode("Set risk proof", "proof-threshold", "risk-proof", "org"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"Procurement may be the real operator and evaluator.","You still need the proof bar they will trust."),
          branch("OPS PUSHBACK","fl","\"Procurement cares, but operations still has to buy in.\"","\"Then the next review has to put both in the room around one live supplier or program path.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "red"),
            jumpNode("Shape the attendees", "next-step-lock", "attendee-shape", "blu")
          ],"Cross-functional trust is part of the buying path.","You still need the smallest shared proving ground.")
        ]),
        node("stakeholder-and-ownership","wrong-owner","ri","If the wrong owner is in the room","\"Whose voice do we need next so this becomes a real supply-chain operating conversation instead of an informational tour?\"","Use this when the current contact cannot own pressure or proof.",false,[
          branch("RIGHT PERSON KNOWN","ok","\"We need supply chain ops, procurement leadership, or the resilience owner in the next session.\"","\"Good. Then shape that review around one live supplier or disruption path so it earns the time.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The missing seat is visible.","You still need the reason they would attend."),
          branch("PLANT OR PROGRAM FIRST","ly","\"A plant leader or program owner probably needs to go first.\"","\"Fine. Then the next review should pressure-test one local path before broad executive escalation.\"",[
            jumpNode("Choose the path", "next-step-lock", "scope-path", "org"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"A smaller proving scope may come first.","You still need the exact plant, program, or supplier path."),
          branch("NO IDEA","fl","\"I am not sure who that should be.\"","\"Then the fastest question is simple: who gets blamed first when the current picture is wrong late?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"The org map is still fuzzy.","You still need the accountability line.")
        ])
      ]),
      segment("proof-threshold","06","Proof threshold","Find what would make them believe.",true,[
        node("proof-threshold","real-proof","pr","Name the real proof bar","\"What would make this feel real to your team: live supplier-risk visibility, credible scenario modeling, a cleaner response motion, or all three?\"","Start here when the buyer says they need proof.",true,[
          branch("RISK VISIBILITY","ok","\"We need fresher, more trustworthy supplier signal on our own network.\"","\"Good. Then the next review should prove that on live suppliers, not in generic dashboards.\"",[
            jumpNode("Set risk proof", "proof-threshold", "risk-proof", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"This is primarily a monitoring / visibility proof bar.","You still need the supplier set and the consumer of that signal."),
          branch("SCENARIO MODELING","ly","\"We need to trust the consequence model before this matters.\"","\"Good. What real decision should the model help the team make earlier than today?\"",[
            jumpNode("Set scenario proof", "proof-threshold", "scenario-proof", "org"),
            jumpNode("Use one disruption", "current-state-truth", "live-example", "blu")
          ],"This is primarily a planning / simulation proof bar.","You still need the decision that the model should improve."),
          branch("USABLE OUTPUT","fl","\"We need to know the output is usable by the actual team.\"","\"Then who has to use it first: procurement, operations, resilience, or leadership?\"",[
            jumpNode("Set workflow proof", "proof-threshold", "workflow-proof", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Proof is about adoption and operating fit.","You still need the first real user.")
        ]),
        node("proof-threshold","risk-proof","fu","If the motion is monitoring","\"What signal would the team have to trust on live suppliers before this feels better than the current risk view?\"","Use this when the buyer lives on the reactive / monitoring side.",false,[
          branch("FRESHNESS","ok","\"We need fresher alerts and a clearer picture of supplier health changes.\"","\"What action should those alerts drive faster than today?\"",[
            jumpNode("Return to consequence", "pain-and-consequence", "operational-consequence", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Freshness is part of the proof bar.","You still need the action the signal should trigger."),
          branch("TRUST IN SCORES","ly","\"We need to trust the scoring or risk classification enough to act.\"","\"What would make the team trust it: source quality, transparency, or better correlation to real events?\"",[
            jumpNode("Test the current stack", "current-vendor-and-displacement", "tool-stack", "org"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Trust in the risk model is central.","You still need the validation method."),
          branch("TOO MANY ALERTS","fl","\"We already get alerts. We need them to be useful.\"","\"Useful how: fewer false alarms, faster prioritization, or clearer escalation paths?\"",[
            jumpNode("Return to supplier review", "current-state-truth", "supplier-review", "red"),
            jumpNode("Set workflow proof", "proof-threshold", "workflow-proof", "blu")
          ],"Signal volume is not the issue; actionability is.","You still need the manager decision that improves.")
        ]),
        node("proof-threshold","scenario-proof","ri","If the motion is planning","\"What would make the scenario output credible enough that the team would actually use it in planning, sourcing, or continuity reviews?\"","Use this when the buyer is proactive / simulation-led.",false,[
          branch("DECISION GRADE OUTPUT","ok","\"It has to help us make a real planning decision with more confidence than today.\"","\"Which decision first: inventory, sourcing, production continuity, or supplier response?\"",[
            jumpNode("Use one disruption", "current-state-truth", "live-example", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"The model must improve a real decision, not just show possibility.","You still need the first decision to pressure-test."),
          branch("MODEL TRUST","ly","\"We would need to trust the assumptions and consequence logic.\"","\"Then what would make the model trustworthy here: data depth, transparency, or accuracy against a recent event?\"",[
            jumpNode("Test the stack", "current-vendor-and-displacement", "tool-stack", "org"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Model credibility is the core gate.","You still need the benchmark they will trust."),
          branch("OUTPUT USABILITY","fl","\"The model is interesting only if the team can act from it quickly.\"","\"Then who has to act from it first, and what move should it help them make?\"",[
            jumpNode("Set workflow proof", "proof-threshold", "workflow-proof", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Output usability matters as much as model quality.","You still need the first user and first action.")
        ]),
        node("proof-threshold","workflow-proof","va","If proof is about operating fit","\"What would tell you the workflow got materially better: faster prioritization, clearer escalation, earlier planning, or fewer manual stitches?\"","Use this when the buyer cares more about operating motion than raw data.",false,[
          branch("CLEAR WORKFLOW SHIFT","ok","\"The team should stop stitching the picture together manually every time something moves.\"","\"Good. Then the next review has to show that on one real path, not just promise it.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "grn"),
            jumpNode("Choose the path", "next-step-lock", "scope-path", "blu")
          ],"Workflow change is part of the proof bar.","You still need the proving ground."),
          branch("MIXED PROOF","ly","\"Part of it is data trust and part of it is workflow fit.\"","\"Which one kills this faster if it stays weak?\"",[
            jumpNode("Set risk proof", "proof-threshold", "risk-proof", "org"),
            jumpNode("Set scenario proof", "proof-threshold", "scenario-proof", "blu")
          ],"There are multiple proof dimensions.","You still need the primary kill switch."),
          branch("NO PROOF BAR","fl","\"We would know it when we see it.\"","\"That usually kills momentum. What has to be true in the next review for this to earn another one?\"",[
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "red"),
            jumpNode("Lock a real next step", "next-step-lock", "live-review", "blu")
          ],"The proof threshold is dangerously vague.","You still need an explicit advancement rule.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor and displacement","Test why the current stack still wins.",false,[
        node("current-vendor-and-displacement","tool-stack","ri","Map the current stack","\"What is doing the work today: ERP, supplier risk tools, spreadsheets, PLM, consultants, alerts, or manual escalation?\"","Start here once they say they already have tooling.",true,[
          branch("STACK MIX CLEAR","ok","\"It is a mix of systems plus people translating the picture manually.\"","\"Which part gives the team the false sense that the risk picture is handled when it actually is not?\"",[
            jumpNode("Return to blind spot", "pain-and-consequence", "network-blindness", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The incumbent stack is visible as a patchwork, not a unified operating layer.","You still need the false-confidence layer."),
          branch("POINT TOOL DEFENSE","ly","\"We already have a supplier intelligence or alerting layer.\"","\"What still forces the team to leave that tool and build the real answer elsewhere?\"",[
            jumpNode("Map the stitching", "current-state-truth", "stitching", "org"),
            jumpNode("Return to consequence", "pain-and-consequence", "operational-consequence", "blu")
          ],"The current tool may only solve part of the problem.","You still need the manual escape hatch."),
          branch("SPREADSHEET CULTURE","fl","\"Spreadsheets still run most of it.\"","\"Then where do spreadsheets fail first: freshness, scale, consequence modeling, or cross-team response?\"",[
            jumpNode("Return to stitching", "current-state-truth", "stitching", "red"),
            jumpNode("Return to blind spot", "pain-and-consequence", "network-blindness", "blu")
          ],"The incumbent may be spreadsheet-centric.","You still need the first decision that suffers from it.")
        ]),
        node("current-vendor-and-displacement","internal-motion","fu","If they built the motion themselves","\"What does the current internal process do well today, and where does it still fail to make the organization earlier or safer?\"","Use this when they have a homegrown workflow.",false,[
          branch("INTERNAL WORKFLOW PARTIAL","ok","\"It covers pieces of the response, but we still stitch the hard parts manually.\"","\"Then we are not replacing recordkeeping. We are replacing the manual operating layer still wrapped around it.\"",[
            jumpNode("Return to stitching", "current-state-truth", "stitching", "grn"),
            jumpNode("Set workflow proof", "proof-threshold", "workflow-proof", "blu")
          ],"The internal motion covers only part of the job.","You still need the missing operating layer."),
          branch("POLITICAL RISK","ly","\"There is sunk cost in how we do this today.\"","\"Understood. What outcome would be strong enough to justify changing that cadence anyway?\"",[
            jumpNode("Return to consequence", "pain-and-consequence", "operational-consequence", "org"),
            jumpNode("Map the stall", "decision-architecture", "stall-map", "blu")
          ],"Politics are part of the displacement cost.","You still need the result that beats sunk cost."),
          branch("GOOD ENOUGH","fl","\"The current process is mostly working.\"","\"Then what still made this meeting worth taking?\"",[
            jumpNode("Return to trigger", "trigger-and-urgency", "recent-event", "red"),
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "blu")
          ],"The incumbent may still be winning.","You still need the live scope or an honest no.")
        ]),
        node("current-vendor-and-displacement","switch-risk","va","Test switching risk","\"What would make changing this motion feel dangerous: supplier onboarding, data normalization, trust in the model, or changing the planning cadence?\"","Use this to expose the real blocker.",false,[
          branch("DATA TRUST RISK","ok","\"If the data or model is wrong, the team will stop trusting it fast.\"","\"Then the next review has to prove trust on live suppliers or a real scenario path.\"",[
            jumpNode("Set risk proof", "proof-threshold", "risk-proof", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Trust in the data or model is the key blocker.","You still need the benchmark they will trust."),
          branch("WORKFLOW CHANGE RISK","ly","\"Changing the planning or response cadence is the bigger risk.\"","\"Then we need the smallest proving scope that changes one real decision without destabilizing the rest.\"",[
            jumpNode("Choose the path", "next-step-lock", "scope-path", "org"),
            jumpNode("Set workflow proof", "proof-threshold", "workflow-proof", "blu")
          ],"Adoption risk sits in weekly rhythm, not just data.","You still need the narrowest safe scope."),
          branch("INERTIA","fl","\"Mostly it is inertia.\"","\"Inertia usually means the pain or sponsor is still too weak. Which one is true here?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Return to consequence", "pain-and-consequence", "operational-consequence", "blu")
          ],"The blocker may be weak urgency rather than true switching cost.","You still need the real source of inertia.")
        ])
      ]),
      segment("decision-architecture","08","Decision architecture","Map how this actually moves.",false,[
        node("decision-architecture","buying-path","pr","Map the buying path","\"If this became real, who would sponsor, who would evaluate, and who could slow or stop it?\"","Start here once sponsor and proof are partly visible.",true,[
          branch("PATH CLEAR","ok","\"Supply chain or operations would sponsor, procurement would shape it, and IT or finance would come in later.\"","\"Good. What would procurement or operations have to prove before this becomes real?\"",[
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"The path from sponsor to evaluator is visible.","You still need the gate that turns evaluation into motion."),
          branch("PATH SPLIT","ly","\"Operations feels the pain, but procurement and finance will complicate it.\"","\"Which of those can actually stop this if the proof is strong?\"",[
            jumpNode("Map the stall", "decision-architecture", "stall-map", "org"),
            jumpNode("Shape the attendees", "next-step-lock", "attendee-shape", "blu")
          ],"There are competing stakeholder logics.","You still need the true veto point."),
          branch("PATH UNKNOWN","fl","\"We are too early to know the full path.\"","\"That is fine. Who definitely has to believe this first for the path to matter at all?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"Decision architecture is still fuzzy.","You still need the first internal believer.")
        ]),
        node("decision-architecture","stall-map","fu","Name the stall point","\"Where do motions like this usually slow down internally: data trust, procurement process, IT review, finance skepticism, or leadership attention?\"","Use this when the path exists but feels fragile.",false,[
          branch("DATA TRUST GATE","ok","\"People will challenge the credibility of the data or model first.\"","\"Then the next review should be built around a live supplier or scenario path they already question.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"Data or model trust is the gate.","You still need the benchmark they will trust."),
          branch("PROCUREMENT OR IT","ly","\"Procurement process or IT overhead will slow it down.\"","\"Then what has to be true in the next review so that overhead feels justified?\"",[
            jumpNode("Choose the path", "next-step-lock", "scope-path", "org"),
            jumpNode("Set workflow proof", "proof-threshold", "workflow-proof", "blu")
          ],"The blocker may be process overhead rather than disbelief.","You still need the scope that justifies escalation."),
          branch("ATTENTION RISK","fl","\"Nothing formal kills it. It just loses oxygen.\"","\"Then the next step has to be concrete enough that it cannot hide in polite interest.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "recent-event", "blu")
          ],"Attention risk is the real danger.","You still need a next step that earns gravity.")
        ]),
        node("decision-architecture","government-link","ri","If the context is regulated or defense-linked","\"Does any defense, government, cyber, or regulatory context change how cautious the buying path becomes here?\"","Use this when the prospect sounds highly regulated.",false,[
          branch("HIGH GOVERNANCE","ok","\"Yes. Governance and trust thresholds are higher here.\"","\"Then the next review has to prove not just insight, but whether the operating model is safe enough to trust.\"",[
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "grn"),
            jumpNode("Shape the attendees", "next-step-lock", "attendee-shape", "blu")
          ],"Governance burden is part of the buying path.","You still need the first safe proving scope."),
          branch("NORMAL ENTERPRISE","ly","\"Not really. It is still mostly a normal enterprise buying path.\"","\"Good. Then do not overcomplicate the next review. Keep it operational and narrow.\"",[
            jumpNode("Choose the path", "next-step-lock", "scope-path", "org"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Governance does not dominate the path.","You still need the right narrow scope."),
          branch("UNKNOWN","fl","\"We have not thought that far ahead.\"","\"That is fine. Then the immediate job is simpler: earn one serious review with the right operator and proof path.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Later-stage governance is premature.","You still need the first serious internal review.")
        ])
      ]),
      segment("next-step-lock","09","Next-step lock","Leave with a real review.",true,[
        node("next-step-lock","live-review","pr","Lock the resilience review","\"The next best step sounds like a live review with operations, procurement, and one real supplier or disruption path. Does that fit how your team would validate this?\"","Start here whenever proof points to a live review.",true,[
          branch("YES LOCK IT","ok","\"Yes. That is the right shape.\"","\"Good. Which supplier, program, or disruption path should we pressure-test so the review earns the time?\"",[
            jumpNode("Choose the path", "next-step-lock", "scope-path", "grn"),
            jumpNode("Shape the attendees", "next-step-lock", "attendee-shape", "blu")
          ],"The next review format is agreed.","You still need the exact path and seats."),
          branch("NEEDS NARROWER START","ly","\"Close, but start with one function or one path first.\"","\"That works. Which narrower path still gives us a real operating problem instead of a generic walkthrough?\"",[
            jumpNode("Choose the path", "next-step-lock", "scope-path", "org"),
            jumpNode("Shape the attendees", "next-step-lock", "attendee-shape", "blu")
          ],"The review shape needs tuning, not replacement.","You still need the narrowest real proving ground."),
          branch("TOO EARLY","fl","\"That feels like too much for where we are.\"","\"Understood. Then what would make the next step real enough to keep momentum without pretending we are further along than we are?\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "blu")
          ],"The buyer is not ready for a full review yet.","You still need a lighter but real progression step.")
        ]),
        node("next-step-lock","scope-path","fu","Choose the path","\"What should anchor the review: one supplier set, one disruption scenario, one plant or program path, or one procurement diligence workflow?\"","Use this to stop the next step from becoming generic.",false,[
          branch("SUPPLIER SET","ok","\"Use the supplier set or risk cluster the team already debates.\"","\"Perfect. That makes the review real immediately.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The proving ground is concrete.","You still need the exact attendees and calendar hold."),
          branch("PLANT OR PROGRAM","ly","\"Start with one plant, program, or sourcing path before going broader.\"","\"That is a strong first scope. Who owns that path enough to make the session honest?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "org"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"A narrower proving path may be safer.","You still need the right owner and the date."),
          branch("NO PATH YET","fl","\"We do not know which path to use yet.\"","\"Then the next step is not locked. Who can pick that path before the meeting goes on calendar?\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The next review is still underspecified.","You still need the owner of the proving path.")
        ]),
        node("next-step-lock","attendee-shape","ri","Shape the attendee list","\"Who has to be in that next review for the outcome to matter: operations, procurement, resilience, finance, or someone else?\"","Use this to keep the meeting from getting decorative.",false,[
          branch("RIGHT PEOPLE NAMED","ok","\"Operations and procurement need to be there. Others can come later if the review hits.\"","\"Good. Then this is close to lockable.\"",[
            jumpRoom("Open Call Planner", "call-planner", "grn"),
            jumpNode("Write the handoff", "post-call-routing", "handoff", "blu")
          ],"The review has the right seats.","You still need the date and owner."),
          branch("EXEC NEEDED NOW","ly","\"Leadership or finance should be there from the start.\"","\"Fine. Then the agenda has to stay tight and proof-led so the session earns that altitude.\"",[
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "org"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The meeting is executive-weighted.","You still need the proof question to justify it."),
          branch("ATTENDEES UNCLEAR","fl","\"We can figure that out later.\"","\"That usually kills momentum. Who owns deciding the attendee list before the follow-up goes out?\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The meeting is not really locked yet.","You still need the owner of the invite list.")
        ]),
        node("next-step-lock","soft-deferral","va","If the next step stays soft","\"What has to become true before the next conversation earns real calendar gravity?\"","Use this when they want to stay polite but noncommittal.",false,[
          branch("ADVANCEMENT CONDITION","ok","\"If we can pressure-test one live path with the right people, it earns the next session.\"","\"That is enough. Let us route that exact condition forward.\"",[
            jumpNode("Write the handoff", "post-call-routing", "handoff", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"A real advancement condition is now named.","You still need to carry it forward cleanly."),
          branch("SEND MATERIAL","ly","\"Send material and we will see.\"","\"I will, but I want to attach it to the one decision you still need to make, not a generic deck. What is that decision?\"",[
            jumpNode("Write the handoff", "post-call-routing", "handoff", "org"),
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "blu")
          ],"The buyer is deferring without a clear gate.","You still need the decision the material should support."),
          branch("NO REAL NEXT","fl","\"Nothing specific. We just need to think.\"","\"Then I would rather leave with the honest blocker than pretend we have a next step. What is still missing?\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"Momentum is still too soft to trust.","You still need the missing truth in plain language.")
        ])
      ]),
      segment("post-call-routing","10","Post-call routing","Hand off only what helps.",false,[
        node("post-call-routing","handoff","cl","Write the handoff","\"If the next room picked this up cold, what would it need to know in the first 30 seconds?\"","Use this to strip the call down to usable supply-chain truth.",false,[
          branch("HANDOFF CLEAN","ok","\"Carry the live path, owner split, proof bar, and next review condition.\"","\"Good. Keep only what changes the next move.\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "grn"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The handoff can now start from signal instead of notes.","You still need the one missing truth to chase."),
          branch("HANDOFF TOO VERBAL","ly","\"We have a lot of detail, but not a clean signal yet.\"","\"Then throw away anything that does not change the next review question. What is actually usable?\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "org"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The raw detail exists, but the usable signal is still diluted.","You still need the distilled pressure and route."),
          branch("NO HANDOFF HABIT","fl","\"We do not really capture this cleanly today.\"","\"Then the minimum capture rule is simple: owner, pressure, proof bar, next condition.\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The handoff discipline itself is weak.","You still need the one capture rule that sticks.")
        ]),
        node("post-call-routing","missing-truth","fu","Name the missing truth","\"What is still missing that the next room has to chase directly before this becomes real?\"","Use this so the handoff carries a chase-down target.",false,[
          branch("MISSING TRUTH CLEAR","ok","\"We still need the live path, the right owner seat, or the proof benchmark.\"","\"Good. Then route the call to the room most likely to surface that fast.\"",[
            jumpNode("Choose the next room", "post-call-routing", "room-route", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The missing truth is clearly named.","You still need the room best suited to chase it."),
          branch("MISSING OWNER","ly","\"We know the gap, but not who can answer it.\"","\"Then the next room should start with the owner map, not another product conversation.\"",[
            jumpRoom("Open Call Planner", "call-planner", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The truth gap is visible but ownerless.","You still need the best route to the right person."),
          branch("TOO THIN","fl","\"Too much is still vague.\"","\"Then do not pretend this is a healthy progression. Name the drift now and correct it before the next disruption teaches the lesson the hard way.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The call may need correction more than continuation.","You still need the clearest failure pattern.")
        ]),
        node("post-call-routing","room-route","pr","Choose the next room","\"Which next room gives the strongest immediate leverage: shape the next review, attach truth to the live path, or name the failure pattern before it repeats?\"","Use this to route with intent instead of habit.",false,[
          branch("CALL PLANNER","ok","\"The next move is a tighter resilience review with a clearer proving question.\"","\"Then route this to Call Planner with the live path, owner map, and proof bar.\"",[
            jumpRoom("Open Call Planner", "call-planner", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The next room is conversational and tactical.","You still need the forcing question in plain language."),
          branch("DEAL WORKSPACE","ly","\"There is already a live supplier, program, or sourcing path here.\"","\"Then attach the what is actually happening to that path immediately before the story drifts again.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
            jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
          ],"The truth belongs with a live operating object.","You still need the top risk to carry with it."),
          branch("FUTURE AUTOPSY","fl","\"This still feels like reactive drift or decorative motion.\"","\"Then route it to Future Autopsy now and name the failure pattern before the next disruption hides it again.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The next room may need to correct drift, not advance motion.","You still need the failure pattern in plain language.")
        ])
      ])
    ]
  };
})();
