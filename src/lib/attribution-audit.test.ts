import { describe, expect, it } from "vitest";

import { icpToInsert, icpToUpdate } from "@/icp-studio/lib/icp-bridge";
import {
    proofToInsert,
    proofToUpdate
} from "@/poc-framework/lib/poc-bridge";
import {
    deploymentToInsert,
    deploymentToUpdate
} from "@/advisor-deploy/lib/advisor-bridge";
import {
    advisorToInsert,
    advisorToUpdate
} from "@/advisor-deploy/lib/advisor-profile-bridge";
import {
    accountToInsert as scAccountToInsert,
    accountToUpdate as scAccountToUpdate
} from "@/signal-console/lib/sc-bridge";
import {
    touchToInsert,
    touchToUpdate,
    angleToInsert,
    angleToUpdate
} from "@/outbound-studio/lib/outbound-bridge";
import {
    actionToInsert,
    actionToUpdate
} from "@/linkedin-playbook/lib/linkedin-bridge";
import {
    callEntryToInsert,
    callEntryToUpdate
} from "@/cold-call-studio/lib/coldcall-bridge";
import { snapshotToInsert } from "@/call-planner/lib/planner-bridge";
import {
    accountToInsert as taAccountToInsert,
    accountToUpdate as taAccountToUpdate,
    approachToInsert,
    approachToUpdate,
    thesisToInsert,
    thesisToUpdate
} from "@/territory-architect/lib/territory-bridge";
import {
    prospectToInsert,
    prospectToUpdate,
    queryCardToInsert,
    queryCardToUpdate
} from "@/sourcing-workbench/lib/sourcing-bridge";
import {
    taskLogToInsert,
    taskLogToUpdate
} from "@/future-autopsy/lib/autopsy-bridge";
import {
    inputsToInsert,
    inputsToUpdate
} from "@/quota-workback/lib/quota-bridge";

/**
 * Cross-bridge attribution audit (Priority B1).
 *
 * All cloud-synced tables in the schema have server-side defaults for
 * `user_id` (default auth.uid()), `created_by` (default auth.uid()),
 * and `workspace_id` (default current_user_default_workspace_id()).
 * This means rows inserted WITHOUT those columns get attribution
 * automatically populated by Postgres.
 *
 * If a bridge accidentally includes one of those columns in its insert
 * payload — even as null — the server default does NOT fire and the
 * row lands without attribution. That breaks future audit queries
 * and might break RLS depending on policy shape.
 *
 * This file is the single point that asserts every bridge's
 * insert/update payloads never include the auto-attribution columns.
 * If a future bridge starts setting these manually, a test here fails
 * before the regression ships.
 *
 * The convention: bridges produce minimal insert/update payloads.
 * Server defaults handle attribution. Cross-device + audit guarantees
 * come from the schema, not from each bridge remembering to set the
 * right thing.
 */

const FORBIDDEN_KEYS = [
    "user_id",
    "created_by",
    "workspace_id"
] as const;

function assertNoAttributionKeys(
    payload: Record<string, unknown>,
    label: string
): void {
    for (const key of FORBIDDEN_KEYS) {
        expect(
            payload[key],
            `${label}: bridge should not set "${key}" — server default handles it`
        ).toBeUndefined();
    }
}

