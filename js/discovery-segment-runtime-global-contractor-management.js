(function () {
  // Global Contractor Management / EOR override. The base runtime
  // generates the full new-format framework from the
  // "global-contractor-management" seed; this thin override keeps those
  // base-generated segments and replaces the generic interrupts with
  // domain-tailored recover prompts (Deel / Remote / Papaya / Velocity
  // Global world: classification risk, permanent-establishment exposure,
  // multi-jurisdiction compliance, contractor payments). Jump targets
  // reuse base node slugs so every one resolves.
  var rt = window.DISCOVERY_SEGMENT_RUNTIME;
  if (!rt || !rt.frameworks || !rt.frameworks["global-contractor-management"]) return;

  function action(label, target, tone) {
    return { label: label, target: target, tone: tone || "blu" };
  }
  function jumpNode(label, segmentId, slug, tone) {
    return action(label, "node:" + segmentId + "--" + slug, tone);
  }

  var base = rt.frameworks["global-contractor-management"];

  rt.frameworks["global-contractor-management"] = Object.assign({}, base, {
    interrupts: [
      {
        id: "just-contractors",
        label: "We just use contractors, classification is not our problem",
        reply:
          "That is exactly where the risk hides. How confident are you those contractors would not be reclassified as employees in an audit, in the countries where they actually work?",
        actions: [
          jumpNode("Quantify the exposure", "pain-and-consequence", "quantify", "org"),
          jumpNode("Map the workflow", "current-state-truth", "workflow", "blu")
        ]
      },
      {
        id: "already-on-deel",
        label: "We already use Deel / Remote",
        reply:
          "Good. Which countries and worker types does it actually cover end to end, and where do you still fall back to local providers or spreadsheets?",
        actions: [
          jumpNode("Surface the incumbent", "current-vendor-and-displacement", "build", "red"),
          jumpNode("Return to the pain", "pain-and-consequence", "pressure", "blu")
        ]
      },
      {
        id: "legal-handles-it",
        label: "Legal already handles compliance",
        reply:
          "By hand, per jurisdiction? What happens when you enter the next country, or the contractor count doubles, and that manual review cannot keep pace?",
        actions: [
          jumpNode("Find the real owner", "stakeholder-and-ownership", "wrong-person", "red"),
          jumpNode("Map the approval path", "decision-architecture", "path", "blu")
        ]
      },
      {
        id: "price-per-worker",
        label: "Just tell me the price per worker",
        reply:
          "Price follows your country mix and classification risk, not a flat seat. Which country or worker type carries the most exposure — that is the one worth pricing honestly first.",
        actions: [
          jumpNode("Map the decision path", "decision-architecture", "path", "blu"),
          jumpNode("Set the proof bar", "proof-threshold", "real-proof", "pur")
        ]
      },
      {
        id: "not-expanding",
        label: "We are not expanding right now",
        reply:
          "Misclassification risk does not wait for expansion — it accrues on the contractors you already pay. How many are there, in how many countries, classified by whom?",
        actions: [
          jumpNode("Quantify current risk", "pain-and-consequence", "pressure", "org"),
          jumpNode("Keep the next step honest", "next-step-lock", "soft-deferral", "blu")
        ]
      }
    ]
  });
})();
