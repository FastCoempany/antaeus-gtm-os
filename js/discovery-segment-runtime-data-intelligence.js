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
    { title:"Downstream use", items:["Which product, model, or monitoring workflow the data actually powers", "What false positives and false negatives cost them operationally right now", "Whether they need raw API, enriched intelligence layer, or alerting infrastructure"] },
    { title:"Proof burden", items:["Retrieval accuracy on a live query they care about this quarter", "Freshness and latency benchmarked against their current internal alternative", "Source breadth, language coverage, and schema stability for their real workload"] },
    { title:"Decision path", items:["Product, data, or AI-platform owner who feels the feed quality pain", "Engineering or infra evaluator who decides build-versus-buy", "Risk, compliance, or licensing owner if governance is a live gate"] }
  ];
  var objectionLibrary = [
    { trigger:"we can build this internally", reply:"Many teams can. The real question is whether building this keeps your best engineers from building the thing only your company can build. What are they not getting to because of this feed?" },
    { trigger:"we already license a news feed", reply:"Good. When was the last time that feed surfaced something that changed a decision, and when was the last time it added noise you had to filter out downstream?" },
    { trigger:"data rights and licensing will block this", reply:"Fair. Those are real gates. What is the scope of use that matters most — retrieval for models, monitoring for alerts, or analyst research — because the licensing story differs for each." },
    { trigger:"our data is too messy for any feed to fix", reply:"That may be true. Then the question is not about our feed. It is whether the messiness blocks one decision that matters now, and whether external signal could route around it." }
  ];
  var inboundQuestionHandlers = [
    { question:"What sources do you cover?", bridge:"Broad, but that is rarely the deciding factor. More useful: which source or language would you notice if it were missing from the first week of usage?" },
    { question:"How does this help with LLM retrieval?", bridge:"Depends on whether your model is hallucinating on known-unknowns or unknown-unknowns. What is the failure pattern today when the model gets a freshness-sensitive question wrong?" },
    { question:"Can we try it with our data?", bridge:"Yes. First tell me which query or workflow you would want the pilot to survive, because a generic trial will not reveal what matters." }
  ];
  var skipAheadHandlers = [
    { trigger:"asks for pricing too early", reply:"Pricing fits once we know whether the feed changes a decision or a product output downstream. What problem is it supposed to solve first?" },
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
        action:jumpNode("Classify the motion", "opening-frame", "motion-type", "blu")
      },
      {
        title:"Use one broken downstream job",
        copy:"Anchor on the first workflow that gets weaker when the feed goes thin.",
        action:jumpNode("Use one dependency", "current-state-truth", "live-example", "org")
      },
      {
        title:"Lock the data review",
        copy:"Leave with the platform owner and the consuming team around one live dependency.",
        action:jumpNode("Lock the review", "next-step-lock", "live-review", "grn")
      }
    ],
    interrupts:[
      {
        id:"we-can-build-this",
        label:"We can build this ourselves",
        reply:"Maybe. I want to know which part you actually want to own long term: crawling and ingestion, freshness and coverage, or the downstream product that consumes the signal.",
        actions:[
          jumpNode("Map the internal alternative", "current-state-truth", "internal-alt", "blu"),
          jumpNode("Test build bias", "current-vendor-and-displacement", "build-bias", "org")
        ]
      },
      {
        id:"just-show-api",
        label:"Just show the API",
        reply:"I can. First tell me whether the hard part is freshness, coverage, structure, or citation-grade reliability so I do not show the wrong proof path.",
        actions:[
          jumpNode("Set the proof bar", "proof-threshold", "real-proof", "pur"),
          jumpNode("Use one dependency", "current-state-truth", "live-example", "blu")
        ]
      },
      {
        id:"we-already-have-feeds",
        label:"We already have feeds",
        reply:"That helps. I am trying to learn where the current feed still goes thin or noisy enough that downstream systems compensate manually.",
        actions:[
          jumpNode("Map the dependency", "current-state-truth", "downstream-use", "blu"),
          jumpNode("Name the downstream cost", "pain-and-consequence", "downstream-cost", "org")
        ]
      },
      {
        id:"rights-and-governance",
        label:"Rights or governance matter most",
        reply:"Understood. Then the call should stay on source rights, reproducibility, and whether the current layer is trustworthy enough for the downstream use.",
        actions:[
          jumpNode("Test governance proof", "proof-threshold", "governance-proof", "blu"),
          jumpNode("Map the buying path", "decision-architecture", "rights-gate", "org")
        ]
      },
      {
        id:"not-a-workflow-app",
        label:"We want a workflow app, not infrastructure",
        reply:"That is useful. Then the first question is whether the downstream team actually needs a fuel line or whether they are really shopping for a finished workflow surface.",
        actions:[
          jumpNode("Keep it honest", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Name the downstream use", "current-state-truth", "downstream-use", "blu")
        ]
      }
    ],
    segments:[
      segment("opening-frame","01","Opening frame","Start by classifying the dependency.",true,[
        node("opening-frame","primary","pr","Primary opener","\"Most teams can get some external data. The real question is where the current feed still goes thin or stale enough that downstream systems lose trust or teams compensate manually. Is that where this lives for you too?\"","Use this when they will diagnose before seeing product.",true,[
          branch("CONFIRMS","ok","\"Yes. We have feeds, but the downstream teams still patch around freshness or coverage gaps.\"","\"Good. Is the live motion here AI retrieval, monitoring and compliance, or market / analyst intelligence?\"",[
            jumpNode("Classify the motion", "opening-frame", "motion-type", "grn"),
            jumpNode("Map the dependency", "current-state-truth", "downstream-use", "blu")
          ],"The current layer is not fully trusted by the consumers.","You still need the primary downstream use case."),
          branch("FEED DEFENSE","ly","\"We already have data vendors and internal pipelines.\"","\"Understood. Then where does the current layer still break: freshness, coverage, structure, or reliability?\"",[
            jumpNode("Map the dependency", "current-state-truth", "downstream-use", "org"),
            jumpNode("Name the downstream cost", "pain-and-consequence", "downstream-cost", "blu")
          ],"The buyer is defending the stack, not denying the gap.","You still need the first broken data property."),
          branch("PITCH REQUEST","fl","\"Can you just show the API?\"","\"I can. First tell me which downstream job fails first when the current feed gets thin so I do not show the wrong proof path.\"",[
            jumpNode("Use one dependency", "current-state-truth", "live-example", "blu"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "pur")
          ],"They are trying to skip diagnosis.","You still need the active dependency before demo.")
        ]),
        node("opening-frame","motion-type","fu","Classify the motion","\"Which side is most urgent today: AI or retrieval quality, monitoring and compliance, or market / analyst intelligence?\"","This changes the rest of the call, so it needs to be known early.",false,[
          branch("AI / RETRIEVAL","ok","\"The feed powers models, search, or AI retrieval and the current layer is not strong enough.\"","\"Good. Then what breaks first today: latency, coverage, structure, or reproducibility?\"",[
            jumpNode("Map the dependency", "current-state-truth", "downstream-use", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "reliability-proof", "blu")
          ],"This is an AI-platform / retrieval motion.","You still need the first broken quality property."),
          branch("MONITORING / COMPLIANCE","ly","\"This is more about monitoring, risk, or compliance than AI.\"","\"Good. Then what signal is still too late, too noisy, or too narrow to drive action?\"",[
            jumpNode("Map the dependency", "current-state-truth", "downstream-use", "org"),
            jumpNode("Name the downstream cost", "pain-and-consequence", "downstream-cost", "blu")
          ],"This is a monitoring / risk motion.","You still need the first operational miss."),
          branch("MARKET / ANALYST","fl","\"It is really about market intelligence and analyst workflow.\"","\"Good. Then what still burns the most time today: finding signal, trusting it, or keeping coverage wide enough?\"",[
            jumpNode("Use one dependency", "current-state-truth", "live-example", "red"),
            jumpNode("Name the downstream cost", "pain-and-consequence", "analyst-burden", "blu")
          ],"This is an intelligence-workflow motion.","You still need the first downstream burden.")
        ]),
        node("opening-frame","sideways","ri","If the call starts sideways","\"If this is still early, that is fine. What made this worth looking at now instead of leaving the current data layer alone?\"","Use this when they are curious but not yet committed.",false,[
          branch("NEW USE CASE","ok","\"A new AI product, monitoring use case, or compliance burden made the current layer feel too weak.\"","\"Then let us follow that pressure. What downstream job is least forgiving if the feed goes wrong?\"",[
            jumpNode("Use one dependency", "current-state-truth", "live-example", "grn"),
            jumpNode("Test the trigger", "trigger-and-urgency", "new-use-case", "blu")
          ],"There is a real forcing event.","You still need the first downstream dependency that breaks."),
          branch("GENERAL IMPROVEMENT","ly","\"We mostly want better coverage or freshness than we have now.\"","\"Coverage or freshness for what exactly: a model, a monitor, a risk workflow, or an analyst team?\"",[
            jumpNode("Map the dependency", "current-state-truth", "downstream-use", "org"),
            jumpNode("Name the downstream cost", "pain-and-consequence", "downstream-cost", "blu")
          ],"There is directional interest, but the wedge is still broad.","You still need the live consuming workflow."),
          branch("NOTHING URGENT","fl","\"Nothing urgent. We are just exploring.\"","\"That is workable. What would have to happen before the data layer itself became a real priority instead of a nice-to-have?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The call may be exploratory only.","You still need the threshold that would make this move.")
        ])
      ]),
      segment("current-state-truth","02","Current-state truth","Map the dependency and the workaround.",true,[
        node("current-state-truth","downstream-use","fu","Map the downstream use","\"What does this feed power today: AI retrieval, monitoring, risk, compliance, market intelligence, supplier intelligence, or something else?\"","Start here once the category is roughly clear.",true,[
          branch("USE CLEAR","ok","\"We know the exact downstream system or team that depends on it.\"","\"Good. What breaks first when the feed is late, thin, or noisy in that workflow?\"",[
            jumpNode("Name the downstream cost", "pain-and-consequence", "downstream-cost", "grn"),
            jumpNode("Use one dependency", "current-state-truth", "live-example", "blu")
          ],"The dependency path is visible.","You still need the first broken moment inside it."),
          branch("MULTIPLE CONSUMERS","ly","\"It feeds several teams and systems at once.\"","\"Which one is least forgiving if coverage or freshness slips?\"",[
            jumpNode("Use one dependency", "current-state-truth", "live-example", "org"),
            jumpNode("Find the owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The feed may be shared across the org.","You still need the most demanding consuming workflow."),
          branch("UNCLEAR USE","fl","\"It is more general platform infrastructure than one clear workflow.\"","\"Then pick the first downstream team that complains when the current layer gets weak.\"",[
            jumpNode("Use one dependency", "current-state-truth", "live-example", "red"),
            jumpNode("Map the internal alternative", "current-state-truth", "internal-alt", "blu")
          ],"The use case is still too abstract.","You still need one consuming workflow to anchor the call.")
        ]),
        node("current-state-truth","internal-alt","pr","Map the internal alternative","\"What is the internal alternative today: a crawler, search stack, scraping vendors, analyst labor, stale datasets, or some combination?\"","Use this when the buyer has build-internal instincts.",false,[
          branch("DIY STACK","ok","\"We already own part of the ingestion layer, but it is brittle or expensive to maintain.\"","\"Which part hurts most: source maintenance, coverage, entity resolution, or freshness?\"",[
            jumpNode("Test build bias", "current-vendor-and-displacement", "build-bias", "grn"),
            jumpNode("Name the downstream cost", "pain-and-consequence", "downstream-cost", "blu")
          ],"The internal alternative exists but is costly.","You still need the most expensive failure inside it."),
          branch("ANALYST PATCHWORK","ly","\"Analysts or operators still patch the gaps manually.\"","\"What do those humans still have to do that the data layer should have solved already?\"",[
            jumpNode("Name analyst burden", "pain-and-consequence", "analyst-burden", "org"),
            jumpNode("Use one dependency", "current-state-truth", "live-example", "blu")
          ],"Human compensation is part of the current system.","You still need the repeated manual step."),
          branch("VENDOR MIX","fl","\"We have a mix of vendors and legacy feeds already.\"","\"Which part of that mix still fails to give downstream teams the confidence they need?\"",[
            jumpNode("Test the current stack", "current-vendor-and-displacement", "current-stack", "red"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The current stack is fragmented or overlapping.","You still need the first weak link.")
        ]),
        node("current-state-truth","live-example","ri","Use one broken dependency","\"Give me one recent moment where a model, monitor, analyst, or risk workflow got weaker because the external signal was missing, stale, or untrustworthy.\"","Use this whenever the conversation stays abstract.",false,[
          branch("LIVE BREAKAGE","ok","\"We had a recent case where the current layer did not surface the right signal fast enough.\"","\"What specifically failed first: freshness, coverage, structure, or source trust?\"",[
            jumpNode("Name the downstream cost", "pain-and-consequence", "downstream-cost", "grn"),
            jumpNode("Test the trigger", "trigger-and-urgency", "new-use-case", "blu")
          ],"The call now has a real failure moment.","You still need the broken data property inside it."),
          branch("SOFT EXAMPLE","ly","\"Nothing dramatic, but teams constantly work around weak signal.\"","\"What workaround burns the most time today: manual validation, source chasing, enrichment, or analyst review?\"",[
            jumpNode("Name analyst burden", "pain-and-consequence", "analyst-burden", "org"),
            jumpNode("Map the internal alternative", "current-state-truth", "internal-alt", "blu")
          ],"The pain may be cumulative rather than dramatic.","You still need the most repeated workaround."),
          branch("NO EXAMPLE","fl","\"I do not have one on hand.\"","\"Then use the last time someone downstream said the current feed was not good enough for the job.\"",[
            jumpNode("Map the dependency", "current-state-truth", "downstream-use", "red"),
            jumpNode("Find the owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The call is still too abstract.","You still need one real consuming workflow incident.")
        ])
      ]),
      segment("pain-and-consequence","03","Pain and consequence","Make the data gap expensive.",true,[
        node("pain-and-consequence","downstream-cost","ri","Name the downstream cost","\"When the external signal is late or weak, what breaks first: model quality, monitoring relevance, analyst time, compliance confidence, or response speed?\"","Start here once the dependency is visible.",true,[
          branch("DOWNSTREAM COST CLEAR","ok","\"The weak feed directly weakens the downstream system people actually care about.\"","\"Which part hurts most in practice today: trust, speed, coverage, or false confidence?\"",[
            jumpNode("Quantify the data pain", "pain-and-consequence", "data-pain", "grn"),
            jumpNode("Find the owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"A real downstream consequence is now named.","You still need its dominant cost and owner."),
          branch("SOFT PAIN","ly","\"It is mostly annoying rather than catastrophic.\"","\"Annoying how: analyst hours, slower response, weaker product output, or lower confidence?\"",[
            jumpNode("Quantify the data pain", "pain-and-consequence", "data-pain", "org"),
            jumpNode("Name analyst burden", "pain-and-consequence", "analyst-burden", "blu")
          ],"The cost may still be framed too softly.","You still need the business downside beneath the annoyance."),
          branch("NO CLEAR COST","fl","\"We mostly just want a cleaner setup.\"","\"Then what would have to improve downstream for that cleaner setup to matter?\"",[
            jumpNode("Name analyst burden", "pain-and-consequence", "analyst-burden", "red"),
            jumpNode("Test urgency", "trigger-and-urgency", "soft-trigger", "blu")
          ],"The pain is still too abstract.","You still need the consuming outcome that matters.")
        ]),
        node("pain-and-consequence","data-pain","pr","Quantify the data pain","\"What is the actual price of the weak feed today: lower recall, stale results, manual cleanup, hallucination risk, slower response, or missed coverage?\"","Use this once the consequence is named but not sized.",false,[
          branch("PRICE IS REAL","ok","\"The current gap creates real operational drag or trust loss downstream.\"","\"Who feels that first: product, platform, risk, compliance, or the business team using it?\"",[
            jumpNode("Find the owner split", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Test urgency", "trigger-and-urgency", "new-use-case", "blu")
          ],"The data pain is now attached to business cost.","You still need the accountable owner."),
          branch("HARD TO SIZE","ly","\"It is real, but hard to quantify cleanly.\"","\"Ballpark it for me. Is this a nuisance, or something teams escalate because it blocks real work?\"",[
            jumpNode("Test urgency", "trigger-and-urgency", "new-use-case", "org"),
            jumpNode("Name analyst burden", "pain-and-consequence", "analyst-burden", "blu")
          ],"The cost is real but still fuzzy.","You still need scale or escalation evidence."),
          branch("MOSTLY QUALITY FEAR","fl","\"The main issue is trust, not a single hard metric.\"","\"Trust in what exactly: source rights, freshness, coverage, or whether the downstream output becomes unreliable?\"",[
            jumpNode("Set governance proof", "proof-threshold", "governance-proof", "red"),
            jumpNode("Set reliability proof", "proof-threshold", "reliability-proof", "blu")
          ],"Trust risk is the dominant pain.","You still need the exact trust dimension.")
        ]),
        node("pain-and-consequence","analyst-burden","fu","Name the human compensation burden","\"What do analysts, product teams, or operators still have to do manually because the current layer is not strong enough?\"","Use this when humans are filling the gap.",false,[
          branch("MANUAL VALIDATION","ok","\"People still validate, chase, or reconcile signal by hand before using it.\"","\"If that stopped, what would improve first: speed, coverage, trust, or cost?\"",[
            jumpNode("Quantify the data pain", "pain-and-consequence", "data-pain", "grn"),
            jumpNode("Set workflow proof", "proof-threshold", "implementation-proof", "blu")
          ],"Human compensation is part of the value case.","You still need the outcome that matters most."),
          branch("MODEL CLEANUP","ly","\"Teams mostly clean and reshape the signal before it is usable.\"","\"What is the business price of that cleanup today?\"",[
            jumpNode("Quantify the data pain", "pain-and-consequence", "data-pain", "org"),
            jumpNode("Map the internal alternative", "current-state-truth", "internal-alt", "blu")
          ],"The cost may sit in transformation rather than source acquisition.","You still need the downstream impact of that cleanup."),
          branch("NO HUMAN COST","fl","\"Humans are not the problem. It is downstream quality.\"","\"Then stay with that. What downstream output becomes least trustworthy when the feed slips?\"",[
            jumpNode("Return to downstream cost", "pain-and-consequence", "downstream-cost", "red"),
            jumpNode("Set reliability proof", "proof-threshold", "reliability-proof", "blu")
          ],"The pain is in system output, not manual labor.","You still need the specific degraded output.")
        ])
      ]),
      segment("trigger-and-urgency","04","Trigger and urgency","Find why this matters now.",true,[
        node("trigger-and-urgency","new-use-case","ri","Use the new dependency or requirement","\"What changed recently that made the current data layer feel too weak now instead of later: a new AI product, compliance need, model dependency, or monitoring use case?\"","Start here when there is active momentum.",true,[
          branch("CLEAR TRIGGER","ok","\"A new use case or requirement made the current layer impossible to ignore.\"","\"What deadline or operating moment makes that pressure active right now?\"",[
            jumpNode("Find the owner split", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"There is a real forcing event.","You still need the deadline and owner of the pressure."),
          branch("GENERAL PLATFORM PUSH","ly","\"This sits inside a broader platform or AI push.\"","\"What made this data dependency rise above the rest inside that bigger push?\"",[
            jumpNode("Return to downstream cost", "pain-and-consequence", "downstream-cost", "org"),
            jumpNode("Find the owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Urgency may be real but still generic.","You still need the specific forcing event."),
          branch("NO LIVE EVENT","fl","\"Nothing specific happened. We just know the current layer is not ideal.\"","\"Then what would have to happen before the fuel line itself became a live operating priority?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"There may be no active forcing event.","You still need the future trigger or an honest downgrade.")
        ]),
        node("trigger-and-urgency","soft-trigger","pr","If urgency is soft","\"If nothing changed for the next six months, what would get weaker first: product quality, monitoring relevance, analyst coverage, or compliance confidence?\"","Use this when they want improvement but not urgency.",false,[
          branch("FUTURE COST","ok","\"The current layer would create more operational drag or quality risk over time.\"","\"Who feels that early enough to sponsor change before the downstream cost grows?\"",[
            jumpNode("Find the owner split", "stakeholder-and-ownership", "owner-split", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"There is future cost even if today is calm.","You still need the owner who cares enough now."),
          branch("OPTIONAL","ly","\"It would mostly just be better to have.\"","\"Then this may still be early. What would have to become true before it stopped being optional?\"",[
            jumpNode("Keep it exploratory", "trigger-and-urgency", "exploratory", "org"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The case may be idea-stage only.","You still need the threshold that would make it real."),
          branch("NO FUTURE COST","fl","\"Nothing really changes if we wait.\"","\"Then the call should stay honest. Who would tell you first if that changed?\"",[
            jumpNode("Find the owner split", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"There is no pressure worth forcing.","You still need the watchpoint or an explicit no.")
        ]),
        node("trigger-and-urgency","exploratory","fu","Keep an exploratory call honest","\"If this is still early, what would have to happen before the external data layer itself became a real priority instead of a technical curiosity?\"","Use this when urgency is not active.",false,[
          branch("TRIGGER NAMED","ok","\"A launch, model dependency, compliance need, or monitoring failure would make it active quickly.\"","\"Good. Then the right next step is to anchor on the earliest warning sign before that happens.\"",[
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "grn"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"The future trigger is now named.","You still need the signal that would prove it is starting."),
          branch("NO TRIGGER YET","ly","\"We are not there yet.\"","\"Understood. Then leave with the right watchpoint instead of a fake next step.\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "org"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The call should stay light and honest.","You still need the reason to re-open later."),
          branch("WRONG PERSON","fl","\"Leadership or product would have to answer that.\"","\"Then the fastest truth is getting that owner into the next conversation instead of guessing here.\"",[
            jumpNode("Find the owner split", "stakeholder-and-ownership", "wrong-owner", "red"),
            jumpNode("Shape the next review", "next-step-lock", "live-review", "blu")
          ],"The trigger owner is not in the room.","You still need the right leadership seat.")
        ])
      ]),
      segment("stakeholder-and-ownership","05","Stakeholder and ownership","Find who can move this.",true,[
        node("stakeholder-and-ownership","owner-split","pr","Map the owner split","\"Who feels the weak external signal first today: product, data engineering, AI platform, risk, compliance, or the business team consuming it?\"","Start here once consequence and trigger are visible.",true,[
          branch("PLATFORM LEADS","ok","\"Platform or data engineering feels the burden because the feed is part of critical infrastructure.\"","\"Good. What would they need to believe before changing the current layer?\"",[
            jumpNode("Set reliability proof", "proof-threshold", "reliability-proof", "grn"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"The platform owner is a real pain owner.","You still need the proof bar that would move them."),
          branch("BUSINESS OR PRODUCT LEADS","ly","\"Product or the consuming business team feels the downstream pain more than infra does.\"","\"Then what would the platform owner need to see before treating that downstream pain as urgent?\"",[
            jumpNode("Map the buyer split", "stakeholder-and-ownership", "buyer-split", "org"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"The pain owner and evaluator may be different people.","You still need who translates outcome into budget or build decision."),
          branch("NO CLEAR OWNER","fl","\"It is split across teams.\"","\"Then the next move is not product. It is finding the first team that pays most when the signal goes weak.\"",[
            jumpNode("Find the buyer split", "stakeholder-and-ownership", "buyer-split", "red"),
            jumpNode("Shape the next review", "next-step-lock", "live-review", "blu")
          ],"Ownership is fragmented or absent.","You still need the first real economic owner.")
        ]),
        node("stakeholder-and-ownership","buyer-split","fu","Map the buyer split","\"Is the real buyer here the team that builds the data layer, or the team whose workflow gets weaker when the data is late or thin?\"","Use this when build-side and outcome-side ownership are split.",false,[
          branch("INFRA BUYER","ok","\"The infrastructure team really owns the decision.\"","\"Then what downstream outcome would they need to see before they treat a vendor change as worth the risk?\"",[
            jumpNode("Set implementation proof", "proof-threshold", "implementation-proof", "grn"),
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "blu")
          ],"The buyer is infrastructure-led.","You still need the downstream outcome they care about."),
          branch("OUTCOME BUYER","ly","\"The consuming team drives it more than infra does.\"","\"Then who in infra still has veto power when the workflow team says the current feed is not enough?\"",[
            jumpNode("Map the buying path", "decision-architecture", "buying-path", "org"),
            jumpNode("Set reliability proof", "proof-threshold", "reliability-proof", "blu")
          ],"The business owner may create urgency while infra still controls risk.","You still need the technical gate."),
          branch("TOO MANY HANDS","fl","\"It depends on the use case and team.\"","\"Then who can stop this from moving, even if everyone else likes the idea?\"",[
            jumpNode("Map the stall", "decision-architecture", "stall-map", "red"),
            jumpNode("Shape the next review", "next-step-lock", "live-review", "blu")
          ],"Influence is spread across multiple teams.","You still need the true veto point.")
        ]),
        node("stakeholder-and-ownership","wrong-owner","ri","If the wrong owner is in the room","\"Whose voice do we need next so this becomes a real external-data conversation instead of a polite technical tour?\"","Use this when the current contact cannot own pressure or proof.",false,[
          branch("RIGHT PERSON KNOWN","ok","\"We need the platform owner, product owner, or risk owner in the next session.\"","\"Good. Then shape that review around one live dependency so it earns their time.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The missing seat is visible.","You still need the reason they would attend."),
          branch("ENGINEER FIRST","ly","\"An engineer or platform lead probably needs to go first.\"","\"Fine. Then the next review should pressure-test one live dependency before we widen it.\"",[
            jumpNode("Choose the proving path", "next-step-lock", "scope-path", "org"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"A smaller technical proving wedge may come first.","You still need the exact dependency path."),
          branch("NO IDEA","fl","\"I am not sure who that should be.\"","\"Then the fastest question is simple: who gets blamed first when the current layer is wrong late?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"The org map is still fuzzy.","You still need the accountability line.")
        ])
      ]),
      segment("proof-threshold","06","Proof threshold","Find what would make them believe.",true,[
        node("proof-threshold","real-proof","pr","Name the real proof bar","\"What would make this feel real to your team: stronger freshness and coverage, better downstream output, faster implementation, or cleaner governance?\"","Start here when the buyer says they need proof.",true,[
          branch("DOWNSTREAM OUTPUT","ok","\"We need to see the downstream system actually get better, not just hear about the feed.\"","\"Good. Then the next review should be built around one live dependency, not a generic API tour.\"",[
            jumpNode("Set reliability proof", "proof-threshold", "reliability-proof", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Proof is tied to the consuming system, not the API in isolation.","You still need the exact dependency path."),
          branch("DATA QUALITY","ly","\"We need to trust freshness, coverage, and structure first.\"","\"Good. Which quality dimension kills this fastest today: latency, recall, precision, source breadth, or schema stability?\"",[
            jumpNode("Set reliability proof", "proof-threshold", "reliability-proof", "org"),
            jumpNode("Use one dependency", "current-state-truth", "live-example", "blu")
          ],"Data quality is the primary proof gate.","You still need the quality dimension that matters most."),
          branch("GOVERNANCE OR RIGHTS","fl","\"Rights, citations, or governance are the main gate.\"","\"Then the next review has to prove not just utility, but whether the layer is safe enough to operationalize.\"",[
            jumpNode("Set governance proof", "proof-threshold", "governance-proof", "red"),
            jumpNode("Map the buying path", "decision-architecture", "rights-gate", "blu")
          ],"Governance is a primary gate, not a side note.","You still need the exact rights or control standard.")
        ]),
        node("proof-threshold","reliability-proof","fu","If proof is about data quality","\"What would make the current layer feel trustworthy enough: latency, coverage, precision, recall, source diversity, entity resolution, or reproducibility?\"","Use this when the buyer's main concern is raw feed trust.",false,[
          branch("ONE QUALITY DIMENSION","ok","\"One or two specific quality dimensions drive the whole decision.\"","\"Good. Then the next review should prove those on a live dependency path.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "grn"),
            jumpNode("Choose the proving path", "next-step-lock", "scope-path", "blu")
          ],"The proof bar is now measurable.","You still need the benchmark path."),
          branch("QUALITY MIX","ly","\"It is a blend of freshness, coverage, and trust.\"","\"Which one kills the downstream workflow fastest if it stays weak?\"",[
            jumpNode("Return to downstream cost", "pain-and-consequence", "downstream-cost", "org"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"There are multiple quality gates.","You still need the primary kill switch."),
          branch("NOT ABOUT QUALITY","fl","\"Quality is not the real issue. Implementation and adoption are.\"","\"Then the proof bar is workflow fit, not feed stats. Who has to use it first and what should get easier?\"",[
            jumpNode("Set implementation proof", "proof-threshold", "implementation-proof", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The gate may be operating fit, not raw quality.","You still need the first user and first improvement.")
        ]),
        node("proof-threshold","implementation-proof","ri","If proof is about implementation speed","\"What would make this feel worth the switch operationally: faster integration, less maintenance, wider coverage, or fewer manual patches downstream?\"","Use this when they care about build-vs-buy more than raw feed quality.",false,[
          branch("MAINTENANCE RELIEF","ok","\"We need to stop spending engineering or analyst time maintaining the current layer.\"","\"Good. Then the next review should show the exact dependency where maintenance relief matters first.\"",[
            jumpNode("Choose the proving path", "next-step-lock", "scope-path", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Implementation relief is part of the value case.","You still need the dependency path that proves it."),
          branch("WIDER COVERAGE","ly","\"Coverage or source breadth is the main reason to move.\"","\"Which downstream workflow suffers first when coverage stays too narrow?\"",[
            jumpNode("Return to downstream cost", "pain-and-consequence", "downstream-cost", "org"),
            jumpNode("Use one dependency", "current-state-truth", "live-example", "blu")
          ],"Coverage is an implementation plus value issue.","You still need the affected workflow."),
          branch("NO BUILD PAIN","fl","\"Build and maintenance are manageable. We just want better results.\"","\"Then stay on results. What downstream result needs to get better before this matters?\"",[
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "red"),
            jumpNode("Return to downstream cost", "pain-and-consequence", "downstream-cost", "blu")
          ],"Build-vs-buy is not the main wedge.","You still need the outcome buyer cares about.")
        ]),
        node("proof-threshold","governance-proof","va","If proof is about rights or control","\"What has to be true around rights, licensing, citations, or reproducibility before the team would trust this in production?\"","Use this when governance is the loudest concern.",false,[
          branch("CLEAR GOVERNANCE BAR","ok","\"We know the specific trust and rights conditions we would need.\"","\"Good. Then the next review should prove those conditions on the exact use case that matters.\"",[
            jumpNode("Map the rights gate", "decision-architecture", "rights-gate", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Governance is now a defined proof bar.","You still need the use case and owner tied to it."),
          branch("GOVERNANCE IS FUZZY","ly","\"We know governance matters, but not exactly how we would test it yet.\"","\"Then who has to define the bar before this can move responsibly?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "org"),
            jumpNode("Map the rights gate", "decision-architecture", "rights-gate", "blu")
          ],"Governance is a real gate but still fuzzy.","You still need the owner of the bar."),
          branch("GOVERNANCE SECONDARY","fl","\"Governance matters, but downstream usefulness matters more.\"","\"Fine. Then keep governance in view, but let the next review prove the live dependency first.\"",[
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "red"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Governance is not the first proving wedge.","You still need the live dependency path.")
        ])
      ]),
      segment("current-vendor-and-displacement","07","Current vendor and displacement","Test why the current layer still wins.",false,[
        node("current-vendor-and-displacement","current-stack","ri","Map the current stack","\"What is doing the job today: internal crawler, search stack, scraping vendors, legacy feeds, analyst labor, or some mix of all of them?\"","Start here once they say they already have a data layer.",true,[
          branch("STACK MIX CLEAR","ok","\"It is a mix of systems and people, and no one fully trusts it end to end.\"","\"Which part gives the team the false sense that the problem is solved when it actually is not?\"",[
            jumpNode("Return to downstream cost", "pain-and-consequence", "downstream-cost", "grn"),
            jumpNode("Set the proof bar", "proof-threshold", "real-proof", "blu")
          ],"The incumbent stack is visible as a patchwork, not a clean layer.","You still need the false-confidence layer."),
          branch("VENDOR DOES MOST","ly","\"A vendor gets us most of the way there already.\"","\"Most of the way is fine. What still forces teams to patch around it manually?\"",[
            jumpNode("Map the internal alternative", "current-state-truth", "internal-alt", "org"),
            jumpNode("Name analyst burden", "pain-and-consequence", "analyst-burden", "blu")
          ],"The incumbent works partially, not fully.","You still need the manual escape hatch."),
          branch("DIY PLUS INERTIA","fl","\"It is messy, but it is our mess and everyone is used to it.\"","\"Then what business result would have to improve before the team would actually change the layer?\"",[
            jumpNode("Name the downstream cost", "pain-and-consequence", "downstream-cost", "red"),
            jumpNode("Test build bias", "current-vendor-and-displacement", "build-bias", "blu")
          ],"Habit may be part of the incumbent advantage.","You still need the result strong enough to beat it.")
        ]),
        node("current-vendor-and-displacement","build-bias","fu","Test build-internal bias","\"Which part do you actually want to own long term: the raw ingestion layer, the downstream product, or both?\"","Use this when they have strong build instincts.",false,[
          branch("OWN THE PRODUCT NOT FEED","ok","\"We care more about the downstream product than owning the fuel line itself.\"","\"Good. Then the test is whether the current fuel line is already good enough or still taxing the product team too much.\"",[
            jumpNode("Return to internal alt", "current-state-truth", "internal-alt", "grn"),
            jumpNode("Set implementation proof", "proof-threshold", "implementation-proof", "blu")
          ],"The buyer may not want to own the underlying layer forever.","You still need the build pain worth escaping."),
          branch("OWN THE PIPELINE","ly","\"We prefer to own the ingestion and retrieval stack ourselves.\"","\"Then what part still feels too expensive, brittle, or slow to keep owning?\"",[
            jumpNode("Return to internal alt", "current-state-truth", "internal-alt", "org"),
            jumpNode("Name the data pain", "pain-and-consequence", "data-pain", "blu")
          ],"Build bias is real and must be challenged economically.","You still need the part they do not actually want to own."),
          branch("NO STRONG BIAS","fl","\"We are open either way if the proof is strong.\"","\"Good. Then keep the conversation on the live dependency and the proof bar, not ideology.\"",[
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "red"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"Build-versus-buy identity is weak.","You still need the strongest live proof path.")
        ]),
        node("current-vendor-and-displacement","switch-risk","va","Test switching risk","\"What makes changing the layer feel dangerous: integration work, rights and governance, model reliability, or the risk of breaking downstream systems?\"","Use this to expose the real blocker.",false,[
          branch("DOWNSTREAM BREAKAGE RISK","ok","\"We cannot risk weakening the downstream system while we change the feed layer.\"","\"Then the next review has to prove one narrow dependency path without disturbing the rest.\"",[
            jumpNode("Choose the proving path", "next-step-lock", "scope-path", "grn"),
            jumpNode("Set implementation proof", "proof-threshold", "implementation-proof", "blu")
          ],"Change risk is tied to downstream continuity.","You still need the smallest safe proving wedge."),
          branch("RIGHTS OR GOVERNANCE RISK","ly","\"Rights, governance, or reproducibility could slow this down.\"","\"Then what has to be true in the next review so that risk feels manageable?\"",[
            jumpNode("Set governance proof", "proof-threshold", "governance-proof", "org"),
            jumpNode("Map the rights gate", "decision-architecture", "rights-gate", "blu")
          ],"Governance risk is a central blocker.","You still need the exact condition that lowers it."),
          branch("INERTIA","fl","\"Mostly it is just inertia.\"","\"Inertia usually means the pain or sponsor is still too weak. Which one is true here?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Return to downstream cost", "pain-and-consequence", "downstream-cost", "blu")
          ],"The blocker may be weak urgency rather than true switching cost.","You still need the real source of inertia.")
        ])
      ]),
      segment("decision-architecture","08","Decision architecture","Map how this actually moves.",false,[
        node("decision-architecture","buying-path","pr","Map the buying path","\"If this became real, who would sponsor, who would evaluate, and who could slow or stop it?\"","Start here once sponsor and proof are partly visible.",true,[
          branch("PATH CLEAR","ok","\"Platform or product would sponsor, engineering would evaluate, and security or risk would review where needed.\"","\"Good. What would the evaluator have to prove before the sponsor treats this as safe enough to move?\"",[
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "grn"),
            jumpNode("Lock the review", "next-step-lock", "live-review", "blu")
          ],"The path from sponsor to evaluator is visible.","You still need the gate that turns evaluation into motion."),
          branch("PATH SPLIT","ly","\"The business team feels the pain, but engineering or governance will complicate it.\"","\"Which of those can actually kill this if the proof is strong?\"",[
            jumpNode("Map the stall", "decision-architecture", "stall-map", "org"),
            jumpNode("Shape the next review", "next-step-lock", "live-review", "blu")
          ],"There are competing stakeholder logics.","You still need the true veto point."),
          branch("PATH UNKNOWN","fl","\"We are too early to know the full path.\"","\"That is fine. Who definitely has to believe this first for the path to matter at all?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "red"),
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "blu")
          ],"Decision architecture is still fuzzy.","You still need the first internal believer.")
        ]),
        node("decision-architecture","stall-map","fu","Name the stall point","\"Where do motions like this usually slow down internally: engineering backlog, governance review, rights questions, or weak business urgency?\"","Use this when the path exists but feels fragile.",false,[
          branch("ENGINEERING GATE","ok","\"Engineering time and technical skepticism are the first gate.\"","\"Then the next review has to prove one live dependency path that is worth the engineering overhead.\"",[
            jumpNode("Choose the proving path", "next-step-lock", "scope-path", "grn"),
            jumpNode("Set implementation proof", "proof-threshold", "implementation-proof", "blu")
          ],"Engineering prioritization is the real gate.","You still need the path that justifies it."),
          branch("GOVERNANCE GATE","ly","\"Security, rights, or compliance will slow it if the trust model is fuzzy.\"","\"Then the next review has to prove not just utility, but whether the layer is safe enough for the actual use case.\"",[
            jumpNode("Set governance proof", "proof-threshold", "governance-proof", "org"),
            jumpNode("Map the rights gate", "decision-architecture", "rights-gate", "blu")
          ],"Governance is the main gate.","You still need the exact trust condition to clear."),
          branch("ATTENTION RISK","fl","\"Nothing formal kills it. It just loses oxygen.\"","\"Then the next step has to be concrete enough that it cannot hide in polite interest.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "red"),
            jumpNode("Return to trigger", "trigger-and-urgency", "new-use-case", "blu")
          ],"Attention risk is the real danger.","You still need a next step that earns gravity.")
        ]),
        node("decision-architecture","rights-gate","ri","If rights or governance are gating","\"Who defines whether the data is safe enough to use in the downstream workflow: legal, security, compliance, risk, or the product owner?\"","Use this when rights or governance come up early.",false,[
          branch("CLEAR GATE OWNER","ok","\"We know exactly who has to sign off on rights or governance.\"","\"Good. Then the next review has to give that owner the exact use case and trust question, not a generic API story.\"",[
            jumpNode("Shape the next review", "next-step-lock", "live-review", "grn"),
            jumpNode("Set governance proof", "proof-threshold", "governance-proof", "blu")
          ],"The governance gate is visible.","You still need the use case that will test it."),
          branch("SHARED GATE","ly","\"It is spread across multiple teams.\"","\"Then the next review has to stay narrow enough that all of them can evaluate one concrete dependency path.\"",[
            jumpNode("Choose the proving path", "next-step-lock", "scope-path", "org"),
            jumpNode("Shape the attendees", "next-step-lock", "attendee-shape", "blu")
          ],"Multiple teams own the trust gate.","You still need a narrow enough proving path."),
          branch("NOT SURE YET","fl","\"We have not thought that far ahead.\"","\"That is fine. Then the immediate job is simpler: earn one serious review with the right technical and business owner.\"",[
            jumpNode("Lock the review", "next-step-lock", "live-review", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"Later-stage governance is premature.","You still need the first serious internal review.")
        ])
      ]),
      segment("next-step-lock","09","Next-step lock","Leave with a real review.",true,[
        node("next-step-lock","live-review","pr","Lock the dependency review","\"The next best step sounds like a live review with the platform owner and the consuming team around one real dependency path. Does that fit how your team would validate this?\"","Start here whenever proof points to a live review.",true,[
          branch("YES LOCK IT","ok","\"Yes. That is the right shape.\"","\"Good. Which dependency path should we pressure-test so the review earns the time?\"",[
            jumpNode("Choose the proving path", "next-step-lock", "scope-path", "grn"),
            jumpNode("Shape the attendees", "next-step-lock", "attendee-shape", "blu")
          ],"The next review format is agreed.","You still need the exact path and seats."),
          branch("NEEDS NARROWER START","ly","\"Close, but start with one team or one dependency first.\"","\"That works. Which narrower path still gives us a real proving ground instead of a generic walkthrough?\"",[
            jumpNode("Choose the proving path", "next-step-lock", "scope-path", "org"),
            jumpNode("Shape the attendees", "next-step-lock", "attendee-shape", "blu")
          ],"The review shape needs tuning, not replacement.","You still need the narrowest real proving ground."),
          branch("TOO EARLY","fl","\"That feels like too much for where we are.\"","\"Understood. Then what would make the next step real enough to keep momentum without pretending we are further along than we are?\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to real proof", "proof-threshold", "real-proof", "blu")
          ],"The buyer is not ready for a full review yet.","You still need a lighter but real progression step.")
        ]),
        node("next-step-lock","scope-path","fu","Choose the proving path","\"What should anchor the review: one model input path, one monitoring workflow, one analyst workflow, or one compliance dependency?\"","Use this to stop the next step from becoming generic.",false,[
          branch("DEPENDENCY PATH CHOSEN","ok","\"We know the exact dependency path to pressure-test.\"","\"Perfect. That makes the review real immediately.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The proving ground is concrete.","You still need the exact attendees and calendar hold."),
          branch("ONE TEAM FIRST","ly","\"Start with one team or one model before going broader.\"","\"That is a strong first wedge. Which owner has enough pain to make that session honest?\"",[
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "org"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"A narrower proving path may be safer.","You still need the right owner and date."),
          branch("NO PATH YET","fl","\"We do not know which dependency to use yet.\"","\"Then the next step is not locked. Who can pick that path before the meeting goes on calendar?\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The next review is still underspecified.","You still need the owner of the proving path.")
        ]),
        node("next-step-lock","attendee-shape","ri","Shape the attendee list","\"Who has to be in that next review for the outcome to matter: platform, product, risk, compliance, or the consuming team?\"","Use this to keep the meeting from getting decorative.",false,[
          branch("RIGHT PEOPLE NAMED","ok","\"Platform and the consuming team need to be there. Others can come later if the review hits.\"","\"Good. Then this is close to lockable.\"",[
            jumpRoom("Open Call Planner", "call-planner", "grn"),
            jumpNode("Write the handoff", "post-call-routing", "handoff", "blu")
          ],"The review has the right seats.","You still need the date and owner."),
          branch("GOVERNANCE NEEDED NOW","ly","\"Security, compliance, or legal should be there from the start.\"","\"Fine. Then the agenda has to stay tight and proof-led so the session earns that altitude.\"",[
            jumpNode("Return to governance proof", "proof-threshold", "governance-proof", "org"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The meeting is governance-weighted.","You still need the proof question to justify it."),
          branch("ATTENDEES UNCLEAR","fl","\"We can figure that out later.\"","\"That usually kills momentum. Who owns deciding the attendee list before the follow-up goes out?\"",[
            jumpNode("Use soft next step", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Return to owner split", "stakeholder-and-ownership", "owner-split", "blu")
          ],"The meeting is not really locked yet.","You still need the owner of the invite list.")
        ]),
        node("next-step-lock","soft-deferral","va","If the next step stays soft","\"What has to become true before the next conversation earns real calendar gravity?\"","Use this when they want to stay polite but noncommittal.",false,[
          branch("ADVANCEMENT CONDITION","ok","\"If we can prove this on one live dependency path with the right people, it earns the next session.\"","\"That is enough. Let us route that exact condition forward.\"",[
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
        node("post-call-routing","handoff","cl","Write the handoff","\"If the next room picked this up cold, what would it need to know in the first 30 seconds?\"","Use this to strip the call down to usable data-layer truth.",false,[
          branch("HANDOFF CLEAN","ok","\"Carry the live dependency, owner split, proof bar, and next review condition.\"","\"Good. Keep only what changes the next move.\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "grn"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The handoff can now start from signal instead of notes.","You still need the one missing truth to chase."),
          branch("HANDOFF TOO VERBAL","ly","\"We have a lot of detail, but not a clean signal yet.\"","\"Then throw away anything that does not change the next review question. What is actually usable?\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "org"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The raw detail exists, but the usable signal is still diluted.","You still need the distilled pressure and route."),
          branch("NO HANDOFF HABIT","fl","\"We do not really capture this cleanly today.\"","\"Then the minimum capture rule is simple: owner, dependency, proof bar, next condition.\"",[
            jumpNode("Name the missing truth", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose the next room", "post-call-routing", "room-route", "blu")
          ],"The handoff discipline itself is weak.","You still need the one capture rule that sticks.")
        ]),
        node("post-call-routing","missing-truth","fu","Name the missing truth","\"What is still missing that the next room has to chase directly before this becomes real?\"","Use this so the handoff carries a chase-down target.",false,[
          branch("MISSING TRUTH CLEAR","ok","\"We still need the exact dependency path, the right owner seat, or the proof benchmark.\"","\"Good. Then route the call to the room most likely to surface that fast.\"",[
            jumpNode("Choose the next room", "post-call-routing", "room-route", "grn"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The missing truth is clearly named.","You still need the room best suited to chase it."),
          branch("MISSING OWNER","ly","\"We know the gap, but not who can answer it.\"","\"Then the next room should start with the owner map, not another product conversation.\"",[
            jumpRoom("Open Call Planner", "call-planner", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The truth gap is visible but ownerless.","You still need the best route to the right person."),
          branch("TOO THIN","fl","\"Too much is still vague.\"","\"Then do not pretend this is a healthy progression. Name the trust or dependency drift now and correct it before the downstream system pays for it.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The call may need correction more than continuation.","You still need the clearest failure pattern.")
        ]),
        node("post-call-routing","room-route","pr","Choose the next room","\"Which next room gives the strongest immediate leverage: shape the next review, attach truth to the live dependency, or name the failure pattern before it repeats?\"","Use this to route with intent instead of habit.",false,[
          branch("CALL PLANNER","ok","\"The next move is a tighter dependency review with a clearer proving question.\"","\"Then route this to Call Planner with the dependency path, owner map, and proof bar.\"",[
            jumpRoom("Open Call Planner", "call-planner", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ],"The next room is conversational and tactical.","You still need the forcing question in plain language."),
          branch("DEAL WORKSPACE","ly","\"There is already a live product, risk, or monitoring path here.\"","\"Then attach the operating truth to that path immediately before the story drifts again.\"",[
            jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
            jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
          ],"The truth belongs with a live dependency path.","You still need the top risk to carry with it."),
          branch("FUTURE AUTOPSY","fl","\"This still feels like trust drift or decorative motion.\"","\"Then route it to Future Autopsy now and name the failure pattern before the downstream cost compounds.\"",[
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            jumpRoom("Open Call Planner", "call-planner", "blu")
          ],"The next room may need to correct drift, not advance motion.","You still need the failure pattern in plain language.")
        ])
      ])
    ]
  };
})();
