import { beforeEach, describe, expect, it, vi } from "vitest";
import { signal } from "@preact/signals";
import { startUnsavedGuard } from "./unsaved-guard";

describe("startUnsavedGuard", () => {
    const handlers = new Map<string, EventListener[]>();
    const fakeWindow = {
        addEventListener: vi.fn((type: string, fn: EventListener) => {
            const list = handlers.get(type) ?? [];
            list.push(fn);
            handlers.set(type, list);
        }),
        removeEventListener: vi.fn((type: string, fn: EventListener) => {
            const list = handlers.get(type) ?? [];
            handlers.set(
                type,
                list.filter((h) => h !== fn)
            );
        })
    };

    beforeEach(() => {
        handlers.clear();
        fakeWindow.addEventListener.mockClear();
        fakeWindow.removeEventListener.mockClear();
    });

    it("does NOT bind beforeunload while clean", () => {
        const dirty = signal(false);
        const stop = startUnsavedGuard(dirty, "Test", { bindTo: fakeWindow });
        expect(fakeWindow.addEventListener).not.toHaveBeenCalled();
        stop();
    });

    it("binds beforeunload when dirty flips true", () => {
        const dirty = signal(false);
        const stop = startUnsavedGuard(dirty, "Test", { bindTo: fakeWindow });
        dirty.value = true;
        expect(fakeWindow.addEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function)
        );
        stop();
    });

    it("unbinds when dirty flips back to false", () => {
        const dirty = signal(true);
        const stop = startUnsavedGuard(dirty, "Test", { bindTo: fakeWindow });
        dirty.value = false;
        expect(fakeWindow.removeEventListener).toHaveBeenCalledWith(
            "beforeunload",
            expect.any(Function)
        );
        stop();
    });

    it("handler sets returnValue + returns message when dirty", () => {
        const dirty = signal(true);
        const stop = startUnsavedGuard(dirty, "Negotiation", {
            bindTo: fakeWindow
        });
        const handler = handlers.get("beforeunload")?.[0];
        expect(handler).toBeDefined();
        const event = { returnValue: "" } as unknown as Event;
        const result = handler!(event);
        expect((event as unknown as { returnValue: string }).returnValue).toContain(
            "unsaved"
        );
        expect(result).toContain("Negotiation");
        stop();
    });

    it("handler does NOTHING when not dirty (defensive)", () => {
        const dirty = signal(true);
        const stop = startUnsavedGuard(dirty, "Test", { bindTo: fakeWindow });
        const handler = handlers.get("beforeunload")?.[0];
        dirty.value = false;
        const event = { returnValue: "" } as unknown as Event;
        // After flip-to-clean, the listener is unbound — but if a stray
        // event fires through a previously-bound handler, the dirty
        // check inside the handler short-circuits.
        const result = handler!(event);
        expect(result).toBeUndefined();
        stop();
    });

    it("stop() removes the listener cleanly", () => {
        const dirty = signal(true);
        const stop = startUnsavedGuard(dirty, "Test", { bindTo: fakeWindow });
        stop();
        expect(fakeWindow.removeEventListener).toHaveBeenCalled();
    });
});
