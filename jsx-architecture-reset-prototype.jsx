import { useEffect, useMemo, useState } from "react";

function alpha(hex, opacity) {
  const safe = hex.replace("#", "");
  const normalized = safe.length === 3 ? safe.split("").map((part) => part + part).join("") : safe;
  const int = parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const T = {
  color: {
    bg: "#070B14",
    shell: "#0B1020",
    panel: "#131A28",
    panel2: "#172033",
    border: alpha("#FFFFFF", 0.1),
    text: "#F8FAFC",
    text2: "#CBD5E1",
    text3: "#94A3B8",
    gold: "#D4A574",
    goldDark: "#B9864D",
    teal: "#2DD4BF",
    blue: "#60A5FA",
    green: "#22C55E",
    amber: "#F59E0B",
    red: "#EF4444",
  },
  radius: { sm: 10, md: 16, lg: 22, full: 999 },
  shadow: {
    sm: `0 10px 30px ${alpha("#020617", 0.18)}`,
    md: `0 24px 60px ${alpha("#020617", 0.28)}`,
  },
};

const STATUS = {
  empty: { label: "Not live", color: T.color.text3, bg: alpha("#94A3B8", 0.1), border: alpha("#94A3B8", 0.22) },
  live: { label: "Live", color: T.color.teal, bg: alpha("#2DD4BF", 0.1), border: alpha("#2DD4BF", 0.28) },
  risk: { label: "At risk", color: T.color.amber, bg: alpha("#F59E0B", 0.1), border: alpha("#F59E0B", 0.28) },
  blocked: { label: "Blocked", color: T.color.red, bg: alpha("#EF4444", 0.1), border: alpha("#EF4444", 0.28) },
  complete: { label: "Complete", color: T.color.green, bg: alpha("#22C55E", 0.1), border: alpha("#22C55E", 0.28) },
};

const FAMILY = {
  activation: { label: "Activation", accent: T.color.teal },
  targeting: { label: "Targeting", accent: T.color.gold },
  signal: { label: "Signal + Motion", accent: T.color.blue },
  execution: { label: "Execution + Proof", accent: T.color.red },
  synthesis: { label: "Synthesis + Handoff", accent: T.color.green },
};

const COMMAND_MODES = [
  { id: "brief", label: "Brief" },
  { id: "grid", label: "Grid" },
  { id: "queue", label: "Queue" },
];

const LAYERS = [
  { id: "command", label: "Command" },
  { id: "sheet", label: "Sheet" },
  { id: "workspace", label: "Workspace" },
  { id: "graph", label: "Graph" },
];

const OBJECTS = [
  {
    id: "activation-01",
    family: "activation",
    short: "Workspace",
    title: "Founder week-one workspace",
    status: "live",
    pressure: "The workspace is real enough to teach, but motion logging is still missing.",
    nextMove: "Log the first live motion so the dashboard can stop inferring activity.",
    downstream: "This changes Welcome, Dashboard, Readiness, and the handoff kit.",
    queueScore: 72,
    historicalEntry: "Welcome",
    commandSummary: "Week-one state is live. The system knows the targeting and deal layers, but motion proof is still thin.",
    sheetNarrative: "Activation truth belongs to one workspace object. Onboarding, Welcome, and Dashboard become lenses over the same activation object instead of separate setup pages.",
    graphNodes: ["Workspace", "ICP", "Signals", "Deals", "Motion log"],
    lenses: [
      { id: "welcome", label: "Welcome", purpose: "Orient the operator and rank the first real work.", preservedEntry: true, writesBack: "Workspace activation context" },
      { id: "dashboard", label: "Dashboard", purpose: "Translate all upstream truth into a ranked morning brief.", preservedEntry: true, writesBack: "Command snapshot and delta memory" },
      { id: "onboarding", label: "Onboarding", purpose: "Capture the first truth, then get out of the way.", preservedEntry: true, writesBack: "Activation baseline" },
    ],
  },
  {
    id: "icp-01",
    family: "targeting",
    short: "ICP",
    title: "Mid-market healthcare IT wedge",
    status: "risk",
    pressure: "The wedge exists, but company size and trigger specificity are still thin.",
    nextMove: "Tighten the wedge before sourcing more accounts into it.",
    downstream: "This should sharpen Territory, Sourcing, Outbound, and Discovery.",
    queueScore: 88,
    historicalEntry: "ICP Studio",
    commandSummary: "One viable ICP exists. It is useful, but still too founder-dependent to scale cleanly.",
    sheetNarrative: "Targeting truth should not live inside one form page. The ICP object becomes durable system truth that downstream lenses read and challenge.",
    graphNodes: ["ICP", "Industry", "Company size", "Primary buyer", "Trigger"],
    lenses: [
      { id: "icp-studio", label: "ICP Studio", purpose: "Define the wedge and score its sharpness.", preservedEntry: true, writesBack: "Targeting truth" },
      { id: "territory-architect", label: "Territory Architect", purpose: "Turn the ICP into theses and market slices.", preservedEntry: true, writesBack: "Territory theses" },
      { id: "sourcing-workbench", label: "Sourcing Workbench", purpose: "Pressure-test whether real accounts fit the wedge.", preservedEntry: true, writesBack: "Account fit evidence" },
    ],
  },
  {
    id: "account-01",
    family: "signal",
    short: "Account",
    title: "Cascadia Health Network",
    status: "live",
    pressure: "The account is hot, but the angle still needs sharpening before outreach.",
    nextMove: "Use Signal Console, then carry the same account into Outbound or Cold Call without restating context.",
    downstream: "This should steer Signal Console, Outbound Studio, LinkedIn Playbook, and Cold Call Studio.",
    queueScore: 96,
    historicalEntry: "Signal Console",
    commandSummary: "Multiple live signals are converging on one account. The system should rank this account, not leave the user inside a pile of signals.",
    sheetNarrative: "Signals, owner fit, research freshness, and messaging should belong to the account object. Modules become lenses over that object, not separate silos.",
    graphNodes: ["Account", "Signals", "Motion", "Contact", "Call"],
    lenses: [
      { id: "signal-console", label: "Signal Console", purpose: "Collapse noise into one ranked account read.", preservedEntry: true, writesBack: "Account heat and evidence" },
      { id: "outbound-studio", label: "Outbound Studio", purpose: "Turn account pressure into a credible first motion.", preservedEntry: true, writesBack: "Message angle and touch plan" },
      { id: "linkedin-playbook", label: "LinkedIn Playbook", purpose: "Choose the right social motion for this account now.", preservedEntry: true, writesBack: "Channel motion" },
      { id: "cold-call-studio", label: "Cold Call Studio", purpose: "Move from signal to call execution without losing the thread.", preservedEntry: true, writesBack: "Call notes and outcome" },
    ],
  },
  {
    id: "deal-01",
    family: "execution",
    short: "Deal",
    title: "Vantive platform expansion",
    status: "risk",
    pressure: "The deal is active, but the proof path and champion pressure are unstable.",
    nextMove: "Run Future Autopsy now, then move into the exact corrective lens.",
    downstream: "This should coordinate Deal Workspace, Discovery Studio, Future Autopsy, PoC Framework, and Advisor Deploy.",
    queueScore: 92,
    historicalEntry: "Deal Workspace",
    commandSummary: "The deal is not dying yet, but its stage label is more optimistic than the underlying proof.",
    sheetNarrative: "The deal object should carry discovery truth, pressure, proof state, advisor history, and next-step ownership. Execution lenses should stop duplicating that truth.",
    graphNodes: ["Deal", "Champion", "Proof", "Advisor", "Next step"],
    lenses: [
      { id: "deal-workspace", label: "Deal Workspace", purpose: "Hold stage, pressure, and recovery truth.", preservedEntry: true, writesBack: "Pipeline truth" },
      { id: "future-autopsy", label: "Future Autopsy", purpose: "Pressure-test the deal and name the likely death pattern.", preservedEntry: true, writesBack: "Primary failure hypothesis" },
      { id: "discovery-studio", label: "Discovery Studio", purpose: "Run the live call and advance the deal honestly.", preservedEntry: true, writesBack: "Call truth and worked moves" },
      { id: "advisor-deploy", label: "Advisor Deploy", purpose: "Use the right relationship at the right moment.", preservedEntry: true, writesBack: "Advisor deployment history" },
    ],
  },
  {
    id: "proof-01",
    family: "execution",
    short: "Proof",
    title: "PoC proof motion",
    status: "live",
    pressure: "The proof plan exists, but readout ownership is still fragile.",
    nextMove: "Lock the readout owner and boundary conditions before the PoC creates fake momentum.",
    downstream: "This changes PoC Framework, Deal Workspace, Readiness, and the final handoff.",
    queueScore: 81,
    historicalEntry: "PoC Framework",
    commandSummary: "Proof is underway. The system should make the readout and commercial tie-back obvious before activity gets mistaken for evidence.",
    sheetNarrative: "Proof is its own object, tightly linked to the deal but not buried inside it. That lets Antaeus preserve proof standards as first-class truth.",
    graphNodes: ["Proof", "Success criteria", "Readout owner", "Deal", "Readiness"],
    lenses: [
      { id: "poc-framework", label: "PoC Framework", purpose: "Define the proof standard and run the proof plan.", preservedEntry: true, writesBack: "Proof state" },
      { id: "readiness", label: "Readiness", purpose: "Translate proof truth into operating confidence.", preservedEntry: true, writesBack: "System verdict" },
      { id: "deal-workspace-proof", label: "Deal Workspace", purpose: "Carry proof state back into the live deal.", preservedEntry: false, writesBack: "Pipeline recovery truth" },
    ],
  },
  {
    id: "handoff-01",
    family: "synthesis",
    short: "Handoff",
    title: "Founder handoff kit",
    status: "complete",
    pressure: "The handoff is almost ready, but weak-source areas are still visible.",
    nextMove: "Close the remaining weak-source gaps before calling the handoff kit founder-proof.",
    downstream: "This changes Playbook, Readiness, Quota Workback, and the operator's trust in the system.",
    queueScore: 63,
    historicalEntry: "Founding GTM Playbook",
    commandSummary: "The system can synthesize a believable handoff, but only because the upstream objects are now rich enough to support it.",
    sheetNarrative: "Handoff should be the synthesis object at the top of the system. It is the output of all upstream truth, not a manually stitched document.",
    graphNodes: ["Handoff", "Readiness", "Quota", "Deal motion", "ICP"],
    lenses: [
      { id: "playbook", label: "Playbook / Handoff Kit", purpose: "Assemble the founder-to-operator transfer in one exportable object.", preservedEntry: true, writesBack: "Handoff readiness" },
      { id: "quota-workback", label: "Quota Workback", purpose: "Translate the strategy into operating pressure.", preservedEntry: true, writesBack: "Execution targets" },
      { id: "readiness-handoff", label: "Readiness", purpose: "Expose the weakest truth before handoff goes out.", preservedEntry: false, writesBack: "System confidence" },
    ],
  },
];

const ARCHITECTURE_TRUTHS = [
  "Modules stay as preserved named entry points, but they become lenses over shared objects.",
  "The command layer ranks work first. Users should not have to decide which module before they know which object is under pressure.",
  "Signal Console stays the signal engine. Future Autopsy stays a preserved premium asset.",
  "The four layers are Command, Sheet, Workspace, and Graph. Graph stays rare and diagnostic.",
];

const ARCHITECTURE_REJECTIONS = [
  "Do not collapse beta into one giant CRM-style record page.",
  "Do not dissolve every module before beta evidence exists.",
  "Do not let graph views become the daily operating surface.",
  "Do not organize the product around furniture instead of object pressure.",
];

function serif(color, size, extra) {
  return { fontFamily: '"DM Serif Display", Georgia, serif', color, fontSize: size, letterSpacing: "-0.03em", ...extra };
}

function body(color, size, extra) {
  return { fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color, fontSize: size, ...extra };
}

function mono(color, size, extra) {
  return { fontFamily: 'Monaco, Consolas, "Liberation Mono", monospace', color, fontSize: size, ...extra };
}

function Pill({ children, tone = "neutral" }) {
  const toneMap = {
    neutral: { bg: alpha("#FFFFFF", 0.06), border: T.color.border, color: T.color.text2 },
    gold: { bg: alpha(T.color.gold, 0.12), border: alpha(T.color.gold, 0.28), color: T.color.gold },
    blue: { bg: alpha(T.color.blue, 0.12), border: alpha(T.color.blue, 0.28), color: T.color.blue },
    green: { bg: alpha(T.color.green, 0.12), border: alpha(T.color.green, 0.28), color: T.color.green },
    red: { bg: alpha(T.color.red, 0.12), border: alpha(T.color.red, 0.28), color: T.color.red },
  }[tone];

  return (
    <span
      style={{
        ...mono(toneMap.color, 11, { textTransform: "uppercase", letterSpacing: "0.08em" }),
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: T.radius.full,
        border: `1px solid ${toneMap.border}`,
        background: toneMap.bg,
      }}
    >
      {children}
    </span>
  );
}

function ActionButton({ children, kind = "primary", onClick }) {
  const config = kind === "primary"
    ? { bg: T.color.gold, color: T.color.bg, border: alpha(T.color.gold, 0.35) }
    : { bg: alpha("#FFFFFF", 0.06), color: T.color.text2, border: T.color.border };

  return (
    <button
      onClick={onClick}
      style={{
        ...body(config.color, 14, { fontWeight: 700, cursor: "pointer" }),
        padding: "11px 14px",
        borderRadius: T.radius.sm,
        border: `1px solid ${config.border}`,
        background: config.bg,
      }}
    >
      {children}
    </button>
  );
}

function Segmented({ items, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", padding: 4, gap: 4, borderRadius: T.radius.full, background: alpha("#FFFFFF", 0.05), border: `1px solid ${T.color.border}` }}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              ...mono(active ? T.color.gold : T.color.text3, 11, { textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }),
              padding: "8px 12px",
              borderRadius: T.radius.full,
              border: "none",
              background: active ? alpha(T.color.gold, 0.14) : "transparent",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function Surface({ children, accent, style }) {
  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${alpha("#FFFFFF", 0.035)}, ${alpha("#FFFFFF", 0.02)})`,
        border: `1px solid ${accent ? alpha(accent, 0.24) : T.color.border}`,
        borderRadius: T.radius.lg,
        boxShadow: T.shadow.sm,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ padding: 14, borderRadius: T.radius.md, border: `1px solid ${T.color.border}`, background: alpha("#FFFFFF", 0.03) }}>
      <div style={mono(T.color.text3, 11, { textTransform: "uppercase", letterSpacing: "0.08em" })}>{label}</div>
      <div style={body(T.color.text, 15, { marginTop: 10, lineHeight: 1.6, fontWeight: 700 })}>{value}</div>
    </div>
  );
}

function QueueList({ items, selectedId, onSelect }) {
  return (
    <Surface style={{ padding: 18 }}>
      <div style={mono(T.color.gold, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 })}>Ranked work queue</div>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, index) => {
          const family = FAMILY[item.family];
          const status = STATUS[item.status];
          const active = item.id === selectedId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                borderRadius: T.radius.md,
                border: `1px solid ${active ? alpha(family.accent, 0.45) : T.color.border}`,
                background: active ? alpha(family.accent, 0.1) : alpha("#FFFFFF", 0.03),
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={mono(T.color.text3, 11, { textTransform: "uppercase", letterSpacing: "0.08em" })}>{String(index + 1).padStart(2, "0")} {item.short}</div>
                <Pill tone={item.status === "blocked" ? "red" : item.status === "complete" ? "green" : item.status === "live" ? "blue" : "gold"}>{status.label}</Pill>
              </div>
              <div style={serif(T.color.text, 26, { marginTop: 8 })}>{item.title}</div>
              <div style={body(T.color.text2, 14, { marginTop: 8, lineHeight: 1.6 })}>{item.pressure}</div>
              <div style={body(T.color.gold, 14, { marginTop: 10, fontWeight: 700 })}>{item.nextMove}</div>
            </button>
          );
        })}
      </div>
    </Surface>
  );
}

function BriefMode({ selected, queue }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Surface accent={FAMILY[selected.family].accent} style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={mono(T.color.gold, 11, { textTransform: "uppercase", letterSpacing: "0.12em" })}>Command brief</div>
            <div style={serif(T.color.text, 44, { marginTop: 10, maxWidth: 780 })}>{selected.title}</div>
            <div style={body(T.color.text2, 17, { marginTop: 12, maxWidth: 780, lineHeight: 1.7 })}>{selected.commandSummary}</div>
          </div>
          <Pill tone="gold">{FAMILY[selected.family].label}</Pill>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 22 }}>
          <Metric label="Pressure" value={selected.pressure} />
          <Metric label="Best next move" value={selected.nextMove} />
          <Metric label="Historical entry" value={selected.historicalEntry} />
          <Metric label="Downstream" value={selected.downstream} />
        </div>
      </Surface>
      <Surface style={{ padding: 18 }}>
        <div style={mono(T.color.blue, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 })}>Why this is different from the old app</div>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            "Old: pick a module, then look for the object inside it.",
            "New: rank the object first, then choose the right lens.",
            "Old: duplicate context across modules.",
            "New: carry one object through Signal Console, Future Autopsy, Discovery Studio, PoC, and Handoff without restating it.",
          ].map((line) => (
            <div key={line} style={body(T.color.text2, 15, { lineHeight: 1.6 })}>{line}</div>
          ))}
        </div>
      </Surface>
      <Surface style={{ padding: 18 }}>
        <div style={mono(T.color.text3, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 })}>Rest of the queue</div>
        <div style={{ display: "grid", gap: 12 }}>
          {queue.filter((item) => item.id !== selected.id).slice(0, 3).map((item) => (
            <div key={item.id} style={{ display: "grid", gap: 6, padding: 14, borderRadius: T.radius.md, border: `1px solid ${T.color.border}`, background: alpha("#FFFFFF", 0.03) }}>
              <div style={body(T.color.text, 16, { fontWeight: 700 })}>{item.title}</div>
              <div style={body(T.color.text2, 14, { lineHeight: 1.6 })}>{item.nextMove}</div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function GridMode({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
      {items.map((item) => (
        <Surface key={item.id} accent={FAMILY[item.family].accent} style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Pill tone="gold">{FAMILY[item.family].label}</Pill>
            <Pill tone={item.status === "complete" ? "green" : item.status === "live" ? "blue" : item.status === "blocked" ? "red" : "gold"}>{STATUS[item.status].label}</Pill>
          </div>
          <div style={serif(T.color.text, 28, { marginTop: 12 })}>{item.title}</div>
          <div style={body(T.color.text2, 14, { marginTop: 10, lineHeight: 1.7 })}>{item.pressure}</div>
          <div style={body(T.color.gold, 14, { marginTop: 12, fontWeight: 700 })}>{item.nextMove}</div>
        </Surface>
      ))}
    </div>
  );
}

function QueueMode({ items }) {
  return (
    <Surface style={{ padding: 18 }}>
      <div style={mono(T.color.red, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 })}>Queue mode proves execution order</div>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item, index) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "64px 1.2fr 1fr", gap: 16, alignItems: "center", padding: 14, borderRadius: T.radius.md, border: `1px solid ${T.color.border}`, background: alpha("#FFFFFF", 0.03) }}>
            <div style={serif(T.color.text, 30)}>{index + 1}</div>
            <div>
              <div style={body(T.color.text, 17, { fontWeight: 700 })}>{item.title}</div>
              <div style={body(T.color.text3, 13, { marginTop: 4 })}>{item.historicalEntry}</div>
            </div>
            <div style={body(T.color.text2, 14, { lineHeight: 1.6 })}>{item.nextMove}</div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function SheetLayer({ selected }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Surface accent={FAMILY[selected.family].accent} style={{ padding: 22 }}>
        <div style={mono(T.color.gold, 11, { textTransform: "uppercase", letterSpacing: "0.12em" })}>Object sheet</div>
        <div style={serif(T.color.text, 42, { marginTop: 10 })}>{selected.title}</div>
        <div style={body(T.color.text2, 16, { marginTop: 12, lineHeight: 1.75, maxWidth: 820 })}>{selected.sheetNarrative}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 20 }}>
          <Metric label="Current pressure" value={selected.pressure} />
          <Metric label="Next move" value={selected.nextMove} />
          <Metric label="Writes into" value={selected.downstream} />
        </div>
      </Surface>
      <Surface style={{ padding: 18 }}>
        <div style={mono(T.color.blue, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 })}>Preserved named lenses</div>
        <div style={{ display: "grid", gap: 10 }}>
          {selected.lenses.map((lens) => (
            <div key={lens.id} style={{ padding: 14, borderRadius: T.radius.md, border: `1px solid ${T.color.border}`, background: alpha("#FFFFFF", 0.03) }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={body(T.color.text, 16, { fontWeight: 700 })}>{lens.label}</div>
                <Pill tone={lens.preservedEntry ? "green" : "neutral"}>{lens.preservedEntry ? "Preserved entry" : "Shared lens"}</Pill>
              </div>
              <div style={body(T.color.text2, 14, { marginTop: 8, lineHeight: 1.6 })}>{lens.purpose}</div>
              <div style={body(T.color.text3, 13, { marginTop: 8 })}>Writes back to: {lens.writesBack}</div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function WorkspaceLayer({ selected, lens, onPickLens }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Surface accent={FAMILY[selected.family].accent} style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={mono(T.color.gold, 11, { textTransform: "uppercase", letterSpacing: "0.12em" })}>Workspace layer</div>
            <div style={serif(T.color.text, 40, { marginTop: 10 })}>{selected.title}</div>
          </div>
          <Pill tone="blue">{lens.label}</Pill>
        </div>
        <div style={body(T.color.text2, 16, { marginTop: 12, lineHeight: 1.7, maxWidth: 760 })}>
          {lens.label} is not the architecture. It is the active lens on this object. The object keeps the truth. The lens exposes the right work.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
          {selected.lenses.map((item) => (
            <ActionButton key={item.id} kind={item.id === lens.id ? "primary" : "secondary"} onClick={() => onPickLens(item.id)}>
              {item.label}
            </ActionButton>
          ))}
        </div>
      </Surface>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 16 }}>
        <Surface style={{ padding: 18 }}>
          <div style={mono(T.color.text3, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 })}>What this lens does now</div>
          <div style={serif(T.color.text, 30)}>{lens.label}</div>
          <div style={body(T.color.text2, 15, { marginTop: 10, lineHeight: 1.75 })}>{lens.purpose}</div>
          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            {[
              `Focus object: ${selected.title}`,
              `Preserved product noun: ${lens.label}`,
              `Best next move: ${selected.nextMove}`,
              `Writes back to: ${lens.writesBack}`,
            ].map((line) => (
              <div key={line} style={{ padding: 12, borderRadius: T.radius.md, border: `1px solid ${T.color.border}`, background: alpha("#FFFFFF", 0.03), ...body(T.color.text2, 14, { lineHeight: 1.6 }) }}>
                {line}
              </div>
            ))}
          </div>
        </Surface>
        <Surface style={{ padding: 18 }}>
          <div style={mono(T.color.teal, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 })}>Why this matters</div>
          <div style={body(T.color.text2, 15, { lineHeight: 1.75 })}>
            The user should not bounce across modules asking where context lives. Once the object is selected, each lens should inherit its pressure, next move, and downstream consequence.
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            <div style={{ padding: 12, borderRadius: T.radius.md, border: `1px solid ${T.color.border}`, background: alpha(T.color.gold, 0.08), ...body(T.color.text, 14, { fontWeight: 700 }) }}>
              Historical entry preserved: {selected.historicalEntry}
            </div>
            <div style={{ padding: 12, borderRadius: T.radius.md, border: `1px solid ${T.color.border}`, background: alpha(T.color.blue, 0.08), ...body(T.color.text2, 14, { lineHeight: 1.6 }) }}>
              Signal Console stays the signal engine. Future Autopsy stays a premium deal lens. The architecture changes around them.
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function GraphLayer({ selected }) {
  return (
    <Surface style={{ padding: 22 }}>
      <div style={mono(T.color.blue, 11, { textTransform: "uppercase", letterSpacing: "0.12em" })}>Diagnostic graph layer</div>
      <div style={serif(T.color.text, 36, { marginTop: 10 })}>{selected.title}</div>
      <div style={body(T.color.text2, 15, { marginTop: 12, lineHeight: 1.7, maxWidth: 760 })}>
        This layer exists to diagnose relationships, not to become the daily operating surface. It should appear rarely, when the operator needs to inspect how truth is connecting.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 22 }}>
        {selected.graphNodes.map((node, index) => (
          <div key={node} style={{ padding: 16, borderRadius: T.radius.full, border: `1px solid ${T.color.border}`, background: alpha(index === 0 ? FAMILY[selected.family].accent : "#FFFFFF", index === 0 ? 0.14 : 0.04), textAlign: "center" }}>
            <div style={body(index === 0 ? T.color.text : T.color.text2, 14, { fontWeight: 700 })}>{node}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        <div style={body(T.color.text3, 13, { lineHeight: 1.7 })}>Use this layer to see how the object writes into other truths, not to replace the command layer.</div>
        <div style={body(T.color.text3, 13, { lineHeight: 1.7 })}>If this becomes the default UX, the reset has gone too far toward system theater.</div>
      </div>
    </Surface>
  );
}

function ObjectRail({ selected, lensId, onPickLens }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Surface style={{ padding: 18 }}>
        <div style={mono(T.color.gold, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 })}>Selected object</div>
        <div style={serif(T.color.text, 34)}>{selected.title}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <Pill tone="gold">{FAMILY[selected.family].label}</Pill>
          <Pill tone={selected.status === "complete" ? "green" : selected.status === "live" ? "blue" : selected.status === "blocked" ? "red" : "gold"}>{STATUS[selected.status].label}</Pill>
        </div>
        <div style={body(T.color.text2, 14, { marginTop: 14, lineHeight: 1.7 })}>{selected.pressure}</div>
      </Surface>
      <Surface style={{ padding: 18 }}>
        <div style={mono(T.color.text3, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 })}>Lens rail</div>
        <div style={{ display: "grid", gap: 8 }}>
          {selected.lenses.map((lens) => (
            <button
              key={lens.id}
              onClick={() => onPickLens(lens.id)}
              style={{
                textAlign: "left",
                padding: 12,
                cursor: "pointer",
                borderRadius: T.radius.md,
                border: `1px solid ${lens.id === lensId ? alpha(T.color.gold, 0.35) : T.color.border}`,
                background: lens.id === lensId ? alpha(T.color.gold, 0.1) : alpha("#FFFFFF", 0.03),
              }}
            >
              <div style={body(T.color.text, 14, { fontWeight: 700 })}>{lens.label}</div>
              <div style={body(T.color.text3, 12, { marginTop: 4, lineHeight: 1.6 })}>{lens.purpose}</div>
            </button>
          ))}
        </div>
      </Surface>
      <Surface style={{ padding: 18 }}>
        <div style={mono(T.color.blue, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 })}>Truth locks</div>
        <div style={{ display: "grid", gap: 8 }}>
          {ARCHITECTURE_TRUTHS.map((line) => (
            <div key={line} style={body(T.color.text2, 13, { lineHeight: 1.65 })}>{line}</div>
          ))}
        </div>
      </Surface>
      <Surface style={{ padding: 18 }}>
        <div style={mono(T.color.red, 11, { textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 })}>What we reject</div>
        <div style={{ display: "grid", gap: 8 }}>
          {ARCHITECTURE_REJECTIONS.map((line) => (
            <div key={line} style={body(T.color.text2, 13, { lineHeight: 1.65 })}>{line}</div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

export default function ArchitectureResetPrototype() {
  const [selectedId, setSelectedId] = useState(OBJECTS[2].id);
  const [commandMode, setCommandMode] = useState("brief");
  const [layer, setLayer] = useState("command");
  const selected = useMemo(() => OBJECTS.find((item) => item.id === selectedId) || OBJECTS[0], [selectedId]);
  const queue = useMemo(() => [...OBJECTS].sort((a, b) => b.queueScore - a.queueScore), []);
  const [lensId, setLensId] = useState(OBJECTS[2].lenses[0].id);

  useEffect(() => {
    if (selected && selected.lenses && selected.lenses[0]) {
      setLensId(selected.lenses[0].id);
    }
  }, [selected]);

  if (!selected) {
    return null;
  }

  const selectedLens = selected.lenses.find((item) => item.id === lensId) || selected.lenses[0];
  const center = layer === "command"
    ? commandMode === "brief"
      ? <BriefMode selected={selected} queue={queue} />
      : commandMode === "grid"
        ? <GridMode items={queue} />
        : <QueueMode items={queue} />
    : layer === "sheet"
      ? <SheetLayer selected={selected} />
      : layer === "workspace"
        ? <WorkspaceLayer selected={selected} lens={selectedLens} onPickLens={setLensId} />
        : <GraphLayer selected={selected} />;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${T.color.bg}, #060912 65%)`, padding: 24 }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", display: "grid", gap: 18 }}>
        <Surface accent={T.color.gold} style={{ padding: 24, background: `radial-gradient(circle at top right, ${alpha(T.color.gold, 0.08)}, transparent 36%), ${T.color.shell}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ maxWidth: 900 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill tone="gold">Architecture reset prototype</Pill>
                <Pill tone="blue">{"Command -> object -> lens -> handoff"}</Pill>
              </div>
              <div style={serif(T.color.text, 56, { marginTop: 14 })}>Get there, not closer.</div>
              <div style={body(T.color.text2, 18, { marginTop: 12, lineHeight: 1.75, maxWidth: 860 })}>
                This prototype is not a component gallery. It is the structure the app should evolve into before beta: ranked objects first, preserved lenses second, handoff truth always visible.
              </div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={mono(T.color.text3, 11, { textTransform: "uppercase", letterSpacing: "0.12em" })}>Preserved named assets</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill tone="blue">Signal Console</Pill>
                <Pill tone="gold">Future Autopsy</Pill>
                <Pill tone="green">Playbook / Handoff Kit</Pill>
              </div>
            </div>
          </div>
        </Surface>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Segmented items={COMMAND_MODES} value={commandMode} onChange={setCommandMode} />
          <Segmented items={LAYERS} value={layer} onChange={setLayer} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr) 320px", gap: 16, alignItems: "start" }}>
          <QueueList items={queue} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setLayer("command"); }} />
          {center}
          <ObjectRail selected={selected} lensId={lensId} onPickLens={(id) => { setLensId(id); setLayer("workspace"); }} />
        </div>
      </div>
    </div>
  );
}
