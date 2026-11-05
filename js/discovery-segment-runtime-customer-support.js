(function () {
  // CX AI override — discovery-segment-runtime-customer-support.js
  //
  // This file fully tailors the 10 discovery segments to the CX AI /
  // Customer Experience & Support domain (momos / yoobic / Decagon /
  // Sierra / Intercom Fin / Zendesk AI world). The structural skeleton
  // mirrors the base runtime exactly — same segmentIds, slugs, tones,
  // essential flags, branch classes, and jump targets — but every
  // human-readable English string is rewritten in CX-AI voice:
  // tickets / queues / deflection / containment / CSAT / AHT, the worst
  // queue, supervisor rescue, hallucination risk on policy and refunds.
  //
  // The 5 CX-AI interrupts are preserved verbatim.

  var rt = window.DISCOVERY_SEGMENT_RUNTIME;
  if (!rt || !rt.frameworks || !rt.frameworks["customer-support"]) return;

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

  var base = rt.frameworks["customer-support"];

  rt.frameworks["customer-support"] = Object.assign({}, base, {
    segments: [
      // 01 — Opening
      segment("opening-frame", "01", "Opening", "Ask permission to understand their world before you show anything.", true, [
        node("opening-frame", "primary", "pr", "Start with what the bot can't resolve",
          "\"Most support leaders I talk to have a bot deflecting plenty of tickets, but the expensive contacts still bounce to a person. I want to find where that line is for you before I pitch anything.\"",
          "Open by separating deflection from real resolution before you pitch anything.", true, [
          branch("CONFIRMS", "ok",
            "\"Yeah, the easy stuff is handled. It's the refunds and policy edge cases that still land on an agent.\"",
            "\"That's the part worth mapping. Walk me through what happens to one of those tickets from the moment it lands.\"", [
            jumpNode("Walk through one support contact", "current-state-truth", "workflow", "blu"),
            jumpNode("Ask where it hurts most today", "pain-and-consequence", "pressure", "grn")
          ], "They acknowledged the expensive queue still needs a human.",
            "You still need the exact queue and what forces the handoff to a person."),
          branch("BROAD", "ly",
            "\"We have a pretty standard support stack — Zendesk, a bot on top.\"",
            "\"Standard is fine. Walk me through where the bot stops and an agent has to take over the ticket.\"", [
            jumpNode("Walk through the queue", "current-state-truth", "workflow", "org"),
            jumpNode("Ask for a recent ticket", "current-state-truth", "example", "blu")
          ], "The buyer described their tools, not what is actually happening.",
            "You still need a recent ticket or the point where an agent takes over."),
          branch("PUSHBACK", "fl",
            "\"Can you just show me the resolution rate?\"",
            "\"I can, but the number that matters is the one off your worst queue. Give me one ticket type that keeps bouncing to humans so it's not a generic demo.\"", [
            jumpNode("Walk through the queue", "current-state-truth", "workflow", "blu"),
            jumpNode("Ask what evidence they need", "proof-threshold", "early-demo", "pur")
          ], "The buyer has asked to see the product before describing the workflow.",
            "You still need one concrete queue before showing anything.")
        ]),
        node("opening-frame", "workflow", "fu", "Walk through one support contact",
          "\"Before we go anywhere, walk me through one support contact from the moment it lands in the queue to the moment a human has to step in.\"",
          "Use this when they sound close to the queue and ready to trace one contact end to end.", false, [
          branch("CONCRETE", "ok",
            "\"It hits triage, the bot tries to deflect it, and if it can't, it routes to a tier-1 agent and sometimes escalates to a supervisor.\"",
            "\"Good. Which step in that chain burns the most agent time or drops CSAT the hardest?\"", [
            jumpNode("Ask what the problem costs them", "pain-and-consequence", "pressure", "grn"),
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "why-now", "blu")
          ], "You can see the triage-to-escalation path now.",
            "You still need the step that burns agent time or drops CSAT, not just the routing."),
          branch("MIXED", "ly",
            "\"It depends on the channel and the queue.\"",
            "\"That's fine. Pick the one queue leadership would care most about if CSAT tanked on it tomorrow.\"", [
            jumpNode("Ask for a recent ticket", "current-state-truth", "example", "org"),
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "blu")
          ], "Support is spread across channels and queues.",
            "You still need one queue to anchor the call."),
          branch("TOO HIGH LEVEL", "fl",
            "\"I'm not close enough to the queue to map it that tightly.\"",
            "\"No problem. What's the most common complaint you hear from agents or customers when support breaks down?\"", [
            jumpNode("Ask about the pain", "pain-and-consequence", "pressure", "red"),
            jumpNode("Ask who owns it", "stakeholder-and-ownership", "wrong-person", "blu")
          ], "This person sits too far from the queue to trace it.",
            "You need either a recurring complaint pattern or someone closer to the queue.")
        ]),
        node("opening-frame", "sideways", "ri", "If the call starts off-topic",
          "\"If this is early or exploratory, that's fine. What made you take this meeting now instead of later?\"",
          "Use this when the support leader is rushed, skeptical, or staying abstract.", false, [
          branch("REAL REASON", "ok",
            "\"Volume spiked after our last launch and the queue backlog got ugly.\"",
            "\"Good. Then let's follow that backlog instead of talking in generalities.\"", [
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "why-now", "grn"),
            jumpNode("Ask them to walk through how it works today", "current-state-truth", "workflow", "blu")
          ], "A real event — a volume spike or backlog — put this meeting on the calendar.",
            "You still need to see whether that backlog is urgent enough to move."),
          branch("SOFT REASON", "ly",
            "\"We're mostly staying informed on what AI support can do right now.\"",
            "\"That's fine. What would have to become true for this to stop being informative and start being a priority?\"", [
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "org"),
            jumpNode("Ask what they need to see", "proof-threshold", "real-proof", "pur")
          ], "They're scanning what AI support can do, not feeling a real backlog problem yet.",
            "You still need the threshold that would turn interest into action."),
          branch("NO REASON", "fl",
            "\"Nothing changed. We're just looking around.\"",
            "\"Understood. Then I'll keep this honest and light. What queue would have to break before this became a real priority?\"", [
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Ask what would make this a priority", "next-step-lock", "soft-deferral", "blu")
          ], "No queue has broken hard enough to force a decision yet.",
            "You still need the future trigger or a reason not to chase this hard.")
        ])
      ]),

      // 02 — How they work today
      segment("current-state-truth", "02", "How they work today", "Ask them to walk you through how a customer request moves through the queue today.", true, [
        node("current-state-truth", "workflow", "fu", "Walk through one support contact",
          "\"Walk me through one support contact from the first touch to the point where a person has to step in and fix it.\"",
          "Once they respond to the opener, follow one contact to the point where a supervisor has to step in.", true, [
          branch("WORKFLOW CLEAR", "ok",
            "\"Contact comes in, gets triaged, the bot tries deflection, then tier-1 picks up, and the hard ones escalate to a supervisor.\"",
            "\"Good. Which of those escalations costs you the most — the supervisor time spent fixing it, or the CSAT hit when the bot gets it wrong?\"", [
            jumpNode("Ask what the problem costs them", "pain-and-consequence", "pressure", "grn"),
            jumpNode("Ask what changed", "trigger-and-urgency", "why-now", "blu")
          ], "You can see the path and where a person has to take over the contact.",
            "You still need the queue under the most strain and what it costs."),
          branch("WORKFLOW BROAD", "ly",
            "\"It's mostly the bot handling the obvious stuff and agents doing the rest.\"",
            "\"What's the expensive part that the bot can't touch and still needs an agent every time?\"", [
            jumpNode("Ask where people take over", "current-state-truth", "human-edge", "org"),
            jumpNode("Ask for a recent ticket", "current-state-truth", "example", "blu")
          ], "They named contact categories, not the actual escalation path.",
            "You still need the exact point where the bot hands off to an agent."),
          branch("WORKFLOW MESSY", "fl",
            "\"Different teams and channels handle it differently.\"",
            "\"That's normal. Pick the one queue leadership would care most about if it backed up tomorrow.\"", [
            jumpNode("Ask for a recent ticket", "current-state-truth", "example", "red"),
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "blu")
          ], "Queue handling is fragmented across teams and channels.",
            "You still need one queue to anchor the rest of the call.")
        ]),
        node("current-state-truth", "human-edge", "pr", "Find where people take over",
          "\"Where does the bot stop being trusted to finish a contact and an agent has to step in?\"",
          "Use this when the stack sounds normal but the bot-to-agent handoff is hidden.", false, [
          branch("HUMAN EDGE NAMED", "ok",
            "\"Anything touching refunds, account changes, or angry customers goes straight to an agent.\"",
            "\"Good. Which of those handoffs burns the most agent time, or pulls in a supervisor most often?\"", [
            jumpNode("Ask what the problem costs in money or time", "pain-and-consequence", "quantify", "grn"),
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "blu")
          ], "The bot-to-agent handoff point is named — refunds, account changes, angry customers.",
            "You still need what it costs and who owns it."),
          branch("HUMAN EDGE VAGUE", "ly",
            "\"Agents get pulled in whenever the bot can't handle it.\"",
            "\"What kind of contacts can't it handle — policy edge cases, refund logic, emotional customers, or multilingual contacts?\"", [
            jumpNode("Ask for a recent ticket", "current-state-truth", "example", "org"),
            jumpNode("Ask about the pain", "pain-and-consequence", "pressure", "blu")
          ], "There's a handoff, but the trigger for it is still blurry.",
            "You still need the exact contact type the bot can't finish."),
          branch("NO HUMAN EDGE", "fl",
            "\"Honestly, the bot handles most of it fine.\"",
            "\"Then what made this meeting worth taking? If the bot is fine, the problem is somewhere else — maybe CSAT, maybe cost.\"", [
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "why-now", "red"),
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "blu")
          ], "If the bot handles most of it, the handoff edge isn't the live pain.",
            "You still need either a trigger or a reason to treat this as exploratory.")
        ]),
        node("current-state-truth", "example", "ri", "Ask for one recent ticket",
          "\"Give me one recent ticket where the bot couldn't resolve it and a person had to take over.\"",
          "Use this when they keep the queue abstract — make them name a real ticket.", false, [
          branch("RECENT EXAMPLE", "ok",
            "\"Last week the bot gave a customer the wrong refund policy and a supervisor had to clean it up.\"",
            "\"That's helpful. How often does that kind of bot miss happen on that queue?\"", [
            jumpNode("Ask what the manual work really costs", "pain-and-consequence", "quantify", "grn"),
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "why-now", "blu")
          ], "You have a live ticket — a real bot miss a supervisor had to clean up.",
            "You still need how often it happens and what it costs."),
          branch("OLD EXAMPLE", "ly",
            "\"It's happened, but I don't have a recent one in front of me.\"",
            "\"Then ballpark the pattern. What kind of bot miss happens often enough that the team has stopped flagging it?\"", [
            jumpNode("Ask what the manual work really costs", "pain-and-consequence", "pressure", "org"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
          ], "The bot does miss, but they have no recent example.",
            "You still need how often it bounces to a human, or whose pain it is."),
          branch("NO EXAMPLE", "fl",
            "\"I don't really have one.\"",
            "\"That usually means either the queue is genuinely healthy or the wrong person is in the room. Which one is true?\"", [
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "wrong-person", "red"),
            jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "blu")
          ], "No real ticket means a healthy queue or the wrong person in the room.",
            "You still need either a real bounced ticket or someone closer to the queue.")
        ])
      ]),

      // 03 — The problem and its cost
      segment("pain-and-consequence", "03", "The problem and its cost", "Find out what the problem costs them in time, money, or risk.", true, [
        node("pain-and-consequence", "pressure", "ri", "Ask what goes wrong when people take over",
          "\"Where does support hurt most right now — containment that doesn't hold, CSAT after a bad bot interaction, supervisor time fixing tickets, or queue backlog?\"",
          "First get them to say what hurts in the queue — tickets the bot can't close, CSAT, supervisors fixing tickets by hand, or backlog.", true, [
          branch("PAIN NAMED", "ok",
            "\"Containment looks fine on the dashboard, but the expensive tickets still bounce to a senior agent and CSAT slips.\"",
            "\"What does that cost in practice — supervisor hours, agent headcount, BPO spend, or the CSAT number leadership watches?\"", [
            jumpNode("Ask what the problem costs in money or time", "pain-and-consequence", "quantify", "grn"),
            jumpNode("Ask why now", "trigger-and-urgency", "why-now", "blu")
          ], "Containment looks fine but expensive tickets still bounce and CSAT slips — that's the real pain.",
            "You still need the operational cost and who feels it most."),
          branch("SOFT PAIN", "ly",
            "\"It's not broken. The queue's just harder to keep up with than it should be.\"",
            "\"If it stayed like this through your next launch, what would slip first — AHT, CSAT, or backlog?\"", [
            jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "org"),
            jumpNode("Ask whether the reason is urgent", "trigger-and-urgency", "consequence", "blu")
          ], "The queue's harder to keep up with, but no cost named yet.",
            "You still need what it costs to leave the queue alone — AHT, CSAT, or backlog."),
          branch("NO PAIN", "fl",
            "\"Support isn't the main problem right now.\"",
            "\"That's useful. Then the test is whether there's any real trigger at all. What changed to make this meeting happen?\"", [
            jumpNode("Ask what made this urgent", "trigger-and-urgency", "why-now", "red"),
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "blu")
          ], "Support isn't the urgent problem for them right now.",
            "You still need the actual reason the meeting exists.")
        ]),
        node("pain-and-consequence", "quantify", "va", "Ask what the manual fixes cost",
          "\"When the bot can't resolve it, what does the business actually pay — supervisor hours fixing tickets, more agents, BPO spend, or a CSAT hit?\"",
          "Use this once they name the problem but haven't put a cost on fixing it by hand.", false, [
          branch("COST IS CLEAR", "ok",
            "\"It eats supervisor time and our CSAT drops a few points on those queues.\"",
            "\"Who feels that first — the support ops lead, or the VP who answers for CSAT?\"", [
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "grn"),
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "consequence", "blu")
          ], "Supervisor time and a CSAT drop — the cost of fixing tickets by hand now has a number on it.",
            "You still need the owner and the deadline."),
          branch("COST IS IMPLIED", "ly",
            "\"It mostly just slows the team down.\"",
            "\"Which work stops happening because agents are stuck cleaning up bot misses or handling escalations?\"", [
            jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "org"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
          ], "There's a cost, but so far it is just a vague sense that agents are slowed down.",
            "You still need the displaced agent work or the measurable CSAT or AHT miss."),
          branch("COST IS HIDDEN", "fl",
            "\"We've learned to manage it.\"",
            "\"Managing it is still cost. Who's paying for the supervisor time spent fixing tickets every week — and what's it doing to your best agents?\"", [
            jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "red"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
          ], "They treat supervisors fixing tickets by hand as just how support runs.",
            "You still need who owns that manual work and the cost they've stopped seeing.")
        ]),
        node("pain-and-consequence", "soft-pain", "ri", "If the problem doesn't sound costly",
          "\"If this queue stayed exactly like this for six months, what would get slower, more expensive, or harder for customers to trust first?\"",
          "Use this when they shrug off the queue pain.", false, [
          branch("FUTURE COST", "ok",
            "\"Backlog and CSAT would slip, especially around launches.\"",
            "\"Good. What would make leadership notice that before it becomes the new normal?\"", [
            jumpNode("Ask what happens if nothing changes", "trigger-and-urgency", "consequence", "grn"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
          ], "Backlog and CSAT slip at launches — there's future cost even if today feels manageable.",
            "You still need the event that makes that cost visible to leadership."),
          branch("ONLY INTERNAL COST", "ly",
            "\"Customers are mostly fine. It's mostly agent drag internally.\"",
            "\"That still matters. Which higher-value work — coaching, QA, complex contacts — stops happening because agents are stuck fixing what the bot got wrong?\"", [
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "org"),
            jumpNode("Ask why now", "trigger-and-urgency", "why-now", "blu")
          ], "The case is agent time and the drag of fixing bot misses, not customer-facing pain.",
            "You still need who owns the cost and the reason to move now."),
          branch("NO FUTURE COST", "fl",
            "\"Honestly, nothing dramatic would happen.\"",
            "\"Then this may be too early to treat as active pain. What would have to change before the queue mattered?\"", [
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "blu")
          ], "The queue pain isn't strong enough to act on yet.",
            "You still need the threshold for action or an honest downgrade.")
        ])
      ]),

      // 04 — Why now
      segment("trigger-and-urgency", "04", "Why now", "Find out what changed that makes this worth solving now.", true, [
        node("trigger-and-urgency", "why-now", "ri", "Ask why now",
          "\"What changed recently that made support worth looking at now instead of later — a launch, a CSAT miss, a headcount freeze?\"",
          "Find out whether this is curiosity or real urgency — a launch, a CSAT miss, a hiring freeze.", true, [
          branch("REAL TRIGGER", "ok",
            "\"We froze support headcount but volume keeps climbing, so the queue is underwater.\"",
            "\"What timeline does that create, and what breaks first if nothing changes before then — backlog, CSAT, or burnout?\"", [
            jumpNode("Ask what breaks first if nothing changes", "trigger-and-urgency", "consequence", "grn"),
            jumpNode("Ask who would sponsor the change", "stakeholder-and-ownership", "buying-owner", "blu")
          ], "A headcount freeze against rising volume is forcing the queue underwater.",
            "You still need the timeline and who owns the problem."),
          branch("EFFICIENCY PUSH", "ly",
            "\"This sits inside a broader efficiency push right now.\"",
            "\"Understood. What made support specifically worth attention inside that bigger push?\"", [
            jumpNode("Ask what breaks first if nothing changes", "trigger-and-urgency", "consequence", "org"),
            jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "blu")
          ], "Support is one line item in a wider efficiency push, not its own fire.",
            "You still need the specific reason the queue rose to the top."),
          branch("NO TRIGGER", "fl",
            "\"Nothing changed. We're just exploring.\"",
            "\"That's fine. Then what would have to happen — a volume spike, a public CSAT miss — for this to become urgent enough to move?\"", [
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "blu")
          ], "No volume spike, CSAT miss, or freeze is forcing this yet.",
            "You still need the future trigger or an honest no.")
        ]),
        node("trigger-and-urgency", "consequence", "va", "Ask what breaks first if nothing changes",
          "\"If nothing changes before your next launch or peak season, what becomes visible first — backlog, CSAT, or escalation volume?\"",
          "Use this when they feel pressure but haven't pinned what breaks first.", false, [
          branch("VISIBLE MISS", "ok",
            "\"Leadership would see the CSAT drop and customers would feel the wait pretty quickly.\"",
            "\"Good. Who gets measured or blamed first when that CSAT number slips?\"", [
            jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "pain-owner", "grn"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "path", "blu")
          ], "Leadership would see the CSAT drop and customers would feel the wait.",
            "You still need who gets blamed for it and the path to respond."),
          branch("ONLY FUTURE RISK", "ly",
            "\"It's more of a risk building quietly as volume grows.\"",
            "\"Quiet risk still matters. What would force it into the open — a launch, an outage, a viral complaint?\"", [
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "org"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "pain-owner", "blu")
          ], "The queue risk is building quietly with volume, not breaking yet.",
            "You still need the launch or complaint that makes the risk undeniable."),
          branch("NO CONSEQUENCE", "fl",
            "\"Nothing immediate, honestly.\"",
            "\"Then we should treat this as early and not pretend it's urgent. What would have to change first?\"", [
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Book a meeting only if it has a clear purpose", "next-step-lock", "soft-deferral", "blu")
          ], "Nothing breaks soon enough to make the queue urgent.",
            "You still need the threshold for action or a clean exploratory path.")
        ]),
        node("trigger-and-urgency", "exploratory", "ri", "If it's still early",
          "\"If this is exploratory, let's keep it honest. What would have to become true before AI support deserved a real second meeting?\"",
          "Use this when there's interest in AI support but no deadline for fixing the queue.", false, [
          branch("THRESHOLD NAMED", "ok",
            "\"If we saw it actually resolve refund tickets without a supervisor cleanup, it would get more serious.\"",
            "\"Good. Then let's build the test around real resolution on that queue instead of forcing urgency.\"", [
            jumpNode("Ask what they need to see", "proof-threshold", "real-proof", "grn"),
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "buying-owner", "blu")
          ], "They named what success looks like — refunds resolved correctly without supervisor cleanup.",
            "You still need the owner and the evidence check."),
          branch("OWNER MISSING", "ly",
            "\"It'd matter once the VP of Support is actually involved.\"",
            "\"Then the next test is the owner path, not the product. Who should be in the next call?\"", [
            jumpNode("Ask who owns this problem", "stakeholder-and-ownership", "wrong-person", "org"),
            jumpNode("Agree who attends the next meeting and why", "next-step-lock", "exact-shape", "blu")
          ], "What's missing is the VP of Support, not urgency.",
            "You still need the right owner and the reason for their time."),
          branch("STILL AIRY", "fl",
            "\"I'm not sure yet.\"",
            "\"Then let's keep this light and not pretend. What signal — a CSAT miss, a backlog spike — would tell you it's time to re-open this?\"", [
            jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "red"),
            jumpNode("Ask what would make another meeting worth it", "next-step-lock", "soft-deferral", "blu")
          ], "There's no deadline and no clear standard for the queue yet.",
            "You still need either a CSAT-or-backlog signal threshold or a clean pause.")
        ])
      ]),

      // 05 — Who's involved
      segment("stakeholder-and-ownership", "05", "Who's involved", "Find out who feels the problem, who owns it, and who approves.", false, [
        node("stakeholder-and-ownership", "pain-owner", "pr", "Ask who feels the queue problems most",
          "\"Who feels this queue pain most directly today, and who gets pulled in whenever support backs up or CSAT slips?\"",
          "Tie the queue problem to a real person — ops lead, supervisor, VP — not a department.", true, [
          branch("OWNER CLEAR", "ok",
            "\"The Head of Support Ops lives in the queue daily, and the VP of CX answers for CSAT upstairs.\"",
            "\"Who else can slow this down even if those two want it fixed — IT, security, finance?\"", [
            jumpNode("Ask who owns the budget", "stakeholder-and-ownership", "buying-owner", "grn"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "path", "blu")
          ], "Head of Support Ops lives in the queue, VP of CX answers for CSAT.",
            "You still need who can block it even if those two want it fixed."),
          branch("SHARED OWNERSHIP", "ly",
            "\"A few teams touch support, so ownership's shared.\"",
            "\"Shared usually means someone feels it more than everyone else. Who's that in practice — the ops lead, the supervisor, the VP?\"", [
            jumpNode("Ask who owns the purchase", "stakeholder-and-ownership", "buying-owner", "org"),
            jumpNode("Ask for the right owner", "stakeholder-and-ownership", "wrong-person", "blu")
          ], "Ownership of the queue is spread across teams.",
            "You still need the one person who feels the queue pain personally."),
          branch("NO OWNER", "fl",
            "\"Nobody really owns the AI side cleanly.\"",
            "\"That's important. If nobody owns it, who'd still get blamed if CSAT dropped or the backlog blew up?\"", [
            jumpNode("Ask for the right owner", "stakeholder-and-ownership", "wrong-person", "red"),
            jumpNode("Ask whether this matters enough now", "trigger-and-urgency", "consequence", "blu")
          ], "No one owns the AI side, so this could stall.",
            "You still need who gets blamed for CSAT or backlog, or the sponsor.")
        ]),
        node("stakeholder-and-ownership", "buying-owner", "fu", "Find the budget owner",
          "\"Who would own the support change or the budget if this got real — VP Support, VP CX, or someone over both?\"",
          "Use this once you know who feels the queue problems most.", false, [
          branch("BUYER CLEAR", "ok",
            "\"The VP of Support would sponsor it, but IT, security, and finance all matter.\"",
            "\"Which of those has to feel safe first — usually security on data handling, or finance on whether it offsets BPO spend?\"", [
            jumpNode("Ask what they need to see to trust it", "proof-threshold", "first-gate", "grn"),
            jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "blu")
          ], "VP of Support sponsors; IT, security, and finance all matter.",
            "You still need the first gate and where it stalls."),
          branch("BUYER FOGGY", "ly",
            "\"We'd need a few people once this got more real.\"",
            "\"Which two matter first once this stops being theoretical — the support sponsor and security?\"", [
            jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "org"),
            jumpNode("Ask for the right owner", "stakeholder-and-ownership", "wrong-person", "blu")
          ], "They're still answering with committee language, not names.",
            "You still need the first two real humans — likely the sponsor and security."),
          branch("SYSTEMS FIRST", "fl",
            "\"IT or security would own most of it anyway, given it touches customer data.\"",
            "\"Understood. Who still has to care about the queue pain enough to justify that security work?\"", [
            jumpNode("Go back to who feels this problem most", "stakeholder-and-ownership", "pain-owner", "red"),
            jumpNode("Ask what they need to see to trust it", "proof-threshold", "first-gate", "blu")
          ], "Security and IT ownership is crowding out the business owner.",
            "You still need the support sponsor who makes the security work worth doing.")
        ]),
        node("stakeholder-and-ownership", "wrong-person", "ri", "If this is the wrong person",
          "\"If you're not the main support owner, who should be in the next conversation so this becomes real instead of informational?\"",
          "Use when this person lacks queue detail or budget authority.", false, [
          branch("RIGHT PERSON NAMED", "ok",
            "\"The next call should include the VP of Support or the Head of Support Ops.\"",
            "\"Good. What would make that person say yes to spending the time — a CSAT story, a cost story?\"", [
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "grn"),
            jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "blu")
          ], "The VP of Support or Head of Support Ops belongs in the next call.",
            "You still need the CSAT or cost story that gets that owner to show up."),
          branch("MAYBE OWNER", "ly",
            "\"I think it'd be someone in support ops.\"",
            "\"That's enough to start. What would matter most to that person if we brought them in — backlog, AHT, or CSAT?\"", [
            jumpNode("Ask what they need to see", "proof-threshold", "real-proof", "org"),
            jumpNode("Book the next meeting", "next-step-lock", "exact-shape", "blu")
          ], "There's a likely support-ops owner but no confident name.",
            "You still need the backlog, AHT, or CSAT story for that person."),
          branch("NO IDEA", "fl",
            "\"I don't know who'd own the AI side yet.\"",
            "\"Then we shouldn't fake a next step. What would we need to know before pulling more people in?\"", [
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Ask what would make this urgent", "trigger-and-urgency", "exploratory", "blu")
          ], "Nobody knows who'd own AI in support yet.",
            "You still need a reason to continue or a clean pause.")
        ])
      ]),

      // 06 — What they need to see
      segment("proof-threshold", "06", "What they need to see", "Agree on what they would need to see to believe it works.", false, [
        node("proof-threshold", "real-proof", "va", "Name what they need to see",
          "\"Before this could move, what would your team need to see to believe it's safe — real resolution on your worst queue, not just deflection?\"",
          "Agree what counts as a resolved ticket before offering a demo, pilot, or pricing.", true, [
          branch("EVIDENCE NAMED", "ok",
            "\"We'd need to see it actually close refund tickets correctly without a supervisor stepping in, on real customer data.\"",
            "\"Good. Which part of that has to be shown first — the correct resolution, or handling the hard case that usually breaks the bot?\"", [
            jumpNode("Ask which approval comes first", "proof-threshold", "first-gate", "grn"),
            jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "blu")
          ], "What they need to see is now named in resolution terms.",
            "You still need the first gate and the sign-off owner."),
          branch("EVIDENCE IS GENERIC", "ly",
            "\"A demo and some containment numbers would help.\"",
            "\"Happy to. What would that need to prove so it changes the decision instead of just looking good on a dashboard? Containment isn't resolution.\"", [
            jumpNode("Ask which approval comes first", "proof-threshold", "first-gate", "org"),
            jumpNode("Handle an early demo request", "proof-threshold", "early-demo", "blu")
          ], "They want a demo and containment numbers, but containment isn't resolution.",
            "You still need the real concern behind the dashboard request."),
          branch("EVIDENCE ASK TOO EARLY", "fl",
            "\"We're not ready to test anything yet.\"",
            "\"That's fine. Then let's stay with the queue problem until it is clear enough to test anything.\"", [
            jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "why-now", "blu")
          ], "The queue pain isn't strong enough to justify a test yet.",
            "You still need stronger pain or urgency.")
        ]),
        node("proof-threshold", "first-gate", "pr", "Ask which approval comes first",
          "\"Which evidence check comes first here — does it resolve real tickets, does security trust it with customer data, does it offset cost, or does leadership need to buy in?\"",
          "Use this after they say what they need to see, before you pick the test.", false, [
          branch("WORKFLOW FIRST", "ok",
            "\"We need to see it resolve real tickets on a live queue first.\"",
            "\"Great. Which queue should that evidence focus on so agents and supervisors trust the result — your worst one?\"", [
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "grn"),
            jumpNode("Ask what would make switching painful", "current-vendor-and-displacement", "migration", "blu")
          ], "Resolving tickets in a real queue is the first thing they need to see.",
            "You still need the exact queue and the sign-off person."),
          branch("TECHNICAL FIRST", "ly",
            "\"IT or security would need comfort first, since it touches customer PII.\"",
            "\"Good. What would they need to believe first — data handling, hallucination controls, permissions, or the human fallback?\"", [
            jumpNode("Ask who approves this, in what order", "decision-architecture", "gates", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
          ], "Security has to trust the data handling before anything else.",
            "You still need the exact control question — PII, hallucination, fallback — and its owner."),
          branch("POLITICAL FIRST", "fl",
            "\"Honestly, leadership needs to believe support matters before any test.\"",
            "\"Then the first thing they need to see is still queue pain and urgency, not product evidence.\"", [
            jumpNode("Go back to the problem", "pain-and-consequence", "quantify", "red"),
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "consequence", "blu")
          ], "Leadership doesn't see support as a priority yet — the blocker is internal politics.",
            "You still need the cost or CSAT case that justifies a test.")
        ]),
        node("proof-threshold", "early-demo", "ri", "If they want a demo early",
          "\"I can show the product. First tell me which unusual case the demo needs to handle so I don't show you an easy example that tells you nothing.\"",
          "Use this when they jump to the tour before naming a real edge case.", false, [
          branch("CONCERN NAMED", "ok",
            "\"We'd need to see it survive a refund-policy edge case without giving the customer the wrong answer.\"",
            "\"Good. Then let's build the demo around that hard case and the supervisor who'd judge whether the answer was right.\"", [
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "grn"),
            jumpNode("Ask which approval comes first", "proof-threshold", "first-gate", "blu")
          ], "The real worry is a refund-policy edge case where a wrong answer is expensive.",
            "You still need the supervisor who'd judge the answer and the exact queue."),
          branch("DEMO AS STALL", "ly",
            "\"We just want to understand what it looks like.\"",
            "\"Fair. Then I want one real queue first so the tour shows something real. Which one goes back to people most?\"", [
            jumpNode("Walk through one support contact", "current-state-truth", "workflow", "org"),
            jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "blu")
          ], "The demo ask is a stall — they want to look, not test.",
            "You still need the real queue that would make the demo prove something."),
          branch("NO CONCERN", "fl",
            "\"No specific concern. We just like to see the product.\"",
            "\"Then we should stay in the queue until the concern is real. Otherwise the next step won't have a clear purpose.\"", [
            jumpNode("Go back to what made this urgent", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ], "They haven't named a hard case for the demo to handle, so there's nothing specific to test.",
            "You still need a reason to show anything.")
        ])
      ]),

      // 07 — Current vendor
      segment("current-vendor-and-displacement", "07", "Current vendor", "Find out what they use today and why it has lasted.", false, [
        node("current-vendor-and-displacement", "incumbent", "fu", "Ask what support tools they use today",
          "\"What are you using today — Zendesk AI, Fin, Einstein, a home-built bot, BPO — and what keeps it winning even with the problems you named?\"",
          "Don't pretend the current bot is weak just because the queue hurts.", false, [
          branch("INCUMBENT DEFENSE", "ok",
            "\"We're on Fin and it deflects a decent chunk, so it's hard to justify a change.\"",
            "\"What upside — real resolution on the queue Fin can't touch — would have to be obvious enough to overcome that?\"", [
            jumpNode("Ask what would make switching painful", "current-vendor-and-displacement", "migration", "grn"),
            jumpNode("Agree what they need to see", "proof-threshold", "first-gate", "blu")
          ], "Fin deflects enough that changing bots is hard to justify.",
            "You still need the resolution upside that would outweigh switching."),
          branch("PATCHWORK STATUS QUO", "ly",
            "\"It's a bot, some macros, and an offshore BPO team — it works well enough for now.\"",
            "\"Which part feels good enough, and which part keeps pulling your senior agents back in?\"", [
            jumpNode("Ask what their own build does and doesn't do", "current-vendor-and-displacement", "build", "org"),
            jumpNode("Go back to the problem", "pain-and-consequence", "quantify", "blu")
          ], "Support today is a patchwork of tools, not one system.",
            "You still need the queue that keeps proving it is not good enough."),
          branch("NO REAL STATUS QUO", "fl",
            "\"It's mostly agents working extra hard, no real AI yet.\"",
            "\"Then what they need to see is operational. What agent work disappears if the bot actually resolved the routine queues?\"", [
            jumpNode("Go back to the problem", "pain-and-consequence", "quantify", "red"),
            jumpNode("Ask who approves this, in what order", "decision-architecture", "path", "blu")
          ], "It's agents working extra hard with no real AI — less to replace than expected.",
            "You still need the routine agent work the bot could take off the queue.")
        ]),
        node("current-vendor-and-displacement", "build", "ri", "If they built their own bot",
          "\"What part of the home-built bot works, and what part is still expensive enough that this meeting happened anyway?\"",
          "Use when they defend a home-built bot with the effort they put into it.", false, [
          branch("UNSOLVED BRANCH", "ok",
            "\"We built our own bot, but the refund and account-change queue still keeps failing and bouncing to humans.\"",
            "\"Good. Then which queue refuses to stay solved, and why — is it policy edge cases or wrong answers?\"", [
            jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "grn"),
            jumpNode("Ask what would make switching painful", "current-vendor-and-displacement", "migration", "blu")
          ], "The internal build did not fully solve the support problem.",
            "You still need the stubborn queue and its cost."),
          branch("BUILD IS GOOD ENOUGH", "ly",
            "\"It mostly works. We're just curious what else is possible.\"",
            "\"Then they expect a lot. What would resolution or CSAT have to improve enough to justify any change at all?\"", [
            jumpNode("Go back to what they need to see", "proof-threshold", "real-proof", "org"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ], "The internal bot may already be good enough for now.",
            "You still need the threshold that would justify change."),
          branch("BUILD PRIDE", "fl",
            "\"We'd rather keep building our own bot than adopt a vendor.\"",
            "\"That may be right. What would have to break — a CSAT miss, a hallucination incident — before that preference changed?\"", [
            jumpNode("Ask what gets worse if nothing changes", "pain-and-consequence", "soft-pain", "red"),
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "blu")
          ], "They strongly prefer to build things themselves.",
            "You still need the break condition that would reopen the question.")
        ]),
        node("current-vendor-and-displacement", "migration", "pr", "Ask what would make switching painful",
          "\"What would make swapping your current bot feel too painful — retraining intents, rebuilding the knowledge base, re-integrating Zendesk — unless the upside was obvious?\"",
          "Use after they admit the current bot still wins on familiarity.", false, [
          branch("MIGRATION RISK CLEAR", "ok",
            "\"Re-pointing the bot and rebuilding intents is real work, but so is the supervisor time spent fixing tickets by hand.\"",
            "\"Then let's shape the next step around the smallest test — one queue resolved — that could outweigh that switching pain.\"", [
            jumpNode("Ask which approval comes first", "proof-threshold", "first-gate", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
          ], "They said what switching would take.",
            "You still need the smallest credible test."),
          branch("RIP AND REPLACE OFF TABLE", "ly",
            "\"We're not ripping out Zendesk or our bot.\"",
            "\"That's fine. What one narrow queue would still matter if the AI resolved it alongside what you have?\"", [
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "org"),
            jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "blu")
          ], "A narrow-queue path may be more realistic than full replacement.",
            "You still need the beachhead queue."),
          branch("NOT WORTH MOVING", "fl",
            "\"Nothing here feels painful enough to justify swapping bots.\"",
            "\"Then let's be honest about that. What would have to change — backlog, CSAT, cost — before moving became rational?\"", [
            jumpNode("Ask plainly whether this is early research", "trigger-and-urgency", "exploratory", "red"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ], "The case for replacing what they have is not made yet.",
            "You still need the threshold that would justify movement.")
        ])
      ]),

      // 08 — How they'll decide
      segment("decision-architecture", "08", "How they'll decide", "Find out who signs off and in what order.", true, [
        node("decision-architecture", "path", "pr", "Ask who approves this, in what order",
          "\"If this became real, what would the decision path actually look like after this call — sponsor, then security, then finance?\"",
          "Use this once you know the queue problem, the owner, and what they need to see.", true, [
          branch("PATH VISIBLE", "ok",
            "\"The VP of Support sponsors, security reviews the data handling, and finance signs off if it offsets BPO spend.\"",
            "\"Who can stall that even if the VP wants to move — usually security or finance?\"", [
            jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "grn"),
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
          ], "Sponsor, then security on data handling, then finance on the BPO offset.",
            "You still need where it stalls and the first concrete gate."),
          branch("PATH FOGGY", "ly",
            "\"We'd probably pull in a few people after this.\"",
            "\"Which two actually matter first once this stops being exploratory — the support sponsor and security?\"", [
            jumpNode("Ask which two approvals come first", "decision-architecture", "gates", "org"),
            jumpNode("Go back to who owns the budget", "stakeholder-and-ownership", "buying-owner", "blu")
          ], "They're still describing a committee cloud, not an order.",
            "You still need the first two real gates — likely sponsor and security."),
          branch("PATH UNKNOWN", "fl",
            "\"I don't really know how AI in support would get approved yet.\"",
            "\"That's useful. What internal reviews and approvals are required for a change involving customer data?\"", [
            jumpNode("Ask what usually slows these decisions", "decision-architecture", "stall", "red"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ], "Nobody's mapped how AI touching customer data gets approved here.",
            "You still need someone who knows the process or the likely sequence.")
        ]),
        node("decision-architecture", "gates", "fu", "Ask which two approvals come first",
          "\"Which two approvals matter first if this gets serious — support sponsor sign-off, resolution evidence on a real queue, security on customer data, or finance on the BPO offset?\"",
          "Use this to find the first approvals that actually matter, not a general process.", false, [
          branch("GATES CLEAR", "ok",
            "\"We know the first two approvals and who owns them — the VP and security.\"",
            "\"Good. Then the next call should get the first approval, not try to impress the whole committee.\"", [
            jumpNode("Agree who attends the next meeting and why", "next-step-lock", "exact-shape", "grn"),
            jumpNode("Go back to what they need to see", "proof-threshold", "first-gate", "blu")
          ], "The VP and security are the first two approvals, with named owners.",
            "You still need the meeting that clears the first one."),
          branch("SECURITY EARLY", "ly",
            "\"Anything touching customer data brings in security and IT fast.\"",
            "\"What would the support sponsor need to believe before that security time is worth spending?\"", [
            jumpNode("Go back to what they need to see", "proof-threshold", "first-gate", "org"),
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
          ], "Customer data pulls security in early.",
            "You still need the queue-pain case that makes the security review worth spending."),
          branch("PROCUREMENT LATE", "fl",
            "\"Procurement matters later, but not yet.\"",
            "\"Good. Then who actually decides this deserves a deeper review before procurement ever shows up — the VP of Support?\"", [
            jumpNode("Go back to who owns the budget", "stakeholder-and-ownership", "buying-owner", "red"),
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "blu")
          ], "Procurement is late, not the real early blocker.",
            "You still need the VP-level decider who greenlights the deeper review.")
        ]),
        node("decision-architecture", "stall", "ri", "Find where it stalls",
          "\"What usually slows AI support decisions down even when everyone sounds interested — security review, the wrong-answer fear, or budget?\"",
          "Use this when the path sounds plausible but you sense it's fragile.", false, [
          branch("STALL NAMED", "ok",
            "\"It usually stalls in security review over hallucination risk and data handling.\"",
            "\"Good. Then the next step has to address that control question head-on instead of hoping it disappears.\"", [
            jumpNode("Book the next review meeting", "next-step-lock", "exact-shape", "grn"),
            jumpNode("Go back to what they need to see", "proof-threshold", "first-gate", "blu")
          ], "It stalls in security review over hallucination risk and data handling.",
            "You still need the next meeting shaped around that control question."),
          branch("STALL IS OWNER", "ly",
            "\"It usually stalls because no one really owns the AI side.\"",
            "\"Then the next step is owner quality before anything else. Who has to feel this queue pain enough to keep it alive?\"", [
            jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "pain-owner", "org"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ], "It stalls because no one owns the AI side enough to push it.",
            "You still need the person whose queue pain keeps momentum alive."),
          branch("STALL UNKNOWN", "fl",
            "\"Hard to say. It varies.\"",
            "\"Then we can't assume there's a clear path yet. Best guess — where would it stall first, security or budget?\"", [
            jumpNode("Go back to who approves this", "decision-architecture", "path", "red"),
            jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu")
          ], "They can't say where it would stall, so there is no clear path yet.",
            "You still need the most likely failure point, security or budget.")
        ])
      ]),

      // 09 — Next step
      segment("next-step-lock", "09", "Next step", "Leave with a dated meeting and a named owner.", true, [
        node("next-step-lock", "real-meeting", "cl", "Book a review meeting",
          "\"What's the next review worth taking now, and what has to be true for it to count — the VP in the room, a real queue to test against?\"",
          "Use this when the queue work is ready for a specific follow-up.", true, [
          branch("REAL REVIEW", "ok",
            "\"Let's get the VP of Support and security on a call to scope a pilot on our refund queue.\"",
            "\"Good. What must that session settle — the queue, what counts as resolved, the data controls — so it moves the deal instead of just updating it?\"", [
            jumpNode("Agree who attends the next meeting and why", "next-step-lock", "exact-shape", "grn"),
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "blu")
          ], "They'll bring the VP and security to scope a pilot on the refund queue.",
            "You still need the purpose, date, and right people."),
          branch("EMAIL INSTEAD", "ly",
            "\"Send something over and we'll circle back.\"",
            "\"Happy to send the right thing. What should that summary help your team decide so the next meeting is real?\"", [
            jumpNode("Ask what would make this worth a meeting", "next-step-lock", "soft-deferral", "org"),
            jumpNode("Clarify what they need to see", "proof-threshold", "real-proof", "blu")
          ], "A send-and-circle-back is standing in for a real next step.",
            "You still need the decision that summary is supposed to open up."),
          branch("NOT READY", "fl",
            "\"We're not ready for a next meeting yet.\"",
            "\"Understood. What's still missing — the owner, resolution evidence, timing, or security alignment?\"", [
            jumpNode("Ask what would make this worth a meeting", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "blu")
          ], "The queue work hasn't justified a real meeting yet.",
            "You still need the missing condition in plain language.")
        ]),
        node("next-step-lock", "exact-shape", "fu", "Agree who attends the pilot meeting and why",
          "\"Who needs to be there, which queue should the meeting test, and what decision should come out of it — pilot yes or no?\"",
          "Use this to turn vague follow-up into a real pilot-scoping meeting.", false, [
          branch("MEETING SHAPED", "ok",
            "\"We know the people, the queue, and that the decision is whether to pilot on refunds.\"",
            "\"Good. Then let's put a date on it while the backlog problem is still fresh.\"", [
            jumpSegment("Go to After the call", "post-call-routing", "grn"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ], "People, queue, and the pilot-yes-or-no decision are all set.",
            "You still need the date or who owns the calendar."),
          branch("WRONG PEOPLE", "ly",
            "\"We're still not sure who else should be in it.\"",
            "\"Then the first goal is getting the support owner and security into the same room, not over-designing the agenda.\"", [
            jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "wrong-person", "org"),
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "blu")
          ], "The meeting's real in principle but the attendees aren't right yet.",
            "You still need the support owner and security in the room."),
          branch("NO DATE", "fl",
            "\"It makes sense, but we're not ready to calendar it yet.\"",
            "\"That's useful. What still has to become true — security comfort, sponsor buy-in — before a date would feel responsible?\"", [
            jumpNode("Ask what would make this worth a meeting", "next-step-lock", "soft-deferral", "red"),
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "blu")
          ], "The pilot meeting makes sense but isn't on the calendar.",
            "You still need security comfort or sponsor buy-in before a date is responsible.")
        ]),
        node("next-step-lock", "soft-deferral", "ri", "If they won't commit to a next step",
          "\"If we don't calendar the next step now, what exactly needs to become true before this re-opens — a CSAT miss, a launch, a freed-up sponsor?\"",
          "Use when they default to a polite follow-up instead of a real next step.", false, [
          branch("CONDITION NAMED", "ok",
            "\"We know what has to become true first — the sponsor freeing up after the launch.\"",
            "\"Good. Then let's capture that cleanly so the next touch is more specific, not repetitive.\"", [
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "grn"),
            jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
          ], "They named what would bring this back: the sponsor having time after the launch.",
            "You still need who owns that condition."),
          branch("CONDITION IS OWNER", "ly",
            "\"We need the VP of Support in the room first.\"",
            "\"Then the next step is getting that owner, not more product. Who's missing and what gets them in?\"", [
            jumpNode("Go back to who owns this problem", "stakeholder-and-ownership", "wrong-person", "org"),
            jumpNode("Write notes for whoever picks this up", "post-call-routing", "handoff", "blu")
          ], "What's blocking it is the missing VP of Support, not the product.",
            "You still need that owner and the reason for their time."),
          branch("CONDITION STILL UNKNOWN", "fl",
            "\"I can't really say yet.\"",
            "\"Then let's stay honest and write down exactly what we still don't know before we pretend this is moving.\"", [
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
            jumpRoom("Add the meeting to the deal", "deal-workspace", "blu")
          ], "There's no clear next step and no sign this is moving.",
            "You still need the open question in plain language.")
        ])
      ]),

      // 10 — After the call
      segment("post-call-routing", "10", "After the call", "Record what you learned and decide where it goes next.", false, [
        node("post-call-routing", "handoff", "cl", "Write notes for whoever picks this up",
          "\"If someone new picked this deal up tomorrow, what would they need to know in the first 30 seconds — the queue, the owner, what they need to see, the security review?\"",
          "Sum up the call: the queue, the owner, what counts as resolved, and the security review.", false, [
          branch("HANDOFF CLEAN", "ok",
            "\"Worst queue is refunds, VP of Support sponsors, they need to see real resolution without supervisor cleanup, security has to approve data handling.\"",
            "\"Good. Keep only the owner, the queue problem, what counts as resolved, and what the next step depends on.\"", [
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "grn"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ], "You have the worst queue, the sponsor, what counts as resolved, and the security review.",
            "You still need the one open question to chase."),
          branch("HANDOFF NOISY", "ly",
            "\"We have the notes, but they're messy.\"",
            "\"Then throw away what doesn't change the next step. What's actually usable — the queue, the owner, the first approval?\"", [
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "org"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ], "There are notes, but the queue, owner, and first approval are buried in them.",
            "You still need a short summary and where it goes next."),
          branch("NO HANDOFF HABIT", "fl",
            "\"We don't document these calls consistently.\"",
            "\"Then the first fix is discipline. What must be captured every time before the call disappears — owner, queue, what they need to see?\"", [
            jumpNode("Note what you still need to find out", "post-call-routing", "missing-truth", "red"),
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "blu")
          ], "Discovery calls aren't captured, so what they learned gets lost.",
            "You still need the minimum capture rule — owner, queue, what they need to see.")
        ]),
        node("post-call-routing", "missing-truth", "fu", "Note what you still need to find out",
          "\"What's still missing that the next step has to find out directly — the security answer, the resolution number off the worst queue, the right owner?\"",
          "Give whoever picks this up one open question to chase, not just a summary.", false, [
          branch("MISSING TRUTH CLEAR", "ok",
            "\"We know the open question — whether security will clear the data handling — and who has to surface it.\"",
            "\"Good. Then the handoff is specific enough to move.\"", [
            jumpNode("Choose where this goes after the call", "post-call-routing", "room-route", "grn"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ], "The open question is clear — whether security approves the data handling, and who finds out.",
            "You still need to pick where this goes next and who owns it."),
          branch("MISSING OWNER", "ly",
            "\"We know what's missing, but not who can answer it.\"",
            "\"Then the next step has to start by getting the right person — probably security or the VP — involved.\"", [
            action("Set the next meeting", "segment:next-step-lock", "org"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ], "The open question is clear but no one's named to answer it.",
            "You still need the route that gets security or the VP into the frame."),
          branch("EVERYTHING THIN", "fl",
            "\"We still don't know too much.\"",
            "\"Then the next step should be the one most likely to get this back on track, instead of pretending it went better than it did.\"", [
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ], "Too much is unknown to move forward — this needs fixing first.",
            "You still need the most useful first correction.")
        ]),
        node("post-call-routing", "room-route", "pr", "Choose where this goes after the call",
          "\"Where should this go next — shaping a tighter call, attaching what you learned to a live support deal, or noting the most likely reason it could fail before it's forgotten?\"",
          "Choose where this goes based on what happened — a more focused next call, a live support deal, or a risk worth noting.", false, [
          branch("NEXT MEETING", "ok",
            "\"The next step is a tighter call with the VP and security and a clearer question that needs an answer.\"",
            "\"Then set the next meeting and bring the owner, what counts as resolved, and the security review.\"", [
            action("Set the next meeting", "segment:next-step-lock", "grn"),
            jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
          ], "The next step is another conversation, not a commercial move.",
            "You still need the open question."),
          branch("DEAL WORKSPACE", "ly",
            "\"There's already a live pilot or evaluation here.\"",
            "\"Then attach what's actually happening to the deal now — the queue, what they need to see, the security review — so it doesn't get separated from the opportunity.\"", [
            jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
            jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
          ], "These facts belong on a live deal.",
            "You still need the most important risk to carry with it."),
          branch("FUTURE AUTOPSY", "fl",
            "\"This feels like activity without a real owner or trigger.\"",
            "\"Then route it to Future Autopsy now and name the failure pattern before the deal ages out.\"", [
            jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
            action("Set the next meeting", "segment:next-step-lock", "blu")
          ], "The next step may need to fix what has slipped, not push the deal forward.",
            "You still need the failure pattern in plain language.")
        ])
      ])
    ],
    interrupts: [
      {
        id: "bot-handles-it",
        label: "The bot already handles most of it",
        reply:
          "Deflection is not resolution. Where do the expensive tickets still go back to a supervisor or a senior agent, and what forces that handoff?",
        actions: [
          jumpNode("Ask where a person takes over from the bot", "current-state-truth", "workflow", "blu"),
          jumpNode("Ask what the manual fixes cost", "pain-and-consequence", "quantify", "org")
        ]
      },
      {
        id: "wrong-answers-fear",
        label: "We worry it will give customers wrong answers",
        reply:
          "That is the right fear, not a blocker. The useful question is which queue a wrong answer is most expensive in, and what controls would make it safe in one narrow queue first.",
        actions: [
          jumpNode("Agree what they need to see", "proof-threshold", "early-demo", "pur"),
          jumpNode("Ask what the problem costs them", "pain-and-consequence", "pressure", "org")
        ]
      },
      {
        id: "already-on-fin",
        label: "We already have Fin / Zendesk AI / built our own",
        reply:
          "Good. What part of it actually stops supervisors from fixing tickets by hand, and which queue still keeps coming back even with what you built?",
        actions: [
          jumpNode("Ask what their current setup does well", "current-vendor-and-displacement", "build", "red"),
          jumpNode("Go back to the problem", "pain-and-consequence", "pressure", "blu")
        ]
      },
      {
        id: "show-resolution-rate",
        label: "Just show me the resolution rate",
        reply:
          "The only number that matters is the one off your worst queue. Pick the type of ticket that goes back to people most, and we will work out what it would take to actually resolve it.",
        actions: [
          jumpNode("Ask what they need to see to trust it", "proof-threshold", "real-proof", "blu"),
          jumpNode("Ask them to walk through one support contact", "current-state-truth", "workflow", "org")
        ]
      },
      {
        id: "not-a-priority",
        label: "Support is not a budget priority this quarter",
        reply:
          "Understood. What would have to break for that to change — a CSAT miss, a volume spike after a launch, or escalations leadership starts noticing?",
        actions: [
          jumpNode("Ask what would make the next step worth it", "next-step-lock", "soft-deferral", "blu"),
          jumpNode("Ask who feels this problem most", "stakeholder-and-ownership", "wrong-person", "red")
        ]
      }
    ]
  });
})();
