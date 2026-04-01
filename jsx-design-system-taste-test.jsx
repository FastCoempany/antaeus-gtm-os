import { useMemo, useState } from "react";

/*
  ANTAEUS VISUAL SYSTEM LAB
  Rebuilt against the 2026-04-01 visual identity lock and visual system spec.
  This stays single-file and section-nav driven, but it no longer inherits the
  old dark-shell gravity or generic component-gallery framing.
*/

function alpha(hex, opacity) {
  const safe = hex.replace("#", "");
  const normalized = safe.length === 3 ? safe.split("").map((part) => part + part).join("") : safe;
  const int = parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const PRIMITIVE = {
  color: {
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
      300: "#F6B27F",
      400: "#EE8D47",
      500: "#E6701E",
      600: "#D26417",
      700: "#C55C12",
      800: "#9F470A",
      900: "#783305",
    },
    blue: {
      50: "#F3F7FF",
      100: "#E7F0FF",
      200: "#D1E2FF",
      300: "#A8C9FF",
      400: "#6E9EFF",
      500: "#2471E7",
      600: "#1E64D1",
      700: "#1858BA",
      800: "#12428B",
      900: "#0B2D5E",
    },
    navy: {
      50: "#F2F5FA",
      100: "#E9EEF8",
      200: "#D3DDEE",
      300: "#A9B9D2",
      400: "#6F86AB",
      500: "#3E577F",
      600: "#253B5D",
      700: "#182B48",
      800: "#10213D",
      900: "#0A1C40",
    },
    green: {
      50: "#F1FBF7",
      100: "#E3F6EE",
      200: "#CBECDC",
      300: "#98D7BB",
      400: "#4CB88A",
      500: "#129266",
      600: "#0F8059",
      700: "#0C6A49",
      800: "#0A543B",
      900: "#083F2D",
    },
    red: {
      50: "#FFF3F3",
      100: "#FFE4E4",
      200: "#FFCACA",
      300: "#F59D9D",
      400: "#E26767",
      500: "#C84141",
      600: "#B43636",
      700: "#982B2B",
      800: "#772121",
      900: "#581818",
    },
  },
  type: {
    family: {
      display: '"Plus Jakarta Sans", "Inter", "Segoe UI", sans-serif',
      body: '"Outfit", "Inter", "Segoe UI", sans-serif',
      system: '"Space Mono", Monaco, Consolas, monospace',
    },
    display: {
      hero: { size: 56, line: "60px", weight: 800 },
      h1: { size: 48, line: "52px", weight: 800 },
      h2: { size: 40, line: "44px", weight: 800 },
      h3: { size: 32, line: "36px", weight: 800 },
      h4: { size: 24, line: "28px", weight: 700 },
    },
    metric: {
      xl: { size: 52, line: "52px", weight: 800 },
      lg: { size: 42, line: "44px", weight: 800 },
      md: { size: 32, line: "36px", weight: 800 },
      sm: { size: 24, line: "28px", weight: 800 },
    },
    body: {
      lg: { size: 18, line: "30px", weight: 500 },
      md: { size: 16, line: "26px", weight: 500 },
      sm: { size: 14, line: "22px", weight: 500 },
      xs: { size: 13, line: "20px", weight: 500 },
    },
    system: {
      md: { size: 11, line: "16px", weight: 500 },
      sm: { size: 10, line: "14px", weight: 500 },
    },
  },
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 64 },
  radius: { control: 6, button: 6, surfaceSm: 16, surfaceMd: 18, surfaceLg: 24, sheet: 28, full: 999 },
  shadow: {
    none: "none",
    sm: `0 8px 24px ${alpha("#0A1C40", 0.06)}`,
    md: `0 18px 44px ${alpha("#0A1C40", 0.08)}`,
    lg: `0 30px 80px ${alpha("#0A1C40", 0.12)}`,
  },
  motion: {
    duration: { micro: "50ms", press: "100ms", standard: "150ms", appear: "200ms", sheet: "250ms", workspace: "300ms" },
    curve: {
      interaction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      enter: "cubic-bezier(0.16, 1, 0.3, 1)",
      exit: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
  breakpoint: { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1440, xxl: 1920 },
  density: {
    comfortable: { section: 24, card: 18, grid: 16, inputY: 12, buttonX: 16 },
    compact: { section: 18, card: 14, grid: 12, inputY: 8, buttonX: 12 },
  },
  height: { sm: 32, md: 36, lg: 40, xl: 48 },
};

const ROLE = {
  page: PRIMITIVE.color.neutral[50],
  surface: PRIMITIVE.color.neutral[0],
  surfaceAlt: PRIMITIVE.color.blue[50],
  surfaceSoft: PRIMITIVE.color.orange[50],
  surfaceStrong: PRIMITIVE.color.navy[100],
  border: PRIMITIVE.color.neutral[200],
  borderStrong: PRIMITIVE.color.neutral[300],
  borderSelected: PRIMITIVE.color.blue[500],
  textPrimary: PRIMITIVE.color.navy[900],
  textSecondary: PRIMITIVE.color.neutral[700],
  textMuted: PRIMITIVE.color.neutral[500],
  textInverse: PRIMITIVE.color.neutral[0],
  actionPrimary: PRIMITIVE.color.orange[500],
  actionPrimaryHover: PRIMITIVE.color.orange[600],
  actionPrimaryPressed: PRIMITIVE.color.orange[700],
  actionPrimaryText: PRIMITIVE.color.neutral[0],
  actionSecondary: PRIMITIVE.color.neutral[0],
  actionSecondaryHover: PRIMITIVE.color.neutral[25],
  actionSecondaryPressed: PRIMITIVE.color.neutral[100],
  actionSecondaryText: PRIMITIVE.color.navy[900],
  actionSecondaryBorder: PRIMITIVE.color.neutral[300],
  info: PRIMITIVE.color.blue[500],
  focus: PRIMITIVE.color.blue[500],
  link: PRIMITIVE.color.blue[700],
  urgentText: PRIMITIVE.color.orange[700],
  urgentSurface: PRIMITIVE.color.orange[50],
  urgentBorder: PRIMITIVE.color.orange[200],
  activeText: PRIMITIVE.color.blue[700],
  activeSurface: PRIMITIVE.color.blue[50],
  activeBorder: PRIMITIVE.color.blue[200],
  healthyText: PRIMITIVE.color.green[700],
  healthySurface: PRIMITIVE.color.green[50],
  healthyBorder: PRIMITIVE.color.green[200],
  blockedText: PRIMITIVE.color.red[700],
  blockedSurface: PRIMITIVE.color.red[50],
  blockedBorder: PRIMITIVE.color.red[200],
  gapText: PRIMITIVE.color.orange[700],
  gapSurface: PRIMITIVE.color.orange[50],
  gapBorder: PRIMITIVE.color.orange[200],
  overlay: alpha(PRIMITIVE.color.navy[900], 0.16),
  focusGlow: alpha(PRIMITIVE.color.blue[500], 0.16),
  graphLine: alpha(PRIMITIVE.color.blue[500], 0.35),
};

const STATE = {
  urgent: { label: "Urgent", text: ROLE.urgentText, surface: ROLE.urgentSurface, border: ROLE.urgentBorder },
  active: { label: "Active", text: ROLE.activeText, surface: ROLE.activeSurface, border: ROLE.activeBorder },
  healthy: { label: "Healthy", text: ROLE.healthyText, surface: ROLE.healthySurface, border: ROLE.healthyBorder },
  blocked: { label: "Blocked", text: ROLE.blockedText, surface: ROLE.blockedSurface, border: ROLE.blockedBorder },
};

const TOKENS = {
  color: PRIMITIVE.color,
  role: ROLE,
  state: STATE,
  type: PRIMITIVE.type,
  space: PRIMITIVE.space,
  radius: PRIMITIVE.radius,
  shadow: PRIMITIVE.shadow,
  motion: PRIMITIVE.motion,
  breakpoint: PRIMITIVE.breakpoint,
  density: PRIMITIVE.density,
  height: PRIMITIVE.height,
};

const SECTIONS = [
  "System Positioning",
  "Palette + Ladders",
  "Semantic Roles",
  "Typography",
  "Spacing + Geometry",
  "Motion + Focus",
  "Buttons + Controls",
  "Status + Gap Language",
  "Command Surface",
  "Sheet System",
  "Workspace System",
  "Graph Reward",
  "Family Specimens",
  "Edge Cases",
  "Decision Ledger",
];

const COMMAND_MODES = [
  { id: "brief", label: "Brief", description: "Narrative density for orientation and reasoning." },
  { id: "grid", label: "Grid", description: "Spatial density for scanning and comparison." },
  { id: "queue", label: "Queue", description: "Action density for sequential execution." },
];

const SCENARIOS = {
  objects: [
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
      next: "Once the autopsy sharpens the failure mode, the next loop becomes one corrective move instead of generic deal anxiety.",
      connections: ["Account: Vantive", "Signal Console: 3 active threads", "Proof: not yet credible", "Advisor: available"],
      lenses: ["Overview", "Discovery", "Call Plan", "Future Autopsy", "Proof", "Advisor"],
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
      lenses: ["Overview", "Signals", "Outbound", "LinkedIn", "Cold Call"],
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
      lenses: ["Definition", "Territory", "Sourcing"],
    },
    {
      id: "proof-vantive",
      family: "Execution + Proof",
      type: "Proof",
      state: "active",
      metric: "3",
      metricLabel: "proof gaps",
      title: "Vantive proof plan",
      brief: "The proof skeleton exists, but readout ownership and success boundaries are still too soft to trust commercially.",
      primary: "Tighten proof",
      fallback: "Open deal context",
      gaps: ["Readout owner unclear", "Boundary conditions weak", "Commercial tie-back thin"],
      next: "Once the proof reads as credible, readiness and handoff can inherit actual conviction instead of placeholders.",
      connections: ["Deal: Vantive", "Readiness: improving", "Handoff: waiting on proof"],
      lenses: ["Scope", "Success", "Boundaries", "Readout"],
    },
  ],
  families: [
    { label: "Activation", modules: "Onboarding, Welcome, Dashboard", cue: "User should feel oriented, not lectured." },
    { label: "Targeting", modules: "ICP Studio, Territory Architect, Sourcing Workbench", cue: "User should feel decisive and sharper than before." },
    { label: "Signal + Motion", modules: "Signal Console, Outbound Studio, LinkedIn Playbook, Cold Call Studio", cue: "Noise collapses into one next move." },
    { label: "Execution + Proof", modules: "Call Planner, Discovery Studio, Deal Workspace, Future Autopsy, PoC Framework, Advisor Deploy", cue: "User feels in control and honest at the same time." },
    { label: "Synthesis + Handoff", modules: "Quota Workback, Readiness, Playbook / Handoff Kit", cue: "The system feels compounding and transfer-ready." },
    { label: "Public + Trust", modules: "Auth, Settings, Methodology, Purchase, Demo, Coming Soon", cue: "Trust corridor feels premium and calm, not ornamental." },
  ],
  edgeCases: [
    { label: "Sparse", tone: "active", title: "Founder workspace", copy: "One live ICP, no logged motions, enough truth to orient but not enough to coast." },
    { label: "Loading", tone: "active", title: "Signal refresh", copy: "System is enriching the account so the next move sharpens instead of guessing." },
    { label: "Error", tone: "blocked", title: "Sync failure", copy: "The workspace hit an upstream failure. Recover the session before trusting the brief." },
    { label: "Stale", tone: "urgent", title: "Deal confidence decaying", copy: "The deal still exists, but the last real operating evidence is aging out." },
  ],
  decisionLocks: [
    "Bright base. Navy authority. Blue structure. Orange pressure. Green health.",
    "Plus Jakarta Sans for display, Outfit for body, Space Mono for system text.",
    "Sharpen controls. Soften surfaces. Keep pills full-round.",
    "One dominant next move. Everything else quieter.",
    "Sheets must feel denser than the command blocks that opened them.",
    "Workspace must feel like an instrument, not the old module shell with new paint.",
    "Graph stays hidden, rewarding, and diagnostic.",
    "Signal Console and Future Autopsy remain premium named assets.",
  ],
};

