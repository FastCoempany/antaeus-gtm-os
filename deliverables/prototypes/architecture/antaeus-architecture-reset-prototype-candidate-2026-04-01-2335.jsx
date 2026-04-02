// Version D candidate: refined from the promoted Version C baseline so mode
// semantics get sharper without touching production or drifting visually.
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

const C = {
  neutral: {
    0: "#FFFFFF",
    25: "#FBFCFE",
    50: "#F6F8FC",
    100: "#EDF2F9",
    200: "#DDE6F2",
    300: "#C6D3E3",
    400: "#9BB0C8",
    500: "#7A8DA8",
    600: "#5D7290",
    700: "#46607F",
    800: "#253B5D",
    900: "#0A1C40",
  },
  orange: {
    50: "#FFF6EF",
    100: "#FFE9D8",
    200: "#FFD3B0",
    500: "#E6701E",
    600: "#D26417",
    700: "#C55C12",
    800: "#9F470A",
  },
  blue: {
    50: "#F3F7FF",
    100: "#E7F0FF",
    200: "#D1E2FF",
    500: "#2471E7",
    600: "#1E64D1",
    700: "#1858BA",
    800: "#12428B",
  },
  green: {
    50: "#F1FBF7",
    100: "#E3F6EE",
    200: "#CBECDC",
    500: "#129266",
    700: "#0C6A49",
  },
  red: {
    50: "#FFF3F3",
    100: "#FFE4E4",
    200: "#FFCACA",
    500: "#C84141",
    700: "#982B2B",
  },
};

const ROLE = {
  page: C.neutral[50],
  surface: C.neutral[0],
  surfaceAlt: C.blue[50],
  surfaceSoft: C.orange[50],
  surfaceStrong: C.neutral[100],
  border: C.neutral[200],
  borderStrong: C.neutral[300],
  borderSelected: C.blue[500],
  textPrimary: C.neutral[900],
  textSecondary: C.neutral[700],
  textMuted: C.neutral[500],
  textInverse: C.neutral[0],
  info: C.blue[500],
  link: C.blue[700],
  actionPrimary: C.orange[500],
  actionPrimaryHover: C.orange[600],
  actionPrimaryPressed: C.orange[700],
  actionPrimaryText: C.neutral[0],
  actionSecondary: C.neutral[0],
  actionSecondaryText: C.neutral[900],
  actionSecondaryBorder: C.neutral[300],
  urgentText: C.orange[700],
  urgentSurface: C.orange[50],
  urgentBorder: C.orange[200],
  activeText: C.blue[700],
  activeSurface: C.blue[50],
  activeBorder: C.blue[200],
  healthyText: C.green[700],
  healthySurface: C.green[50],
  healthyBorder: C.green[200],
  blockedText: C.red[700],
  blockedSurface: C.red[50],
  blockedBorder: C.red[200],
  overlay: alpha(C.neutral[900], 0.16),
  focusGlow: alpha(C.blue[500], 0.16),
  graphLine: alpha(C.blue[500], 0.35),
};

const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 64 };
const RADIUS = { control: 6, button: 6, surfaceSm: 16, surfaceMd: 18, surfaceLg: 24, sheet: 28, full: 999 };
const HEIGHT = { sm: 32, md: 36, lg: 40, xl: 48 };
const SHADOW = {
  none: "none",
  sm: `0 8px 24px ${alpha(C.neutral[900], 0.06)}`,
  md: `0 18px 44px ${alpha(C.neutral[900], 0.08)}`,
  lg: `0 30px 80px ${alpha(C.neutral[900], 0.12)}`,
};

const TYPE = {
  display: '"Plus Jakarta Sans", "Inter", "Segoe UI", sans-serif',
  body: '"Outfit", "Inter", "Segoe UI", sans-serif',
  system: '"Space Mono", Monaco, Consolas, monospace',
};

const STATES = {
  urgent: { label: "Urgent", text: ROLE.urgentText, surface: ROLE.urgentSurface, border: ROLE.urgentBorder },
  active: { label: "Active", text: ROLE.activeText, surface: ROLE.activeSurface, border: ROLE.activeBorder },
  healthy: { label: "Healthy", text: ROLE.healthyText, surface: ROLE.healthySurface, border: ROLE.healthyBorder },
  blocked: { label: "Blocked", text: ROLE.blockedText, surface: ROLE.blockedSurface, border: ROLE.blockedBorder },
};

const MODES = [
  { id: "brief", label: "Brief", copy: "Narrative density for orientation and reasoning." },
  { id: "grid", label: "Grid", copy: "Spatial density for scanning and comparison." },
  { id: "queue", label: "Queue", copy: "Action density for sequential execution." },
];

