import { describe, expect, it } from "vitest";
import { computeLoomRead } from "./loom-read";
import type {
    Prospect,
    ProspectStage,
    WorkbenchStats
} from "./types";

const ISO = "2026-05-18T00:00:00Z";

function prospect(id: string, stage: ProspectStage): Prospect {
    return {
        id,
        accountName: id,
        contactName: "",
        contactTitle: "",
        sourceQueryId: "",
        leverage: "cold",
        stage,
        entryPoint: "",
        approach: "",
        notes: "",
        createdAt: ISO,
        updatedAt: ISO
    };
}

function statsFrom(prospects: ReadonlyArray<Prospect>): WorkbenchStats {
    let captured = 0;
    let researched = 0;
    let ready = 0;
    let pushed = 0;
    for (const p of prospects) {
        if (p.stage === "captured") captured += 1;
        else if (p.stage === "researched") researched += 1;
        else if (p.stage === "ready") ready += 1;
        else if (p.stage === "pushed") pushed += 1;
    }
    return {
        captured,
        researched,
        ready,
        pushed,
        total: captured + researched + ready + pushed
    };
}

describe("computeLoomRead — empty board", () => {
    it("returns empty band with no-prospects copy", () => {
        const prospects: Prospect[] = [];
        const r = computeLoomRead({
            prospects,
            stats: statsFrom(prospects)
        });
        expect(r.band).toBe("empty");
        expect(r.weekRead.toLowerCase()).toContain("no prospects");
        expect(r.operatorMove.toLowerCase()).toContain("capture the first");
    });
});

describe("computeLoomRead — operator move priority chain", () => {
    it("prescribes pushing when a ready prospect exists", () => {
        const prospects = [prospect("a-1", "ready")];
        const r = computeLoomRead({
            prospects,
            stats: statsFrom(prospects)
        });
        expect(r.operatorMove.toLowerCase()).toContain("push the cleanest");
    });

    it("prescribes tightening researched into ready when 3+ researched, 0 ready", () => {
        const prospects = [
            prospect("a-1", "researched"),
            prospect("a-2", "researched"),
            prospect("a-3", "researched")
        ];
        const r = computeLoomRead({
            prospects,
            stats: statsFrom(prospects)
        });
        expect(r.operatorMove.toLowerCase()).toContain("tighten");
        expect(r.operatorMove.toLowerCase()).toContain("ready");
    });

    it("prescribes researching when 5+ captured pile up unworked", () => {
        const prospects = Array.from({ length: 6 }, (_, i) =>
            prospect(`a-${i}`, "captured")
        );
        const r = computeLoomRead({
            prospects,
            stats: statsFrom(prospects)
        });
        expect(r.operatorMove.toLowerCase()).toContain("research one captured");
    });
});

describe("computeLoomRead — week read priority chain", () => {
    it("flags captured-pile-up when nothing researched", () => {
        const prospects = Array.from({ length: 5 }, (_, i) =>
            prospect(`a-${i}`, "captured")
        );
        const r = computeLoomRead({
            prospects,
            stats: statsFrom(prospects)
        });
        expect(r.weekRead.toLowerCase()).toContain("piling up");
    });

    it("declares producing when 3+ ready (band working until pushes land)", () => {
        // 3 ready alone is working+producing — actual shipping band
        // requires pushed prospects landing downstream.
        const prospects = [
            prospect("a-1", "ready"),
            prospect("a-2", "ready"),
            prospect("a-3", "ready")
        ];
        const r = computeLoomRead({
            prospects,
            stats: statsFrom(prospects)
        });
        expect(r.weekRead.toLowerCase()).toContain("producing");
        expect(r.band).toBe("working");
    });
});

describe("computeLoomRead — score bands", () => {
    it("scores empty board near 30 floor and bands empty", () => {
        const r = computeLoomRead({
            prospects: [],
            stats: statsFrom([])
        });
        expect(r.score).toBeLessThan(40);
        expect(r.band).toBe("empty");
    });

    it("scores a shipping board into the shipping band", () => {
        const prospects = [
            prospect("a-1", "ready"),
            prospect("a-2", "ready"),
            prospect("a-3", "ready"),
            prospect("a-4", "pushed"),
            prospect("a-5", "pushed"),
            prospect("a-6", "pushed"),
            prospect("a-7", "researched")
        ];
        const r = computeLoomRead({
            prospects,
            stats: statsFrom(prospects)
        });
        expect(r.band).toBe("shipping");
        expect(r.score).toBeGreaterThanOrEqual(70);
    });
});
