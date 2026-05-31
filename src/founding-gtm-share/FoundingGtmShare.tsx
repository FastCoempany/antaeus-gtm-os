import type { JSX } from "preact";
import { SectionFrame } from "../founding-gtm/components/SectionFrame";
import { SECTION_IDS } from "../founding-gtm/lib/types";
import { snapshotSignal, statusSignal } from "./state";

/**
 * Read-mode render of a Founding GTM share snapshot.
 *
 * The seven sections render from the SectionFrame component the live
 * room already uses — same authored prose, same surprise callouts,
 * same status badges. The difference is structural:
 *
 *   - Topbar is replaced with a "Shared kit" banner that names what
 *     the recipient is looking at (no operator-side controls).
 *   - No HandoffStrip, no SharePanel, no ceremony overlay — all of
 *     those are operator surfaces.
 *   - Footer line names this as a shared snapshot dated to its
 *     creation moment so the recipient knows it isn't live.
 */
export function FoundingGtmShare(): JSX.Element {
    const status = statusSignal.value;

    if (status === "missing-token") {
        return (
            <ErrorState
                kicker="SHARED KIT"
                title="No share token in the URL"
                body="This link is missing the token that points at a shared kit. If someone sent you this URL, ask them to resend the full link."
            />
        );
    }

    if (status === "not-found") {
        return (
            <ErrorState
                kicker="SHARED KIT"
                title="This link isn't active"
                body="Either the link has been revoked, the URL is mistyped, or the kit has been removed. Ask the sender to issue a fresh link."
            />
        );
    }

    if (status === "loading") {
        return (
            <div class="fg-shell fg-share-mode">
                <p class="fg-share-mode__loading">Loading the shared kit…</p>
            </div>
        );
    }

    const snapshot = snapshotSignal.value;
    if (!snapshot) {
        return (
            <ErrorState
                kicker="SHARED KIT"
                title="The snapshot couldn't be loaded"
                body="Something went wrong loading this kit. Refresh the page or ask the sender to issue a fresh link."
            />
        );
    }

    const ready = snapshot.sections.filter((s) => s.status === "ready").length;
    const partial = snapshot.sections.filter((s) => s.status === "partial").length;

    return (
        <div class="fg-shell fg-share-mode">
            <header class="fg-share-mode__banner">
                <p class="fg-share-mode__kicker">SHARED GTM KIT · READ-ONLY</p>
                <h1 class="fg-share-mode__title">
                    {snapshot.workspaceName || "A workspace"} shared their
                    Founding GTM kit
                </h1>
                <p class="fg-share-mode__lede">
                    Seven authored sections — what the operator built up about
                    who their motion serves, what worked, what didn't, and what
                    the first hire should run on day one.
                </p>
                <p class="fg-share-mode__meta">
                    Snapshot from {formatIso(snapshot.snapshotIso)}
                    {snapshot.verdictLabel
                        ? ` · workspace was at "${snapshot.verdictLabel}" when shared`
                        : ""}
                    {" · "}
                    {ready} of {snapshot.sections.length} sections ready
                    {partial > 0 ? `, ${partial} partial` : ""}
                </p>
            </header>
            <main class="fg-stack">
                {SECTION_IDS.map((id) => {
                    const section =
                        snapshot.sections.find((s) => s.id === id) ?? null;
                    return <SectionFrame id={id} section={section} key={id} />;
                })}
            </main>
            <footer class="fg-share-mode__footer">
                <p>
                    This page is a frozen snapshot. The sender can refresh it
                    or revoke this link at any time.
                </p>
            </footer>
        </div>
    );
}

function ErrorState(props: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
}): JSX.Element {
    return (
        <div class="fg-shell fg-share-mode">
            <div class="fg-share-mode__error">
                <p class="fg-share-mode__kicker">{props.kicker}</p>
                <h1 class="fg-share-mode__title">{props.title}</h1>
                <p class="fg-share-mode__lede">{props.body}</p>
            </div>
        </div>
    );
}

function formatIso(iso: string): string {
    if (!iso) return "an earlier date";
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    } catch {
        return iso;
    }
}
