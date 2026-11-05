(function(){
  var runtime = window.DISCOVERY_SEGMENT_RUNTIME;
  if(!runtime || !runtime.frameworks || !runtime.frameworks["sales-revenue"]) return;

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

  var base = runtime.frameworks["sales-revenue"];

  var supportDossier = [
    { title:"What they need to see", items:["Lift in forecast accuracy against their last two quarters", "Live walkthrough against a stale deal they already carry", "Less time managers spend fixing deal data by hand in Monday reviews"] },
    { title:"Decision path", items:["VP Sales or CRO sponsor who feels the forecast credibility pain", "RevOps or systems evaluator who owns the stack today", "Frontline managers whose weekly review must still work after the change"] },
    { title:"Tools they already have", items:["Gong or Clari already producing alerts the team does not act on", "Salesforce + Outreach or Salesloft as the system of record", "Manual notes, spreadsheets, or founder-led pipeline review"] }
  ];
  var objectionLibrary = [
    { trigger:"we already have Gong", reply:"Good. Which deals did Gong help you save last quarter, and which did you lose even though every call was recorded?" },
    { trigger:"our reps will never use this", reply:"Understood. Then the first question is whether the rep work it replaces is worse than the rep work it adds. Walk me through what a rep does manually today to get a deal through qualification." },
    { trigger:"show me the revenue lift", reply:"Happy to. Before I send anything, tell me what forecast miss or win-rate drop made this a live conversation — otherwise the numbers will feel generic." },
    { trigger:"we need to loop in RevOps", reply:"Good. What should RevOps walk into this session already knowing so the meeting is about deciding, not catching them up?" }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from Gong or Clari?", bridge:"Depends on what you are still doing manually despite having them. What does a manager still have to fix by hand on Mondays that the tool does not catch?" },
    { question:"Does this replace Salesforce?", bridge:"No. The question is whether you can trust what the CRM shows — whether deal stages, next steps, and the forecast hold up in the current process." },
    { question:"Can you integrate with our stack?", bridge:"Almost certainly. More useful question: which piece of the stack would you consolidate or retire if this actually worked?" }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing will matter once we know whether the forecast gap is expensive enough to justify any change. Walk me through what last quarter's miss cost before we size this." },
    { trigger:"asks for demo too early", reply:"I can show it. First tell me which deal type or forecast call you would want it to handle — otherwise the demo will be generic and useless." },
    { trigger:"wrong person or redirect", reply:"No problem. Who on your team would feel the forecast or pipeline pain most directly? I would rather get to the right conversation than force this one." }
  ];

  runtime.frameworks["sales-revenue"] = {
    id:base.id,
    label:base.label,
    short:base.short,
    storageKey:base.storageKey,
    aliases:base.aliases,
    persona:"Sales leadership",
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
        title:"Inspect one live commit",
        copy:"Use a live deal set instead of a dashboard summary.",
        action:jumpNode("Ask what managers check by hand on a deal", "current-state-truth", "deal-review", "blu")
      },
      {
        title:"Name the forecast miss",
        copy:"Get to the gap between commit language and what is actually happening in live deals.",
        action:jumpNode("Ask about forecast misses", "pain-and-consequence", "forecast-gap", "org")
      },
      {
        title:"Lock the inspection review",
        copy:"Leave the call with RevOps, the manager, and the deal set named.",
        action:jumpNode("Book the next review meeting", "next-step-lock", "live-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"already-have-stack",
        label:"We already have Gong / Clari / Salesforce",
        reply:"That makes sense. I am not asking whether the data exists. I am asking where managers still have to interpret it by hand before they trust a number.",
        actions:[
          jumpNode("Ask how a manager judges a deal today", "current-state-truth", "manager-read", "blu"),
          jumpNode("Ask what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "org")
        ]
      },
      {
        id:"just-show-dashboard",
        label:"Just show me the dashboard",
        reply:"I can. First give me one live deal or type of committed deal the current tools still get wrong so the demo has something real to show.",
        actions:[
          jumpNode("Walk through one deal in the forecast", "current-state-truth", "deal-review", "blu"),
          jumpNode("Agree what they need to see", "proof-threshold", "live-proof", "pur")
        ]
      },
      {
        id:"sounds-like-coaching",
        label:"This sounds like manager coaching",
        reply:"Partly. The test is whether the system changes rep behavior and forecast trust, or whether managers keep coaching around missing deal information.",
        actions:[
          jumpNode("Ask what reps and managers should do differently", "proof-threshold", "behavior-shift", "blu"),
          jumpNode("Go back to deals that look safer than they are", "pain-and-consequence", "commit-risk", "org")
        ]
      },
      {
        id:"forecast-is-fine",
        label:"Forecast is fine",
        reply:"Good. Then where does leadership still ask someone to check deals by hand before believing the number?",
        actions:[
          jumpNode("Ask how a manager judges a deal today", "current-state-truth", "manager-read", "blu"),
          jumpNode("Ask what made this urgent", "trigger-and-urgency", "board-pressure", "org")
        ]
      },
      {
        id:"send-the-deck",
        label:"Send the deck",
        reply:"Happy to. What should it help your team decide so this does not end as a polite follow-up after the forecast call?",
        actions:[
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Clarify what they need to see", "proof-threshold", "live-proof", "blu")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening","Ask how much they trust this quarter's forecast and why.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most revenue teams already have plenty of activity data. The question is where managers still have to interpret what is real by hand before they trust the forecast. Is that true in your world too?\"","Use this when they're willing to talk through the problem before seeing the product.",true,[
          branch("CONFIRMS","ok","\"Yes. The signal is there, but trust still depends on the manager reading between the lines.\"","\"Where does that manual checking hurt most: forecast calls, one-on-ones, or deal reviews?\"",[
            jumpNode("Ask how a manager judges a deal today", "current-state-truth", "manager-read", "blu"),
            jumpNode("Walk through one deal in the forecast", "current-state-truth", "deal-review", "grn")
          ],"Manual interpretation is part of the current process.","You still need the exact inspection moment and a live example."),
          branch("STACK DEFENSE","ly","\"We already have the stack. Salesforce, Gong, dashboards, all of it.\"","\"Good. Then where do those tools still fall short of telling a manager whether a deal is actually safe?\"",[
            jumpNode("Walk through one deal in the forecast", "current-state-truth", "deal-review", "org"),
            jumpNode("Ask what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "blu")
          ],"The buyer is defending tooling, not denying the problem.","You still need the gap between data presence and trust."),
          branch("PITCH REQUEST","fl","\"Can you just show me what the product does?\"","\"I can. Give me one live deal or type of committed deal the current tools still get wrong, so what I show you matches a real deal-review problem.\"",[
            jumpNode("Walk through one deal in the forecast", "current-state-truth", "deal-review", "blu"),
            jumpNode("Agree what they need to see", "proof-threshold", "live-proof", "pur")
          ],"The buyer has asked to see the product before describing the workflow.","You still need one real pipeline pattern before demo.")
        ]),
        node("opening-frame","live-deal","fu","Start from one live deal","\"Pick one deal leadership talks about like it is healthy, but a manager still does not fully trust. What is happening there?\"","Use this when the people on the call run the work day to day and are ready to get concrete.",false,[
          branch("LIVE DEAL READY","ok","\"We have one in commit right now that still feels weaker than its stage suggests.\"","\"Good. What exactly makes the manager distrust it: next step, champion, evidence, timing, or multithreading?\"",[
            jumpNode("Walk through one deal in the forecast", "current-state-truth", "deal-review", "grn"),
            jumpNode("Ask what makes a committed deal less real", "pain-and-consequence", "commit-risk", "blu")
          ],"The call is now focused on one live deal.","You still need the specific failure pattern inside it."),
          branch("PIPELINE ANSWER","ly","\"It is not one deal. It is the whole pipeline view that feels unreliable.\"","\"Understood. Where do the weak spots show up first: manager inspection, forecast category changes, or rep follow-up discipline?\"",[
            jumpNode("Ask how a manager judges a deal today", "current-state-truth", "manager-read", "org"),
            jumpNode("Ask about forecast misses", "pain-and-consequence", "forecast-gap", "blu")
          ],"The problem may be systemic instead of isolated.","You still need the first visible break in the system."),
          branch("NO EXAMPLE","fl","\"I do not have a live one in mind.\"","\"Then use the last forecast call that got uncomfortable. What made the number hard to believe?\"",[
            jumpNode("Ask what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "board-pressure", "blu")
          ],"No live example is ready yet.","You still need a real forecast or review incident.")
        ]),
        node("opening-frame","sideways","ri","If the call starts off-topic","\"If this is early, that is fine. What made this meeting worth taking now instead of after quarter close?\"","Use this when they are curious but not yet committed.",false,[
          branch("MISSED OR DISTRUSTED","ok","\"We missed, or leadership does not trust the number enough right now.\"","\"Then let us start there. Where does trust first break in the current deal-review process?\"",[
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "board-pressure", "grn"),
            jumpNode("Ask how a manager judges a deal today", "current-state-truth", "manager-read", "blu")
          ],"There is a real trigger.","You still need the operational location of the distrust."),
          branch("SOFT IMPROVEMENT","ly","\"We mostly want to tighten what already exists.\"","\"Where would you tighten things up first: forecast calls, deal reviews, rep discipline, or how much people trust the CRM?\"",[
            jumpNode("Ask where reps' habits still slip", "current-state-truth", "rep-behavior", "org"),
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "soft-trigger", "blu")
          ],"They are generally interested, but the scope is still unclear.","You still need the most valuable problem to fix."),
          branch("JUST INFORMING","fl","\"Nothing urgent. We are just staying informed.\"","\"That is workable. What would have to happen before revenue leadership treated this like a real priority?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Ask what they need to see", "proof-threshold", "live-proof", "blu")
          ],"The call may be exploratory only.","You still need the threshold that would make this real.")
        ])
      ]),
      segment("current-state-truth","02","How they work today","Ask how the forecast gets built and checked today.",true,[
        node("current-state-truth","manager-read","fu","Ask how a manager judges a deal today","\"Walk me through how a frontline manager decides whether a deal is real today. What do they actually look at before they trust the commit?\"","Start here when they say trust still depends on human judgment.",true,[
          branch("MANUAL READ CLEAR","ok","\"Managers look at activity, next steps, and whether the rep sounds grounded, but it still takes a manual assessment.\"","\"Which part of that manual assessment breaks first: hidden risk, weak next step, or overconfident rep language?\"",[
            jumpNode("Ask what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "grn"),
            jumpNode("Walk through one deal in the forecast", "current-state-truth", "deal-review", "blu")
          ],"You know what managers check by hand.","You still need the first unreliable signal inside it."),
          branch("EVERY MANAGER DIFFERS","ly","\"It depends on the manager. Everyone inspects a little differently.\"","\"That variation is usually the problem. Which inspection gap makes the forecast least trustworthy?\"",[
            jumpNode("Ask what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "org"),
            jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "sponsor", "blu")
          ],"Inspection inconsistency is part of the problem.","You still need the consequence of that inconsistency."),
          branch("NO CLEAR PROCESS","fl","\"Honestly, it is more gut feel than process.\"","\"Then where does gut feel overrule visible deal evidence most often?\"",[
            jumpNode("Walk through one deal in the forecast", "current-state-truth", "deal-review", "red"),
            jumpNode("Agree what they need to see", "proof-threshold", "live-proof", "blu")
          ],"The inspection system may be informal.","You still need a concrete deal pattern, not general discomfort.")
        ]),
        node("current-state-truth","deal-review","pr","Walk through one deal in the forecast","\"Take one deal the forecast treats as real. What would the manager have to check manually before backing it in front of leadership?\"","Use this when you need the current process to get concrete fast.",false,[
          branch("DEAL THIN","ok","\"They would have to verify the next step, the champion, and whether the timeline is actually real.\"","\"Good. Which of those is most often wrong at commit time?\"",[
            jumpNode("Ask what makes a committed deal less real", "pain-and-consequence", "commit-risk", "grn"),
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"You know what managers check on a live deal.","You still need the most expensive failure inside that checklist."),
          branch("FIELDS LOOK CLEAN","ly","\"Mostly they check whether the stage and fields look clean.\"","\"And when the fields look clean but the deal is still lost, what was missing?\"",[
            jumpNode("Ask what makes a committed deal less real", "pain-and-consequence", "commit-risk", "org"),
            jumpNode("Ask what tools do this work today", "current-vendor-and-displacement", "tool-stack", "blu")
          ],"The current process may over-trust CRM hygiene.","You still need the unresolved evidence gaps behind clean fields."),
          branch("NO LIVE DEAL","fl","\"We do not have one I want to unpack on this call.\"","\"Then use the last uncomfortable forecast call. What made a number feel less real once the questions started?\"",[
            jumpNode("Ask what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Ask about a recent forecast call that went badly", "trigger-and-urgency", "inspection-failure", "blu")
          ],"The buyer is avoiding a live deal example.","You still need a real review incident to keep the call honest.")
        ]),
        node("current-state-truth","rep-behavior","ri","Ask where reps' habits still slip","\"Where does the current system still fail to change rep behavior fast enough: next-step discipline, multithreading, deal hygiene, or risk honesty?\"","Use this when they talk more about manager productivity than forecast trust.",false,[
          branch("BEHAVIOR GAP CLEAR","ok","\"Reps still log things late and managers find out too late that the deal was weaker than it looked.\"","\"What behavior would have to change first for leadership to feel the pipeline got more believable?\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "behavior-shift", "grn"),
            jumpNode("Ask which managers feel this first", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"There is a clear rep-behavior gap.","You still need the evidence that behavior change matters enough to buy."),
          branch("MANAGER EFFICIENCY","ly","\"This is really more about manager efficiency.\"","\"Efficiency is fine, but where does inefficient inspection turn into forecast risk or rep drag?\"",[
            jumpNode("Ask where sellers lose time", "pain-and-consequence", "rep-drag", "org"),
            jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "sponsor", "blu")
          ],"The buyer is framing this as efficiency only.","You still need the revenue consequence, not just time saved."),
          branch("VISIBILITY ONLY","fl","\"Rep behavior is mostly fine. The issue is visibility.\"","\"What do you want to see more clearly: risk, evidence, timing, or ownership?\"",[
            jumpNode("Ask what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Ask what the dashboard would have to show", "proof-threshold", "dashboard-proof", "blu")
          ],"The gap may be more observational than behavioral.","You still need the missing visibility object.")
        ])
      ]),
      segment("pain-and-consequence","03","The problem and its cost","Find out what a wrong forecast costs them.",true,[
        node("pain-and-consequence","forecast-gap","ri","Ask what a wrong forecast costs","\"When the number is wrong, what is the actual damage: missed call, bad board prep, wasted rep time, or hidden risk aging out?\"","Start here when they admit confidence in the data is limited.",true,[
          branch("FORECAST DAMAGE CLEAR","ok","\"We waste time debating the number and still miss what is actually slipping.\"","\"Which part hurts most: leadership trust, manager time, or revenue surprise?\"",[
            jumpNode("Ask what the problem costs in money or time", "pain-and-consequence", "rep-drag", "grn"),
            jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "sponsor", "blu")
          ],"They said the forecast is a real problem.","You still need its dominant cost and owner."),
          branch("TEAM TIME COST","ly","\"It mostly burns manager and rep time.\"","\"How much selling time or inspection time disappears because the deal information is still incomplete?\"",[
            jumpNode("Ask how much seller time goes to admin", "pain-and-consequence", "rep-drag", "org"),
            jumpNode("Ask what reps and managers should do differently", "proof-threshold", "behavior-shift", "blu")
          ],"The pain may start as time loss before it shows up as forecast miss.","You still need the magnitude of that drag."),
          branch("NOT MISSED YET","fl","\"We have not really missed yet. It just feels fragile.\"","\"What makes it fragile? Where does a manager still have to dig in personally before backing the number?\"",[
            jumpNode("Ask what makes a committed deal less real", "pain-and-consequence", "commit-risk", "red"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "soft-trigger", "blu")
          ],"They can see the risk before a deal is missed.","You still need the fragility pattern in plain language.")
        ]),
        node("pain-and-consequence","commit-risk","pr","Ask what makes a committed deal less real","\"Inside a deal that looks healthy on paper, what usually turns out to be less solid than the stage suggests?\"","Use this to turn general forecast complaints into specific open questions on one deal.",false,[
          branch("NEXT STEP THIN","ok","\"The next step looks real until you ask who accepted it and when.\"","\"How often does that happen late enough to damage the number?\"",[
            jumpNode("Ask about a recent forecast call that went badly", "trigger-and-urgency", "inspection-failure", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"The commit risk is now a concrete deal pattern.","You still need its frequency or cost."),
          branch("CHAMPION THIN","ly","\"The rep sounds good, but there is not a real internal owner carrying it.\"","\"When that happens, who catches it first today: the manager, RevOps, or no one until later?\"",[
            jumpNode("Ask which managers feel this first", "stakeholder-and-ownership", "manager-owner", "org"),
            jumpNode("Ask what tools do this work today", "current-vendor-and-displacement", "tool-stack", "blu")
          ],"The gap may be ownership, not activity.","You still need the detection point."),
          branch("TIMING THIN","fl","\"The timeline sounds strong until the deal sits in stage too long.\"","\"What should have caught that risk earlier than it does today?\"",[
            jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "tool-stack", "red"),
            jumpNode("Ask what the dashboard would have to show", "proof-threshold", "dashboard-proof", "blu")
          ],"The hidden risk may be recency and decay.","You still need the signal that should have caught it.")
        ]),
        node("pain-and-consequence","rep-drag","fu","Find where sellers lose time","\"How much rep time still goes into feeding CRM, recapping deals, or defending the pipeline instead of selling?\"","Use this when the buyer keeps framing everything as ops efficiency.",false,[
          branch("REP DRAG REAL","ok","\"Reps still spend too much time updating, recapping, and chasing clean pipeline language.\"","\"If that went away, what would improve first: pipeline quality, manager trust, or selling time?\"",[
            jumpNode("Agree what the reps and managers should do differently", "proof-threshold", "behavior-shift", "grn"),
            jumpNode("Ask which managers feel this first", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"Saving reps time is part of the value.","You still need the outcome that matters most."),
          branch("MANAGERS ONLY","ly","\"It is more of a manager problem than a rep problem.\"","\"What does bad manager inspection cost the reps anyway?\"",[
            jumpNode("Go back to what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "org"),
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "sponsor", "blu")
          ],"Managers' workload may still be hurting how reps work.","You still need the downstream effect."),
          branch("TRUST ONLY","fl","\"Time is not the issue. Trust is.\"","\"That is enough. Then stay with trust. Where does the number stop feeling believable?\"",[
            jumpNode("Go back to what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Walk through one deal in the forecast", "current-state-truth", "deal-review", "blu")
          ],"Trust is the real issue, not how busy people are.","You still need the moment trust breaks.")
        ])
      ]),
      segment("trigger-and-urgency","04","Why now","Find out what changed that makes this worth solving now.",true,[
        node("trigger-and-urgency","board-pressure","ri","Ask what changed for leadership","\"What changed recently that made leadership care about forecast accuracy harder than before?\"","Use this when they mention misses, scrutiny, or planning pressure.",true,[
          branch("MISS OR BOARD EVENT","ok","\"We missed, or leadership lost confidence in the number.\"","\"What happens before the next board or QBR if nothing changes?\"",[
            jumpNode("Ask about a recent forecast call that went badly", "trigger-and-urgency", "inspection-failure", "grn"),
            jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "sponsor", "blu")
          ],"The trigger is real.","You still need the deadline and who owns the problem."),
          branch("QUARTER DEADLINE","ly","\"We just need better signal this quarter.\"","\"What made this quarter different enough that better signal became urgent?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "soft-trigger", "org"),
            jumpNode("Go back to the problem", "pain-and-consequence", "forecast-gap", "blu")
          ],"Urgency may be real but under-described.","You still need the concrete trigger."),
          branch("LEADERSHIP NOT PUSHING","fl","\"Leadership is not really pushing this yet.\"","\"Then who is? If no one is pushing, what would have to go wrong before this becomes active?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Ask what they need to see", "proof-threshold", "live-proof", "blu")
          ],"There may be no active trigger.","You still need the future trigger or an honest downgrade.")
        ]),
        node("trigger-and-urgency","inspection-failure","pr","Ask about a recent forecast call that went badly","\"Think about the last forecast or inspection call that got uncomfortable. What made people doubt the number?\"","Use this when they cannot name urgency cleanly.",false,[
          branch("CALL GOT SHAKY","ok","\"The questions got deeper than the rep story could support.\"","\"That is the exact moment I care about. What was missing in the deal facts?\"",[
            jumpNode("Go back to deals that look safer than they are", "pain-and-consequence", "commit-risk", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "live-proof", "blu")
          ],"You now have a real failure moment.","You still need the open question inside it."),
          branch("NUMBER MOVED LATE","ly","\"The number changed late because the risk showed up too late.\"","\"What should have caught that risk earlier?\"",[
            jumpNode("Ask what tools they use today", "current-vendor-and-displacement", "tool-stack", "org"),
            jumpNode("Ask what the dashboard would have to show", "proof-threshold", "dashboard-proof", "blu")
          ],"How early they spot risk is part of the problem.","You still need the missing leading indicator."),
          branch("NOTHING SPECIFIC","fl","\"It is more general unease than one call.\"","\"What pattern keeps repeating often enough that the team stopped trusting the number?\"",[
            jumpNode("Go back to what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "soft-trigger", "blu")
          ],"The urgency comes from a repeated pattern, not one event.","You still need one repeated failure pattern.")
        ]),
        node("trigger-and-urgency","soft-trigger","fu","Ask what would make this urgent","\"If the pressure is real but not urgent yet, what would have to happen before leadership treated this like a live forecast problem instead of an improvement idea?\"","Use this when they feel pressure but cannot name the trigger cleanly.",false,[
          branch("TRIGGER SHOWS UP","ok","\"Another miss, ugly forecast call, or leadership challenge would make it active immediately.\"","\"Good. Then let us use that to keep the next step honest instead of pretending it is already urgent.\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "live-proof", "blu")
          ],"They named what would make this a priority.","You still need the earliest warning sign."),
          branch("STILL VAGUE","fl","\"I still cannot name it exactly.\"","\"Then we should focus on the deal review or deal pattern that makes this worth solving, not invent urgency.\"",[
            jumpNode("Go back to how managers judge deals", "current-state-truth", "manager-read", "red"),
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "blu")
          ],"The urgency is still vague.","You still need one concrete inspection moment.")
        ]),
        node("trigger-and-urgency","exploratory","fu","If this is early research","\"If this is still early, what would have to happen for you to treat forecast signal as a live priority instead of an interesting idea?\"","Use this when the urgency is not active.",false,[
          branch("TRIGGER NAMED","ok","\"A miss, a board challenge, or scaling pain would make it active immediately.\"","\"Good. Then the right next step is to focus on the earliest warning sign before that happens.\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "live-proof", "grn"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"They named what would make this urgent later.","You still need the signal that would prove it is starting."),
          branch("NO TRIGGER YET","ly","\"We are not there yet.\"","\"Understood. Then I would rather leave with the right watchpoint than force a fake next step.\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "org"),
            jumpNode("Ask what they need to see", "proof-threshold", "live-proof", "blu")
          ],"The call should stay light and honest.","You still need the reason to re-open later."),
          branch("WRONG PERSON","fl","\"Leadership would have to answer that.\"","\"Then the fastest answer is getting that person into the next conversation instead of guessing here.\"",[
            jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "sponsor", "red"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "live-review", "blu")
          ],"The trigger owner is not in the room.","You still need the right leadership seat.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Who's involved","Find out who owns the problem and who approves spend on it.",true,[
        node("stakeholder-and-ownership","sponsor","pr","Find the sponsor","\"Who feels the forecast-trust problem badly enough that they would sponsor change instead of admiring the idea?\"","Use this once pain and urgency are visible.",true,[
          branch("CRO OR VP SALES","ok","\"Sales leadership owns the problem because forecast accuracy rolls up to them.\"","\"What would they need to believe before backing this in public?\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "live-proof", "grn"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"You know which role would sponsor this.","You still need to know what the sponsor needs to see."),
          branch("REVOPS CARRIES IT","ly","\"RevOps is carrying most of this right now.\"","\"Is RevOps the buyer, the evaluator, or the translator for sales leadership here?\"",[
            jumpNode("Ask what RevOps owns here", "stakeholder-and-ownership", "revops-owner", "org"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"RevOps matters, but the buying role is still unclear.","You still need to know who actually signs off."),
          branch("NO SPONSOR","fl","\"No one really owns it end to end.\"","\"Then the next step is not product. It is finding the first leader who pays for the distrust today.\"",[
            jumpNode("Ask which managers feel this first", "stakeholder-and-ownership", "manager-owner", "red"),
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "blu")
          ],"Ownership is fragmented or absent.","You still need the first real economic owner.")
        ]),
        node("stakeholder-and-ownership","revops-owner","fu","Ask what RevOps owns here","\"What exactly does RevOps own here: inspection design, reporting, tool evaluation, or just keeping the CRM clean?\"","Use this when RevOps comes up.",false,[
          branch("EVALUATOR","ok","\"RevOps will evaluate and test whether the signal is real.\"","\"What does sales leadership need RevOps to prove before the project is credible?\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "dashboard-proof", "grn"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"RevOps is a real evaluator.","You still need the executive approval rule."),
          branch("OPERATOR ONLY","ly","\"RevOps mainly keeps the system running and the fields clean.\"","\"Then whose pain makes this urgent beyond field hygiene?\"",[
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "sponsor", "org"),
            jumpNode("Go back to what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "blu")
          ],"RevOps may not be the economic buyer.","You still need the executive pain owner."),
          branch("TOO MANY HANDS","fl","\"It is split between RevOps, managers, and leadership.\"","\"Who can stop this from moving, even if everyone else likes it?\"",[
            jumpNode("Ask where projects like this usually slow down", "decision-architecture", "stall-map", "red"),
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "blu")
          ],"Influence is spread across the org.","You still need the veto holder.")
        ]),
        node("stakeholder-and-ownership","manager-owner","ri","Ask which managers feel this first","\"Who actually pays for weak pipeline accuracy first: frontline managers, second-line leaders, or the CRO?\"","Use this when the buyer keeps describing manager pain.",false,[
          branch("MANAGERS PAY FIRST","ok","\"Frontline managers spend too much time checking weak deals and fixing them by hand.\"","\"What would have to change for them to feel the workflow got materially better?\"",[
            jumpNode("Agree what the reps and managers should do differently", "proof-threshold", "behavior-shift", "grn"),
            jumpNode("Book a review meeting on one live deal", "next-step-lock", "live-review", "blu")
          ],"Managers really feel this problem.","You still need the improvement they would recognize."),
          branch("EXECS PAY FIRST","ly","\"Leadership feels it more because the number gets shaky.\"","\"Then stay with the executive lens. What would make the number publicly safer?\"",[
            jumpNode("Ask what would convince leadership", "proof-threshold", "live-proof", "org"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"The case may be executive trust more than manager efficiency.","You still need to know what executives need to see."),
          branch("NO CLEAR OWNER","fl","\"Everyone feels it a little.\"","\"When everyone owns it a little, no one buys. Who would lose face first if the forecast missed again?\"",[
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "sponsor", "red"),
            jumpNode("Ask what changed for leadership", "trigger-and-urgency", "board-pressure", "blu")
          ],"The problem is spread across teams.","You still need the first accountable leader.")
        ])
      ]),
      segment("proof-threshold","06","What they need to see","Agree on the test that would show it works on their pipeline.",true,[
        node("proof-threshold","live-proof","pr","Ask what they need to see","\"What would make this feel real to your team: a review of one live deal, managers working differently, better forecast confidence, or all three?\"","Start here when the buyer says they need evidence.",true,[
          branch("LIVE DEAL READ","ok","\"Show me this on one real deal or commit set and I will know if it matters.\"","\"Good. Then the next review should be built around a live deal set, not a generic demo.\"",[
            jumpNode("Book a review meeting on one live deal", "next-step-lock", "live-review", "grn"),
            jumpNode("Pick which deals to review together", "next-step-lock", "deal-set", "blu")
          ],"The evidence has to come from live deals.","You still need the exact people and deal set."),
          branch("BEHAVIOR CHANGE","ly","\"I need to see reps and managers actually use this differently.\"","\"What behavior would count: risk honesty, next-step discipline, multithreading, or cleaner inspection?\"",[
            jumpNode("Ask what reps and managers should do differently", "proof-threshold", "behavior-shift", "org"),
            jumpNode("Ask which managers feel this first", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"Adoption evidence matters as much as analytics evidence.","You still need the specific behavior that changes belief."),
          branch("DASHBOARD FIRST","fl","\"I want to know the signal itself is better before we talk workflow change.\"","\"Then the test is not prettier dashboards. It is whether it catches hidden deal risk earlier than your current tools do.\"",[
            jumpNode("Ask what tools do this work today", "current-vendor-and-displacement", "tool-stack", "red"),
            jumpNode("Ask what the dashboard would have to show", "proof-threshold", "dashboard-proof", "blu")
          ],"They are asking for signal superiority first.","You still need the benchmark they will trust.")
        ]),
        node("proof-threshold","behavior-shift","fu","Ask what reps and managers should do differently","\"If this works, what should change first in the field: rep updates, manager inspection, forecast calls, or deal reviews?\"","Use this when the buyer frames value around workflow change.",false,[
          branch("MANAGER INSPECTION","ok","\"Managers should spend less time translating and more time coaching with real signal.\"","\"Then the next review has to show exactly that shift on one live deal set.\"",[
            jumpNode("Book a review meeting on one live deal", "next-step-lock", "live-review", "grn"),
            jumpNode("Pick which deals to review together", "next-step-lock", "deal-set", "blu")
          ],"Manager behavior is part of what they need to see.","You still need the test environment."),
          branch("REP DISCIPLINE","ly","\"Reps should become more honest and cleaner faster.\"","\"What specific behavior would tell you that happened: next steps, multithreading, risk flagging, or stage honesty?\"",[
            jumpNode("Go back to where reps' habits slip", "current-state-truth", "rep-behavior", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Rep behavior is a required outcome.","You still need the visible indicator."),
          branch("NO BEHAVIOR NEED","fl","\"If the signal is right, behavior will take care of itself.\"","\"Maybe, but the buyer usually needs one visible workflow change to trust the signal is not ornamental. What would that be here?\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "live-proof", "red"),
            jumpNode("Ask what the dashboard would have to show", "proof-threshold", "dashboard-proof", "blu")
          ],"They may be underestimating adoption evidence.","You still need one visible workflow outcome.")
        ]),
        node("proof-threshold","dashboard-proof","ri","If they ask to see a dashboard","\"When you say you need to see the dashboard, what would it have to surface earlier or more clearly than today to matter?\"","Use this when they ask for a dashboard, so you learn what it would actually need to show.",false,[
          branch("EARLIER RISK","ok","\"It would need to show hidden deal risk before the forecast call gets ugly.\"","\"Great. Then define exactly which risks it must catch on a set of live deals.\"",[
            jumpNode("Go back to deals that look safer than they are", "pain-and-consequence", "commit-risk", "grn"),
            jumpNode("Book a review meeting on one live deal", "next-step-lock", "live-review", "blu")
          ],"The dashboard is really a risk-detection test.","You still need the benchmark deal set."),
          branch("BETTER PRIORITIZATION","ly","\"It would need to help managers know where to spend time first.\"","\"Which decision does the current stack still fail to make clear enough: which deal to inspect, what question to ask, or whether the number is safe?\"",[
            jumpNode("Go back to how managers judge deals", "current-state-truth", "manager-read", "org"),
            jumpNode("Ask what tools do this work today", "current-vendor-and-displacement", "tool-stack", "blu")
          ],"The ask is about guidance, not visuals.","You still need the manager decision the system must improve."),
          branch("JUST SHOW SOMETHING","fl","\"I just want to see it.\"","\"Fair. I still need the live inspection question first so the demo has something real to show.\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "live-proof", "red"),
            jumpNode("Ask about one live deal", "current-state-truth", "deal-review", "blu")
          ],"They are more curious than they are clear on the problem.","You still need the call anchored to a real evidence question.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor","Find out why their current tools are still in place.",false,[
        node("current-vendor-and-displacement","tool-stack","ri","Ask what tools do this work today","\"What is doing the work today: Salesforce, call recording, spreadsheet overlays, manager inspection habits, or something internal?\"","Start here once they say they already have tools.",true,[
          branch("STACK MIX CLEAR","ok","\"It is a stack of systems plus manager judgment and some spreadsheet fixes.\"","\"Which piece gives the team the false sense that pipeline accuracy is handled when it actually is not?\"",[
            jumpNode("Go back to what a wrong forecast costs", "pain-and-consequence", "forecast-gap", "grn"),
            jumpNode("Ask what the dashboard would have to show", "proof-threshold", "dashboard-proof", "blu")
          ],"Their current setup is a mix of tools, not one product.","You still need the false-confidence layer."),
          branch("TOOL DOES MOST","ly","\"Clari or Gong gets us most of the way there already.\"","\"Most of the way is fine. What still forces the manager to overrule what the tool says?\"",[
            jumpNode("Go back to how managers judge deals", "current-state-truth", "manager-read", "org"),
            jumpNode("Go back to deals that look safer than they are", "pain-and-consequence", "commit-risk", "blu")
          ],"Their current tool works only partly.","You still need the remaining manual override."),
          branch("FRAGMENTED STACK","fl","\"Different teams use different things.\"","\"Then the displacement case may be workflow simplification first. Where does that mess cost the most today?\"",[
            jumpNode("Go back to where sellers lose time", "pain-and-consequence", "rep-drag", "red"),
            jumpNode("Ask what RevOps owns here", "stakeholder-and-ownership", "revops-owner", "blu")
          ],"The current stack may itself be fragmented.","You still need the most expensive fragment.")
        ]),
        node("current-vendor-and-displacement","internal-build","fu","If they built it themselves","\"What does the internal workflow do well today, and where does it still fail to make the forecast more trustworthy?\"","Use this when they say they already built something.",false,[
          branch("BUILD HELPS BUT THIN","ok","\"It helps organize activity, but it still does not settle what is real.\"","\"Then we are not replacing a dashboard. We are replacing the manual interpretation still wrapped around it.\"",[
            jumpNode("Go back to how managers judge deals", "current-state-truth", "manager-read", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "live-proof", "blu")
          ],"The internal build covers only part of the job.","You still need the missing judgment layer."),
          branch("BUILD IS POLITICAL","ly","\"We have invested in it, so displacement will be sensitive.\"","\"Understood. What business result would justify changing the process anyway?\"",[
            jumpNode("Go back to the problem", "pain-and-consequence", "forecast-gap", "org"),
            jumpNode("Ask where projects like this usually slow down", "decision-architecture", "stall-map", "blu")
          ],"Internal politics would make switching harder.","You still need the result strong enough to beat sunk cost."),
          branch("BUILD GOOD ENOUGH","fl","\"Honestly, the internal process is mostly working.\"","\"Then what still made this meeting worth taking?\"",[
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "board-pressure", "red"),
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "blu")
          ],"Their current tool may still be the better choice for them.","You still need the live scope or an honest no.")
        ]),
        node("current-vendor-and-displacement","switch-risk","va","Ask what would make switching risky","\"What would make changing this stack feel dangerous: rep adoption, forecast disruption, RevOps load, or leadership trust?\"","Use this to find what would really stop them switching.",false,[
          branch("ADOPTION RISK","ok","\"If reps or managers do not use it, it gets dropped fast.\"","\"Then the next review has to prove workflow fit, not just signal quality.\"",[
            jumpNode("Agree what the reps and managers should do differently", "proof-threshold", "behavior-shift", "grn"),
            jumpNode("Book a review meeting on one live deal", "next-step-lock", "live-review", "blu")
          ],"Whether people will use it is central to the decision.","You still need the behavior that proves fit."),
          branch("FORECAST RISK","ly","\"We cannot risk destabilizing the number mid-quarter.\"","\"Then what they need to see is simple: show it working safely on a narrow set of deal reviews before a broad rollout.\"",[
            jumpNode("Pick which deals to review together", "next-step-lock", "deal-set", "org"),
            jumpNode("Agree a test on one live deal", "proof-threshold", "live-proof", "blu")
          ],"Rollout risk is holding the project back.","You still need the smallest safe scope."),
          branch("INERTIA","fl","\"It is mostly just inertia.\"","\"Inertia usually means the pain or sponsor is still too weak. Which one is true here?\"",[
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "sponsor", "red"),
            jumpNode("Go back to the problem", "pain-and-consequence", "forecast-gap", "blu")
          ],"The blocker may be weak urgency, not technical risk.","You still need the real source of inertia.")
        ])
      ]),
      segment("decision-architecture","08","How they'll decide","Find out who signs off and in what order.",false,[
        node("decision-architecture","buying-path","pr","Ask who would sponsor, evaluate, and approve","\"If this became real, who would sponsor, who would evaluate, and who could slow or stop it?\"","Start here once you partly know the sponsor and what they need to see.",true,[
          branch("PATH CLEAR","ok","\"Sales leadership would sponsor, RevOps would evaluate, and IT or finance would weigh in later.\"","\"Good. What would RevOps have to prove before sales leadership makes this public?\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "live-proof", "grn"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "live-review", "blu")
          ],"You know who sponsors it and who evaluates it.","You still need the gate that turns evaluation into a decision."),
          branch("PATH SPLIT","ly","\"The value sits with sales leadership, but RevOps and finance will complicate it.\"","\"Which of those can actually kill this if the evidence is strong?\"",[
            jumpNode("Ask where projects like this usually slow down", "decision-architecture", "stall-map", "org"),
            jumpNode("Decide who should attend the next meeting", "next-step-lock", "live-review", "blu")
          ],"There are competing stakeholder logics.","You still need the true veto point."),
          branch("PATH UNKNOWN","fl","\"We are too early to know the full path.\"","\"That is fine. Who definitely has to believe this first for the path to matter at all?\"",[
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "sponsor", "red"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"It is still unclear who decides and how.","You still need the first internal believer.")
        ]),
        node("decision-architecture","stall-map","fu","Ask where projects like this usually slow down","\"Where do deals like this usually slow down internally: RevOps scrutiny, IT review, finance skepticism, or leadership distraction?\"","Use this when there is a path to a decision but it could easily stall.",false,[
          branch("REVOPS GATE","ok","\"RevOps will challenge the signal quality and process change hard.\"","\"Then the next review should give RevOps the live deal set and the exact inspection question.\"",[
            jumpNode("Book a review meeting on one live deal", "next-step-lock", "live-review", "grn"),
            jumpNode("Ask what the dashboard would have to show", "proof-threshold", "dashboard-proof", "blu")
          ],"RevOps has to approve this.","You still need the data they will trust."),
          branch("FINANCE OR IT","ly","\"Finance or IT can slow it if the value or implementation sounds fuzzy.\"","\"What would they need first: economic clarity, rollout safety, or limited scope?\"",[
            jumpNode("Ask what would make switching risky", "current-vendor-and-displacement", "switch-risk", "org"),
            jumpNode("Pick which deals to review together", "next-step-lock", "deal-set", "blu")
          ],"The blocker may be control or economics, not sales skepticism.","You still need the right scope to lower that risk."),
          branch("ATTENTION RISK","fl","\"Nothing formal kills it. It just loses oxygen.\"","\"Then the next step has to be concrete enough that it cannot hide in polite interest.\"",[
            jumpNode("Book a review meeting on one live deal", "next-step-lock", "live-review", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "board-pressure", "blu")
          ],"Attention risk is the real danger.","You still need a next step that people will actually put on the calendar.")
        ])
      ]),
      segment("next-step-lock","09","Next step","Leave with a dated review meeting and a named owner.",true,[
        node("next-step-lock","live-review","pr","Book a review meeting on one live deal","\"The next best step sounds like a live inspection review with RevOps, the manager, and one real deal set. Does that fit how your team would validate this?\"","Start here when they would be willing to review one real workflow together.",true,[
          branch("YES LOCK IT","ok","\"Yes. That is the right shape.\"","\"Good. Which deals or commit category should we inspect so the review is worth their time?\"",[
            jumpNode("Pick which deals to review together", "next-step-lock", "deal-set", "grn"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"The next review format is agreed.","You still need the exact deal set and seats."),
          branch("NEEDS NARROWER START","ly","\"Close, but start with RevOps only or one manager first.\"","\"That works. Which narrower format still gives us a real inspection problem instead of a generic walkthrough?\"",[
            jumpNode("Pick which deals to review together", "next-step-lock", "deal-set", "org"),
            jumpNode("Go back to which managers feel this first", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"The review shape needs tuning, not replacement.","You still need the narrowest real proving ground."),
          branch("TOO EARLY","fl","\"That feels like too much for where we are.\"","\"Understood. Then what would make the next step real enough to keep momentum without pretending we are further along than we are?\"",[
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to what they need to see", "proof-threshold", "live-proof", "blu")
          ],"The buyer is not ready for a full review yet.","You still need a lighter but real progression step.")
        ]),
        node("next-step-lock","deal-set","fu","Pick which deals to review together","\"Which deals should be in the review: current commits, late-stage slips, or one live inspection set your managers already debate?\"","Use this so the next step has a specific purpose.",false,[
          branch("COMMIT SET","ok","\"Use the current commit set or the deals leadership keeps questioning.\"","\"Perfect. That makes the review real immediately.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            action("Go to After the call", "segment:post-call-routing", "blu")
          ],"They agreed what to test on.","You still need the exact attendees and calendar hold."),
          branch("ONE MANAGER SET","ly","\"Start with one manager's inspection set before going broader.\"","\"That is a good place to start. Which manager feels the problem enough to take the session seriously?\"",[
            jumpNode("Go back to which managers feel this first", "stakeholder-and-ownership", "manager-owner", "org"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"Testing on a smaller set may be safer.","You still need the right manager and the date."),
          branch("NO SET YET","fl","\"We do not know which deals to use yet.\"","\"Then the next step is not locked. Who can pick that set before the meeting goes on calendar?\"",[
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to who would sponsor the change", "stakeholder-and-ownership", "sponsor", "blu")
          ],"The next review is still underspecified.","You still need the owner of the deal set.")
        ]),
        node("next-step-lock","soft-deferral","ri","If they won't commit to a next step","\"What has to become true before the next conversation is worth real calendar time?\"","Use this when they want to stay polite but noncommittal.",false,[
          branch("ADVANCEMENT CONDITION","ok","\"If we can show this on a live deal set with the right people, then the next session is worth scheduling.\"","\"That is enough. Let us write down exactly what the next step depends on.\"",[
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "grn"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"They named what it would take to move forward.","You still need to carry it forward cleanly."),
          branch("SEND MATERIAL","ly","\"Send material and we will see.\"","\"I will, but I want to attach it to the one decision you still need to make, not a generic deck. What is that decision?\"",[
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "org"),
            jumpNode("Go back to what they need to see", "proof-threshold", "live-proof", "blu")
          ],"The buyer is putting this off without naming what is in the way.","You still need the decision the material should support."),
          branch("NO REAL NEXT","fl","\"Nothing specific. We just need to think.\"","\"Then I would rather leave with the honest blocker than pretend we have a next step. What is still missing?\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"It's too early to trust that this is moving.","You still need the open question in plain language.")
        ])
      ]),
      segment("post-call-routing","10","After the call","Record what you learned and decide where it goes next.",false,[
        node("post-call-routing","handoff","cl","Write notes for whoever picks this up","\"If someone new picked this deal up tomorrow, what would they need to know in the first 30 seconds?\"","Use this to boil the call down to the sales facts you can use.",false,[
          branch("HANDOFF CLEAN","ok","\"Note the deal-review problem, who might sponsor it, what they need to see, and what the next review depends on.\"","\"Good. Keep only what changes the next step.\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "grn"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The handoff can now start from signal instead of notes.","You still need the one open question to chase."),
          branch("HANDOFF TOO VERBAL","ly","\"We have a lot of notes, but not a clean story yet.\"","\"Then throw away anything that does not change the next review question. What is actually usable?\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "org"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The detail exists, but the useful parts are buried.","You still need the core problem and where it goes next."),
          branch("NO HANDOFF HABIT","fl","\"We do not really capture this cleanly today.\"","\"Then write down just four things: the owner, the problem, what they need to see, and what the next step depends on.\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The handoff discipline itself is weak.","You still need the one capture rule that sticks.")
        ]),
        node("post-call-routing","missing-truth","fu","Note what you still need to find out","\"What is still missing that the next step has to find out directly before this becomes real?\"","Use this so whoever picks this up knows the one open question to chase.",false,[
          branch("MISSING TRUTH CLEAR","ok","\"We still need the real set of deals, the sponsor, or the standard they'll measure against.\"","\"Good. Then send what you learned to the place most likely to answer that quickly.\"",[
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "grn"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The open question is clearly named.","You still need to decide where to follow up on it."),
          branch("MISSING OWNER","ly","\"We know the gap, but not who can answer it.\"","\"Then the next step should start with who owns what, not another product conversation.\"",[
            action("Set the next meeting", "segment:next-step-lock", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The open question is clear, but nobody owns it.","You still need the best route to the right person."),
          branch("TOO THIN","fl","\"Too much is still vague.\"","\"Then do not pretend this is a healthy progression. Note what is slipping now and fix it before the deal goes quiet.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The call may need correction more than continuation.","You still need the clearest failure pattern.")
        ]),
        node("post-call-routing","room-route","pr","Choose where this goes after the call","\"Where should this go next: shape the next review, attach what you learned to the deal, or note the most likely reason it could fail before it's forgotten?\"","Use this to choose where the notes go based on what happened on the call.",false,[
          branch("NEXT MEETING","ok","\"The next step is a tighter inspection conversation with a clearer question that needs an answer.\"","\"Then set the next meeting and bring the deal set, sponsor path, and what they need to see.\"",[
            action("Set the next meeting", "segment:next-step-lock", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The next step is another conversation, not a commercial move.","You still need the open question in plain language."),
          branch("DEAL WORKSPACE","ly","\"There is already a live opportunity path here.\"","\"Then add what you learned to the live deal right away, before the forecast story changes again.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
            jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
          ],"These facts belong on a live deal.","You still need the top risk to carry with it."),
          branch("FUTURE AUTOPSY","fl","\"This still feels like activity that is going nowhere without an owner.\"","\"Then route it to Future Autopsy now and name the failure pattern before the next forecast call hides it.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The next step may need to fix what has slipped, not push the deal forward.","You still need the failure pattern in plain language.")
        ])
      ])
    ]
  };
})();
