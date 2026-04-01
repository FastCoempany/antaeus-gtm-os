import { useMemo, useState } from "react";

/*
  ANTAEUS DESIGN-SYSTEM TASTE TEST
  Canonical system lab for the final pre-beta visual and behavioral language.
  Single-file, section-nav driven, scenario-backed.
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

const COLOR = {
  neutral: {
    0: "#FFFFFF",
    50: "#F7F8FA",
    100: "#EEF2F7",
    200: "#DCE4EC",
    300: "#A8B6C8",
    500: "#64748B",
    700: "#334155",
    850: "#131A28",
    900: "#0B1020",
    950: "#070B14",
    text: "#111827",
    on500: "#FFFFFF",
  },
  gold: {
    50: "#FBF4EC",
    100: "#F2E2D0",
    500: "#D4A574",
    600: "#C49660",
    700: "#9F7244",
    text: "#704822",
    on500: "#0B1020",
  },
  teal: {
    50: "#EDFDF8",
    100: "#D7FBF1",
    500: "#2DD4BF",
    600: "#14B8A6",
    700: "#0F766E",
    text: "#115E59",
    on500: "#072A26",
  },
  blue: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    text: "#1E40AF",
    on500: "#F8FBFF",
  },
  green: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    text: "#166534",
    on500: "#F8FFF9",
  },
  amber: {
    50: "#FFF8EB",
    100: "#FEF0C7",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    text: "#92400E",
    on500: "#1F1400",
  },
  red: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    text: "#991B1B",
    on500: "#FFF8F8",
  },
  purple: {
    50: "#FAF5FF",
    100: "#F3E8FF",
    500: "#A855F7",
    600: "#9333EA",
    700: "#7E22CE",
    text: "#6B21A8",
    on500: "#FBF5FF",
  },
};

const ROLE = {
  operating: {
    page: COLOR.neutral[950],
    shell: COLOR.neutral[900],
    rail: COLOR.neutral[850],
    card: alpha(COLOR.neutral[0], 0.05),
    elevated: alpha(COLOR.neutral[0], 0.08),
    sheet: COLOR.neutral[850],
    border: alpha(COLOR.neutral[0], 0.1),
    borderStrong: alpha(COLOR.gold[500], 0.32),
    textPrimary: COLOR.neutral[0],
    textSecondary: COLOR.neutral[100],
    textMuted: COLOR.neutral[300],
    focus: COLOR.blue[500],
    linkInfo: COLOR.blue[500],
    primaryAction: COLOR.gold[500],
    primaryActionHover: COLOR.gold[600],
    primaryActionPressed: COLOR.gold[700],
    primaryActionText: COLOR.gold.on500,
    secondaryAction: alpha(COLOR.neutral[0], 0.06),
    secondaryActionHover: alpha(COLOR.neutral[0], 0.1),
    secondaryActionPressed: alpha(COLOR.neutral[0], 0.14),
    secondaryActionText: COLOR.neutral[100],
    warning: COLOR.amber[500],
    blocked: COLOR.red[500],
    live: COLOR.teal[500],
    complete: COLOR.green[500],
    info: COLOR.blue[500],
  },
  perimeter: {
    page: COLOR.neutral[50],
    shell: COLOR.neutral[0],
    rail: COLOR.neutral[0],
    card: COLOR.neutral[0],
    elevated: COLOR.neutral[0],
    sheet: COLOR.neutral[0],
    border: COLOR.neutral[200],
    borderStrong: alpha(COLOR.gold[500], 0.34),
    textPrimary: COLOR.neutral.text,
    textSecondary: COLOR.neutral[700],
    textMuted: COLOR.neutral[500],
    focus: COLOR.blue[600],
    linkInfo: COLOR.blue[600],
    primaryAction: COLOR.gold[500],
    primaryActionHover: COLOR.gold[600],
    primaryActionPressed: COLOR.gold[700],
    primaryActionText: COLOR.gold.on500,
    secondaryAction: COLOR.neutral[100],
    secondaryActionHover: COLOR.neutral[200],
    secondaryActionPressed: COLOR.neutral[300],
    secondaryActionText: COLOR.neutral[700],
    warning: COLOR.amber[600],
    blocked: COLOR.red[600],
    live: COLOR.teal[600],
    complete: COLOR.green[600],
    info: COLOR.blue[600],
  },
};

const STATE = {
  empty: {
    label: "Not live yet",
    text: COLOR.neutral[500],
    surface: alpha(COLOR.neutral[500], 0.12),
    border: alpha(COLOR.neutral[500], 0.3),
  },
  live: {
    label: "Live",
    text: COLOR.teal[600],
    surface: alpha(COLOR.teal[500], 0.12),
    border: alpha(COLOR.teal[500], 0.34),
  },
  atRisk: {
    label: "At risk",
    text: COLOR.amber[600],
    surface: alpha(COLOR.amber[500], 0.13),
    border: alpha(COLOR.amber[500], 0.34),
  },
  blocked: {
    label: "Blocked",
    text: COLOR.red[600],
    surface: alpha(COLOR.red[500], 0.13),
    border: alpha(COLOR.red[500], 0.34),
  },
  complete: {
    label: "Complete",
    text: COLOR.green[600],
    surface: alpha(COLOR.green[500], 0.13),
    border: alpha(COLOR.green[500], 0.34),
  },
  info: {
    label: "Info",
    text: COLOR.blue[600],
    surface: alpha(COLOR.blue[500], 0.13),
    border: alpha(COLOR.blue[500], 0.34),
  },
};

const TYPE = {
  activation: { label: "Activation", accent: COLOR.teal[500] },
  targeting: { label: "Targeting", accent: COLOR.gold[500] },
  signal: { label: "Signal", accent: COLOR.blue[500] },
  motion: { label: "Motion", accent: COLOR.purple[500] },
  execution: { label: "Execution", accent: COLOR.red[500] },
  proof: { label: "Proof", accent: COLOR.amber[500] },
  synthesis: { label: "Synthesis", accent: COLOR.green[500] },
  trust: { label: "Trust", accent: COLOR.neutral[500] },
  command: { label: "Command", accent: COLOR.blue[500] },
};

const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 64 };
const RADIUS = { control: 6, button: 10, surface: 16, hero: 22, full: 9999 };
const SHADOW = {
  operatingSm: `0 6px 18px ${alpha(COLOR.neutral[950], 0.24)}`,
  operatingLg: `0 20px 50px ${alpha(COLOR.neutral[950], 0.34)}`,
  perimeterSm: `0 6px 18px ${alpha(COLOR.neutral[700], 0.08)}`,
  perimeterLg: `0 18px 48px ${alpha(COLOR.neutral[700], 0.12)}`,
};
const MOTION = {
  duration: { 50: "50ms", 100: "100ms", 150: "150ms", 200: "200ms", 250: "250ms", 300: "300ms" },
  curve: {
    decisive: "cubic-bezier(0.2, 0, 0, 1)",
    enter: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
};
const BREAKPOINT = { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1440, xxl: 1920 };
const DENSITY = {
  compact: { section: 18, card: 14, grid: 12, inputY: 8, buttonY: 8, rail: 14, label: 10 },
  standard: { section: 24, card: 18, grid: 16, inputY: 12, buttonY: 10, rail: 18, label: 11 },
};

const TOKENS = {
  color: COLOR,
  role: ROLE,
  state: STATE,
  type: TYPE,
  space: SPACE,
  radius: RADIUS,
  shadow: SHADOW,
  motion: MOTION,
  breakpoint: BREAKPOINT,
  density: DENSITY,
};

const SECTION_ORDER = [
  "System Positioning",
  "Theme Contexts",
  "Color Ladders",
  "Semantic Roles",
  "Contrast + Accessibility",
  "Typography",
  "Spacing + Radius + Elevation",
  "Motion + Focus + Density",
  "Actions + Controls",
  "Status Language + Pills",
  "Command Modes",
  "Object Header System",
  "Command Cards",
  "Sheet Patterns",
  "Rail + Context Patterns",
  "Workspace Canvas Patterns",
  "Activation Family",
  "Targeting Family",
  "Signal + Motion Family",
  "Execution + Proof Family",
  "Synthesis + Handoff Family",
  "Public + Trust Family",
  "Edge Cases",
  "Decision Ledger",
];

const SCENARIOS = {
  founderWorkspace: {
    title: "Founder week-one workspace",
    object: "Activation context",
    pressure: "The motion still depends on founder intuition.",
    nextMove: "Log the first live motion",
    downstream: "Dashboard, Queue, and Readiness become believable.",
    type: "activation",
    state: "live",
  },
  firstIcp: {
    title: "First live ICP",
    object: "ICP Studio",
    pressure: "Wedge still broad enough to blur downstream qualification.",
    nextMove: "Tighten company size and visible trigger",
    downstream: "Territory, Sourcing, Outbound",
    type: "targeting",
    state: "atRisk",
  },
  hotAccount: {
    title: "Cascadia Health Network",
    object: "Signal Console",
    pressure: "Signals are live, but the angle is not shaped yet.",
    nextMove: "Build the angle before outreach",
    downstream: "Outbound, Cold Call, Discovery",
    type: "signal",
    state: "live",
  },
  stalledDeal: {
    title: "Vantive Platform Expansion",
    object: "Deal Workspace",
    pressure: "Stage 2 is stale with no dated next step.",
    nextMove: "Run Future Autopsy now",
    downstream: "Autopsy, Discovery, Advisor Deploy",
    type: "execution",
    state: "blocked",
  },
  autopsy: {
    title: "Future Autopsy",
    object: "Future Autopsy",
    pressure: "Most likely death: no champion with internal gravity.",
    nextMove: "Open Discovery Studio and test champion depth",
    downstream: "Deal stage honesty, next-step truth",
    type: "execution",
    state: "blocked",
  },
  activePoc: {
    title: "Active proof motion",
    object: "PoC Framework",
    pressure: "Success criteria are live, but readout ownership is weak.",
    nextMove: "Lock readout owner before expanding scope",
    downstream: "Deal confidence, proof quality, handoff",
    type: "proof",
    state: "atRisk",
  },
  advisorDeployment: {
    title: "Advisor deployment candidate",
    object: "Advisor Deploy",
    pressure: "External leverage is useful now, but timing is narrow.",
    nextMove: "Build the ask against the live deal",
    downstream: "Deal workspace, follow-up logic",
    type: "proof",
    state: "info",
  },
  readiness: {
    title: "Readiness verdict",
    object: "Readiness",
    pressure: "Signal and targeting are live; motion system is still thin.",
    nextMove: "Log first live motion and one discovery outcome",
    downstream: "Handoff kit score, dashboard trust",
    type: "synthesis",
    state: "info",
  },
  handoff: {
    title: "Handoff-ready export",
    object: "Playbook / Handoff Kit",
    pressure: "The skeleton is strong, but proof and motion examples are sparse.",
    nextMove: "Attach one live proof and one worked motion",
    downstream: "Founder handoff, first AE onboarding",
    type: "synthesis",
    state: "complete",
  },
};

const DECISION_LOCKS = {
  chosen: [
    "Dark operating interior, light public perimeter.",
    "Warm gold as primary action, used sparingly.",
    "Blue reserved for info, focus, links, and system guidance.",
    "Neutral-dominant surfaces; brand color does not carry the whole hierarchy.",
    "DM Serif Display + Public Sans + Monaco/Consolas.",
    "Command-first architecture with Brief / Grid / Queue.",
    "Object headers answer pressure, next move, and downstream effect.",
    "Graph remains rare and diagnostic, not daily UX.",
  ],
  rejected: [
    "Generic all-blue B2B CTA system.",
    "User-facing light/dark mode toggle as the main theming strategy.",
    "Gradient-heavy product chrome.",
    "CRM-style ownership maze and tab sprawl.",
    "Brightness-filter state generation.",
    "Friendly, inflated copy that hides pressure.",
  ],
};

function toneForType(key) {
  return TOKENS.type[key] || TOKENS.type.command;
}

function getRoles(contextKey) {
  return TOKENS.role[contextKey];
}

function getShadow(contextKey, size) {
  return TOKENS.shadow[contextKey === "operating" ? (size === "lg" ? "operatingLg" : "operatingSm") : (size === "lg" ? "perimeterLg" : "perimeterSm")];
}

function getDensity(densityKey) {
  return TOKENS.density[densityKey];
}

function textStyle(roles, kind = "secondary", size = 14, weight = 400, extra = {}) {
  const map = {
    primary: roles.textPrimary,
    secondary: roles.textSecondary,
    muted: roles.textMuted,
    info: roles.linkInfo,
  };
  return {
    fontFamily: "var(--font-sans)",
    fontSize: size,
    fontWeight: weight,
    lineHeight: 1.55,
    color: map[kind] || roles.textSecondary,
    ...extra,
  };
}

function serifStyle(roles, size = 32, weight = 400, extra = {}) {
  return {
    fontFamily: "var(--font-serif)",
    fontSize: size,
    fontWeight: weight,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    color: roles.textPrimary,
    ...extra,
  };
}

function monoStyle(roles, size = 11, extra = {}) {
  return {
    fontFamily: "var(--font-mono)",
    fontSize: size,
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: roles.textMuted,
    ...extra,
  };
}

function PageWrapper({ roles, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: roles.page,
        color: roles.textSecondary,
        fontFamily: "var(--font-sans)",
      }}
    >
      {children}
    </div>
  );
}

function SectionFrame({ roles, density, eyebrow, title, summary, children }) {
  return (
    <div
      style={{
        display: "grid",
        gap: density.grid,
        padding: density.section,
        background: roles.card,
        border: `1px solid ${roles.border}`,
        borderRadius: TOKENS.radius.hero,
        boxShadow: getShadow(roles === TOKENS.role.operating ? "operating" : "perimeter", "sm"),
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div style={monoStyle(roles, density.label, { color: roles.linkInfo })}>{eyebrow}</div>
        <div style={serifStyle(roles, 42)}>{title}</div>
        <div style={textStyle(roles, "secondary", 16, 500, { maxWidth: 920 })}>{summary}</div>
      </div>
      {children}
    </div>
  );
}

function Rationale({ roles, children }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: TOKENS.radius.surface,
        border: `1px solid ${alpha(roles.linkInfo, 0.22)}`,
        background: alpha(roles.linkInfo, 0.08),
        display: "grid",
        gap: 6,
      }}
    >
      <div style={monoStyle(roles, 10, { color: roles.linkInfo })}>Behavioral rationale</div>
      <div style={textStyle(roles, "secondary", 13)}>{children}</div>
    </div>
  );
}

function Grid({ columns = "repeat(auto-fit, minmax(220px, 1fr))", gap = 16, children }) {
  return <div style={{ display: "grid", gridTemplateColumns: columns, gap }}>{children}</div>;
}

function Surface({ roles, density, title, eyebrow, children, accent, minHeight, tone = "card" }) {
  const backgroundMap = {
    card: roles.card,
    elevated: roles.elevated,
    sheet: roles.sheet,
    panel: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.03 : 0.02),
  };
  return (
    <div
      style={{
        background: backgroundMap[tone] || roles.card,
        border: `1px solid ${accent ? alpha(accent, 0.34) : roles.border}`,
        borderRadius: TOKENS.radius.surface,
        padding: density.card,
        minHeight,
        boxShadow: accent ? `0 0 0 1px ${alpha(accent, 0.04)}` : "none",
        display: "grid",
        gap: 10,
      }}
    >
      {(eyebrow || title) && (
        <div style={{ display: "grid", gap: 6 }}>
          {eyebrow ? <div style={monoStyle(roles, density.label, { color: accent || roles.textMuted })}>{eyebrow}</div> : null}
          {title ? <div style={serifStyle(roles, 22)}>{title}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}

function Pill({ roles, label, stateKey, icon, subtle }) {
  const token = TOKENS.state[stateKey] || TOKENS.state.info;
  const background = subtle ? alpha(token.text, roles === TOKENS.role.operating ? 0.12 : 0.08) : token.surface;
  const border = subtle ? alpha(token.text, 0.18) : token.border;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: TOKENS.radius.full,
        border: `1px solid ${border}`,
        background,
        color: token.text,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {icon ? <span style={{ fontSize: 10 }}>{icon}</span> : null}
      {label || token.label}
    </span>
  );
}

function TypePill({ roles, typeKey }) {
  const token = toneForType(typeKey);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: TOKENS.radius.full,
        border: `1px solid ${alpha(token.accent, 0.28)}`,
        background: alpha(token.accent, roles === TOKENS.role.operating ? 0.16 : 0.08),
        color: token.accent,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {token.label}
    </span>
  );
}

function MetricBlock({ roles, label, value, subtext, accent }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: TOKENS.radius.surface,
        border: `1px solid ${accent ? alpha(accent, 0.28) : roles.border}`,
        background: alpha(accent || roles.textPrimary, roles === TOKENS.role.operating ? 0.05 : 0.03),
        display: "grid",
        gap: 6,
      }}
    >
      <div style={monoStyle(roles, 10)}>{label}</div>
      <div style={serifStyle(roles, 28, 400, { color: accent || roles.textPrimary })}>{value}</div>
      {subtext ? <div style={textStyle(roles, "muted", 12, 600)}>{subtext}</div> : null}
    </div>
  );
}

function TokenSwatch({ roles, label, swatch, usage, border }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          height: 72,
          borderRadius: TOKENS.radius.surface,
          background: swatch,
          border: `1px solid ${border || alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.12 : 0.1)}`,
        }}
      />
      <div style={{ display: "grid", gap: 3 }}>
        <div style={textStyle(roles, "primary", 13, 700)}>{label}</div>
        <div style={textStyle(roles, "muted", 12, 600)}>{usage}</div>
      </div>
    </div>
  );
}

function LadderRow({ roles, hue, ladder }) {
  const order = ["50", "100", "500", "600", "700", "text", "on500"];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px repeat(7, 1fr)",
        gap: 10,
        alignItems: "stretch",
      }}
    >
      <div style={{ display: "grid", gap: 4, alignContent: "center" }}>
        <div style={serifStyle(roles, 18)}>{hue}</div>
        <div style={textStyle(roles, "muted", 12)}>Tint / selected / action / hover / pressed / text-safe / on-fill</div>
      </div>
      {order.map((step) => (
        <div
          key={`${hue}-${step}`}
          style={{
            minHeight: 92,
            background: ladder[step],
            borderRadius: TOKENS.radius.surface,
            border: `1px solid ${alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.08 : 0.1)}`,
            padding: 10,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              ...monoStyle(step === "text" ? ROLE.perimeter : roles, 10, {
                color: step === "500" || step === "600" || step === "700" ? ladder.on500 : step === "text" ? COLOR.neutral.text : step === "on500" ? COLOR.neutral.text : roles.textPrimary,
              }),
            }}
          >
            {step}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContrastRow({ roles, label, background, foreground, status, note, iconSafe }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 120px 130px 140px 1fr",
        gap: 12,
        alignItems: "center",
        padding: 12,
        borderRadius: TOKENS.radius.surface,
        border: `1px solid ${roles.border}`,
        background: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.03 : 0.02),
      }}
    >
      <div style={textStyle(roles, "primary", 13, 700)}>{label}</div>
      <div style={{ height: 40, borderRadius: TOKENS.radius.button, background }} />
      <div style={{ height: 40, borderRadius: TOKENS.radius.button, background, display: "flex", alignItems: "center", justifyContent: "center", color: foreground, fontWeight: 700 }}>Aa</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Pill roles={roles} label={status} stateKey={status === "AA safe" ? "live" : status === "Fail" ? "blocked" : "info"} subtle />
        {iconSafe ? <Pill roles={roles} label="Icon safe" stateKey="info" subtle /> : null}
      </div>
      <div style={textStyle(roles, "muted", 12)}>{note}</div>
    </div>
  );
}

function SectionLabel({ roles, children }) {
  return <div style={monoStyle(roles, 10, { marginBottom: 8, color: roles.textMuted })}>{children}</div>;
}

function InteractionButton({ roles, label, variant = "primary", state = "default", icon }) {
  const variants = {
    primary: {
      default: { background: roles.primaryAction, color: roles.primaryActionText, border: alpha(roles.primaryAction, 0.34) },
      hover: { background: roles.primaryActionHover, color: roles.primaryActionText, border: alpha(roles.primaryActionHover, 0.34) },
      pressed: { background: roles.primaryActionPressed, color: roles.primaryActionText, border: alpha(roles.primaryActionPressed, 0.34) },
      disabled: { background: alpha(roles.primaryAction, 0.2), color: alpha(roles.primaryActionText, 0.55), border: alpha(roles.primaryAction, 0.16) },
      focus: { background: roles.primaryAction, color: roles.primaryActionText, border: alpha(roles.focus, 0.6), ring: alpha(roles.focus, 0.25) },
      loading: { background: roles.primaryAction, color: roles.primaryActionText, border: alpha(roles.primaryAction, 0.34) },
    },
    secondary: {
      default: { background: roles.secondaryAction, color: roles.secondaryActionText, border: roles.border },
      hover: { background: roles.secondaryActionHover, color: roles.secondaryActionText, border: roles.borderStrong },
      pressed: { background: roles.secondaryActionPressed, color: roles.secondaryActionText, border: roles.borderStrong },
      disabled: { background: alpha(roles.secondaryAction, 0.4), color: alpha(roles.secondaryActionText, 0.6), border: roles.border },
      focus: { background: roles.secondaryAction, color: roles.secondaryActionText, border: alpha(roles.focus, 0.6), ring: alpha(roles.focus, 0.22) },
      loading: { background: roles.secondaryAction, color: roles.secondaryActionText, border: roles.borderStrong },
    },
    ghost: {
      default: { background: "transparent", color: roles.linkInfo, border: alpha(roles.linkInfo, 0.24) },
      hover: { background: alpha(roles.linkInfo, 0.08), color: roles.linkInfo, border: alpha(roles.linkInfo, 0.32) },
      pressed: { background: alpha(roles.linkInfo, 0.14), color: roles.linkInfo, border: alpha(roles.linkInfo, 0.38) },
      disabled: { background: "transparent", color: alpha(roles.linkInfo, 0.45), border: alpha(roles.linkInfo, 0.16) },
      focus: { background: alpha(roles.linkInfo, 0.08), color: roles.linkInfo, border: alpha(roles.focus, 0.6), ring: alpha(roles.focus, 0.22) },
      loading: { background: alpha(roles.linkInfo, 0.08), color: roles.linkInfo, border: alpha(roles.linkInfo, 0.32) },
    },
    danger: {
      default: { background: TOKENS.state.blocked.surface, color: TOKENS.state.blocked.text, border: TOKENS.state.blocked.border },
      hover: { background: alpha(TOKENS.state.blocked.text, 0.18), color: TOKENS.state.blocked.text, border: alpha(TOKENS.state.blocked.text, 0.38) },
      pressed: { background: alpha(TOKENS.state.blocked.text, 0.24), color: TOKENS.state.blocked.text, border: alpha(TOKENS.state.blocked.text, 0.44) },
      disabled: { background: alpha(TOKENS.state.blocked.text, 0.08), color: alpha(TOKENS.state.blocked.text, 0.5), border: alpha(TOKENS.state.blocked.text, 0.12) },
      focus: { background: TOKENS.state.blocked.surface, color: TOKENS.state.blocked.text, border: alpha(roles.focus, 0.6), ring: alpha(roles.focus, 0.22) },
      loading: { background: TOKENS.state.blocked.surface, color: TOKENS.state.blocked.text, border: TOKENS.state.blocked.border },
    },
  };
  const styles = variants[variant][state];
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: TOKENS.radius.button,
        border: `1px solid ${styles.border}`,
        background: styles.background,
        color: styles.color,
        boxShadow: styles.ring ? `0 0 0 4px ${styles.ring}` : "none",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        fontWeight: 700,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      {state === "loading" ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>...</span> : null}
      {icon ? <span>{icon}</span> : null}
      {label}
    </div>
  );
}

function SegmentedModes({ roles, activeMode }) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 4,
        gap: 4,
        background: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.05 : 0.04),
        border: `1px solid ${roles.border}`,
        borderRadius: TOKENS.radius.full,
      }}
    >
      {["Brief", "Grid", "Queue"].map((mode) => {
        const active = activeMode === mode.toLowerCase();
        return (
          <div
            key={mode}
            style={{
              padding: "8px 12px",
              borderRadius: TOKENS.radius.full,
              background: active ? roles.card : "transparent",
              border: active ? `1px solid ${roles.borderStrong}` : "1px solid transparent",
              boxShadow: active ? getShadow(roles === TOKENS.role.operating ? "operating" : "perimeter", "sm") : "none",
              color: active ? roles.textPrimary : roles.textMuted,
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: active ? 700 : 600,
            }}
          >
            {mode}
          </div>
        );
      })}
    </div>
  );
}

function ObjectHeader({ roles, scenario }) {
  return (
    <Surface roles={roles} density={DENSITY.standard} tone="panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ display: "grid", gap: 10, flex: 1, minWidth: 320 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TypePill roles={roles} typeKey={scenario.type} />
            <Pill roles={roles} stateKey={scenario.state} />
          </div>
          <div style={serifStyle(roles, 32)}>{scenario.title}</div>
          <div style={textStyle(roles, "secondary", 15, 500)}>{scenario.pressure}</div>
        </div>
        <div
          style={{
            minWidth: 260,
            display: "grid",
            gap: 10,
            padding: 14,
            borderRadius: TOKENS.radius.surface,
            border: `1px solid ${roles.border}`,
            background: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.05 : 0.02),
          }}
        >
          <div style={monoStyle(roles, 10, { color: roles.linkInfo })}>Best next move</div>
          <div style={textStyle(roles, "primary", 14, 700)}>{scenario.nextMove}</div>
          <div style={monoStyle(roles, 10)}>Changes downstream</div>
          <div style={textStyle(roles, "muted", 12, 600)}>{scenario.downstream}</div>
        </div>
      </div>
    </Surface>
  );
}

function CommandCard({ roles, scenario, mode }) {
  const accent = toneForType(scenario.type).accent;
  const metric = mode === "brief" ? scenario.object : mode === "grid" ? scenario.nextMove : scenario.downstream;
  const label = mode === "brief" ? "Object" : mode === "grid" ? "Next move" : "Downstream";
  return (
    <div
      style={{
        display: "grid",
        gap: 10,
        padding: 16,
        borderRadius: TOKENS.radius.surface,
        border: `1px solid ${alpha(accent, 0.28)}`,
        background: alpha(accent, roles === TOKENS.role.operating ? 0.08 : 0.05),
        boxShadow: getShadow(roles === TOKENS.role.operating ? "operating" : "perimeter", "sm"),
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <TypePill roles={roles} typeKey={scenario.type} />
        <Pill roles={roles} stateKey={scenario.state} subtle />
      </div>
      <div style={serifStyle(roles, 24)}>{scenario.title}</div>
      <div style={textStyle(roles, "secondary", 13)}>{scenario.pressure}</div>
      <div style={{ display: "grid", gap: 4, paddingTop: 8, borderTop: `1px solid ${alpha(accent, 0.22)}` }}>
        <div style={monoStyle(roles, 10)}>{label}</div>
        <div style={textStyle(roles, "primary", 13, 700)}>{metric}</div>
      </div>
    </div>
  );
}

function SheetPreview({ roles, scenario }) {
  return (
    <Surface roles={roles} density={DENSITY.standard} title={scenario.title} eyebrow="Sheet dossier" tone="sheet" accent={toneForType(scenario.type).accent}>
      <Grid columns="repeat(auto-fit, minmax(180px, 1fr))" gap={12}>
        <MetricBlock roles={roles} label="Pressure" value={TOKENS.state[scenario.state].label} subtext="Most likely operating truth" accent={TOKENS.state[scenario.state].text} />
        <MetricBlock roles={roles} label="Object" value={scenario.object} subtext="Primary working lens" accent={toneForType(scenario.type).accent} />
        <MetricBlock roles={roles} label="Next move" value="1" subtext={scenario.nextMove} accent={roles.linkInfo} />
      </Grid>
      <div style={{ padding: 16, borderRadius: TOKENS.radius.surface, background: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.05 : 0.03), borderLeft: `3px solid ${toneForType(scenario.type).accent}` }}>
        <div style={textStyle(roles, "secondary", 14)}>This sheet is where the system stops summarizing and starts proving the exact pressure on the object. Narrative exists to tighten the next move, not to decorate the state.</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <InteractionButton roles={roles} label="Open workspace" variant="primary" />
        <InteractionButton roles={roles} label="Return to command" variant="secondary" />
      </div>
    </Surface>
  );
}

function RailPreview({ roles, scenario }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 320,
        background: roles.rail,
        borderRadius: TOKENS.radius.hero,
        border: `1px solid ${roles.border}`,
        padding: 16,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={monoStyle(roles, 10, { color: roles.linkInfo })}>Persistent context</div>
      <div style={serifStyle(roles, 24)}>{scenario.title}</div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={textStyle(roles, "muted", 12, 700)}>Object</div>
        <div style={textStyle(roles, "primary", 14, 700)}>{scenario.object}</div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={textStyle(roles, "muted", 12, 700)}>Pressure</div>
        <div style={textStyle(roles, "secondary", 13)}>{scenario.pressure}</div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <div style={textStyle(roles, "muted", 12, 700)}>Recommended</div>
        <InteractionButton roles={roles} label={scenario.nextMove} variant="primary" />
      </div>
      <Rationale roles={roles}>The rail is not navigation. It is the object's durable identity, pressure, and continuation path while the workspace canvas changes around it.</Rationale>
    </div>
  );
}

function FamilyBoard({ roles, title, summary, surfaces }) {
  return (
    <Surface roles={roles} density={DENSITY.standard} title={title} eyebrow="Family convergence">
      <div style={textStyle(roles, "secondary", 14)}>{summary}</div>
      <Grid columns="repeat(auto-fit, minmax(220px, 1fr))" gap={12}>
        {surfaces.map((surface) => (
          <div
            key={surface.name}
            style={{
              display: "grid",
              gap: 8,
              padding: 14,
              borderRadius: TOKENS.radius.surface,
              border: `1px solid ${roles.border}`,
              background: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.04 : 0.02),
            }}
          >
            <div style={textStyle(roles, "primary", 14, 700)}>{surface.name}</div>
            <div style={textStyle(roles, "secondary", 12)}>{surface.role}</div>
            <div style={textStyle(roles, "muted", 12, 600)}>Primary object: {surface.object}</div>
          </div>
        ))}
      </Grid>
    </Surface>
  );
}

function ContextStrip({ contextKey, setContextKey, densityKey, setDensityKey }) {
  const roles = getRoles(contextKey);
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 28px",
        background: roles.shell,
        borderBottom: `1px solid ${roles.border}`,
      }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <SegmentedToggle
          label="Context"
          roles={roles}
          value={contextKey}
          setValue={setContextKey}
          options={[
            { value: "operating", label: "Operating Theme" },
            { value: "perimeter", label: "Perimeter Theme" },
          ]}
        />
        <SegmentedToggle
          label="Density"
          roles={roles}
          value={densityKey}
          setValue={setDensityKey}
          options={[
            { value: "compact", label: "Compact" },
            { value: "standard", label: "Standard" },
          ]}
        />
      </div>
      <div style={monoStyle(roles, 10, { color: roles.textMuted })}>Research-sourced. Command-first. Object-centric. Contrast-locked.</div>
    </div>
  );
}

function SegmentedToggle({ label, roles, value, setValue, options }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: 4,
        borderRadius: TOKENS.radius.full,
        background: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.06 : 0.04),
        border: `1px solid ${roles.border}`,
      }}
    >
      <div style={monoStyle(roles, 10, { paddingLeft: 8 })}>{label}</div>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => setValue(option.value)}
            style={{
              border: `1px solid ${active ? roles.borderStrong : "transparent"}`,
              background: active ? roles.card : "transparent",
              color: active ? roles.textPrimary : roles.textMuted,
              padding: "8px 12px",
              borderRadius: TOKENS.radius.full,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: active ? 700 : 600,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SystemPositioningSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="01. Rebrand and IA truth"
      title="Antaeus is a command-first GTM operating system."
      summary="The taste test starts by locking the truths the visual system must serve. This is not a CRM, not a dashboard museum, and not an AI theater wrapper. It is an object-based command environment built to turn founder-led revenue motion into visible operating truth."
    >
      <Grid columns="repeat(auto-fit, minmax(220px, 1fr))">
        {[
          { title: "Not a CRM", body: "The system should not turn into ownership sprawl, tab sprawl, or record bureaucracy." },
          { title: "Command-first", body: "Every major surface should tighten what matters now, not just expose more controls." },
          { title: "Object-based", body: "Users act on ICPs, accounts, motions, calls, deals, proofs, advisors, and handoffs." },
          { title: "Pressure-ranked", body: "The product should force the real next move into view before the user asks for it." },
        ].map((item) => (
          <Surface key={item.title} roles={roles} density={density} title={item.title} tone="panel">
            <div style={textStyle(roles, "secondary", 14)}>{item.body}</div>
          </Surface>
        ))}
      </Grid>
      <Grid columns="repeat(auto-fit, minmax(200px, 1fr))">
        {["Command", "Sheet", "Workspace", "Graph"].map((layer, index) => (
          <MetricBlock
            key={layer}
            roles={roles}
            label={`Layer ${index + 1}`}
            value={layer}
            subtext={
              layer === "Command"
                ? "Brief / Grid / Queue"
                : layer === "Sheet"
                ? "Inspect without losing context"
                : layer === "Workspace"
                ? "Do the real work"
                : "Rare diagnostic view"
            }
            accent={index === 0 ? roles.linkInfo : index === 1 ? roles.primaryAction : index === 2 ? roles.live : roles.textMuted}
          />
        ))}
      </Grid>
      <Rationale roles={roles}>The system lab should prove that the visual language enforces severe clarity with calm authority. The user should feel consequence, direction, and continuity before they feel decoration.</Rationale>
    </SectionFrame>
  );
}

function ThemeContextsSection({ roles, density, contextKey }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="02. Surface families"
      title="Antaeus has two design contexts, not one generic theme switch."
      summary="The product interior is an operating environment. The public perimeter is a trust and conversion environment. The taste test should show both as intentionally related but contextually different."
    >
      <Grid columns="1fr 1fr">
        {["operating", "perimeter"].map((key) => {
          const localRoles = TOKENS.role[key];
          return (
            <div
              key={key}
              style={{
                background: localRoles.page,
                borderRadius: TOKENS.radius.hero,
                border: `1px solid ${localRoles.border}`,
                padding: density.section,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                <div style={serifStyle(localRoles, 28)}>{key === "operating" ? "Operating Theme" : "Perimeter Theme"}</div>
                {contextKey === key ? <Pill roles={localRoles} label="Active lab context" stateKey="info" subtle /> : null}
              </div>
              <Grid columns="repeat(auto-fit, minmax(140px, 1fr))" gap={10}>
                <TokenSwatch roles={localRoles} label="Page" swatch={localRoles.page} usage="Canvas backdrop" />
                <TokenSwatch roles={localRoles} label="Shell" swatch={localRoles.shell} usage="Persistent structure" />
                <TokenSwatch roles={localRoles} label="Card" swatch={localRoles.card} usage="Primary surface" border={localRoles.border} />
                <TokenSwatch roles={localRoles} label="Primary action" swatch={localRoles.primaryAction} usage="Single dominant move" />
              </Grid>
              <Surface roles={localRoles} density={density} title={key === "operating" ? "Dashboard brief" : "Methodology bridge"} eyebrow="Shared rules, different context">
                <div style={textStyle(localRoles, "secondary", 13)}>
                  {key === "operating"
                    ? "Dark neutrals hold the hierarchy. Gold is rationed to one decisive move. Blue teaches and links."
                    : "Light neutrals do the hierarchy. Gold still signals intent, but the trust language is more open and conversion-oriented."}
                </div>
              </Surface>
            </div>
          );
        })}
      </Grid>
      <Rationale roles={roles}>This is not a user-facing toggle strategy. The two contexts exist because the product does two jobs: run serious operating work and invite users into that seriousness without exposing the whole machine at once.</Rationale>
    </SectionFrame>
  );
}

function ColorLaddersSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="03. Research-backed color architecture"
      title="Neutrals do the hierarchy. Accents do the signaling."
      summary="Color should behave like an interaction and meaning system, not a paint bucket. Each ladder below is role-ready: tint, selected, fill, hover, pressed, text-safe, and on-fill."
    >
      <div style={{ display: "grid", gap: 14 }}>
        {[
          ["Neutral", TOKENS.color.neutral],
          ["Gold", TOKENS.color.gold],
          ["Teal", TOKENS.color.teal],
          ["Blue", TOKENS.color.blue],
          ["Green", TOKENS.color.green],
          ["Amber", TOKENS.color.amber],
          ["Red", TOKENS.color.red],
          ["Purple", TOKENS.color.purple],
        ].map(([name, ladder]) => (
          <LadderRow key={name} roles={roles} hue={name} ladder={ladder} />
        ))}
      </div>
      <Rationale roles={roles}>The market defaults to blue. Antaeus can differentiate with gold warmth, but only if the system remains neutral-dominant and semantically disciplined. Gold should signal chosen action, not permanent hazard.</Rationale>
    </SectionFrame>
  );
}

function SemanticRolesSection({ roles, density }) {
  const contexts = ["operating", "perimeter"];
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="04. Semantic roles"
      title="Roles should be swappable without breaking the hierarchy."
      summary="The same structural fragment should survive both product contexts because the semantic roles, not the hue names, carry the meaning."
    >
      <Grid columns="1fr 1fr">
        {contexts.map((key) => {
          const localRoles = TOKENS.role[key];
          return (
            <Surface key={key} roles={localRoles} density={density} title={key === "operating" ? "Operating fragment" : "Perimeter fragment"} eyebrow="Same structure, different family" tone="panel">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <TypePill roles={localRoles} typeKey="signal" />
                <Pill roles={localRoles} stateKey="live" />
              </div>
              <div style={serifStyle(localRoles, 28)}>Cascadia Health Network</div>
              <div style={textStyle(localRoles, "secondary", 14)}>Signals are live. The angle is not. The system should route into motion, not just show activity.</div>
              <Grid columns="repeat(3, minmax(0, 1fr))" gap={10}>
                <MetricBlock roles={localRoles} label="Heat" value="62" subtext="Signals live" accent={localRoles.live} />
                <MetricBlock roles={localRoles} label="Pressure" value="Now" subtext="Angle still missing" accent={localRoles.warning} />
                <MetricBlock roles={localRoles} label="Mode" value="Queue" subtext="Act next" accent={localRoles.info} />
              </Grid>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <InteractionButton roles={localRoles} label="Build message" variant="primary" />
                <InteractionButton roles={localRoles} label="Open Signal Console" variant="ghost" />
              </div>
            </Surface>
          );
        })}
      </Grid>
      <Rationale roles={roles}>This section proves that the system can change contexts without changing mental model. Neutrals structure the eye path; the accents only label meaning, urgency, and next move.</Rationale>
    </SectionFrame>
  );
}

function ContrastSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="05. Contrast + accessibility"
      title="Accessibility should be encoded into the color system, not patched at the end."
      summary="The lab should show text-safe tones, on-fill tones, icon-safe pairs, focus treatment, and explicit failure cases so designers do not improvise unsafe combinations later."
    >
      <div style={{ display: "grid", gap: 10 }}>
        <ContrastRow roles={roles} label="Operating text on page" background={TOKENS.role.operating.page} foreground={TOKENS.role.operating.textPrimary} status="AA safe" note="Primary reading pair for the interior shell." />
        <ContrastRow roles={roles} label="Perimeter text on page" background={TOKENS.role.perimeter.page} foreground={TOKENS.role.perimeter.textPrimary} status="AA safe" note="Primary reading pair for methodology, purchase, and trust surfaces." />
        <ContrastRow roles={roles} label="Gold action fill" background={TOKENS.role.operating.primaryAction} foreground={TOKENS.role.operating.primaryActionText} status="AA safe" note="Chosen action stays readable because on-fill uses dark text." />
        <ContrastRow roles={roles} label="Blue info fill" background={TOKENS.color.blue[500]} foreground={TOKENS.color.blue.on500} status="AA safe" note="Info fill can carry light text safely." />
        <ContrastRow roles={roles} label="Muted text on perimeter page" background={TOKENS.role.perimeter.page} foreground={TOKENS.role.perimeter.textMuted} status="Icon only" iconSafe note="Fine for metadata and chrome. Not for primary narrative copy." />
        <ContrastRow roles={roles} label="Gold text on page" background={TOKENS.role.perimeter.page} foreground={TOKENS.color.gold[500]} status="Fail" note="Brand gold is not body text. It stays for accent, signal, and command emphasis only." />
      </div>
      <Grid columns="1fr 1fr">
        <Surface roles={roles} density={density} title="Focus ring" eyebrow="First-class token">
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <InteractionButton roles={roles} label="Primary next move" variant="primary" state="focus" />
            <InteractionButton roles={roles} label="Secondary fallback" variant="secondary" state="focus" />
          </div>
        </Surface>
        <Surface roles={roles} density={density} title="Failure case" eyebrow="Rejected pattern">
          <div style={{ padding: 14, borderRadius: TOKENS.radius.surface, background: TOKENS.color.gold[500], color: TOKENS.color.gold[500] }}>
            Invisible body text on gold is unacceptable. Accessibility should be impossible to ignore structurally.
          </div>
        </Surface>
      </Grid>
      <Rationale roles={roles}>Research across dominant systems converges on precomputed, role-aware contrast ladders. The lab should make unsafe combinations visibly embarrassing so they never become design defaults.</Rationale>
    </SectionFrame>
  );
}

function TypographySection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="06. Type system"
      title="Typography should carry authority, not decoration."
      summary="Antaeus uses one serif, one sans, and one mono voice. The stack should map directly to object identity, narrative explanation, and system truth."
    >
      <Grid columns="repeat(3, minmax(0, 1fr))">
        <Surface roles={roles} density={density} title="DM Serif Display" eyebrow="Object names + verdicts">
          <div style={serifStyle(roles, 46)}>Future Autopsy</div>
          <div style={textStyle(roles, "secondary", 14)}>Use for object names, verdict boards, command headlines, and moments that should feel consequential.</div>
        </Surface>
        <Surface roles={roles} density={density} title="Public Sans" eyebrow="Narrative + interface">
          <div style={textStyle(roles, "primary", 18, 600)}>Keep the upstream modules honest so the morning brief remains useful.</div>
          <div style={textStyle(roles, "secondary", 14)}>Use for interface controls, summaries, help text, and all extended reading surfaces.</div>
        </Surface>
        <Surface roles={roles} density={density} title="Monaco / Consolas" eyebrow="Meta + system labels">
          <div style={monoStyle(roles, 12, { color: roles.linkInfo })}>Queue / state / role / scope / saved</div>
          <div style={textStyle(roles, "secondary", 14)}>Use for meta labels, data hints, family tags, and compact system truth. It should never become the main narrative voice.</div>
        </Surface>
      </Grid>
      <Grid columns="repeat(auto-fit, minmax(220px, 1fr))">
        {[
          ["Display XL", "32-46px", "Major command verdicts"],
          ["Display L", "24-32px", "Object headers and family boards"],
          ["Sans body", "14-16px", "Narrative summary and guidance"],
          ["Sans compact", "12-13px", "Secondary UI text"],
          ["Mono meta", "10-12px", "Labels, scope, state, count"],
        ].map(([label, range, use]) => (
          <MetricBlock key={label} roles={roles} label={label} value={range} subtext={use} accent={roles.linkInfo} />
        ))}
      </Grid>
      <Rationale roles={roles}>The old Plus Jakarta / Outfit taste-test direction is intentionally retired. The live redesign already moved to DM Serif and Public Sans, so the lab should model the system that actually exists and will scale.</Rationale>
    </SectionFrame>
  );
}

function SpacingSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="07. Spacing, radius, elevation"
      title="A 4px spacing base and a tight radius ladder keep the system disciplined."
      summary="Dominant product systems converge on regular spacing, consistent radii, and limited elevation steps. Antaeus should feel measured, not soft or random."
    >
      <Grid columns="repeat(auto-fit, minmax(160px, 1fr))">
        {Object.entries(TOKENS.space).map(([key, value]) => (
          <MetricBlock key={key} roles={roles} label={`space ${key}`} value={`${value}px`} subtext="4px base scale" accent={roles.linkInfo} />
        ))}
      </Grid>
      <Grid columns="repeat(auto-fit, minmax(180px, 1fr))">
        {[
          ["Control", TOKENS.radius.control, "Small toggles, chips"],
          ["Button", TOKENS.radius.button, "Buttons, inputs"],
          ["Surface", TOKENS.radius.surface, "Cards, rails, queue panels"],
          ["Hero", TOKENS.radius.hero, "Major boards, context surfaces"],
          ["Full", TOKENS.radius.full, "Pills and segmented tracks"],
        ].map(([label, radius, use]) => (
          <div key={label} style={{ display: "grid", gap: 8 }}>
            <div style={{ height: 72, borderRadius: radius, border: `1px solid ${roles.borderStrong}`, background: alpha(roles.primaryAction, 0.08) }} />
            <div style={textStyle(roles, "primary", 13, 700)}>{label}</div>
            <div style={textStyle(roles, "muted", 12)}>{use}</div>
          </div>
        ))}
      </Grid>
      <Grid columns="1fr 1fr">
        <Surface roles={roles} density={density} title="Operating elevation" eyebrow="Shadow discipline">
          <div style={{ padding: 18, borderRadius: TOKENS.radius.surface, background: roles.card, boxShadow: TOKENS.shadow.operatingSm, border: `1px solid ${roles.border}` }}>Small lift</div>
          <div style={{ padding: 18, borderRadius: TOKENS.radius.surface, background: roles.elevated, boxShadow: TOKENS.shadow.operatingLg, border: `1px solid ${roles.borderStrong}` }}>Large lift</div>
        </Surface>
        <Surface roles={roles} density={density} title="Breakpoints" eyebrow="Normalized scale">
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(TOKENS.breakpoint).map(([key, value]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={textStyle(roles, "primary", 13, 700)}>{key}</div>
                <div style={textStyle(roles, "muted", 12, 700)}>{value}px</div>
              </div>
            ))}
          </div>
        </Surface>
      </Grid>
      <Rationale roles={roles}>Spacing and radius should reinforce calm authority. Too much softness or inconsistent rhythm makes the product feel like stitched-together SaaS rather than a durable operating environment.</Rationale>
    </SectionFrame>
  );
}

function MotionSection({ roles, density, densityKey }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="08. Motion, focus, density"
      title="Motion should explain state change, not try to entertain."
      summary="Antaeus uses restrained motion with a clear ladder. Density should support serious work: compact when scanning and standard when learning or deciding."
    >
      <Grid columns="repeat(auto-fit, minmax(180px, 1fr))">
        {Object.entries(TOKENS.motion.duration).map(([label, value]) => (
          <MetricBlock key={label} roles={roles} label={`Duration ${label}`} value={value} subtext="Use by interaction weight" accent={roles.linkInfo} />
        ))}
      </Grid>
      <Grid columns="repeat(auto-fit, minmax(220px, 1fr))">
        {Object.entries(TOKENS.motion.curve).map(([label, value]) => (
          <Surface key={label} roles={roles} density={density} title={label} eyebrow="Curve token">
            <div style={monoStyle(roles, 10, { color: roles.linkInfo, textTransform: "none" })}>{value}</div>
          </Surface>
        ))}
      </Grid>
      <Grid columns="1fr 1fr">
        {["compact", "standard"].map((mode) => {
          const modeDensity = getDensity(mode);
          return (
            <Surface key={mode} roles={roles} density={modeDensity} title={`${mode === densityKey ? "Active" : "Available"} ${mode} density`} eyebrow="Layout proof">
              <div style={{ display: "grid", gap: modeDensity.grid }}>
                <div style={textStyle(roles, "secondary", mode === "compact" ? 13 : 15)}>Spacing between surfaces and controls should tighten without losing hierarchy.</div>
                <div style={{ display: "flex", gap: modeDensity.grid }}>
                  <div style={{ flex: 1, padding: modeDensity.card, borderRadius: TOKENS.radius.surface, border: `1px solid ${roles.border}`, background: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.05 : 0.02) }}>
                    <div style={monoStyle(roles, 10)}>Queue item</div>
                    <div style={textStyle(roles, "primary", 13, 700)}>Build the angle before outreach</div>
                  </div>
                  <div style={{ flex: 1, padding: modeDensity.card, borderRadius: TOKENS.radius.surface, border: `1px solid ${roles.border}`, background: alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.05 : 0.02) }}>
                    <div style={monoStyle(roles, 10)}>Next after</div>
                    <div style={textStyle(roles, "primary", 13, 700)}>Open Discovery Studio</div>
                  </div>
                </div>
              </div>
            </Surface>
          );
        })}
      </Grid>
      <Rationale roles={roles}>The lab should prove that density is a productivity control, not a visual preference. Motion exists to explain selection, arrival, and consequence. Focus exists to make keyboard and accessibility behavior impossible to miss.</Rationale>
    </SectionFrame>
  );
}

function ActionsSection({ roles, density }) {
  const rows = [
    { label: "Primary next move", variant: "primary" },
    { label: "Secondary fallback", variant: "secondary" },
    { label: "Ghost / info", variant: "ghost" },
    { label: "Danger", variant: "danger" },
  ];
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="09. Actions and controls"
      title="Controls should encode intent, not decoration."
      summary="Every major surface should have one dominant move, one fallback, and quieter utilities. States should be explicit and tokenized."
    >
      <div style={{ display: "grid", gap: 14 }}>
        {rows.map((row) => (
          <Surface key={row.label} roles={roles} density={density} title={row.label} eyebrow="State row">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <InteractionButton roles={roles} label={row.label} variant={row.variant} state="default" />
              <InteractionButton roles={roles} label="Hover" variant={row.variant} state="hover" />
              <InteractionButton roles={roles} label="Pressed" variant={row.variant} state="pressed" />
              <InteractionButton roles={roles} label="Disabled" variant={row.variant} state="disabled" />
              <InteractionButton roles={roles} label="Loading" variant={row.variant} state="loading" />
            </div>
          </Surface>
        ))}
      </div>
      <Grid columns="1fr 1fr">
        <Surface roles={roles} density={density} title="Segmented mode toggle" eyebrow="Command control">
          <SegmentedModes roles={roles} activeMode="queue" />
        </Surface>
        <Surface roles={roles} density={density} title="Utilities" eyebrow="Inline command + icon">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <InteractionButton roles={roles} label="Export" variant="ghost" icon="[]" />
            <InteractionButton roles={roles} label="Save ICP" variant="primary" />
            <InteractionButton roles={roles} label="Reset" variant="secondary" />
          </div>
        </Surface>
      </Grid>
      <Rationale roles={roles}>Production systems converge on precomputed states because they preserve meaning and contrast. This lab should make state differences visible enough that no one reaches for improvised filters or opacity hacks later.</Rationale>
    </SectionFrame>
  );
}

function StatusSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="10. Status language"
      title="Status should name truth, not mood."
      summary="Antaeus needs a disciplined status language because the product sells pressure clarity. Pills, badges, and labels should force honest interpretation, not vague positivity."
    >
      <Grid columns="repeat(auto-fit, minmax(180px, 1fr))">
        {Object.entries(TOKENS.state).map(([key, token]) => (
          <Surface key={key} roles={roles} density={density} title={token.label} eyebrow="State token">
            <Pill roles={roles} stateKey={key} />
            <div style={textStyle(roles, "secondary", 13)}>
              {key === "empty"
                ? "Use for truly unstarted or not-yet-live objects."
                : key === "live"
                ? "Use when the object is active and usable right now."
                : key === "atRisk"
                ? "Use when evidence exists, but the path is still fragile."
                : key === "blocked"
                ? "Use when the path is decaying or dishonest."
                : key === "complete"
                ? "Use when the object is materially done."
                : "Use for informational guidance and non-fatal alerts."}
            </div>
          </Surface>
        ))}
      </Grid>
      <Grid columns="repeat(auto-fit, minmax(240px, 1fr))">
        <Surface roles={roles} density={density} title="Approved labels" eyebrow="Use these">
          <div style={textStyle(roles, "secondary", 13)}>Live, At risk, Blocked, Not live yet, Complete, Since you were gone, Needs timing, Build the angle before outreach.</div>
        </Surface>
        <Surface roles={roles} density={density} title="Rejected labels" eyebrow="Avoid these">
          <div style={textStyle(roles, "secondary", 13)}>Awesome, magic, AI powered, high impact, delightful, easy win, low hanging fruit, vibrant, friendly urgency.</div>
        </Surface>
      </Grid>
      <Rationale roles={roles}>The language system is part of the design system. If the words go soft or generic, the UI will still feel weak even if the surfaces look polished.</Rationale>
    </SectionFrame>
  );
}

function CommandModesSection({ roles, density }) {
  const modes = {
    brief: { title: "Brief", line: "Read the system's current story.", scenario: SCENARIOS.stalledDeal },
    grid: { title: "Grid", line: "Scan multiple objects without losing rank.", scenario: SCENARIOS.hotAccount },
    queue: { title: "Queue", line: "Execute the next move in order.", scenario: SCENARIOS.autopsy },
  };
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="11. Command modes"
      title="Brief, Grid, and Queue are three cognitive modes over the same object set."
      summary="The command layer should not feel like three different pages. It should feel like three ways to handle the same truth: read it, scan it, or act on it."
    >
      <SegmentedModes roles={roles} activeMode="queue" />
      <Grid columns="repeat(3, minmax(0, 1fr))">
        {Object.entries(modes).map(([key, item]) => (
          <Surface key={key} roles={roles} density={density} title={item.title} eyebrow="Cognitive mode" accent={key === "queue" ? roles.primaryAction : key === "grid" ? roles.linkInfo : roles.live}>
            <div style={textStyle(roles, "secondary", 14)}>{item.line}</div>
            <CommandCard roles={roles} scenario={item.scenario} mode={key} />
          </Surface>
        ))}
      </Grid>
      <Rationale roles={roles}>The command layer is where the architecture reset becomes visible. Same objects, same ranked work, different cognitive zoom level. That is more powerful than independent module dashboards.</Rationale>
    </SectionFrame>
  );
}

function ObjectHeaderSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="12. Object header system"
      title="Every major surface should start with object truth, pressure, and consequence."
      summary="The object header is the common contract across modules. It should tell the user what they are touching, what pressure is active, what to do now, and what changes downstream if they act."
    >
      <div style={{ display: "grid", gap: 14 }}>
        <ObjectHeader roles={roles} scenario={SCENARIOS.hotAccount} />
        <ObjectHeader roles={roles} scenario={SCENARIOS.stalledDeal} />
      </div>
      <Rationale roles={roles}>Object headers reduce cognitive switching cost. The user should not have to decode the module before they understand the object. That is core to the new architecture.</Rationale>
    </SectionFrame>
  );
}

function CommandCardsSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="13. Command cards"
      title="Cards should read as ranked work, not decorative summaries."
      summary="Command cards are not generic cards. They are compact decisions: object, pressure, next move, and downstream consequence."
    >
      <Grid columns="repeat(auto-fit, minmax(260px, 1fr))">
        <CommandCard roles={roles} scenario={SCENARIOS.hotAccount} mode="brief" />
        <CommandCard roles={roles} scenario={SCENARIOS.stalledDeal} mode="grid" />
        <CommandCard roles={roles} scenario={SCENARIOS.autopsy} mode="queue" />
      </Grid>
      <Rationale roles={roles}>The command card should make the object impossible to misread and the next move impossible to miss. This is the card pattern that matters most in the reset.</Rationale>
    </SectionFrame>
  );
}

function SheetPatternsSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="14. Sheet patterns"
      title="Sheets should tighten judgment without breaking command context."
      summary="A sheet is not a modal with fluff. It is a dossier layer that lets the user inspect the object deeply, act, and return without losing the ranked command state."
    >
      <SheetPreview roles={roles} scenario={SCENARIOS.autopsy} />
      <Rationale roles={roles}>This is where the system proves that detail is subordinate to direction. The sheet should sharpen the next move, not become a second home page.</Rationale>
    </SectionFrame>
  );
}

function RailPatternsSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="15. Rail and context patterns"
      title="The rail is the object's durable memory, not a second navigation tree."
      summary="Persistent rails should carry identity, pressure, progress, and the current recommendation while the workspace canvas changes around them."
    >
      <Grid columns="minmax(300px, 340px) 1fr">
        <RailPreview roles={roles} scenario={SCENARIOS.stalledDeal} />
        <Surface roles={roles} density={density} title="Why this matters" eyebrow="Context rule">
          <div style={textStyle(roles, "secondary", 14)}>
            The rail is where cross-object compounding becomes visible. Users should see what the system remembers automatically and what changing this object will affect next.
          </div>
          <Grid columns="repeat(2, minmax(0, 1fr))" gap={12}>
            <MetricBlock roles={roles} label="Persistent" value="Identity" subtext="Title, family, live state, pressure" accent={roles.live} />
            <MetricBlock roles={roles} label="Variable" value="Canvas" subtext="Edit, compare, score, log, export" accent={roles.linkInfo} />
          </Grid>
        </Surface>
      </Grid>
      <Rationale roles={roles}>A stable rail reinforces the feeling that Antaeus is one durable operating system. It should never fight the shell or compete with the object header.</Rationale>
    </SectionFrame>
  );
}

function WorkspaceCanvasSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="16. Workspace canvas"
      title="Workspace canvases should do real work without losing command continuity."
      summary="The canvas is where the user thinks, edits, compares, and logs. It should stay subordinate to the object header and rail while still feeling like the main working area."
    >
      <Grid columns="2fr 1fr">
        <Surface roles={roles} density={density} title="Workspace board" eyebrow="Primary working surface" tone="panel">
          <Grid columns="repeat(2, minmax(0, 1fr))" gap={12}>
            <Surface roles={roles} density={density} title="Proof quality" eyebrow="Primary question">
              <div style={textStyle(roles, "secondary", 14)}>Does the evidence change stage truth, or is the team performing process theater?</div>
              <InteractionButton roles={roles} label="Tighten proof scope" variant="primary" />
            </Surface>
            <Surface roles={roles} density={density} title="Downstream memory" eyebrow="System consequence">
              <div style={textStyle(roles, "secondary", 14)}>Saving here should update deal confidence, readiness, and handoff quality automatically.</div>
            </Surface>
          </Grid>
        </Surface>
        <Surface roles={roles} density={density} title="Diagnostic graph" eyebrow="Rare, not daily" accent={roles.linkInfo}>
          <div style={textStyle(roles, "secondary", 13)}>
            Graph exists to inspect why the system is routing pressure through specific objects. It should be a diagnostic lens, not the main daily workspace.
          </div>
          <div style={{ padding: 16, borderRadius: TOKENS.radius.surface, border: `1px dashed ${alpha(roles.linkInfo, 0.36)}`, background: alpha(roles.linkInfo, 0.05), display: "grid", gap: 8 }}>
            <div style={textStyle(roles, "primary", 13, 700)}>ICP / Account / Signal / Motion / Deal / Proof / Handoff</div>
            <div style={textStyle(roles, "muted", 12)}>Use this only when the user needs to inspect compounding logic, not as the main navigation metaphor.</div>
          </div>
        </Surface>
      </Grid>
      <Rationale roles={roles}>The graph stays rare. The canvas stays practical. The command layer remains dominant. That is the beta-safe way to move toward object-centric architecture without turning the product into a concept demo.</Rationale>
    </SectionFrame>
  );
}

function ActivationFamilySection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="17. Activation family"
      title="Onboarding, Welcome, and Dashboard should feel like one activation machine."
      summary="Activation surfaces should move the user from setup into real operating evidence without changing visual language or mental model."
    >
      <FamilyBoard
        roles={roles}
        title="Activation family"
        summary="The family starts with tuning the workspace, then ranks the first move, then converts that into a durable command view."
        surfaces={[
          { name: "Onboarding", role: "Activation hero that previews what the system is tuning", object: "Activation context" },
          { name: "Welcome", role: "Ranked first-action corridor with explicit unlocks", object: "Activation context" },
          { name: "Dashboard", role: "Formal Brief / Grid / Queue command surface", object: "Workspace command state" },
        ]}
      />
      <ObjectHeader roles={roles} scenario={SCENARIOS.founderWorkspace} />
    </SectionFrame>
  );
}

function TargetingFamilySection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="18. Targeting family"
      title="ICP, Territory, and Sourcing should feel like three lenses on the same targeting truth."
      summary="The family should converge on a shared wedge, a ranked list, and usable account pressure without making the user restate the same context over and over."
    >
      <FamilyBoard
        roles={roles}
        title="Targeting family"
        summary="The targeting family should make the wedge legible, map it into territory logic, and then score real accounts against it."
        surfaces={[
          { name: "ICP Studio", role: "Decision board for the wedge and its downstream consequences", object: "ICP" },
          { name: "Territory Architect", role: "Turns the wedge into theses and ranked account structure", object: "ICP + account set" },
          { name: "Sourcing Workbench", role: "Scores account quality and pushes ready prospects forward", object: "Account" },
        ]}
      />
      <ObjectHeader roles={roles} scenario={SCENARIOS.firstIcp} />
    </SectionFrame>
  );
}

function SignalMotionSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="19. Signal and motion family"
      title="Signal, outbound, LinkedIn, and cold calls should feel like motion choices over shared account truth."
      summary="The system should not make channels feel separate. It should make the account, signal, angle, and motion continuity unmistakable."
    >
      <FamilyBoard
        roles={roles}
        title="Signal and motion family"
        summary="Signal Console remains the market-intelligence engine. Motion surfaces become channel lenses on the same account and angle truth."
        surfaces={[
          { name: "Signal Console", role: "Ranked signal engine and next-move router", object: "Account + signal" },
          { name: "Outbound Studio", role: "Motion board for email and outreach angle", object: "Motion" },
          { name: "LinkedIn Playbook", role: "Channel-specific play on the same motion truth", object: "Motion" },
          { name: "Cold Call Studio", role: "Live-call operating board over the same account signal", object: "Call" },
        ]}
      />
      <ObjectHeader roles={roles} scenario={SCENARIOS.hotAccount} />
    </SectionFrame>
  );
}

function ExecutionProofSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="20. Execution and proof family"
      title="Execution surfaces should pressure-test the deal, not merely document it."
      summary="This family is where Antaeus becomes defensible. The system should move from prep to pressure diagnosis to proof construction without losing the active deal truth."
    >
      <FamilyBoard
        roles={roles}
        title="Execution and proof family"
        summary="Call prep, discovery, deal truth, Future Autopsy, proof, and advisor leverage should operate as one continuous execution stack."
        surfaces={[
          { name: "Call Planner", role: "Meeting-prep board that sharpens the next conversation", object: "Call" },
          { name: "Discovery Studio", role: "Live discovery operating surface", object: "Call + deal" },
          { name: "Deal Workspace", role: "Primary execution object and pipeline truth", object: "Deal" },
          { name: "Future Autopsy", role: "Pressure-testing board that exposes likely deal death", object: "Deal" },
          { name: "PoC Framework", role: "Proof operating board linked to stage truth", object: "Proof" },
          { name: "Advisor Deploy", role: "Relationship leverage board tied to live deals", object: "Advisor + deal" },
        ]}
      />
      <ObjectHeader roles={roles} scenario={SCENARIOS.autopsy} />
    </SectionFrame>
  );
}

function SynthesisHandoffSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="21. Synthesis and handoff family"
      title="Quota, readiness, and handoff should convert real work into transfer-ready truth."
      summary="These surfaces should not feel abstract. They should read directly from the operating system and tell the user whether the motion is truly ready to inherit."
    >
      <FamilyBoard
        roles={roles}
        title="Synthesis and handoff family"
        summary="Planning, verdict, and handoff are only credible if they visibly depend on real upstream work."
        surfaces={[
          { name: "Quota Workback", role: "Translate revenue goals into execution pressure", object: "Planning model" },
          { name: "Readiness", role: "Verdict board over the whole system", object: "Readiness snapshot" },
          { name: "Playbook / Handoff Kit", role: "Exportable handoff truth for the next operator", object: "Handoff" },
        ]}
      />
      <ObjectHeader roles={roles} scenario={SCENARIOS.handoff} />
    </SectionFrame>
  );
}

function PublicTrustSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="22. Public and trust family"
      title="Auth, settings, methodology, purchase, demo, and coming soon should feel like the same serious product perimeter."
      summary="The boundary around the app should preserve trust, not feel like a stitched marketing site. Even the public edge should reinforce clarity and consequence."
    >
      <FamilyBoard
        roles={roles}
        title="Public and trust family"
        summary="This family handles entry, permission, backup truth, education, conversion, and controlled public exposure."
        surfaces={[
          { name: "Signup / Login / Reset", role: "Trust corridor into the system", object: "Access state" },
          { name: "Settings", role: "Trust-and-control board", object: "Workspace trust state" },
          { name: "Methodology", role: "Perimeter education and bridge into product truth", object: "Public narrative" },
          { name: "Purchase", role: "Commercial corridor with activation consequence", object: "Commercial state" },
          { name: "Demo lane", role: "Controlled sample workspace proving the system", object: "Sample workspace" },
          { name: "Coming soon", role: "Minimal perimeter hold page", object: "Public stance" },
        ]}
      />
      <Grid columns="repeat(auto-fit, minmax(220px, 1fr))">
        <Surface roles={roles} density={density} title="Trust rule" eyebrow="Settings and auth">
          <div style={textStyle(roles, "secondary", 13)}>Every trust surface should clearly distinguish account-level, workspace-level, and browser-local state.</div>
        </Surface>
        <Surface roles={roles} density={density} title="Public rule" eyebrow="Methodology and purchase">
          <div style={textStyle(roles, "secondary", 13)}>Perimeter copy should promise the operating truth without leaking the whole playbook or sounding generic.</div>
        </Surface>
      </Grid>
    </SectionFrame>
  );
}

function EdgeCasesSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="23. Edge cases"
      title="The system has to stay intelligent when the data is sparse or partially broken."
      summary="A serious GTM operating system cannot only look good when the workspace is full. It needs credible empty, loading, error, stale, and degraded states."
    >
      <Grid columns="repeat(auto-fit, minmax(220px, 1fr))">
        {[
          { title: "Sparse founder workspace", state: "empty", copy: "No motion logged yet. The best next move is still clear." },
          { title: "Loading object", state: "info", copy: "The system is rebuilding the object truth. Hold the command slot, not the whole page." },
          { title: "Startup failure", state: "blocked", copy: "A live dependency failed. Show the fallback and retry path, not darkness." },
          { title: "Stale truth", state: "atRisk", copy: "The last refresh is old enough that the recommendation may be decaying." },
          { title: "Degraded but usable", state: "info", copy: "One synced layer fell back to local truth. Keep the user operating with honest caveats." },
        ].map((item) => (
          <Surface key={item.title} roles={roles} density={density} title={item.title} eyebrow="Edge condition">
            <Pill roles={roles} stateKey={item.state} />
            <div style={textStyle(roles, "secondary", 13)}>{item.copy}</div>
            <InteractionButton roles={roles} label={item.state === "blocked" ? "Retry now" : "Continue with caveat"} variant={item.state === "blocked" ? "danger" : "secondary"} />
          </Surface>
        ))}
      </Grid>
      <Rationale roles={roles}>This section matters because trust is won in degraded states. The app should feel like it knows what is missing, what still works, and what the user should do next.</Rationale>
    </SectionFrame>
  );
}

function DecisionLedgerSection({ roles, density }) {
  return (
    <SectionFrame
      roles={roles}
      density={density}
      eyebrow="24. Decision ledger"
      title="The system lab should end with the decisions already made."
      summary="This section is the handoff artifact. It should let another designer or engineer understand the full system direction without rereading the research reports."
    >
      <Grid columns="1fr 1fr">
        <Surface roles={roles} density={density} title="Chosen" eyebrow="Locked direction" accent={roles.complete}>
          <div style={{ display: "grid", gap: 10 }}>
            {DECISION_LOCKS.chosen.map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Pill roles={roles} label="Chosen" stateKey="complete" subtle />
                <div style={textStyle(roles, "secondary", 13)}>{item}</div>
              </div>
            ))}
          </div>
        </Surface>
        <Surface roles={roles} density={density} title="Rejected" eyebrow="Intentionally not the brand" accent={roles.blocked}>
          <div style={{ display: "grid", gap: 10 }}>
            {DECISION_LOCKS.rejected.map((item) => (
              <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Pill roles={roles} label="Rejected" stateKey="blocked" subtle />
                <div style={textStyle(roles, "secondary", 13)}>{item}</div>
              </div>
            ))}
          </div>
        </Surface>
      </Grid>
      <Grid columns="repeat(auto-fit, minmax(220px, 1fr))">
        <MetricBlock roles={roles} label="Brand truth" value="Severe clarity" subtext="Calm authority, not friendliness theater" accent={roles.primaryAction} />
        <MetricBlock roles={roles} label="Architecture truth" value="Object first" subtext="Command -> Sheet -> Workspace -> Graph" accent={roles.linkInfo} />
        <MetricBlock roles={roles} label="Color truth" value="Neutral dominant" subtext="Gold as action, blue as info, amber as warning" accent={roles.complete} />
      </Grid>
      <Rationale roles={roles}>If this ledger stays accurate, the taste test can serve as the canonical lab for the final pre-beta product language. If it drifts, the artifact stops being a system and becomes another mood board.</Rationale>
    </SectionFrame>
  );
}

const RENDERERS = {
  "System Positioning": SystemPositioningSection,
  "Theme Contexts": ThemeContextsSection,
  "Color Ladders": ColorLaddersSection,
  "Semantic Roles": SemanticRolesSection,
  "Contrast + Accessibility": ContrastSection,
  Typography: TypographySection,
  "Spacing + Radius + Elevation": SpacingSection,
  "Motion + Focus + Density": MotionSection,
  "Actions + Controls": ActionsSection,
  "Status Language + Pills": StatusSection,
  "Command Modes": CommandModesSection,
  "Object Header System": ObjectHeaderSection,
  "Command Cards": CommandCardsSection,
  "Sheet Patterns": SheetPatternsSection,
  "Rail + Context Patterns": RailPatternsSection,
  "Workspace Canvas Patterns": WorkspaceCanvasSection,
  "Activation Family": ActivationFamilySection,
  "Targeting Family": TargetingFamilySection,
  "Signal + Motion Family": SignalMotionSection,
  "Execution + Proof Family": ExecutionProofSection,
  "Synthesis + Handoff Family": SynthesisHandoffSection,
  "Public + Trust Family": PublicTrustSection,
  "Edge Cases": EdgeCasesSection,
  "Decision Ledger": DecisionLedgerSection,
};

export default function DesignSystemTasteTest() {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [contextKey, setContextKey] = useState("operating");
  const [densityKey, setDensityKey] = useState("standard");
  const sectionName = SECTION_ORDER[sectionIndex];
  const roles = useMemo(() => getRoles(contextKey), [contextKey]);
  const density = useMemo(() => getDensity(densityKey), [densityKey]);
  const Renderer = RENDERERS[sectionName];

  return (
    <PageWrapper roles={roles}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Public+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; min-height: 100%; }
        body {
          font-family: var(--font-sans);
          background: ${roles.page};
          color: ${roles.textSecondary};
        }
        :root {
          --font-sans: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --font-serif: 'DM Serif Display', Georgia, serif;
          --font-mono: 'Monaco', 'Consolas', monospace;
        }
        button {
          appearance: none;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-thumb {
          background: ${alpha(roles.textMuted, 0.45)};
          border-radius: 999px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      <div
        style={{
          background: roles.shell,
          borderBottom: `1px solid ${roles.border}`,
          padding: "18px 28px",
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div style={monoStyle(roles, 10, { color: roles.linkInfo })}>Antaeus system lab</div>
          <div style={serifStyle(roles, 30)}>Design-system taste test</div>
          <div style={textStyle(roles, "secondary", 14)}>Canonical proving ground for the final pre-beta visual, behavioral, and architectural language.</div>
        </div>
        <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
          <Pill roles={roles} label={`${sectionIndex + 1} of ${SECTION_ORDER.length}`} stateKey="info" subtle />
          <div style={monoStyle(roles, 10)}>{sectionName}</div>
        </div>
      </div>

      <ContextStrip contextKey={contextKey} setContextKey={setContextKey} densityKey={densityKey} setDensityKey={setDensityKey} />

      <div
        style={{
          padding: "12px 28px",
          background: roles.shell,
          borderBottom: `1px solid ${roles.border}`,
          overflowX: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
          {SECTION_ORDER.map((section, index) => {
            const active = index === sectionIndex;
            return (
              <button
                key={section}
                onClick={() => setSectionIndex(index)}
                style={{
                  padding: "8px 14px",
                  borderRadius: TOKENS.radius.full,
                  border: `1px solid ${active ? roles.borderStrong : roles.border}`,
                  background: active ? roles.card : alpha(roles.textPrimary, roles === TOKENS.role.operating ? 0.05 : 0.02),
                  color: active ? roles.textPrimary : roles.textMuted,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: active ? 700 : 600,
                  whiteSpace: "nowrap",
                }}
              >
                {section}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1480, margin: "0 auto", padding: "28px" }}>
        <Renderer roles={roles} density={density} contextKey={contextKey} densityKey={densityKey} />
      </div>
    </PageWrapper>
  );
}
