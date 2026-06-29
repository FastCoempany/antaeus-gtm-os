/**
 * ICP real-choosing (ADR-019, slice 2). The app doesn't hand the operator
 * a finished ICP — it makes them choose. A few pointed forks, each a real
 * decision (which role signs? how big, really? what makes them need you
 * now?), and the sharp definition is ASSEMBLED from their picks. Authorship,
 * not magic (Earned Depth #5).
 *
 * The forks are deterministic (no runtime LLM, per ADR-008). A later
 * version can make the options category-aware; v1 is a universal spine.
 */

export interface IcpOption {
    /** What the operator sees on the chip. */
    readonly label: string;
    /** The fragment that goes into the assembled sentence. */
    readonly value: string;
}

export interface IcpFork {
    readonly id: string;
    readonly question: string;
    readonly options: ReadonlyArray<IcpOption>;
}

export const ICP_FORKS: ReadonlyArray<IcpFork> = [
    {
        id: "signer",
        question: "Which role actually signs the check?",
        options: [
            { label: "Revenue Operations", value: "Heads of Revenue Operations" },
            { label: "Sales Operations", value: "Heads of Sales Operations" },
            { label: "The COO", value: "COOs" },
            { label: "The CFO", value: "CFOs" }
        ]
    },
    {
        id: "size",
        question: "How big, really? Pick the band you actually win in.",
        options: [
            { label: "50–200 people", value: "50–200-person" },
            { label: "200–800 people", value: "200–800-person" },
            { label: "800–2,000 people", value: "800–2,000-person" },
            { label: "2,000+ people", value: "2,000-plus-person" }
        ]
    },
    {
        id: "trigger",
        question: "What has to be true for them to need you now?",
        options: [
            { label: "Just raised, scaling fast", value: "are past a recent raise and scaling fast" },
            { label: "A new GTM leader landed", value: "just brought in a new GTM leader" },
            { label: "Outgrew their spreadsheets", value: "have outgrown their spreadsheets" },
            { label: "Hit a compliance wall", value: "just hit a compliance or audit wall" }
        ]
    }
];

/**
 * Assemble the sharp ICP statement from the operator's picks (one per
 * fork, in order). Reads like a sentence they'd say, built from what
 * they chose — never invented.
 */
export function assembleIcp(picks: ReadonlyArray<string>): string {
    if (picks.length < ICP_FORKS.length) return "";
    const [who, size, trigger] = picks;
    return `${who} at ${size} B2B companies that ${trigger}.`;
}
