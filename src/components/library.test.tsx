import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/preact";
import {
    Alert,
    Button,
    Card,
    CrossRoomLink,
    Drawer,
    FormField,
    Gauge,
    Heading,
    IconButton,
    Kicker,
    Meter,
    Modal,
    SegmentedControl,
    Select,
    Stat,
    StatusChip,
    TextInput,
    Toast,
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
    Stamp,
    Table,
    PageFrame,
    Grid,
    GridCell,
    Measure,
    BandStack,
    FocalRail,
    ObjectControls,
    HandoffStrip,
    RiskCard,
    Ribbon,
    PulseTimeline,
    PulseZone,
    PulseHorizon
} from "./index";
import { paletteOpen } from "@/lib/palette/Palette";

describe("display primitives", () => {
    it("Heading renders the ramp's tag per level with the level class", () => {
        const { container } = render(
            <div>
                <Heading level="display">The read</Heading>
                <Heading level="title">A card head</Heading>
                <Heading level="control">A control head</Heading>
            </div>
        );
        expect(container.querySelector("h1.ds-heading--display")).not.toBeNull();
        expect(container.querySelector("h2.ds-heading--title")).not.toBeNull();
        expect(container.querySelector("h3.ds-heading--control")).not.toBeNull();
    });

    it("Kicker + Stat render mono label structure", () => {
        const { container } = render(
            <div>
                <Kicker>SIGNAL CONSOLE</Kicker>
                <Stat value={42} label="accounts" />
            </div>
        );
        expect(container.querySelector(".ds-kicker")?.textContent).toBe(
            "SIGNAL CONSOLE"
        );
        expect(container.querySelector(".ds-stat__value")?.textContent).toBe("42");
    });

    it("StatusChip carries the semantic tone class; Gauge defaults quiet", () => {
        const { container } = render(
            <div>
                <StatusChip label="At risk" tone="red" />
                <Gauge />
                <Gauge tone="orange" />
            </div>
        );
        expect(container.querySelector(".ds-chip--red")).not.toBeNull();
        const gauges = container.querySelectorAll(".ds-gauge");
        expect(gauges[0]?.className).toBe("ds-gauge");
        expect(gauges[1]?.className).toContain("ds-gauge--orange");
    });
});

describe("action primitives", () => {
    it("Button defaults to secondary; accent is the dominant-move class", () => {
        const { container } = render(
            <div>
                <Button>Quiet move</Button>
                <Button variant="accent">Send it</Button>
            </div>
        );
        expect(container.querySelector(".ds-btn--secondary")).not.toBeNull();
        expect(container.querySelector(".ds-btn--accent")).not.toBeNull();
    });

    it("a disabled Button carries its why in plain words (03 §4.8)", () => {
        const { getByText } = render(
            <Button disabled disabledWhy="Add a buyer before this can send">
                Send
            </Button>
        );
        expect(getByText("Add a buyer before this can send")).toBeTruthy();
    });

    it("IconButton requires and renders an accessible name", () => {
        const { getByLabelText } = render(
            <IconButton icon="add" label="Add account" />
        );
        expect(getByLabelText("Add account")).toBeTruthy();
    });

    it("Toggle flips and reports the next state", () => {
        const onToggle = vi.fn();
        const { getByRole } = render(
            <Toggle pressed={false} onToggle={onToggle} label="No-ask mode" />
        );
        fireEvent.click(getByRole("switch"));
        expect(onToggle).toHaveBeenCalledWith(true);
    });

    it("CrossRoomLink is blue-role markup", () => {
        const { container } = render(
            <CrossRoomLink href="/signal-console/">Check the signals</CrossRoomLink>
        );
        expect(container.querySelector("a.ds-link")?.getAttribute("href")).toBe(
            "/signal-console/"
        );
    });
});

