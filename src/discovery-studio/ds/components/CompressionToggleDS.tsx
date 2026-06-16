import type { JSX } from "preact";
import { SegmentedControl } from "@/components";
import { t } from "@/lib/voice/t";
import { compressionMode, setCompressionMode, type CompressionMode } from "../../state";
import { COMPRESSION_OPTIONS } from "../lib/adapters";

/**
 * CompressionToggleDS — the compression-mode control on the library
 * SegmentedControl. One of the seven required on-call surfaces (canon
 * §4.12): a visible toggle so the operator can compress the spine
 * mid-call (Off → Essentials → Emergency). The filtering itself lives in
 * the reused SegmentRail, which reads compressionMode unchanged.
 */
export function CompressionToggleDS(): JSX.Element {
    return (
        <div class="dsd-field">
            <span class="dsd-field__label">{t("Compression")}</span>
            <SegmentedControl<CompressionMode>
                label={t("Compression mode")}
                active={compressionMode.value}
                onChange={setCompressionMode}
                options={COMPRESSION_OPTIONS}
            />
        </div>
    );
}