function displayStyle(tier, color = ROLE.textPrimary, extra = {}) {
  const token = PRIMITIVE.type.display[tier];
  return {
    fontFamily: PRIMITIVE.type.family.display,
    fontSize: token.size,
    lineHeight: token.line,
    fontWeight: token.weight,
    letterSpacing: "-0.04em",
    color,
    margin: 0,
    ...extra,
  };
}

function metricStyle(tier, color = ROLE.textPrimary, extra = {}) {
  const token = PRIMITIVE.type.metric[tier];
  return {
    fontFamily: PRIMITIVE.type.family.display,
    fontSize: token.size,
    lineHeight: token.line,
    fontWeight: token.weight,
    letterSpacing: "-0.05em",
    color,
    margin: 0,
    ...extra,
  };
}

function bodyStyle(tier, color = ROLE.textSecondary, weight, extra = {}) {
  const token = PRIMITIVE.type.body[tier];
  return {
    fontFamily: PRIMITIVE.type.family.body,
    fontSize: token.size,
    lineHeight: token.line,
    fontWeight: weight || token.weight,
    color,
    margin: 0,
    ...extra,
  };
}

function monoStyle(tier, color = ROLE.textMuted, extra = {}) {
  const token = PRIMITIVE.type.system[tier];
  return {
    fontFamily: PRIMITIVE.type.family.system,
    fontSize: token.size,
    lineHeight: token.line,
    fontWeight: token.weight,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color,
    margin: 0,
    ...extra,
  };
}