describe("input primitives", () => {
    it("TextInput reports input; Select reports change", () => {
        const onInput = vi.fn();
        const onChange = vi.fn();
        const { container } = render(
            <div>
                <TextInput value="" onInput={onInput} placeholder="Account" />
                <Select
                    value="a"
                    onChange={onChange}
                    options={[
                        { value: "a", label: "A" },
                        { value: "b", label: "B" }
                    ]}
                />
            </div>
        );
        const input = container.querySelector("input") as HTMLInputElement;
        input.value = "Acme";
        fireEvent.input(input);
        expect(onInput).toHaveBeenCalledWith("Acme");
        const select = container.querySelector("select") as HTMLSelectElement;
        select.value = "b";
        fireEvent.change(select);
        expect(onChange).toHaveBeenCalledWith("b");
    });

    it("FormField shows microcopy in show-me-how, drops it in step-back, and error wins", () => {
        const { container, rerender } = render(
            <FormField label="Annual quota" microcopy="Your personal target">
                <TextInput value="" onInput={() => undefined} />
            </FormField>
        );
        expect(container.querySelector(".ds-field__micro")).not.toBeNull();
        rerender(
            <FormField
                label="Annual quota"
                microcopy="Your personal target"
                density="step_back"
            >
                <TextInput value="" onInput={() => undefined} />
            </FormField>
        );
        expect(container.querySelector(".ds-field__micro")).toBeNull();
        rerender(
            <FormField label="Annual quota" error="A number is needed here">
                <TextInput value="" onInput={() => undefined} />
            </FormField>
        );
        expect(
            container.querySelector(".ds-field__error")?.textContent
        ).toBe("A number is needed here");
        expect(container.querySelector(".ds-field--error")).not.toBeNull();
    });
});

describe("Card — the Grounded primitive with its five data states", () => {
    it("ready renders gauge + title + children; offset breaks rank", () => {
        const { container } = render(
            <Card kicker="DEAL" title="Acme Industries" tone="red" offset>
                <p>Champion quiet for twelve days.</p>
            </Card>
        );
        expect(container.querySelector(".ds-card--offset")).not.toBeNull();
        expect(container.querySelector(".ds-gauge--red")).not.toBeNull();
        expect(container.textContent).toContain("Acme Industries");
    });

    it("loading holds the silhouette and marks aria-busy", () => {
        const { container } = render(
            <Card title="Acme" state="loading">
                <p>hidden</p>
            </Card>
        );
        expect(container.querySelector(".ds-card--loading")).not.toBeNull();
        expect(
            container.querySelector("[aria-busy='true']")
        ).not.toBeNull();
    });

    it("empty is directional: why it matters + the one move", () => {
        const { container, getByText } = render(
            <Card
                state="empty"
                kicker="SIGNALS"
                emptyWhy="When an account you're watching moves, it shows up here."
                emptyMove={<Button variant="accent">Add your first account</Button>}
            />
        );
        expect(container.querySelector(".ds-empty")).not.toBeNull();
        expect(getByText("Add your first account")).toBeTruthy();
    });

    it("error is honest and recoverable", () => {
        const { container, getByText } = render(
            <Card
                state="error"
                errorText="The save didn't reach the workspace. Your edits are still here."
                errorRetry={<Button>Try the save again</Button>}
            />
        );
        expect(container.querySelector(".ds-error")).not.toBeNull();
        expect(getByText("Try the save again")).toBeTruthy();
    });

    it("unsaved work carries the quiet amber marker", () => {
        const { container } = render(<Card title="Acme" unsaved />);
        expect(container.querySelector(".ds-card__unsaved")).not.toBeNull();
    });

    it("carries the anchored edge: quiet neutral at rest, role color when toned (03 §2.3)", () => {
        const rest = render(<Card title="Quiet" />);
        // At rest: no edge-tone class → the CSS quiet-neutral default.
        expect(rest.container.querySelector("[class*='ds-card--edge-']")).toBeNull();
        const toned = render(<Card title="Acme" tone="red" />);
        expect(toned.container.querySelector(".ds-card--edge-red")).not.toBeNull();
    });

    it("offset renders the real §2.4 structure: tag outside, orange edge, wrapper", () => {
        const { container, getByText } = render(
            <Card
                title="Acme Industries"
                tone="red"
                offset
                offsetTag="— Today's most pressured"
                footer={<Button variant="accent">Open the deal</Button>}
            />
        );
        // The tag sits OUTSIDE the card, in the offset wrapper.
        expect(container.querySelector(".ds-offset__tag")).not.toBeNull();
        expect(getByText("— Today's most pressured")).toBeTruthy();
        // Offset forces the orange anchored edge regardless of tone.
        expect(container.querySelector(".ds-card--edge-orange")).not.toBeNull();
        expect(container.querySelector(".ds-card--edge-red")).toBeNull();
        // The wrapper holds the lifted card.
        expect(
            container.querySelector(".ds-offset > .ds-card--offset")
        ).not.toBeNull();
    });
});

