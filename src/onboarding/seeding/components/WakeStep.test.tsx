import { cleanup, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ enrich: vi.fn(), next: vi.fn() }));
vi.mock("../lib/enrichment", () => ({ enrichAccounts: mocks.enrich }));
vi.mock("../draft", () => ({ draft: { value: { accountNames: ["Acme"], icpStatement: "Sales teams" } } }));
vi.mock("../state", () => ({ nextStep: mocks.next }));
import { draft } from "../draft";
import { WakeStep, startEnrichment, __resetWakeForTests } from "./WakeStep";

beforeEach(() => {
    __resetWakeForTests();
    mocks.enrich.mockReset();
    draft.value = { ...draft.value, icpStatement: "Sales teams" };
    mocks.enrich.mockResolvedValue({ unavailable: true, accounts: [{ name: "Acme", signal: "Account research unavailable", heat: 0, cold: true }], reads: [] });
});
afterEach(() => { cleanup(); __resetWakeForTests(); });

describe("Account research interaction", () => {
    it("lets setup continue after an unavailable result without showing a fabricated priority", async () => {
        render(<WakeStep />);
        await waitFor(() => expect(screen.getByText("Account research unavailable")).toBeTruthy());
        expect((screen.getByRole("button", { name: "Continue setup →" }) as HTMLButtonElement).disabled).toBe(false);
        expect(screen.queryByText(/Priority 0/)).toBeNull();
        expect(screen.queryByRole("link", { name: "Review source" })).toBeNull();
        expect(screen.getByText(/We couldn't research these accounts right now/)).toBeTruthy();
    });
    it("retries research for the same list when Try again is clicked", async () => {
        render(<WakeStep />);
        const retry = await screen.findByRole("button", { name: "Try again" });
        expect(mocks.enrich).toHaveBeenCalledTimes(1);
        retry.click();
        await waitFor(() => expect(mocks.enrich).toHaveBeenCalledTimes(2));
    });
    it("researches again when the ICP changes for the same account names", async () => {
        startEnrichment();
        await waitFor(() => expect(mocks.enrich).toHaveBeenCalledTimes(1));
        await Promise.resolve();
        await Promise.resolve();
        draft.value = { ...draft.value, icpStatement: "Finance teams" };
        startEnrichment();
        expect(mocks.enrich).toHaveBeenLastCalledWith(["Acme"], "Finance teams");
        expect(mocks.enrich).toHaveBeenCalledTimes(2);
    });
});
