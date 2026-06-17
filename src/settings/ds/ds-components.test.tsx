import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { cloudConnection, cloudCounts, category } from "../state";
import { cloudStatusLabel, cloudTone, totalCloudRows } from "./lib/adapters";
import { SettingsCardsDS } from "./components/SettingsCardsDS";
import { SettingsDS } from "./SettingsDS";

beforeEach(() => {
    cleanup();
    localStorage.clear();
    cloudConnection.value = {
        status: "connected",
        userEmail: "sarah@northwind.io",
        workspace: { id: "w1", name: "Northwind", createdAt: "" },
        errorMessage: null
    };
    cloudCounts.value = {
        icps: 1,
        deals: 3,
        proofs: 0,
        advisorDeployments: 0,
        signalConsoleAccounts: 4,
        sequences: 2,
        discoveryCallLogs: 0,
        studioArtifacts: 0,
        pipelineSettings: 1
    };
});

describe("adapters", () => {
    it("tones cloud status — connected green, signed-out amber, error red", () => {
        expect(cloudTone("connected")).toBe("green");
        expect(cloudTone("no-credentials")).toBe("amber");
        expect(cloudTone("auth-missing")).toBe("amber");
        expect(cloudTone("error")).toBe("red");
    });
    it("labels the cloud status", () => {
        expect(cloudStatusLabel("connected")).toBe("Connected");
        expect(cloudStatusLabel("auth-missing")).toBe("Signed out");
    });
    it("sums cloud rows across every noun", () => {
        expect(totalCloudRows()).toBe(1 + 3 + 4 + 2 + 1);
    });
});

describe("SettingsCardsDS", () => {
    it("renders the nine trust-annex cards on the library", () => {
        const { container } = render(<SettingsCardsDS />);
        const cards = container.querySelectorAll(".ds-card");
        // 9 cards, all composed on the library Card
        expect(cards.length).toBe(9);
    });

    it("carries the red anchored edge on the destructive delete card", () => {
        const { container } = render(<SettingsCardsDS />);
        // Card tone="red" emits a red edge modifier
        expect(container.querySelector(".ds-card--edge-red")).not.toBeNull();
    });

    it("gates the delete button until the confirm phrase is typed", () => {
        const { getByText, container } = render(<SettingsCardsDS />);
        const del = getByText("Delete cloud data") as HTMLButtonElement;
        expect(del.disabled).toBe(true);
        const input = container.querySelector(
            ".stgd-confirm .ds-input"
        ) as HTMLInputElement;
        fireEvent.input(input, { target: { value: "delete my data" } });
        expect((getByText("Delete cloud data") as HTMLButtonElement).disabled).toBe(
            false
        );
    });

    it("changes the product category through the library Select", () => {
        const { container } = render(<SettingsCardsDS />);
        const select = container.querySelector(
            ".ds-card select.ds-input"
        ) as HTMLSelectElement;
        expect(select).not.toBeNull();
        const next = Array.from(select.options).find(
            (o) => o.value !== category.value
        )!;
        fireEvent.change(select, { target: { value: next.value } });
        expect(category.value).toBe(next.value);
    });
});

describe("SettingsDS", () => {
    it("mounts the wayfinder, the trust-state head, and the grid — no pulling cell", () => {
        const { container } = render(<SettingsDS />);
        expect(container.querySelector(".ds-wayfinder")).not.toBeNull();
        // Trust Annex has no next-move pulling cell
        expect(container.querySelector(".ds-wayfinder__pulling")).toBeNull();
        expect(container.querySelector(".stgd-stats")).not.toBeNull();
        expect(container.querySelector(".stgd-grid")).not.toBeNull();
    });
});
