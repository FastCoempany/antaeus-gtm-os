(function () {
  // CX AI override — the base runtime (discovery-segment-runtime.js)
  // already generates the full new-format framework for the
  // "customer-support" seed (10 segments / 3 nodes / 3 branches, with
  // resolving jump targets). This file used to override that with an
  // older `resp`-format that the new-stack loader could not read, which
  // left the framework empty. It is now a THIN override that keeps the
  // base-generated segments and only replaces the generic interrupts
  // with CX-AI-tailored recover prompts (momos / yoobic / Decagon /
  // Sierra / Intercom Fin world: AI carries the routine, the expensive
  // edge cases still bounce to a human, the question is where trust
  // breaks). Jump targets reuse base node slugs so every one resolves.
  var rt = window.DISCOVERY_SEGMENT_RUNTIME;
  if (!rt || !rt.frameworks || !rt.frameworks["customer-support"]) return;

  function action(label, target, tone) {
    return { label: label, target: target, tone: tone || "blu" };
  }
  function jumpNode(label, segmentId, slug, tone) {
    return action(label, "node:" + segmentId + "--" + slug, tone);
  }

  var base = rt.frameworks["customer-support"];

  rt.frameworks["customer-support"] = Object.assign({}, base, {
    interrupts: [
      {
        id: "bot-handles-it",
        label: "The bot already handles most of it",
        reply:
          "Deflection is not resolution. Where do the expensive tickets still bounce to a supervisor or a senior agent, and what forces that handoff?",
        actions: [
          jumpNode("Map the handoff", "current-state-truth", "workflow", "blu"),
          jumpNode("Quantify the rescue", "pain-and-consequence", "quantify", "org")
        ]
      },
      {
        id: "wrong-answers-fear",
        label: "We worry it will give customers wrong answers",
        reply:
          "That is the right fear, not a blocker. The useful question is which queue a wrong answer is most expensive in, and what control would make the workflow safe in one narrow lane first.",
        actions: [
          jumpNode("Set the proof bar", "proof-threshold", "early-demo", "pur"),
          jumpNode("Name the cost", "pain-and-consequence", "pressure", "org")
        ]
      },
      {
        id: "already-on-fin",
        label: "We already have Fin / Zendesk AI / built our own",
        reply:
          "Good. What part of it actually removes supervisor rescue, and which queue still refuses to stay solved even with the build in place?",
        actions: [
          jumpNode("Surface the incumbent", "current-vendor-and-displacement", "build", "red"),
          jumpNode("Return to the pain", "pain-and-consequence", "pressure", "blu")
        ]
      },
      {
        id: "show-resolution-rate",
        label: "Just show me the resolution rate",
        reply:
          "The only number that matters is the one off your worst queue. Pick the edge case that bounces to humans most and we will map what real resolution there would take.",
        actions: [
          jumpNode("Define real proof", "proof-threshold", "real-proof", "blu"),
          jumpNode("Open the worst queue", "current-state-truth", "workflow", "org")
        ]
      },
      {
        id: "not-a-priority",
        label: "Support is not a budget priority this quarter",
        reply:
          "Understood. What would have to break for that to change — a CSAT miss, a volume spike after a launch, or escalations leadership starts noticing?",
        actions: [
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu"),
          jumpNode("Find who feels it", "stakeholder-and-ownership", "wrong-person", "red")
        ]
      }
    ]
  });
})();
