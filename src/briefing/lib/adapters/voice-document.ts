import type {
    VoiceDocumentState,
    VoiceDocumentStateBody
} from "../contracts";
import { uninitializedContract } from "./shell-helpers";

/**
 * Voice Document adapter (B.0c shell).
 *
 * Future data source: the canonical Voice Document lives at
 * `deliverables/specs/briefing/signal_console_voice_document_v0.1.md`
 * — markdown, hand-authored, version-controlled. The synthesis
 * stage (B.2) loads it at run time, parses it into the contract
 * shape (banned vocabulary, structural rules, exemplars, hedging
 * rules), and embeds it in every Draft / Critique / Revise prompt.
 *
 * The markdown → contract parser lands in B.2 alongside synthesis.
 * B.0c just declares the contract.
 *
 * If the operator ever gets a UI to author their own voice
 * preferences (canon §4.21 leaves this open), the adapter would
 * read from that surface in addition to the canonical markdown.
 */
export function getVoiceDocumentState(): VoiceDocumentState {
    return uninitializedContract<VoiceDocumentStateBody>(
        "Voice Document adapter shell — B.0c. Markdown parser lands in B.2 alongside synthesis."
    );
}
