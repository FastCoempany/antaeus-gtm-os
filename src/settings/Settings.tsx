import type { JSX } from "preact";
import { Topbar } from "./components/Topbar";
import { SettingsCards } from "./components/SettingsCards";
import { Toast } from "./components/Toast";

import { Wordmark } from "@/lib/wordmark";
/**
 * Settings — Phase 4 / Room 15 root.
 *
 * Per canon §4.20 (Trust Annex family): calm, plainspoken utility.
 * No drama, no internal architecture language. Bright field.
 */
export function Settings(): JSX.Element {
    return (
        <div class="st-shell">
            <div class="ant-room-chrome">
                <Wordmark kicker="SETTINGS" />
            </div>
            <Topbar />
            <SettingsCards />
            <Toast />
        </div>
    );
}