const OBJECTS = [
  {
    id: "deal-vantive",
    family: "Execution + Proof",
    type: "Deal",
    state: "urgent",
    metric: "11",
    metricLabel: "days in stage 2",
    title: "Vantive expansion",
    brief: "Discovery has not been run, the champion is still assumed, and the deal is reading healthier than it actually is.",
    primary: "Run Future Autopsy",
    fallback: "Plan discovery call",
    gaps: ["No discovery logged", "Champion unproven", "Proof owner not assigned"],
    next: "Once Future Autopsy sharpens the failure mode, the next loop becomes one corrective move instead of generic deal anxiety.",
    connections: ["Account: Vantive", "Signal Console: 3 active threads", "Proof: credibility still thin", "Advisor: available"],
    compounding: "The moment this deal becomes honest, Discovery Studio, PoC Framework, Advisor Deploy, and Handoff all get sharper together.",
    lenses: [
      { id: "overview", label: "Overview", module: "Deal Workspace", cue: "Pressure map, stage honesty, and next move." },
      { id: "discovery", label: "Discovery", module: "Discovery Studio", cue: "Run the actual conversation method, not a generic note form." },
      { id: "call-plan", label: "Call Plan", module: "Call Planner", cue: "Meeting prep inherits the same object truth." },
      { id: "autopsy", label: "Future Autopsy", cue: "Pressure-test the deal before it lies to you again." },
      { id: "proof", label: "Proof", module: "PoC Framework", cue: "Translate risk into a credible proof structure." },
      { id: "advisor", label: "Advisor", module: "Advisor Deploy", cue: "Deploy signal and leverage only when the moment earns it." },
    ],
  },
  {
    id: "account-cascadia",
    family: "Signal + Motion",
    type: "Account",
    state: "active",
    metric: "62",
    metricLabel: "signal heat",
    title: "Cascadia Health Network",
    brief: "The signal cluster is strong enough to act on now, but the angle still needs tightening before the first motion is worth sending.",
    primary: "Open Signal Console",
    fallback: "Draft first motion",
    gaps: ["Angle not locked", "Primary owner unclear", "Channel not chosen"],
    next: "Once the angle tightens, the next loop becomes channel choice across outbound, LinkedIn, or cold call.",
    connections: ["ICP: Healthcare IT wedge", "Motion: unsent", "Call path: undefined", "Territory: strong fit"],
    compounding: "A stronger account angle sharpens Outbound Studio, Cold Call Studio, LinkedIn Playbook, and downstream deal creation at once.",
    lenses: [
      { id: "signal-console", label: "Signal Console", cue: "Collapse noise into one account worth acting on." },
      { id: "outbound", label: "Outbound", module: "Outbound Studio", cue: "Choose the right motion once the angle is real." },
      { id: "linkedin", label: "LinkedIn", module: "LinkedIn Playbook", cue: "Channel-specific motion still inherits the same object." },
      { id: "cold-call", label: "Cold Call", module: "Cold Call Studio", cue: "The call lens should never lose the signal context." },
    ],
  },
  {
    id: "icp-healthcare",
    family: "Targeting",
    type: "ICP",
    state: "healthy",
    metric: "84",
    metricLabel: "quality score",
    title: "Healthcare IT wedge",
    brief: "The wedge is real enough to drive sourcing and territory, but geography and trigger language can still sharpen before scale.",
    primary: "Refine ICP",
    fallback: "Map accounts",
    gaps: ["Geography still broad", "Trigger phrasing still generic"],
    next: "A tighter wedge raises the credibility of every downstream account, motion, and discovery conversation.",
    connections: ["Territory: seeded", "Sourcing: live", "Accounts mapped: 16", "Readiness: benefiting"],
    compounding: "A stronger ICP compounds across Territory Architect, Sourcing Workbench, Signal Console, and Discovery before a user ever notices the chain.",
    lenses: [
      { id: "definition", label: "Definition", module: "ICP Studio", cue: "Keep the full wedge logic and buyer method intact." },
      { id: "territory", label: "Territory", module: "Territory Architect", cue: "Territory is a lens on the same target truth, not a new room." },
      { id: "sourcing", label: "Sourcing", module: "Sourcing Workbench", cue: "Source from the live wedge instead of a disconnected list." },
    ],
  },
  {
    id: "handoff-first-dollar",
    family: "Synthesis + Handoff",
    type: "Handoff",
    state: "active",
    metric: "3",
    metricLabel: "source gaps",
    title: "First-dollar handoff kit",
    brief: "The handoff is starting to read like a system, but proof and motion evidence still need to compound into it before it becomes transfer-ready.",
    primary: "Open Handoff Kit",
    fallback: "Check readiness",
    gaps: ["Proof still soft", "Motion history thin", "Advisor thread missing"],
    next: "Once the handoff starts inheriting the full system truth, the app finally proves that work compounds automatically.",
    connections: ["Readiness: 71", "Playbook: seeded", "Quota Workback: linked", "Deal proof: incomplete"],
    compounding: "This is the supreme output of the system. Every upstream object should strengthen it without restating context.",
    lenses: [
      { id: "handoff", label: "Handoff", module: "Playbook / Handoff Kit", cue: "The export should inherit real operating evidence, not a section dump." },
      { id: "readiness", label: "Readiness", module: "Readiness", cue: "Verdict logic should feed the handoff instead of living alone." },
      { id: "quota", label: "Quota", module: "Quota Workback", cue: "Quota pressure stays system-level but still informs transfer readiness." },
    ],
  },
];

function textStyle(size, color = ROLE.textSecondary, weight = 500, extra = {}) {
  return { fontFamily: TYPE.body, fontSize: size, lineHeight: `${Math.round(size * 1.6)}px`, fontWeight: weight, color, margin: 0, ...extra };
}

function displayStyle(size, color = ROLE.textPrimary, weight = 800, extra = {}) {
  return { fontFamily: TYPE.display, fontSize: size, lineHeight: `${Math.round(size * 1.08)}px`, fontWeight: weight, letterSpacing: "-0.04em", color, margin: 0, ...extra };
}

