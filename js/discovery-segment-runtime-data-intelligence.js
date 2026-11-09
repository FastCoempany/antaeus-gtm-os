(function(){
  var runtime = window.DISCOVERY_SEGMENT_RUNTIME;
  if(!runtime || !runtime.frameworks || !runtime.frameworks["data-intelligence"]) return;

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

  var base = runtime.frameworks["data-intelligence"];

  var supportDossier = [
    { title:"Downstream use", items:["Which product, model, or monitoring workflow the data actually powers", "What false positives and false negatives cost them operationally right now", "Whether they need a raw API, enriched data, or alerts"] },
    { title:"What they need to see", items:["Retrieval accuracy on a live query they care about this quarter", "Freshness and latency benchmarked against their current internal alternative", "Source breadth, language coverage, and schema stability for their real workload"] },
    { title:"Decision path", items:["Product, data, or AI-platform owner who feels the feed quality pain", "Engineering or infra evaluator who decides build-versus-buy", "Risk, compliance, or licensing owner if governance has to approve it"] }
  ];
  var objectionLibrary = [
    { trigger:"we can build this internally", reply:"Many teams can. The real question is whether building this keeps your best engineers from building the thing only your company can build. What are they not getting to because of this feed?" },
    { trigger:"we already license a news feed", reply:"Good. When was the last time that feed surfaced something that changed a decision, and when was the last time it added noise you had to filter out downstream?" },
    { trigger:"data rights and licensing will block this", reply:"Fair. Those are real approvals. What is the scope of use that matters most — retrieval for models, monitoring for alerts, or analyst research — because the licensing story differs for each." },
    { trigger:"our data is too messy for any feed to fix", reply:"That may be true. Then the question is not about our feed. It is whether the messiness blocks one decision that matters now, and whether outside data could work around it." }
  ];
  var inboundQuestionHandlers = [
    { question:"What sources do you cover?", bridge:"Broad, but that is rarely the deciding factor. More useful: which source or language would you notice if it were missing from the first week of usage?" },
    { question:"How does this help with LLM retrieval?", bridge:"Depends on why your model gets things wrong — whether it is missing information it knows it needs, or doesn't know it is missing anything. What usually happens today when the model gets a question about recent events wrong?" },
    { question:"Can we try it with our data?", bridge:"Yes. First tell me which query or workflow you would want the pilot to handle, because a generic trial will not reveal what matters." }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing makes sense once we know whether the feed changes a decision or something your product produces. What problem is it supposed to solve first?" },
    { trigger:"asks for demo too early", reply:"I can demo it. First tell me which query, entity, or monitoring case you would want the demo to prove — otherwise it becomes a tour." },
    { trigger:"sends me to data engineering", reply:"Happy to talk to them. Before that, what operational or product outcome is supposed to come out of this feed? Engineering will need that to evaluate fit." }
  ];

  runtime.frameworks["data-intelligence"] = {
    id:base.id,
    label:base.label,
    short:base.short,
    storageKey:base.storageKey,
    aliases:base.aliases,
    persona:"Platform / product / risk",
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
        title:"Classify the dependency",
        copy:"Separate AI retrieval, monitoring/compliance, and market-intelligence use first.",
        action:jumpNode("Ask which problem is most urgent", "opening-frame", "motion-type", "blu")
      },
      {
        title:"Use one broken downstream job",
        copy:"Anchor on the first workflow that gets weaker when the feed has coverage gaps.",
        action:jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "org")
      },
      {
        title:"Lock the data review",
        copy:"Leave with the platform owner and the consuming team around one live dependency.",
        action:jumpNode("Book the next review meeting", "next-step-lock", "live-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"we-can-build-this",
        label:"We can build this ourselves",
        reply:"Maybe. I want to know which part you actually want to own long term: crawling and ingestion, freshness and coverage, or the downstream product that consumes the signal.",
        actions:[
          jumpNode("Ask what they use internally instead", "current-state-truth", "internal-alt", "blu"),
          jumpNode("Ask which part they want to build themselves", "current-vendor-and-displacement", "build-bias", "org")
        ]
      },
      {
        id:"just-show-api",
        label:"Just show the API",
        reply:"I can. First tell me whether the hard part is freshness, coverage, structure, or reliability good enough to cite, so I do not show the wrong kind of evidence.",
        actions:[
          jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "pur"),
          jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "blu")
        ]
      },
      {
        id:"we-already-have-feeds",
        label:"We already have feeds",
        reply:"That helps. I am trying to learn where the current feed still has coverage gaps or is noisy enough that the teams using it fix things by hand.",
        actions:[
          jumpNode("Ask what depends on this data today", "current-state-truth", "downstream-use", "blu"),
          jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "downstream-cost", "org")
        ]
      },
      {
        id:"rights-and-governance",
        label:"Rights or governance matter most",
        reply:"Understood. Then let's stay on source rights, reproducibility, and whether the current data is trustworthy enough for how it is used.",
        actions:[
          jumpNode("Ask what rights and licensing checks they need", "proof-threshold", "governance-proof", "blu"),
          jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "rights-gate", "org")
        ]
      },
      {
        id:"not-a-workflow-app",
        label:"We want a workflow app, not infrastructure",
        reply:"That is useful. Then the first question is whether the team using the data actually needs a data feed, or whether they are really shopping for a finished application.",
        actions:[
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Ask what depends on this data today", "current-state-truth", "downstream-use", "blu")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening","Find out what the data feeds and how much depends on it.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most teams can get some external data. The real question is where the current feed still has coverage gaps or stale enough that downstream systems lose trust or teams compensate manually. Is that where this lives for you too?\"","Use this when they're willing to talk through the problem before seeing the product.",true,[
          branch("CONFIRMS","ok","\"Yes. We have feeds, but the downstream teams still patch around freshness or coverage gaps.\"","\"Good. Is the current workflow here AI retrieval, monitoring and compliance, or market / analyst intelligence?\"",[
            jumpNode("Ask which problem is most urgent", "opening-frame", "motion-type", "grn"),
            jumpNode("Ask what depends on this data today", "current-state-truth", "downstream-use", "blu")
          ],"The current layer is not fully trusted by the consumers.","You still need the primary downstream use case."),
          branch("FEED DEFENSE","ly","\"We already have data vendors and internal pipelines.\"","\"Understood. Then where does the current layer still break: freshness, coverage, structure, or reliability?\"",[
            jumpNode("Ask what depends on this data today", "current-state-truth", "downstream-use", "org"),
            jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "downstream-cost", "blu")
          ],"The buyer is defending the stack, not denying the gap.","You still need the first broken data property."),
          branch("PITCH REQUEST","fl","\"Can you just show the API?\"","\"I can. First tell me which downstream job fails first when the current feed has coverage gaps so I do not show the wrong kind of evidence.\"",[
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "blu"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "pur")
          ],"The buyer has asked to see the product before describing the workflow.","You still need the active dependency before demo.")
        ]),
        node("opening-frame","motion-type","fu","Ask which problem is most urgent","\"Which side is most urgent today: AI or retrieval quality, monitoring and compliance, or market / analyst intelligence?\"","Find this out early, because the rest of the call depends on it.",false,[
          branch("AI / RETRIEVAL","ok","\"The feed powers models, search, or AI retrieval and the current layer is not strong enough.\"","\"Good. Then what breaks first today: latency, coverage, structure, or reproducibility?\"",[
            jumpNode("Ask what depends on this data today", "current-state-truth", "downstream-use", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "reliability-proof", "blu")
          ],"This is an AI-platform / retrieval use case.","You still need the first broken quality property."),
          branch("MONITORING / COMPLIANCE","ly","\"This is more about monitoring, risk, or compliance than AI.\"","\"Good. Then what signal is still too late, too noisy, or too narrow to drive action?\"",[
            jumpNode("Ask what depends on this data today", "current-state-truth", "downstream-use", "org"),
            jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "downstream-cost", "blu")
          ],"This is a monitoring / risk use case.","You still need the first operational miss."),
          branch("MARKET / ANALYST","fl","\"It is really about market intelligence and analyst workflow.\"","\"Good. Then what still burns the most time today: finding signal, trusting it, or keeping coverage wide enough?\"",[
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "red"),
            jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "analyst-burden", "blu")
          ],"This is an intelligence-workflow use case.","You still need the first downstream burden.")
        ]),
        node("opening-frame","sideways","ri","If the call starts off-topic","\"If this is still early, that is fine. What made this worth looking at now instead of leaving the current data layer alone?\"","Use this when they are curious but not yet committed.",false,[
          branch("NEW USE CASE","ok","\"A new AI product, monitoring use case, or compliance burden made the current layer feel too weak.\"","\"Then let us start there. What downstream job is least forgiving if the feed goes wrong?\"",[
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "grn"),
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "new-use-case", "blu")
          ],"There is a real trigger.","You still need the first downstream dependency that breaks."),
          branch("GENERAL IMPROVEMENT","ly","\"We mostly want better coverage or freshness than we have now.\"","\"Which team or system needs better coverage or fresher data: a model, a monitor, a risk workflow, or an analyst team?\"",[
            jumpNode("Ask what depends on this data today", "current-state-truth", "downstream-use", "org"),
            jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "downstream-cost", "blu")
          ],"They are generally interested, but the scope is still broad.","You still need the live consuming workflow."),
          branch("NOTHING URGENT","fl","\"Nothing urgent. We are just exploring.\"","\"That is workable. What would have to happen before the data layer itself became a real priority instead of a nice-to-have?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The call may be exploratory only.","You still need the threshold that would make this move.")
        ])
      ]),
      segment("current-state-truth","02","How they work today","Ask where the data comes from today and what they do when it is wrong.",true,[
        node("current-state-truth","downstream-use","fu","Ask what depends on this data today","\"What does this feed power today: AI retrieval, monitoring, risk, compliance, market intelligence, supplier intelligence, or something else?\"","Start here once you roughly know which kind of problem this is.",true,[
          branch("USE CLEAR","ok","\"We know the exact downstream system or team that depends on it.\"","\"Good. What breaks first when the feed is late, incomplete, or noisy in that workflow?\"",[
            jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "downstream-cost", "grn"),
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "blu")
          ],"You can see what depends on the data.","You still need the first broken moment inside it."),
          branch("MULTIPLE CONSUMERS","ly","\"It feeds several teams and systems at once.\"","\"Which one is least forgiving if coverage or freshness slips?\"",[
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "org"),
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The feed may be shared across the org.","You still need the most demanding consuming workflow."),
          branch("UNCLEAR USE","fl","\"It is more general platform infrastructure than one clear workflow.\"","\"Then pick the first downstream team that complains when the current layer gets weak.\"",[
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "red"),
            jumpNode("Ask what they use internally instead", "current-state-truth", "internal-alt", "blu")
          ],"The use case is still too abstract.","You still need one consuming workflow to anchor the call.")
        ]),
        node("current-state-truth","internal-alt","pr","Ask what they use internally instead","\"What is the internal alternative today: a crawler, search stack, scraping vendors, analyst labor, stale datasets, or some combination?\"","Use this when the buyer would rather build it themselves.",false,[
          branch("DIY STACK","ok","\"We already own part of the ingestion layer, but it is brittle or expensive to maintain.\"","\"Which part hurts most: source maintenance, coverage, entity resolution, or freshness?\"",[
            jumpNode("Ask which part they want to build themselves", "current-vendor-and-displacement", "build-bias", "grn"),
            jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "downstream-cost", "blu")
          ],"The internal alternative exists but is costly.","You still need the most expensive failure inside it."),
          branch("ANALYST PATCHWORK","ly","\"Analysts or operators still patch the gaps manually.\"","\"What do those humans still have to do that the data layer should have solved already?\"",[
            jumpNode("Ask what analysts still fix by hand", "pain-and-consequence", "analyst-burden", "org"),
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "blu")
          ],"People make up for what the current system can't do.","You still need the repeated manual step."),
          branch("VENDOR MIX","fl","\"We have a mix of vendors and legacy feeds already.\"","\"Which part of that mix still fails to give downstream teams the confidence they need?\"",[
            jumpNode("Ask what tools do this work today", "current-vendor-and-displacement", "current-stack", "red"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The current stack is fragmented or overlapping.","You still need the first weak link.")
        ]),
        node("current-state-truth","live-example","ri","Ask for one recent time bad data hurt a team","\"Give me one recent moment where a model, monitor, analyst, or risk workflow got weaker because the external signal was missing, stale, or untrustworthy.\"","Use this when the conversation stays general.",false,[
          branch("LIVE BREAKAGE","ok","\"We had a recent case where our current data didn't flag the right thing fast enough.\"","\"What specifically failed first: freshness, coverage, structure, or source trust?\"",[
            jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "downstream-cost", "grn"),
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "new-use-case", "blu")
          ],"The call now has a real failure moment.","You still need the broken data property inside it."),
          branch("SOFT EXAMPLE","ly","\"Nothing dramatic, but teams constantly work around weak signal.\"","\"What workaround burns the most time today: manual validation, source chasing, enrichment, or analyst review?\"",[
            jumpNode("Ask what analysts still fix by hand", "pain-and-consequence", "analyst-burden", "org"),
            jumpNode("Ask what they use internally instead", "current-state-truth", "internal-alt", "blu")
          ],"The pain may be cumulative rather than dramatic.","You still need the most repeated workaround."),
          branch("NO EXAMPLE","fl","\"I do not have one on hand.\"","\"Then use the last time someone downstream said the current feed was not good enough for the job.\"",[
            jumpNode("Ask what depends on this data today", "current-state-truth", "downstream-use", "red"),
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The call is still too abstract.","You still need one real consuming workflow incident.")
        ])
      ]),
      segment("pain-and-consequence","03","The problem and its cost","Find out what bad or missing data costs them.",true,[
        node("pain-and-consequence","downstream-cost","ri","Ask what breaks when the data is late","\"When the external signal is late or weak, what breaks first: model quality, monitoring relevance, analyst time, compliance confidence, or response speed?\"","Start here once you know what depends on the data.",true,[
          branch("DOWNSTREAM COST CLEAR","ok","\"The weak feed directly weakens the downstream system people actually care about.\"","\"Which part hurts most in practice today: trust, speed, coverage, or false confidence?\"",[
            jumpNode("Ask what weak data costs them", "pain-and-consequence", "data-pain", "grn"),
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"A real downstream consequence is now named.","You still need its dominant cost and owner."),
          branch("SOFT PAIN","ly","\"It is mostly annoying rather than catastrophic.\"","\"What makes it annoying: analyst hours, slower response, weaker product output, or lower confidence?\"",[
            jumpNode("Ask what weak data costs them", "pain-and-consequence", "data-pain", "org"),
            jumpNode("Ask what analysts still fix by hand", "pain-and-consequence", "analyst-burden", "blu")
          ],"The cost may still sound smaller than it is.","You still need the business downside beneath the annoyance."),
          branch("NO CLEAR COST","fl","\"We mostly just want a cleaner setup.\"","\"Then what would have to improve downstream for that cleaner setup to matter?\"",[
            jumpNode("Ask what analysts still fix by hand", "pain-and-consequence", "analyst-burden", "red"),
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "soft-trigger", "blu")
          ],"The pain is still too abstract.","You still need the consuming outcome that matters.")
        ]),
        node("pain-and-consequence","data-pain","pr","Ask what weak data costs them","\"What is the actual price of the weak feed today: lower recall, stale results, manual cleanup, hallucination risk, slower response, or missed coverage?\"","Use this once the consequence is named but not sized.",false,[
          branch("PRICE IS REAL","ok","\"The current gap creates real operational drag or trust loss downstream.\"","\"Who feels that first: product, platform, risk, compliance, or the business team using it?\"",[
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "new-use-case", "blu")
          ],"The data pain is now attached to business cost.","You still need the accountable owner."),
          branch("HARD TO SIZE","ly","\"It is real, but hard to quantify cleanly.\"","\"Ballpark it for me. Is this a nuisance, or something teams escalate because it blocks real work?\"",[
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "new-use-case", "org"),
            jumpNode("Ask what analysts still fix by hand", "pain-and-consequence", "analyst-burden", "blu")
          ],"The cost is real but still fuzzy.","You still need scale or escalation evidence."),
          branch("MOSTLY QUALITY FEAR","fl","\"The main issue is trust, not a single hard metric.\"","\"What do they need to trust: source rights, freshness, coverage, or whether the downstream output becomes unreliable?\"",[
            jumpNode("Agree what rights and licensing checks they need", "proof-threshold", "governance-proof", "red"),
            jumpNode("Agree what data quality they need to see", "proof-threshold", "reliability-proof", "blu")
          ],"Trust risk is the dominant pain.","You still need the exact trust dimension.")
        ]),
        node("pain-and-consequence","analyst-burden","fu","Ask what people fix by hand because of bad data","\"What do analysts, product teams, or operators still have to do manually because the current layer is not strong enough?\"","Use this when people are doing by hand what the tools don't.",false,[
          branch("MANUAL VALIDATION","ok","\"People still validate, chase, or reconcile signal by hand before using it.\"","\"If that stopped, what would improve first: speed, coverage, trust, or cost?\"",[
            jumpNode("Ask what weak data costs them", "pain-and-consequence", "data-pain", "grn"),
            jumpNode("Ask what would show the work got better", "proof-threshold", "implementation-proof", "blu")
          ],"Reducing the manual work people do to make up for the system is part of the value.","You still need the outcome that matters most."),
          branch("MODEL CLEANUP","ly","\"Teams mostly clean and reshape the signal before it is usable.\"","\"What is the business price of that cleanup today?\"",[
            jumpNode("Ask what weak data costs them", "pain-and-consequence", "data-pain", "org"),
            jumpNode("Ask what they use internally instead", "current-state-truth", "internal-alt", "blu")
          ],"The cost may sit in transformation rather than source acquisition.","You still need the downstream impact of that cleanup."),
          branch("NO HUMAN COST","fl","\"Humans are not the problem. It is downstream quality.\"","\"Then stay with that. What downstream output becomes least trustworthy when the feed slips?\"",[
            jumpNode("Go back to what breaks when the data is late", "pain-and-consequence", "downstream-cost", "red"),
            jumpNode("Agree what data quality they need to see", "proof-threshold", "reliability-proof", "blu")
          ],"The pain is in system output, not manual labor.","You still need the specific degraded output.")
        ])
      ]),
      segment("trigger-and-urgency","04","Why now","Find out what changed that makes this worth solving now.",true,[
        node("trigger-and-urgency","new-use-case","ri","Ask what new need made this urgent","\"What changed recently that made the current data layer feel too weak now instead of later: a new AI product, compliance need, model dependency, or monitoring use case?\"","Start here when they are already moving on this.",true,[
          branch("CLEAR TRIGGER","ok","\"A new use case or requirement made the current layer impossible to ignore.\"","\"What deadline or operating moment makes that urgent right now?\"",[
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"There is a real trigger.","You still need the deadline and who owns the problem."),
          branch("GENERAL PLATFORM PUSH","ly","\"This sits inside a broader platform or AI push.\"","\"What made this data dependency rise above the rest inside that bigger push?\"",[
            jumpNode("Go back to what breaks when the data is late", "pain-and-consequence", "downstream-cost", "org"),
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Urgency may be real but still generic.","You still need the specific trigger."),
          branch("NO LIVE EVENT","fl","\"Nothing specific happened. We just know the current layer is not ideal.\"","\"Then what would have to happen before the data infrastructure itself became a real priority?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"There may be no active trigger.","You still need the future trigger or an honest downgrade.")
        ]),
        node("trigger-and-urgency","soft-trigger","pr","If it doesn't sound urgent","\"If nothing changed for the next six months, what would get weaker first: product quality, monitoring relevance, analyst coverage, or compliance confidence?\"","Use this when they want improvement but not urgency.",false,[
          branch("FUTURE COST","ok","\"The current layer would create more operational drag or quality risk over time.\"","\"Who feels that early enough to sponsor change before the downstream cost grows?\"",[
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"There is future cost even if today is calm.","You still need the owner who cares enough now."),
          branch("OPTIONAL","ly","\"It would mostly just be better to have.\"","\"Then this may still be early. What would have to become true before it stopped being optional?\"",[
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "org"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The case may be idea-stage only.","You still need the threshold that would make it real."),
          branch("NO FUTURE COST","fl","\"Nothing really changes if we wait.\"","\"Then the call should stay honest. Who would tell you first if that changed?\"",[
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"Nothing here is urgent enough to push yet.","You still need the watchpoint or an explicit no.")
        ]),
        node("trigger-and-urgency","exploratory","fu","If this is early research","\"If this is still early, what would have to happen before the external data layer itself became a real priority instead of a technical curiosity?\"","Use this when urgency is not active.",false,[
          branch("TRIGGER NAMED","ok","\"A launch, model dependency, compliance need, or monitoring failure would make it active quickly.\"","\"Good. Then the right next step is to focus on the earliest warning sign before that happens.\"",[
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "grn"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"They named what would make this urgent later.","You still need the signal that would prove it is starting."),
          branch("NO TRIGGER YET","ly","\"We are not there yet.\"","\"Understood. Then leave with the right watchpoint instead of a fake next step.\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "org"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The call should stay light and honest.","You still need the reason to re-open later."),
          branch("WRONG PERSON","fl","\"Leadership or product would have to answer that.\"","\"Then the fastest answer is getting that owner into the next conversation instead of guessing here.\"",[
            jumpNode("Ask which team feels this first", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "blu")
          ],"The trigger owner is not in the room.","You still need the right leadership seat.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Who's involved","Find out who owns the data and who approves spend on it.",true,[
        node("stakeholder-and-ownership","owner-split","pr","Ask which team feels this first","\"Who feels the weak external signal first today: product, data engineering, AI platform, risk, compliance, or the business team consuming it?\"","Start here once you know what it costs them and why it matters now.",true,[
          branch("PLATFORM LEADS","ok","\"Platform or data engineering feels the burden because the feed is part of critical infrastructure.\"","\"Good. What would they need to believe before changing the current layer?\"",[
            jumpNode("Agree what data quality they need to see", "proof-threshold", "reliability-proof", "grn"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"The platform owner really feels this problem.","You still need to know what evidence would move them."),
          branch("BUSINESS OR PRODUCT LEADS","ly","\"Product or the consuming business team feels the downstream pain more than infra does.\"","\"Then what would the platform owner need to see before treating that downstream pain as urgent?\"",[
            jumpNode("Ask which team is the real buyer", "stakeholder-and-ownership", "buyer-split", "org"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"The person who feels the problem and the person who evaluates the tool may be different.","You still need who translates outcome into budget or build decision."),
          branch("NO CLEAR OWNER","fl","\"It is split across teams.\"","\"Then the next step is not product. It is finding the first team that pays most when the signal goes weak.\"",[
            jumpNode("Ask which team is the real buyer", "stakeholder-and-ownership", "buyer-split", "red"),
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "blu")
          ],"Ownership is fragmented or absent.","You still need the first real economic owner.")
        ]),
        node("stakeholder-and-ownership","buyer-split","fu","Ask which team is the real buyer","\"Is the real buyer here the team that builds the data layer, or the team whose workflow gets weaker when the data is late or incomplete?\"","Use this when one team builds the data layer and another team depends on it.",false,[
          branch("INFRA BUYER","ok","\"The infrastructure team really owns the decision.\"","\"Then what downstream outcome would they need to see before they treat a vendor change as worth the risk?\"",[
            jumpNode("Ask what would make switching worth the effort", "proof-threshold", "implementation-proof", "grn"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "blu")
          ],"The buyer is infrastructure-led.","You still need the downstream outcome they care about."),
          branch("OUTCOME BUYER","ly","\"The team that uses the data drives it more than infrastructure does.\"","\"Then who in infra still has veto power when the workflow team says the current feed is not enough?\"",[
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "buying-path", "org"),
            jumpNode("Agree what data quality they need to see", "proof-threshold", "reliability-proof", "blu")
          ],"The business owner may create urgency while infra still controls risk.","You still need the technical gate."),
          branch("TOO MANY HANDS","fl","\"It depends on the use case and team.\"","\"Then who can stop this from moving, even if everyone else likes the idea?\"",[
            jumpNode("Ask where projects like this usually slow down", "decision-architecture", "stall-map", "red"),
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "blu")
          ],"Influence is spread across multiple teams.","You still need the true veto point.")
        ]),
        node("stakeholder-and-ownership","wrong-owner","ri","If the wrong owner is in the room","\"Whose voice do we need next so this becomes a real external-data conversation instead of a polite technical tour?\"","Use this when the current contact cannot own the problem or the evaluation.",false,[
          branch("RIGHT PERSON KNOWN","ok","\"We need the platform owner, product owner, or risk owner in the next session.\"","\"Good. Then shape that review around one live dependency so it is worth their time.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"You know who is missing from the conversation.","You still need the reason they would attend."),
          branch("ENGINEER FIRST","ly","\"An engineer or platform lead probably needs to go first.\"","\"Fine. Then the next review should test one live dependency before we widen it.\"",[
            jumpNode("Pick one workflow to review", "next-step-lock", "scope-path", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"A smaller technical test may need to come first.","You still need the exact dependency path."),
          branch("NO IDEA","fl","\"I am not sure who that should be.\"","\"Then the fastest question is simple: who gets blamed first when the current layer is wrong late?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"It is still unclear who does what in their organization.","You still need the accountability line.")
        ])
      ]),
      segment("proof-threshold","06","What they need to see","Agree on the test that would show the data is good enough.",true,[
        node("proof-threshold","real-proof","pr","Ask what they need to see","\"What would make this feel real to your team: stronger freshness and coverage, better downstream output, faster implementation, or cleaner governance?\"","Start here when the buyer says they need evidence.",true,[
          branch("DOWNSTREAM OUTPUT","ok","\"We need to see the downstream system actually get better, not just hear about the feed.\"","\"Good. Then the next review should be built around one live dependency, not a generic API tour.\"",[
            jumpNode("Agree what data quality they need to see", "proof-threshold", "reliability-proof", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Evidence is tied to the consuming system, not the API in isolation.","You still need the exact dependency path."),
          branch("DATA QUALITY","ly","\"We need to trust freshness, coverage, and structure first.\"","\"Good. Which quality dimension kills this fastest today: latency, recall, precision, source breadth, or schema stability?\"",[
            jumpNode("Agree what data quality they need to see", "proof-threshold", "reliability-proof", "org"),
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "blu")
          ],"Data quality is the primary evidence check.","You still need the quality dimension that matters most."),
          branch("GOVERNANCE OR RIGHTS","fl","\"Rights, citations, or governance are the main hurdle.\"","\"Then the next review has to prove not just utility, but whether the data is safe enough to use day to day.\"",[
            jumpNode("Agree what rights and licensing checks they need", "proof-threshold", "governance-proof", "red"),
            jumpNode("Ask who would sponsor, evaluate, and approve", "decision-architecture", "rights-gate", "blu")
          ],"Governance is a main approval, not a side note.","You still need the exact rights or control standard.")
        ]),
        node("proof-threshold","reliability-proof","fu","If they need to trust the data quality","\"What would make the current layer feel trustworthy enough: latency, coverage, precision, recall, source diversity, entity resolution, or reproducibility?\"","Use this when the buyer's main concern is raw feed trust.",false,[
          branch("ONE QUALITY DIMENSION","ok","\"One or two specific quality dimensions drive the whole decision.\"","\"Good. Then the next review should test those on one real use of the data.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "grn"),
            jumpNode("Pick one workflow to review", "next-step-lock", "scope-path", "blu")
          ],"What they need to see is now measurable.","You still need the benchmark path."),
          branch("QUALITY MIX","ly","\"It is a blend of freshness, coverage, and trust.\"","\"Which one kills the downstream workflow fastest if it stays weak?\"",[
            jumpNode("Go back to what breaks when the data is late", "pain-and-consequence", "downstream-cost", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"They have several quality checks to pass.","You still need the primary kill switch."),
          branch("NOT ABOUT QUALITY","fl","\"Quality is not the real issue. Implementation and adoption are.\"","\"Then what they need to see is workflow fit, not feed stats. Who has to use it first and what should get easier?\"",[
            jumpNode("Ask what would make switching worth the effort", "proof-threshold", "implementation-proof", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"What matters may be fit with how they work, not raw quality.","You still need the first user and first improvement.")
        ]),
        node("proof-threshold","implementation-proof","ri","If they care most about switching effort","\"What would make this feel worth the switch operationally: faster integration, less maintenance, wider coverage, or fewer manual patches downstream?\"","Use this when they care about build-vs-buy more than raw feed quality.",false,[
          branch("MAINTENANCE RELIEF","ok","\"We need to stop spending engineering or analyst time maintaining the current layer.\"","\"Good. Then the next review should show the exact dependency where maintenance relief matters first.\"",[
            jumpNode("Pick one workflow to review", "next-step-lock", "scope-path", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Less work to set up and maintain is part of the value.","You still need the dependency path that proves it."),
          branch("WIDER COVERAGE","ly","\"Coverage or source breadth is the main reason to move.\"","\"Which downstream workflow suffers first when coverage stays too narrow?\"",[
            jumpNode("Go back to what breaks when the data is late", "pain-and-consequence", "downstream-cost", "org"),
            jumpNode("Ask for one recent time bad data hurt a team", "current-state-truth", "live-example", "blu")
          ],"Coverage is an implementation plus value issue.","You still need the affected workflow."),
          branch("NO BUILD PAIN","fl","\"Build and maintenance are manageable. We just want better results.\"","\"Then stay on results. What downstream result needs to get better before this matters?\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "red"),
            jumpNode("Go back to what breaks when the data is late", "pain-and-consequence", "downstream-cost", "blu")
          ],"Building it themselves is not the main question.","You still need the outcome buyer cares about.")
        ]),
        node("proof-threshold","governance-proof","va","If rights or licensing are the concern","\"What has to be true around rights, licensing, citations, or reproducibility before the team would trust this in production?\"","Use this when governance is their biggest concern.",false,[
          branch("CLEAR GOVERNANCE BAR","ok","\"We know the specific trust and rights conditions we would need.\"","\"Good. Then the next review should prove those conditions on the exact use case that matters.\"",[
            jumpNode("Ask who decides the data is safe to use", "decision-architecture", "rights-gate", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"They defined what governance needs to see.","You still need the use case and owner tied to it."),
          branch("GOVERNANCE IS FUZZY","ly","\"We know governance matters, but not exactly how we would test it yet.\"","\"Then who has to define the standard before this can move responsibly?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "org"),
            jumpNode("Ask who decides the data is safe to use", "decision-architecture", "rights-gate", "blu")
          ],"Governance is a real approval step, but it is still unclear.","You still need the owner of the bar."),
          branch("GOVERNANCE SECONDARY","fl","\"Governance matters, but downstream usefulness matters more.\"","\"Fine. Then keep governance in view, but let the next review prove the live dependency first.\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "red"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"Governance is not the first thing to test.","You still need the live dependency path.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor","Find out why their current data source is still in place.",false,[
        node("current-vendor-and-displacement","current-stack","ri","Ask what tools do this work today","\"What is doing the job today: internal crawler, search stack, scraping vendors, legacy feeds, analyst labor, or some mix of all of them?\"","Start here once they say they already have a data layer.",true,[
          branch("STACK MIX CLEAR","ok","\"It is a mix of systems and people, and no one fully trusts it end to end.\"","\"Which part gives the team the false sense that the problem is solved when it actually is not?\"",[
            jumpNode("Go back to what breaks when the data is late", "pain-and-consequence", "downstream-cost", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "blu")
          ],"Their current setup is a patchwork, not one clean system.","You still need the false-confidence layer."),
          branch("VENDOR DOES MOST","ly","\"A vendor gets us most of the way there already.\"","\"Most of the way is fine. What still forces teams to patch around it manually?\"",[
            jumpNode("Ask what they use internally instead", "current-state-truth", "internal-alt", "org"),
            jumpNode("Ask what analysts still fix by hand", "pain-and-consequence", "analyst-burden", "blu")
          ],"Their current tool works only partly.","You still need the manual escape hatch."),
          branch("DIY PLUS INERTIA","fl","\"It is messy, but it is our mess and everyone is used to it.\"","\"Then what business result would have to improve before the team would actually change the layer?\"",[
            jumpNode("Ask what breaks when the data is late", "pain-and-consequence", "downstream-cost", "red"),
            jumpNode("Ask which part they want to build themselves", "current-vendor-and-displacement", "build-bias", "blu")
          ],"Habit may be part of why the current tool stays.","You still need the result strong enough to beat it.")
        ]),
        node("current-vendor-and-displacement","build-bias","fu","Ask which part they want to build themselves","\"Which part do you actually want to own long term: the raw ingestion layer, the downstream product, or both?\"","Use this when they would rather build it themselves.",false,[
          branch("OWN THE PRODUCT NOT FEED","ok","\"We care more about the downstream product than owning the data infrastructure itself.\"","\"Good. Then the test is whether the current fuel line is already good enough or still taxing the product team too much.\"",[
            jumpNode("Go back to what they use internally", "current-state-truth", "internal-alt", "grn"),
            jumpNode("Ask what would make switching worth the effort", "proof-threshold", "implementation-proof", "blu")
          ],"The buyer may not want to own the underlying layer forever.","You still need the build pain worth escaping."),
          branch("OWN THE PIPELINE","ly","\"We prefer to own the ingestion and retrieval stack ourselves.\"","\"Then what part still feels too expensive, brittle, or slow to keep owning?\"",[
            jumpNode("Go back to what they use internally", "current-state-truth", "internal-alt", "org"),
            jumpNode("Ask what weak data costs them", "pain-and-consequence", "data-pain", "blu")
          ],"Build bias is real and must be challenged economically.","You still need the part they do not actually want to own."),
          branch("NO STRONG BIAS","fl","\"We are open either way if the evidence is strong.\"","\"Good. Then keep the conversation on the live dependency and what they need to see, not ideology.\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "red"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"They don't have a strong preference for building it themselves.","You still need the strongest live test.")
        ]),
        node("current-vendor-and-displacement","switch-risk","va","Ask what would make switching risky","\"What makes changing the layer feel dangerous: integration work, rights and governance, model reliability, or the risk of breaking downstream systems?\"","Use this to find out what is actually in the way.",false,[
          branch("DOWNSTREAM BREAKAGE RISK","ok","\"We cannot risk weakening the downstream system while we change the feed layer.\"","\"Then the next review has to test one narrow use of the data without disturbing the rest.\"",[
            jumpNode("Pick one workflow to review", "next-step-lock", "scope-path", "grn"),
            jumpNode("Ask what would make switching worth the effort", "proof-threshold", "implementation-proof", "blu")
          ],"The risk of changing is breaking the systems that depend on the data.","You still need the smallest safe proving scope."),
          branch("RIGHTS OR GOVERNANCE RISK","ly","\"Rights, governance, or reproducibility could slow this down.\"","\"Then what has to be true in the next review so that risk feels manageable?\"",[
            jumpNode("Agree what rights and licensing checks they need", "proof-threshold", "governance-proof", "org"),
            jumpNode("Ask who decides the data is safe to use", "decision-architecture", "rights-gate", "blu")
          ],"Governance risk is a main blocker.","You still need the exact condition that lowers it."),
          branch("INERTIA","fl","\"Mostly it is just inertia.\"","\"Inertia usually means the pain or sponsor is still too weak. Which one is true here?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Go back to what breaks when the data is late", "pain-and-consequence", "downstream-cost", "blu")
          ],"The blocker may be weak urgency rather than true switching cost.","You still need the real source of inertia.")
        ])
      ]),
      segment("decision-architecture","08","How they'll decide","Find out who signs off and in what order.",false,[
        node("decision-architecture","buying-path","pr","Ask who would sponsor, evaluate, and approve","\"If this became real, who would sponsor, who would evaluate, and who could slow or stop it?\"","Start here once you partly know the sponsor and what they need to see.",true,[
          branch("PATH CLEAR","ok","\"Platform or product would sponsor, engineering would evaluate, and security or risk would review where needed.\"","\"Good. What would the evaluator have to prove before the sponsor treats this as safe enough to move?\"",[
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "blu")
          ],"You know who sponsors it and who evaluates it.","You still need the gate that turns evaluation into a decision."),
          branch("PATH SPLIT","ly","\"The business team feels the pain, but engineering or governance will complicate it.\"","\"Which of those can actually kill this if the evidence is strong?\"",[
            jumpNode("Ask where projects like this usually slow down", "decision-architecture", "stall-map", "org"),
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "blu")
          ],"There are competing stakeholder logics.","You still need the true veto point."),
          branch("PATH UNKNOWN","fl","\"We are too early to know the full path.\"","\"That is fine. Who definitely has to believe this first for the path to matter at all?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ],"It is still unclear who decides and how.","You still need the first internal believer.")
        ]),
        node("decision-architecture","stall-map","fu","Ask where projects like this usually slow down","\"Where do projects like this usually slow down internally: engineering backlog, governance review, rights questions, or weak business urgency?\"","Use this when there is a path to a decision but it could easily stall.",false,[
          branch("ENGINEERING GATE","ok","\"Engineering time and technical skepticism are the first hurdle.\"","\"Then the next review has to show one real use of the data that is worth the engineering effort.\"",[
            jumpNode("Pick one workflow to review", "next-step-lock", "scope-path", "grn"),
            jumpNode("Ask what would make switching worth the effort", "proof-threshold", "implementation-proof", "blu")
          ],"Getting engineering to prioritize it is the real hurdle.","You still need the path that justifies it."),
          branch("GOVERNANCE GATE","ly","\"Security, rights, or compliance will slow it if the trust model is fuzzy.\"","\"Then the next review has to prove not just utility, but whether the layer is safe enough for the actual use case.\"",[
            jumpNode("Agree what rights and licensing checks they need", "proof-threshold", "governance-proof", "org"),
            jumpNode("Ask who decides the data is safe to use", "decision-architecture", "rights-gate", "blu")
          ],"Governance is the main approval.","You still need the exact trust condition to clear."),
          branch("ATTENTION RISK","fl","\"Nothing formal kills it. It just loses oxygen.\"","\"Then the next step has to be concrete enough that it cannot hide in polite interest.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "new-use-case", "blu")
          ],"Attention risk is the real danger.","You still need a next step that people will take seriously.")
        ]),
        node("decision-architecture","rights-gate","ri","If rights or approvals are blocking it","\"Who defines whether the data is safe enough to use in the downstream workflow: legal, security, compliance, risk, or the product owner?\"","Use this when rights or governance come up early.",false,[
          branch("CLEAR GATE OWNER","ok","\"We know exactly who has to sign off on rights or governance.\"","\"Good. Then the next review has to give that owner the exact use case and trust question, not a generic API story.\"",[
            jumpNode("Agree who attends the next review", "next-step-lock", "live-review", "grn"),
            jumpNode("Agree what rights and licensing checks they need", "proof-threshold", "governance-proof", "blu")
          ],"You can see the governance approval they need.","You still need the use case that will test it."),
          branch("SHARED GATE","ly","\"It is spread across multiple teams.\"","\"Then the next review has to stay narrow enough that all of them can evaluate one concrete use of the data.\"",[
            jumpNode("Pick one workflow to review", "next-step-lock", "scope-path", "org"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "attendee-shape", "blu")
          ],"Several teams have to trust it before it can move.","You still need a narrow enough proving path."),
          branch("NOT SURE YET","fl","\"We have not thought that far ahead.\"","\"That is fine. Then the immediate job is simpler: get one serious review with the right technical and business owner.\"",[
            jumpNode("Book the next review meeting", "next-step-lock", "live-review", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"It is too early for a full governance review.","You still need the first serious internal review.")
        ])
      ]),
      segment("next-step-lock","09","Next step","Leave with a dated review meeting and a named owner.",true,[
        node("next-step-lock","live-review","pr","Book a review meeting on one data dependency","\"The next best step sounds like a live review with the platform owner and the team that uses the data, around one real use of it. Does that fit how your team would validate this?\"","Start here when they would be willing to review one real example together.",true,[
          branch("YES LOCK IT","ok","\"Yes. That is the right shape.\"","\"Good. Which use of the data should we test so the review is worth their time?\"",[
            jumpNode("Pick one workflow to review", "next-step-lock", "scope-path", "grn"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "attendee-shape", "blu")
          ],"The next review format is agreed.","You still need the exact path and seats."),
          branch("NEEDS NARROWER START","ly","\"Close, but start with one team or one dependency first.\"","\"That works. Which narrower use would still give us a real test instead of a generic walkthrough?\"",[
            jumpNode("Pick one workflow to review", "next-step-lock", "scope-path", "org"),
            jumpNode("Agree who attends the next meeting", "next-step-lock", "attendee-shape", "blu")
          ],"The review shape needs tuning, not replacement.","You still need the narrowest real proving ground."),
          branch("TOO EARLY","fl","\"That feels like too much for where we are.\"","\"Understood. Then what would make the next step real enough to keep momentum without pretending we are further along than we are?\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "blu")
          ],"The buyer is not ready for a full review yet.","You still need a lighter but real progression step.")
        ]),
        node("next-step-lock","scope-path","fu","Pick one workflow to review","\"What should the review focus on: one model input path, one monitoring workflow, one analyst workflow, or one compliance dependency?\"","Use this so the next step has a specific purpose.",false,[
          branch("DEPENDENCY PATH CHOSEN","ok","\"We know exactly which use of the data to test.\"","\"Perfect. That makes the review real immediately.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            action("Go to After the call", "segment:post-call-routing", "blu")
          ],"They agreed what to test on.","You still need the exact attendees and calendar hold."),
          branch("ONE TEAM FIRST","ly","\"Start with one team or one model before going broader.\"","\"That is a good place to start. Which owner feels the problem enough to take that session seriously?\"",[
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "org"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"Testing on something narrower may be safer.","You still need the right owner and date."),
          branch("NO PATH YET","fl","\"We do not know which dependency to use yet.\"","\"Then the next step is not locked. Who can pick that path before the meeting goes on calendar?\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The next review is still underspecified.","You still need the owner of the proving path.")
        ]),
        node("next-step-lock","attendee-shape","ri","Agree who attends the next meeting","\"Who has to be in that next review for the outcome to matter: platform, product, risk, compliance, or the team that uses the data?\"","Use this so the next meeting has a real purpose.",false,[
          branch("RIGHT PEOPLE NAMED","ok","\"The platform team and the team that uses the data need to be there. Others can come later if the review goes well.\"","\"Good. Then this is close to lockable.\"",[
            jumpRoom("Add the meeting to the deal", "deal-workspace", "grn"),
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "blu")
          ],"The right people will be in the review.","You still need the date and owner."),
          branch("GOVERNANCE NEEDED NOW","ly","\"Security, compliance, or legal should be there from the start.\"","\"Fine. Then the agenda has to stay tight and focused on evidence so the session is worth senior time.\"",[
            jumpNode("Go back to the rights and licensing checks", "proof-threshold", "governance-proof", "org"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ],"The meeting is governance-weighted.","You still need the evidence question to justify it."),
          branch("ATTENDEES UNCLEAR","fl","\"We can figure that out later.\"","\"That usually stalls the deal. Who owns deciding the attendee list before the follow-up goes out?\"",[
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Go back to which team feels this first", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The meeting is not really locked yet.","You still need the owner of the invite list.")
        ]),
        node("next-step-lock","soft-deferral","va","If they won't commit to a next step","\"What has to become true before the next conversation is worth real calendar time?\"","Use this when they want to stay polite but noncommittal.",false,[
          branch("ADVANCEMENT CONDITION","ok","\"If we can show this on one real use of the data with the right people, the next session is worth scheduling.\"","\"That is enough. Let us write down exactly what the next step depends on.\"",[
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
        node("post-call-routing","handoff","cl","Write notes for whoever picks this up","\"If someone new picked this deal up tomorrow, what would they need to know in the first 30 seconds?\"","Use this to boil the call down to the data-layer facts you can use.",false,[
          branch("HANDOFF CLEAN","ok","\"Note the data dependency, which teams own it, what they need to see, and what the next review depends on.\"","\"Good. Keep only what changes the next step.\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "grn"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The handoff can now start from signal instead of notes.","You still need the one open question to chase."),
          branch("HANDOFF TOO VERBAL","ly","\"We have a lot of detail, but not a clean signal yet.\"","\"Then throw away anything that does not change the next review question. What is actually usable?\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "org"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The detail exists, but the useful parts are buried.","You still need the core problem and where it goes next."),
          branch("NO HANDOFF HABIT","fl","\"We do not really capture this cleanly today.\"","\"Then write down just four things: the owner, what depends on the data, what they need to see, and what the next step depends on.\"",[
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ],"The handoff discipline itself is weak.","You still need the one capture rule that sticks.")
        ]),
        node("post-call-routing","missing-truth","fu","Note what you still need to find out","\"What is still missing that the next step has to find out directly before this becomes real?\"","Use this so whoever picks this up knows the one open question to chase.",false,[
          branch("MISSING TRUTH CLEAR","ok","\"We still need the exact use of the data to test, the right owner, or the standard they'll measure against.\"","\"Good. Then send what you learned to the place most likely to answer that quickly.\"",[
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "grn"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The open question is clearly named.","You still need to decide where to follow up on it."),
          branch("MISSING OWNER","ly","\"We know the gap, but not who can answer it.\"","\"Then the next step should start with who owns what, not another product conversation.\"",[
            action("Set the next meeting", "segment:next-step-lock", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The open question is clear, but nobody owns it.","You still need the best route to the right person."),
          branch("TOO MUCH UNKNOWN","fl","\"Too much is still vague.\"","\"Then do not pretend this is a healthy progression. Note now where trust or ownership is slipping, and fix it before the systems that use the data pay for it.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The call may need correction more than continuation.","You still need the clearest failure pattern.")
        ]),
        node("post-call-routing","room-route","pr","Choose where this goes after the call","\"Where should this go next: shape the next review, attach what you learned to the live dependency, or note the most likely reason it could fail before it happens again?\"","Use this to choose where the notes go based on what happened on the call.",false,[
          branch("NEXT MEETING","ok","\"The next step is a tighter dependency review with a clearer question to answer.\"","\"Then set the next meeting and bring the use of the data to test, who owns what, and what they need to see.\"",[
            action("Set the next meeting", "segment:next-step-lock", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The next step is another conversation, not a commercial move.","You still need the open question in plain language."),
          branch("DEAL WORKSPACE","ly","\"There is already a live product, risk, or monitoring path here.\"","\"Then add what you learned to the deal right away, before the details get lost.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
            jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
          ],"These facts belong with the specific data dependency you discussed.","You still need the top risk to carry with it."),
          branch("FUTURE AUTOPSY","fl","\"This still feels like trust is slipping, or activity without an owner.\"","\"Then route it to Future Autopsy now and name the failure pattern before the downstream cost grows.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ],"The next step may need to fix what has slipped, not push the deal forward.","You still need the failure pattern in plain language.")
        ])
      ])
    ]
  };
})();
