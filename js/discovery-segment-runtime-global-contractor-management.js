(function () {
  // Global Contractor Management / EOR override. This file replaces the
  // base-generated segments with fully GCM/EOR-tailored discovery copy
  // (Deel / Remote / Papaya / Velocity Global world: worker
  // classification, misclassification, permanent-establishment exposure,
  // multi-jurisdiction compliance, contractor payments, statutory
  // benefits). The structural skeleton mirrors the base runtime exactly:
  // same segment ids, node slugs, tones, branch classes, and jump
  // targets. Only the human-readable English strings are domain voice.
  // The 5 GCM interrupts are kept verbatim.
  var rt = window.DISCOVERY_SEGMENT_RUNTIME;
  if (!rt || !rt.frameworks || !rt.frameworks["global-contractor-management"]) return;

  function action(label, target, tone) {
    return { label: label, target: target, tone: tone || "blu" };
  }
  function jumpNode(label, segmentId, nodeSlug, tone) {
    return action(label, "node:" + segmentId + "--" + nodeSlug, tone);
  }
  function jumpSegment(label, segmentId, tone) {
    return action(label, "segment:" + segmentId, tone);
  }
  function jumpRoom(label, roomId, tone) {
    return action(label, "room:" + roomId, tone);
  }
  function branch(tag, cls, quote, move, actions, clear, missing) {
    return {
      tag: tag,
      cls: cls,
      quote: quote,
      move: move,
      actions: actions || [],
      clear: clear || "",
      missing: missing || ""
    };
  }
  function node(segmentId, slug, tone, badge, text, note, essential, branches) {
    return {
      id: segmentId + "--" + slug,
      essential: !!essential,
      tone: tone,
      badge: badge,
      text: text,
      note: note,
      branches: branches || []
    };
  }
  function segment(segmentId, num, title, cue, essential, nodes) {
    return {
      key: segmentId,
      num: num,
      title: title,
      cue: cue,
      essential: !!essential,
      nodes: nodes || []
    };
  }

  function opening() {
    return segment("opening-frame", "01", "Opening", "Ask permission to understand their world before you show anything.", true, [
      node("opening-frame", "primary", "pr", "Start with worker classification", "\"You're hiring people in other countries. I want to understand where classification and local compliance still land on your team's desk every time, before I show you anything.\"", "Ask about worker classification before you pitch the platform. That is often where most of their legal risk sits.", true, [
        branch("CONFIRMS", "ok", "\"Yeah, every new country is a fire drill for legal and finance.\"", "\"That's the part worth fixing. Walk me through what happens the moment you decide to hire someone in a new country.\"", [
          jumpNode("Ask them to walk through how it works today", "current-state-truth", "workflow", "blu"),
          jumpNode("Ask where it hurts most today", "pain-and-consequence", "pressure", "grn")
        ], "They admit classification and local compliance still land on humans every country.", "You still need the exact country or worker type and who gets pulled in."),
        branch("BROAD", "ly", "\"We've got a pretty standard global hiring setup.\"", "\"Standard is fine. Walk me through where someone still has to make a classification call or chase local compliance by hand.\"", [
          jumpNode("Walk through the workflow", "current-state-truth", "workflow", "org"),
          jumpNode("Ask for a recent example", "current-state-truth", "example", "blu")
        ], "They gave you a tidy global-hiring story, not what actually happens per jurisdiction.", "You still need a recent cross-border hire or the manual compliance step."),
        branch("PUSHBACK", "fl", "\"Can you just show me the platform?\"", "\"I can, but I want it mapped to your countries first. Give me one country or contractor population so the tour isn't generic.\"", [
          jumpNode("Walk through the workflow", "current-state-truth", "workflow", "blu"),
          jumpNode("Ask what evidence they need", "proof-threshold", "early-demo", "pur")
        ], "They're trying to skip the diagnosis and tour the EOR platform.", "You still need one real country or worker type before showing anything.")
      ]),
      node("opening-frame", "workflow", "fu", "Walk through hiring and paying one person", "\"Before we go anywhere, walk me through hiring someone abroad: deciding contractor versus employee, onboarding them compliantly, and paying them, up to the point where legal or finance has to step in.\"", "Trace the contractor-versus-employee decision all the way through to the local-currency payment. A lot of the risk often sits in the handoffs between those steps.", false, [
        branch("CONCRETE", "ok", "\"We decide contractor or EOR, set up the agreement, then finance figures out how to pay them in local currency.\"", "\"Good. Where in that does someone make a judgment call that, if wrong, creates real exposure: classification, payment, or local taxes?\"", [
          jumpNode("Ask what the problem costs them", "pain-and-consequence", "pressure", "grn"),
          jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "why-now", "blu")
        ], "You are starting to see how they go from choosing contractor or EOR to paying people.", "You still need the branch that carries classification or tax exposure, not just the steps."),
        branch("MIXED", "ly", "\"It depends on the country and whether it's a contractor or full employee.\"", "\"That's fine. Pick the one country or worker type your team would panic most about if it got audited tomorrow.\"", [
          jumpNode("Ask for a recent example", "current-state-truth", "example", "org"),
          jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "blu")
        ], "The footprint is fragmented across jurisdictions and worker types.", "You still need one country or worker type to anchor the call."),
        branch("TOO HIGH LEVEL", "fl", "\"I'm not close enough to the day-to-day compliance to map it that tightly.\"", "\"No problem. What's the first complaint you hear when a global hire goes wrong?\"", [
          jumpNode("Ask about the pain", "pain-and-consequence", "pressure", "red"),
          jumpNode("Ask who owns it", "stakeholder-and-ownership", "wrong-person", "blu")
        ], "This person sits too far from the classification and payroll detail.", "You need either a complaint pattern or whoever actually runs global compliance.")
      ]),
      node("opening-frame", "sideways", "ri", "If the call starts off-topic", "\"If this is early or exploratory, that's fine. What made the meeting worth taking now: a new country, a contractor scare, or just planning ahead?\"", "Use this when the buyer is rushed, skeptical, or staying abstract about their global footprint.", false, [
        branch("REAL REASON", "ok", "\"We're about to start hiring in three new countries and nobody owns the compliance piece.\"", "\"Good. Then let's follow that expansion instead of talking in generalities.\"", [
          jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "why-now", "grn"),
          jumpNode("Ask them to walk through how it works today", "current-state-truth", "workflow", "blu")
        ], "A real expansion or classification scare put this meeting on the calendar.", "You still need whether it's urgent enough to move now."),
        branch("SOFT REASON", "ly", "\"We're mostly just staying informed on EOR options.\"", "\"That's fine. What would have to become true for global employment to stop being a research topic and become a real priority?\"", [
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "org"),
          jumpNode("Ask what they need to see", "proof-threshold", "real-proof", "pur")
        ], "EOR is still a research topic for them, not a live problem.", "You still need the threshold that turns interest into action."),
        branch("NO REASON", "fl", "\"Nothing changed. We're just looking around.\"", "\"Understood. Then I'll keep this honest and light. What would have to break, a misclassification notice, a failed payment, before this became a real priority?\"", [
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Ask what would make this a priority", "next-step-lock", "soft-deferral", "blu")
        ], "There's no misclassification notice, audit, or new market forcing the issue yet.", "You still need the future trigger or a reason not to chase this hard.")
      ])
    ]);
  }

  function current() {
    return segment("current-state-truth", "02", "How they work today", "Ask them to walk you through how they hire, pay, and stay compliant with people abroad today.", true, [
      node("current-state-truth", "workflow", "fu", "Walk through hiring and paying one person", "\"Walk me through global hiring from deciding contractor versus employee to paying them compliantly, up to the point where legal or finance has to step in.\"", "Get the full path on the table: classify, contract or EOR, pay, stay compliant. Then find where it breaks.", true, [
        branch("WORKFLOW CLEAR", "ok", "\"We classify them, set up the contract or EOR, then finance runs the payment and legal reviews anything risky.\"", "\"Good. Where does that break first: making the classification call, paying across jurisdictions, or staying compliant after onboarding?\"", [
          jumpNode("Ask what the problem costs them", "pain-and-consequence", "pressure", "grn"),
          jumpNode("Ask what changed", "trigger-and-urgency", "why-now", "blu")
        ], "You can see how they classify, contract, and pay people, and where legal has to step in.", "You still need the highest-risk branch and its consequence."),
        branch("WORKFLOW BROAD", "ly", "\"It's mostly local providers and spreadsheets doing the obvious parts.\"", "\"What's the expensive part that isn't obvious and still needs legal or finance every time, the classification call or the per-country compliance?\"", [
          jumpNode("Ask where people take over", "current-state-truth", "human-edge", "org"),
          jumpNode("Ask for a recent example", "current-state-truth", "example", "blu")
        ], "They're naming local providers and spreadsheets, not who makes the classification call.", "You still need the exact point a human has to make a classification or compliance call."),
        branch("WORKFLOW MESSY", "fl", "\"Every country and every worker type is handled differently.\"", "\"That's normal. Pick the one country or contractor population leadership would care most about if it got audited tomorrow.\"", [
          jumpNode("Ask for a recent example", "current-state-truth", "example", "red"),
          jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "blu")
        ], "The workflow is fragmented per jurisdiction and worker type.", "You still need one country to anchor the rest of the call.")
      ]),
      node("current-state-truth", "human-edge", "pr", "Find where people step in", "\"Where does the tooling stop being trusted and a person, usually legal or finance, has to step in to make the classification or compliance call?\"", "The platform handles the easy 80 percent. Find the 20 percent where legal still makes the contractor-versus-employee call by hand.", false, [
        branch("HUMAN EDGE NAMED", "ok", "\"Legal makes the contractor-versus-employee call by hand, and finance figures out the payment and local taxes.\"", "\"Good. Which of those, the classification call, the multi-country payment, or the local tax piece, burns the most time, money, or risk?\"", [
          jumpNode("Ask what the problem costs in money or time", "pain-and-consequence", "quantify", "grn"),
          jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "blu")
        ], "They named where legal has to step in on classification and finance on payment.", "You still need its consequence and owner."),
        branch("HUMAN EDGE VAGUE", "ly", "\"Legal gets pulled in whenever something looks risky.\"", "\"What makes it risky: a classification gray zone, permanent-establishment exposure, IP assignment across borders, or a country you've never hired in?\"", [
          jumpNode("Ask for a recent example", "current-state-truth", "example", "org"),
          jumpNode("Ask about the pain", "pain-and-consequence", "pressure", "blu")
        ], "Legal does step in, but the type of compliance risk is still unclear.", "You still need the specific risk: classification, PE exposure, or IP."),
        branch("NO HUMAN EDGE", "fl", "\"Honestly, our global hiring is mostly fine.\"", "\"Then what made this meeting worth taking? If the workflow is fine, the reason must be somewhere else, a new country or a contractor count that grew.\"", [
          jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "why-now", "red"),
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "blu")
        ], "The classification edge may not be live pain for them today.", "You still need either a trigger or a reason to treat this as exploratory.")
      ]),
      node("current-state-truth", "example", "ri", "Ask for one recent hire abroad", "\"Give me one recent hire abroad where the classification or local compliance couldn't be handled without legal or finance stepping in.\"", "Ask about one specific cross-border hire, with the country named. General answers make misclassification risk hard to spot.", false, [
        branch("RECENT EXAMPLE", "ok", "\"Last month we hired a contractor in Germany and spent two weeks figuring out if they'd be reclassified as an employee.\"", "\"That's helpful. How often does that kind of classification scramble happen, every new country, or only the tricky ones?\"", [
          jumpNode("Ask what the manual work really costs", "pain-and-consequence", "quantify", "grn"),
          jumpNode("Ask what made this urgent", "trigger-and-urgency", "why-now", "blu")
        ], "The call now has a live reclassification scare in a real country.", "You still need how often it repeats and what it costs."),
        branch("OLD EXAMPLE", "ly", "\"It's happened before, but I don't have a recent one on hand.\"", "\"Then ballpark the pattern. How many countries are you paying contractors in, and who confirms each one is classified right?\"", [
          jumpNode("Ask what the manual work really costs", "pain-and-consequence", "pressure", "org"),
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
        ], "The misclassification pattern exists, but they can't point to a recent case.", "You still need the country count or who carries the classification risk."),
        branch("NO EXAMPLE", "fl", "\"I don't really have one.\"", "\"That usually means either the global footprint is small or the wrong person is in the room. Which one is it: how many countries and contractors are we talking about?\"", [
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "wrong-person", "red"),
          jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "blu")
        ], "Either the global footprint is tiny or you're talking to the wrong person.", "You still need a real cross-border hire or whoever runs compliance.")
      ])
    ]);
  }

  function pain() {
    return segment("pain-and-consequence", "03", "The problem and its cost", "Find out what the problem costs them in time, money, or risk.", true, [
      node("pain-and-consequence", "pressure", "ri", "Ask where the current setup hurts most", "\"Where does the current setup hurt most right now: misclassification risk, compliance cost, slow time-to-hire, or unreliable contractor payments?\"", "Get the dominant exposure into plain language: misclassification, compliance cost, hiring speed, or broken payments. Usually one matters most.", true, [
        branch("PAIN NAMED", "ok", "\"Misclassification is the one that keeps legal up at night, we're not sure half our contractors would survive an audit.\"", "\"What does that cost in practice today, back taxes and penalties, statutory benefit liability, legal hours, or hires you can't make fast enough?\"", [
          jumpNode("Ask what the problem costs in money or time", "pain-and-consequence", "quantify", "grn"),
          jumpNode("Ask why now", "trigger-and-urgency", "why-now", "blu")
        ], "A real exposure is named: contractors that might not survive a classification audit.", "You still need the dollar cost and who feels it most."),
        branch("SOFT PAIN", "ly", "\"It's not broken. Hiring abroad is just slower and clunkier than it should be.\"", "\"If it stayed like this for another quarter, what gets worse first, time-to-hire, or the pile of contractors nobody's re-checked for classification?\"", [
          jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "org"),
          jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "consequence", "blu")
        ], "There's friction in hiring abroad, but the classification cost is still unclear.", "You still need the cost of leaving it alone."),
        branch("NO PAIN", "fl", "\"This isn't the main problem right now.\"", "\"That's useful. Then the test is whether there's any real trigger. What changed, a new country, a contractor scare, that made the meeting happen?\"", [
          jumpNode("Ask what made this urgent", "trigger-and-urgency", "why-now", "red"),
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "blu")
        ], "Global compliance isn't their top problem today.", "You still need the actual reason the meeting exists.")
      ]),
      node("pain-and-consequence", "quantify", "va", "Ask what a misclassified worker costs", "\"When a worker gets misclassified or a country goes wrong, what does the business actually pay: back taxes and penalties, statutory benefits owed, legal spend, or hires that stall?\"", "Make the exposure concrete: back taxes, penalties, statutory benefits owed, legal hours, stalled hires. Vague risk doesn't move a deal.", false, [
        branch("COST IS CLEAR", "ok", "\"A reclassification could mean back taxes, penalties, and benefits owed, and our last country took six weeks to set up.\"", "\"Who feels that first, legal on the exposure, finance on the bill, or People Ops on the slow hire, and who feels it badly enough to sponsor a change?\"", [
          jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "grn"),
          jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "consequence", "blu")
        ], "The exposure now has a real bill: back taxes, penalties, benefits owed, six-week setup.", "You still need the owner and the deadline."),
        branch("COST IS IMPLIED", "ly", "\"It mostly just slows hiring down.\"", "\"Which roles aren't getting filled because legal and finance are stuck untangling each country's compliance instead?\"", [
          jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "org"),
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
        ], "The cost shows up as slower hiring but hasn't been put in numbers.", "You still need the stalled hire or the measurable miss."),
        branch("COST IS HIDDEN", "fl", "\"We've learned to manage it with spreadsheets and local providers.\"", "\"Managing it per jurisdiction is still real work, and real exposure. Who's paying for that workaround every week, and what happens the day an auditor asks?\"", [
          jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "red"),
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
        ], "They've normalized the per-jurisdiction workaround and stopped seeing the exposure.", "You still need who runs the workaround and what an audit would surface.")
      ]),
      node("pain-and-consequence", "soft-pain", "ri", "If the problem doesn't sound costly", "\"If your global hiring stayed exactly like this for six months, what gets slower, more expensive, or more exposed first, the contractor count, the country count, or the audit risk?\"", "Use this when they minimize the misclassification risk. Push the exposure forward six months and see what gets worse.", false, [
        branch("FUTURE COST", "ok", "\"As we add countries, the manual compliance just won't scale, and the classification risk keeps stacking up.\"", "\"Good. What would make leadership notice that exposure before it turns into a tax notice or a reclassification claim?\"", [
          jumpNode("Ask what happens if nothing changes", "trigger-and-urgency", "consequence", "grn"),
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
        ], "Manual compliance won't scale and classification risk grows with every country added.", "You still need the event that makes that exposure visible."),
        branch("ONLY INTERNAL COST", "ly", "\"No one's been audited. It's mostly internal drag on legal and finance.\"", "\"That still matters. Which higher-value work, faster hiring, cleaner books, stops happening because they're stuck on per-country compliance?\"", [
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "org"),
          jumpNode("Ask why now", "trigger-and-urgency", "why-now", "blu")
        ], "The case is internal legal and finance drag, not active audit exposure.", "You still need the economic owner and the reason to move now."),
        branch("NO FUTURE COST", "fl", "\"Honestly, nothing dramatic would happen.\"", "\"Then this may be too early to treat as active pain. What would have to change, a new market, a contractor demanding employee status, before it mattered?\"", [
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "blu")
        ], "Even six months out, no real classification or tax cost shows up.", "You still need the threshold for action or an honest downgrade.")
      ])
    ]);
  }

  function trigger() {
    return segment("trigger-and-urgency", "04", "Why now", "Find out what changed that makes this worth solving now.", true, [
      node("trigger-and-urgency", "why-now", "ri", "Find what makes this urgent now", "\"What changed recently that made global employment worth looking at now: a new country, a contractor count that doubled, an audit, or a board push to expand?\"", "Find out whether this is curiosity or a real deadline. New markets, a doubled contractor count, an audit letter, and a board mandate each carry different urgency.", true, [
        branch("REAL TRIGGER", "ok", "\"The board wants us in four new markets next quarter and we have no compliant way to hire there.\"", "\"What timeline does that create, and what breaks first, the hires, the classification calls, or the payments, if nothing changes before then?\"", [
          jumpNode("Ask what breaks first if nothing changes", "trigger-and-urgency", "consequence", "grn"),
          jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "buying-owner", "blu")
        ], "A real trigger is on the table: four new markets with no compliant way to hire.", "You still need the timeline and who owns the problem."),
        branch("EFFICIENCY PUSH", "ly", "\"It's part of a broader push to clean up how we hire globally.\"", "\"Understood. What made compliance specifically rise to the top inside that, the classification risk, the cost, or the speed?\"", [
          jumpNode("Ask what breaks first if nothing changes", "trigger-and-urgency", "consequence", "org"),
          jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "blu")
        ], "There's a global-hiring cleanup underway, but there is no urgency on classification yet.", "You still need why compliance specifically rose to the top."),
        branch("NO TRIGGER", "fl", "\"Nothing changed. We're just exploring.\"", "\"That's fine. Then what would have to happen, an audit, a reclassification claim, a new market, for this to become urgent enough to move?\"", [
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "blu")
        ], "No audit, claim, or new market is forcing the issue right now.", "You still need the future trigger or an honest no.")
      ]),
      node("trigger-and-urgency", "consequence", "va", "Ask what breaks first if nothing changes", "\"If nothing changes before that next country goes live or that audit arrives, what becomes visible first?\"", "They say it is urgent but have not named a consequence yet. Name what breaks first when the country goes live or the audit letter arrives.", false, [
        branch("VISIBLE MISS", "ok", "\"We'd either delay the expansion or hire people in a way that's not actually compliant.\"", "\"Good. Who gets measured or blamed first when that happens, legal, finance, or the People Ops sponsor?\"", [
          jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "grn"),
          jumpNode("Ask who approves this, in what order", "decision-architecture", "path", "blu")
        ], "The urgency now has a real miss: delayed expansion or non-compliant hiring.", "You still need who gets blamed and the path to respond."),
        branch("ONLY FUTURE RISK", "ly", "\"It's more of a risk building quietly as we add contractors.\"", "\"Quiet classification risk still grows. What would force it into the open, an audit, a tax notice, or a contractor demanding benefits?\"", [
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "org"),
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
        ], "The classification risk is quietly growing with every contractor, but no one sees it yet.", "You still need the event that makes the exposure undeniable."),
        branch("NO CONSEQUENCE", "fl", "\"Nothing immediate, honestly.\"", "\"Then we should treat this as early and not pretend it's urgent. What would have to change before the compliance exposure became real?\"", [
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Book a meeting only if it has a clear purpose", "next-step-lock", "soft-deferral", "blu")
        ], "There's no near-term consequence to the misclassification exposure.", "You still need the threshold for action or a clean exploratory path.")
      ]),
      node("trigger-and-urgency", "exploratory", "ri", "If the call is early", "\"If this is exploratory, let's keep it honest. What would have to become true, a real country plan, a contractor count, before this deserved a serious second meeting?\"", "There's interest but no deadline. Ask what country plan or contractor count would make this a priority, instead of forcing urgency.", false, [
        branch("THRESHOLD NAMED", "ok", "\"If we saw compliance coverage in our actual countries and clean classification on our real workers, it'd get serious.\"", "\"Good. Then let's build the test around your real countries and worker types instead of forcing urgency.\"", [
          jumpNode("Ask what they need to see", "proof-threshold", "real-proof", "grn"),
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "buying-owner", "blu")
        ], "They named what they need: coverage in their real countries and correct classification of their real workers.", "You still need the owner and the evidence check."),
        branch("OWNER MISSING", "ly", "\"It would matter once legal and finance were actually in the room.\"", "\"Then the next test is the owner path, not the platform. Who from legal or finance should be in the next call?\"", [
          jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "wrong-person", "org"),
          jumpNode("Agree who attends the next meeting and why", "next-step-lock", "exact-shape", "blu")
        ], "The blocker is getting legal and finance in the room, not urgency.", "You still need the right human and the reason for their time."),
        branch("STILL AIRY", "fl", "\"I'm not sure yet.\"", "\"Then let's keep this light and not pretend. What signal, a new market, an audit, a contractor claim, would tell you it's time to reopen this?\"", [
          jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "red"),
          jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
        ], "The call stays exploratory, with no specific country or contractor named.", "You still need a signal threshold or a clean pause.")
      ])
    ]);
  }

  function stakeholder() {
    return segment("stakeholder-and-ownership", "05", "Who's involved", "Find out who feels the problem, who owns it, and who approves.", false, [
      node("stakeholder-and-ownership", "pain-owner", "pr", "Ask who carries the compliance risk", "\"Who feels the compliance pain most directly today, and who gets pulled in whenever a classification call or a new country comes up?\"", "Tie the misclassification risk to a real person, not a department. Someone's name is on the contractors that might fail an audit.", true, [
        branch("OWNER CLEAR", "ok", "\"People Ops owns global hiring, but legal gets dragged into every classification call.\"", "\"Who else can slow this down even if People Ops wants it fixed, finance on the cost, or legal on the risk?\"", [
          jumpNode("Ask who owns the budget", "stakeholder-and-ownership", "buying-owner", "grn"),
          jumpNode("Ask who approves this, in what order", "decision-architecture", "path", "blu")
        ], "People Ops owns hiring, legal carries every classification call.", "You still need the blocker or gatekeeper."),
        branch("SHARED OWNERSHIP", "ly", "\"People Ops, finance, and legal all touch it, so ownership is shared.\"", "\"Shared usually means someone feels it more than everyone else. Who's the one carrying the misclassification risk in practice?\"", [
          jumpNode("Ask who owns the purchase", "stakeholder-and-ownership", "buying-owner", "org"),
          jumpNode("Ask for the right owner", "stakeholder-and-ownership", "wrong-person", "blu")
        ], "Ownership is spread across People Ops, finance, and legal.", "You still need the one person with personal exposure if a worker gets reclassified."),
        branch("NO OWNER", "fl", "\"Nobody really owns it cleanly, it's everyone's side job.\"", "\"That's important. If nobody owns the compliance, who gets blamed first if a worker gets reclassified or a country goes wrong?\"", [
          jumpNode("Ask for the right owner", "stakeholder-and-ownership", "wrong-person", "red"),
          jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "consequence", "blu")
        ], "Global compliance is everyone's side job and no one's mandate.", "You still need who gets blamed for a reclassification or the sponsor.")
      ]),
      node("stakeholder-and-ownership", "buying-owner", "fu", "Find who owns the budget", "\"Who would own the change or the budget if this got real, People Ops, Finance, or Legal?\"", "Pain owner and budget owner aren't always the same. Find who would actually sign for an EOR or compliance platform.", false, [
        branch("BUYER CLEAR", "ok", "\"People Ops would sponsor it, but Finance, Legal, and Compliance all matter.\"", "\"Which of them has to feel safe first, Legal on classification, or Finance on the permanent-establishment and tax exposure, before the others matter?\"", [
          jumpNode("Ask what they need to see to trust it", "proof-threshold", "first-gate", "grn"),
          jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "blu")
        ], "People Ops sponsors it; Finance, Legal, and Compliance all have to approve it.", "You still need who has to feel safe first and the stall point."),
        branch("BUYER FOGGY", "ly", "\"We'd need a few people once this got more real.\"", "\"Which two matter first if this stops being theoretical, the People Ops sponsor and the Legal owner on classification?\"", [
          jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "org"),
          jumpNode("Ask for the right owner", "stakeholder-and-ownership", "wrong-person", "blu")
        ], "They're hiding behind committee language on who would buy.", "You still need the first two real humans: the sponsor and the classification owner."),
        branch("SYSTEMS FIRST", "fl", "\"Finance or payroll systems would own most of it anyway.\"", "\"Understood. Who still has to care enough about the classification risk to justify that work, Legal or the People Ops sponsor?\"", [
          jumpNode("Go back to who feels this problem most", "stakeholder-and-ownership", "pain-owner", "red"),
          jumpNode("Ask what they need to see to trust it", "proof-threshold", "first-gate", "blu")
        ], "They're framing this as a payroll-systems decision, not a compliance one.", "You still need the sponsor who makes the classification work worth doing.")
      ]),
      node("stakeholder-and-ownership", "wrong-person", "ri", "If this is the wrong person", "\"If you're not the main owner, who should be in the next conversation, People Ops, Finance, or Legal, so this becomes real instead of informational?\"", "Use when the buyer can't map the hire-to-pay flow or sign for anything. Route to whoever owns global compliance.", false, [
        branch("RIGHT PERSON NAMED", "ok", "\"The right follow-up should include our Head of People and someone from Legal.\"", "\"Good. What would make them say yes to the time, the classification exposure, the expansion timeline, or the audit risk?\"", [
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "blu")
        ], "The path runs to the Head of People plus a Legal owner.", "You still need what makes the classification exposure worth their time."),
        branch("MAYBE OWNER", "ly", "\"I think it'd be someone in People Ops.\"", "\"That's enough to start. What would matter most to them if we brought them in, speed to hire, or staying out of a misclassification claim?\"", [
          jumpNode("Ask what they need to see", "proof-threshold", "real-proof", "org"),
          jumpNode("Book the next meeting", "next-step-lock", "exact-shape", "blu")
        ], "There's a likely People Ops owner but not a confident one.", "You still need whether speed-to-hire or audit risk moves that person."),
        branch("NO IDEA", "fl", "\"I don't know who'd own it yet.\"", "\"Then we shouldn't fake a next step. What facts, like how many contractors in how many countries, would we need before involving more people?\"", [
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "blu")
        ], "No one owns global compliance yet, even informally.", "You still need the contractor-and-country count or a clean pause.")
      ])
    ]);
  }

  function proof() {
    return segment("proof-threshold", "06", "What they need to see", "Agree on what they would need to see to believe it works.", false, [
      node("proof-threshold", "real-proof", "va", "Name what they need to see", "\"Before this could move, what would your team need to see to trust it: compliance coverage in your actual countries, classification accuracy on your real workers, and reliable contractor payments?\"", "Before any demo or pricing, agree what they need to see in their own countries: coverage there, correct classification of their workers, and payments that arrive.", true, [
        branch("EVIDENCE NAMED", "ok", "\"We'd need to know these contractors would survive a classification audit in the countries they actually work in.\"", "\"Good. Which part of that has to be shown first, the classification calls, or the per-country compliance coverage, so the rest of the review matters?\"", [
          jumpNode("Ask which approval comes first", "proof-threshold", "first-gate", "grn"),
          jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "blu")
        ], "What they need to see is named: contractors that survive a classification audit in their real countries.", "You still need the first gate and the sign-off owner."),
        branch("EVIDENCE IS GENERIC", "ly", "\"A demo and some examples would help.\"", "\"Happy to. What exactly would that need to prove, that it covers your actual countries and worker types end to end, so it changes the decision instead of just creating interest?\"", [
          jumpNode("Ask which approval comes first", "proof-threshold", "first-gate", "org"),
          jumpNode("Handle an early demo request", "proof-threshold", "early-demo", "blu")
        ], "They want a demo, but what they need to see isn't tied to their countries yet.", "You still need the hidden concern behind the request."),
        branch("EVIDENCE ASK TOO EARLY", "fl", "\"We're not ready to test anything yet.\"", "\"That's fine. Then let's stay with the exposure, the countries and the contractor count, until it is clear enough to test anything.\"", [
          jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "red"),
          jumpNode("Go back to what made this urgent", "trigger-and-urgency", "why-now", "blu")
        ], "The classification exposure isn't specific enough to justify a test yet.", "You still need stronger pain or urgency.")
      ]),
      node("proof-threshold", "first-gate", "pr", "Ask which approval comes first", "\"Which approval comes first here: compliance fit in your real countries, Legal's comfort on classification and IP, Finance's read on permanent-establishment and tax exposure, or internal politics?\"", "They've said what they need to see; now find which approval comes first: coverage, Legal's comfort with classification, Finance's view on permanent-establishment risk, or internal politics.", false, [
        branch("WORKFLOW FIRST", "ok", "\"We need to see it actually handle our real countries and worker mix first.\"", "\"Great. Which country or contractor population should that evidence focus on so the team trusts the result?\"", [
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Ask what would make switching painful", "current-vendor-and-displacement", "migration", "blu")
        ], "Compliance coverage in their real countries is the first thing they need to see.", "You still need the exact country and the sign-off person."),
        branch("TECHNICAL FIRST", "ly", "\"Legal or Compliance would need comfort on the classification calls first.\"", "\"Good. What would they need to believe first: the classification model, the IP assignment across borders, data residency, or the audit trail?\"", [
          jumpNode("Ask who approves this, in what order", "decision-architecture", "gates", "org"),
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
        ], "Legal or Compliance has to be comfortable with classification first.", "You still need the exact concern, classification model, IP, or data residency, and its owner."),
        branch("POLITICAL FIRST", "fl", "\"Honestly, leadership needs to believe the exposure is real before any test.\"", "\"Then the first thing they need to see is still the exposure, the classification risk and the country footprint, not the platform.\"", [
          jumpNode("Go back to the problem", "pain-and-consequence", "quantify", "red"),
          jumpNode("Go back to what made this urgent", "trigger-and-urgency", "consequence", "blu")
        ], "Leadership doesn't yet believe the misclassification exposure is real.", "You still need the business case that justifies a test.")
      ]),
      node("proof-threshold", "early-demo", "ri", "If they ask for demo early", "\"I can show the platform. First tell me what concern it needs to settle, a specific country, a worker type, the permanent-establishment piece, so I don't show the wrong thing.\"", "Don't tour a generic EOR platform. Make them name the jurisdiction or worker type the demo has to settle.", false, [
        branch("CONCERN NAMED", "ok", "\"We'd need to see it handle our trickiest country and confirm the contractors wouldn't be reclassified there.\"", "\"Good. Then let's build the demo around that country and the Legal owner who'd judge the classification call.\"", [
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Ask which approval comes first", "proof-threshold", "first-gate", "blu")
        ], "The hidden concern is a specific tricky jurisdiction and its reclassification risk.", "You still need the country owner and the exact worker type."),
        branch("DEMO AS STALL", "ly", "\"We just want to understand what it looks like.\"", "\"Fair. Then I want one country or contractor population first, so the tour shows something real.\"", [
          jumpNode("Ask them to walk through how it works today", "current-state-truth", "workflow", "org"),
          jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "blu")
        ], "The demo request is a way to delay, not tied to a real country.", "You still need the real country that would make the demo useful."),
        branch("NO CONCERN", "fl", "\"No specific concern. We just like to see the product.\"", "\"Then we should stay in the actual hiring workflow until the concern is real, otherwise the next step won't have a clear purpose.\"", [
          jumpNode("Go back to what made this urgent", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ], "There's no classification or country concern driving the demo ask.", "You still need a reason to show anything.")
      ])
    ]);
  }

  function vendor() {
    return segment("current-vendor-and-displacement", "07", "Current vendor", "Find out what they use today and why it has lasted.", false, [
      node("current-vendor-and-displacement", "incumbent", "fu", "Ask what tools and providers they use today", "\"What are you using today, Deel, Remote, local EORs, your own entities, and what still keeps that path winning even with the exposure you named?\"", "Don't pretend Deel or their own entities are weak just because pain exists. Find what their current provider still does well, and where it leaves gaps.", false, [
        branch("INCUMBENT DEFENSE", "ok", "\"We're on Deel for some countries and it mostly works.\"", "\"Good. Which countries and worker types does it actually cover end to end, and where do you still fall back to local providers, and what upside would make changing that worth it?\"", [
          jumpNode("Ask what would make switching painful", "current-vendor-and-displacement", "migration", "grn"),
          jumpNode("Agree what they need to see", "proof-threshold", "first-gate", "blu")
        ], "Deel covers some countries and mostly works for them.", "You still need the coverage gaps and what upside would justify a switch."),
        branch("PATCHWORK STATUS QUO", "ly", "\"It's a mix of contractor payments, a couple of local providers, and spreadsheets, but it works well enough.\"", "\"Which part feels good enough, and which part still pulls Legal and Finance back in every time, the classification, or the per-country compliance?\"", [
          jumpNode("Ask what their own build does and doesn't do", "current-vendor-and-displacement", "build", "org"),
          jumpNode("Go back to the problem", "pain-and-consequence", "quantify", "blu")
        ], "Today is a patchwork of contractor payments, local providers, and spreadsheets.", "You still need the branch that keeps pulling Legal and Finance back in."),
        branch("NO REAL STATUS QUO", "fl", "\"It's mostly Legal and Finance doing it by hand per country.\"", "\"Then what they need to see is operational. What manual compliance work disappears, and how much exposure shrinks, if this actually gets solved?\"", [
          jumpNode("Go back to the problem", "pain-and-consequence", "quantify", "red"),
          jumpNode("Ask who approves this, in what order", "decision-architecture", "path", "blu")
        ], "There's no real current tool, just Legal and Finance doing it by hand in each country.", "You still need the manual compliance work that would disappear.")
      ]),
      node("current-vendor-and-displacement", "build", "ri", "If they run their own entities", "\"What part of your own setup, your own entities or in-house Legal plus spreadsheets, works, and what part is still expensive enough that this meeting happened anyway?\"", "When they defend running their own entities, separate what their in-house setup actually solves from the part that still hurts every new market.", false, [
        branch("UNSOLVED BRANCH", "ok", "\"We set up our own entity in two countries, but every new market still starts from scratch.\"", "\"Good. Then which part still refuses to stay solved, the entity setup, the classification calls, or the local payroll, and what does it cost?\"", [
          jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "grn"),
          jumpNode("Ask what would make switching painful", "current-vendor-and-displacement", "migration", "blu")
        ], "Their own entities work in two countries; every new market restarts from scratch.", "You still need the stubborn branch, entity setup, classification, or payroll, and its cost."),
        branch("BUILD IS GOOD ENOUGH", "ly", "\"Our own entities mostly work. We're just curious what else is possible.\"", "\"Then they expect a lot. What would have to improve, faster country setup, lower classification risk, to justify any change at all?\"", [
          jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "org"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ], "Their own entities work well enough for now.", "You still need the threshold, faster setup or lower classification risk, that would justify change."),
        branch("BUILD PRIDE", "fl", "\"We'd rather set up our own entities than use an EOR.\"", "\"That may be right where you have scale. What would have to break, a new market that's too slow, or a classification claim, before that preference changed?\"", [
          jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "red"),
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "blu")
        ], "They'd rather own entities than use an EOR, on principle.", "You still need the break condition, a too-slow market or a claim, that reopens it.")
      ]),
      node("current-vendor-and-displacement", "migration", "pr", "Ask what would make switching painful", "\"What would make moving off Deel, your local providers, or your own entities feel too painful unless the upside, cleaner classification and real country coverage, was obvious?\"", "Moving contractors and payroll between platforms is real work. Find the smallest starting point that would be worth that effort.", false, [
        branch("MIGRATION RISK CLEAR", "ok", "\"Moving contractors and payroll between platforms is real pain, but so is the manual compliance.\"", "\"Then let's shape the next step around the smallest test, one country or one risky contractor group, that could outweigh that pain.\"", [
          jumpNode("Ask which approval comes first", "proof-threshold", "first-gate", "grn"),
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
        ], "They said what moving contractors and payroll would cost, and how much compliance work is manual.", "You still need the smallest credible beachhead to prove against."),
        branch("RIP AND REPLACE OFF TABLE", "ly", "\"We're not looking to move everyone off what we have.\"", "\"That's fine. What one country or one contractor population would still matter if it worked, the riskiest one?\"", [
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "org"),
          jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "blu")
        ], "Full replacement is off the table; a single risky country is the realistic path.", "You still need the beachhead country or worker type."),
        branch("NOT WORTH MOVING", "fl", "\"Nothing here feels painful enough to justify a migration.\"", "\"Then we should treat that honestly. What would have to change, a new market, an audit, before moving became rational?\"", [
          jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ], "No country hurts enough to justify the migration cost yet.", "You still need the new market or audit that would justify a move.")
      ])
    ]);
  }

  function decision() {
    return segment("decision-architecture", "08", "How they'll decide", "Find out who signs off and in what order.", true, [
      node("decision-architecture", "path", "pr", "Ask who approves this, in what order", "\"If this became real, what would the decision path look like after this meeting, People Ops sponsoring, Legal on classification, Finance on tax exposure?\"", "Once you know the problem, the owner, and what they need to see, ask who signs off: People Ops sponsoring, Legal approving classification and IP, Finance approving permanent-establishment and tax.", true, [
        branch("PATH VISIBLE", "ok", "\"People Ops would sponsor, Legal would sign off on classification and IP, and Finance would check the permanent-establishment and tax exposure.\"", "\"Who can stall that path even if People Ops wants to move, Legal on a classification concern, or Finance on cost?\"", [
          jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "grn"),
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
        ], "You know who signs off: People Ops sponsors, Legal approves classification and IP, Finance approves permanent-establishment and tax.", "You still need the stall point and the first concrete gate."),
        branch("PATH FOGGY", "ly", "\"We'd probably pull in Legal and Finance after this.\"", "\"Which two people actually matter first once this stops being exploratory, the Legal owner on classification and the Finance owner on exposure?\"", [
          jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "org"),
          jumpNode("Go back to who owns the budget", "stakeholder-and-ownership", "buying-owner", "blu")
        ], "They're describing a committee cloud, not named approvers.", "You still need the first two real gates: the Legal classification owner and the Finance exposure owner."),
        branch("PATH UNKNOWN", "fl", "\"I don't really know how this would get approved yet.\"", "\"That's useful. Which internal approvals would a change like this require, such as Legal review of classification or Finance review of tax implications?\"", [
          jumpNode("Ask what usually slows these decisions", "decision-architecture", "stall", "red"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ], "How a global-compliance change gets approved here is unmapped.", "You still need the process knower or the likely sequence.")
      ]),
      node("decision-architecture", "gates", "fu", "Ask which two approvals come first", "\"Which two approvals matter first if this gets serious: People Ops sponsor approval, Legal sign-off on classification and IP, Finance on permanent-establishment and tax, security, or procurement?\"", "Skip the general approval process. Find the first two approvals that actually hold up an EOR or compliance decision here.", false, [
        branch("GATES CLEAR", "ok", "\"The first two are Legal on classification and Finance on the tax exposure, and we know who owns each.\"", "\"Good. Then the next meeting should be shaped around getting Legal's approval on classification, not impressing the whole committee.\"", [
          jumpNode("Agree who attends the next meeting and why", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Go back to what they need to see", "proof-threshold", "first-gate", "blu")
        ], "The first two approvals are named: Legal on classification, Finance on tax, each with an owner.", "You still need the meeting that clears the Legal gate first."),
        branch("SECURITY EARLY", "ly", "\"Anything touching worker data brings in Legal and security quickly, GDPR and data residency.\"", "\"What would the People Ops sponsor need to believe before that Legal and security time is worth spending?\"", [
          jumpNode("Go back to what they need to see", "proof-threshold", "first-gate", "org"),
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
        ], "Worker data pulls Legal and security in early on GDPR and data residency.", "You still need the business case that gets it through that data-and-compliance gate."),
        branch("PROCUREMENT LATE", "fl", "\"Procurement matters later, but not yet.\"", "\"Good. Then who actually decides whether this deserves a deeper compliance review before procurement ever shows up, the People Ops sponsor or Legal?\"", [
          jumpNode("Go back to who owns the budget", "stakeholder-and-ownership", "buying-owner", "red"),
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
        ], "Procurement comes late; it is not the real early blocker.", "You still need the true early decider on the compliance review.")
      ]),
      node("decision-architecture", "stall", "ri", "Find where deals stall", "\"What usually slows decisions like this down even when everyone sounds interested, a Legal classification concern, a Finance worry about permanent-establishment tax exposure, or no clear owner?\"", "A path to a decision can sound likely and still stall. Find what would most likely stop it: a Legal classification concern, a Finance worry about permanent-establishment tax, or no owner.", false, [
        branch("STALL NAMED", "ok", "\"The People Ops sponsor isn't enough; Legal usually slows it with a classification or IP question.\"", "\"Good. Then the next step has to address Legal's classification concern directly instead of hoping it disappears.\"", [
          jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Go back to what they need to see", "proof-threshold", "first-gate", "blu")
        ], "It usually stalls on a Legal classification or IP question, sponsor or not.", "You still need the next meeting shaped around that classification gate."),
        branch("STALL IS OWNER", "ly", "\"It usually stalls because nobody really owns global compliance.\"", "\"Then the next step is owner quality before anything else. Who, People Ops or Legal, has to feel the exposure enough to keep it alive?\"", [
          jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "pain-owner", "org"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ], "It stalls because no one truly owns global compliance.", "You still need the person who feels the exposure enough to keep it alive."),
        branch("STALL UNKNOWN", "fl", "\"Hard to say. It varies.\"", "\"Then we can't assume there's a clear path yet. What's your best guess on where it would stall first: Legal, Finance, or no owner?\"", [
          jumpNode("Go back to who approves this", "decision-architecture", "path", "red"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ], "They can't say where a compliance decision usually stalls.", "You still need the most likely failure point: Legal, Finance, or no owner.")
      ])
    ]);
  }

  function nextStep() {
    return segment("next-step-lock", "09", "Next step", "Leave with a dated meeting and a named owner.", true, [
      node("next-step-lock", "real-meeting", "cl", "Book a review meeting", "\"What's the next review worth taking now, and what has to be true for it to count, the right country, the right owner from Legal or Finance?\"", "The call justified a follow-up. Make it count: the right country to test, the right Legal or Finance owner in the room.", true, [
        branch("REAL REVIEW", "ok", "\"Let's get People Ops and Legal in to test our riskiest country next week.\"", "\"Good. What must that session settle, whether those contractors survive a classification audit there, so it moves the deal instead of just updating it?\"", [
          jumpNode("Agree who attends the next meeting and why", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "blu")
        ], "They'll bring People Ops and Legal to test the riskiest country.", "You still need the purpose, the date, and the right people."),
        branch("EMAIL INSTEAD", "ly", "\"Send something over and we'll circle back.\"", "\"Happy to send the right thing. What should that summary help your team decide, which country to test, so the next meeting is real?\"", [
          jumpNode("Ask what would make this worth a meeting", "next-step-lock", "soft-deferral", "org"),
          jumpNode("Clarify what they need to see", "proof-threshold", "real-proof", "blu")
        ], "They want a send-and-circle-back instead of a committed review.", "You still need the classification or country decision the email is supposed to open up."),
        branch("NOT READY", "fl", "\"We're not ready for a next meeting yet.\"", "\"Understood. What's still missing: the owner from Legal or Finance, evidence on a real country, timing, or internal alignment?\"", [
          jumpNode("Ask what would make this worth a meeting", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "blu")
        ], "The call hasn't justified a committed review yet.", "You still need the missing piece, owner, country evidence, or timing, in plain language.")
      ]),
      node("next-step-lock", "exact-shape", "fu", "Agree who attends the next meeting and why", "\"Who needs to be there, which country or contractor population should the meeting test, and what decision should come out of it?\"", "Turn a vague follow-up into a working session: the right people, one country to test, one classification decision to drive.", false, [
        branch("MEETING SHAPED", "ok", "\"We know the people, the country to test, and the classification decision the meeting should drive.\"", "\"Good. Then let's put a date on it while the expansion deadline is still fresh.\"", [
          jumpSegment("Go to After the call", "post-call-routing", "grn"),
          jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
        ], "People, country to test, and the classification decision are all set.", "You still need the date or the calendar owner."),
        branch("WRONG PEOPLE", "ly", "\"We're still not sure if Legal or Finance should be in it.\"", "\"Then the first goal is to get the People Ops sponsor and the Legal classification owner into the same room, not to over-design the agenda.\"", [
          jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "wrong-person", "org"),
          jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "blu")
        ], "The meeting is real in principle but the right Legal and Finance owners aren't pinned.", "You still need the People Ops sponsor and the Legal classification owner in the room."),
        branch("NO DATE", "fl", "\"It makes sense, but we're not ready to calendar it yet.\"", "\"That's useful. What still has to become true, a country plan, a Legal owner, before a date would feel responsible?\"", [
          jumpNode("Ask what would make this worth a meeting", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "blu")
        ], "The review is plausible but uncommitted to a date.", "You still need the country plan or Legal owner that makes a date responsible.")
      ]),
      node("next-step-lock", "soft-deferral", "ri", "If they won't commit to a next step", "\"If we don't calendar the next step now, what exactly needs to become true, a new country going live, a contractor scare, before this reopens?\"", "When they default to polite follow-up, name the exact event, a market going live or a classification scare, that reopens this.", false, [
        branch("CONDITION NAMED", "ok", "\"We know what has to become true first, the board confirms the new markets.\"", "\"Good. Then let's write that down clearly so the next conversation is more specific, not a repeat.\"", [
          jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "grn"),
          jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
        ], "They named what would bring this back: the board confirming the new markets.", "You still need who owns that condition."),
        branch("CONDITION IS OWNER", "ly", "\"We need Legal and Finance in the room first.\"", "\"Then the next step is owner capture, not more product. Who's missing, the Legal classification owner or the Finance exposure owner?\"", [
          jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "wrong-person", "org"),
          jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "blu")
        ], "The blocker is getting Legal and Finance in the room.", "You still need the missing owner and why their time is worth it."),
        branch("CONDITION STILL UNKNOWN", "fl", "\"I can't really say yet.\"", "\"Then let's stay honest and write down exactly what we still don't know — the countries, the owner, the exposure — before we pretend this is moving.\"", [
          jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
          jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
        ], "They haven't said what would bring this back.", "You still need the missing detail (countries, owner, or exposure) in plain language.")
      ])
    ]);
  }

  function post() {
    return segment("post-call-routing", "10", "After the call", "Record what you learned and decide where it goes next.", false, [
      node("post-call-routing", "handoff", "cl", "Write notes for whoever picks this up", "\"If someone new picked this deal up tomorrow, what would they need to know in the first 30 seconds, the country footprint, the classification risk, the owner, what they need to see?\"", "Sum up the call so someone new could pick it up: the countries, the classification risk, the owner, and what they need to see.", false, [
        branch("HANDOFF CLEAN", "ok", "\"People Ops sponsors, Legal has to approve classification, the riskiest country is the test, and the board push sets the deadline.\"", "\"Good. Keep only the owner, the classification risk, what they need to see, and what the next step depends on.\"", [
          jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "grn"),
          jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
        ], "You have the sponsor, the Legal approval on classification, the riskiest country to test, and the board deadline.", "You still need the one open question to chase."),
        branch("HANDOFF NOISY", "ly", "\"We've got the notes, but they're messy.\"", "\"Then throw away what doesn't change the next step. What's actually usable, the country, the owner, the exposure?\"", [
          jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "org"),
          jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
        ], "The notes exist but bury the country, owner, and classification exposure in noise.", "You still need a short summary and where it goes next."),
        branch("NO HANDOFF HABIT", "fl", "\"We don't document these calls consistently.\"", "\"Then the first fix is discipline. What must be captured every time, the country footprint and the classification risk, before the call disappears?\"", [
          jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
          jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
        ], "They don't capture these compliance calls consistently.", "You still need the minimum every-time rule: country footprint plus classification risk.")
      ]),
      node("post-call-routing", "missing-truth", "fu", "Note what you still need to find out", "\"What's still missing that the next step has to find out directly, the real country count, the classification owner, or the audit risk?\"", "Give whoever picks this up one open question, not just a summary: the country count, the classification owner, or the audit risk.", false, [
        branch("MISSING TRUTH CLEAR", "ok", "\"We know the open question, whether those contractors survive an audit, and who from Legal has to confirm it.\"", "\"Good. Then the handoff is specific enough to move.\"", [
          jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "grn"),
          action("Set the next meeting", "segment:next-step-lock", "blu")
        ], "The open question is clear: whether the contractors would pass an audit, and who in Legal confirms it.", "You still need to pick where this goes next and who owns it."),
        branch("MISSING OWNER", "ly", "\"We know the classification risk, but not who in Legal can confirm it.\"", "\"Then the next step must start by getting the right Legal or Compliance owner involved.\"", [
          action("Set the next meeting", "segment:next-step-lock", "org"),
          jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
        ], "The classification risk is known but no Legal owner can confirm it.", "You still need the route that best finds that Legal or Compliance owner."),
        branch("MOST DETAILS MISSING", "fl", "\"We still don't know too much.\"", "\"Then the next step should be the one most likely to get this back on track, instead of pretending the compliance picture is clearer than it is.\"", [
          jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
          action("Set the next meeting", "segment:next-step-lock", "blu")
        ], "We know too little about compliance to call it clean.", "You still need the most useful first correction.")
      ]),
      node("post-call-routing", "room-route", "pr", "Choose where this goes after the call", "\"Where should this go next: shaping a tighter compliance review, attaching the classification risk to a live deal, or noting the most likely reason it could fail before it's forgotten?\"", "Choose where this goes based on what happened: a more focused compliance review, the classification risk added to a live deal, or a risk noted before it is forgotten.", false, [
        branch("NEXT MEETING", "ok", "\"The next step is a more focused conversation with Legal and a clearer country to test.\"", "\"Then set the next meeting and bring the owner, the classification evidence they need, and what is still unknown.\"", [
          action("Set the next meeting", "segment:next-step-lock", "grn"),
          jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
        ], "The next step is a more focused Legal conversation on a specific country.", "You still need the open question for that review."),
        branch("DEAL WORKSPACE", "ly", "\"There's already a live deal or evaluation here.\"", "\"Then attach the classification risk and country footprint to the deal immediately so it doesn't get separated from the opportunity.\"", [
          jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
          jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
        ], "There's a live deal, so the classification risk and country footprint belong on it.", "You still need the most important risk to carry with it."),
        branch("FUTURE AUTOPSY", "fl", "\"This feels like it will stall: lots of interest, no real owner or risk.\"", "\"Then route it to Future Autopsy now and note the most likely reason it could fail — weak urgency or no compliance owner — before the deal goes quiet.\"", [
          jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
          action("Set the next meeting", "segment:next-step-lock", "blu")
        ], "This is likely to stall: interest, but no real compliance owner or risk.", "You still need the failure pattern in plain language.")
      ])
    ]);
  }

  var base = rt.frameworks["global-contractor-management"];

  rt.frameworks["global-contractor-management"] = Object.assign({}, base, {
    segments: [
      opening(),
      current(),
      pain(),
      trigger(),
      stakeholder(),
      proof(),
      vendor(),
      decision(),
      nextStep(),
      post()
    ],
    interrupts: [
      {
        id: "just-contractors",
        label: "We just use contractors, classification is not our problem",
        reply:
          "That is exactly where the risk hides. How confident are you those contractors would not be reclassified as employees in an audit, in the countries where they actually work?",
        actions: [
          jumpNode("Ask what a misclassified worker costs", "pain-and-consequence", "quantify", "org"),
          jumpNode("Ask them to walk through how it works today", "current-state-truth", "workflow", "blu")
        ]
      },
      {
        id: "already-on-deel",
        label: "We already use Deel / Remote",
        reply:
          "Good. Which countries and worker types does it actually cover end to end, and where do you still fall back to local providers or spreadsheets?",
        actions: [
          jumpNode("Ask what their current setup does well", "current-vendor-and-displacement", "build", "red"),
          jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "blu")
        ]
      },
      {
        id: "legal-handles-it",
        label: "Legal already handles compliance",
        reply:
          "By hand, per jurisdiction? What happens when you enter the next country, or the contractor count doubles, and that manual review cannot keep pace?",
        actions: [
          jumpNode("Ask who should be in the next conversation", "stakeholder-and-ownership", "wrong-person", "red"),
          jumpNode("Ask who approves this, in what order", "decision-architecture", "path", "blu")
        ]
      },
      {
        id: "price-per-worker",
        label: "Just tell me the price per worker",
        reply:
          "Price depends on your countries and classification risk, not a flat per-seat fee. Which country or worker type carries the most exposure — that is the one worth pricing honestly first.",
        actions: [
          jumpNode("Ask who approves this, in what order", "decision-architecture", "path", "blu"),
          jumpNode("Agree what they need to see", "proof-threshold", "real-proof", "pur")
        ]
      },
      {
        id: "not-expanding",
        label: "We are not expanding right now",
        reply:
          "Misclassification risk does not wait for expansion — it accrues on the contractors you already pay. How many are there, in how many countries, classified by whom?",
        actions: [
          jumpNode("Ask what the current risk costs", "pain-and-consequence", "pressure", "org"),
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
        ]
      }
    ]
  });
})();
