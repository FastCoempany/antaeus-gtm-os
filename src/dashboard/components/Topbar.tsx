import type { JSX } from "preact";
import { BackButton } from "@/lib/back-button";
import { ModeSwitcher } from "./ModeSwitcher";
import { ReadinessAnchor } from "./ReadinessAnchor";
import {
    commandMode,
    commandSummary,
    openReadinessDrawer,
    readinessSummary
} from "../state";
import { exportCommandCenterJson } from "../lib/command-export";

/**
 * Topbar — kicker + title + mode switcher + readiness anchor.
 *
 * Per canon §4.2 (Command Chamber family): "the dashboard is where the
 * hallway dies." The topbar is the only navigation surface in this
 * room; everything else is the ranked work itself.
 *
 * The Readiness Anchor (canon §4.17) sits in the topbar at all times.
 * Verdict label + chevron, max 1 line. Click → opens overlay drawer.
 */
export function Topbar(): JSX.Element {
    const summary = readinessSummary.value;
    const cmd = commandSummary.value;
    const rankedCount = cmd.ranked.length;

    function handleExport(): void {
        exportCommandCenterJson(cmd, commandMode.value);
    }

    return (
        <header class="db-topbar">
            <BackButton />
            <div class="db-topbar__lead">
                <p class="db-topbar__kicker">DASHBOARD</p>
                <h1 class="db-topbar__title">What is under the most pressure right now.</h1>
                <p class="db-topbar__sub">
                    One ranked object. One dominant move. Three density modes —
                    same ranking, different surface.
                </p>
            </div>
            <div class="db-topbar__rail">
                <ReadinessAnchor
                    verdict={summary.verdict}
                    verdictLabel={summary.verdictLabel}
                    onOpen={openReadinessDrawer}
                />
                <ModeSwitcher />
                <button
                    type="button"
                    class="db-topbar__export"
                    onClick={handleExport}
                    disabled={rankedCount === 0}
                    title={
                        rankedCount === 0
                            ? "No ranked objects to export"
                            : `Export ${rankedCount} ranked object${
                                  rankedCount === 1 ? "" : "s"
                              } as JSON`
                    }
                >
                    Export snapshot
                </button>
            </div>
        </header>
    );
}
