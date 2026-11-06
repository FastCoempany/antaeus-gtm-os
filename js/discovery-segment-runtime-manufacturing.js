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
    { title:"Operational consequence", items:["Line-down risk or missed OTIF on the supplier under discussion", "Cash tied up the last time a disruption was handled by hand", "Whether supply risk gets reported to leadership and the board, or stays stuck in a spreadsheet"] },
    { title:"What they need to see", items:["Accuracy of the supplier or N-tier map against what their ERP knows", "Credibility of one scenario they already simulated internally", "Freshness of monitoring signal on a supplier they care about right now"] },
    { title:"Decision path", items:["Supply chain risk or resilience owner who feels the disruption cost", "Procurement or sourcing lead who owns the supplier relationship", "Operations / manufacturing executive who absorbs the downstream pain"] }
  ];
  var objectionLibrary = [
    { trigger:"we already monitor suppliers", reply:"Good. Which supplier surprised you most in the last 18 months, and what was your monitoring showing the week before?" },
    { trigger:"we have an ERP for this", reply:"Your ERP shows what you bought. It usually does not warn you which supplier is about to miss a delivery. Walk me through how a real disruption becomes visible today." },
    { trigger:"just send a dashboard", reply:"Happy to. First tell me which decision the dashboard is supposed to inform — supply resilience, supplier checks, sourcing, or reporting to leadership — because the dashboards for each are different." },
    { trigger:"data is too messy for this to work", reply:"Fair. Then the first question is not about our product. It is whether the supplier data is good enough for anyone — internal or external — to run a risk system on. What state is it in?" }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from Craft or Vantive?", bridge:"Depends on which problem you are solving. Craft-style is reactive supplier intelligence; Vantive-style is proactive scenario planning. Which one does your team actually need this quarter?" },
    { question:"Can you map N-tier suppliers?", bridge:"In many cases yes, but the real question is whether N-tier visibility would change a decision you are making. Which tier-two supplier surprise cost you most recently?" },
    { question:"What about cybersecurity and ESG risk?", bridge:"Both are real risks. What matters is whether leadership is already asking about either one — if not, adding it now won't change much." }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing makes sense once we know whether the last disruption was expensive enough to justify changing the review process. What did that one cost?" },
    { trigger:"asks for demo too early", reply:"I can show it. First tell me which supplier or scenario you would want the demo to handle — otherwise it becomes a tour instead of a test." },
    { trigger:"wants technical integration detail", reply:"Integration only matters if the supply risk problem is costly enough to fix. Which operational decision would this need to support first?" }
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
        title:"Classify the workflow",
        copy:"Separate proactive scenario planning from reactive supplier monitoring first.",
        action:jumpNode("Ask which problem is most urgent", "opening-frame", "motion-type", "blu")
      },
      {
        title:"Anchor on one disruption",
        copy:"Use one supplier or program event instead of abstract resilience language.",
        action:jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "org")
      },
      {
        title:"Lock the resilience review",
        copy:"Leave with operations, procurement, and one live risk path named.",
        action:jumpNode("Book the next review meeting", "next-step-lock", "live-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"already-monitor-suppliers",
        label:"We already monitor suppliers",
        reply:"That helps. I am trying to learn whether you need better monitoring, or whether you still cannot see what a disruption would cost before it hits.",
        actions:[
          jumpNode("Ask which problem is most urgent", "opening-frame", "motion-type", "blu"),
          jumpNode("Ask what the problem costs them", "pain-and-consequence", "operational-consequence", "org")
        ]
      },
      {
        id:"we-live-in-erp",
        label:"Everything already sits in ERP",
        reply:"ERP gives you the records. It usually does not show what a decision actually needs: the risk, what it would cost, and how fast you have to respond. Where do people still piece the picture together by hand?",
        actions:[
          jumpNode("Ask what they piece together by hand", "current-state-truth", "stitching", "blu"),
          jumpNode("Ask what they can't see in their supply chain", "pain-and-consequence", "network-blindness", "org")
        ]
      },
      {
        id:"just-show-platform",
        label:"Just show the platform",
        reply:"I can. First tell me whether you need to plan for disruptions ahead of time or react to supplier problems as they happen, so I do not show the wrong workflow.",
        actions:[
          jumpNode("Ask which problem is most urgent", "opening-frame", "motion-type", "blu"),
          jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "pur")
        ]
      },
      {
        id:"procurement-only",
        label:"This is really just procurement",
        reply:"Maybe. The question is whether this is supplier diligence only, or whether operations and manufacturing still pay for the consequences later.",
        actions:[
          jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "blu"),
          jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "org")
        ]
      },
      {
        id:"no-disruption-right-now",
        label:"Nothing is on fire right now",
        reply:"Good. Then the question is whether you only want supplier monitoring, or whether you also need to plan before the next disruption hits.",
        actions:[
          jumpNode("Ask what gets worse if nothing changes", "trigger-and-urgency", "soft-trigger", "red"),
          jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening","Find out which workflow this is about and who runs it.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most teams can monitor some suppliers. The real question is whether you can see what a supplier problem will cost early enough to act before it becomes expensive. Is that true for you too?\"","Use this when they're willing to talk through the problem before seeing the product.",true,[
          branch("CONFIRMS","ok","\"Yes. We see pieces of the picture, but the real risk still gets pieced together by hand.\"","\"Good. Is the bigger problem planning for disruptions ahead of time, or reacting to supplier problems as they happen?\"",[
            jumpNode("Ask which problem is most urgent", "opening-frame", "motion-type", "grn"),
            jumpNode("Ask what they piece together by hand", "current-state-truth", "stitching", "blu")
          ],"People still piece things together by hand today.","You still need the proactive vs reactive split."),
          branch("TOOL DEFENSE","ly","\"We already have ERP views, alerts, and supplier tools.\"","\"Understood. Then where does the picture still break down: seeing supplier problems, working out what they would cost, or getting teams to respond together?\"",[
            jumpNode("Ask what they piece together by hand", "current-state-truth", "stitching", "org"),
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "blu")
          ],"The buyer is defending the stack, not denying the gap.","You still need the first broken decision layer."),
          branch("PITCH REQUEST","fl","\"Can you just show me the platform?\"","\"I can. First tell me whether this is about planning for disruptions ahead of time or reacting to supplier problems as they happen, so I do not show the wrong workflow.\"",[
            jumpNode("Ask which problem is most urgent", "opening-frame", "motion-type", "blu"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "pur")
          ],"The buyer has asked to see the product before describing the workflow.","You still need the active workflow before demo.")
        ]),
        node("opening-frame","motion-type","fu","Ask which problem is most urgent","\"Which side is more urgent today: spotting supplier risk earlier, or modeling consequence before the disruption hits?\"","Find this out early, because the rest of the call depends on it.",false,[
          branch("REACTIVE MONITORING","ok","\"We need better supplier visibility and alerting first.\"","\"Good. Then what signal is still late, incomplete, or too noisy to act on?\"",[
            jumpNode("Ask how they review suppliers today", "current-state-truth", "supplier-review", "grn"),
            jumpNode("Ask what they can't see in their supply chain", "pain-and-consequence", "network-blindness", "blu")
          ],"This is a reactive monitoring use case.","You still need the operational consequence of bad visibility."),
          branch("PROACTIVE PLANNING","ly","\"We need to understand consequence and plan around disruptions before they happen.\"","\"Good. What decision still gets made too late today because the organization cannot model impact early enough?\"",[
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "org"),
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "blu")
          ],"This is a proactive planning use case.","You still need the live planning failure."),
          branch("BOTH","fl","\"Honestly, it is both.\"","\"That is normal. Which one creates the first expensive miss today: weak visibility or weak consequence planning?\"",[
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "red"),
            jumpNode("Ask what they piece together by hand", "current-state-truth", "stitching", "blu")
          ],"The need spans both categories.","You still need the first visible failure.")
        ]),
        node("opening-frame","sideways","ri","If the call starts off-topic","\"If this is still early, that is fine. What made this worth looking at now instead of after the next sourcing cycle or disruption?\"","Use this when they are curious but not yet committed.",false,[
          branch("RECENT EVENT","ok","\"A disruption, supplier issue, or resilience mandate pushed this into the foreground.\"","\"Then let us start there. What part of the response failed first?\"",[
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "recent-event", "grn"),
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "blu")
          ],"There is a real trigger.","You still need the first operational break."),
          branch("GENERAL IMPROVEMENT","ly","\"We mostly want better visibility than we have today.\"","\"What do you want to see more clearly: supplier health, line-down risk, scenario impact, or procurement diligence?\"",[
            jumpNode("Ask how they review suppliers today", "current-state-truth", "supplier-review", "org"),
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "blu")
          ],"They are generally interested, but the scope is still broad.","You still need the first use case that matters."),
          branch("NOTHING URGENT","fl","\"Nothing is urgent. We are just exploring.\"","\"That is workable. What would have to happen before this became a real priority?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The call may be exploratory only.","You still need the threshold that would make this move.")
        ])
      ]),
      segment("current-state-truth","02","How they work today","Ask how they find out about supply or quality risk today.",true,[
        node("current-state-truth","stitching","fu","Ask what they piece together by hand","\"Walk me through how the team pieces together supplier risk or disruption consequence today. What systems, spreadsheets, and people still have to be pulled together before anyone trusts the picture?\"","Start here when they admit the workflow is fragmented.",true,[
          branch("STITCHING CLEAR","ok","\"It is ERP, supplier data, email, and spreadsheets, then someone assembles the picture manually.\"","\"Which part breaks first: data freshness, network visibility, or consequence modeling?\"",[
            jumpNode("Ask what they can't see in their supply chain", "pain-and-consequence", "network-blindness", "grn"),
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "blu")
          ],"You know how they piece things together today.","You still need the first broken decision layer."),
          branch("PARTLY CENTRALIZED","ly","\"We have a system, but people still step in whenever things get messy.\"","\"What type of mess forces the manual step-in first: supplier health, production impact, or cross-functional response?\"",[
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "org"),
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "blu")
          ],"There is tooling, but people still handle the hardest cases by hand.","You still need what makes people step in."),
          branch("NO CLEAR MAP","fl","\"It depends on the team and region.\"","\"Then pick the one supplier or program path leadership would care most about if it broke tomorrow.\"",[
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "red"),
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The workflow is fragmented by region or team.","You still need one real path to anchor the call.")
        ]),
        node("current-state-truth","supplier-review","pr","Ask how they review suppliers today","\"How is supplier health actually reviewed today: alerts, audits, spreadsheets, periodic business reviews, consultants, or manual escalation?\"","Use this when the buyer frames the problem as monitoring or diligence.",false,[
          branch("POINT TOOLS PLUS MANUAL","ok","\"We have alerts and risk tools, but people still have to translate them into action.\"","\"Which alert or score still fails to tell the team what to do next?\"",[
            jumpNode("Ask what they can't see in their supply chain", "pain-and-consequence", "network-blindness", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "risk-proof", "blu")
          ],"Monitoring exists, but they don't yet have a clear way to act on it.","You still need the signal that fails in practice."),
          branch("AUDIT CADENCE","ly","\"We rely on periodic reviews and manual follow-up.\"","\"What stays invisible between reviews that later becomes expensive?\"",[
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "org"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "recent-event", "blu")
          ],"They may review suppliers too rarely for the actual risk.","You still need the invisible period that matters."),
          branch("NO REAL SYSTEM","fl","\"Honestly, there is not a real system yet.\"","\"Then which decision is operating with the least trustworthy supplier picture right now?\"",[
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "red"),
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "blu")
          ],"The response may still be mostly manual.","You still need the first decision that suffers from it.")
        ]),
        node("current-state-truth","live-example","ri","Ask for one recent disruption","\"Give me one recent disruption, supplier warning, or sourcing decision where the organization did not have the picture early enough.\"","Use this when the conversation stays general.",false,[
          branch("LIVE EVENT READY","ok","\"We had a recent supplier or program event where the team reacted later than it should have.\"","\"What did the team not know early enough: the supplier risk, the operational consequence, or the response path?\"",[
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "grn"),
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "recent-event", "blu")
          ],"The call now has a real event to work from.","You still need the specific open question inside it."),
          branch("HYPOTHETICAL ONLY","ly","\"Nothing dramatic, but we can imagine where this would hurt.\"","\"Fine. Then which modeled downside worries the team most: line-down risk, missed OTIF, cost shock, or supplier failure?\"",[
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "org"),
            jumpNode("Agree what they need to see", "proof-threshold", "scenario-proof", "blu")
          ],"The case may be planning-driven rather than event-driven.","You still need the consequence worth planning against."),
          branch("NO EXAMPLE","fl","\"I do not have one on hand.\"","\"Then use the last moment leadership asked a hard question the current system could not answer quickly.\"",[
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "recent-event", "red"),
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The call is still too abstract.","You still need one real decision moment.")
        ])
      ]),
      segment("pain-and-consequence","03","The problem and its cost","Find out what a missed risk costs them in downtime, scrap, or late orders.",true,[
        node("pain-and-consequence","operational-consequence","ri","Ask what a late warning costs them","\"When the current picture is late or incomplete, what becomes expensive first: line-down risk, missed OTIF, working-capital distortion, revenue loss, compliance exposure, or cyber supplier risk?\"","Start here once you know where the work falls short.",true,[
          branch("CONSEQUENCE CLEAR","ok","\"We react late and the operational consequence becomes visible too late to shape the response well.\"","\"Which consequence hurts most in practice today?\"",[
            jumpNode("Ask what scrambling after a disruption costs", "pain-and-consequence", "reactive-firefight", "grn"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "blu")
          ],"A real consequence is now named.","You still need its dominant cost and owner."),
          branch("MAINLY EFFICIENCY","ly","\"It is mostly team time and coordination pain.\"","\"What business downside sits underneath that coordination pain if it stays unresolved?\"",[
            jumpNode("Ask what scrambling after a disruption costs", "pain-and-consequence", "reactive-firefight", "org"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The cost may still sound smaller than it is.","You still need the business downside beneath the process pain."),
          branch("NOTHING DRAMATIC","fl","\"Nothing catastrophic. It is just more reactive than we want.\"","\"What are you reacting to, and what does reacting late cost the business when it keeps happening?\"",[
            jumpNode("Ask what scrambling after a disruption costs", "pain-and-consequence", "reactive-firefight", "red"),
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "soft-trigger", "blu")
          ],"The pain is being minimized.","You still need the repeated downside, not just the posture.")
        ]),
        node("pain-and-consequence","network-blindness","pr","Ask what they can't see in their supply chain","\"What part of the supplier or program network stays least visible today: N-tier mapping, supplier health, consequence path, or response ownership?\"","Use this when the problem sounds like missing visibility.",false,[
          branch("N-TIER GAP","ok","\"We do not see deep enough into the network to know where risk is building up.\"","\"When that gap matters, what downstream decision gets weaker first?\"",[
            jumpNode("Ask what a late warning costs them", "pain-and-consequence", "operational-consequence", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "risk-proof", "blu")
          ],"Network depth is part of the open question.","You still need the decision that suffers first."),
          branch("FRESHNESS GAP","ly","\"We eventually know enough, but not early enough to act well.\"","\"What does that delay actually cost: slower response, wrong sourcing move, or poor planning?\"",[
            jumpNode("Ask what scrambling after a disruption costs", "pain-and-consequence", "reactive-firefight", "org"),
            jumpNode("Agree what they need to see", "proof-threshold", "risk-proof", "blu")
          ],"The problem may be timing more than coverage.","You still need the downside of late information."),
          branch("OWNERSHIP GAP","fl","\"The data exists, but no one owns the response clearly.\"","\"Then where does the response stall first when the signal comes in?\"",[
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "blu")
          ],"The blind spot may be response ownership, not data.","You still need the stalled response path.")
        ]),
        node("pain-and-consequence","reactive-firefight","fu","Ask what scrambling after a disruption costs","\"When the team has to scramble, what does it actually spend: time, premium freight, working capital, lost output, or leadership attention?\"","Use this when they name consequence but not scale.",false,[
          branch("COST IS REAL","ok","\"The scramble burns real money, attention, and operational confidence.\"","\"Who feels that pain first: plant operations, procurement, finance, or leadership?\"",[
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "recent-event", "blu")
          ],"The firefight cost is now attached to business pain.","You still need the accountable owner."),
          branch("COST IS HARD TO SIZE","ly","\"It is real, but hard to quantify cleanly.\"","\"Ballpark it for me. Is this a nuisance, or something people escalate upward when it happens?\"",[
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "recent-event", "org"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The cost is real but still fuzzy.","You still need scale or escalation evidence."),
          branch("MOSTLY STRESS","fl","\"It mostly creates stress more than a hard number.\"","\"Whose number or operational target is most likely to miss when that stress repeats?\"",[
            jumpNode("Go back to what a late warning costs", "pain-and-consequence", "operational-consequence", "red"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Stress is hiding a business consequence.","You still need the target that gets hit.")
        ])
      ]),
      segment("trigger-and-urgency","04","Why now","Find out what changed that makes this worth solving now.",true,[
        node("trigger-and-urgency","recent-event","ri","Ask what recent event made this urgent","\"What changed recently that made this worth attention now instead of next quarter: disruption, geopolitical risk, cyber incident, ESG mandate, sourcing failure, or executive pressure?\"","Start here when they are already moving on this.",true,[
          branch("CLEAR TRIGGER","ok","\"A real event or mandate forced this out of the background.\"","\"What deadline or operational moment makes that urgent right now?\"",[
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"There is a real trigger.","You still need the deadline and who owns the problem."),
          branch("GENERAL RESILIENCE PUSH","ly","\"This sits inside a broader resilience or procurement push.\"","\"What made this workflow rise above the rest inside that bigger push?\"",[
            jumpNode("Go back to what a late warning costs", "pain-and-consequence", "operational-consequence", "org"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Urgency may be real but still generic.","You still need the specific trigger."),
          branch("NO LIVE EVENT","fl","\"Nothing specific happened. We just know we need to get better.\"","\"Then what would have to happen before this became a live operational priority instead of a good idea?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"There may be no active trigger.","You still need the future trigger or an honest downgrade.")
        ]),
        node("trigger-and-urgency","soft-trigger","pr","If it doesn't sound urgent","\"If nothing changed in the next six months, what would get more fragile first: supply continuity, cost, supplier visibility, or leadership confidence?\"","Use this when they want improvement but not urgency.",false,[
          branch("FUTURE COST","ok","\"The way we work now would get noticeably riskier or more expensive.\"","\"Who feels that early enough to sponsor change before the next disruption hits?\"",[
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "scenario-proof", "blu")
          ],"There is future cost even if today is calm.","You still need the owner who cares enough now."),
          branch("ONLY NICE TO HAVE","ly","\"It would mostly just be better to have.\"","\"Then this may still be early. What would have to become true before it stopped being optional?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "org"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The case may be idea-stage only.","You still need the threshold that would make it real."),
          branch("NO FUTURE COST","fl","\"Nothing really changes if we wait.\"","\"Then the call should stay honest. Who would tell you first if that changed?\"",[
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"Nothing here is urgent enough to push yet.","You still need the watchpoint or an explicit no.")
        ]),
        node("trigger-and-urgency","exploratory","fu","If this is early research","\"If this is still early, what would have to happen before the organization treated supplier risk or resilience modeling as a real priority?\"","Use this when urgency is not active.",false,[
          branch("TRIGGER NAMED","ok","\"A disruption, board question, cyber event, or sourcing miss would make it active immediately.\"","\"Good. Then the right next step is to focus on the earliest warning sign before that happens.\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "grn"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"They named what would make this urgent later.","You still need the signal that would prove it is starting."),
          branch("NO TRIGGER YET","ly","\"We are not there yet.\"","\"Understood. Then leave with the right watchpoint instead of a fake next step.\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "org"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The call should stay light and honest.","You still need the reason to re-open later."),
          branch("WRONG PERSON","fl","\"Leadership would have to answer that.\"","\"Then the fastest answer is getting that owner into the next conversation instead of guessing here.\"",[
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "blu")
          ],"The trigger owner is not in the room.","You still need the right leadership seat.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Who's involved","Find out who owns the problem and who approves spend on it.",true,[
        node("stakeholder-and-ownership","owner-split","pr","Ask which team feels this first","\"Who feels the problem first today: supply chain ops, procurement, manufacturing, a resilience office, finance, or program leadership?\"","Start here once you know what it costs them and why it matters now.",true,[
          branch("OPS LEADS","ok","\"Operations or supply chain owns the downside because continuity is the main issue.\"","\"Good. What would they need to believe before changing the current planning or review cadence?\"",[
            jumpNode("Ask what would make a scenario plan usable", "proof-threshold", "scenario-proof", "grn"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"Operations really feels this problem.","You still need to know what evidence would move them."),
          branch("PROCUREMENT LEADS","ly","\"Procurement or supplier risk owns most of this today.\"","\"Is that because the problem is monitoring and diligence, or because procurement is carrying consequence for the rest of the org?\"",[
            jumpNode("Ask what procurement owns here", "stakeholder-and-ownership", "procurement-path", "org"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"Procurement matters a lot, but their exact role is still unclear.","You still need whether this is diligence or resilience."),
          branch("NO CLEAR OWNER","fl","\"It is split across too many groups.\"","\"Then the next step is not product. It is finding the first leader who pays most when the response is late.\"",[
            jumpNode("Ask who should be in the next conversation", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "blu")
          ],"Ownership is fragmented or absent.","You still need the first real economic owner.")
        ]),
        node("stakeholder-and-ownership","procurement-path","fu","Ask what procurement owns here","\"What exactly does procurement own here: supplier diligence, sourcing decisions, executive risk visibility, or the full response process?\"","Use this when procurement comes up early.",false,[
          branch("DILIGENCE ONLY","ok","\"Procurement mainly owns supplier diligence and risk review.\"","\"Then who pays when diligence is clean but operations still gets surprised later?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Go back to what a late warning costs", "pain-and-consequence", "operational-consequence", "blu")
          ],"Procurement owns only part of the problem.","You still need the downstream consequence owner."),
          branch("PROCUREMENT IS BUYER","ly","\"Procurement drives the workflow and the buying process.\"","\"What would procurement need to prove before the operating teams trust the change?\"",[
            jumpNode("Ask what supplier warning they would trust", "proof-threshold", "risk-proof", "org"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"Procurement may be the team that actually runs and evaluates this.","You still need to know what evidence they will trust."),
          branch("OPS PUSHBACK","fl","\"Procurement cares, but operations still has to buy in.\"","\"Then the next review has to bring both teams together around one real supplier or program.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "red"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "attendee-shape", "blu")
          ],"Several teams have to trust it before they buy.","You still need the smallest shared proving ground.")
        ]),
        node("stakeholder-and-ownership","wrong-owner","ri","If the wrong owner is in the room","\"Whose voice do we need next so this becomes a real conversation about how the supply chain runs, instead of an information session?\"","Use this when the current contact cannot own the problem or the evaluation.",false,[
          branch("RIGHT PERSON KNOWN","ok","\"We need supply chain ops, procurement leadership, or the resilience owner in the next session.\"","\"Good. Then shape that review around one live supplier or disruption path so it is worth the time.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"You know who is missing from the conversation.","You still need the reason they would attend."),
          branch("PLANT OR PROGRAM FIRST","ly","\"A plant leader or program owner probably needs to go first.\"","\"Fine. Then the next review should test one local path before broad executive escalation.\"",[
            jumpNode("Pick one supplier or scenario to review", "next-step-lock", "scope-path", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"A smaller test may need to come first.","You still need the exact plant, program, or supplier path."),
          branch("NO IDEA","fl","\"I am not sure who that should be.\"","\"Then the fastest question is simple: who gets blamed first when the current picture is wrong late?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"It is still unclear who does what in their organization.","You still need the accountability line.")
        ])
      ]),
      segment("proof-threshold","06","What they need to see","Agree on the test that would show it works on their data.",true,[
        node("proof-threshold","real-proof","pr","Ask what they need to see","\"What would make this feel real to your team: live supplier-risk visibility, credible scenario modeling, a cleaner response process, or all three?\"","Start here when the buyer says they need evidence.",true,[
          branch("RISK VISIBILITY","ok","\"We need fresher, more trustworthy supplier signal on our own network.\"","\"Good. Then the next review should prove that on live suppliers, not in generic dashboards.\"",[
            jumpNode("Ask what supplier warning they would trust", "proof-threshold", "risk-proof", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"They mainly need to see monitoring and visibility.","You still need the supplier set and the consumer of that signal."),
          branch("SCENARIO MODELING","ly","\"We need to trust the consequence model before this matters.\"","\"Good. What real decision should the model help the team make earlier than today?\"",[
            jumpNode("Ask what would make a scenario plan usable", "proof-threshold", "scenario-proof", "org"),
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "blu")
          ],"They mainly need to see planning and simulation.","You still need the decision that the model should improve."),
          branch("USABLE OUTPUT","fl","\"We need to know the output is usable by the actual team.\"","\"Then who has to use it first: procurement, operations, resilience, or leadership?\"",[
            jumpNode("Ask what would show the work got better", "proof-threshold", "workflow-proof", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Evidence is about adoption and operating fit.","You still need the first real user.")
        ]),
        node("proof-threshold","risk-proof","fu","If they need supplier warnings","\"What signal would the team have to trust on live suppliers before this feels better than the current risk view?\"","Use this when the buyer mostly reacts to problems as they happen.",false,[
          branch("FRESHNESS","ok","\"We need fresher alerts and a clearer picture of supplier health changes.\"","\"What action should those alerts drive faster than today?\"",[
            jumpNode("Go back to what a late warning costs", "pain-and-consequence", "operational-consequence", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Freshness is part of what they need to see.","You still need the action the signal should trigger."),
          branch("TRUST IN SCORES","ly","\"We need to trust the scoring or risk classification enough to act.\"","\"What would make the team trust it: source quality, transparency, or better correlation to real events?\"",[
            jumpNode("Ask what tools do this work today", "current-vendor-and-displacement", "tool-stack", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Trusting the risk model is the main question.","You still need the validation method."),
          branch("TOO MANY ALERTS","fl","\"We already get alerts. We need them to be useful.\"","\"What would make it useful: fewer false alarms, faster prioritization, or clearer escalation paths?\"",[
            jumpNode("Go back to how they review suppliers", "current-state-truth", "supplier-review", "red"),
            jumpNode("Ask what would show the work got better", "proof-threshold", "workflow-proof", "blu")
          ],"They have plenty of feedback; the problem is acting on it.","You still need the manager decision that improves.")
        ]),
        node("proof-threshold","scenario-proof","ri","If they need scenario planning","\"What would make the scenario output credible enough that the team would actually use it in planning, sourcing, or continuity reviews?\"","Use this when the buyer wants to plan for disruptions before they happen.",false,[
          branch("DECISION GRADE OUTPUT","ok","\"It has to help us make a real planning decision with more confidence than today.\"","\"Which decision first: inventory, sourcing, production continuity, or supplier response?\"",[
            jumpNode("Ask for one recent disruption", "current-state-truth", "live-example", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"The model must improve a real decision, not just show possibility.","You still need the first decision to test."),
          branch("MODEL TRUST","ly","\"We would need to trust the assumptions and consequence logic.\"","\"Then what would make the model trustworthy here: data depth, transparency, or accuracy against a recent event?\"",[
            jumpNode("Ask what tools do this work today", "current-vendor-and-displacement", "tool-stack", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Whether they believe the model is the main hurdle.","You still need the benchmark they will trust."),
          branch("OUTPUT USABILITY","fl","\"The model is interesting only if the team can act from it quickly.\"","\"Then who has to act from it first, and what move should it help them make?\"",[
            jumpNode("Ask what would show the work got better", "proof-threshold", "workflow-proof", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Output usability matters as much as model quality.","You still need the first user and first action.")
        ]),
        node("proof-threshold","workflow-proof","va","If they need to see the work get better","\"What would tell you the workflow got materially better: faster prioritization, clearer escalation, earlier planning, or less manual piecing together?\"","Use this when the buyer cares more about workflow than raw data.",false,[
          branch("CLEAR WORKFLOW SHIFT","ok","\"The team should stop piecing the picture together by hand every time something changes.\"","\"Good. Then the next review has to show that on one real path, not just promise it.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "grn"),
            jumpNode("Pick one supplier or scenario to review", "next-step-lock", "scope-path", "blu")
          ],"Workflow change is part of what they need to see.","You still need the proving ground."),
          branch("MIXED EVIDENCE","ly","\"Part of it is data trust and part of it is workflow fit.\"","\"Which one kills this faster if it stays weak?\"",[
            jumpNode("Ask what supplier warning they would trust", "proof-threshold", "risk-proof", "org"),
            jumpNode("Ask what would make a scenario plan usable", "proof-threshold", "scenario-proof", "blu")
          ],"There are multiple kinds of evidence.","You still need the primary kill switch."),
          branch("NO EVIDENCE BAR","fl","\"We would know it when we see it.\"","\"That usually stalls the deal. What has to be true in the next review for this to justify another one?\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "red"),
            jumpNode("Book a review meeting on one supplier", "next-step-lock", "live-review", "blu")
          ],"It is still very unclear what they need to see.","You still need an explicit advancement rule.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor","Find out why their current tools are still in place.",false,[
        node("current-vendor-and-displacement","tool-stack","ri","Ask what tools do this work today","\"What is doing the work today: ERP, supplier risk tools, spreadsheets, PLM, consultants, alerts, or manual escalation?\"","Start here once they say they already have tooling.",true,[
          branch("STACK MIX CLEAR","ok","\"It is a mix of systems plus people translating the picture manually.\"","\"Which part gives the team the false sense that the risk picture is handled when it actually is not?\"",[
            jumpNode("Go back to what they can't see", "pain-and-consequence", "network-blindness", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"Their current setup is a patchwork, not one connected system.","You still need the false-confidence layer."),
          branch("POINT TOOL DEFENSE","ly","\"We already have a supplier intelligence or alerting layer.\"","\"What still forces the team to leave that tool and build the real answer elsewhere?\"",[
            jumpNode("Ask what they piece together by hand", "current-state-truth", "stitching", "org"),
            jumpNode("Go back to what a late warning costs", "pain-and-consequence", "operational-consequence", "blu")
          ],"The current tool may only solve part of the problem.","You still need the manual escape hatch."),
          branch("SPREADSHEET CULTURE","fl","\"Spreadsheets still run most of it.\"","\"Then where do spreadsheets fail first: freshness, scale, consequence modeling, or cross-team response?\"",[
            jumpNode("Go back to what they piece together by hand", "current-state-truth", "stitching", "red"),
            jumpNode("Go back to what they can't see", "pain-and-consequence", "network-blindness", "blu")
          ],"Today they may mostly run this on spreadsheets.","You still need the first decision that suffers from it.")
        ]),
        node("current-vendor-and-displacement","internal-motion","fu","If they built the process themselves","\"What does the current internal process do well today, and where does it still fail to make the organization earlier or safer?\"","Use this when they have a homegrown workflow.",false,[
          branch("INTERNAL WORKFLOW PARTIAL","ok","\"It covers pieces of the response, but we still piece the hard parts together by hand.\"","\"Then we are not replacing recordkeeping. We are replacing the manual work still done around it.\"",[
            jumpNode("Go back to what they piece together by hand", "current-state-truth", "stitching", "grn"),
            jumpNode("Ask what would show the work got better", "proof-threshold", "workflow-proof", "blu")
          ],"The internal process covers only part of the job.","You still need the missing operating layer."),
          branch("POLITICAL RISK","ly","\"There is sunk cost in how we do this today.\"","\"Understood. What outcome would be strong enough to justify changing that cadence anyway?\"",[
            jumpNode("Go back to what a late warning costs", "pain-and-consequence", "operational-consequence", "org"),
            jumpNode("Ask where projects like this usually slow down", "decision-architecture", "stall-map", "blu")
          ],"Internal politics would make switching harder.","You still need the result that beats sunk cost."),
          branch("GOOD ENOUGH","fl","\"The current process is mostly working.\"","\"Then what still made this meeting worth taking?\"",[
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "recent-event", "red"),
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "blu")
          ],"Their current tool may still be the better choice for them.","You still need the live scope or an honest no.")
        ]),
        node("current-vendor-and-displacement","switch-risk","va","Ask what would make switching risky","\"What would make changing this process feel dangerous: supplier onboarding, data normalization, trust in the model, or changing the planning cadence?\"","Use this to find out what is actually in the way.",false,[
          branch("DATA TRUST RISK","ok","\"If the data or model is wrong, the team will stop trusting it fast.\"","\"Then the next review has to prove trust on live suppliers or a real scenario path.\"",[
            jumpNode("Ask what supplier warning they would trust", "proof-threshold", "risk-proof", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Trust in the data or model is the key blocker.","You still need the benchmark they will trust."),
          branch("WORKFLOW CHANGE RISK","ly","\"Changing the planning or response cadence is the bigger risk.\"","\"Then we need the smallest test that changes one real decision without disrupting the rest.\"",[
            jumpNode("Pick one supplier or scenario to review", "next-step-lock", "scope-path", "org"),
            jumpNode("Ask what would show the work got better", "proof-threshold", "workflow-proof", "blu")
          ],"The adoption risk is in managers' weekly habits, not just the data.","You still need the narrowest safe scope."),
          branch("INERTIA","fl","\"Mostly it is inertia.\"","\"Inertia usually means the pain or sponsor is still too weak. Which one is true here?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Go back to what a late warning costs", "pain-and-consequence", "operational-consequence", "blu")
          ],"The blocker may be weak urgency rather than true switching cost.","You still need the real source of inertia.")
        ])
      ]),
      segment("decision-architecture","08","How they'll decide","Find out who signs off and in what order.",false,[
        node("decision-architecture","buying-path","pr","Ask who would sponsor, evaluate, and approve","\"If this became real, who would sponsor, who would evaluate, and who could slow or stop it?\"","Start here once you partly know the sponsor and what they need to see.",true,[
          branch("PATH CLEAR","ok","\"Supply chain or operations would sponsor, procurement would shape it, and IT or finance would come in later.\"","\"Good. What would procurement or operations have to prove before this becomes real?\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"You know who sponsors it and who evaluates it.","You still need the gate that turns evaluation into a decision."),
          branch("PATH SPLIT","ly","\"Operations feels the pain, but procurement and finance will complicate it.\"","\"Which of those can actually stop this if the evidence is strong?\"",[
            jumpNode("Ask where projects like this usually slow down", "decision-architecture", "stall-map", "org"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "attendee-shape", "blu")
          ],"There are competing stakeholder logics.","You still need the true veto point."),
          branch("PATH UNKNOWN","fl","\"We are too early to know the full path.\"","\"That is fine. Who definitely has to believe this first for the path to matter at all?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"It is still unclear who decides and how.","You still need the first internal believer.")
        ]),
        node("decision-architecture","stall-map","fu","Ask where projects like this usually slow down","\"Where do projects like this usually slow down internally: data trust, procurement process, IT review, finance skepticism, or leadership attention?\"","Use this when there is a path to a decision but it could easily stall.",false,[
          branch("DATA TRUST GATE","ok","\"People will challenge the credibility of the data or model first.\"","\"Then the next review should be built around a live supplier or scenario path they already question.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"Trust in the data or the model is the hurdle.","You still need the benchmark they will trust."),
          branch("PROCUREMENT OR IT","ly","\"Procurement process or IT overhead will slow it down.\"","\"Then what has to be true in the next review so that overhead feels justified?\"",[
            jumpNode("Pick one supplier or scenario to review", "next-step-lock", "scope-path", "org"),
            jumpNode("Ask what would show the work got better", "proof-threshold", "workflow-proof", "blu")
          ],"The blocker may be process overhead rather than disbelief.","You still need the scope that justifies escalation."),
          branch("ATTENTION RISK","fl","\"Nothing formal kills it. It just loses oxygen.\"","\"Then the next step has to be concrete enough that it cannot hide in polite interest.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "recent-event", "blu")
          ],"Attention risk is the real danger.","You still need a next step that people will take seriously.")
        ]),
        node("decision-architecture","government-link","ri","If defense or regulation is involved","\"Does any defense, government, cyber, or regulatory context change how cautious the buying path becomes here?\"","Use this when the prospect sounds highly regulated.",false,[
          branch("HIGH GOVERNANCE","ok","\"Yes. Governance and trust thresholds are higher here.\"","\"Then the next review has to prove not just insight, but whether the new way of working is safe enough to trust.\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "grn"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "attendee-shape", "blu")
          ],"Governance work is part of how they buy.","You still need the first safe proving scope."),
          branch("NORMAL ENTERPRISE","ly","\"Not really. It is still mostly a normal enterprise buying path.\"","\"Good. Then do not overcomplicate the next review. Keep it operational and narrow.\"",[
            jumpNode("Pick one supplier or scenario to review", "next-step-lock", "scope-path", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Governance is not what will decide this.","You still need the right narrow scope."),
          branch("UNKNOWN","fl","\"We have not thought that far ahead.\"","\"That is fine. Then the immediate job is simpler: get one serious review with the person who runs the work and a clear test.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"It is too early for a full governance review.","You still need the first serious internal review.")
        ])
      ]),
      segment("next-step-lock","09","Next step","Leave with a dated review meeting and a named owner.",true,[
        node("next-step-lock","live-review","pr","Book a review meeting on one supplier","\"The next best step sounds like a live review with operations, procurement, and one real supplier or disruption path. Does that fit how your team would validate this?\"","Start here when they would be willing to review one real example together.",true,[
          branch("YES LOCK IT","ok","\"Yes. That is the right shape.\"","\"Good. Which supplier, program, or disruption path should we test so the review is worth their time?\"",[
            jumpNode("Pick one supplier or scenario to review", "next-step-lock", "scope-path", "grn"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "attendee-shape", "blu")
          ],"The next review format is agreed.","You still need the exact path and seats."),
          branch("NEEDS NARROWER START","ly","\"Close, but start with one function or one path first.\"","\"That works. Which narrower path still gives us a real operating problem instead of a generic walkthrough?\"",[
            jumpNode("Pick one supplier or scenario to review", "next-step-lock", "scope-path", "org"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "attendee-shape", "blu")
          ],"The review shape needs tuning, not replacement.","You still need the narrowest real proving ground."),
          branch("TOO EARLY","fl","\"That feels like too much for where we are.\"","\"Understood. Then what would make the next step real enough to keep momentum without pretending we are further along than we are?\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The buyer is not ready for a full review yet.","You still need a lighter but real progression step.")
        ]),
        node("next-step-lock","scope-path","fu","Pick one supplier or scenario to review","\"What should the review focus on: one supplier set, one disruption scenario, one plant or program path, or one procurement diligence workflow?\"","Use this so the next step has a specific purpose.",false,[
          branch("SUPPLIER SET","ok","\"Use the supplier set or risk cluster the team already debates.\"","\"Perfect. That makes the review real immediately.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            action("Go to After the call", "segment:post-call-routing", "blu")
          ],"They agreed what to test on.","You still need the exact attendees and calendar hold."),
          branch("PLANT OR PROGRAM","ly","\"Start with one plant, program, or sourcing path before going broader.\"","\"That is a good place to start. Who owns that part of the work enough to take the session seriously?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "org"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"Testing on something narrower may be safer.","You still need the right owner and the date."),
          branch("NO PATH YET","fl","\"We do not know which path to use yet.\"","\"Then the next step is not locked. Who can pick that path before the meeting goes on calendar?\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The next review is still underspecified.","You still need the owner of the proving path.")
        ]),
        node("next-step-lock","attendee-shape","ri","Agree who attends the next meeting","\"Who has to be in that next review for the outcome to matter: operations, procurement, resilience, finance, or someone else?\"","Use this so the next meeting has a real purpose.",false,[
          branch("RIGHT PEOPLE NAMED","ok","\"Operations and procurement need to be there. Others can come later if the review hits.\"","\"Good. Then this is close to lockable.\"",[
            jumpRoom("Add the meeting to the deal", "deal-workspace", "grn"),
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "blu")
          ],"The right people will be in the review.","You still need the date and owner."),
          branch("EXEC NEEDED NOW","ly","\"Leadership or finance should be there from the start.\"","\"Fine. Then the agenda has to stay tight and focused on evidence so the session is worth senior time.\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "org"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"The meeting is executive-weighted.","You still need the evidence question to justify it."),
          branch("ATTENDEES UNCLEAR","fl","\"We can figure that out later.\"","\"That usually stalls the deal. Who owns deciding the attendee list before the follow-up goes out?\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The meeting is not really locked yet.","You still need the owner of the invite list.")
        ]),
        node("next-step-lock","soft-deferral","va","If they won't commit to a next step","\"What has to become true before the next conversation is worth real calendar time?\"","Use this when they want to stay polite but noncommittal.",false,[
          branch("ADVANCEMENT CONDITION","ok","\"If we can test one live path with the right people, the next session is worth scheduling.\"","\"That is enough. Let us write down exactly what the next step depends on.\"",[
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "grn"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"They named what it would take to move forward.","You still need to carry it forward cleanly."),
          branch("SEND MATERIAL","ly","\"Send material and we will see.\"","\"I will, but I want to attach it to the one decision you still need to make, not a generic deck. What is that decision?\"",[
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "org"),
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The buyer is putting this off without naming what is in the way.","You still need the decision the material should support."),
          branch("NO REAL NEXT","fl","\"Nothing specific. We just need to think.\"","\"Then I would rather leave with the honest blocker than pretend we have a next step. What is still missing?\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"It's too early to trust that this is moving.","You still need the open question in plain language.")
        ])
      ]),
      segment("post-call-routing","10","After the call","Record what you learned and decide where it goes next.",false,[
        node("post-call-routing","handoff","cl","Write notes for whoever picks this up","\"If someone new picked this deal up tomorrow, what would they need to know in the first 30 seconds?\"","Use this to boil the call down to the supply-chain facts you can use.",false,[
          branch("HANDOFF CLEAN","ok","\"Note the supplier or scenario, which teams own it, what they need to see, and what the next review depends on.\"","\"Good. Keep only what changes the next step.\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "grn"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The handoff can now start from signal instead of notes.","You still need the one open question to chase."),
          branch("HANDOFF TOO VERBAL","ly","\"We have a lot of detail, but not a clean signal yet.\"","\"Then throw away anything that does not change the next review question. What is actually usable?\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "org"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The detail exists, but the useful parts are buried.","You still need the core problem and where it goes next."),
          branch("NO HANDOFF HABIT","fl","\"We do not really capture this cleanly today.\"","\"Then write down just four things: the owner, the problem, what they need to see, and what the next step depends on.\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The handoff discipline itself is weak.","You still need the one capture rule that sticks.")
        ]),
        node("post-call-routing","missing-truth","fu","Note what you still need to find out","\"What is still missing that the next step has to find out directly before this becomes real?\"","Use this so whoever picks this up knows the one open question to chase.",false,[
          branch("MISSING TRUTH CLEAR","ok","\"We still need the supplier or scenario to test, the right owner, or the standard they'll measure against.\"","\"Good. Then send what you learned to the place most likely to answer that quickly.\"",[
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "grn"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The open question is clearly named.","You still need to decide where to follow up on it."),
          branch("MISSING OWNER","ly","\"We know the gap, but not who can answer it.\"","\"Then the next step should start with who owns what, not another product conversation.\"",[
            action("Set the next meeting", "segment:next-step-lock", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The open question is clear, but nobody owns it.","You still need the best route to the right person."),
          branch("TOO MUCH UNKNOWN","fl","\"Too much is still vague.\"","\"Then do not pretend this is a healthy progression. Note what is slipping now and fix it before the next disruption teaches the lesson the hard way.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The call may need correction more than continuation.","You still need the clearest failure pattern.")
        ]),
        node("post-call-routing","room-route","pr","Choose where this goes after the call","\"Where should this go next: shape the next review, attach what you learned to the live path, or note the most likely reason it could fail before it happens again?\"","Use this to choose where the notes go based on what happened on the call.",false,[
          branch("NEXT MEETING","ok","\"The next step is a tighter resilience review with a clearer question to answer.\"","\"Then set the next meeting and bring the supplier or scenario to test, who owns what, and what they need to see.\"",[
            action("Set the next meeting", "segment:next-step-lock", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The next step is another conversation, not a commercial move.","You still need the open question in plain language."),
          branch("DEAL WORKSPACE","ly","\"There is already a live supplier, program, or sourcing path here.\"","\"Then add what you learned to the deal right away, before the details get lost.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
            jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
          ],"These facts belong on a live deal.","You still need the top risk to carry with it."),
          branch("FUTURE AUTOPSY","fl","\"This still feels like reacting to problems, or activity without an owner.\"","\"Then route it to Future Autopsy now and name the failure pattern before the next disruption hides it again.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The next step may need to fix what has slipped, not push the deal forward.","You still need the failure pattern in plain language.")
        ])
      ])
    ]
  };
})();