function Surface({ children, tint = "base", padding = PRIMITIVE.space[6], radius = PRIMITIVE.radius.surfaceMd, shadow = PRIMITIVE.shadow.sm, style = {} }) {
  const backgroundMap = {
    base: ROLE.surface,
    info: ROLE.surfaceAlt,
    pressure: ROLE.surfaceSoft,
    structure: ROLE.surfaceStrong,
  };

  return (
    <div
      style={{
        background: backgroundMap[tint] || ROLE.surface,
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

function SectionHeader({ eyebrow, title, copy }) {
  return (
    <div style={{ display: "grid", gap: PRIMITIVE.space[3], marginBottom: PRIMITIVE.space[6] }}>
      <p style={monoStyle("md", ROLE.link)}>{eyebrow}</p>
      <h2 style={displayStyle("h3")}>{title}</h2>
      <p style={bodyStyle("md", ROLE.textSecondary, 500, { maxWidth: 900 })}>{copy}</p>
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
        ...monoStyle("md", value.text),
        display: "inline-flex",
        alignItems: "center",
        height: PRIMITIVE.height.sm,
        padding: `0 ${PRIMITIVE.space[3]}px`,
        borderRadius: PRIMITIVE.radius.full,
        border: `1px solid ${value.border}`,
        background: value.bg,
      }}
    >
      {label}
    </span>
  );
}

function GapBadge({ count }) {
  return <Chip tone="urgent" label={`⊘ ${count} gaps`} />;
}

function Button({ label, variant = "primary", state = "default", style = {} }) {
  const variantMap = {
    primary: {
      default: { bg: ROLE.actionPrimary, text: ROLE.actionPrimaryText, border: ROLE.actionPrimary, shadow: PRIMITIVE.shadow.sm },
      hover: { bg: ROLE.actionPrimaryHover, text: ROLE.actionPrimaryText, border: ROLE.actionPrimaryHover, shadow: PRIMITIVE.shadow.md },
      active: { bg: ROLE.actionPrimaryPressed, text: ROLE.actionPrimaryText, border: ROLE.actionPrimaryPressed, shadow: PRIMITIVE.shadow.sm },
      disabled: { bg: ROLE.border, text: ROLE.textMuted, border: ROLE.border, shadow: PRIMITIVE.shadow.none },
    },
    secondary: {
      default: { bg: ROLE.actionSecondary, text: ROLE.actionSecondaryText, border: ROLE.actionSecondaryBorder, shadow: PRIMITIVE.shadow.none },
      hover: { bg: ROLE.actionSecondaryHover, text: ROLE.actionSecondaryText, border: ROLE.actionSecondaryBorder, shadow: PRIMITIVE.shadow.none },
      active: { bg: ROLE.actionSecondaryPressed, text: ROLE.actionSecondaryText, border: ROLE.actionSecondaryBorder, shadow: PRIMITIVE.shadow.none },
      disabled: { bg: ROLE.surfaceStrong, text: ROLE.textMuted, border: ROLE.border, shadow: PRIMITIVE.shadow.none },
    },
    tertiary: {
      default: { bg: "transparent", text: ROLE.link, border: "transparent", shadow: PRIMITIVE.shadow.none },
      hover: { bg: ROLE.surfaceAlt, text: ROLE.link, border: ROLE.activeBorder, shadow: PRIMITIVE.shadow.none },
      active: { bg: ROLE.surfaceStrong, text: ROLE.link, border: ROLE.activeBorder, shadow: PRIMITIVE.shadow.none },
      disabled: { bg: "transparent", text: ROLE.textMuted, border: "transparent", shadow: PRIMITIVE.shadow.none },
    },
    blocked: {
      default: { bg: ROLE.blockedText, text: ROLE.textInverse, border: ROLE.blockedText, shadow: PRIMITIVE.shadow.sm },
      hover: { bg: PRIMITIVE.color.red[800], text: ROLE.textInverse, border: PRIMITIVE.color.red[800], shadow: PRIMITIVE.shadow.md },
      active: { bg: PRIMITIVE.color.red[900], text: ROLE.textInverse, border: PRIMITIVE.color.red[900], shadow: PRIMITIVE.shadow.sm },
      disabled: { bg: ROLE.border, text: ROLE.textMuted, border: ROLE.border, shadow: PRIMITIVE.shadow.none },
    },
  };
  const resolved = variantMap[variant][state];

  return (
    <div
      style={{
        ...bodyStyle("xs", resolved.text, 700),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: PRIMITIVE.height.lg,
        padding: `0 ${PRIMITIVE.space[4]}px`,
        borderRadius: PRIMITIVE.radius.button,
        background: resolved.bg,
        border: `1px solid ${resolved.border}`,
        boxShadow: resolved.shadow,
        minWidth: 132,
        ...style,
      }}
    >
      {label}
    </div>
  );
}

function SegmentedControl({ value, onChange }) {
  return (
    <div style={{ display: "inline-flex", gap: PRIMITIVE.space[2], padding: PRIMITIVE.space[1], background: ROLE.surfaceAlt, borderRadius: PRIMITIVE.radius.full, border: `1px solid ${ROLE.border}` }}>
      {COMMAND_MODES.map((mode) => {
        const active = mode.id === value;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            style={{
              ...bodyStyle("xs", active ? ROLE.textInverse : ROLE.textSecondary, 700, { cursor: "pointer" }),
              height: PRIMITIVE.height.md,
              padding: `0 ${PRIMITIVE.space[3]}px`,
              borderRadius: PRIMITIVE.radius.full,
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

function Swatch({ name, value, label, textColor = ROLE.textPrimary }) {
  return (
    <div style={{ display: "grid", gap: PRIMITIVE.space[2] }}>
      <div style={{ height: 88, borderRadius: PRIMITIVE.radius.surfaceSm, background: value, border: `1px solid ${ROLE.border}`, boxShadow: PRIMITIVE.shadow.sm }} />
      <div>
        <p style={monoStyle("md", ROLE.textMuted)}>{name}</p>
        <p style={bodyStyle("xs", textColor, 700)}>{label}</p>
      </div>
    </div>
  );
}

function MetricAnchor({ value, label, tone = "neutral" }) {
  const colorMap = {
    neutral: ROLE.textPrimary,
    urgent: ROLE.urgentText,
    active: ROLE.activeText,
    healthy: ROLE.healthyText,
  };
  return (
    <div style={{ display: "grid", gap: PRIMITIVE.space[1] }}>
      <p style={metricStyle("lg", colorMap[tone])}>{value}</p>
      <p style={monoStyle("md", ROLE.textMuted)}>{label}</p>
    </div>
  );
}

function BriefCard({ item, active, onSelect }) {
  const tone = STATE[item.state];
  return (
    <button
      onClick={() => onSelect(item.id)}
      style={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${active ? ROLE.borderSelected : ROLE.border}`,
        borderLeft: `8px solid ${tone.text}`,
        borderRadius: PRIMITIVE.radius.surfaceMd,
        background: ROLE.surface,
        boxShadow: PRIMITIVE.shadow.sm,
        padding: PRIMITIVE.space[5],
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: PRIMITIVE.space[4], alignItems: "start" }}>
        <div style={{ display: "grid", gap: PRIMITIVE.space[4], flex: 1 }}>
          <div style={{ display: "flex", gap: PRIMITIVE.space[2], flexWrap: "wrap" }}>
            <Chip label={tone.label} tone={item.state} />
            <GapBadge count={item.gaps.length} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "136px 1fr", gap: PRIMITIVE.space[4], alignItems: "start" }}>
            <MetricAnchor value={item.metric} label={item.metricLabel} tone={item.state} />
            <div style={{ display: "grid", gap: PRIMITIVE.space[2] }}>
              <h3 style={displayStyle("h4")}>{item.title}</h3>
              <p style={bodyStyle("sm", ROLE.textSecondary)}>{item.brief}</p>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: PRIMITIVE.space[2], minWidth: 140, justifyItems: "end" }}>
          {active ? <Chip label="Next move" tone="info" /> : null}
          <p style={bodyStyle("xs", ROLE.urgentText, 700, { textAlign: "right" })}>{item.primary}</p>
        </div>
      </div>
    </button>
  );
}

function GridCard({ item, featured, onSelect }) {
  const tone = STATE[item.state];
  return (
    <button
      onClick={() => onSelect(item.id)}
      style={{
        position: "relative",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${featured ? ROLE.borderSelected : ROLE.border}`,
        borderRadius: PRIMITIVE.radius.surfaceMd,
        background: ROLE.surface,
        boxShadow: featured ? PRIMITIVE.shadow.md : PRIMITIVE.shadow.sm,
        padding: PRIMITIVE.space[5],
      }}
    >
      {featured ? <div style={{ position: "absolute", inset: "0 0 auto 0", height: 6, background: ROLE.info, borderTopLeftRadius: PRIMITIVE.radius.surfaceMd, borderTopRightRadius: PRIMITIVE.radius.surfaceMd }} /> : null}
      <div style={{ display: "flex", justifyContent: "space-between", gap: PRIMITIVE.space[2], marginTop: featured ? PRIMITIVE.space[2] : 0 }}>
        <Chip label={tone.label} tone={item.state} />
        <GapBadge count={item.gaps.length} />
      </div>
      <div style={{ display: "flex", gap: PRIMITIVE.space[3], alignItems: "end", marginTop: PRIMITIVE.space[4] }}>
        <p style={metricStyle("lg", tone.text)}>{item.metric}</p>
        <p style={monoStyle("md", ROLE.textMuted, { marginBottom: 8 })}>{item.metricLabel}</p>
      </div>
      <h3 style={displayStyle("h4", ROLE.textPrimary, { marginTop: PRIMITIVE.space[3] })}>{item.title}</h3>
      <p style={bodyStyle("xs", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[2] })}>{item.brief}</p>
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
        borderRadius: PRIMITIVE.radius.surfaceSm,
        background: ROLE.surface,
        boxShadow: PRIMITIVE.shadow.sm,
        padding: PRIMITIVE.space[4],
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: PRIMITIVE.space[3], alignItems: "center" }}>
        <p style={metricStyle("sm", STATE[item.state].text)}>{rank}</p>
        <div>
          <p style={bodyStyle("sm", ROLE.textPrimary, 700)}>{item.title}</p>
          <p style={bodyStyle("xs", ROLE.textSecondary, 500, { marginTop: 4 })}>{item.primary}</p>
        </div>
        <p style={metricStyle("sm")}>{item.metric}</p>
      </div>
    </button>
  );
}

function SheetPreview({ item }) {
  const tone = STATE[item.state];
  return (
    <Surface radius={PRIMITIVE.radius.sheet} shadow={PRIMITIVE.shadow.lg} padding={PRIMITIVE.space[6]}>
      <div style={{ display: "grid", gap: PRIMITIVE.space[5] }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: PRIMITIVE.space[4], alignItems: "start" }}>
          <div style={{ display: "grid", gap: PRIMITIVE.space[3] }}>
            <div style={{ display: "flex", gap: PRIMITIVE.space[2], flexWrap: "wrap" }}>
              <Chip label={tone.label} tone={item.state} />
              <GapBadge count={item.gaps.length} />
            </div>
            <h3 style={displayStyle("h3")}>{item.title}</h3>
          </div>
          <Chip label="Dense inspection" tone="info" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "172px 1fr", gap: PRIMITIVE.space[4] }}>
          <Surface tint="info" shadow={PRIMITIVE.shadow.none} style={{ padding: PRIMITIVE.space[5] }}>
            <MetricAnchor value={item.metric} label={item.metricLabel} tone={item.state} />
          </Surface>
          <div
            style={{
              background: tone.surface,
              border: `1px solid ${tone.border}`,
              borderLeft: `8px solid ${tone.text}`,
              borderRadius: PRIMITIVE.radius.surfaceMd,
              padding: PRIMITIVE.space[5],
            }}
          >
            <p style={bodyStyle("md", ROLE.textPrimary, 600)}>{item.brief}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: PRIMITIVE.space[4] }}>
          <Surface shadow={PRIMITIVE.shadow.none} style={{ padding: PRIMITIVE.space[5] }}>
            <p style={monoStyle("md", ROLE.gapText)}>⊘ explicit gaps</p>
            <div style={{ display: "grid", gap: PRIMITIVE.space[3], marginTop: PRIMITIVE.space[4] }}>
              {item.gaps.map((gap) => (
                <p key={gap} style={bodyStyle("sm", ROLE.textPrimary, 600)}>{gap}</p>
              ))}
            </div>
            <p style={monoStyle("md", ROLE.link, { marginTop: PRIMITIVE.space[5] })}>connections</p>
            <div style={{ display: "grid", gap: PRIMITIVE.space[2], marginTop: PRIMITIVE.space[4] }}>
              {item.connections.map((line) => (
                <p key={line} style={bodyStyle("xs", ROLE.textSecondary)}>{line}</p>
              ))}
            </div>
          </Surface>
          <Surface shadow={PRIMITIVE.shadow.none} style={{ padding: PRIMITIVE.space[5] }}>
            <p style={monoStyle("md", ROLE.link)}>next loop consequence</p>
            <h4 style={displayStyle("h4", ROLE.textPrimary, { marginTop: PRIMITIVE.space[4] })}>{item.primary}</h4>
            <p style={bodyStyle("xs", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[3] })}>{item.next}</p>
            <div style={{ display: "flex", gap: PRIMITIVE.space[3], flexWrap: "wrap", marginTop: PRIMITIVE.space[5] }}>
              <Button label="Go deeper ->" />
              <Button label={item.fallback} variant="secondary" />
            </div>
          </Surface>
        </div>
      </div>
    </Surface>
  );
}

