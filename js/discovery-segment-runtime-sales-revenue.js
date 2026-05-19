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
    { title:"Proof burden", items:["Lift in forecast accuracy against their last two quarters", "Live walkthrough against a stale deal they already carry", "Reduction in rescue work by managers in Monday reviews"] },
    { title:"Decision path", items:["VP Sales or CRO sponsor who feels the forecast credibility pain", "RevOps or systems evaluator who owns the stack today", "Frontline managers whose weekly review has to survive the change"] },
    { title:"Incumbent landscape", items:["Gong or Clari already generating noise the team does not act on", "Salesforce + Outreach or Salesloft as the system of record", "Manual notes, spreadsheets, or founder-led pipeline review"] }
  ];
  var objectionLibrary = [
    { trigger:"we already have Gong", reply:"Good. Which deals did Gong save last quarter, and which did it narrate while they died?" },
    { trigger:"our reps will never use this", reply:"Understood. Then the first question is whether the rep work it replaces is worse than the rep work it adds. Walk me through what a rep does manually today to get a deal through qualification." },
    { trigger:"show me the revenue lift", reply:"Happy to. Before I send anything, tell me what forecast miss or win-rate drop made this a live conversation — otherwise the numbers will feel generic." },
    { trigger:"we need to loop in RevOps", reply:"Good. What should RevOps walk into this session already knowing so the meeting is about decision, not re-briefing?" }
  ];
  var inboundQuestionHandlers = [
    { question:"How is this different from Gong or Clari?", bridge:"Depends on what you are still doing manually despite having them. What does a manager still rescue on Mondays that the tool does not catch?" },
    { question:"Does this replace Salesforce?", bridge:"No. The question is whether the CRM keeps lying to you — whether stage fidelity, next-step truth, and forecast credibility survive the current process." },
    { question:"Can you integrate with our stack?", bridge:"Almost certainly. More useful question: which piece of the stack would you consolidate or retire if this actually worked?" }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing will matter once we know whether the forecast gap is expensive enough to justify any change. Walk me through what last quarter's miss cost before we size this." },
    { trigger:"asks for demo too early", reply:"I can show it. First tell me which deal type or forecast call you would want it to survive — otherwise the demo will be generic and useless." },
    { trigger:"wrong person or redirect", reply:"No problem. Who on your team would feel the forecast or pipeline pain most directly? I would rather earn the right conversation than force this one." }
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
        action:jumpNode("Open deal review", "current-state-truth", "deal-review", "blu")
      },
      {
        title:"Name the forecast miss",
        copy:"Get to the gap between commit language and live deal truth.",
        action:jumpNode("Open forecast pain", "pain-and-consequence", "forecast-gap", "org")
      },
      {
        title:"Lock the inspection review",
        copy:"Leave the call with RevOps, the manager, and the deal set named.",
        action:jumpNode("Lock the review", "next-step-lock", "live-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"already-have-stack",
        label:"We already have Gong / Clari / Salesforce",
        reply:"That makes sense. I am not asking whether signal exists. I am asking where managers still have to translate it by hand before they trust a number.",
        actions:[
          jumpNode("Map the manager read", "current-state-truth", "manager-read", "blu"),
          jumpNode("Name the miss", "pain-and-consequence", "forecast-gap", "org")
        ]
      },
      {
        id:"just-show-dashboard",
        label:"Just show me the dashboard",
        reply:"I can. First give me one live deal or commit class the current stack still gets wrong so the screen earns its keep.",
        actions:[
          jumpNode("Use one live deal", "current-state-truth", "deal-review", "blu"),
          jumpNode("Set the proof bar", "proof-threshold", "live-proof", "pur")
        ]
      },
      {
        id:"sounds-like-coaching",
        label:"This sounds like manager coaching",
        reply:"Partly. The test is whether the system changes rep behavior and forecast trust, or whether managers still coach around missing signal forever.",
        actions:[
          jumpNode("Test behavior shift", "proof-threshold", "behavior-shift", "blu"),
          jumpNode("Return to commit risk", "pain-and-consequence", "commit-risk", "org")
        ]
      },
      {
        id:"forecast-is-fine",
        label:"Forecast is fine",
        reply:"Good. Then where does leadership still ask for manual inspection before believing the number?",
        actions:[
          jumpNode("Map the manual read", "current-state-truth", "manager-read", "blu"),
          jumpNode("Find the trigger", "trigger-and-urgency", "board-pressure", "org")
        ]
      },
      {
        id:"send-the-deck",
        label:"Send the deck",
        reply:"Happy to. What should it help your team decide so this does not die as a polite follow-up after the forecast call?",
        actions:[
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Clarify the proof bar", "proof-threshold", "live-proof", "blu")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening frame","Start on live forecast truth.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most revenue teams already have plenty of activity data. The question is where managers still have to interpret what is real by hand before they trust the forecast. Is that true in your world too?\"","Use this when they will diagnose before seeing product.",true,[
          branch("CONFIRMS","ok","\"Yes. The signal is there, but trust still depends on the manager reading between the lines.\"","\"Where does that manual read happen most painfully: forecast calls, one-on-ones, or deal reviews?\"",[
            jumpNode("Map the manager read", "current-state-truth", "manager-read", "blu"),
            jumpNode("Use one live deal", "current-state-truth", "deal-review", "grn")
          ],"Manual interpretation is part of the current motion.","You still need the exact inspection moment and a live example."),
          branch("STACK DEFENSE","ly","\"We already have the stack. Salesforce, Gong, dashboards, all of it.\"","\"Good. Then where does the stack still stop short of telling a manager whether a deal is actually safe?\"",[
            jumpNode("Inspect the deal read", "current-state-truth", "deal-review", "org"),
            jumpNode("Name the miss", "pain-and-consequence", "forecast-gap", "blu")
          ],"The buyer is defending tooling, not denying the problem.","You still need the gap between data presence and trust."),
          branch("PITCH REQUEST","fl","\"Can you just show me what the product does?\"","\"I can. Give me one live deal or commit class the current tooling still gets wrong so the screen maps to a real inspection problem.\"",[
            jumpNode("Use one live deal", "current-state-truth", "deal-review", "blu"),
            jumpNode("Set the proof bar", "proof-threshold", "live-proof", "pur")
          ],"They are trying to skip diagnosis.","You still need one real pipeline pattern before demo.")
        ]),
        node("opening-frame","live-deal","fu","Start from one live deal","\"Pick one deal leadership talks about like it is healthy, but a manager still does not fully trust. What is happening there?\"","Use this when the room is operator-heavy and ready to get concrete.",false,[
          branch("LIVE DEAL READY","ok","\"We have one in commit right now that still feels thinner than the stage language says.\"","\"Good. What exactly makes the manager distrust it: next step, champion, proof, timing, or multithreading?\"",[
            jumpNode("Inspect the deal", "current-state-truth", "deal-review", "grn"),
            jumpNode("Name the commit risk", "pain-and-consequence", "commit-risk", "blu")
          ],"A live deal is now anchoring the call.","You still need the specific failure pattern inside it."),
          branch("PIPELINE ANSWER","ly","\"It is not one deal. It is the whole pipeline view that feels soft.\"","\"Understood. Where does the softness surface first: manager inspection, forecast category changes, or rep follow-up discipline?\"",[
            jumpNode("Map the manager read", "current-state-truth", "manager-read", "org"),
            jumpNode("Open forecast pain", "pain-and-consequence", "forecast-gap", "blu")
          ],"The problem may be systemic instead of isolated.","You still need the first visible break in the system."),
          branch("NO EXAMPLE","fl","\"I do not have a live one in mind.\"","\"Then use the last forecast call that got uncomfortable. What made the number hard to believe?\"",[
            jumpNode("Use the forecast miss", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Find the trigger", "trigger-and-urgency", "board-pressure", "blu")
          ],"No live example is ready yet.","You still need a real forecast or review incident.")
        ]),
        node("opening-frame","sideways","ri","If the call starts sideways","\"If this is early, that is fine. What made this meeting worth taking now instead of after quarter close?\"","Use this when they are curious but not yet committed.",false,[
          branch("MISS OR PRESSURE","ok","\"We missed, or leadership does not trust the number enough right now.\"","\"Then let us follow that pressure. Where does trust first break in the current inspection motion?\"",[
            jumpNode("Find the trigger", "trigger-and-urgency", "board-pressure", "grn"),
            jumpNode("Map the manager read", "current-state-truth", "manager-read", "blu")
          ],"There is a real forcing event.","You still need the operational location of the distrust."),
          branch("SOFT IMPROVEMENT","ly","\"We mostly want to tighten what already exists.\"","\"Tighten where first: forecast calls, deal reviews, rep discipline, or CRM trust?\"",[
            jumpNode("Map the current motion", "current-state-truth", "rep-behavior", "org"),
            jumpNode("Test urgency", "trigger-and-urgency", "soft-trigger", "blu")
          ],"There is directional interest, but the scope is still soft.","You still need the highest-value pressure point."),
          branch("JUST INFORMING","fl","\"Nothing urgent. We are just staying informed.\"","\"That is workable. What would have to happen before revenue leadership treated this like a real priority?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Name the proof bar", "proof-threshold", "live-proof", "blu")
          ],"The call may be exploratory only.","You still need the threshold that would make this real.")
        ])
      ]),
      segment("current-state-truth","02","Current-state truth","Map how the number gets trusted.",true,[
        node("current-state-truth","manager-read","fu","Map the manager read","\"Walk me through how a frontline manager decides whether a deal is real today. What do they actually look at before they trust the commit?\"","Start here when they say trust still depends on human judgment.",true,[
          branch("MANUAL READ CLEAR","ok","\"Managers look at activity, next steps, and whether the rep sounds grounded, but it still takes a manual read.\"","\"Which part of that manual read breaks first: hidden risk, weak next step, or overconfident rep language?\"",[
            jumpNode("Name the hidden risk", "pain-and-consequence", "forecast-gap", "grn"),
            jumpNode("Inspect one live deal", "current-state-truth", "deal-review", "blu")
          ],"The manual inspection pattern is visible.","You still need the first unreliable signal inside it."),
          branch("EVERY MANAGER DIFFERS","ly","\"It depends on the manager. Everyone inspects a little differently.\"","\"That variation is usually the problem. Which inspection gap makes the forecast least trustworthy?\"",[
            jumpNode("Name the forecast miss", "pain-and-consequence", "forecast-gap", "org"),
            jumpNode("Find the sponsor", "stakeholder-and-ownership", "sponsor", "blu")
          ],"Inspection inconsistency is part of the problem.","You still need the consequence of that inconsistency."),
          branch("NO CLEAR PROCESS","fl","\"Honestly, it is more gut feel than process.\"","\"Then where does gut feel overrule visible deal evidence most often?\"",[
            jumpNode("Inspect one live deal", "current-state-truth", "deal-review", "red"),
            jumpNode("Set the proof bar", "proof-threshold", "live-proof", "blu")
          ],"The inspection system may be informal.","You still need a concrete deal pattern, not general discomfort.")
        ]),
        node("current-state-truth","deal-review","pr","Inspect one live deal","\"Take one deal the forecast treats as real. What would the manager have to check manually before backing it in front of leadership?\"","Use this when you need the current motion to get concrete fast.",false,[
          branch("DEAL THIN","ok","\"They would have to verify the next step, the champion, and whether the timeline is actually real.\"","\"Good. Which of those is most often wrong at commit time?\"",[
            jumpNode("Name the commit risk", "pain-and-consequence", "commit-risk", "grn"),
            jumpNode("Find who feels it", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"A live inspection checklist is now visible.","You still need the most expensive failure inside that checklist."),
          branch("FIELDS LOOK CLEAN","ly","\"Mostly they check whether the stage and fields look clean.\"","\"And when the fields look clean but the deal still dies, what was missing?\"",[
            jumpNode("Surface the blind spot", "pain-and-consequence", "commit-risk", "org"),
            jumpNode("Test the stack gap", "current-vendor-and-displacement", "tool-stack", "blu")
          ],"The current motion may over-trust CRM hygiene.","You still need the truth debt behind clean fields."),
          branch("NO LIVE DEAL","fl","\"We do not have one I want to unpack on this call.\"","\"Then use the last uncomfortable forecast call. What made a number feel less real once the questions started?\"",[
            jumpNode("Use forecast pain", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Use forecast call trigger", "trigger-and-urgency", "inspection-failure", "blu")
          ],"The buyer is avoiding a live deal example.","You still need a real review incident to keep the call honest.")
        ]),
        node("current-state-truth","rep-behavior","ri","Find the rep behavior gap","\"Where does the current system still fail to change rep behavior fast enough: next-step discipline, multithreading, deal hygiene, or risk honesty?\"","Use this when they talk more about manager productivity than forecast trust.",false,[
          branch("BEHAVIOR GAP CLEAR","ok","\"Reps still log things late and managers find out too late that the story was thin.\"","\"What behavior would have to change first for leadership to feel the pipeline got more believable?\"",[
            jumpNode("Set the proof bar", "proof-threshold", "behavior-shift", "grn"),
            jumpNode("Map the owner", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"There is a clear rep-behavior gap.","You still need the proof that behavior change matters enough to buy."),
          branch("MANAGER EFFICIENCY","ly","\"This is really more about manager efficiency.\"","\"Efficiency is fine, but where does inefficient inspection turn into forecast risk or rep drag?\"",[
            jumpNode("Name the rep drag", "pain-and-consequence", "rep-drag", "org"),
            jumpNode("Find the sponsor", "stakeholder-and-ownership", "sponsor", "blu")
          ],"The buyer is framing this as efficiency only.","You still need the revenue consequence, not just time saved."),
          branch("VISIBILITY ONLY","fl","\"Rep behavior is mostly fine. The issue is visibility.\"","\"Visibility into what exactly: risk, proof, timing, or ownership?\"",[
            jumpNode("Inspect the hidden risk", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Set the dashboard proof bar", "proof-threshold", "dashboard-proof", "blu")
          ],"The gap may be more observational than behavioral.","You still need the missing visibility object.")
        ])
      ]),
      segment("pain-and-consequence","03","Pain and consequence","Make forecast pain expensive.",true,[
        node("pain-and-consequence","forecast-gap","ri","Name the forecast miss","\"When the number is wrong, what is the actual damage: missed call, bad board prep, wasted rep time, or hidden risk aging out?\"","Start here when they admit trust is thin.",true,[
          branch("FORECAST DAMAGE CLEAR","ok","\"We waste time debating the number and still miss what is actually slipping.\"","\"Which part hurts most: leadership trust, manager time, or revenue surprise?\"",[
            jumpNode("Quantify the cost", "pain-and-consequence", "rep-drag", "grn"),
            jumpNode("Find the sponsor", "stakeholder-and-ownership", "sponsor", "blu")
          ],"Forecast pain is now explicit.","You still need its dominant cost and owner."),
          branch("TEAM TIME COST","ly","\"It mostly burns manager and rep time.\"","\"How much selling time or inspection time disappears because the signal is still thin?\"",[
            jumpNode("Quantify rep drag", "pain-and-consequence", "rep-drag", "org"),
            jumpNode("Test behavior proof", "proof-threshold", "behavior-shift", "blu")
          ],"The pain may start as time loss before it shows up as forecast miss.","You still need the magnitude of that drag."),
          branch("NOT MISSED YET","fl","\"We have not really missed yet. It just feels fragile.\"","\"Fragile how? Where do you still need a heroic manager read before backing the number?\"",[
            jumpNode("Use commit risk", "pain-and-consequence", "commit-risk", "red"),
            jumpNode("Find the trigger", "trigger-and-urgency", "soft-trigger", "blu")
          ],"The risk is visible before the miss lands.","You still need the fragility pattern in plain language.")
        ]),
        node("pain-and-consequence","commit-risk","pr","Surface hidden commit risk","\"Inside a deal that looks healthy on paper, what usually ends up being less real than the stage language suggests?\"","Use this to turn generic forecast pain into deal truth debt.",false,[
          branch("NEXT STEP THIN","ok","\"The next step looks real until you ask who accepted it and when.\"","\"How often does that happen late enough to damage the number?\"",[
            jumpNode("Tie it to urgency", "trigger-and-urgency", "inspection-failure", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"The commit risk is now a concrete deal pattern.","You still need its frequency or cost."),
          branch("CHAMPION THIN","ly","\"The rep sounds good, but there is not a real internal owner carrying it.\"","\"When that happens, who catches it first today: the manager, RevOps, or no one until later?\"",[
            jumpNode("Find the owner path", "stakeholder-and-ownership", "manager-owner", "org"),
            jumpNode("Test the stack gap", "current-vendor-and-displacement", "tool-stack", "blu")
          ],"The gap may be ownership, not activity.","You still need the detection point."),
          branch("TIMING THIN","fl","\"The timeline sounds strong until the deal sits in stage too long.\"","\"What should have surfaced that risk earlier than it does today?\"",[
            jumpNode("Inspect the stack", "current-vendor-and-displacement", "tool-stack", "red"),
            jumpNode("Set the dashboard proof bar", "proof-threshold", "dashboard-proof", "blu")
          ],"The hidden risk may be recency and decay.","You still need the signal that should have caught it.")
        ]),
        node("pain-and-consequence","rep-drag","fu","Find the rep drag","\"How much rep time still goes into feeding CRM, recapping deals, or defending the pipeline instead of selling?\"","Use this when the buyer keeps framing everything as ops efficiency.",false,[
          branch("REP DRAG REAL","ok","\"Reps still spend too much time updating, recapping, and chasing clean pipeline language.\"","\"If that went away, what would improve first: pipeline quality, manager trust, or selling time?\"",[
            jumpNode("Set behavior proof", "proof-threshold", "behavior-shift", "grn"),
            jumpNode("Find the manager owner", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"Rep drag is part of the value case.","You still need the outcome that matters most."),
          branch("MANAGERS ONLY","ly","\"It is more of a manager problem than a rep problem.\"","\"What does bad manager inspection cost the reps anyway?\"",[
            jumpNode("Return to forecast pain", "pain-and-consequence", "forecast-gap", "org"),
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "sponsor", "blu")
          ],"Manager burden may still leak into rep behavior.","You still need the downstream effect."),
          branch("TRUST ONLY","fl","\"Time is not the issue. Trust is.\"","\"That is enough. Then stay with trust. Where does the number stop feeling believable?\"",[
            jumpNode("Return to forecast miss", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Inspect one deal", "current-state-truth", "deal-review", "blu")
          ],"Trust is the real scope, not calendar load.","You still need the moment trust breaks.")
        ])
      ]),
      segment("trigger-and-urgency","04","Trigger and urgency","Find why this matters now.",true,[
        node("trigger-and-urgency","board-pressure","ri","Test board pressure","\"What changed recently that made leadership care about forecast truth harder than before?\"","Use this when they mention misses, scrutiny, or planning pressure.",true,[
          branch("MISS OR BOARD EVENT","ok","\"We missed, or leadership lost confidence in the number.\"","\"What happens before the next board or QBR if nothing changes?\"",[
            jumpNode("Use forecast call trigger", "trigger-and-urgency", "inspection-failure", "grn"),
            jumpNode("Find the sponsor", "stakeholder-and-ownership", "sponsor", "blu")
          ],"The forcing event is real.","You still need the deadline and the owner of the pressure."),
          branch("PLANNING PRESSURE","ly","\"We just need better signal this quarter.\"","\"What made this quarter different enough that better signal became urgent?\"",[
            jumpNode("Use softer trigger", "trigger-and-urgency", "soft-trigger", "org"),
            jumpNode("Return to pain", "pain-and-consequence", "forecast-gap", "blu")
          ],"Urgency may be real but under-described.","You still need the concrete forcing event."),
          branch("NO LEADERSHIP PRESSURE","fl","\"Leadership is not really pushing this yet.\"","\"Then who is? If no one is pushing, what would have to go wrong before this becomes active?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Test the proof bar", "proof-threshold", "live-proof", "blu")
          ],"There may be no active forcing function.","You still need the future trigger or an honest downgrade.")
        ]),
        node("trigger-and-urgency","inspection-failure","pr","Use the uncomfortable forecast call","\"Think about the last forecast or inspection call that got uncomfortable. What made the room doubt the number?\"","Use this when they cannot name urgency cleanly.",false,[
          branch("CALL GOT SHAKY","ok","\"The questions got deeper than the rep story could support.\"","\"That is the exact moment I care about. What was missing in the deal truth?\"",[
            jumpNode("Return to commit risk", "pain-and-consequence", "commit-risk", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "live-proof", "blu")
          ],"You now have a real failure moment.","You still need the missing truth category inside it."),
          branch("NUMBER MOVED LATE","ly","\"The number changed late because the risk showed up too late.\"","\"What should have surfaced that risk earlier?\"",[
            jumpNode("Inspect the stack", "current-vendor-and-displacement", "tool-stack", "org"),
            jumpNode("Set dashboard proof", "proof-threshold", "dashboard-proof", "blu")
          ],"The timing of risk detection is part of the scope.","You still need the missing leading indicator."),
          branch("NOTHING SPECIFIC","fl","\"It is more general unease than one call.\"","\"What pattern keeps repeating often enough that the team stopped trusting the number?\"",[
            jumpNode("Return to forecast pain", "pain-and-consequence", "forecast-gap", "red"),
            jumpNode("Use softer trigger", "trigger-and-urgency", "soft-trigger", "blu")
          ],"Urgency is pattern-based, not event-based.","You still need one repeated failure pattern.")
        ]),
        node("trigger-and-urgency","soft-trigger","fu","Keep a soft trigger honest","\"If the pressure is real but not urgent yet, what would have to happen before leadership treated this like a live forecast problem instead of an improvement idea?\"","Use this when they feel pressure but cannot name the forcing event cleanly.",false,[
          branch("TRIGGER SHOWS UP","ok","\"Another miss, ugly forecast call, or leadership challenge would make it active immediately.\"","\"Good. Then let us use that threshold to keep the next move honest instead of pretending the pressure is already here.\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "grn"),
            jumpNode("Define the proof bar", "proof-threshold", "live-proof", "blu")
          ],"A real activation threshold exists.","You still need the earliest warning sign."),
          branch("STILL VAGUE","fl","\"I still cannot name it exactly.\"","\"Then we should anchor on the inspection moment or deal pattern that makes this worth solving, not fake urgency.\"",[
            jumpNode("Return to manager read", "current-state-truth", "manager-read", "red"),
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "blu")
          ],"The pressure is still vague.","You still need one concrete inspection moment.")
        ]),
        node("trigger-and-urgency","exploratory","fu","Keep an exploratory call honest","\"If this is still early, what would have to happen for you to treat forecast signal as a live priority instead of an interesting idea?\"","Use this when the urgency is not active.",false,[
          branch("TRIGGER NAMED","ok","\"A miss, a board challenge, or scaling pain would make it active immediately.\"","\"Good. Then the right next step is to anchor on the earliest warning sign before that happens.\"",[
            jumpNode("Define the proof bar", "proof-threshold", "live-proof", "grn"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"The future trigger is now named.","You still need the signal that would prove it is starting."),
          branch("NO TRIGGER YET","ly","\"We are not there yet.\"","\"Understood. Then I would rather leave with the right watchpoint than force a fake next step.\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "org"),
            jumpNode("Name the proof bar", "proof-threshold", "live-proof", "blu")
          ],"The call should stay light and honest.","You still need the reason to re-open later."),
          branch("WRONG PERSON","fl","\"Leadership would have to answer that.\"","\"Then the fastest truth is getting that person into the next conversation instead of guessing here.\"",[
            jumpNode("Find the sponsor", "stakeholder-and-ownership", "sponsor", "red"),
            jumpNode("Shape the attendee list", "next-step-lock", "live-review", "blu")
          ],"The trigger owner is not in the room.","You still need the right leadership seat.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Stakeholder and ownership","Find who can move this.",true,[
        node("stakeholder-and-ownership","sponsor","pr","Find the sponsor","\"Who feels the forecast-trust problem badly enough that they would sponsor change instead of admiring the idea?\"","Use this once pain and urgency are visible.",true,[
          branch("CRO OR VP SALES","ok","\"Sales leadership owns the pressure because forecast trust rolls up to them.\"","\"What would they need to believe before backing this in public?\"",[
            jumpNode("Set the proof bar", "proof-threshold", "live-proof", "grn"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"A real sponsor seat is visible.","You still need the sponsor's proof bar."),
          branch("REVOPS CARRIES IT","ly","\"RevOps is carrying most of this right now.\"","\"Is RevOps the buyer, the evaluator, or the translator for sales leadership here?\"",[
            jumpNode("Map RevOps role", "stakeholder-and-ownership", "revops-owner", "org"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"RevOps matters, but the buying role is still unclear.","You still need to know who actually signs off."),
          branch("NO SPONSOR","fl","\"No one really owns it end to end.\"","\"Then the next move is not product. It is finding the first leader who pays for the distrust today.\"",[
            jumpNode("Find the manager owner", "stakeholder-and-ownership", "manager-owner", "red"),
            jumpNode("Shape the next review", "next-step-lock", "live-review", "blu")
          ],"Ownership is fragmented or absent.","You still need the first real economic owner.")
        ]),
        node("stakeholder-and-ownership","revops-owner","fu","Map the RevOps role","\"What exactly does RevOps own here: inspection design, reporting, tool evaluation, or just keeping the CRM clean?\"","Use this whenever RevOps enters the conversation.",false,[
          branch("EVALUATOR","ok","\"RevOps will evaluate and pressure-test whether the signal is real.\"","\"What does sales leadership need RevOps to prove before the motion is credible?\"",[
            jumpNode("Set the proof bar", "proof-threshold", "dashboard-proof", "grn"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"RevOps is a real evaluator.","You still need the executive approval rule."),
          branch("OPERATOR ONLY","ly","\"RevOps mainly keeps the system running and the fields clean.\"","\"Then whose pain makes this urgent beyond field hygiene?\"",[
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "sponsor", "org"),
            jumpNode("Return to forecast pain", "pain-and-consequence", "forecast-gap", "blu")
          ],"RevOps may not be the economic buyer.","You still need the executive pain owner."),
          branch("TOO MANY HANDS","fl","\"It is split between RevOps, managers, and leadership.\"","\"Who can stop this from moving, even if everyone else likes it?\"",[
            jumpNode("Map the stall", "decision-architecture", "stall-map", "red"),
            jumpNode("Shape the next review", "next-step-lock", "live-review", "blu")
          ],"Influence is spread across the org.","You still need the veto holder.")
        ]),
        node("stakeholder-and-ownership","manager-owner","ri","Find the frontline owner","\"Who actually pays for weak pipeline truth first: frontline managers, second-line leaders, or the CRO?\"","Use this when the buyer keeps describing manager pain.",false,[
          branch("MANAGERS PAY FIRST","ok","\"Frontline managers spend too much time inspecting and rescuing weak deals.\"","\"What would have to change for them to feel the workflow got materially better?\"",[
            jumpNode("Set behavior proof", "proof-threshold", "behavior-shift", "grn"),
            jumpNode("Use the live review", "next-step-lock", "live-review", "blu")
          ],"Managers are a real pain owner.","You still need the improvement they would recognize."),
          branch("EXECS PAY FIRST","ly","\"Leadership feels it more because the number gets shaky.\"","\"Then stay with the executive lens. What would make the number publicly safer?\"",[
            jumpNode("Set executive proof", "proof-threshold", "live-proof", "org"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"The case may be executive trust more than manager efficiency.","You still need the executive proof standard."),
          branch("NO CLEAR OWNER","fl","\"Everyone feels it a little.\"","\"When everyone owns it a little, no one buys. Who would lose face first if the forecast missed again?\"",[
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "sponsor", "red"),
            jumpNode("Use board pressure", "trigger-and-urgency", "board-pressure", "blu")
          ],"The pain is diffused.","You still need the first accountable leader.")
        ])
      ]),
      segment("proof-threshold","06","Proof threshold","Find what would make them believe.",true,[
        node("proof-threshold","live-proof","pr","Name the real proof bar","\"What would make this feel real to your team: one live deal read, a manager-behavior shift, better forecast confidence, or all three?\"","Start here when the buyer says they need proof.",true,[
          branch("LIVE DEAL READ","ok","\"Show me this on one real deal or commit set and I will know if it matters.\"","\"Good. Then the next review should be built around a live deal set, not a generic demo.\"",[
            jumpNode("Lock the live review", "next-step-lock", "live-review", "grn"),
            jumpNode("Choose the deal set", "next-step-lock", "deal-set", "blu")
          ],"Proof must be demonstrated in live deal context.","You still need the exact people and deal set."),
          branch("BEHAVIOR CHANGE","ly","\"I need to see reps and managers actually use this differently.\"","\"What behavior would count: risk honesty, next-step discipline, multithreading, or cleaner inspection?\"",[
            jumpNode("Test behavior proof", "proof-threshold", "behavior-shift", "org"),
            jumpNode("Find the manager owner", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"Adoption proof matters as much as analytics proof.","You still need the specific behavior that changes belief."),
          branch("DASHBOARD FIRST","fl","\"I want to know the signal itself is better before we talk workflow change.\"","\"Then the test is not prettier dashboards. It is whether the signal surfaces hidden deal risk earlier than the current stack does.\"",[
            jumpNode("Compare against the stack", "current-vendor-and-displacement", "tool-stack", "red"),
            jumpNode("Set dashboard proof", "proof-threshold", "dashboard-proof", "blu")
          ],"They are asking for signal superiority first.","You still need the benchmark they will trust.")
        ]),
        node("proof-threshold","behavior-shift","fu","Test behavior change","\"If this works, what should change first in the field: rep updates, manager inspection, forecast calls, or deal reviews?\"","Use this when the buyer frames value around workflow change.",false,[
          branch("MANAGER INSPECTION","ok","\"Managers should spend less time translating and more time coaching with real signal.\"","\"Then the next review has to show exactly that shift on one live deal set.\"",[
            jumpNode("Lock the live review", "next-step-lock", "live-review", "grn"),
            jumpNode("Choose the deal set", "next-step-lock", "deal-set", "blu")
          ],"Manager behavior is part of the proof bar.","You still need the proof environment."),
          branch("REP DISCIPLINE","ly","\"Reps should become more honest and cleaner faster.\"","\"What specific behavior would tell you that happened: next steps, multithreading, risk flagging, or stage honesty?\"",[
            jumpNode("Return to rep behavior", "current-state-truth", "rep-behavior", "org"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Rep behavior is a required outcome.","You still need the visible indicator."),
          branch("NO BEHAVIOR NEED","fl","\"If the signal is right, behavior will take care of itself.\"","\"Maybe, but the buyer usually needs one visible workflow change to trust the signal is not ornamental. What would that be here?\"",[
            jumpNode("Return to live proof", "proof-threshold", "live-proof", "red"),
            jumpNode("Set dashboard proof", "proof-threshold", "dashboard-proof", "blu")
          ],"They may be underestimating adoption proof.","You still need one visible workflow outcome.")
        ]),
        node("proof-threshold","dashboard-proof","ri","If they ask for dashboard proof","\"When you say you need to see the dashboard, what would it have to surface earlier or more clearly than today to matter?\"","Use this instead of treating dashboard curiosity as proof by itself.",false,[
          branch("EARLIER RISK","ok","\"It would need to show hidden deal risk before the forecast call gets ugly.\"","\"Great. Then define the exact risk pattern it must surface on a live deal set.\"",[
            jumpNode("Return to commit risk", "pain-and-consequence", "commit-risk", "grn"),
            jumpNode("Lock the live review", "next-step-lock", "live-review", "blu")
          ],"The dashboard is really a risk-detection test.","You still need the benchmark deal set."),
          branch("BETTER PRIORITIZATION","ly","\"It would need to help managers know where to spend time first.\"","\"Which decision does the current stack still fail to make clear enough: which deal to inspect, what question to ask, or whether the number is safe?\"",[
            jumpNode("Return to manager read", "current-state-truth", "manager-read", "org"),
            jumpNode("Map the tool stack gap", "current-vendor-and-displacement", "tool-stack", "blu")
          ],"The ask is about guidance, not visuals.","You still need the manager decision the system must improve."),
          branch("JUST SHOW SOMETHING","fl","\"I just want to see it.\"","\"Fair. I still need the live inspection question first so the screen earns its keep.\"",[
            jumpNode("Return to live proof", "proof-threshold", "live-proof", "red"),
            jumpNode("Open the live deal", "current-state-truth", "deal-review", "blu")
          ],"Curiosity is outrunning diagnosis.","You still need the call anchored to a real proof question.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor and displacement","Test why the stack still wins.",false,[
        node("current-vendor-and-displacement","tool-stack","ri","Map the stack mix","\"What is doing the work today: Salesforce, call recording, spreadsheet overlays, manager inspection habits, or something internal?\"","Start here once they say they already have tools.",true,[
          branch("STACK MIX CLEAR","ok","\"It is a stack of systems plus manager interpretation and some spreadsheet rescue.\"","\"Which piece gives the team the false sense that pipeline truth is handled when it actually is not?\"",[
            jumpNode("Return to hidden risk", "pain-and-consequence", "forecast-gap", "grn"),
            jumpNode("Set dashboard proof", "proof-threshold", "dashboard-proof", "blu")
          ],"The incumbent stack is now visible as a mix, not a product.","You still need the false-confidence layer."),
          branch("TOOL DOES MOST","ly","\"Clari or Gong gets us most of the way there already.\"","\"Most of the way is fine. What still forces the manager to overrule what the tool says?\"",[
            jumpNode("Return to manager read", "current-state-truth", "manager-read", "org"),
            jumpNode("Return to commit risk", "pain-and-consequence", "commit-risk", "blu")
          ],"The incumbent works partially, not fully.","You still need the remaining manual override."),
          branch("FRAGMENTED STACK","fl","\"Different teams use different things.\"","\"Then the displacement case may be workflow simplification first. Where does that mess cost the most today?\"",[
            jumpNode("Return to rep drag", "pain-and-consequence", "rep-drag", "red"),
            jumpNode("Find the buyer", "stakeholder-and-ownership", "revops-owner", "blu")
          ],"The current stack may itself be fragmented.","You still need the most expensive fragment.")
        ]),
        node("current-vendor-and-displacement","internal-build","fu","If they built it themselves","\"What does the internal workflow do well today, and where does it still fail to make the forecast more trustworthy?\"","Use this when they say they already built something.",false,[
          branch("BUILD HELPS BUT THIN","ok","\"It helps organize activity, but it still does not settle what is real.\"","\"Then we are not replacing a dashboard. We are replacing the manual interpretation still wrapped around it.\"",[
            jumpNode("Return to manager read", "current-state-truth", "manager-read", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "live-proof", "blu")
          ],"The internal build covers only part of the job.","You still need the missing judgment layer."),
          branch("BUILD IS POLITICAL","ly","\"We have invested in it, so displacement will be sensitive.\"","\"Understood. What business result would justify changing the motion anyway?\"",[
            jumpNode("Return to pain", "pain-and-consequence", "forecast-gap", "org"),
            jumpNode("Map the stall", "decision-architecture", "stall-map", "blu")
          ],"Internal politics are part of the displacement cost.","You still need the result strong enough to beat sunk cost."),
          branch("BUILD GOOD ENOUGH","fl","\"Honestly, the internal motion is mostly working.\"","\"Then what still made this meeting worth taking?\"",[
            jumpNode("Return to trigger", "trigger-and-urgency", "board-pressure", "red"),
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "blu")
          ],"The incumbent may still be winning.","You still need the live scope or an honest no.")
        ]),
        node("current-vendor-and-displacement","switch-risk","va","Test switching risk","\"What would make changing this stack feel dangerous: rep adoption, forecast disruption, RevOps load, or leadership trust?\"","Use this to expose the real displacement blocker.",false,[
          branch("ADOPTION RISK","ok","\"If reps or managers do not use it, it dies fast.\"","\"Then the next review has to prove workflow fit, not just signal quality.\"",[
            jumpNode("Set behavior proof", "proof-threshold", "behavior-shift", "grn"),
            jumpNode("Lock the live review", "next-step-lock", "live-review", "blu")
          ],"Adoption risk is central to the decision.","You still need the behavior that proves fit."),
          branch("FORECAST RISK","ly","\"We cannot risk destabilizing the number mid-quarter.\"","\"Then the proof bar is simple: show one safe, narrow inspection scope before broad rollout.\"",[
            jumpNode("Choose the deal set", "next-step-lock", "deal-set", "org"),
            jumpNode("Set the live proof", "proof-threshold", "live-proof", "blu")
          ],"Rollout risk is constraining the motion.","You still need the smallest safe scope."),
          branch("INERTIA","fl","\"It is mostly just inertia.\"","\"Inertia usually means the pain or sponsor is still too weak. Which one is true here?\"",[
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "sponsor", "red"),
            jumpNode("Return to pain", "pain-and-consequence", "forecast-gap", "blu")
          ],"The blocker may be weak urgency, not technical risk.","You still need the real source of inertia.")
        ])
      ]),
      segment("decision-architecture","08","Decision architecture","Map how this actually moves.",false,[
        node("decision-architecture","buying-path","pr","Map the buying path","\"If this became real, who would sponsor, who would evaluate, and who could slow or stop it?\"","Start here once sponsor and proof are partly visible.",true,[
          branch("PATH CLEAR","ok","\"Sales leadership would sponsor, RevOps would evaluate, and IT or finance would weigh in later.\"","\"Good. What would RevOps have to prove before sales leadership makes this public?\"",[
            jumpNode("Return to proof", "proof-threshold", "live-proof", "grn"),
            jumpNode("Shape the next meeting", "next-step-lock", "live-review", "blu")
          ],"The path from sponsor to evaluator is visible.","You still need the gate that turns evaluation into motion."),
          branch("PATH SPLIT","ly","\"The value sits with sales leadership, but RevOps and finance will complicate it.\"","\"Which of those can actually kill this if the proof is strong?\"",[
            jumpNode("Map the stall", "decision-architecture", "stall-map", "org"),
            jumpNode("Choose the attendees", "next-step-lock", "live-review", "blu")
          ],"There are competing stakeholder logics.","You still need the true veto point."),
          branch("PATH UNKNOWN","fl","\"We are too early to know the full path.\"","\"That is fine. Who definitely has to believe this first for the path to matter at all?\"",[
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "sponsor", "red"),
            jumpNode("Keep the next step light", "next-step-lock", "soft-deferral", "blu")
          ],"Decision architecture is still fuzzy.","You still need the first internal believer.")
        ]),
        node("decision-architecture","stall-map","fu","Name the stall point","\"Where do deals like this usually slow down internally: RevOps scrutiny, IT review, finance skepticism, or leadership distraction?\"","Use this when the path exists but feels fragile.",false,[
          branch("REVOPS GATE","ok","\"RevOps will challenge the signal quality and process change hard.\"","\"Then the next review should give RevOps the live deal set and the exact inspection question.\"",[
            jumpNode("Lock the live review", "next-step-lock", "live-review", "grn"),
            jumpNode("Set dashboard proof", "proof-threshold", "dashboard-proof", "blu")
          ],"RevOps is the critical gate.","You still need the data they will trust."),
          branch("FINANCE OR IT","ly","\"Finance or IT can slow it if the value or implementation sounds fuzzy.\"","\"What would they need first: economic clarity, rollout safety, or limited scope?\"",[
            jumpNode("Test switching risk", "current-vendor-and-displacement", "switch-risk", "org"),
            jumpNode("Choose the deal set", "next-step-lock", "deal-set", "blu")
          ],"The blocker may be control or economics, not sales skepticism.","You still need the right scope to lower that risk."),
          branch("ATTENTION RISK","fl","\"Nothing formal kills it. It just loses oxygen.\"","\"Then the next step has to be concrete enough that it cannot hide in polite interest.\"",[
            jumpNode("Lock a real meeting", "next-step-lock", "live-review", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "board-pressure", "blu")
          ],"Attention risk is the real danger.","You still need a next step that earns calendar gravity.")
        ])
      ]),
      segment("next-step-lock","09","Next-step lock","Leave with a real review.",true,[
        node("next-step-lock","live-review","pr","Lock the live inspection review","\"The next best step sounds like a live inspection review with RevOps, the manager, and one real deal set. Does that fit how your team would validate this?\"","Start here whenever proof points to a live workflow review.",true,[
          branch("YES LOCK IT","ok","\"Yes. That is the right shape.\"","\"Good. Which deals or commit category should we inspect so the review earns the time?\"",[
            jumpNode("Choose the deal set", "next-step-lock", "deal-set", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The next review format is agreed.","You still need the exact deal set and seats."),
          branch("NEEDS NARROWER START","ly","\"Close, but start with RevOps only or one manager first.\"","\"That works. Which narrower format still gives us a real inspection problem instead of a generic walkthrough?\"",[
            jumpNode("Choose the deal set", "next-step-lock", "deal-set", "org"),
            jumpNode("Return to manager owner", "stakeholder-and-ownership", "manager-owner", "blu")
          ],"The review shape needs tuning, not replacement.","You still need the narrowest real proving ground."),
          branch("TOO EARLY","fl","\"That feels like too much for where we are.\"","\"Understood. Then what would make the next step real enough to keep momentum without pretending we are further along than we are?\"",[
            jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to proof", "proof-threshold", "live-proof", "blu")
          ],"The buyer is not ready for a full review yet.","You still need a lighter but real progression step.")
        ]),
        node("next-step-lock","deal-set","fu","Choose the deal set","\"Which deals should be in the review: current commits, late-stage slips, or one live inspection set your managers already debate?\"","Use this to stop the next step from becoming generic.",false,[
          branch("COMMIT SET","ok","\"Use the current commit set or the deals leadership keeps questioning.\"","\"Perfect. That makes the review real immediately.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The proving ground is concrete.","You still need the exact attendees and calendar hold."),
          branch("ONE MANAGER SET","ly","\"Start with one manager's inspection set before going broader.\"","\"That is a strong first scope. Which manager has enough pain to make the session honest?\"",[
            jumpNode("Return to manager owner", "stakeholder-and-ownership", "manager-owner", "org"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"A narrower proving set may be safer.","You still need the right manager and the date."),
          branch("NO SET YET","fl","\"We do not know which deals to use yet.\"","\"Then the next step is not locked. Who can pick that set before the meeting goes on calendar?\"",[
            jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to sponsor", "stakeholder-and-ownership", "sponsor", "blu")
          ],"The next review is still underspecified.","You still need the owner of the deal set.")
        ]),
        node("next-step-lock","soft-deferral","ri","If the next step stays soft","\"What has to become true before the next conversation earns real calendar gravity?\"","Use this when they want to stay polite but noncommittal.",false,[
          branch("ADVANCEMENT CONDITION","ok","\"If we can show this on a live deal set with the right people, then it earns the next session.\"","\"That is enough. Let us route that exact condition forward.\"",[
            jumpNode("Write the handoff", "post-call-routing", "handoff", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"A real advancement condition is now named.","You still need to carry it forward cleanly."),
          branch("SEND MATERIAL","ly","\"Send material and we will see.\"","\"I will, but I want to attach it to the one decision you still need to make, not a generic deck. What is that decision?\"",[
            jumpNode("Write the handoff", "post-call-routing", "handoff", "org"),
            jumpNode("Return to proof", "proof-threshold", "live-proof", "blu")
          ],"The buyer is deferring without a clear gate.","You still need the decision the material should support."),
          branch("NO REAL NEXT","fl","\"Nothing specific. We just need to think.\"","\"Then I would rather leave with the honest blocker than pretend we have a next step. What is still missing?\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"Momentum is still too soft to trust.","You still need the missing truth in plain language.")
        ])
      ]),
      segment("post-call-routing","10","Post-call routing","Hand off only what helps.",false,[
        node("post-call-routing","handoff","cl","Write the handoff","\"If the next room picked this up cold, what would it need to know in the first 30 seconds?\"","Use this to strip the call down to usable sales truth.",false,[
          branch("HANDOFF CLEAN","ok","\"Carry the live inspection problem, the sponsor path, the proof bar, and the next review condition.\"","\"Good. Keep only what changes the next move.\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "grn"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The handoff can now start from signal instead of notes.","You still need the one missing truth to chase."),
          branch("HANDOFF TOO VERBAL","ly","\"We have a lot of notes, but not a clean story yet.\"","\"Then throw away anything that does not change the next review question. What is actually usable?\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "org"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The raw detail exists, but the usable signal is still diluted.","You still need the distilled pressure and route."),
          branch("NO HANDOFF HABIT","fl","\"We do not really capture this cleanly today.\"","\"Then the minimum capture rule is simple: owner, pressure, proof bar, next condition.\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The handoff discipline itself is weak.","You still need the one capture rule that sticks.")
        ]),
        node("post-call-routing","missing-truth","fu","Name the missing truth","\"What is still missing that the next room has to chase directly before this becomes real?\"","Use this so the handoff carries a chase-down target.",false,[
          branch("MISSING TRUTH CLEAR","ok","\"We still need the real deal set, the sponsor seat, or the proof benchmark.\"","\"Good. Then route the call to the room most likely to surface that fast.\"",[
            jumpNode("Choose the next room", "post-call-routing", "room-route", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The missing truth is clearly named.","You still need the room best suited to chase it."),
          branch("MISSING OWNER","ly","\"We know the gap, but not who can answer it.\"","\"Then the next room should start with the owner map, not another product conversation.\"",[
            jumpRoom("Open Call Planner", "call-planner", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The truth gap is visible but ownerless.","You still need the best route to the right person."),
          branch("TOO THIN","fl","\"Too much is still vague.\"","\"Then do not pretend this is a healthy progression. Name the drift now and correct it before the deal ages.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The call may need correction more than continuation.","You still need the clearest failure pattern.")
        ]),
        node("post-call-routing","room-route","pr","Choose the next room","\"Which next room gives the strongest immediate leverage: shape the next review, attach truth to the deal, or name the failure pattern before it ages?\"","Use this to route with intent instead of habit.",false,[
          branch("CALL PLANNER","ok","\"The next move is a tighter inspection conversation with a clearer forcing question.\"","\"Then route this to Call Planner with the deal set, sponsor path, and proof bar.\"",[
            jumpRoom("Open Call Planner", "call-planner", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The next room is conversational and tactical.","You still need the forcing question in plain language."),
          branch("DEAL WORKSPACE","ly","\"There is already a live opportunity path here.\"","\"Then attach the what is actually happening to the live deal immediately before the forecast story drifts again.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
            jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
          ],"The truth belongs with a live pipeline object.","You still need the top risk to carry with it."),
          branch("FUTURE AUTOPSY","fl","\"This still feels like decorative motion or drift.\"","\"Then route it to Future Autopsy now and name the failure pattern before the next forecast call hides it.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The next room may need to correct drift, not advance motion.","You still need the failure pattern in plain language.")
        ])
      ])
    ]
  };
})();