describe("Attribution audit: bridges never set user_id / created_by / workspace_id", () => {
    it("ICP Studio: icpToInsert + icpToUpdate", () => {
        const FULL_ICP = {
            id: "icp_1",
            statement: "x",
            role: "founder" as const,
            industry: "legal",
            size: "mid",
            geo: "us",
            buyer: "gc",
            pain: "p",
            trigger: "t",
            proofWindow: "60d",
            engineActive: 1,
            qualityScore: 50,
            qualityChecks: [],
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(icpToInsert(FULL_ICP) as never, "icp.insert");
        assertNoAttributionKeys(icpToUpdate(FULL_ICP) as never, "icp.update");
    });

    it("PoC Framework: proofToInsert + proofToUpdate", () => {
        const FULL_PROOF = {
            id: "p1",
            account: "Acme",
            vendor: "Harvey",
            readoutOwner: "Sarah",
            linkedDealId: "",
            linkedDealName: "",
            durationDays: 7 as const,
            outcome: "in_progress" as const,
            successCriteria: "x",
            boundaries: "y",
            qualityScore: 70,
            qualityBand: "workable" as const,
            docs: { scope: "", kickoff: "", readout: "", email: "" },
            updatedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            proofToInsert(FULL_PROOF) as never,
            "proof.insert"
        );
        assertNoAttributionKeys(
            proofToUpdate(FULL_PROOF) as never,
            "proof.update"
        );
    });

    it("Advisor Deploy: deployment + advisor profile", () => {
        const DEP = {
            id: "d1",
            dealId: "deal_legacy",
            dealName: "Acme",
            dealStage: "discovery",
            advisorId: "adv_1",
            advisorName: "Sarah",
            momentId: "intro" as const,
            momentName: "Warm intro",
            ask: "ask",
            forwardableNote: "",
            outcome: "engaged" as const,
            notes: "",
            createdAt: "2026-04-01T00:00:00Z",
            outcomeDate: null
        };
        assertNoAttributionKeys(
            deploymentToInsert(DEP, "t2") as never,
            "deployment.insert"
        );
        assertNoAttributionKeys(
            deploymentToUpdate(DEP, "t2") as never,
            "deployment.update"
        );

        const ADV = {
            id: "adv_1",
            name: "Sarah",
            title: "Operator",
            tier: "t2" as const,
            expertise: "SaaS",
            equity: "",
            companies: ["Meridian"],
            notes: "",
            relationship: "active" as const,
            createdAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            advisorToInsert(ADV) as never,
            "advisor.profile.insert"
        );
        assertNoAttributionKeys(
            advisorToUpdate(ADV) as never,
            "advisor.profile.update"
        );
    });

    it("Signal Console: account", () => {
        const ACC = {
            id: "acc_1",
            name: "Acme",
            signals: []
        };
        assertNoAttributionKeys(
            scAccountToInsert(ACC) as never,
            "sc.account.insert"
        );
        assertNoAttributionKeys(
            scAccountToUpdate(ACC) as never,
            "sc.account.update"
        );
    });

    it("Outbound Studio: touches + angles", () => {
        const TOUCH = {
            id: "t1",
            account: "acme",
            accountName: "Acme",
            contactName: "",
            contactTitle: "",
            persona: "vp" as const,
            temperature: "warm" as const,
            channel: "email" as const,
            trigger: "funding" as const,
            ctaType: "no_ask" as const,
            assetUsed: "none" as const,
            content: "Hi",
            outcome: null,
            outcomeDate: null,
            dealId: null,
            qualityScore: 50,
            motionBand: "workable",
            createdAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            touchToInsert(TOUCH) as never,
            "touch.insert"
        );
        assertNoAttributionKeys(
            touchToUpdate(TOUCH) as never,
            "touch.update"
        );

        const ANGLE = {
            id: "a1",
            company: "Acme",
            trigger: "funding" as const,
            persona: "vp" as const,
            email: "Hi",
            temperature: "warm" as const,
            channel: "email" as const,
            ctaType: "no_ask" as const,
            assetUsed: "none" as const,
            qualityScore: 50,
            motionBand: "workable",
            nextMove: "",
            savedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            angleToInsert(ANGLE) as never,
            "angle.insert"
        );
        assertNoAttributionKeys(
            angleToUpdate(ANGLE) as never,
            "angle.update"
        );
    });

    it("LinkedIn Playbook: action", () => {
        const ENTRY = {
            id: "li1",
            accountName: "Acme",
            contactName: "",
            actionType: "content_engage" as const,
            temperature: "cool" as const,
            content: "",
            motionKey: "credibility" as const,
            motionLabel: "Build credibility",
            cueLabel: "Cue 01",
            whyNow: "",
            recommendedNext: "",
            outcome: null,
            outcomeDate: null,
            createdAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            actionToInsert(ENTRY) as never,
            "linkedin.action.insert"
        );
        assertNoAttributionKeys(
            actionToUpdate(ENTRY) as never,
            "linkedin.action.update"
        );
    });

    it("Cold Call Studio: call entry", () => {
        const ENTRY = {
            id: "c1",
            accountName: "Acme",
            contactName: "",
            contactTitle: "",
            threadId: "opener" as const,
            threadTitle: "Opening",
            buyerResponse: "",
            recommendedResponse: "",
            outcome: "logged" as const,
            notes: "",
            source: "cold-call-studio-talk-loom" as const,
            createdAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            callEntryToInsert(ENTRY) as never,
            "coldcall.insert"
        );
        assertNoAttributionKeys(
            callEntryToUpdate(ENTRY) as never,
            "coldcall.update"
        );
    });

    it("Call Planner: snapshot", () => {
        const SNAP = {
            contact: "",
            company: "Acme",
            persona: "cxo" as const,
            linkedDeal: "",
            gates: [],
            gateDetails: [],
            score: 0,
            band: "thin",
            nextMove: "",
            signalHeadline: "",
            customNotes: "",
            linkedinUrl: "",
            preparedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            snapshotToInsert(SNAP) as never,
            "planner.snapshot.insert"
        );
    });

    it("Territory Architect: thesis + approach + account", () => {
        const THESIS = {
            id: "th_1",
            title: "T",
            pressure: "",
            segment: "",
            whyUs: "",
            tier: "t1" as const,
            accountIds: [],
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            thesisToInsert(THESIS) as never,
            "territory.thesis.insert"
        );
        assertNoAttributionKeys(
            thesisToUpdate(THESIS) as never,
            "territory.thesis.update"
        );

        const APP = {
            id: "ap_1",
            name: "A",
            trigger: "",
            script: "",
            bridge: "",
            thesisId: "th_1",
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            approachToInsert(APP) as never,
            "territory.approach.insert"
        );
        assertNoAttributionKeys(
            approachToUpdate(APP) as never,
            "territory.approach.update"
        );

        const ACC = {
            id: "ac_1",
            name: "Acme",
            tier: "t1" as const,
            thesisId: "th_1",
            approachId: "",
            disposition: "active" as const,
            notes: "",
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            taAccountToInsert(ACC) as never,
            "territory.account.insert"
        );
        assertNoAttributionKeys(
            taAccountToUpdate(ACC) as never,
            "territory.account.update"
        );
    });

    it("Sourcing Workbench: query card + prospect", () => {
        const Q = {
            id: "q1",
            platform: "linkedin" as const,
            query: "x",
            intent: "",
            notes: "",
            targetIcp: "",
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            queryCardToInsert(Q) as never,
            "sourcing.query.insert"
        );
        assertNoAttributionKeys(
            queryCardToUpdate(Q) as never,
            "sourcing.query.update"
        );

        const P = {
            id: "p1",
            accountName: "Acme",
            contactName: "",
            contactTitle: "",
            sourceQueryId: "",
            leverage: "cold" as const,
            stage: "captured" as const,
            entryPoint: "",
            approach: "",
            notes: "",
            createdAt: "2026-04-01T00:00:00Z",
            updatedAt: "2026-04-01T00:00:00Z"
        };
        assertNoAttributionKeys(
            prospectToInsert(P) as never,
            "sourcing.prospect.insert"
        );
        assertNoAttributionKeys(
            prospectToUpdate(P) as never,
            "sourcing.prospect.update"
        );
    });

    it("Future Autopsy: task log singleton", () => {
        const LOG = { deal_1: { tasks: {} } };
        assertNoAttributionKeys(
            taskLogToInsert(LOG) as never,
            "autopsy.tasklog.insert"
        );
        assertNoAttributionKeys(
            taskLogToUpdate(LOG) as never,
            "autopsy.tasklog.update"
        );
    });

    it("Quota Workback: inputs singleton", () => {
        const INPUTS = {
            quota: 1_000_000,
            acv: 50_000,
            win: 20,
            m2o: 35,
            t2m: 0.7,
            show: 80,
            days: 20,
            tpa: 8,
            cycle: 45
        };
        assertNoAttributionKeys(
            inputsToInsert(INPUTS) as never,
            "quota.inputs.insert"
        );
        assertNoAttributionKeys(
            inputsToUpdate(INPUTS) as never,
            "quota.inputs.update"
        );
    });
});