function WorkspacePreview({ item, activeLens, onLensChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: PRIMITIVE.space[5] }}>
      <div style={{ display: "grid", gap: PRIMITIVE.space[4], alignContent: "start" }}>
        <Surface padding={PRIMITIVE.space[5]}>
          <Chip label={item.family} tone="info" />
          <h3 style={displayStyle("h4", ROLE.textPrimary, { marginTop: PRIMITIVE.space[4] })}>{item.title}</h3>
          <p style={bodyStyle("xs", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[3] })}>{item.brief}</p>
        </Surface>
        <Surface padding={PRIMITIVE.space[5]}>
          <p style={monoStyle("md", ROLE.urgentText)}>preserved deep room</p>
          <p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[3] })}>{activeLens}</p>
          <p style={bodyStyle("xs", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[2] })}>
            The architecture changes the hallway and context carry-forward. It does not flatten the strategic method inside the room.
          </p>
        </Surface>
      </div>
      <div style={{ display: "grid", gap: PRIMITIVE.space[4] }}>
        <Surface padding={PRIMITIVE.space[4]}>
          <div style={{ display: "flex", gap: PRIMITIVE.space[2], flexWrap: "wrap" }}>
            {item.lenses.map((lens) => {
              const active = lens === activeLens;
              return (
                <button
                  key={lens}
                  onClick={() => onLensChange(lens)}
                  style={{
                    ...bodyStyle("xs", active ? ROLE.textInverse : ROLE.textPrimary, 700, { cursor: "pointer" }),
                    height: PRIMITIVE.height.md,
                    padding: `0 ${PRIMITIVE.space[3]}px`,
                    borderRadius: PRIMITIVE.radius.full,
                    border: active ? "none" : `1px solid ${ROLE.borderStrong}`,
                    background: active ? ROLE.info : ROLE.surfaceAlt,
                  }}
                >
                  {lens}
                </button>
              );
            })}
          </div>
        </Surface>
        <Surface radius={PRIMITIVE.radius.surfaceLg} shadow={PRIMITIVE.shadow.lg} padding={PRIMITIVE.space[6]}>
          <p style={monoStyle("md", ROLE.link)}>workspace instrument</p>
          <h3 style={displayStyle("h3", ROLE.textPrimary, { marginTop: PRIMITIVE.space[4] })}>{activeLens}</h3>
          <p style={bodyStyle("sm", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[3], maxWidth: 760 })}>
            Surface text gets shorter as the user goes deeper. The header anchors object truth, the rail carries context, and the room itself preserves the method.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: PRIMITIVE.space[4], marginTop: PRIMITIVE.space[5] }}>
            <Surface tint="info" shadow={PRIMITIVE.shadow.none} style={{ padding: PRIMITIVE.space[4] }}>
              <p style={monoStyle("md", ROLE.link)}>object</p>
              <p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>{item.type}</p>
            </Surface>
            <Surface tint="pressure" shadow={PRIMITIVE.shadow.none} style={{ padding: PRIMITIVE.space[4] }}>
              <p style={monoStyle("md", ROLE.urgentText)}>primary move</p>
              <p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>{item.primary}</p>
            </Surface>
            <Surface shadow={PRIMITIVE.shadow.none} style={{ padding: PRIMITIVE.space[4], border: `1px dashed ${ROLE.borderStrong}` }}>
              <p style={monoStyle("md", ROLE.textMuted)}>downstream</p>
              <p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>{item.next}</p>
            </Surface>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function GraphPreview({ items }) {
  return (
    <Surface
      radius={PRIMITIVE.radius.sheet}
      shadow={PRIMITIVE.shadow.lg}
      padding={PRIMITIVE.space[7]}
      style={{ background: `linear-gradient(180deg, ${ROLE.surface} 0%, ${PRIMITIVE.color.blue[50]} 100%)` }}
    >
      <div style={{ display: "grid", gap: PRIMITIVE.space[4] }}>
        <Chip label="Hidden diagnostic reward" tone="info" />
        <h3 style={displayStyle("h2", ROLE.textPrimary, { maxWidth: 860 })}>Something super cool you did that you didn't know you did.</h3>
        <p style={bodyStyle("md", ROLE.textSecondary, 500, { maxWidth: 860 })}>
          The graph is not a daily workspace. It is the moment Antaeus shows the user that their ICP, signals, deals, proof, and handoff are compounding into one operating structure.
        </p>
        <div style={{ position: "relative", height: 280, marginTop: PRIMITIVE.space[3] }}>
          <svg viewBox="0 0 880 280" width="100%" height="100%" preserveAspectRatio="none">
            <path d="M120 150 C260 80 360 80 450 140" stroke={ROLE.graphLine} strokeWidth="2" strokeDasharray="8 8" fill="none" />
            <path d="M450 140 C560 210 670 220 770 156" stroke={ROLE.graphLine} strokeWidth="2" strokeDasharray="8 8" fill="none" />
            <path d="M450 140 C520 90 610 70 700 86" stroke={ROLE.graphLine} strokeWidth="2" strokeDasharray="8 8" fill="none" />
          </svg>
          <div style={{ position: "absolute", inset: 0 }}>
            {items.map((item, index) => {
              const positions = [
                { left: "4%", top: "38%" },
                { left: "33%", top: "8%" },
                { left: "42%", top: "46%" },
                { left: "72%", top: "20%" },
              ];
              return (
                <div
                  key={item.id}
                  style={{
                    position: "absolute",
                    ...positions[index],
                    width: 164,
                    padding: PRIMITIVE.space[4],
                    borderRadius: PRIMITIVE.radius.full,
                    background: index === 0 ? ROLE.urgentSurface : index === 1 ? ROLE.activeSurface : index === 2 ? ROLE.surfaceStrong : ROLE.healthySurface,
                    border: `1px dashed ${ROLE.borderStrong}`,
                    textAlign: "center",
                    boxShadow: PRIMITIVE.shadow.sm,
                  }}
                >
                  <p style={monoStyle("md", ROLE.textMuted)}>{item.type}</p>
                  <p style={bodyStyle("xs", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Surface>
  );
}

function renderSection(name, context) {
  const { commandMode, setCommandMode, selected, selectObject, activeLens, setActiveLens } = context;
  const objects = SCENARIOS.objects;

  if (name === "System Positioning") {
    return (
      <>
        <SectionHeader
          eyebrow="System Position"
          title="Antaeus should read like a premium operating instrument, not a stacked SaaS dashboard."
          copy="This lab exists to prove the visual truth before more production work drifts back toward the old shell. The aim is attraction before instruction, clarity before explanation, and consequence before decoration."
        />
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: PRIMITIVE.space[5] }}>
          <Surface radius={PRIMITIVE.radius.surfaceLg} shadow={PRIMITIVE.shadow.lg} style={{ padding: PRIMITIVE.space[7] }}>
            <div style={{ display: "flex", gap: PRIMITIVE.space[2], flexWrap: "wrap" }}>
              <Chip label="bright base" tone="info" />
              <Chip label="navy authority" tone="neutral" />
              <Chip label="orange pressure" tone="urgent" />
              <Chip label="blue structure" tone="active" />
            </div>
            <h1 style={displayStyle("h1", ROLE.textPrimary, { marginTop: PRIMITIVE.space[5], maxWidth: 900 })}>
              The visual system should feel calm under pressure and impossible to confuse with the old interface.
            </h1>
            <p style={bodyStyle("lg", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[4], maxWidth: 820 })}>
              The product no longer opens as a hallway of modules. It opens as a command surface that ranks pressure, preserves strategic depth, and carries context forward into the next room.
            </p>
          </Surface>
          <div style={{ display: "grid", gap: PRIMITIVE.space[4] }}>
            {[
              ["Command", "Orientation before work. One dominant move per object."],
              ["Sheet", "Denser inspection. Narrative context, explicit gaps, explicit consequence."],
              ["Workspace", "Object continuity and preserved method inside a sharper room."],
              ["Graph", "Hidden reward. Diagnostic, not daily navigation."],
            ].map(([label, copy]) => (
              <Surface key={label} padding={PRIMITIVE.space[5]}>
                <p style={monoStyle("md", ROLE.link)}>{label}</p>
                <p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>{copy}</p>
              </Surface>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (name === "Palette + Ladders") {
    const ladders = [
      ["neutral", PRIMITIVE.color.neutral],
      ["orange", PRIMITIVE.color.orange],
      ["blue", PRIMITIVE.color.blue],
      ["navy", PRIMITIVE.color.navy],
      ["green", PRIMITIVE.color.green],
      ["red", PRIMITIVE.color.red],
    ];

    return (
      <>
        <SectionHeader eyebrow="Palette" title="The system is neutral-dominant. Accent is rationed to meaning." copy="Orange is pressure and primary action. Blue is structure and focus. Navy is authority. Green is health. Red is true breakage. None of them should become atmosphere by accident." />
        <div style={{ display: "grid", gap: PRIMITIVE.space[6] }}>
          {ladders.map(([label, ladder]) => (
            <Surface key={label} padding={PRIMITIVE.space[5]}>
              <p style={monoStyle("md", ROLE.textMuted)}>{label} ladder</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(10, minmax(0,1fr))", gap: PRIMITIVE.space[2], marginTop: PRIMITIVE.space[4] }}>
                {Object.entries(ladder).map(([step, value]) => (
                  <Swatch key={step} name={step} value={value} label={value} textColor={Number(step) >= 600 ? ROLE.textInverse : ROLE.textPrimary} />
                ))}
              </div>
            </Surface>
          ))}
        </div>
      </>
    );
  }

  if (name === "Semantic Roles") {
    return (
      <>
        <SectionHeader eyebrow="Semantic Roles" title="Meaning beats hue." copy="The same few hues do different jobs depending on role. The point is not more color. The point is clearer behavioral meaning." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: PRIMITIVE.space[4] }}>
          <Surface><p style={monoStyle("md", ROLE.textMuted)}>page / surface</p><p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>Bright page field, white surfaces, occasional soft tints only when meaning justifies it.</p></Surface>
          <Surface><p style={monoStyle("md", ROLE.textMuted)}>action / focus</p><p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>Orange for the one next move. Blue for structure, selection, and focus.</p></Surface>
          <Surface><p style={monoStyle("md", ROLE.textMuted)}>state / gap</p><p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>Urgent, Active, Healthy, Blocked. Gap markers stay explicit and quiet, not theatrical.</p></Surface>
        </div>
      </>
    );
  }

  if (name === "Typography") {
    return (
      <>
        <SectionHeader eyebrow="Typography" title="Typography does the heavy lifting before color does." copy="Plus Jakarta Sans anchors display and metrics. Outfit carries readable body density. Space Mono handles system labels, chips, and instrument metadata." />
        <div style={{ display: "grid", gap: PRIMITIVE.space[4] }}>
          <Surface><p style={monoStyle("md", ROLE.link)}>display / 48-56</p><h2 style={displayStyle("h1")}>Primary attention should hit before the user starts reading.</h2></Surface>
          <Surface><p style={monoStyle("md", ROLE.link)}>metric / 42-52</p><div style={{ display: "flex", gap: PRIMITIVE.space[6], flexWrap: "wrap" }}><MetricAnchor value="11" label="days in stage 2" tone="urgent" /><MetricAnchor value="62" label="signal heat" tone="active" /><MetricAnchor value="84" label="quality score" tone="healthy" /></div></Surface>
          <Surface><p style={monoStyle("md", ROLE.link)}>body + system</p><p style={bodyStyle("md", ROLE.textSecondary)}>Surface copy should stay shorter than before, but it still needs to carry real reasoning. System labels stay in mono so the interface keeps an instrument feel without looking developer-first.</p></Surface>
        </div>
      </>
    );
  }

  if (name === "Spacing + Geometry") {
    return (
      <>
        <SectionHeader eyebrow="Spacing + Geometry" title="Sharpen the controls. Soften the surfaces." copy="Controls should feel instrumental, not toy-like. Surfaces should feel premium and calm. That hierarchy matters." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: PRIMITIVE.space[4] }}>
          <Surface><p style={monoStyle("md", ROLE.textMuted)}>4px base rhythm</p><div style={{ display: "grid", gap: PRIMITIVE.space[2], marginTop: PRIMITIVE.space[4] }}>{Object.entries(PRIMITIVE.space).map(([key, value]) => <div key={key} style={{ display: "grid", gridTemplateColumns: "48px 1fr 40px", gap: PRIMITIVE.space[2], alignItems: "center" }}><p style={monoStyle("md", ROLE.textMuted)}>{key}</p><div style={{ height: 12, width: `${value * 4}px`, borderRadius: PRIMITIVE.radius.full, background: ROLE.info }} /><p style={bodyStyle("xs", ROLE.textSecondary, 600)}>{value}</p></div>)}</div></Surface>
          <Surface><p style={monoStyle("md", ROLE.textMuted)}>radius</p><div style={{ display: "grid", gap: PRIMITIVE.space[3], marginTop: PRIMITIVE.space[4] }}>{[{ label: "control", value: PRIMITIVE.radius.control }, { label: "surfaceSm", value: PRIMITIVE.radius.surfaceSm }, { label: "surfaceLg", value: PRIMITIVE.radius.surfaceLg }, { label: "sheet", value: PRIMITIVE.radius.sheet }].map((item) => <div key={item.label} style={{ padding: PRIMITIVE.space[3], borderRadius: item.value, background: ROLE.surfaceAlt, border: `1px solid ${ROLE.border}` }}><p style={bodyStyle("xs", ROLE.textPrimary, 700)}>{item.label} / {item.value}px</p></div>)}</div></Surface>
          <Surface><p style={monoStyle("md", ROLE.textMuted)}>height scale</p><div style={{ display: "grid", gap: PRIMITIVE.space[3], marginTop: PRIMITIVE.space[4] }}>{Object.entries(PRIMITIVE.height).map(([key, value]) => <div key={key} style={{ height: value, borderRadius: PRIMITIVE.radius.button, border: `1px solid ${ROLE.borderStrong}`, background: key === "xl" ? ROLE.surfaceSoft : ROLE.surface, display: "flex", alignItems: "center", padding: `0 ${PRIMITIVE.space[3]}px` }}><p style={bodyStyle("xs", ROLE.textPrimary, 700)}>{key} / {value}px</p></div>)}</div></Surface>
        </div>
      </>
    );
  }

  if (name === "Motion + Focus") {
    return (
      <>
        <SectionHeader eyebrow="Motion + Focus" title="Motion should reward clarity, not decorate the page." copy="Hover, press, sheet rise, and workspace transitions each get their own timing. Focus must read premium and keyboard-safe." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: PRIMITIVE.space[4] }}>
          <Surface><p style={monoStyle("md", ROLE.textMuted)}>motion ladder</p><div style={{ display: "grid", gap: PRIMITIVE.space[3], marginTop: PRIMITIVE.space[4] }}>{Object.entries(PRIMITIVE.motion.duration).map(([key, value]) => <div key={key} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: PRIMITIVE.space[3] }}><p style={bodyStyle("xs", ROLE.textPrimary, 700)}>{key}</p><p style={bodyStyle("xs", ROLE.textSecondary)}>{value}</p></div>)}</div></Surface>
          <Surface><p style={monoStyle("md", ROLE.textMuted)}>focus + density</p><div style={{ display: "grid", gap: PRIMITIVE.space[4], marginTop: PRIMITIVE.space[4] }}><div style={{ height: PRIMITIVE.height.lg, borderRadius: PRIMITIVE.radius.button, background: ROLE.surface, border: `2px solid ${ROLE.focus}`, boxShadow: `0 0 0 4px ${ROLE.focusGlow}` }} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: PRIMITIVE.space[3] }}><Surface tint="info" shadow={PRIMITIVE.shadow.none}><p style={bodyStyle("xs", ROLE.textPrimary, 700)}>Comfortable</p><p style={bodyStyle("xs", ROLE.textSecondary)}>Brief, sheet, onboarding, trust corridor.</p></Surface><Surface shadow={PRIMITIVE.shadow.none}><p style={bodyStyle("xs", ROLE.textPrimary, 700)}>Compact</p><p style={bodyStyle("xs", ROLE.textSecondary)}>Grid, queue, high-density internal scanning.</p></Surface></div></div></Surface>
        </div>
      </>
    );
  }

  if (name === "Buttons + Controls") {
    return (
      <>
        <SectionHeader eyebrow="Controls" title="Controls should force hierarchy with structure, not with random brightness." copy="One true primary move. One fallback. Everything else quieter. No default floating action button pattern." />
        <div style={{ display: "grid", gap: PRIMITIVE.space[4] }}>
          <Surface><div style={{ display: "flex", gap: PRIMITIVE.space[3], flexWrap: "wrap" }}><Button label="Primary next move" variant="primary" /><Button label="Secondary fallback" variant="secondary" /><Button label="Inline command" variant="tertiary" /><Button label="Blocked action" variant="blocked" /></div></Surface>
          <Surface><p style={monoStyle("md", ROLE.link)}>interaction states</p><div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: PRIMITIVE.space[3], marginTop: PRIMITIVE.space[4] }}>{["default", "hover", "active", "disabled"].map((state) => <div key={state} style={{ display: "grid", gap: PRIMITIVE.space[2] }}><p style={monoStyle("md", ROLE.textMuted)}>{state}</p><Button label="Save ICP" state={state} /></div>)}</div></Surface>
          <Surface><p style={monoStyle("md", ROLE.link)}>segmented control + input shape</p><div style={{ display: "flex", gap: PRIMITIVE.space[3], flexWrap: "wrap", alignItems: "center", marginTop: PRIMITIVE.space[4] }}><SegmentedControl value={commandMode} onChange={setCommandMode} /><div style={{ height: PRIMITIVE.height.lg, minWidth: 260, padding: `0 ${PRIMITIVE.space[3]}px`, borderRadius: PRIMITIVE.radius.control, border: `1px solid ${ROLE.borderStrong}`, background: ROLE.surface, display: "flex", alignItems: "center" }}><p style={bodyStyle("xs", ROLE.textMuted)}>Search accounts, signals, or loops...</p></div></div></Surface>
        </div>
      </>
    );
  }

  if (name === "Status + Gap Language") {
    return (
      <>
        <SectionHeader eyebrow="Status" title="State language should describe the object, not an abstract rank." copy="Urgent, Active, Healthy, and Blocked describe how the object feels now. The gap marker is the visible hole that creates constructive tension." />
        <div style={{ display: "flex", gap: PRIMITIVE.space[3], flexWrap: "wrap" }}>
          <Chip label="Urgent" tone="urgent" />
          <Chip label="Active" tone="active" />
          <Chip label="Healthy" tone="healthy" />
          <Chip label="Blocked" tone="blocked" />
          <GapBadge count={3} />
        </div>
      </>
    );
  }

  if (name === "Command Surface") {
    return (
      <>
        <SectionHeader eyebrow="Command" title="Brief, Grid, and Queue are three densities of the same operating truth." copy="The user should never wonder what to do next. The command surface ranks pressure and offers one dominant move while keeping the object identity intact." />
        <Surface radius={PRIMITIVE.radius.surfaceLg} shadow={PRIMITIVE.shadow.lg} padding={PRIMITIVE.space[6]}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: PRIMITIVE.space[4], flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "grid", gap: PRIMITIVE.space[2] }}>
              <Chip label="Command layer" tone="info" />
              <h3 style={displayStyle("h3")}>One urgency engine. Three render densities.</h3>
            </div>
            <SegmentedControl value={commandMode} onChange={setCommandMode} />
          </div>
          <div style={{ marginTop: PRIMITIVE.space[5], display: "grid", gap: PRIMITIVE.space[4] }}>
            {commandMode === "brief" ? objects.map((item, index) => <BriefCard key={item.id} item={item} active={index === 0} onSelect={selectObject} />) : null}
            {commandMode === "grid" ? <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: PRIMITIVE.space[4] }}>{objects.map((item, index) => <GridCard key={item.id} item={item} featured={index === 0} onSelect={selectObject} />)}</div> : null}
            {commandMode === "queue" ? <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: PRIMITIVE.space[4] }}><div style={{ display: "grid", gap: PRIMITIVE.space[3] }}>{objects.map((item, index) => <QueueRow key={item.id} item={item} rank={index + 1} selected={item.id === selected.id} onSelect={selectObject} />)}</div><Surface radius={PRIMITIVE.radius.surfaceLg} shadow={PRIMITIVE.shadow.md} style={{ padding: PRIMITIVE.space[6] }}><Chip label={STATE[selected.state].label} tone={selected.state} /><h3 style={displayStyle("h3", ROLE.textPrimary, { marginTop: PRIMITIVE.space[4] })}>{selected.title}</h3><p style={bodyStyle("sm", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[3] })}>{selected.brief}</p><div style={{ display: "flex", gap: PRIMITIVE.space[3], flexWrap: "wrap", marginTop: PRIMITIVE.space[5] }}><Button label={selected.primary} /><Button label={selected.fallback} variant="secondary" /></div></Surface></div> : null}
          </div>
        </Surface>
      </>
    );
  }

  if (name === "Sheet System") {
    return (
      <>
        <SectionHeader eyebrow="Sheet" title="The sheet must be denser than the card that opened it." copy="No airy, under-informative inspection panels. This layer exists to sharpen the reason, the gaps, and the consequence before the user commits to deep work." />
        <SheetPreview item={selected} />
      </>
    );
  }

  if (name === "Workspace System") {
    return (
      <>
        <SectionHeader eyebrow="Workspace" title="The workspace keeps object continuity visible while preserving the full strategic room." copy="This is where the app stops behaving like the old shell. The user enters a lens with context already carried forward." />
        <WorkspacePreview item={selected} activeLens={activeLens} onLensChange={setActiveLens} />
      </>
    );
  }

  if (name === "Graph Reward") {
    return (
      <>
        <SectionHeader eyebrow="Graph" title="The graph is a reward moment, not a primary navigation model." copy="It stays behind a deliberate trigger and shows the user compounding work they may not have consciously noticed they were building." />
        <GraphPreview items={objects} />
      </>
    );
  }

  if (name === "Family Specimens") {
    return (
      <>
        <SectionHeader eyebrow="Family Specimens" title="The system needs to read as one product family across very different jobs." copy="Each family should inherit the same identity while preserving its own emotional job to be done." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: PRIMITIVE.space[4] }}>
          {SCENARIOS.families.map((family) => (
            <Surface key={family.label} padding={PRIMITIVE.space[5]}>
              <p style={monoStyle("md", ROLE.link)}>{family.label}</p>
              <p style={bodyStyle("sm", ROLE.textPrimary, 700, { marginTop: PRIMITIVE.space[2] })}>{family.modules}</p>
              <p style={bodyStyle("xs", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[3] })}>{family.cue}</p>
            </Surface>
          ))}
        </div>
      </>
    );
  }

  if (name === "Edge Cases") {
    return (
      <>
        <SectionHeader eyebrow="Edge Cases" title="The product must still feel intelligent when the workspace is thin, stale, or degraded." copy="Sparse and degraded states are not dead screens. They are the moments when the system has to prove it can still guide behavior without theatrics." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: PRIMITIVE.space[4] }}>
          {SCENARIOS.edgeCases.map((item) => (
            <Surface key={item.label} padding={PRIMITIVE.space[5]} tint={item.tone === "urgent" ? "pressure" : item.tone === "active" ? "info" : "base"}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: PRIMITIVE.space[3], alignItems: "center" }}>
                <Chip label={item.label} tone={item.tone === "urgent" ? "urgent" : item.tone === "blocked" ? "blocked" : "active"} />
                <GapBadge count={item.tone === "blocked" ? 2 : 1} />
              </div>
              <h3 style={displayStyle("h4", ROLE.textPrimary, { marginTop: PRIMITIVE.space[4] })}>{item.title}</h3>
              <p style={bodyStyle("xs", ROLE.textSecondary, 500, { marginTop: PRIMITIVE.space[3] })}>{item.copy}</p>
            </Surface>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader eyebrow="Decision Ledger" title="These are the rules the next artifacts must obey." copy="This ledger exists so the visual system stops drifting. It states what is locked and what the old interface DNA is no longer allowed to reintroduce." />
      <div style={{ display: "grid", gap: PRIMITIVE.space[3] }}>
        {SCENARIOS.decisionLocks.map((line) => (
          <Surface key={line} padding={PRIMITIVE.space[4]}>
            <p style={bodyStyle("sm", ROLE.textPrimary, 600)}>{line}</p>
          </Surface>
        ))}
      </div>
    </>
  );
}

