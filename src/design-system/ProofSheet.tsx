import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { t } from "@/lib/voice/t";
import {
    Alert,
    Button,
    Card,
    CrossRoomLink,
    Drawer,
    FormField,
    Heading,
    IconButton,
    Kicker,
    Meter,
    Modal,
    SegmentedControl,
    Select,
    Stat,
    StatusChip,
    Stamp,
    Table,
    TextInput,
    Toggle,
    Tooltip,
    WayfinderBar,
    Avatar,
    BrandLockup,
    BrandMark,
    PatternCard,
    Progress,
    ProposalCard,
    ReadinessReadout,
    RiskCard,
    HandoffStrip,
    Grid,
    GridCell,
    FocalRail,
    ObjectControls,
    Measure
} from "@/components";
import { Icon } from "@/icons";

/**
 * The component-library proof sheet, served at /design-system/.
 *
 * The built library composed in one place so the founder reacts to
 * the IMPLEMENTATION the way the icon inventory sheet works for
 * glyphs. Internal — not linked from any room. The locked mockup
 * stays the visual source of truth; this page is the check that the
 * code faithfully renders it.
 */

function Section(props: {
    readonly code: string;
    readonly title: string;
    readonly children: JSX.Element | JSX.Element[];
}): JSX.Element {
    return (
        <section style="margin-top:48px;border-top:1px solid rgba(10,28,64,0.14);padding-top:20px">
            <Kicker>{props.code}</Kicker>
            <div style="margin:6px 0 18px">
                <Heading level="title">{props.title}</Heading>
            </div>
            <div style="display:flex;flex-direction:column;gap:18px;max-width:760px">
                {props.children}
            </div>
        </section>
    );
}

