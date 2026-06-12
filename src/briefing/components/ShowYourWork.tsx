import type { JSX } from "preact";
import { t } from "@/lib/voice/t";
import { envelopeCache, envelopeOpen, toggleEnvelope } from "../state";
import type { AuditEnvelope, CallRecord } from "../lib/audit-envelope-client";

/**
 * ShowYourWork (B.6b) — the Defensibility surface.
 *
 * Operator clicks "Show the work" on a Pattern card. We lazy-load the
 * envelope from briefing_audit_envelopes and render the trail —
 * cluster + evidence snapshot, hydrated context at synthesis time, LLM
 * call chain (draft/critique/revise) with cost and token usage, and
 * the gate decisions.
 *
 * Per-call prompts and responses can be enormous, so each call record
 * shows summary stats by default and expands to the full text on
 * demand. The whole panel is collapsed by default — we only fetch
 * envelopes the operator actually wants to see.
 */

export function ShowYourWorkButton({ patternId }: { patternId: string }): JSX.Element {
    const isOpen = envelopeOpen.value.has(patternId);
    return (
        <button
            type="button"
            class="bf-work-toggle"
            aria-expanded={isOpen}
            onClick={() => void toggleEnvelope(patternId)}
        >
            {isOpen ? "Hide the work" : "Show the work"}
        </button>
    );
}

export function ShowYourWorkPanel({ patternId }: { patternId: string }): JSX.Element | null {
    if (!envelopeOpen.value.has(patternId)) return null;
    const cached = envelopeCache.value.get(patternId);
    if (cached === undefined || cached === "loading") {
        return (
            <section class="bf-work">
                <p class="bf-work__loading">{t("Reading the envelope…")}</p>
            </section>
        );
    }
    if (cached === "error") {
        return (
            <section class="bf-work">
                <p class="bf-work__loading">{t("Couldn't load the envelope.")}</p>
            </section>
        );
    }
    if (cached === "missing") {
        return (
            <section class="bf-work">
                <p class="bf-work__loading">
                    No envelope on file for this Pattern. It was likely synthesized before B.6
                    landed; future runs will have one.
                </p>
            </section>
        );
    }
    return <EnvelopeBody envelope={cached} />;
}

// ─── Body ──────────────────────────────────────────────────────

function EnvelopeBody({ envelope }: { envelope: AuditEnvelope }): JSX.Element {
    return (
        <section class="bf-work" aria-label={t("The system's work")}>
            <ClusterSnapshotBlock snapshot={envelope.cluster_snapshot} />
            <ContextSnapshotBlock snapshot={envelope.hydrated_context_snapshot} />
            <CallChainBlock envelope={envelope} />
            <GateDecisionsBlock decisions={envelope.gate_decisions} />
            <p class="bf-work__total">
                Total cost: ${envelope.total_cost.toFixed(4)} · captured{" "}
                {envelope.created_at.slice(0, 10)}
            </p>
        </section>
    );
}

// ─── Cluster snapshot ──────────────────────────────────────────

interface ClusterShape {
    cluster_id?: string;
    anchor?: string;
    cluster_type?: string;
    weighted_evidence?: number;
    evidence?: ReadonlyArray<unknown>;
    kind?: string;
    stated_positions?: Record<string, unknown>;
}

function ClusterSnapshotBlock({ snapshot }: { snapshot: unknown }): JSX.Element | null {
    if (!snapshot || typeof snapshot !== "object") return null;
    const s = snapshot as ClusterShape;
    if (s.kind === "contrarian_stated_positions") {
        return <ContrarianClusterBlock snapshot={s} />;
    }
    return <StandardClusterBlock snapshot={s} />;
}

function StandardClusterBlock({ snapshot }: { snapshot: ClusterShape }): JSX.Element {
    const evidence = Array.isArray(snapshot.evidence) ? snapshot.evidence : [];
    return (
        <div class="bf-work__block">
            <p class="bf-work__label">{t("The cluster")}</p>
            <dl class="bf-work__kv">
                {snapshot.anchor && (
                    <>
                        <dt>{t("Anchor")}</dt>
                        <dd>{snapshot.anchor}</dd>
                    </>
                )}
                {snapshot.cluster_type && (
                    <>
                        <dt>{t("Type")}</dt>
                        <dd>{snapshot.cluster_type}</dd>
                    </>
                )}
                {typeof snapshot.weighted_evidence === "number" && (
                    <>
                        <dt>{t("Weighted evidence")}</dt>
                        <dd>{snapshot.weighted_evidence.toFixed(3)}</dd>
                    </>
                )}
                <dt>{t("Items")}</dt>
                <dd>{evidence.length}</dd>
            </dl>
            {evidence.length > 0 && <EvidenceList items={evidence} />}
        </div>
    );
}

function ContrarianClusterBlock({ snapshot }: { snapshot: ClusterShape }): JSX.Element {
    const evidence = Array.isArray(snapshot.evidence) ? snapshot.evidence : [];
    const positions = snapshot.stated_positions ?? {};
    return (
        <div class="bf-work__block">
            <p class="bf-work__label">{t("What we challenged")}</p>
            <pre class="bf-work__json">{JSON.stringify(positions, null, 2)}</pre>
            {evidence.length > 0 && (
                <>
                    <p class="bf-work__label bf-work__label--inner">{t("Evidence considered")}</p>
                    <EvidenceList items={evidence} />
                </>
            )}
        </div>
    );
}