export default function DesignSystemTasteTest() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const [commandMode, setCommandMode] = useState("brief");
  const [selectedId, setSelectedId] = useState(SCENARIOS.objects[0].id);
  const selected = useMemo(() => SCENARIOS.objects.find((item) => item.id === selectedId) || SCENARIOS.objects[0], [selectedId]);
  const [activeLens, setActiveLens] = useState(SCENARIOS.objects[0].lenses[0]);
  const resolvedLens = selected.lenses.includes(activeLens) ? activeLens : selected.lenses[0];
  const selectObject = (id) => {
    const next = SCENARIOS.objects.find((item) => item.id === id) || SCENARIOS.objects[0];
    setSelectedId(next.id);
    setActiveLens(next.lenses[0]);
  };

  const context = { commandMode, setCommandMode, selected, selectObject, activeLens: resolvedLens, setActiveLens };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${ROLE.page} 0%, ${PRIMITIVE.color.blue[50]} 100%)`, padding: PRIMITIVE.space[6] }}>
      <style>{'@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap");'}</style>
      <div style={{ maxWidth: 1560, margin: "0 auto", display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", gap: PRIMITIVE.space[5], alignItems: "start" }}>
        <div style={{ position: "sticky", top: PRIMITIVE.space[6], display: "grid", gap: PRIMITIVE.space[4] }}>
          <Surface radius={PRIMITIVE.radius.surfaceLg} shadow={PRIMITIVE.shadow.md} padding={PRIMITIVE.space[5]}>
            <div style={{ display: "grid", gap: PRIMITIVE.space[3] }}>
              <Chip label="Antaeus visual system lab" tone="info" />
              <h1 style={displayStyle("h4", ROLE.textPrimary)}>Bright identity. Behavior-first structure. No old shell residue.</h1>
              <p style={bodyStyle("xs", ROLE.textSecondary, 500)}>
                This lab is a working resource in concert with the research docs, lock memos, system spec, and original taste-test artifact. It is evidence and comparison material, not standalone truth.
              </p>
            </div>
          </Surface>
          <Surface padding={PRIMITIVE.space[4]}>
            <div style={{ display: "grid", gap: PRIMITIVE.space[2] }}>
              <p style={monoStyle("md", ROLE.textMuted)}>source stack</p>
              {[
                "Deep research + color census",
                "Visual identity lock memo",
                "Visual system spec",
                "Architecture truth memo",
                "Original taste-test JSX artifact",
              ].map((line) => (
                <p key={line} style={bodyStyle("xs", ROLE.textSecondary, 500)}>{line}</p>
              ))}
            </div>
          </Surface>
          <Surface padding={PRIMITIVE.space[3]}>
            <div style={{ display: "grid", gap: PRIMITIVE.space[2] }}>
              {SECTIONS.map((section) => {
                const active = section === activeSection;
                return (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    style={{
                      ...bodyStyle("xs", active ? ROLE.textInverse : ROLE.textPrimary, 700, { textAlign: "left", cursor: "pointer" }),
                      minHeight: PRIMITIVE.height.lg,
                      padding: `${PRIMITIVE.space[2]}px ${PRIMITIVE.space[3]}px`,
                      borderRadius: PRIMITIVE.radius.surfaceSm,
                      border: active ? "none" : `1px solid transparent`,
                      background: active ? ROLE.info : "transparent",
                    }}
                  >
                    {section}
                  </button>
                );
              })}
            </div>
          </Surface>
        </div>

        <div style={{ display: "grid", gap: PRIMITIVE.space[5] }}>
          <Surface radius={PRIMITIVE.radius.surfaceLg} shadow={PRIMITIVE.shadow.lg} style={{ padding: PRIMITIVE.space[7], background: `linear-gradient(160deg, ${ROLE.surface} 0%, ${PRIMITIVE.color.orange[50]} 18%, ${PRIMITIVE.color.blue[50]} 100%)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: PRIMITIVE.space[5], flexWrap: "wrap", alignItems: "start" }}>
              <div style={{ display: "grid", gap: PRIMITIVE.space[4], maxWidth: 920 }}>
                <div style={{ display: "flex", gap: PRIMITIVE.space[2], flexWrap: "wrap" }}>
                  <Chip label="visual truth lock" tone="urgent" />
                  <Chip label="architecture-serving system" tone="info" />
                </div>
                <h1 style={displayStyle("hero", ROLE.textPrimary, { maxWidth: 980 })}>The taste test now exists to prove the new product identity, not to preserve the old interface in a nicer wrapper.</h1>
                <p style={bodyStyle("lg", ROLE.textSecondary, 500, { maxWidth: 860 })}>
                  Bright base. Navy authority. Blue structure. Orange pressure. Green health. Sharper controls. Softer surfaces. Sheets denser than cards. Workspaces that feel like instruments instead of a renamed module shell.
                </p>
              </div>
              <div style={{ display: "grid", gap: PRIMITIVE.space[3], minWidth: 240 }}>
                <Surface tint="info" shadow={PRIMITIVE.shadow.none}><MetricAnchor value="4" label="architecture layers" tone="active" /></Surface>
                <Surface tint="pressure" shadow={PRIMITIVE.shadow.none}><MetricAnchor value="1" label="dominant next move" tone="urgent" /></Surface>
                <Surface shadow={PRIMITIVE.shadow.none}><MetricAnchor value="0" label="tolerance for old shell drift" /></Surface>
              </div>
            </div>
          </Surface>

          <Surface radius={PRIMITIVE.radius.surfaceLg} shadow={PRIMITIVE.shadow.md} style={{ padding: PRIMITIVE.space[7] }}>
            {renderSection(activeSection, context)}
          </Surface>
        </div>
      </div>
    </div>
  );
}
