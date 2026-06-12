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
    WayfinderBar
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
                density="step-back"
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
