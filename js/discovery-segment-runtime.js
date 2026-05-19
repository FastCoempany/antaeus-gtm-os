(function(){
  function action(label, target, tone){
    return { label:label, target:target, tone:tone || "blu" };
  }

  function jumpNode(label, segmentId, nodeSlug, tone){
    return action(label, "node:" + segmentId + "--" + nodeSlug, tone);
  }

  function jumpSegment(label, segmentId, tone){
    return action(label, "segment:" + segmentId, tone);
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

  function interrupts(seed){
    return [
      {
        id:"show-demo",
        label:"Show me the product",
        reply:"Happy to. First tell me which part of " + seed.flow + " you would need it to survive so I do not show a generic tour.",
        actions:[
          jumpNode("Map the workflow", "current-state-truth", "workflow", "blu"),
          jumpNode("Name the proof bar", "proof-threshold", "early-demo", "pur")
        ]
      },
      {
        id:"what-costs",
        label:"What does it cost?",
        reply:"I can answer cost responsibly once we know the footprint, owner, and proof bar. Right now I want the most expensive branch of " + seed.flow + ".",
        actions:[
          jumpNode("Quantify the pain", "pain-and-consequence", "quantify", "org"),
          jumpNode("Map the decision path", "decision-architecture", "path", "blu")
        ]
      },
      {
        id:"built-it",
        label:"We built this ourselves",
        reply:"Makes sense. What part works, and what part is still expensive enough that this meeting happened anyway?",
        actions:[
          jumpNode("Surface the incumbent", "current-vendor-and-displacement", "build", "red"),
          jumpNode("Return to pain", "pain-and-consequence", "pressure", "blu")
        ]
      },
      {
        id:"send-info",
        label:"Send something",
        reply:"Happy to send the right thing. What should it help your team decide so this does not die as a polite follow-up?",
        actions:[
          jumpNode("Earn the next meeting", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Clarify the proof bar", "proof-threshold", "real-proof", "blu")
        ]
      },
      {
        id:"wrong-person",
        label:"I am not the owner",
        reply:"That is useful. Who feels this pain enough that the next conversation would be real instead of informational?",
        actions:[
          jumpNode("Find the owner", "stakeholder-and-ownership", "wrong-person", "red"),
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "blu")
        ]
      }
    ];
  }

  function opening(seed){
    return segment("opening-frame","01","Opening frame","Start the call clean.",true,[
      node("opening-frame","primary","pr","Primary opener","\"" + seed.opening + "\"","Use this first if they give you permission to diagnose before pitching.",true,[
        branch("CONFIRMS","ok","\"" + seed.opening + "\"","\"" + seed.openingNext + "\"",[
          jumpNode("Map the workflow", "current-state-truth", "workflow", "blu"),
          jumpNode("Surface the pain", "pain-and-consequence", "pressure", "grn")
        ],"They acknowledged the expensive edge exists.","You still need the exact branch and the handoff trigger."),
        branch("BROAD","ly","\"We have a pretty standard " + seed.shortFlow + " setup.\"","\"Standard is fine. Walk me through where a human still has to rescue the workflow.\"",[
          jumpNode("Use workflow walk", "current-state-truth", "workflow", "org"),
          jumpNode("Use example follow-up", "current-state-truth", "example", "blu")
        ],"The buyer gave setup shape, not what is actually happening.","You still need a recent example or the human takeover point."),
        branch("PUSHBACK","fl","\"Can you just show the product?\"","\"I can, but I want it to map to your world first. Give me one branch of the workflow so the product tour is not generic.\"",[
          jumpNode("Use workflow walk", "current-state-truth", "workflow", "blu"),
          jumpNode("Use proof rescue", "proof-threshold", "early-demo", "pur")
        ],"They are trying to skip diagnosis.","You still need one concrete branch before showing anything.")
      ]),
      node("opening-frame","workflow","fu","Operator walk","\"Before we go anywhere, walk me through " + seed.flow + " from the first signal to the moment a human has to step in.\"","Use this when they sound operational and ready to map the flow.",false,[
        branch("CONCRETE","ok","\"" + seed.current + "\"","\"" + seed.currentNext + "\"",[
          jumpNode("Name the cost", "pain-and-consequence", "pressure", "grn"),
          jumpNode("Test the trigger", "trigger-and-urgency", "why-now", "blu")
        ],"The workflow is now starting to become visible.","You still need the costly branch, not just the stack."),
        branch("MIXED","ly","\"It depends on the team and the queue.\"","\"That is fine. Pick the one queue or branch leadership would care most about if it broke tomorrow.\"",[
          jumpNode("Use example follow-up", "current-state-truth", "example", "org"),
          jumpNode("Find who feels it", "stakeholder-and-ownership", "pain-owner", "blu")
        ],"The environment may be fragmented.","You still need one branch to anchor the call."),
        branch("TOO HIGH LEVEL","fl","\"I am not close enough to the workflow to map it that tightly.\"","\"No problem. What is the loudest complaint you hear first when the workflow breaks?\"",[
          jumpNode("Use pain opener", "pain-and-consequence", "pressure", "red"),
          jumpNode("Use owner rescue", "stakeholder-and-ownership", "wrong-person", "blu")
        ],"This may be the wrong altitude for workflow detail.","You need either a complaint pattern or a better operator.")
      ]),
      node("opening-frame","sideways","ri","If the call starts sideways","\"If this is early or exploratory, that is fine. What made the meeting worth taking now instead of later?\"","Use this when the buyer is rushed, skeptical, or trying to stay abstract.",false,[
        branch("REAL REASON","ok","\"" + seed.trigger + "\"","\"Good. Then let us follow that pressure instead of talking in generalities.\"",[
          jumpNode("Use trigger test", "trigger-and-urgency", "why-now", "grn"),
          jumpNode("Map current state", "current-state-truth", "workflow", "blu")
        ],"There is a real reason the meeting happened.","You still need to see whether the reason is urgent enough to move."),
        branch("SOFT REASON","ly","\"We are mostly staying informed right now.\"","\"That is fine. What would have to become true for this to stop being informative and become important?\"",[
          jumpNode("Use exploratory honesty", "trigger-and-urgency", "exploratory", "org"),
          jumpNode("Use proof bar", "proof-threshold", "real-proof", "pur")
        ],"The call may be early.","You still need the threshold that would turn interest into action."),
        branch("NO REASON","fl","\"Nothing changed. We are just looking around.\"","\"Understood. Then I will keep this honest and light. What branch would have to break before this became real priority?\"",[
          jumpNode("Use exploratory honesty", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Route to next-step honesty", "next-step-lock", "soft-deferral", "blu")
        ],"There is no active forcing event yet.","You still need the future trigger or a reason not to chase this hard.")
      ])
    ]);
  }

  function current(seed){
    return segment("current-state-truth","02","Current-state truth","Map the live workflow.",true,[
      node("current-state-truth","workflow","fu","Map the workflow","\"Walk me through " + seed.flow + " from the first signal to the point where a human has to rescue it.\"","Start here once the opener lands.",true,[
        branch("WORKFLOW CLEAR","ok","\"" + seed.current + "\"","\"" + seed.currentNext + "\"",[
          jumpNode("Name the cost", "pain-and-consequence", "pressure", "grn"),
          jumpNode("Ask what changed", "trigger-and-urgency", "why-now", "blu")
        ],"The current system and rescue branch are visible.","You still need the highest-pressure branch and its consequence."),
        branch("WORKFLOW BROAD","ly","\"It is mostly a mix of tools and people doing the obvious parts.\"","\"What is the expensive part that is not obvious and still needs a human every time?\"",[
          jumpNode("Use handoff question", "current-state-truth", "human-edge", "org"),
          jumpNode("Use example follow-up", "current-state-truth", "example", "blu")
        ],"The buyer is describing categories, not a real path.","You still need the exact human takeover point."),
        branch("WORKFLOW MESSY","fl","\"Different teams do it differently.\"","\"That is normal. Pick the one branch leadership would care most about if it broke tomorrow.\"",[
          jumpNode("Use example follow-up", "current-state-truth", "example", "red"),
          jumpNode("Find who feels it", "stakeholder-and-ownership", "pain-owner", "blu")
        ],"The workflow is fragmented.","You still need one branch to anchor the rest of the call.")
      ]),
      node("current-state-truth","human-edge","pr","Find the human edge","\"Where does software stop being trusted enough to finish the work and a person has to step in?\"","Use this when the setup sounds normal but the handoff is hidden.",false,[
        branch("HUMAN EDGE NAMED","ok","\"" + seed.fallbackCap + ".\"","\"Good. Which of those rescue moments burns the most time, trust, or money?\"",[
          jumpNode("Quantify the pain", "pain-and-consequence", "quantify", "grn"),
          jumpNode("Find who owns it", "stakeholder-and-ownership", "pain-owner", "blu")
        ],"The human takeover point is now named.","You still need its consequence and owner."),
        branch("HUMAN EDGE VAGUE","ly","\"Humans get involved whenever things get messy.\"","\"Messy how: access, policy, exception handling, customer emotion, or decision ambiguity?\"",[
          jumpNode("Use example follow-up", "current-state-truth", "example", "org"),
          jumpNode("Use pain opener", "pain-and-consequence", "pressure", "blu")
        ],"There is a rescue path, but it is still blurry.","You still need the specific type of mess."),
        branch("NO HUMAN EDGE","fl","\"Honestly, the workflow is mostly fine.\"","\"Then what made this meeting worth taking? If the workflow is fine, the trigger must be somewhere else.\"",[
          jumpNode("Test urgency", "trigger-and-urgency", "why-now", "red"),
          jumpNode("Keep the call honest", "trigger-and-urgency", "exploratory", "blu")
        ],"The operational edge may not be active pain.","You still need either a trigger or a reason to treat this as exploratory.")
      ]),
      node("current-state-truth","example","ri","Use one recent example","\"Give me one recent example where the workflow stopped being safe without a person.\"","Use this when the buyer stays abstract.",false,[
        branch("RECENT EXAMPLE","ok","\"Last week we had a case where " + seed.painSurface.toLowerCase() + "\"","\"That is helpful. What part of that example is happening often enough to matter?\"",[
          jumpNode("Pressure-test the cost", "pain-and-consequence", "quantify", "grn"),
          jumpNode("Map the trigger", "trigger-and-urgency", "why-now", "blu")
        ],"The call now has a live example.","You still need frequency and consequence."),
        branch("OLD EXAMPLE","ly","\"It happened before, but I do not have a recent one on hand.\"","\"Then ballpark the pattern for me. What happens often enough that the team has normalized it?\"",[
          jumpNode("Pressure-test the cost", "pain-and-consequence", "pressure", "org"),
          jumpNode("Find the owner", "stakeholder-and-ownership", "pain-owner", "blu")
        ],"The pattern exists, but recency is weak.","You still need frequency or owner pain."),
        branch("NO EXAMPLE","fl","\"I do not really have one.\"","\"That usually means either the workflow is healthy or the wrong person is in the room. Which one is true?\"",[
          jumpNode("Find the owner", "stakeholder-and-ownership", "wrong-person", "red"),
          jumpNode("Test whether pain is real", "pain-and-consequence", "soft-pain", "blu")
        ],"The call is still too abstract.","You still need either a real example or a better operator.")
      ])
    ]);
  }

  function pain(seed){
    return segment("pain-and-consequence","03","Pain and consequence","Make the pain expensive.",true,[
      node("pain-and-consequence","pressure","ri","Name the pain","\"Where does the current setup hurt most right now: " + seed.painAxes + "?\"","Get the pain pattern into plain language first.",true,[
        branch("PAIN NAMED","ok","\"" + seed.pain + "\"","\"What does that cost in practice today: money, time, quality, risk, or team bandwidth?\"",[
          jumpNode("Quantify the cost", "pain-and-consequence", "quantify", "grn"),
          jumpNode("Ask why now", "trigger-and-urgency", "why-now", "blu")
        ],"A real pain pattern is now visible.","You still need the operational cost and who feels it most."),
        branch("SOFT PAIN","ly","\"It is not broken. It is just harder than it should be.\"","\"If it stayed like this for another quarter, what would get worse first?\"",[
          jumpNode("Use soft-pain rescue", "pain-and-consequence", "soft-pain", "org"),
          jumpNode("Test the trigger", "trigger-and-urgency", "consequence", "blu")
        ],"There is friction, but the cost is still soft.","You still need the cost of leaving it alone."),
        branch("NO PAIN","fl","\"This is not the main problem right now.\"","\"That is useful. Then the test is whether there is any real trigger at all. What changed to make the meeting happen?\"",[
          jumpNode("Use trigger opener", "trigger-and-urgency", "why-now", "red"),
          jumpNode("Keep the call honest", "trigger-and-urgency", "exploratory", "blu")
        ],"The pain may be secondary or absent.","You still need the actual reason the meeting exists.")
      ]),
      node("pain-and-consequence","quantify","va","Quantify the cost","\"When that happens, what does the business actually pay: slowed work, missed target, more headcount, higher spend, or lower trust?\"","Use this once they name the pain but not the consequence.",false,[
        branch("COST IS CLEAR","ok","\"It hits " + seed.painAxes + " in a visible way.\"","\"Who feels that pain first, and who feels it badly enough to sponsor change?\"",[
          jumpNode("Find the pain owner", "stakeholder-and-ownership", "pain-owner", "grn"),
          jumpNode("Test urgency", "trigger-and-urgency", "consequence", "blu")
        ],"The pain now has a business consequence.","You still need the owner and the time pressure."),
        branch("COST IS IMPLIED","ly","\"It mostly slows the team down.\"","\"Which work stops happening because the team is stuck rescuing this instead?\"",[
          jumpNode("Use soft-pain rescue", "pain-and-consequence", "soft-pain", "org"),
          jumpNode("Find the owner", "stakeholder-and-ownership", "pain-owner", "blu")
        ],"The cost exists but is still fuzzy.","You still need the displaced work or the measurable miss."),
        branch("COST IS HIDDEN","fl","\"We have learned to manage it.\"","\"Managing it is still work. Who is paying for the workaround every week?\"",[
          jumpNode("Use soft-pain rescue", "pain-and-consequence", "soft-pain", "red"),
          jumpNode("Find the owner", "stakeholder-and-ownership", "pain-owner", "blu")
        ],"The team may be normalizing the pain.","You still need the workaround owner and the hidden cost.")
      ]),
      node("pain-and-consequence","soft-pain","ri","If the pain sounds soft","\"If this stayed exactly like this for six months, what would get slower, more expensive, or harder to trust first?\"","Use this when they minimize the pain.",false,[
        branch("FUTURE COST","ok","\"It would get worse in a visible way.\"","\"Good. What would make leadership notice that before it becomes normal?\"",[
          jumpNode("Use trigger consequence", "trigger-and-urgency", "consequence", "grn"),
          jumpNode("Find the owner", "stakeholder-and-ownership", "pain-owner", "blu")
        ],"There is future cost even if today feels manageable.","You still need the event that makes it visible."),
        branch("ONLY INTERNAL COST","ly","\"Customers are fine. It is mostly internal drag.\"","\"That still matters. Which higher-value work stops happening because people are stuck on this?\"",[
          jumpNode("Find the owner", "stakeholder-and-ownership", "pain-owner", "org"),
          jumpNode("Ask why now", "trigger-and-urgency", "why-now", "blu")
        ],"The case may be internal efficiency, not customer pain.","You still need the economic owner and the reason to move now."),
        branch("NO FUTURE COST","fl","\"Honestly, nothing dramatic would happen.\"","\"Then this may be too early to treat as active pain. What would have to change before it mattered?\"",[
          jumpNode("Keep the call exploratory", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Use proof question", "proof-threshold", "real-proof", "blu")
        ],"The pain is not strong enough yet.","You still need the threshold for action or an honest downgrade.")
      ])
    ]);
  }

  function trigger(seed){
    return segment("trigger-and-urgency","04","Trigger and urgency","Find the forcing event.",true,[
      node("trigger-and-urgency","why-now","ri","Ask why now","\"What changed recently that made this worth looking at now instead of later?\"","Use this to separate curiosity from pressure.",true,[
        branch("REAL TRIGGER","ok","\"" + seed.trigger + "\"","\"What timeline does that create, and what breaks first if nothing changes before then?\"",[
          jumpNode("Use consequence timing", "trigger-and-urgency", "consequence", "grn"),
          jumpNode("Find the sponsor", "stakeholder-and-ownership", "buying-owner", "blu")
        ],"A forcing event is on the table.","You still need the timeline and the owner of the pressure."),
        branch("EFFICIENCY PUSH","ly","\"This sits inside a broader push right now.\"","\"Understood. What made this specific workflow worth attention inside that bigger push?\"",[
          jumpNode("Use consequence timing", "trigger-and-urgency", "consequence", "org"),
          jumpNode("Return to pain", "pain-and-consequence", "pressure", "blu")
        ],"There is directional interest, but urgency is still soft.","You still need the specific reason this workflow rose to the top."),
        branch("NO TRIGGER","fl","\"Nothing changed. We are just exploring.\"","\"That is fine. Then what would have to happen for this to become important enough to move?\"",[
          jumpNode("Use exploratory honesty", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Learn the proof bar", "proof-threshold", "real-proof", "blu")
        ],"There is no active forcing event.","You still need the future trigger or an honest no.")
      ]),
      node("trigger-and-urgency","consequence","va","Tie urgency to consequence","\"If nothing changes before the next relevant event, what becomes visible first?\"","Use this when they have pressure but not yet a consequence.",false,[
        branch("VISIBLE MISS","ok","\"Leadership, customers, or the team would notice pretty quickly.\"","\"Good. Who gets measured or blamed first when that happens?\"",[
          jumpNode("Find the pain owner", "stakeholder-and-ownership", "pain-owner", "grn"),
          jumpNode("Map the decision path", "decision-architecture", "path", "blu")
        ],"The urgency now has a visible miss attached to it.","You still need the owner and the path to respond."),
        branch("ONLY FUTURE RISK","ly","\"It is more of a risk building quietly.\"","\"Quiet risk still matters. What would force it into the open?\"",[
          jumpNode("Use exploratory honesty", "trigger-and-urgency", "exploratory", "org"),
          jumpNode("Find the owner", "stakeholder-and-ownership", "pain-owner", "blu")
        ],"The consequence is still abstract.","You still need the event that makes the risk undeniable."),
        branch("NO CONSEQUENCE","fl","\"Nothing immediate, honestly.\"","\"Then we should treat this as early and avoid pretending it is urgent. What would have to change first?\"",[
          jumpNode("Keep the call honest", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Lock only if real", "next-step-lock", "soft-deferral", "blu")
        ],"Urgency is not active yet.","You still need the threshold for action or a clean exploratory path.")
      ]),
      node("trigger-and-urgency","exploratory","ri","If the call is early","\"If this is exploratory, let us keep it honest. What would have to become true before this deserved a real second meeting?\"","Use this when there is interest but no real clock.",false,[
        branch("THRESHOLD NAMED","ok","\"If we saw " + seed.proofNeed.toLowerCase() + ", it would get more serious.\"","\"Good. Then let us shape the proof bar around that instead of forcing urgency.\"",[
          jumpNode("Use proof bar", "proof-threshold", "real-proof", "grn"),
          jumpNode("Find the owner", "stakeholder-and-ownership", "buying-owner", "blu")
        ],"The future action threshold is now clearer.","You still need the owner and proof gate."),
        branch("OWNER MISSING","ly","\"It would matter once the right owner is involved.\"","\"Then the next test is the owner path, not the product. Who should be in the next call?\"",[
          jumpNode("Find the owner", "stakeholder-and-ownership", "wrong-person", "org"),
          jumpNode("Lock the right meeting", "next-step-lock", "exact-shape", "blu")
        ],"The blocker is ownership, not pressure.","You still need the right human and the reason for their time."),
        branch("STILL AIRY","fl","\"I am not sure yet.\"","\"Then let us keep this light and not pretend. What signal would tell you it is time to re-open this?\"",[
          jumpNode("Use proof question", "proof-threshold", "real-proof", "red"),
          jumpNode("Route the follow-up honestly", "next-step-lock", "soft-deferral", "blu")
        ],"The call remains exploratory.","You still need either a signal threshold or a clean pause.")
      ])
    ]);
  }

  function stakeholder(seed){
    return segment("stakeholder-and-ownership","05","Stakeholder and ownership","Find the real humans.",false,[
      node("stakeholder-and-ownership","pain-owner","pr","Find the pain owner","\"Who feels this pain most directly today, and who gets pulled in whenever the workflow breaks?\"","Use this to anchor the problem in a real human instead of a department.",true,[
        branch("OWNER CLEAR","ok","\"" + seed.owner + "\"","\"Who else can slow this down even if that person wants it fixed?\"",[
          jumpNode("Map the buying owner", "stakeholder-and-ownership", "buying-owner", "grn"),
          jumpNode("Map the decision path", "decision-architecture", "path", "blu")
        ],"The pain owner is visible.","You still need the blocker or gatekeeper."),
        branch("SHARED OWNERSHIP","ly","\"A few teams touch it, so ownership is shared.\"","\"Shared usually means someone still feels it more than everyone else. Who is that in practice?\"",[
          jumpNode("Use buying-owner follow-up", "stakeholder-and-ownership", "buying-owner", "org"),
          jumpNode("Use wrong-person rescue", "stakeholder-and-ownership", "wrong-person", "blu")
        ],"The org map is still diffused.","You still need the person with personal pain."),
        branch("NO OWNER","fl","\"Nobody really owns it cleanly.\"","\"That is important. If nobody owns the pain, who would still get blamed if it got worse?\"",[
          jumpNode("Use wrong-person rescue", "stakeholder-and-ownership", "wrong-person", "red"),
          jumpNode("Test urgency", "trigger-and-urgency", "consequence", "blu")
        ],"The opportunity may drift without an owner.","You still need the blamed person or the sponsor.")
      ]),
      node("stakeholder-and-ownership","buying-owner","fu","Find the buying owner","\"Who would own the workflow change or budget if this got real?\"","Use this after the pain owner is named.",false,[
        branch("BUYER CLEAR","ok","\"The operational owner would sponsor it, but " + seed.ownerRoles.toLowerCase() + " all matter.\"","\"Which of those people has to feel safe first before the others matter?\"",[
          jumpNode("Learn the proof bar", "proof-threshold", "first-gate", "grn"),
          jumpNode("Map the path", "decision-architecture", "gates", "blu")
        ],"The buying map is visible.","You still need the first gate and the stall point."),
        branch("BUYER FOGGY","ly","\"We would need a few people once this was more real.\"","\"Which two people matter first if this stops being theoretical?\"",[
          jumpNode("Map the path", "decision-architecture", "gates", "org"),
          jumpNode("Use wrong-person rescue", "stakeholder-and-ownership", "wrong-person", "blu")
        ],"They are still hiding behind committee language.","You still need the first two real humans."),
        branch("SYSTEMS FIRST","fl","\"IT or systems would own most of it anyway.\"","\"Understood. Who still has to care enough about the pain to justify that work?\"",[
          jumpNode("Return to pain owner", "stakeholder-and-ownership", "pain-owner", "red"),
          jumpNode("Learn the proof bar", "proof-threshold", "first-gate", "blu")
        ],"Implementation ownership may be crowding out business ownership.","You still need the sponsor who makes the work worth doing.")
      ]),
      node("stakeholder-and-ownership","wrong-person","ri","If this is the wrong person","\"If you are not the main owner, who should be in the next conversation so this becomes real instead of informational?\"","Use when the buyer lacks workflow detail or authority.",false,[
        branch("RIGHT PERSON NAMED","ok","\"The right follow-up should include the actual owner.\"","\"Good. What would make that person say yes to spending the time?\"",[
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Learn the proof bar", "proof-threshold", "real-proof", "blu")
        ],"The path to the real owner is now visible.","You still need the reason that owner will care."),
        branch("MAYBE OWNER","ly","\"I think it would be someone in " + seed.ownerRoles.split(",")[0].toLowerCase() + ".\"","\"That is enough to start. What would matter most to that person if we brought them in?\"",[
          jumpNode("Use proof bar", "proof-threshold", "real-proof", "org"),
          jumpNode("Lock the meeting", "next-step-lock", "exact-shape", "blu")
        ],"There is a likely owner but not yet a confident one.","You still need the value story for that person."),
        branch("NO IDEA","fl","\"I do not know who would own it yet.\"","\"Then we should not fake a next step. What truth would we need before involving more people?\"",[
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Clarify the trigger", "trigger-and-urgency", "exploratory", "blu")
        ],"Ownership is still unknown.","You still need a reason to continue or a clean pause.")
      ])
    ]);
  }

  function proof(seed){
    return segment("proof-threshold","06","Proof threshold","Name the proof bar.",false,[
      node("proof-threshold","real-proof","va","Name the proof bar","\"Before this could move, what would your team need to see to believe it is safe and worth it?\"","Use this before offering demo, pilot, or pricing.",true,[
        branch("PROOF NAMED","ok","\"" + seed.proof + "\"","\"Good. Which part of that proof has to be earned first so the rest of the review matters?\"",[
          jumpNode("Find the first gate", "proof-threshold", "first-gate", "grn"),
          jumpNode("Map the path", "decision-architecture", "gates", "blu")
        ],"The proof burden is now named.","You still need the first gate and the sign-off owner."),
        branch("PROOF IS GENERIC","ly","\"A demo and some examples would help.\"","\"Happy to do that. What exactly would that need to prove so it changes the decision instead of just creating interest?\"",[
          jumpNode("Find the first gate", "proof-threshold", "first-gate", "org"),
          jumpNode("Use early-demo rescue", "proof-threshold", "early-demo", "blu")
        ],"They want proof, but the burden is still generic.","You still need the hidden concern behind the request."),
        branch("PROOF TOO EARLY","fl","\"We are not at proof yet.\"","\"That is fine. Then let us stay with the problem until the proof bar deserves to be real.\"",[
          jumpNode("Return to pain", "pain-and-consequence", "pressure", "red"),
          jumpNode("Return to trigger", "trigger-and-urgency", "why-now", "blu")
        ],"The call is not yet ready for proof.","You still need stronger pain or urgency.")
      ]),
      node("proof-threshold","first-gate","pr","Find the first proof gate","\"Which proof gate comes first here: workflow fit, technical trust, financial case, or internal politics?\"","Use this after they name proof but before you choose the evidence step.",false,[
        branch("WORKFLOW FIRST","ok","\"We need to see it work in the real workflow first.\"","\"Great. Which workflow branch should that proof focus on so the team trusts the result?\"",[
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Map the incumbent", "current-vendor-and-displacement", "migration", "blu")
        ],"Operational proof comes first.","You still need the exact branch and sign-off person."),
        branch("TECHNICAL FIRST","ly","\"IT or security would need comfort first.\"","\"Good. What would they need to believe first: control, permissions, data handling, or fallback?\"",[
          jumpNode("Map the decision path", "decision-architecture", "gates", "org"),
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "blu")
        ],"A technical trust gate is in front.","You still need the exact control question and owner."),
        branch("POLITICAL FIRST","fl","\"Honestly, leadership needs to believe it matters before any proof step.\"","\"Then the first proof burden is still pain and urgency, not product evidence.\"",[
          jumpNode("Return to pain", "pain-and-consequence", "quantify", "red"),
          jumpNode("Return to trigger", "trigger-and-urgency", "consequence", "blu")
        ],"The barrier is political or economic, not technical.","You still need the business case that earns proof time.")
      ]),
      node("proof-threshold","early-demo","ri","If they ask for demo early","\"I can show the product. First tell me what concern that demo needs to settle so I do not show the wrong thing.\"","Use this when the buyer tries to jump to the tour.",false,[
        branch("CONCERN NAMED","ok","\"We would need to see it survive our real-world edge case.\"","\"Good. Then let us anchor the demo to that edge case and to the owner who would judge it.\"",[
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Find the proof gate", "proof-threshold", "first-gate", "blu")
        ],"The hidden concern is now visible.","You still need the edge case owner and the exact branch."),
        branch("DEMO AS STALL","ly","\"We just want to understand what it looks like.\"","\"Fair. Then I want one workflow branch first so the product tour is not just theater.\"",[
          jumpNode("Map the workflow", "current-state-truth", "workflow", "org"),
          jumpNode("Return to pain", "pain-and-consequence", "pressure", "blu")
        ],"The demo ask may be a stall or a shortcut.","You still need the real branch that would make the demo useful."),
        branch("NO CONCERN","fl","\"No specific concern. We just like to see the product.\"","\"Then we should stay in the workflow until the concern is real. Otherwise the next step will be soft.\"",[
          jumpNode("Return to trigger", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
        ],"There is no real proof burden yet.","You still need a reason to show anything.")
      ])
    ]);
  }

  function vendor(seed){
    return segment("current-vendor-and-displacement","07","Current vendor and displacement","Respect the status quo.",false,[
      node("current-vendor-and-displacement","incumbent","fu","Surface the incumbent","\"What are you using today, and what still keeps the current path winning even with the pressure you named?\"","Use this to avoid pretending the status quo is weak just because pain exists.",false,[
        branch("INCUMBENT DEFENSE","ok","\"" + seed.vendor + "\"","\"What upside would have to be obvious enough to overcome that familiarity?\"",[
          jumpNode("Map migration risk", "current-vendor-and-displacement", "migration", "grn"),
          jumpNode("Lock the proof bar", "proof-threshold", "first-gate", "blu")
        ],"The status quo has a real defense.","You still need the displacement threshold."),
        branch("PATCHWORK STATUS QUO","ly","\"It is a mix of tools and workarounds, but it works well enough for now.\"","\"Which part feels good enough, and which part still keeps pulling smart people back in?\"",[
          jumpNode("Use internal build follow-up", "current-vendor-and-displacement", "build", "org"),
          jumpNode("Return to pain", "pain-and-consequence", "quantify", "blu")
        ],"The current path is patchwork rather than unified.","You still need the branch that keeps proving it is not good enough."),
        branch("NO REAL STATUS QUO","fl","\"It is mostly people and heroics.\"","\"Then the proof burden is operational. What human work disappears if this actually gets solved?\"",[
          jumpNode("Return to pain", "pain-and-consequence", "quantify", "red"),
          jumpNode("Map the decision path", "decision-architecture", "path", "blu")
        ],"There may be less displacement risk than expected.","You still need the human work to remove.")
      ]),
      node("current-vendor-and-displacement","build","ri","If they built it internally","\"What part of the internal path works, and what part is still expensive enough that this meeting happened anyway?\"","Use when they defend the status quo with internal effort.",false,[
        branch("UNSOLVED BRANCH","ok","\"We built around parts of it, but one branch still keeps failing.\"","\"Good. Then which branch still refuses to stay solved and why?\"",[
          jumpNode("Return to pain", "pain-and-consequence", "pressure", "grn"),
          jumpNode("Map migration risk", "current-vendor-and-displacement", "migration", "blu")
        ],"The internal build did not fully solve the problem.","You still need the stubborn branch and its cost."),
        branch("BUILD IS GOOD ENOUGH","ly","\"It mostly works. We are just curious what else is possible.\"","\"Then the bar is high. What would have to improve enough to justify any change at all?\"",[
          jumpNode("Return to proof", "proof-threshold", "real-proof", "org"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
        ],"The internal path may already be good enough for now.","You still need the threshold that would justify change."),
        branch("BUILD PRIDE","fl","\"We would rather keep building than adopt a vendor.\"","\"That may be right. What would have to break before that preference changed?\"",[
          jumpNode("Test future pain", "pain-and-consequence", "soft-pain", "red"),
          jumpNode("Keep the call exploratory", "trigger-and-urgency", "exploratory", "blu")
        ],"Build-versus-buy identity is strong.","You still need the break condition that would reopen the question.")
      ]),
      node("current-vendor-and-displacement","migration","pr","Map migration or displacement risk","\"What would make replacing or changing the current path feel too painful unless the upside was obvious?\"","Use after they admit the incumbent still wins on familiarity.",false,[
        branch("MIGRATION RISK CLEAR","ok","\"The switching pain is real, but so is the current drag.\"","\"Then we should shape the next step around the smallest proof that could outweigh that pain.\"",[
          jumpNode("Set the proof step", "proof-threshold", "first-gate", "grn"),
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "blu")
        ],"The displacement burden is now explicit.","You still need the smallest credible proof step."),
        branch("RIP AND REPLACE OFF TABLE","ly","\"We are not looking to rip anything out.\"","\"That is fine. What one narrow scope would still matter if it worked?\"",[
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "org"),
          jumpNode("Return to pain", "pain-and-consequence", "pressure", "blu")
        ],"A scope path may be more realistic than full replacement.","You still need the beachhead use case."),
        branch("NOT WORTH MOVING","fl","\"Nothing here feels painful enough to justify migration.\"","\"Then we should treat that honestly. What would have to change before moving became rational?\"",[
          jumpNode("Keep the call exploratory", "trigger-and-urgency", "exploratory", "red"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
        ],"The displacement case is not earned yet.","You still need the threshold that would justify movement.")
      ])
    ]);
  }

  function decision(seed){
    return segment("decision-architecture","08","Decision architecture","Map the gates.",true,[
      node("decision-architecture","path","pr","Map the path","\"If this became real, what would the decision path actually look like after this meeting?\"","Use this once pain, owner, and proof start to feel real.",true,[
        branch("PATH VISIBLE","ok","\"" + seed.decision + "\"","\"Who can stall that path even if the main sponsor wants to move?\"",[
          jumpNode("Find the first gates", "decision-architecture", "gates", "grn"),
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "blu")
        ],"The approval path is visible enough to work with.","You still need the stall point and the first concrete gate."),
        branch("PATH FOGGY","ly","\"We would probably pull in a few people after this.\"","\"Which two people actually matter first once this stops being exploratory?\"",[
          jumpNode("Find the first gates", "decision-architecture", "gates", "org"),
          jumpNode("Return to buying owner", "stakeholder-and-ownership", "buying-owner", "blu")
        ],"They are still describing a committee cloud.","You still need the first two real gates."),
        branch("PATH UNKNOWN","fl","\"I do not really know how this would get approved yet.\"","\"That is useful. What usually has to happen internally before a workflow change like this gets air cover?\"",[
          jumpNode("Find the stall point", "decision-architecture", "stall", "red"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
        ],"The decision path is unmapped.","You still need the process knower or the likely sequence.")
      ]),
      node("decision-architecture","gates","fu","Find the first gates","\"Which two gates matter first if this gets serious: sponsor approval, workflow proof, security, budget, procurement, or something else?\"","Use this to avoid a generic approval story.",false,[
        branch("GATES CLEAR","ok","\"We know the first two gates and who owns them.\"","\"Good. Then the next meeting should be shaped around clearing the first gate, not impressing the whole committee.\"",[
          jumpNode("Lock the exact next review", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Return to proof", "proof-threshold", "first-gate", "blu")
        ],"The first two gates are now specific.","You still need the meeting that clears the first one."),
        branch("SECURITY EARLY","ly","\"Anything touching this will bring in IT or security quickly.\"","\"What would the sponsor need to believe before that security time is worth spending?\"",[
          jumpNode("Return to proof", "proof-threshold", "first-gate", "org"),
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "blu")
        ],"A technical gate appears early.","You still need the business case that earns that gate."),
        branch("PROCUREMENT LATE","fl","\"Procurement matters later, but not yet.\"","\"Good. Then who actually decides whether this deserves a real deeper review before procurement ever shows up?\"",[
          jumpNode("Return to buying owner", "stakeholder-and-ownership", "buying-owner", "red"),
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "blu")
        ],"Procurement is not the real early blocker.","You still need the true early decider.")
      ]),
      node("decision-architecture","stall","ri","Find the stall point","\"What usually slows decisions like this down even when everyone sounds interested on the call?\"","Use this when the path sounds plausible but still fragile.",false,[
        branch("STALL NAMED","ok","\"The sponsor is not enough; another gate usually slows it down.\"","\"Good. Then the next move has to acknowledge that gate directly instead of hoping it disappears.\"",[
          jumpNode("Lock the next review", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Return to proof", "proof-threshold", "first-gate", "blu")
        ],"The real stall point is now visible.","You still need the next meeting shaped around it."),
        branch("STALL IS OWNER","ly","\"It usually dies because nobody really owns it.\"","\"Then the next step is owner quality before anything else. Who has to feel this enough to keep it alive?\"",[
          jumpNode("Return to owner map", "stakeholder-and-ownership", "pain-owner", "org"),
          jumpNode("Keep next step honest", "next-step-lock", "soft-deferral", "blu")
        ],"Ownership is the stall point.","You still need the person who can keep momentum alive."),
        branch("STALL UNKNOWN","fl","\"Hard to say. It varies.\"","\"Then we are not ready to act like the path is real. What is your best guess on the first place it could die?\"",[
          jumpNode("Return to path", "decision-architecture", "path", "red"),
          jumpNode("Keep next step honest", "next-step-lock", "soft-deferral", "blu")
        ],"The path still lacks realism.","You still need the most likely failure point.")
      ])
    ]);
  }

  function nextStep(seed){
    return segment("next-step-lock","09","Next-step lock","Earn the move.",true,[
      node("next-step-lock","real-meeting","cl","Lock a real meeting","\"What is the next review worth taking now, and what has to be true for it to count?\"","Use this when the call has earned a specific follow-up.",true,[
        branch("REAL REVIEW","ok","\"" + seed.next + "\"","\"Good. What must that session settle so it moves the deal instead of just updating it?\"",[
          jumpNode("Shape the meeting", "next-step-lock", "exact-shape", "grn"),
          jumpNode("Prepare the handoff", "post-call-routing", "handoff", "blu")
        ],"A real next review is available.","You still need the purpose, date, and right people."),
        branch("EMAIL INSTEAD","ly","\"Send something over and we will circle back.\"","\"Happy to send the right thing. What should that summary help your team decide so the next meeting is real?\"",[
          jumpNode("Use soft deferral rescue", "next-step-lock", "soft-deferral", "org"),
          jumpNode("Clarify the proof bar", "proof-threshold", "real-proof", "blu")
        ],"The next step is still soft.","You still need the decision that email is supposed to unlock."),
        branch("NOT READY","fl","\"We are not ready for a next meeting yet.\"","\"Understood. What is still missing: owner, proof, timing, or internal alignment?\"",[
          jumpNode("Use soft deferral rescue", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Prepare honest handoff", "post-call-routing", "missing-truth", "blu")
        ],"The call has not earned a real meeting yet.","You still need the missing condition in plain language.")
      ]),
      node("next-step-lock","exact-shape","fu","Shape the meeting","\"Who needs to be there, what branch should the meeting pressure-test, and what decision should come out of it?\"","Use this to turn vague follow-up into a real operating meeting.",false,[
        branch("MEETING SHAPED","ok","\"We know the people, the branch, and the decision the meeting should drive.\"","\"Good. Then let us put a date on it while the pressure is still fresh.\"",[
          jumpSegment("Go to Post-call routing", "post-call-routing", "grn"),
          jumpRoom("Open Call Planner", "call-planner", "blu")
        ],"The follow-up now has structure.","You still need the date or calendar owner."),
        branch("WRONG PEOPLE","ly","\"We still are not sure who else should be in it.\"","\"Then the first goal is to get the right owner and blocker into the same room, not to over-design the agenda.\"",[
          jumpNode("Return to owner map", "stakeholder-and-ownership", "wrong-person", "org"),
          jumpNode("Prepare handoff", "post-call-routing", "handoff", "blu")
        ],"The meeting is real in principle but not yet in attendee quality.","You still need the right humans."),
        branch("NO DATE","fl","\"It makes sense, but we are not ready to calendar it yet.\"","\"That is useful. What still has to become true before a date would feel responsible?\"",[
          jumpNode("Use soft deferral rescue", "next-step-lock", "soft-deferral", "red"),
          jumpNode("Prepare missing-truth handoff", "post-call-routing", "missing-truth", "blu")
        ],"The next review is plausible but uncommitted.","You still need the missing condition or the true blocker.")
      ]),
      node("next-step-lock","soft-deferral","ri","If the next step stays soft","\"If we do not calendar the next move now, what exactly needs to become true before this re-opens?\"","Use when they default to polite follow-up.",false,[
        branch("CONDITION NAMED","ok","\"We know what must become true first.\"","\"Good. Then let us capture that condition cleanly so the next touch is sharper, not repetitive.\"",[
          jumpNode("Prepare missing-truth handoff", "post-call-routing", "missing-truth", "grn"),
          jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
        ],"The blocker is now visible.","You still need the owner of that blocker."),
        branch("CONDITION IS OWNER","ly","\"We need the right people in the room first.\"","\"Then the next move is owner capture, not more product. Who is missing?\"",[
          jumpNode("Return to owner map", "stakeholder-and-ownership", "wrong-person", "org"),
          jumpNode("Prepare handoff", "post-call-routing", "handoff", "blu")
        ],"The blocker is attendee quality.","You still need the missing human and the reason for their time."),
        branch("CONDITION STILL UNKNOWN","fl","\"I cannot really say yet.\"","\"Then let us stay honest and write down exactly what is still too thin before we pretend there is momentum.\"",[
          jumpNode("Prepare missing-truth handoff", "post-call-routing", "missing-truth", "red"),
          jumpRoom("Open Call Planner", "call-planner", "blu")
        ],"Momentum is still too soft to trust.","You still need the missing truth in plain language.")
      ])
    ]);
  }

  function post(seed){
    return segment("post-call-routing","10","Post-call routing","Hand off only what helps.",false,[
      node("post-call-routing","handoff","cl","Write the handoff","\"If the next room picked this up cold, what would it need to know in the first 30 seconds?\"","Use this to reduce the call into usable truth.",false,[
        branch("HANDOFF CLEAN","ok","\"" + seed.handoff + "\"","\"Good. Keep only the owner, the pressure, the proof bar, and the next condition.\"",[
          jumpNode("Name what is still missing", "post-call-routing", "missing-truth", "grn"),
          jumpNode("Choose the room route", "post-call-routing", "room-route", "blu")
        ],"The next room can start from signal instead of notes.","You still need the one missing truth to chase."),
        branch("HANDOFF NOISY","ly","\"We have the notes, but they are messy.\"","\"Then throw away what does not change the next move. What is actually usable?\"",[
          jumpNode("Name what is still missing", "post-call-routing", "missing-truth", "org"),
          jumpNode("Choose the room route", "post-call-routing", "room-route", "blu")
        ],"The raw notes exist, but the signal is diluted.","You still need the distilled truth and route."),
        branch("NO HANDOFF HABIT","fl","\"We do not document these calls consistently.\"","\"Then the first fix is discipline. What must be captured every single time before the call disappears?\"",[
          jumpNode("Name what is still missing", "post-call-routing", "missing-truth", "red"),
          jumpNode("Choose the room route", "post-call-routing", "room-route", "blu")
        ],"The handoff system itself is weak.","You still need the minimum capture rule.")
      ]),
      node("post-call-routing","missing-truth","fu","Name what is still missing","\"What is still missing that the next room has to chase directly?\"","Use this so the handoff carries a problem to solve, not just a summary.",false,[
        branch("MISSING TRUTH CLEAR","ok","\"We know the missing truth and who has to surface it next.\"","\"Good. Then the handoff is sharp enough to move.\"",[
          jumpNode("Choose the room route", "post-call-routing", "room-route", "grn"),
          jumpRoom("Open Call Planner", "call-planner", "blu")
        ],"The next room now has a real chase-down target.","You still need the correct room and owner."),
        branch("MISSING OWNER","ly","\"We know the missing truth, but not who can answer it.\"","\"Then the next room must start by getting the right person into the frame.\"",[
          jumpRoom("Open Call Planner", "call-planner", "org"),
          jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
        ],"The missing truth is visible but the owner is not.","You still need the route that best finds that owner."),
        branch("EVERYTHING THIN","fl","\"Too much is still thin.\"","\"Then the next room should be the one most likely to recover the call instead of pretending this is cleaner than it is.\"",[
          jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
          jumpRoom("Open Call Planner", "call-planner", "blu")
        ],"The handoff may need a corrective room, not a continuation room.","You still need the most useful first correction.")
      ]),
      node("post-call-routing","room-route","pr","Choose the next room","\"Which next room gives the team the strongest immediate leverage: shaping the next call, attaching truth to a live deal, or naming the failure pattern?\"","Use this to route with intent.",false,[
        branch("CALL PLANNER","ok","\"The next move is a tighter conversation with a clearer forcing question.\"","\"Then route this to Call Planner with the owner, proof bar, and missing truth.\"",[
          jumpRoom("Open Call Planner", "call-planner", "grn"),
          jumpRoom("Open Deal Workspace", "deal-workspace", "blu")
        ],"The next room is conversational and tactical.","You still need the forcing question."),
        branch("DEAL WORKSPACE","ly","\"There is already a live deal or evaluation here.\"","\"Then attach the what is actually happening to the deal immediately so it does not get separated from the opportunity.\"",[
          jumpRoom("Open Deal Workspace", "deal-workspace", "org"),
          jumpRoom("Open Future Autopsy", "future-autopsy", "blu")
        ],"The truth belongs with a live opportunity.","You still need the most important risk to carry with it."),
        branch("FUTURE AUTOPSY","fl","\"This feels like decorative motion or drift.\"","\"Then route it to Future Autopsy now and name the failure pattern before the deal ages out.\"",[
          jumpRoom("Open Future Autopsy", "future-autopsy", "red"),
          jumpRoom("Open Call Planner", "call-planner", "blu")
        ],"The next room may need to correct drift, not advance motion.","You still need the failure pattern in plain language.")
      ])
    ]);
  }

  function makeFramework(seed){
    return {
      id:seed.id,
      label:seed.label,
      short:seed.label,
      storageKey:seed.storageKey,
      aliases:seed.aliases,
      persona:seed.ownerRoles.split(",")[0],
      platform:seed.systems,
      target:seed.flow,
      proof:seed.proofNeed,
      nextReview:seed.nextReview,
      routeFocus:seed.routeFocus,
      quickActions:[
        { title:"Start on workflow", copy:seed.currentNext, action:jumpNode("Use workflow map", "current-state-truth", "workflow", "blu") },
        { title:"Name the cost", copy:seed.painSurface, action:jumpNode("Pressure-test cost", "pain-and-consequence", "quantify", "org") },
        { title:"Earn the next review", copy:seed.nextReview, action:jumpNode("Lock the meeting", "next-step-lock", "real-meeting", "grn") }
      ],
      interrupts:interrupts(seed),
      segments:[
        opening(seed),
        current(seed),
        pain(seed),
        trigger(seed),
        stakeholder(seed),
        proof(seed),
        vendor(seed),
        decision(seed),
        nextStep(seed),
        post(seed)
      ]
    };
  }

  var seeds = [
    { id:"legal", label:"Legal / Legal Ops / Law Workflow", storageKey:"legal", aliases:["legal","legal ai","legal ops","legal ai / compliance","legal / legal ops / law workflow"], systems:"Ironclad, DocuSign, Word redlines, and outside counsel workflows", asset:"legal workflow", flow:"contract review and legal workflow", shortFlow:"contract review", fallback:"attorneys still do repetitive review by hand and outside counsel absorbs overflow", fallbackCap:"Attorneys still do repetitive review by hand and outside counsel absorbs overflow", scaleSignal:"heavy review volume and expensive lawyer time", scaleMetric:"review volume, lawyer hours, and outside counsel spend", painAxes:"lawyer time, cycle time, outside counsel spend, risk", painSurface:"Senior legal time is tied up in repetitive review while business cycles slow.", triggerPressure:"GC pressure, diligence load, or outside counsel spend is active.", vendorPressure:"Manual review plus current CLM tooling still feels safer than change.", pressureCompare:"manual review, legal ops strain, and outside counsel cost", ownerRoles:"GC, legal ops, IT, security, and procurement all matter here.", proofNeed:"accuracy, audit trail, and clear human control", nextReview:"A scoped review with the GC or legal ops owner.", routeFocus:"Carry review burden, owner map, proof threshold, and next review date.", opening:"Mostly. The process works, but the expensive review still sits with humans or outside firms.", openingNext:"Where does that manual review stack up today, and what still has to be touched by counsel every time?", current:"We have CLM in place, but attorneys still spend too much time reviewing and outside counsel takes overflow.", currentNext:"Where does the workflow break: intake, review, redlines, or getting business teams aligned?", pain:"Senior attorneys are burning time on low-value review and the business still waits too long for answers.", trigger:"The GC is under pressure to modernize, and outside counsel spend is too visible to ignore.", owner:"Legal ops runs the workflow, but the GC and IT both shape whether we can change it.", proof:"We would need to trust the audit trail and accuracy before this goes anywhere.", vendor:"The current workflow is clunky, but it feels safer than changing legal review too quickly.", decision:"Legal ops would evaluate, the GC would sponsor, IT and security would review, and procurement would come in later.", next:"Bring legal ops and the GC into a scoped review next week so we can test the highest-friction contract path.", handoff:"Deal Workspace gets the owner map and workflow pressure. Call Planner gets the next review target. Future Autopsy gets any trust or approval drift." },
    { id:"recruiting", label:"Recruiting / Talent / HR / People Workflow", storageKey:"recruiting", aliases:["recruiting","talent","hr","people","recruiting / talent / hr / people workflow","job&talent","jobtalent","moonhub","heymilo"], systems:"Greenhouse, Ashby, LinkedIn, schedulers, and recruiter coordination workflows", asset:"candidate automation", flow:"candidate screening and recruiter workflow", shortFlow:"recruiting", fallback:"recruiters still step in for screening, scheduling rescue, and candidate coordination", fallbackCap:"Recruiters still step in for screening, scheduling rescue, and candidate coordination", scaleSignal:"high req volume, recruiter load, and slow funnel response", scaleMetric:"open roles, applicant volume, and recruiter load", painAxes:"speed, recruiter bandwidth, candidate quality, drop-off", painSurface:"Recruiters spend too much time triaging applicants and good candidates wait too long.", triggerPressure:"Headcount pressure or hiring velocity targets are forcing the issue.", vendorPressure:"The ATS plus recruiter heroics still feels safer than workflow change.", pressureCompare:"recruiter bandwidth, candidate delay, and hiring manager frustration", ownerRoles:"Talent leadership, recruiting ops, people systems, and finance can all matter.", proofNeed:"screening quality and recruiter time saved on real reqs", nextReview:"A working review with recruiting ops and the hiring owner.", routeFocus:"Carry funnel bottlenecks, owner map, proof need, and next review condition.", opening:"Mostly. The systems handle the basics, but recruiters still rescue the expensive parts of the funnel.", openingNext:"Where does that rescue work happen today: sourcing, screening, scheduling, or coordinator cleanup?", current:"We have the ATS and sourcing tools, but recruiters still spend hours triaging and coordinating by hand.", currentNext:"What part of the candidate flow still demands the most human rescue each week?", pain:"Recruiters are overloaded, candidate speed is slipping, and hiring managers still complain about throughput.", trigger:"Headcount targets moved up and the team cannot keep pace without changing how the funnel runs.", owner:"Talent leadership feels the pain, but recruiting ops and people systems would own the workflow change.", proof:"We would need to see that screening gets faster without lowering candidate quality.", vendor:"The current ATS stack is imperfect, but no one wants to break the candidate experience by moving too fast.", decision:"Talent leadership would sponsor, recruiting ops would evaluate, people systems would review, and finance would watch the hiring economics.", next:"Bring recruiting ops and one real hiring owner into the next session so the next review is anchored to a live req.", handoff:"Deal Workspace gets the funnel pain and owner map. Call Planner gets the next req-centered review. Future Autopsy gets any weak ownership or soft urgency." },
    { id:"product-ux", label:"Product / UX / Enablement / Knowledge Workflow", storageKey:"product-ux", aliases:["product-ux","product / ux","product","ux","enablement","knowledge","product / ux / enablement / knowledge workflow","pendo","parable","scribe","rally uxr"], systems:"research tools, analytics, documentation, and product signal workflows", asset:"research and insight systems", flow:"product feedback, research, and enablement workflow", shortFlow:"product feedback", fallback:"PMs and researchers still have to chase scattered signal and re-synthesize the same truth manually", fallbackCap:"PMs and researchers still have to chase scattered signal and re-synthesize the same truth manually", scaleSignal:"scattered feedback, duplicated research, and manual synthesis", scaleMetric:"research volume, feedback sources, and team synthesis time", painAxes:"speed, decision quality, repeated work, team bandwidth", painSurface:"Teams keep re-learning the same things and product bets move without usable evidence.", triggerPressure:"A launch miss, research debt, or leadership demand for clearer evidence is active.", vendorPressure:"Docs and research tools already exist, so the status quo is defended by habit.", pressureCompare:"research debt, scattered signal, and weak enablement", ownerRoles:"Product leadership, research ops, enablement, and IT can all matter.", proofNeed:"usable signal inside a real release cycle", nextReview:"A working review with product ops and the PM owner.", routeFocus:"Carry the feedback gap, owner map, proof need, and release pressure forward.", opening:"Mostly. We have tools, but the real signal still gets stitched together manually by PMs and researchers.", openingNext:"Where does that stitching happen most painfully today: feedback intake, synthesis, or getting the right signal into decisions?", current:"There are plenty of tools, but insight still lives in too many places and teams re-do the synthesis by hand.", currentNext:"What is the exact part of the research or feedback workflow that still breaks first?", pain:"We waste time rediscovering the same truth and product decisions still move with thin evidence.", trigger:"Leadership wants faster evidence after a miss, and the current workflow cannot keep up.", owner:"Product leadership owns the outcome, but product ops or research ops would own the workflow change.", proof:"We would need to see that signal becomes usable in a live product cycle, not just better organized.", vendor:"The current mix of docs, feedback tools, and habits works just well enough that change feels optional.", decision:"Product leadership would sponsor, product ops or research ops would evaluate, and IT would review where needed.", next:"Bring product ops and one PM owner into the next session so we can pressure-test a live decision cycle.", handoff:"Deal Workspace gets the signal gap and owner map. Call Planner gets the live decision to pressure-test next. Future Autopsy gets any evidence drift." },
    { id:"govtech", label:"GovTech / Compliance / Public-Sector Operations / Trust and Safety", storageKey:"govtech", aliases:["govtech","public sector","compliance","trust and safety","trust-safety","govtech / compliance / public-sector operations / trust and safety","opengov","k-id","kid"], systems:"case management, policy review, trust and safety, and public-sector operations workflows", asset:"decision workflow", flow:"case review and compliance decision workflow", shortFlow:"case review", fallback:"analysts still step in whenever policy, safety, or auditability gets messy", fallbackCap:"Analysts still step in whenever policy, safety, or auditability gets messy", scaleSignal:"manual review load, policy edge cases, and audit pressure", scaleMetric:"case volume, analyst load, and review complexity", painAxes:"queue speed, analyst time, policy consistency, risk", painSurface:"Analysts burn hours on repetitive review and the queue still risks bad outcomes.", triggerPressure:"An audit, policy miss, backlog spike, or executive mandate is forcing attention.", vendorPressure:"Manual review plus point tools still feels safer than changing a sensitive workflow.", pressureCompare:"audit pressure, manual review load, and trust risk", ownerRoles:"Operations, compliance, security, trust and safety, and procurement can all hold pieces.", proofNeed:"a trustworthy decision trail and human override model", nextReview:"A working session with the operations owner and compliance lead.", routeFocus:"Carry the audit risk, queue pressure, owner map, and next gate forward.", opening:"Mostly. The workflow handles the easy cases, but analysts still rescue anything sensitive or policy-heavy.", openingNext:"Where does that rescue happen most often today: policy interpretation, exception handling, or audit review?", current:"The systems move cases, but real judgment still gets stitched together by analysts when the workflow hits a policy edge.", currentNext:"What is the branch of the workflow that still needs the most human judgment or override?", pain:"The queue stays manual in the hardest moments and the team pays in speed, consistency, and risk.", trigger:"Recent pressure around backlog, auditability, or trust and safety made this active now.", owner:"Ops feels the pain, but compliance, security, or trust-and-safety leadership controls whether it can move.", proof:"We would need to see a trustworthy decision trail and a clear human override path.", vendor:"The current workflow is manual, but leadership still treats it as the safest option.", decision:"Operations would evaluate, compliance and security would review, and procurement would come in if the path looks safe.", next:"Bring the operations owner and compliance lead into the next review so we can pressure-test a live case path.", handoff:"Deal Workspace gets the risk pattern and approval map. Call Planner gets the next case review. Future Autopsy gets any trust or governance weakness." },
    { id:"customer-support", label:"Customer Support / Operations / Vertical Workflow Software", storageKey:"cxai", aliases:["customer-support","customer support","customer support / operations","cxai","cx ai","support automation","lorikeet","duckie","shoootin"], systems:"Zendesk, Intercom, or Service Cloud across ticketing, chat, and escalation", asset:"support automation", flow:"support queue and handoff workflow", shortFlow:"support queue", fallback:"the expensive edge cases still end up with supervisors or senior agents", fallbackCap:"The expensive edge cases still end up with supervisors or senior agents", scaleSignal:"15K tickets a month, team of 25, and bots that mostly deflect", scaleMetric:"ticket volume, team size, and human judgment share", painAxes:"speed, cost, quality, burnout", painSurface:"Escalations wreck response time and supervisors end up triaging all day.", triggerPressure:"Ticket spikes, CSAT misses, or launch pressure are forcing the issue.", vendorPressure:"The current bot and macros work just well enough that nobody wants migration pain without a clear upside.", pressureCompare:"handoff pain, queue delay, and automation gaps", ownerRoles:"VP Support, CX Ops, systems owners, and IT all matter here.", proofNeed:"real resolution quality on their own ticket mix", nextReview:"A workflow review with the support owner and systems lead.", routeFocus:"Carry the handoff trigger, queue owner, consequence, and review date forward.", opening:"Mostly. The bot can answer, but the expensive cases still need a human to finish the work.", openingNext:"Where does that handoff happen today, and what usually forces the human step-in?", current:"We are on Intercom, doing serious volume, but the bot still deflects more than it resolves.", currentNext:"Of that queue, what share still needs human judgment or system access?", pain:"Escalations destroy response time and supervisors spend too much of the day triaging.", trigger:"Volume jumped after a product push and the team can no longer absorb it cleanly.", owner:"The VP of Support owns the queue pain, but IT or systems would own the workflow change.", proof:"We would need to see real resolution quality on our own ticket mix before this feels safe.", vendor:"Intercom plus internal macros works well enough that no one wants migration pain without a clear win.", decision:"Support would evaluate, IT would review, and procurement would follow after security if the workflow case is real.", next:"Bring the VP of Support and systems lead into the next review so we can pressure-test a live handoff path.", handoff:"Deal Workspace gets the queue pain and owner map. Call Planner gets the next workflow review. Future Autopsy gets any drift around trust or urgency." },
    { id:"sales-revenue", label:"Sales / Revenue Intelligence", storageKey:"revenue", aliases:["sales-revenue","sales / revenue","sales / revenue intelligence","revenue","revintel","sales intelligence","sybill","harpin ai","attention","actively ai"], systems:"Salesforce, call recording, deal inspection, and forecast workflows", asset:"revenue signal", flow:"pipeline inspection and rep guidance workflow", shortFlow:"pipeline review", fallback:"managers still translate signal manually in forecast calls and one-on-ones", fallbackCap:"Managers still translate signal manually in forecast calls and one-on-ones", scaleSignal:"slipping deals, hidden risk, and forecast guesswork", scaleMetric:"active deals, manager inspection load, and forecast variance", painAxes:"forecast trust, rep time, pipeline quality, revenue risk", painSurface:"Forecast misses break trust and reps still spend time in CRM instead of selling.", triggerPressure:"Board pressure, a missed quarter, or an inspection failure is making this active.", vendorPressure:"Existing point tools do pieces of the job, but none of them make the forecast trustworthy end to end.", pressureCompare:"forecast drift, rep admin, and hidden deal risk", ownerRoles:"Sales leadership, RevOps, IT, and finance all shape the decision.", proofNeed:"visible rep behavior change and more credible pipeline truth", nextReview:"A live review with RevOps and the frontline manager.", routeFocus:"Carry the risk pattern, owner map, and next inspection step forward.", opening:"Mostly. The systems capture activity, but managers still have to interpret what is real by hand.", openingNext:"Where does that manual interpretation happen most painfully: forecast calls, one-on-ones, or deal reviews?", current:"We have the tools, but forecasting is still a guess and the real deal risk shows up too late.", currentNext:"What part of pipeline truth still depends most on manager judgment instead of usable signal?", pain:"Forecast misses and wasted rep time are making the current process hard to defend.", trigger:"After a miss, leadership wants to know what is real before the next board cycle.", owner:"Sales leadership feels the pain, but RevOps and finance influence whether this can move.", proof:"We would need to see that the signal actually changes rep behavior and forecast trust.", vendor:"The current mix of Salesforce, Gong, and spreadsheets is clumsy, but it is familiar enough to defend.", decision:"Sales leadership would sponsor, RevOps would evaluate, IT would review, and finance would care about forecast impact.", next:"Bring RevOps and the frontline manager into the next inspection review so we can pressure-test a live deal set.", handoff:"Deal Workspace gets the risk pattern and owner map. Call Planner gets the next inspection target. Future Autopsy gets any truth debt or forecast drift." },
    { id:"manufacturing", label:"Manufacturing / Supply Chain / Engineering", storageKey:"manufacturing", aliases:["manufacturing","supply chain","manufacturing / supply chain","manufacturing / supply chain / engineering","engineering","supply chain ai","vantive","craft","caddi","shapr3d"], systems:"ERP, supplier intelligence, planning tools, and disruption monitoring workflows", asset:"resilience systems", flow:"supply-chain resilience and supplier intelligence workflow", shortFlow:"supply-chain workflow", fallback:"operators and procurement teams still stitch together the risk picture manually", fallbackCap:"Operators and procurement teams still stitch together the risk picture manually", scaleSignal:"N-tier blind spots, supplier risk, and reactive firefighting", scaleMetric:"supplier footprint, disruption frequency, and response load", painAxes:"speed, planning confidence, supplier risk, operational cost", painSurface:"Teams learn about disruptions late and scramble without a usable scenario plan.", triggerPressure:"A disruption, cost spike, or resilience mandate is making the workflow visible now.", vendorPressure:"Spreadsheets, ERP views, and alert tools feel familiar even when they are reactive.", pressureCompare:"supplier risk, reactive firefighting, and weak scenario planning", ownerRoles:"Supply chain, procurement, operations, manufacturing, IT, and finance all matter.", proofNeed:"scenario realism or supplier-risk signal on their own network", nextReview:"A working session with supply chain ops and procurement.", routeFocus:"Carry the disruption case, current owner, proof burden, and review path forward.", opening:"Mostly. The systems show pieces of the network, but the real risk picture still gets stitched together by humans.", openingNext:"Where does that stitching happen today: supplier monitoring, disruption planning, or cross-functional response?", current:"We have data and tools, but the real resilience picture still needs manual stitching when something starts to move.", currentNext:"What part of the workflow still breaks first when a supplier or program risk surfaces?", pain:"The organization sees disruptions too late and loses time because planning is still reactive.", trigger:"A disruption, rising cost, or resilience mandate forced this out of the background.", owner:"Supply chain or operations feels the pain, but procurement and finance may control whether the change moves.", proof:"We would need to see either usable scenario planning or trustworthy supplier-risk signal on our own network.", vendor:"The current mix of ERP, spreadsheets, and alerting is weak, but it feels familiar enough to defend.", decision:"Supply chain would evaluate, procurement and operations would shape the workflow case, IT would review, and finance would care about consequence.", next:"Bring supply chain ops and procurement into the next review so we can pressure-test one live disruption path.", handoff:"Deal Workspace gets the disruption pattern and owner map. Call Planner gets the next review target. Future Autopsy gets any reactive drift or missing proof." },
    { id:"data-intelligence", label:"Data / Intelligence Infrastructure", storageKey:"data-intelligence", aliases:["data-intelligence","data / intelligence","data / intelligence infrastructure","data infrastructure","newscatcher","cdp","customer data platform"], systems:"external data feeds, monitoring, retrieval layers, and downstream intelligence workflows", asset:"intelligence inputs", flow:"external data ingestion and intelligence delivery workflow", shortFlow:"data feed", fallback:"teams still patch missing or stale signal manually whenever the feed goes thin", fallbackCap:"Teams still patch missing or stale signal manually whenever the feed goes thin", scaleSignal:"coverage gaps, freshness pressure, and downstream dependency", scaleMetric:"feed coverage, freshness expectations, and consuming-team dependency", painAxes:"freshness, trust, downstream risk, team bandwidth", painSurface:"When external signal is late or thin, every downstream monitor or AI product gets weaker.", triggerPressure:"A new intelligence use case, compliance need, or model dependency made freshness non-negotiable.", vendorPressure:"The current data layer is noisy but familiar, and teams are wary of changing the fuel line.", pressureCompare:"freshness, coverage, and downstream system weakness", ownerRoles:"Platform engineering, product, risk, security, and downstream business teams can all matter.", proofNeed:"freshness, coverage, and downstream usefulness", nextReview:"A working review with the platform owner and the main consuming team.", routeFocus:"Carry the data dependency, missing signal, proof need, and consuming owner forward.", opening:"Mostly. We have feeds, but teams still patch missing or stale signal manually when the data layer goes thin.", openingNext:"Where does that patching happen first today: source coverage, freshness, or downstream confidence?", current:"The data layer exists, but the teams downstream still have to compensate manually when coverage or freshness breaks.", currentNext:"What is the first visible consequence when the data feed is late or thin?", pain:"Weak external signal drags down every downstream workflow that depends on it.", trigger:"A new intelligence use case or compliance requirement made data freshness impossible to ignore.", owner:"The platform team owns the feed, but product, risk, or the consuming team controls whether change matters.", proof:"We would need to trust freshness, coverage, and downstream usefulness before the switch feels safe.", vendor:"The current feed is imperfect, but no one wants to move the fuel line without a clear confidence gain.", decision:"Platform engineering would evaluate, the consuming team would pressure-test it, and security or risk would weigh in where needed.", next:"Bring the platform owner and the main consuming team into the next review so we can test one live dependency path.", handoff:"Deal Workspace gets the dependency map and owner path. Call Planner gets the next technical review. Future Autopsy gets any stale-signal or trust risk." },
    { id:"ai-native", label:"AI-Native Buyer Discovery Framework", storageKey:"ai-native", aliases:["ai-native","ai native","ai-native buyer discovery framework","ai objections","ai-objections"], systems:"AI stack, governance controls, human review, and rollout workflows", asset:"AI operating model", flow:"AI adoption, governance, and trust workflow", shortFlow:"AI rollout", fallback:"humans still rescue accuracy, governance, and edge-case decisions whenever trust breaks", fallbackCap:"Humans still rescue accuracy, governance, and edge-case decisions whenever trust breaks", scaleSignal:"adoption drag, governance burden, and unresolved trust", scaleMetric:"scope of rollout, trust burden, and governance load", painAxes:"trust, control, adoption, governance", painSurface:"The team wants AI leverage, but trust, control, and accountability are still unresolved.", triggerPressure:"Leadership wants AI in production, but the organization does not yet trust the operating model.", vendorPressure:"Pilots, policy decks, and manual oversight feel safer than committing to a real AI operating model.", pressureCompare:"governance, trust, and production readiness", ownerRoles:"Business leadership, security, legal, IT, and the target function all matter.", proofNeed:"accuracy, control, accountability, and safe rollout", nextReview:"A working review with the functional owner and the governance owner.", routeFocus:"Carry the trust blocker, governance path, proof demand, and next review forward.", opening:"Mostly. There is AI interest everywhere, but humans still have to rescue the moments where trust breaks.", openingNext:"Where does that rescue happen today: accuracy, control, governance, or adoption?", current:"Pilots and tools exist, but the real operating model still depends on humans to keep the risk contained.", currentNext:"What is the first branch where trust breaks and a human has to step back in?", pain:"The promise is attractive, but the unresolved trust burden keeps AI from becoming a real operating system.", trigger:"Leadership wants production movement now, but governance and trust are still gating it.", owner:"Innovation or business leadership sponsors it, but security, legal, and functional owners control the path.", proof:"We would need to trust accuracy, accountability, and control before this could move safely.", vendor:"The current path is still a mix of pilots, policies, and cautious manual review.", decision:"Business leadership would sponsor, but security, legal, IT, and the target function all hold real veto power.", next:"Bring the functional owner and governance owner into the next review so the next meeting is about a real control path, not abstract AI excitement.", handoff:"Deal Workspace gets the trust blocker and owner map. Call Planner gets the next governance review. Future Autopsy gets any adoption or control drift." }
  ];

  var registry = seeds.map(function(seed){
    return {
      id:seed.id,
      label:seed.label,
      storageKey:seed.storageKey,
      aliases:seed.aliases
    };
  });

  var frameworks = {};
  seeds.forEach(function(seed){
    frameworks[seed.id] = makeFramework(seed);
  });

  window.DISCOVERY_SEGMENT_RUNTIME = {
    version:"2026-04-11",
    schemaVersion:"segment-jump-complete-v1",
    operatingMode:"on-call-primary",
    registry:registry,
    frameworks:frameworks
  };
})();
