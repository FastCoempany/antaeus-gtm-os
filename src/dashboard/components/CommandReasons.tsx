import type { JSX } from "preact";

interface Props {
    readonly reasons: ReadonlyArray<string>;
}

/**
 * CommandReasons — comma-separated reasons rail.
 *
 * Per canon §4.2 (Command Chamber): "explanation compressed into tight
 * reasons." Cap at 4, no full sentences — single-clause justifications
 * the operator can scan in one beat.
 */
export function CommandReasons({ reasons }: Props): JSX.Element | null {
    if (!reasons.length) return null;
    return (
        <ul class="db-reasons" aria-label="Reasons">
            {reasons.slice(0, 4).map((r, i) => (
                <li key={i} class="db-reasons__item">
                    {r}
                </li>
            ))}
        </ul>
    );
}