describe("feedback & overlays", () => {
    it("Toast is a polite status", () => {
        const { container } = render(<Toast>Saved. Linked to Acme.</Toast>);
        expect(
            container.querySelector(".ds-toast")?.getAttribute("role")
        ).toBe("status");
    });

    it("Alert tones: red is an alert role; the move renders", () => {
        const { container, getByText } = render(
            <Alert tone="red" move={<Button>Open the deal</Button>}>
                Two deals will close-lost if nothing moves this week.
            </Alert>
        );
        expect(
            container.querySelector(".ds-alert--red")?.getAttribute("role")
        ).toBe("alert");
        expect(getByText("Open the deal")).toBeTruthy();
    });

    it("Drawer closes on scrim click and Escape", () => {
        const onClose = vi.fn();
        const { container } = render(
            <Drawer open onClose={onClose} label="Readiness">
                <p>depth</p>
            </Drawer>
        );
        fireEvent.click(container.querySelector(".ds-scrim") as Element);
        expect(onClose).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(window, { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("Modal renders cancel + the supplied destructive confirm", () => {
        const onClose = vi.fn();
        const { getByText } = render(
            <Modal
                open
                onClose={onClose}
                label="Delete workspace"
                confirm={<Button variant="accent">Delete it</Button>}
            >
                <p>This removes every room's local data.</p>
            </Modal>
        );
        fireEvent.click(getByText("Cancel"));
        expect(onClose).toHaveBeenCalled();
        expect(getByText("Delete it")).toBeTruthy();
    });
});

describe("navigation", () => {
    it("WayfinderBar renders mark + crumb and summons the palette", () => {
        paletteOpen.value = false;
        const { container, getByText } = render(
            <WayfinderBar room="DASHBOARD" tail="3 ranked" />
        );
        expect(container.querySelector(".ds-wayfinder__mark")).not.toBeNull();
        expect(container.textContent).toContain("DASHBOARD · 3 ranked");
        fireEvent.click(getByText("⌘K"));
        expect(paletteOpen.value).toBe(true);
        paletteOpen.value = false;
    });

    it("WayfinderBar carries a help affordance that opens room-aware help (ADR-018)", () => {
        const { container, getByText } = render(
            <WayfinderBar room="DASHBOARD" />
        );
        const help = container.querySelector(".ds-wayfinder__help") as HTMLButtonElement;
        expect(help).not.toBeNull();
        // Closed by default.
        expect(container.querySelector(".ds-wayfinder__help-panel")).toBeNull();
        fireEvent.click(help);
        const panel = container.querySelector(".ds-wayfinder__help-panel");
        expect(panel).not.toBeNull();
        // jsdom path is "/" → generic help; the three plain lines + the
        // honest channel are all present.
        expect(panel?.querySelectorAll("dd").length).toBe(3);
        const mail = panel?.querySelector(".ds-wayfinder__help-mail");
        expect(mail?.getAttribute("href")).toContain("mailto:");
        // Closes again.
        fireEvent.click(getByText("Close"));
        expect(container.querySelector(".ds-wayfinder__help-panel")).toBeNull();
    });

    it("SegmentedControl carries the selected state and reports changes", () => {
        const onChange = vi.fn();
        const { getByText, container } = render(
            <SegmentedControl
                label="Command mode"
                active="brief"
                onChange={onChange}
                options={[
                    { key: "brief", label: "Read" },
                    { key: "queue", label: "Triage" }
                ]}
            />
        );
        expect(
            container.querySelector("[aria-pressed='true']")?.textContent
        ).toBe("Read");
        fireEvent.click(getByText("Triage"));
        expect(onChange).toHaveBeenCalledWith("queue");
    });
});

describe("Meter — the one admitted data-viz", () => {
    it("clamps the ratio and always renders the read sentence", () => {
        const { container } = render(
            <Meter
                ratio={1.7}
                tone="green"
                read="2.4× — enough to hit the number if your win rate holds."
            />
        );
        const bar = container.querySelector(".ds-meter__fill") as HTMLElement;
        expect(bar.style.width).toBe("100%");
        expect(container.querySelector(".ds-meter__read")?.textContent).toContain(
            "2.4×"
        );
    });
});

describe("brand (spec 10)", () => {
    it("BrandMark drops the crossbar at 16 and keeps it above", () => {
        const small = render(<BrandMark size={16} />);
        expect(small.container.querySelectorAll("path")).toHaveLength(2);
        const large = render(<BrandMark size={32} />);
        expect(large.container.querySelectorAll("path")).toHaveLength(3);
    });

    it("BrandLockup renders mark + the letterspaced caps name", () => {
        const { container } = render(<BrandLockup />);
        expect(container.querySelector(".ds-lockup__name")?.textContent).toBe(
            "ANTAEUS"
        );
        expect(container.querySelector("svg")).not.toBeNull();
    });

    it("WayfinderBar's home affordance carries the lockup", () => {
        const { container } = render(<WayfinderBar room="DASHBOARD" />);
        expect(
            container.querySelector(".ds-wayfinder__mark .ds-lockup")
        ).not.toBeNull();
    });
});

describe("catalog tail", () => {
    it("Stamp is hairline-bracketed judgment; Avatar renders initials only", () => {
        const { container } = render(
            <div>
                <Stamp tone="green">CORRECTED</Stamp>
                <Avatar name="Sarah Chen" role="decider" />
            </div>
        );
        expect(container.querySelector(".ds-stamp--green")).not.toBeNull();
        const avatar = container.querySelector(".ds-avatar--orange");
        expect(avatar?.textContent).toBe("SC");
    });

    it("Tooltip renders the bubble in show-me-how and vanishes in step-back", () => {
        const a = render(
            <Tooltip text="help here">
                <button>x</button>
            </Tooltip>
        );
        expect(a.container.querySelector(".ds-tooltip__bubble")).not.toBeNull();
        const b = render(
            <Tooltip text="help here" density="step_back">
                <button>x</button>
            </Tooltip>
        );
        expect(b.container.querySelector(".ds-tooltip__bubble")).toBeNull();
    });

    it("Table renders columns + at most one offset row breaking rank", () => {
        const { container } = render(
            <Table
                label="Recovery queue"
                columns={[
                    { key: "a", label: "Account" },
                    { key: "v", label: "Value", numeric: true }
                ]}
                rows={[
                    { id: "1", offset: true, cells: { a: "Acme", v: "$1" } },
                    { id: "2", cells: { a: "Meridian", v: "$2" } }
                ]}
            />
        );
        expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
        expect(
            container.querySelectorAll(".ds-table__row--offset")
        ).toHaveLength(1);
    });

    it("Progress carries the real-things count and per-milestone done marks", () => {
        const { container, getByText } = render(
            <Progress
                label="Kit"
                count="4 of 7 sections ready"
                milestones={[
                    { label: "One", done: true },
                    { label: "Two", done: false }
                ]}
            />
        );
        expect(getByText("4 of 7 sections ready")).toBeTruthy();
        expect(container.querySelectorAll(".is-done")).toHaveLength(1);
    });
});

describe("system cards", () => {
    it("PatternCard renders claim + evidence + how-sure", () => {
        const { getByText } = render(
            <PatternCard
                claim="Two accounts went quiet the same week."
                evidence={["Acme: 16 days silent"]}
                howSure="Fairly sure."
            />
        );
        expect(getByText("Two accounts went quiet the same week.")).toBeTruthy();
        expect(getByText("Acme: 16 days silent")).toBeTruthy();
        expect(getByText("Fairly sure.")).toBeTruthy();
    });

    it("ProposalCard wires the three operator moves", () => {
        const onAccept = vi.fn();
        const onSnooze = vi.fn();
        const onDismiss = vi.fn();
        const { getByText } = render(
            <ProposalCard
                noticed="You ran this every Friday."
                change="Make it standing."
                onAccept={onAccept}
                onSnooze={onSnooze}
                onDismiss={onDismiss}
            />
        );
        fireEvent.click(getByText("Yes, make that change"));
        fireEvent.click(getByText("Ask me again in a month"));
        fireEvent.click(getByText("Not now"));
        expect(onAccept).toHaveBeenCalled();
        expect(onSnooze).toHaveBeenCalled();
        expect(onDismiss).toHaveBeenCalled();
    });

    it("ReadinessReadout is a plain-sentence state, no bars", () => {
        const { container, getByText } = render(
            <ReadinessReadout
                state="Inheritable with guardrails"
                read="A hire could run this if you're around."
            />
        );
        expect(getByText("Inheritable with guardrails")).toBeTruthy();
        expect(container.querySelector("[role='progressbar']")).toBeNull();
    });
});

describe("layout & grid (spec 05)", () => {
    it("PageFrame renders the centered column + the sub-1024 notice", () => {
        const { container } = render(
            <PageFrame>
                <p>work</p>
            </PageFrame>
        );
        expect(container.querySelector(".ds-frame__column")?.textContent).toBe(
            "work"
        );
        // The unsupported notice is always in the DOM; CSS shows it < 1024.
        expect(container.querySelector(".ds-frame__unsupported")).not.toBeNull();
    });

    it("GridCell clamps its span to 1–12", () => {
        const { container } = render(
            <Grid>
                <GridCell span={7}>
                    <p>brief</p>
                </GridCell>
                <GridCell span={99}>
                    <p>over</p>
                </GridCell>
            </Grid>
        );
        const cells = container.querySelectorAll(".ds-grid__cell");
        expect((cells[0] as HTMLElement).style.gridColumn).toBe("span 7");
        expect((cells[1] as HTMLElement).style.gridColumn).toBe("span 12");
    });

    it("BandStack collapses absent bands (no placeholder gap)", () => {
        const showSecond = false;
        const { container } = render(
            <BandStack>
                <p class="band">one</p>
                {showSecond && <p class="band">two</p>}
                <p class="band">three</p>
            </BandStack>
        );
        expect(container.querySelectorAll(".band")).toHaveLength(2);
    });

    it("FocalRail renders both panes with the rail labelled", () => {
        const { container, getByText } = render(
            <FocalRail
                railLabel="Ranked pressure"
                focal={<p>focal object</p>}
                rail={<p>the rest</p>}
            />
        );
        expect(getByText("focal object")).toBeTruthy();
        expect(
            container.querySelector("[aria-label='Ranked pressure']")
        ).not.toBeNull();
    });

    it("ObjectControls keeps the object and the labelled controls", () => {
        const { container, getByText } = render(
            <ObjectControls
                controlsLabel="ICP inputs"
                object={<p>the ICP</p>}
                controls={<p>inputs</p>}
            />
        );
        expect(getByText("the ICP")).toBeTruthy();
        expect(
            container.querySelector(".ds-arch-objectcontrols__controls")
        ).not.toBeNull();
    });

    it("Measure caps prose width", () => {
        const { container } = render(
            <Measure>
                <p>a long read</p>
            </Measure>
        );
        expect(container.querySelector(".ds-measure")).not.toBeNull();
    });
});

describe("HandoffStrip (spec 03 §3.4)", () => {
    it("renders one primary (orange) route and the rest secondary", () => {
        const { container } = render(
            <HandoffStrip
                label="Carry the work forward"
                kicker="CARRY THE WORK FORWARD"
                title="Push Acme into intervention."
                routes={[
                    { label: "Pre-mortem this deal", href: "/future-autopsy/?x=1", primary: true },
                    { label: "Forge a proof", href: "/poc-framework/?x=1" }
                ]}
            />
        );
        expect(container.querySelectorAll(".ds-btn--accent")).toHaveLength(1);
        expect(container.querySelectorAll(".ds-btn--secondary")).toHaveLength(1);
        expect(
            container.querySelector(".ds-btn--accent")?.getAttribute("href")
        ).toBe("/future-autopsy/?x=1");
    });
});

describe("RiskCard (spec 03 §4.1 System)", () => {
    it("is a red Grounded card carrying cause + score + the move", () => {
        const { container, getByText } = render(
            <RiskCard
                title="Acme Industries"
                cause="Champion quiet for twelve days"
                score={84}
                actions={<Button variant="accent">Open the deal</Button>}
            />
        );
        expect(container.querySelector(".ds-gauge--red")).not.toBeNull();
        expect(getByText("Champion quiet for twelve days")).toBeTruthy();
        expect(container.querySelector(".ds-riskcard__score")?.textContent).toBe(
            "84"
        );
        expect(getByText("Open the deal")).toBeTruthy();
    });
});

describe("Wayfinder — the full three cells (spec 03 §3.2)", () => {
    it("renders Trail crumbs, the Here crumb, and the Pulling cell", () => {
        const { container, getByText } = render(
            <WayfinderBar
                room="DASHBOARD"
                tail="3 ranked"
                trail={[{ label: "SIGNAL", href: "/signal-console/" }]}
                pulling={{
                    verb: "Recover",
                    object: "Acme — stalled 18d",
                    href: "/deal-workspace/"
                }}
            />
        );
        expect(container.querySelector(".ds-wayfinder__trail-crumb")?.textContent).toBe(
            "SIGNAL"
        );
        expect(container.textContent).toContain("DASHBOARD · 3 ranked");
        expect(getByText("Recover")).toBeTruthy();
        // The Pulling cell is the only orange on the bar (the gauge).
        expect(container.querySelector(".ds-wayfinder__pulling-gauge")).not.toBeNull();
    });

    it("the minimal bar (no trail/pulling) still works for every room", () => {
        const { container } = render(<WayfinderBar room="SETTINGS" />);
        expect(container.querySelector(".ds-wayfinder__crumb")?.textContent).toBe(
            "SETTINGS"
        );
        expect(container.querySelector(".ds-wayfinder__pulling")).toBeNull();
        expect(container.querySelector(".ds-wayfinder__why")).toBeNull();
    });

    it("Why grows the reasoning inline and Skip closes it", () => {
        const { container, getByText, queryByText } = render(
            <WayfinderBar
                room="DASHBOARD"
                pulling={{
                    verb: "Send",
                    object: "the revised proposal",
                    href: "/outbound-studio/",
                    why: <p>Sarah's budget review is Wednesday.</p>
                }}
            />
        );
        expect(container.querySelector(".ds-wayfinder__why-panel")).toBeNull();
        fireEvent.click(getByText(/Why/));
        expect(
            container.querySelector(".ds-wayfinder__why-panel")
        ).not.toBeNull();
        expect(getByText("Sarah's budget review is Wednesday.")).toBeTruthy();
        fireEvent.click(getByText("Skip — stay here"));
        expect(queryByText("Sarah's budget review is Wednesday.")).toBeNull();
    });
});

describe("Pulse + Ribbon (spec 03 §2.1, §2.2)", () => {
    it("Ribbon marks a zone seam with label + suffix", () => {
        const { container } = render(<Ribbon label="NOW" suffix="3 deals" tone="red" />);
        expect(container.querySelector(".ds-ribbon--red")).not.toBeNull();
        expect(container.querySelector(".ds-ribbon__label")?.textContent).toBe("NOW");
        expect(container.querySelector(".ds-ribbon__suffix")?.textContent).toBe(
            "3 deals"
        );
    });

    it("PulseZone renders its ribbon + items; an empty zone collapses", () => {
        const showLater = false;
        const { container } = render(
            <PulseTimeline label="Ranked pipeline">
                <PulseZone label="NOW" suffix="1">
                    <div class="pz-item">Acme</div>
                </PulseZone>
                <PulseZone label="GONE QUIET" depth={2}>
                    {showLater && <div class="pz-item">later</div>}
                </PulseZone>
            </PulseTimeline>
        );
        // NOW renders; the empty GONE QUIET zone renders nothing.
        expect(container.querySelectorAll(".ds-pulse-zone")).toHaveLength(1);
        expect(container.querySelectorAll(".pz-item")).toHaveLength(1);
    });

    it("a zone recedes progressively (carries its depth class)", () => {
        const { container } = render(
            <PulseTimeline label="Pipeline">
                <PulseZone label="YESTERDAY" depth={1}>
                    <div>x</div>
                </PulseZone>
            </PulseTimeline>
        );
        expect(
            container.querySelector(".ds-pulse-zone--depth-1")
        ).not.toBeNull();
    });

    it("PulseHorizon closes the page with a strip of counts", () => {
        const { container, getByText } = render(
            <PulseHorizon
                counts={[
                    { label: "active", value: 14 },
                    { label: "at risk", value: 3 }
                ]}
            />
        );
        expect(container.querySelectorAll(".ds-pulse-horizon__cell")).toHaveLength(2);
        expect(getByText("14")).toBeTruthy();
    });
});
