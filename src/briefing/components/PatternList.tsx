import type { JSX } from "preact";
import { patterns, patternsLoaded } from "../state";
import { PatternCard } from "./PatternCard";
import { EmptyState } from "./EmptyState";

/**
 * PatternList — the room body once the pipeline has produced Patterns.
 *
 * Three states: loading (the read is in flight), empty (no Patterns for
 * the latest run — falls back to the directional empty state), and the
 * list itself. Reads the signals bootPatterns() populates.
 */
export function PatternList(): JSX.Element {
    if (!patternsLoaded.value) {
        return (
            <section class="bf-loading" aria-busy="true">
                <p class="bf-loading__label">Reading the week…</p>
            </section>
        );
    }

    const list = patterns.value;
    if (list.length === 0) {
        return <EmptyState />;
    }

    return (
        <section class="bf-patterns" aria-label="This week's reads">
            <p class="bf-patterns__count">
                {list.length} read{list.length === 1 ? "" : "s"} this week
            </p>
            {list.map((p) => (
                <PatternCard pattern={p} key={p.id} />
            ))}
        </section>
    );
}