interface EvidenceItemShape {
    enriched_id?: string;
    source_id?: string;
    summary?: string;
    title?: string;
    user_relevance_score?: number;
    companies?: ReadonlyArray<string>;
}

function EvidenceList({ items }: { items: ReadonlyArray<unknown> }): JSX.Element {
    return (
        <ul class="bf-work__items">
            {items.slice(0, 30).map((raw, i) => {
                const it = (raw ?? {}) as EvidenceItemShape;
                const rel =
                    typeof it.user_relevance_score === "number"
                        ? ` · rel ${it.user_relevance_score.toFixed(2)}`
                        : "";
                const companies = Array.isArray(it.companies) && it.companies.length > 0
                    ? ` · ${it.companies.join(", ")}`
                    : "";
                return (
                    <li class="bf-work__item" key={it.enriched_id ?? i}>
                        <span class="bf-work__item-meta">
                            [{it.source_id ?? "?"}{rel}{companies}]
                        </span>{" "}
                        <span class="bf-work__item-text">{it.summary ?? it.title ?? "(no text)"}</span>
                    </li>
                );
            })}
            {items.length > 30 && (
                <li class="bf-work__item bf-work__item--more">
                    + {items.length - 30} more items in the envelope
                </li>
            )}
        </ul>
    );
}

// ─── Context snapshot ──────────────────────────────────────────

function ContextSnapshotBlock({ snapshot }: { snapshot: unknown }): JSX.Element | null {
    if (!snapshot || typeof snapshot !== "object") return null;
    return (
        <div class="bf-work__block">
            <p class="bf-work__label">{t("Stated positions at synthesis time")}</p>
            <pre class="bf-work__json">{JSON.stringify(snapshot, null, 2)}</pre>
        </div>
    );
}

// ─── LLM call chain ────────────────────────────────────────────

function CallChainBlock({ envelope }: { envelope: AuditEnvelope }): JSX.Element {
    return (
        <div class="bf-work__block">
            <p class="bf-work__label">{t("LLM call chain")}</p>
            {envelope.draft_record && <CallRecordCard label={t("Draft")} record={envelope.draft_record} />}
            {envelope.critique_record && (
                <CallRecordCard label={t("Critique")} record={envelope.critique_record} />
            )}
            {envelope.revise_record && (
                <CallRecordCard label={t("Revise")} record={envelope.revise_record} />
            )}
        </div>
    );
}

function CallRecordCard({ label, record }: { label: string; record: CallRecord }): JSX.Element {
    // Native <details>/<summary> for the show/hide toggle — same UX as
    // a useState-driven panel, no hooks. Keeps ShowYourWork.tsx
    // hook-free so PatternCard can import it without the local
    // zimmerframe-transform issue tripping on hook components.
    return (
        <details class="bf-work__call">
            <summary class="bf-work__call-head">
                <span class="bf-work__call-label">{label}</span>
                <span class="bf-work__call-model">{record.model}</span>
                <span class="bf-work__call-cost">
                    ${record.cost_usd.toFixed(4)} · {record.input_tokens.toLocaleString()} in /{" "}
                    {record.output_tokens.toLocaleString()} out
                </span>
                {!record.ok && record.error && (
                    <span class="bf-work__call-err">ERROR: {record.error}</span>
                )}
                <span class="bf-work__call-toggle-hint">{t("click to expand")}</span>
            </summary>
            <div class="bf-work__call-body">
                <p class="bf-work__call-sublabel">{t("System prompt")}</p>
                <pre class="bf-work__pre">{record.system_prompt}</pre>
                <p class="bf-work__call-sublabel">{t("User prompt")}</p>
                <pre class="bf-work__pre">{record.user_prompt}</pre>
                <p class="bf-work__call-sublabel">{t("Response")}</p>
                <pre class="bf-work__pre">{record.response_text}</pre>
                <p class="bf-work__call-foot">
                    prompt_version {record.prompt_version} · model_v_hash {record.model_v_hash.slice(0, 16)}…
                </p>
            </div>
        </details>
    );
}

// ─── Gate decisions ────────────────────────────────────────────

interface GateShape {
    passes?: boolean;
    failures?: ReadonlyArray<string>;
    checks?: ReadonlyArray<unknown>;
    critique_summary?: string;
    found_contradiction?: boolean;
    no_contradiction_reason?: string;
}

function GateDecisionsBlock({ decisions }: { decisions: unknown }): JSX.Element | null {
    if (!decisions || typeof decisions !== "object") return null;
    const g = decisions as GateShape;
    const failures = Array.isArray(g.failures) ? g.failures : [];
    return (
        <div class="bf-work__block">
            <p class="bf-work__label">{t("Quality gate")}</p>
            <p class="bf-work__gate-status">
                {g.passes ? "Passed" : "Failed"}
                {failures.length > 0 && ` (${failures.length} failures: ${failures.join(", ")})`}
            </p>
            {g.critique_summary && (
                <>
                    <p class="bf-work__call-sublabel">{t("Critique summary")}</p>
                    <p class="bf-work__gate-summary">{g.critique_summary}</p>
                </>
            )}
            {typeof g.found_contradiction === "boolean" && !g.found_contradiction && (
                <p class="bf-work__gate-summary">
                    The LLM declined to challenge: {g.no_contradiction_reason ?? "no reason given"}
                </p>
            )}
        </div>
    );
}