function monoStyle(size, color = ROLE.textMuted, extra = {}) {
  return { fontFamily: TYPE.system, fontSize: size, lineHeight: `${Math.round(size * 1.45)}px`, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color, margin: 0, ...extra };
}

function Surface({ children, tint = "base", padding = SPACE[6], radius = RADIUS.surfaceMd, shadow = SHADOW.sm, style = {} }) {
  const backgrounds = {
    base: ROLE.surface,
    info: ROLE.surfaceAlt,
    pressure: ROLE.surfaceSoft,
    structure: ROLE.surfaceStrong,
  };

  return (
    <div
      style={{
        background: backgrounds[tint] || ROLE.surface,
        border: `1px solid ${ROLE.border}`,
        borderRadius: radius,
        padding,
        boxShadow: shadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Chip({ label, tone = "neutral" }) {
  const toneMap = {
    neutral: { bg: ROLE.surfaceStrong, text: ROLE.textSecondary, border: ROLE.borderStrong },
    urgent: { bg: ROLE.urgentSurface, text: ROLE.urgentText, border: ROLE.urgentBorder },
    active: { bg: ROLE.activeSurface, text: ROLE.activeText, border: ROLE.activeBorder },
    healthy: { bg: ROLE.healthySurface, text: ROLE.healthyText, border: ROLE.healthyBorder },
    blocked: { bg: ROLE.blockedSurface, text: ROLE.blockedText, border: ROLE.blockedBorder },
    info: { bg: ROLE.surfaceAlt, text: ROLE.link, border: ROLE.activeBorder },
  };
  const value = toneMap[tone] || toneMap.neutral;

  return (
    <span
      style={{
        ...monoStyle(11, value.text),
        display: "inline-flex",
        alignItems: "center",
        height: HEIGHT.sm,
        padding: `0 ${SPACE[3]}px`,
        borderRadius: RADIUS.full,
        border: `1px solid ${value.border}`,
        background: value.bg,
      }}
    >
      {label}
    </span>
  );
}

function GapBadge({ count }) {
  return <Chip label={`⊘ ${count} gaps`} tone="urgent" />;
}

function Button({ label, variant = "primary", onClick, minWidth = 132 }) {
  const variants = {
    primary: { background: ROLE.actionPrimary, color: ROLE.actionPrimaryText, border: ROLE.actionPrimary, shadow: SHADOW.sm },
    secondary: { background: ROLE.actionSecondary, color: ROLE.actionSecondaryText, border: ROLE.actionSecondaryBorder, shadow: SHADOW.none },
    tertiary: { background: "transparent", color: ROLE.link, border: "transparent", shadow: SHADOW.none },
  };
  const resolved = variants[variant];

  return (
    <button
      onClick={onClick}
      style={{
        ...textStyle(13, resolved.color, 700, { cursor: "pointer" }),
        height: HEIGHT.lg,
        minWidth,
        padding: `0 ${SPACE[4]}px`,
        borderRadius: RADIUS.button,
        border: `1px solid ${resolved.border}`,
        background: resolved.background,
        boxShadow: resolved.shadow,
      }}
    >
      {label}
    </button>
  );
}

function ModeToggle({ value, onChange }) {
  return (
    <div style={{ display: "inline-flex", gap: SPACE[2], padding: SPACE[1], borderRadius: RADIUS.full, background: ROLE.surfaceAlt, border: `1px solid ${ROLE.border}` }}>
      {MODES.map((mode) => {
        const active = mode.id === value;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            style={{
              ...textStyle(13, active ? ROLE.textInverse : ROLE.textSecondary, 700, { cursor: "pointer" }),
              height: HEIGHT.md,
              padding: `0 ${SPACE[3]}px`,
              borderRadius: RADIUS.full,
              border: "none",
              background: active ? ROLE.info : "transparent",
            }}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

function MetricAnchor({ value, label, tone = "neutral" }) {
  const map = { neutral: ROLE.textPrimary, urgent: ROLE.urgentText, active: ROLE.activeText, healthy: ROLE.healthyText, blocked: ROLE.blockedText };
  return (
    <div style={{ display: "grid", gap: SPACE[1] }}>
      <p style={displayStyle(42, map[tone])}>{value}</p>
      <p style={monoStyle(11, ROLE.textMuted)}>{label}</p>
    </div>
  );
}

function QuietFrame({ onGraph }) {
  return (
    <div
      style={{
        alignContent: "start",
        paddingRight: SPACE[5],
        borderRight: `1px solid ${ROLE.border}`,
        display: "grid",
        gap: SPACE[5],
      }}
    >
      <div style={{ display: "grid", gap: SPACE[3] }}>
        <p style={monoStyle(11, ROLE.link)}>quiet frame</p>
        <h2 style={displayStyle(28, ROLE.textPrimary, 800)}>Open on pressure, not on places.</h2>
        <p style={textStyle(14, ROLE.textSecondary, 500)}>
          This column exists to settle the eye and hold the operating thesis. It should feel like a calm frame around the ranked work, not a stack of side widgets.
        </p>
      </div>

      <div style={{ display: "grid", gap: SPACE[3], paddingTop: SPACE[4], borderTop: `1px solid ${ROLE.border}` }}>
        {[
          "Urgent, Active, Healthy describe object condition.",
          "Open loops migrate. They do not disappear.",
          "Metrics hit before explanation.",
          "One best move beats menu anxiety.",
        ].map((line) => (
          <p key={line} style={textStyle(13, ROLE.textSecondary, 600)}>{line}</p>
        ))}
      </div>

      <div style={{ display: "grid", gap: SPACE[3], paddingTop: SPACE[4], borderTop: `1px solid ${ROLE.border}` }}>
        <p style={monoStyle(11, ROLE.urgentText)}>hidden reward</p>
        <p style={textStyle(13, ROLE.textPrimary, 700)}>Touch here to see something super cool you did that you didn't know you did.</p>
        <div>
          <Button label="Open graph reward" onClick={onGraph} minWidth={164} />
        </div>
      </div>
    </div>
  );
}

function BriefBlock({ item, featured, onInspect }) {
  const tone = STATES[item.state];
  return (
    <button
      onClick={() => onInspect(item.id)}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${featured ? ROLE.borderSelected : ROLE.border}`,
        borderLeft: `8px solid ${tone.text}`,
        borderRadius: RADIUS.surfaceMd,
        background: ROLE.surface,
        boxShadow: featured ? SHADOW.md : SHADOW.sm,
        padding: SPACE[5],
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[4], alignItems: "start" }}>
        <div style={{ display: "grid", gap: SPACE[4], flex: 1 }}>
          <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
            <Chip label={tone.label} tone={item.state} />
            <GapBadge count={item.gaps.length} />
            {featured ? <Chip label="Next move" tone="info" /> : null}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "136px 1fr", gap: SPACE[4], alignItems: "start" }}>
            <MetricAnchor value={item.metric} label={item.metricLabel} tone={item.state} />
            <div style={{ display: "grid", gap: SPACE[2] }}>
              <h3 style={displayStyle(28)}>{item.title}</h3>
              <p style={textStyle(14, ROLE.textSecondary, 500)}>{item.brief}</p>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: SPACE[2], minWidth: 150, justifyItems: "end" }}>
          <p style={textStyle(13, ROLE.urgentText, 700, { textAlign: "right" })}>{item.primary}</p>
          <p style={textStyle(12, ROLE.textMuted, 500, { textAlign: "right", maxWidth: 140 })}>{item.next}</p>
        </div>
      </div>
    </button>
  );
}

function GridCard({ item, featured, onInspect }) {
  const tone = STATES[item.state];
  return (
    <button
      onClick={() => onInspect(item.id)}
      style={{
        position: "relative",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${featured ? ROLE.borderSelected : ROLE.border}`,
        borderRadius: RADIUS.surfaceMd,
        background: ROLE.surface,
        boxShadow: featured ? SHADOW.md : SHADOW.sm,
        padding: SPACE[5],
      }}
    >
      {featured ? <div style={{ position: "absolute", inset: "0 0 auto 0", height: 6, background: ROLE.info, borderTopLeftRadius: RADIUS.surfaceMd, borderTopRightRadius: RADIUS.surfaceMd }} /> : null}
      <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[2], marginTop: featured ? SPACE[2] : 0 }}>
        <Chip label={tone.label} tone={item.state} />
        <GapBadge count={item.gaps.length} />
      </div>
      <div style={{ display: "flex", gap: SPACE[3], alignItems: "end", marginTop: SPACE[4] }}>
        <p style={displayStyle(40, tone.text)}>{item.metric}</p>
        <p style={monoStyle(11, ROLE.textMuted, { marginBottom: 10 })}>{item.metricLabel}</p>
      </div>
      <h3 style={displayStyle(24, ROLE.textPrimary, 800, { marginTop: SPACE[3] })}>{item.title}</h3>
      <p style={textStyle(13, ROLE.textSecondary, 500, { marginTop: SPACE[2] })}>{item.brief}</p>
    </button>
  );
}

function GridFeaturedCard({ item, onInspect }) {
  const tone = STATES[item.state];
  return (
    <button
      onClick={() => onInspect(item.id)}
      style={{
        position: "relative",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${ROLE.borderSelected}`,
        borderRadius: RADIUS.surfaceLg,
        background: ROLE.surface,
        boxShadow: SHADOW.md,
        padding: SPACE[6],
      }}
    >
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 6, background: ROLE.info, borderTopLeftRadius: RADIUS.surfaceLg, borderTopRightRadius: RADIUS.surfaceLg }} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[3], alignItems: "start", marginTop: SPACE[2] }}>
        <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
          <Chip label={tone.label} tone={item.state} />
          <GapBadge count={item.gaps.length} />
          <Chip label="Priority tile" tone="info" />
        </div>
        <p style={monoStyle(11, ROLE.link)}>{item.family}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "160px minmax(0,1fr)", gap: SPACE[5], alignItems: "start", marginTop: SPACE[5] }}>
        <MetricAnchor value={item.metric} label={item.metricLabel} tone={item.state} />
        <div style={{ display: "grid", gap: SPACE[3] }}>
          <h3 style={displayStyle(34, ROLE.textPrimary, 800)}>{item.title}</h3>
          <p style={textStyle(15, ROLE.textSecondary, 500, { maxWidth: 560 })}>{item.brief}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE[5], paddingTop: SPACE[5], marginTop: SPACE[5], borderTop: `1px solid ${ROLE.border}` }}>
        <div style={{ display: "grid", gap: SPACE[2] }}>
          <p style={monoStyle(11, ROLE.urgentText)}>dominant next move</p>
          <p style={textStyle(14, ROLE.textPrimary, 700)}>{item.primary}</p>
          <p style={textStyle(12, ROLE.textSecondary, 500)}>{item.next}</p>
        </div>
        <div style={{ display: "grid", gap: SPACE[2] }}>
          <p style={monoStyle(11, ROLE.link)}>evidence sample</p>
          {item.connections.slice(0, 2).map((line) => (
            <p key={line} style={textStyle(12, ROLE.textSecondary, 600)}>{line}</p>
          ))}
        </div>
      </div>
    </button>
  );
}

function GridMiniCard({ item, onInspect }) {
  const tone = STATES[item.state];
  return (
    <button
      onClick={() => onInspect(item.id)}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${ROLE.border}`,
        borderRadius: RADIUS.surfaceMd,
        background: ROLE.surface,
        boxShadow: SHADOW.sm,
        padding: SPACE[4],
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[3], alignItems: "start" }}>
        <div style={{ display: "grid", gap: SPACE[2] }}>
          <Chip label={tone.label} tone={item.state} />
          <h3 style={displayStyle(22, ROLE.textPrimary, 800)}>{item.title}</h3>
        </div>
        <div style={{ display: "grid", justifyItems: "end", gap: SPACE[1] }}>
          <p style={displayStyle(30, tone.text)}>{item.metric}</p>
          <p style={monoStyle(11, ROLE.textMuted)}>{item.metricLabel}</p>
        </div>
      </div>
      <p style={textStyle(13, ROLE.textSecondary, 500, { marginTop: SPACE[3] })}>{item.brief}</p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[3], alignItems: "center", paddingTop: SPACE[3], marginTop: SPACE[3], borderTop: `1px solid ${ROLE.border}` }}>
        <GapBadge count={item.gaps.length} />
        <p style={textStyle(12, ROLE.urgentText, 700)}>{item.primary}</p>
      </div>
    </button>
  );
}

function QueueRow({ item, rank, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(item.id)}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${selected ? ROLE.borderSelected : ROLE.border}`,
        borderRadius: RADIUS.surfaceSm,
        background: ROLE.surface,
        boxShadow: SHADOW.sm,
        padding: SPACE[4],
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: SPACE[3], alignItems: "center" }}>
        <p style={displayStyle(24, STATES[item.state].text)}>{rank}</p>
        <div>
          <p style={textStyle(14, ROLE.textPrimary, 700)}>{item.title}</p>
          <p style={textStyle(12, ROLE.textSecondary, 500, { marginTop: 4 })}>{item.primary}</p>
        </div>
        <p style={displayStyle(24, ROLE.textPrimary, 800)}>{item.metric}</p>
      </div>
    </button>
  );
}

function CommandSurface({ mode, selected, selectObject, openSheet }) {
  if (mode === "brief") {
    return (
      <div style={{ display: "grid", gap: SPACE[4] }}>
        {OBJECTS.map((item, index) => (
          <BriefBlock key={item.id} item={item} featured={index === 0} onInspect={openSheet} />
        ))}
      </div>
    );
  }

  if (mode === "grid") {
    const [featured, ...rest] = OBJECTS;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.08fr) minmax(320px,0.72fr)", gap: SPACE[4], alignItems: "start" }}>
        <GridFeaturedCard item={featured} onInspect={openSheet} />
        <div style={{ display: "grid", gap: SPACE[3] }}>
          {rest.map((item) => (
            <GridMiniCard key={item.id} item={item} onInspect={openSheet} />
          ))}
        </div>
      </div>
    );
  }

  const selectedRank = OBJECTS.findIndex((item) => item.id === selected.id) + 1;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: SPACE[4] }}>
      <div style={{ display: "grid", gap: SPACE[3] }}>
        {OBJECTS.map((item, index) => (
          <QueueRow key={item.id} item={item} rank={index + 1} selected={item.id === selected.id} onSelect={selectObject} />
        ))}
      </div>
      <Surface radius={RADIUS.surfaceLg} shadow={SHADOW.md} padding={SPACE[6]}>
        <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
          <Chip label={`Rank ${String(selectedRank).padStart(2, "0")}`} tone="info" />
          <Chip label={STATES[selected.state].label} tone={selected.state} />
          <GapBadge count={selected.gaps.length} />
        </div>
        <h3 style={displayStyle(32, ROLE.textPrimary, 800, { marginTop: SPACE[4] })}>{selected.title}</h3>
        <p style={textStyle(15, ROLE.textSecondary, 500, { marginTop: SPACE[3], maxWidth: 720 })}>{selected.brief}</p>
        <div style={{ display: "flex", gap: SPACE[3], flexWrap: "wrap", marginTop: SPACE[5] }}>
          <Button label={selected.primary} onClick={() => openSheet(selected.id)} />
          <Button label={selected.fallback} variant="secondary" />
        </div>
        <Surface tint="pressure" shadow={SHADOW.none} style={{ marginTop: SPACE[5], padding: SPACE[5] }}>
          <p style={monoStyle(11, ROLE.urgentText)}>run in this order</p>
          <p style={textStyle(13, ROLE.textPrimary, 600, { marginTop: SPACE[3] })}>{selected.next}</p>
        </Surface>
      </Surface>
    </div>
  );
}

function SheetOverlay({ item, closeSheet, openWorkspace }) {
  const tone = STATES[item.state];
  return (
    <div style={{ position: "fixed", inset: 0, background: ROLE.overlay, display: "grid", alignItems: "end", zIndex: 40 }}>
      <div style={{ background: ROLE.surface, borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, boxShadow: SHADOW.lg, padding: SPACE[6], maxHeight: "88vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[4], alignItems: "start" }}>
          <div style={{ display: "grid", gap: SPACE[3] }}>
            <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
              <Chip label={tone.label} tone={item.state} />
              <GapBadge count={item.gaps.length} />
              <Chip label="Dense sheet" tone="info" />
            </div>
            <h2 style={displayStyle(40, ROLE.textPrimary, 800)}>{item.title}</h2>
          </div>
          <Button label="Close" variant="tertiary" onClick={closeSheet} minWidth={88} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "176px 1fr", gap: SPACE[4], marginTop: SPACE[5] }}>
          <Surface tint="info" shadow={SHADOW.none} padding={SPACE[5]}>
            <MetricAnchor value={item.metric} label={item.metricLabel} tone={item.state} />
          </Surface>
          <div style={{ background: tone.surface, border: `1px solid ${tone.border}`, borderLeft: `8px solid ${tone.text}`, borderRadius: RADIUS.surfaceMd, padding: SPACE[5] }}>
            <p style={textStyle(16, ROLE.textPrimary, 600)}>{item.brief}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: SPACE[4], marginTop: SPACE[4] }}>
          <Surface shadow={SHADOW.none} padding={SPACE[5]}>
            <p style={monoStyle(11, ROLE.urgentText)}>⊘ explicit gaps</p>
            <div style={{ display: "grid", gap: SPACE[3], marginTop: SPACE[4] }}>
              {item.gaps.map((gap) => (
                <p key={gap} style={textStyle(14, ROLE.textPrimary, 600)}>{gap}</p>
              ))}
            </div>
            <p style={monoStyle(11, ROLE.link, { marginTop: SPACE[5] })}>connections</p>
            <div style={{ display: "grid", gap: SPACE[2], marginTop: SPACE[4] }}>
              {item.connections.map((line) => (
                <p key={line} style={textStyle(13, ROLE.textSecondary, 500)}>{line}</p>
              ))}
            </div>
          </Surface>

          <div style={{ display: "grid", gap: SPACE[4] }}>
            <Surface shadow={SHADOW.none} padding={SPACE[5]}>
              <p style={monoStyle(11, ROLE.link)}>one dominant next move</p>
              <h3 style={displayStyle(28, ROLE.textPrimary, 800, { marginTop: SPACE[3] })}>{item.primary}</h3>
              <p style={textStyle(13, ROLE.textSecondary, 500, { marginTop: SPACE[3] })}>{item.next}</p>
              <div style={{ display: "flex", gap: SPACE[3], flexWrap: "wrap", marginTop: SPACE[5] }}>
                <Button label="Go deeper ->" onClick={openWorkspace} minWidth={144} />
                <Button label={item.fallback} variant="secondary" />
              </div>
            </Surface>
            <Surface tint="pressure" shadow={SHADOW.none} padding={SPACE[5]}>
              <p style={monoStyle(11, ROLE.urgentText)}>what compounds automatically</p>
              <p style={textStyle(13, ROLE.textPrimary, 600, { marginTop: SPACE[3] })}>{item.compounding}</p>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceView({ item, activeLens, onLensChange, onBack }) {
  const lens = item.lenses.find((entry) => entry.id === activeLens) || item.lenses[0];

  return (
    <div style={{ display: "grid", gap: SPACE[5] }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[4], flexWrap: "wrap", alignItems: "center" }}>
        <Button label="Back to command" variant="tertiary" onClick={onBack} minWidth={146} />
        <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
          <Chip label="Workspace layer" tone="info" />
          <Chip label={item.family} tone="neutral" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "252px minmax(0,1fr)", gap: SPACE[6] }}>
        <div style={{ display: "grid", gap: SPACE[4], alignContent: "start", paddingRight: SPACE[5], borderRight: `1px solid ${ROLE.border}` }}>
          <div style={{ display: "grid", gap: SPACE[3] }}>
            <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
              <Chip label={STATES[item.state].label} tone={item.state} />
              <GapBadge count={item.gaps.length} />
            </div>
            <h2 style={displayStyle(28, ROLE.textPrimary, 800)}>{item.title}</h2>
            <p style={textStyle(13, ROLE.textSecondary, 500)}>{item.brief}</p>
          </div>

          <div style={{ display: "grid", gap: SPACE[3], paddingTop: SPACE[4], borderTop: `1px solid ${ROLE.border}` }}>
            <p style={monoStyle(11, ROLE.urgentText)}>context rail</p>
            {item.gaps.map((gap) => (
              <p key={gap} style={textStyle(13, ROLE.textPrimary, 600)}>{gap}</p>
            ))}
          </div>

          <div style={{ display: "grid", gap: SPACE[2], paddingTop: SPACE[4], borderTop: `1px solid ${ROLE.border}` }}>
            {item.connections.map((line) => (
              <p key={line} style={textStyle(12, ROLE.textSecondary, 500)}>{line}</p>
            ))}
          </div>
        </div>

        <Surface radius={RADIUS.surfaceLg} shadow={SHADOW.lg} padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: `${SPACE[4]}px ${SPACE[6]}px`, borderBottom: `1px solid ${ROLE.border}` }}>
            <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
              {item.lenses.map((entry) => {
                const active = entry.id === lens.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => onLensChange(entry.id)}
                    style={{
                      ...textStyle(13, active ? ROLE.textPrimary : ROLE.textSecondary, 700, { cursor: "pointer" }),
                      height: HEIGHT.md,
                      padding: `0 ${SPACE[3]}px`,
                      borderRadius: RADIUS.full,
                      border: active ? `1px solid ${ROLE.borderSelected}` : `1px solid transparent`,
                      background: active ? ROLE.surfaceAlt : "transparent",
                    }}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: `${SPACE[6]}px`, display: "grid", gap: SPACE[5] }}>
            <div style={{ display: "grid", gap: SPACE[3] }}>
              <p style={monoStyle(11, ROLE.link)}>{lens.module || lens.label}</p>
              <h2 style={displayStyle(44, ROLE.textPrimary, 800)}>{lens.label}</h2>
              <p style={textStyle(15, ROLE.textSecondary, 500, { maxWidth: 760 })}>{lens.cue}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: SPACE[4] }}>
              <div style={{ paddingRight: SPACE[4], borderRight: `1px solid ${ROLE.border}` }}>
                <p style={monoStyle(11, ROLE.link)}>module</p>
                <p style={textStyle(14, ROLE.textPrimary, 700, { marginTop: SPACE[2] })}>{lens.module || lens.label}</p>
              </div>
              <div style={{ paddingRight: SPACE[4], borderRight: `1px solid ${ROLE.border}` }}>
                <p style={monoStyle(11, ROLE.urgentText)}>next move</p>
                <p style={textStyle(14, ROLE.textPrimary, 700, { marginTop: SPACE[2] })}>{item.primary}</p>
              </div>
              <div>
                <p style={monoStyle(11, ROLE.textMuted)}>why this is different</p>
                <p style={textStyle(14, ROLE.textPrimary, 700, { marginTop: SPACE[2] })}>The room stays deep. The hallway disappears.</p>
              </div>
            </div>

            <div style={{ display: "grid", gap: SPACE[4], paddingTop: SPACE[5], borderTop: `1px solid ${ROLE.border}` }}>
              <p style={textStyle(14, ROLE.textPrimary, 600)}>
                The workspace header stays shorter than the old module shell. Context lives in the rail so the center can behave like an instrument instead of a brochure.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE[5] }}>
                <div>
                  <p style={monoStyle(11, ROLE.urgentText)}>downstream loop</p>
                  <p style={textStyle(13, ROLE.textPrimary, 600, { marginTop: SPACE[3] })}>{item.next}</p>
                </div>
                <div>
                  <p style={monoStyle(11, ROLE.link)}>what compounds automatically</p>
                  <p style={textStyle(13, ROLE.textPrimary, 600, { marginTop: SPACE[3] })}>{item.compounding}</p>
                </div>
              </div>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function GraphReward({ onBack }) {
  return (
    <div style={{ display: "grid", gap: SPACE[5] }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[4], flexWrap: "wrap", alignItems: "center" }}>
        <Button label="Back to command" variant="tertiary" onClick={onBack} minWidth={146} />
        <Chip label="Graph reward" tone="info" />
      </div>

      <Surface
        radius={RADIUS.sheet}
        shadow={SHADOW.lg}
        padding={SPACE[7]}
        style={{ background: `linear-gradient(180deg, ${ROLE.surface} 0%, ${C.blue[50]} 100%)` }}
      >
        <div style={{ display: "grid", gap: SPACE[4] }}>
          <h2 style={displayStyle(48, ROLE.textPrimary, 800, { maxWidth: 900 })}>Something super cool you did that you didn't know you did.</h2>
          <p style={textStyle(16, ROLE.textSecondary, 500, { maxWidth: 860 })}>
            This view is deliberately not the primary interaction model. It is the moment the product reveals compounding structure the user built indirectly through normal work.
          </p>

          <div style={{ position: "relative", height: 320, marginTop: SPACE[4] }}>
            <svg viewBox="0 0 920 320" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M120 170 C250 80 360 90 450 150" stroke={ROLE.graphLine} strokeWidth="2" strokeDasharray="8 8" fill="none" />
              <path d="M450 150 C560 228 674 234 800 174" stroke={ROLE.graphLine} strokeWidth="2" strokeDasharray="8 8" fill="none" />
              <path d="M450 150 C530 88 640 72 756 96" stroke={ROLE.graphLine} strokeWidth="2" strokeDasharray="8 8" fill="none" />
            </svg>
            <div style={{ position: "absolute", inset: 0 }}>
              {OBJECTS.map((item, index) => {
                const positions = [
                  { left: "4%", top: "42%" },
                  { left: "30%", top: "10%" },
                  { left: "42%", top: "48%" },
                  { left: "71%", top: "18%" },
                ];
                const background = item.state === "urgent" ? ROLE.urgentSurface : item.state === "active" ? ROLE.activeSurface : ROLE.healthySurface;
                return (
                  <div
                    key={item.id}
                    style={{
                      position: "absolute",
                      ...positions[index],
                      width: 176,
                      padding: SPACE[4],
                      borderRadius: RADIUS.full,
                      background,
                      border: `1px dashed ${ROLE.borderStrong}`,
                      boxShadow: SHADOW.sm,
                      textAlign: "center",
                    }}
                  >
                    <p style={monoStyle(11, ROLE.textMuted)}>{item.type}</p>
                    <p style={textStyle(13, ROLE.textPrimary, 700, { marginTop: SPACE[2] })}>{item.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Surface>
    </div>
  );
}

export default function ArchitectureResetPrototype() {
  const [mode, setMode] = useState("brief");
  const [layer, setLayer] = useState("command");
  const [selectedId, setSelectedId] = useState(OBJECTS[0].id);
  const [activeLens, setActiveLens] = useState(OBJECTS[0].lenses[0].id);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selected = useMemo(() => OBJECTS.find((item) => item.id === selectedId) || OBJECTS[0], [selectedId]);

  useEffect(() => {
    const firstLens = selected.lenses[0]?.id;
    if (!selected.lenses.some((lens) => lens.id === activeLens) && firstLens) {
      setActiveLens(firstLens);
    }
  }, [selected, activeLens]);

  const selectObject = (id) => {
    const next = OBJECTS.find((item) => item.id === id) || OBJECTS[0];
    setSelectedId(next.id);
    setActiveLens(next.lenses[0].id);
  };

  const openSheet = (id) => {
    selectObject(id);
    setSheetOpen(true);
  };

  const openWorkspace = () => {
    setSheetOpen(false);
    setLayer("workspace");
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${ROLE.page} 0%, ${C.blue[50]} 100%)`, padding: SPACE[6] }}>
      <style>{'@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap");'}</style>
      <div style={{ maxWidth: 1600, margin: "0 auto", display: "grid", gap: SPACE[5] }}>
        <div style={{ display: "grid", gap: SPACE[4], padding: `${SPACE[5]}px 0 ${SPACE[6]}px`, borderBottom: `1px solid ${ROLE.border}` }}>
          <div style={{ display: "flex", gap: SPACE[2], flexWrap: "wrap" }}>
            <Chip label="Modules preserved" tone="neutral" />
            <Chip label="Hallway removed" tone="urgent" />
            <Chip label="Bright system language" tone="info" />
          </div>
          <h1 style={displayStyle(68, ROLE.textPrimary, 800, { maxWidth: 1120 })}>
            The command surface is the product. The modules are the deep rooms behind it.
          </h1>
          <p style={textStyle(19, ROLE.textSecondary, 500, { maxWidth: 980 })}>
            Brief, Grid, and Queue rank the work. The sheet sharpens it. The workspace preserves depth. The graph reward reveals the compounding you built without having to think about it.
          </p>
          <div style={{ display: "flex", gap: SPACE[5], flexWrap: "wrap", paddingTop: SPACE[2] }}>
            <div>
              <p style={monoStyle(11, ROLE.link)}>architecture layers</p>
              <p style={displayStyle(32, ROLE.activeText, 800, { marginTop: SPACE[1] })}>4</p>
            </div>
            <div>
              <p style={monoStyle(11, ROLE.urgentText)}>dominant next move</p>
              <p style={displayStyle(32, ROLE.urgentText, 800, { marginTop: SPACE[1] })}>1</p>
            </div>
            <div>
              <p style={monoStyle(11, ROLE.textMuted)}>old hallway tolerance</p>
              <p style={displayStyle(32, ROLE.textPrimary, 800, { marginTop: SPACE[1] })}>0</p>
            </div>
          </div>
        </div>

        {layer === "command" ? (
          <div style={{ display: "grid", gridTemplateColumns: mode === "queue" ? "1fr" : "300px minmax(0,1fr)", gap: SPACE[5] }}>
            {mode === "queue" ? null : <QuietFrame onGraph={() => setLayer("graph")} />}

            <div style={{ display: "grid", gap: SPACE[4] }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: SPACE[4], flexWrap: "wrap", alignItems: "end", paddingBottom: SPACE[3], borderBottom: `1px solid ${ROLE.border}` }}>
                <div style={{ display: "grid", gap: SPACE[2] }}>
                  <p style={monoStyle(11, ROLE.link)}>command surface</p>
                  <h2 style={displayStyle(32, ROLE.textPrimary, 800)}>One urgency engine. Three render densities.</h2>
                  <p style={textStyle(13, ROLE.textSecondary, 500)}>{MODES.find((entry) => entry.id === mode)?.copy}</p>
                </div>
                <div style={{ display: "flex", gap: SPACE[3], flexWrap: "wrap", alignItems: "center" }}>
                  <ModeToggle value={mode} onChange={setMode} />
                  {mode === "queue" ? <Button label="Open graph reward" variant="secondary" onClick={() => setLayer("graph")} minWidth={156} /> : null}
                </div>
              </div>

              <CommandSurface mode={mode} selected={selected} selectObject={selectObject} openSheet={openSheet} />
            </div>
          </div>
        ) : null}

        {layer === "workspace" ? (
          <WorkspaceView item={selected} activeLens={activeLens} onLensChange={setActiveLens} onBack={() => setLayer("command")} />
        ) : null}

        {layer === "graph" ? <GraphReward onBack={() => setLayer("command")} /> : null}
      </div>

      {sheetOpen ? <SheetOverlay item={selected} closeSheet={() => setSheetOpen(false)} openWorkspace={openWorkspace} /> : null}
    </div>
  );
}