export function ProofSheet(): JSX.Element {
    const [seg, setSeg] = useState<"brief" | "spotlight" | "queue">("brief");
    const [toggleOn, setToggleOn] = useState(true);
    const [text, setText] = useState("");
    const [sel, setSel] = useState("warm");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div>
            <WayfinderBar room={t("DESIGN SYSTEM")} tail={t("proof sheet")} />
            <main style="max-width:1040px;margin:0 auto;padding:40px 40px 120px">
                <Kicker>{t("ANTAEUS DESIGN SYSTEM · BUILT LIBRARY")}</Kicker>
                <Heading level="display">
                    {t("The components, as code.", { class: "body" })}
                </Heading>
                <p style="font:15px/1.6 'Public Sans',sans-serif;color:rgba(10,28,64,0.66);max-width:70ch">
                    {t(
                        "Every primitive below is the real implementation — typed, tested, token-fed, voice-gated. The locked mockup stays the visual source of truth; this sheet is the check that the code renders it faithfully.",
                        { class: "body" }
                    )}
                </p>

                <Section code={t("DISPLAY")} title={t("Headings, stat, chips, gauge")}>
                    <div style="display:flex;gap:32px;align-items:flex-end;flex-wrap:wrap">
                        <Stat value="2.4×" label={t("coverage")} />
                        <Stat value={14} label={t("accounts")} />
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            <StatusChip label={t("Ready now")} tone="green" />
                            <StatusChip label={t("At risk")} tone="red" />
                            <StatusChip label={t("Workable")} tone="amber" />
                            <StatusChip label={t("Compounding")} tone="blue" />
                            <StatusChip label={t("Thin")} />
                        </div>
                    </div>
                </Section>

                <Section code={t("GROUNDED")} title={t("The card in five data states")}>
                    <Card
                        kicker={t("DEAL · RECOVERY")}
                        title="Acme Industries"
                        tone="red"
                        offset
                        footer={
                            <>
                                <Button variant="accent">{t("Open the deal")}</Button>
                                <Button variant="ghost">{t("Pre-mortem it")}</Button>
                            </>
                        }
                    >
                        <p class="ds-card__copy">
                            {t(
                                "Champion quiet for twelve days, and the close date is inside the month. This is the one card breaking rank.",
                                { class: "body" }
                            )}
                        </p>
                    </Card>
                    <Card kicker={t("SIGNAL")} title="Meridian Logistics" tone="blue" unsaved>
                        <p class="ds-card__copy">
                            {t("Two fresh signals this week; the heat is real.", {
                                class: "body"
                            })}
                        </p>
                    </Card>
                    <Card title={t("Loading state")} state="loading">
                        <p class="ds-card__copy">held silhouette</p>
                    </Card>
                    <Card
                        state="empty"
                        kicker={t("SIGNALS")}
                        emptyWhy={t(
                            "When an account you're watching moves, it shows up here.",
                            { class: "body" }
                        )}
                        emptyMove={
                            <Button variant="accent">{t("Add your first account")}</Button>
                        }
                    />
                    <Card
                        state="error"
                        errorText={t(
                            "The save didn't reach the workspace. Your edits are still here.",
                            { class: "body" }
                        )}
                        errorRetry={<Button>{t("Try the save again")}</Button>}
                    />
                </Section>

                <Section code={t("ACTION")} title={t("Buttons, toggle, links")}>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                        <Button variant="accent">{t("Send it")}</Button>
                        <Button variant="primary">{t("Save deal")}</Button>
                        <Button>{t("Plan call")}</Button>
                        <Button variant="ghost">{t("Skip for now")}</Button>
                        <IconButton icon="find" label={t("Find an account")} />
                        <Toggle
                            pressed={toggleOn}
                            onToggle={setToggleOn}
                            label={t("No-ask mode")}
                        />
                        <CrossRoomLink href="/signal-console/">
                            {t("Check the signals")}
                        </CrossRoomLink>
                    </div>
                    <div>
                        <Button
                            disabled
                            disabledWhy={t("Add a buyer before this can send.", {
                                class: "body"
                            })}
                        >
                            {t("Send")}
                        </Button>
                    </div>
                </Section>

                <Section code={t("INPUT")} title={t("The composed form field")}>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
                        <FormField
                            label={t("Account name")}
                            microcopy={t("Signal Console accounts auto-suggest.", {
                                class: "body"
                            })}
                        >
                            <TextInput
                                value={text}
                                onInput={setText}
                                placeholder={t("e.g. Acme Industries", { class: "body" })}
                            />
                        </FormField>
                        <FormField
                            label={t("Temperature")}
                            error={
                                text === "" && sel === "hot"
                                    ? t("Name the account before marking it hot.", {
                                          class: "body"
                                      })
                                    : undefined
                            }
                        >
                            <Select
                                value={sel}
                                onChange={setSel}
                                options={[
                                    { value: "cool", label: t("Cool") },
                                    { value: "warm", label: t("Warm") },
                                    { value: "hot", label: t("Hot") }
                                ]}
                            />
                        </FormField>
                    </div>
                </Section>

                <Section code={t("FEEDBACK")} title={t("Alert, drawer, modal")}>
                    <Alert tone="red" move={<Button>{t("Open the deal")}</Button>}>
                        {t(
                            "Two deals will close-lost if nothing moves this week.",
                            { class: "body" }
                        )}
                    </Alert>
                    <Alert tone="blue">
                        {t("The system noticed three reads since yesterday.", {
                            class: "body"
                        })}
                    </Alert>
                    <Alert>
                        {t("Coverage is below the plan's target.", { class: "body" })}
                    </Alert>
                    <div style="display:flex;gap:12px">
                        <Button onClick={() => setDrawerOpen(true)}>
                            {t("Open the drawer")}
                        </Button>
                        <Button onClick={() => setModalOpen(true)}>
                            {t("Open the modal")}
                        </Button>
                    </div>
                </Section>

                <Section code={t("NAVIGATION")} title={t("Segmented lenses")}>
                    <SegmentedControl
                        label={t("Command mode")}
                        active={seg}
                        onChange={setSeg}
                        options={[
                            { key: "brief", label: t("Read") },
                            { key: "spotlight", label: t("Focus") },
                            { key: "queue", label: t("Triage") }
                        ]}
                    />
                </Section>

                <Section code={t("DATA")} title={t("Meter — the one admitted chart")}>
                    <Meter
                        ratio={0.8}
                        tone="green"
                        label={t("Pipeline coverage")}
                        read={t(
                            "2.4× of the 3× the plan calls for — close, and closing.",
                            { class: "body" }
                        )}
                    />
                    <Meter
                        ratio={0.3}
                        tone="amber"
                        label={t("Discovery depth")}
                        read={t("Three call plans built; the gate wants eight.", {
                            class: "body"
                        })}
                    />
                </Section>

                <Section code={t("LAYOUT")} title={t("Grid, archetypes, measure")}>
                    <Grid>
                        <GridCell span={7}>
                            <Card kicker={t("BRIEF")} title={t("Seven columns")}>
                                <Measure>
                                    <p class="ds-card__copy">
                                        {t(
                                            "Running prose never exceeds 66 characters per line, regardless of how many columns are available — long lines are where reading turns into work.",
                                            { class: "body" }
                                        )}
                                    </p>
                                </Measure>
                            </Card>
                        </GridCell>
                        <GridCell span={5}>
                            <Card kicker={t("RAIL")} title={t("Five columns")} tone="blue">
                                <p class="ds-card__copy">
                                    {t("The grid aligns; it doesn't pack.", {
                                        class: "body"
                                    })}
                                </p>
                            </Card>
                        </GridCell>
                    </Grid>
                    <FocalRail
                        railLabel={t("Ranked pressure")}
                        focal={
                            <Card kicker={t("FOCAL · 8")} title={t("Object at full depth")} tone="red">
                                <p class="ds-card__copy">
                                    {t("The two-thirds focal pane carries one object.", {
                                        class: "body"
                                    })}
                                </p>
                            </Card>
                        }
                        rail={
                            <>
                                <Card kicker={t("RAIL · 4")} title="Meridian">
                                    <p class="ds-card__copy">{t("the quiet remainder")}</p>
                                </Card>
                                <Card kicker={t("RAIL · 4")} title="Harbor">
                                    <p class="ds-card__copy">{t("as a ranked list")}</p>
                                </Card>
                            </>
                        }
                    />
                    <ObjectControls
                        controlsLabel={t("Builder controls")}
                        object={
                            <Card kicker={t("THE OBJECT")} title={t("Object out-weighs controls")} tone="amber">
                                <p class="ds-card__copy">
                                    {t("The made thing dominates; the making recedes.", {
                                        class: "body"
                                    })}
                                </p>
                            </Card>
                        }
                        controls={
                            <Card kicker={t("CONTROLS")} title={t("Subordinate")}>
                                <p class="ds-card__copy">{t("the inputs that shape it")}</p>
                            </Card>
                        }
                    />
                </Section>

                <Section code={t("RISK")} title={t("RiskCard — recovery scale")}>
                    <RiskCard
                        title="Acme Industries"
                        cause={t("Champion quiet for twelve days; close date inside the month.", {
                            class: "body"
                        })}
                        score={84}
                        actions={
                            <>
                                <Button variant="accent">{t("Open the deal")}</Button>
                                <Button variant="ghost">{t("Pre-mortem it")}</Button>
                            </>
                        }
                    />
                </Section>

                                <Section code={t("BRAND")} title={t("The Grounded A, in chrome")}>
                    <div style="display:flex;gap:28px;align-items:center;flex-wrap:wrap">
                        <BrandMark size={48} />
                        <BrandMark size={32} />
                        <BrandMark size={20} />
                        <BrandMark size={16} />
                        <BrandLockup size={20} />
                    </div>
                    <p style="font:13px/1.5 'Public Sans',sans-serif;color:rgba(10,28,64,0.42)">
                        {t(
                            "Stroke steps up as the mark gets smaller; at 16 the crossbar drops — the ground line is the signature.",
                            { class: "body" }
                        )}
                    </p>
                </Section>

                <Section code={t("TAIL")} title={t("Stamp, avatar, tooltip")}>
                    <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
                        <Stamp tone="green">{t("CORRECTED")}</Stamp>
                        <Stamp tone="red">{t("LEFT ALONE")}</Stamp>
                        <Stamp>{t("ON FILE")}</Stamp>
                        <Avatar name="Sarah Chen" role="decider" />
                        <Avatar name="Marcus Reed" role="advisor" />
                        <Avatar name="Jordan Diaz" />
                        <Tooltip
                            text={t("Present in Show me how; gone in Step back.", {
                                class: "body"
                            })}
                        >
                            <Button variant="ghost">{t("Hover me")}</Button>
                        </Tooltip>
                    </div>
                </Section>

                <Section code={t("STRUCTURE")} title={t("Table and the milestone ladder")}>
                    <Table
                        label={t("Recovery queue")}
                        columns={[
                            { key: "account", label: t("Account") },
                            { key: "cause", label: t("Cause") },
                            { key: "value", label: t("Value"), numeric: true }
                        ]}
                        rows={[
                            {
                                id: "1",
                                offset: true,
                                cells: {
                                    account: "Acme Industries",
                                    cause: t("No dated next step"),
                                    value: "$120k"
                                }
                            },
                            {
                                id: "2",
                                cells: {
                                    account: "Meridian Logistics",
                                    cause: t("Champion quiet"),
                                    value: "$64k"
                                }
                            },
                            {
                                id: "3",
                                cells: {
                                    account: "Harbor Freight Co",
                                    cause: t("Use case thin"),
                                    value: "$38k"
                                }
                            }
                        ]}
                    />
                    <Progress
                        label={t("Handoff kit")}
                        count={t("4 of 7 sections ready")}
                        milestones={[
                            { label: t("Who hits, who misses"), done: true },
                            { label: t("The rails that worked"), done: true },
                            { label: t("Questions that won meetings"), done: true },
                            { label: t("Where deals leak"), done: true },
                            { label: t("The losses we paid for"), done: false },
                            { label: t("Why we win"), done: false },
                            { label: t("Day-one rhythm"), done: false }
                        ]}
                    />
                </Section>

                <Section code={t("SYSTEM")} title={t("The cross-room cards")}>
                    <PatternCard
                        claim={t(
                            "Two of your watched accounts went quiet the same week their category got funded — that pattern usually means a competitor is in the building.",
                            { class: "body" }
                        )}
                        evidence={[
                            t("Acme: no signal in 16 days after weekly cadence", {
                                class: "body"
                            }),
                            t("Meridian: champion stopped replying on the 4th", {
                                class: "body"
                            })
                        ]}
                        howSure={t("Fairly sure — two independent reads agree.", {
                            class: "body"
                        })}
                        moves={<Button>{t("Check the signals")}</Button>}
                    />
                    <ProposalCard
                        noticed={t(
                            "You've run whats-at-risk every Friday for five weeks.",
                            { class: "body" }
                        )}
                        change={t(
                            "Make Friday 9am its standing schedule, so it's waiting for you.",
                            { class: "body" }
                        )}
                        onAccept={() => undefined}
                        onSnooze={() => undefined}
                        onDismiss={() => undefined}
                    />
                    <ReadinessReadout
                        state={t("Inheritable with guardrails")}
                        read={t(
                            "A hire could run this if you're around for sanity-checks.",
                            { class: "body" }
                        )}
                    />
                </Section>

                <Section code={t("ICONS")} title={t("The set, in the components")}>
                    <div style="display:flex;gap:14px;color:#0a1c40">
                        <Icon name="signal" size={20} />
                        <Icon name="deal" size={20} />
                        <Icon name="proof" size={20} />
                        <Icon name="send" size={20} />
                        <Icon name="readiness" size={20} />
                        <Icon name="wayfinder" size={20} />
                    </div>
                </Section>

                <HandoffStrip
                    label={t("Carry the work forward")}
                    kicker={t("CARRY THE WORK FORWARD")}
                    title={t("A room ends without ending the work.", { class: "body" })}
                    sub={t("One primary route in orange; the rest secondary. Each threads the continuity params so context travels.", { class: "body" })}
                    routes={[
                        { label: t("Pre-mortem this deal"), href: "/future-autopsy/", primary: true },
                        { label: t("Forge a proof"), href: "/poc-framework/" },
                        { label: t("Deploy an advisor"), href: "/advisor-deploy/" }
                    ]}
                />
            </main>

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                label={t("Readiness")}
            >
                <Kicker>{t("DRAWER")}</Kicker>
                <Heading level="title">
                    {t("Depth slides in over the page.")}
                </Heading>
                <p style="font:15px/1.6 'Public Sans',sans-serif;color:rgba(10,28,64,0.66)">
                    {t(
                        "Never a route change. Esc, the scrim, and the close button all close it.",
                        { class: "body" }
                    )}
                </p>
                <Button onClick={() => setDrawerOpen(false)}>{t("Close")}</Button>
            </Drawer>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                label={t("Delete workspace")}
                confirm={
                    <Button variant="accent" onClick={() => setModalOpen(false)}>
                        {t("Delete it")}
                    </Button>
                }
            >
                <Heading level="title">{t("Delete this workspace?")}</Heading>
                <p style="font:15px/1.6 'Public Sans',sans-serif;color:rgba(10,28,64,0.66)">
                    {t(
                        "This removes every room's local data. The cloud workspace stays.",
                        { class: "body" }
                    )}
                </p>
            </Modal>
        </div>
    );
}
