import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/preact";
import {
    WorkspaceReads,
    __resetWorkspaceReadsForTests,
    __seedWorkspaceReadsForTests
} from "./WorkspaceReads";
import type { ObservationView } from "@/lib/observations/types";

function mkObs(over: Partial<ObservationView> = {}): ObservationView {
    // Use `in` for nullable fields so an explicit null in `over` wins
    // over the default. `??` would coerce null → default, breaking the
    // tests that need to exercise the no-related-object path.
    return {
        id: over.id ?? "obs_x",
        workspaceId: over.workspaceId ?? "ws_x",
        writtenAt: over.writtenAt ?? "2026-06-01T12:00:00Z",
        observationText:
            over.observationText ?? "Acme has been stuck in evaluation for 12 days.",
        relatedObjectType:
            "relatedObjectType" in over ? over.relatedObjectType! : "deal",
        relatedObjectId:
            "relatedObjectId" in over ? over.relatedObjectId! : "deal_acme",
        sourceGenerator: over.sourceGenerator ?? "deal_decay",
        confidence: over.confidence ?? "high",
        status: over.status ?? "active",
        supersededBy: null,
        dismissedAt: null,
        dismissedReason: null
    };
}

describe("WorkspaceReads", () => {
    beforeEach(() => {
        __resetWorkspaceReadsForTests();
    });

    it("renders the empty state when there are no observations", () => {
        __seedWorkspaceReadsForTests([]);
        const { container } = render(<WorkspaceReads />);
        const empty = container.querySelector(".bf-workspace--empty");
        expect(empty).not.toBeNull();
        expect(empty!.textContent).toContain(
            "nothing to flag in your work right now"
        );
    });

    it("groups observations by source generator", () => {
        __seedWorkspaceReadsForTests([
            mkObs({ id: "1", sourceGenerator: "deal_decay" }),
            mkObs({ id: "2", sourceGenerator: "deal_decay" }),
            mkObs({ id: "3", sourceGenerator: "signal_decay" }),
            mkObs({ id: "4", sourceGenerator: "proof_staleness" })
        ]);
        const { container } = render(<WorkspaceReads />);
        const groups = container.querySelectorAll(".bf-workspace__group");
        expect(groups.length).toBe(3);
        expect(container.textContent).toContain("Deals going stale");
        expect(container.textContent).toContain("Accounts going quiet");
        expect(container.textContent).toContain("Evidence past its readout");
    });

    it("renders observation text + the surfaced count", () => {
        __seedWorkspaceReadsForTests([
            mkObs({
                id: "1",
                observationText: "Acme stuck 12 days at evaluation."
            }),
            mkObs({
                id: "2",
                observationText: "BarCo silent for 16 days."
            })
        ]);
        const { container } = render(<WorkspaceReads />);
        expect(container.textContent).toContain("2 reads surfaced");
        expect(container.textContent).toContain("Acme stuck 12 days at evaluation.");
        expect(container.textContent).toContain("BarCo silent for 16 days.");
    });

    it("renders unknown generators with humanized fallback", () => {
        __seedWorkspaceReadsForTests([
            mkObs({ id: "1", sourceGenerator: "some_new_generator" })
        ]);
        const { container } = render(<WorkspaceReads />);
        expect(container.textContent).toContain("some new generator");
    });

    it("routes deal observations to Deal Workspace via a link", () => {
        __seedWorkspaceReadsForTests([
            mkObs({
                id: "1",
                relatedObjectType: "deal",
                relatedObjectId: "deal_acme",
                sourceGenerator: "deal_decay",
                observationText: "Acme stuck 12 days at evaluation."
            })
        ]);
        const { container } = render(<WorkspaceReads />);
        const link = container.querySelector(
            ".bf-workspace__row-link"
        ) as HTMLAnchorElement | null;
        expect(link).not.toBeNull();
        expect(link!.getAttribute("href")).toContain("/deal-workspace/");
        expect(link!.getAttribute("href")).toContain("focusObject=deal_acme");
        expect(link!.getAttribute("href")).toContain("fromMode=workspace-read");
        expect(container.textContent).toContain("Open in Deal Workspace");
    });

    it("renders unroutable observations as plain text (no link)", () => {
        __seedWorkspaceReadsForTests([
            mkObs({
                id: "1",
                relatedObjectType: null,
                relatedObjectId: null,
                sourceGenerator: "discovery_rhythm",
                observationText: "Fewer than one discovery session this week."
            })
        ]);
        const { container } = render(<WorkspaceReads />);
        expect(
            container.querySelector(".bf-workspace__row-link")
        ).toBeNull();
        expect(container.textContent).toContain(
            "Fewer than one discovery session this week."
        );
    });
});
