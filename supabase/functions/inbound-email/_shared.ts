/**
 * Inbound email capture — pure helpers (vitest-importable).
 *
 * Stage 1 of the auto-capture path (the capture + priors plan,
 * founder-corrected 2026-07-09): the operator BCCs outreach to their
 * per-workspace capture address; the provider (Postmark-shaped
 * webhook) posts it here; we match the real recipient to a watched
 * account and log an outbound touch the rooms already read.
 *
 * Nothing here stores message bodies — the touch carries the subject
 * line, the recipient, and the timestamp. Capture is a tally of the
 * motion, not an archive of the mail.
 */

export interface InboundAddress {
    readonly email: string;
    readonly name?: string;
}

/** Postmark inbound webhook, reduced to the fields we read. */
export interface InboundPayload {
    readonly From?: string;
    readonly FromFull?: InboundAddress;
    readonly To?: string;
    readonly ToFull?: ReadonlyArray<InboundAddress>;
    readonly Cc?: string;
    readonly CcFull?: ReadonlyArray<InboundAddress>;
    readonly Bcc?: string;
    readonly BccFull?: ReadonlyArray<InboundAddress>;
    /**
     * A BCC'd capture address is usually NOT in the To/Cc headers —
     * Postmark exposes the actual delivery address here, and the
     * `+hash` part separately as MailboxHash. These are the primary
     * signal for the BCC path.
     */
    readonly OriginalRecipient?: string;
    readonly MailboxHash?: string;
    readonly Subject?: string;
    readonly Date?: string;
}

export interface ParsedInbound {
    readonly from: string;
    /** Every recipient address except the capture address itself. */
    readonly recipients: ReadonlyArray<string>;
    readonly captureToken: string | null;
    readonly subject: string;
    readonly sentAt: string;
}

function splitAddressList(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw
        .split(",")
        .map((part) => {
            const m = part.match(/<([^>]+)>/);
            return (m ? m[1] : part).trim().toLowerCase();
        })
        .filter((a) => a.includes("@"));
}

function fullList(full: ReadonlyArray<InboundAddress> | undefined, raw: string | undefined): string[] {
    const fromFull = (full ?? [])
        .map((a) => (a.email || "").trim().toLowerCase())
        .filter((a) => a.includes("@"));
    return fromFull.length > 0 ? fromFull : splitAddressList(raw);
}

/**
 * The capture address is `<localPart>+<token>@<any domain>` — the
 * token is what routes to a workspace, so the mail domain can change
 * without re-issuing addresses.
 */
export function extractCaptureToken(
    addresses: ReadonlyArray<string>,
    localPart = "log"
): string | null {
    const rx = new RegExp(`^${localPart}\\+([a-z0-9]{8,64})@`, "i");
    for (const a of addresses) {
        const m = a.match(rx);
        if (m) return m[1]!.toLowerCase();
    }
    return null;
}

export function parseInbound(payload: InboundPayload, localPart = "log"): ParsedInbound {
    const all = [
        ...fullList(payload.ToFull, payload.To),
        ...fullList(payload.CcFull, payload.Cc),
        ...fullList(payload.BccFull, payload.Bcc)
    ];
    // BCC path first: MailboxHash IS the token for log+<token>@ mail;
    // OriginalRecipient carries the full delivery address. The header
    // lists are the fallback (To/Cc'd capture address).
    const hash = (payload.MailboxHash ?? "").trim().toLowerCase();
    const captureToken =
        (/^[a-z0-9]{8,64}$/.test(hash) ? hash : null) ??
        extractCaptureToken(
            payload.OriginalRecipient ? [payload.OriginalRecipient.trim().toLowerCase()] : [],
            localPart
        ) ??
        extractCaptureToken(all, localPart);
    const captureRx = new RegExp(`^${localPart}\\+`, "i");
    const recipients = [...new Set(all.filter((a) => !captureRx.test(a)))];
    const from = fullList(
        payload.FromFull ? [payload.FromFull] : undefined,
        payload.From
    )[0] ?? "";
    const sentAtRaw = payload.Date ? Date.parse(payload.Date) : NaN;
    return {
        from,
        recipients,
        captureToken,
        subject: (payload.Subject ?? "").slice(0, 200).trim(),
        sentAt: Number.isFinite(sentAtRaw)
            ? new Date(sentAtRaw).toISOString()
            : new Date().toISOString()
    };
}

export interface WatchedAccount {
    readonly name: string;
    readonly domain?: string | null;
}

function rootDomain(host: string): string {
    const parts = host.toLowerCase().split(".").filter(Boolean);
    return parts.slice(-2).join(".");
}

/**
 * Match the mail's recipients to a watched account: an exact domain
 * match wins; otherwise a recipient domain whose root contains the
 * account's name (spaces stripped) counts. Returns the matched
 * account name, or null.
 */
export function matchAccount(
    recipients: ReadonlyArray<string>,
    accounts: ReadonlyArray<WatchedAccount>
): string | null {
    const domains = recipients
        .map((a) => a.split("@")[1] ?? "")
        .filter(Boolean)
        .map((d) => d.toLowerCase());
    if (domains.length === 0) return null;

    for (const acc of accounts) {
        const accDomain = (acc.domain ?? "").toLowerCase().replace(/^www\./, "");
        if (!accDomain) continue;
        for (const d of domains) {
            if (d === accDomain || rootDomain(d) === rootDomain(accDomain)) {
                return acc.name;
            }
        }
    }
    for (const acc of accounts) {
        const squashed = acc.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (squashed.length < 4) continue;
        for (const d of domains) {
            if (rootDomain(d).replace(/[^a-z0-9]/g, "").includes(squashed)) {
                return acc.name;
            }
        }
    }
    return null;
}

/**
 * The `sequences.data` blob for a captured touch — the same shape
 * Outbound Studio writes (outbound-bridge extractDataBlob), so the
 * room, the pace read, and the temperature ladder pick it up with no
 * new reader. `content` is the subject line only, never the body.
 */
export function buildTouchBlob(args: {
    accountName: string;
    recipient: string;
    subject: string;
    sentAt: string;
}): Record<string, unknown> {
    return {
        account: null,
        accountName: args.accountName,
        contactName: args.recipient,
        contactTitle: "",
        persona: null,
        temperature: null,
        channel: "email",
        trigger: null,
        ctaType: null,
        assetUsed: null,
        content: args.subject || "(captured send)",
        outcome: null,
        outcomeDate: null,
        dealId: null,
        qualityScore: null,
        motionBand: null,
        capturedVia: "bcc",
        createdAt: args.sentAt
    };
}
