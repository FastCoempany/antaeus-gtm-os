import { useRef } from "preact/hooks";
import type { JSX } from "preact";
import {
    PRODUCT_CATEGORIES,
    type ProductCategory
} from "../lib/types";
import {
    backup,
    category,
    clearAll,
    demo,
    exitDemo,
    exportBackup,
    importBackupFromFile,
    isWorking,
    setCategory
} from "../state";

/**
 * SettingsCards — the four trust-annex cards.
 *
 * 1. Backup + restore (workspace-level): Export / Import / Clear
 * 2. Product category (workspace-level): single dropdown
 * 3. Demo mode (browser-only): Exit (the seed entry point lives
 *    elsewhere in the legacy demo-seed flow)
 * 4. Role + onboarding (account-level): link out to Onboarding
 *
 * Categorization labels are the canonical scope vocabulary from canon
 * §4.20: workspace-level, account-level, browser-only.
 */
export function SettingsCards(): JSX.Element {
    return (
        <div class="st-grid">
            <BackupCard />
            <CategoryCard />
            <DemoCard />
            <RoleCard />
        </div>
    );
}

function BackupCard(): JSX.Element {
    const fileRef = useRef<HTMLInputElement>(null);
    const b = backup.value;
    const working = isWorking.value;

    function handlePick(): void {
        fileRef.current?.click();
    }

    async function handleFile(e: Event): Promise<void> {
        const input = e.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        await importBackupFromFile(file);
        input.value = "";
    }

    function handleClear(): void {
        const ok =
            typeof window === "undefined"
                ? true
                : window.confirm(
                      "Clear every gtmos_* key on this device? Cloud sync will not be touched, but the local view will be empty until the next sync."
                  );
        if (ok) clearAll();
    }

    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">Workspace-level</span>
                <h2 class="st-card__title">Backup and restore</h2>
            </header>
            <p class="st-card__desc">
                Export every <code>gtmos_*</code> key on this device into a
                JSON backup file. Import to overwrite the local view from a
                previous backup. Clear empties the local cache only — cloud
                sync still owns durable workspace truth.
            </p>
            <ul class="st-status-list">
                <li>
                    <span>Keys captured</span>
                    <strong>{b.keyCount}</strong>
                </li>
                <li>
                    <span>Last export</span>
                    <strong>
                        {b.capturedAt
                            ? new Date(b.capturedAt).toLocaleString()
                            : "—"}
                    </strong>
                </li>
            </ul>
            <div class="st-card__actions">
                <button
                    type="button"
                    class="st-btn st-btn--primary"
                    onClick={() => exportBackup()}
                    disabled={working}
                >
                    Export backup
                </button>
                <button
                    type="button"
                    class="st-btn st-btn--ghost"
                    onClick={handlePick}
                    disabled={working}
                >
                    Import backup
                </button>
                <button
                    type="button"
                    class="st-btn st-btn--danger"
                    onClick={handleClear}
                    disabled={working}
                >
                    Clear local data
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    style="display:none"
                    onChange={handleFile}
                />
            </div>
            <p class="st-card__help">
                Export creates an offline recovery file. Import merges the
                backup over the current local cache (matching keys are
                replaced; non-<code>gtmos_*</code> keys are skipped). Clear
                removes every <code>gtmos_*</code> key from this device.
            </p>
        </article>
    );
}

function CategoryCard(): JSX.Element {
    const cur = category.value;
    function handleChange(e: Event): void {
        const v = (e.currentTarget as HTMLSelectElement).value as ProductCategory;
        setCategory(v);
    }
    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--workspace">Workspace-level</span>
                <h2 class="st-card__title">Product category</h2>
            </header>
            <p class="st-card__desc">
                Pick the category that matches what you sell. This drives
                which discovery framework appears in the live call navigator
                and which copy variants surface across rooms.
            </p>
            <select
                class="st-select"
                value={cur}
                onChange={handleChange}
                aria-label="Product category"
            >
                {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                        {c.label}
                    </option>
                ))}
            </select>
            <p class="st-card__help">
                Category is workspace-scoped because it shapes downstream
                discovery and call guidance — not just the local UI.
            </p>
        </article>
    );
}

function DemoCard(): JSX.Element {
    const d = demo.value;
    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--browser">Browser-only</span>
                <h2 class="st-card__title">Demo mode</h2>
            </header>
            <p class="st-card__desc">
                Demo mode loads a sample workspace into this browser only. It
                never overwrites your real cloud workspace. Use it to preview
                what a fully configured workspace looks like.
            </p>
            <ul class="st-status-list">
                <li>
                    <span>Status</span>
                    <strong class={d.active ? "is-warn" : "is-good"}>
                        {d.active ? "Active on this browser" : "Off"}
                    </strong>
                </li>
                {d.scenario ? (
                    <li>
                        <span>Scenario</span>
                        <strong>{d.scenario}</strong>
                    </li>
                ) : null}
                {d.seededAt ? (
                    <li>
                        <span>Seeded</span>
                        <strong>{new Date(d.seededAt).toLocaleString()}</strong>
                    </li>
                ) : null}
            </ul>
            <div class="st-card__actions">
                <a
                    class="st-btn st-btn--ghost"
                    href="/demo-seed.html?autoseed=mm&return=/dashboard/"
                >
                    Enter demo (mid-market)
                </a>
                <a
                    class="st-btn st-btn--ghost"
                    href="/demo-seed.html?autoseed=ent&return=/dashboard/"
                >
                    Enter demo (enterprise)
                </a>
                <button
                    type="button"
                    class="st-btn st-btn--danger"
                    onClick={() => exitDemo()}
                    disabled={!d.active}
                >
                    Exit demo
                </button>
            </div>
            <p class="st-card__help">
                Demo state lives in localStorage on this browser. Exiting
                clears the demo flags but does not touch the keys those flags
                refer to — use Backup → Clear if you want to wipe the local
                cache entirely.
            </p>
        </article>
    );
}

function RoleCard(): JSX.Element {
    return (
        <article class="st-card">
            <header class="st-card__head">
                <span class="st-scope st-scope--account">Account-level</span>
                <h2 class="st-card__title">Role + onboarding</h2>
            </header>
            <p class="st-card__desc">
                Changed roles or starting fresh? Re-run onboarding to
                reconfigure the workspace. Existing ICPs, deals, signals, and
                motions stay safe — onboarding only retunes the activation
                path.
            </p>
            <div class="st-card__actions">
                <a class="st-btn st-btn--ghost" href="/app/onboarding/">
                    Re-run onboarding
                </a>
                <a class="st-btn st-btn--ghost" href="/app/welcome/">
                    Visit Welcome
                </a>
            </div>
            <p class="st-card__help">
                Role setup belongs to your signed-in account and activation
                path. Re-running onboarding should retune the workspace
                without deleting workspace-scoped data.
            </p>
        </article>
    );
}
