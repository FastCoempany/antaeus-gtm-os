import { beforeEach, describe, expect, it } from "vitest";
import {
    __clearMigrationFlagForTests,
    flashCloudSyncToast,
    notifyBootResult
} from "./cloud-sync-notify";

interface DummyElement {
    id?: string;
    _id?: string;
    style: { cssText: string };
    setAttribute(name: string, value: string): void;
    appendChild(child: DummyElement): DummyElement;
    removeChild(child: DummyElement): DummyElement;
    parentNode: DummyElement | null;
    children: DummyElement[];
    textContent: string;
    offsetHeight: number;
}

function makeEl(tag: string): DummyElement {
    const el: DummyElement = {
        style: { cssText: "" },
        children: [],
        textContent: "",
        parentNode: null,
        offsetHeight: 1,
        setAttribute() {
            // ignored
        },
        appendChild(child) {
            this.children.push(child);
            child.parentNode = this;
            return child;
        },
        removeChild(child) {
            const idx = this.children.indexOf(child);
            if (idx >= 0) {
                this.children.splice(idx, 1);
            }
            child.parentNode = null;
            return child;
        }
    };
    void tag;
    return el;
}

function makeDoc(): {
    doc: {
        getElementById(id: string): DummyElement | null;
        createElement<K extends keyof HTMLElementTagNameMap>(
            tag: K
        ): HTMLElementTagNameMap[K];
        body: DummyElement;
    };
    body: DummyElement;
    nodes: Map<string, DummyElement>;
} {
    const body = makeEl("body");
    const nodes = new Map<string, DummyElement>();
    return {
        body,
        nodes,
        doc: {
            getElementById(id) {
                return nodes.get(id) ?? null;
            },
            createElement(tag) {
                const el = makeEl(String(tag));
                if (!el.id) {
                    Object.defineProperty(el, "id", {
                        get() {
                            return el._id ?? "";
                        },
                        set(v: string) {
                            el._id = v;
                            if (v) nodes.set(v, el);
                        },
                        configurable: true
                    });
                }
                return el as unknown as HTMLElementTagNameMap[typeof tag];
            },
            body
        }
    };
}

class StorageStub {
    private map = new Map<string, string>();
    getItem(key: string): string | null {
        return this.map.get(key) ?? null;
    }
    setItem(key: string, value: string): void {
        this.map.set(key, value);
    }
    removeItem(key: string): void {
        this.map.delete(key);
    }
}

class WinStub {
    private timers: Array<() => void> = [];
    setTimeout(handler: () => void, _ms: number): number {
        this.timers.push(handler);
        return this.timers.length;
    }
    runAll(): void {
        // Run a snapshot so chained timers (toast fade-out -> remove) finish.
        let i = 0;
        while (i < this.timers.length) {
            this.timers[i]?.();
            i++;
        }
    }
}

describe("flashCloudSyncToast", () => {
    it("creates the container + a toast on first call", () => {
        const { doc, body } = makeDoc();
        const win = new WinStub();
        flashCloudSyncToast(
            { tone: "good", message: "Hello" },
            { doc: doc as never, win: win as never, storage: null }
        );
        expect(body.children).toHaveLength(1);
        const container = body.children[0]!;
        expect(container.children).toHaveLength(1);
        expect(container.children[0]!.textContent).toBe("Hello");
    });

    it("reuses the container across multiple toasts", () => {
        const { doc, body } = makeDoc();
        const win = new WinStub();
        flashCloudSyncToast(
            { tone: "good", message: "A" },
            { doc: doc as never, win: win as never, storage: null }
        );
        flashCloudSyncToast(
            { tone: "warn", message: "B" },
            { doc: doc as never, win: win as never, storage: null }
        );
        expect(body.children).toHaveLength(1);
        expect(body.children[0]!.children).toHaveLength(2);
    });
});

describe("notifyBootResult", () => {
    let docHandle: ReturnType<typeof makeDoc>;
    let storage: StorageStub;
    let win: WinStub;

    beforeEach(() => {
        docHandle = makeDoc();
        storage = new StorageStub();
        win = new WinStub();
    });

    it("returns null + no toast on mode='cloud'", () => {
        const result = notifyBootResult(
            { room: "icp" },
            { mode: "cloud" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        expect(result).toBeNull();
        expect(docHandle.body.children).toHaveLength(0);
    });

    it("returns null + no toast on mode='empty'", () => {
        const result = notifyBootResult(
            { room: "icp" },
            { mode: "empty" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        expect(result).toBeNull();
        expect(docHandle.body.children).toHaveLength(0);
    });

    it("flashes a 'migrated' toast on first sync; suppresses on subsequent boots", () => {
        const r1 = notifyBootResult(
            { room: "icp", rowCount: 3 },
            { mode: "migrated" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        expect(r1).toBe("migrated");
        const container = docHandle.body.children[0]!;
        expect(container.children[0]!.textContent).toContain("3 rows");

        // Second boot: same flag exists.
        const r2 = notifyBootResult(
            { room: "icp", rowCount: 3 },
            { mode: "migrated" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        expect(r2).toBeNull();
        // Container still has only the original 1 toast.
        expect(container.children).toHaveLength(1);
    });

    it("singular 'row' copy when rowCount=1", () => {
        notifyBootResult(
            { room: "test", rowCount: 1 },
            { mode: "migrated" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        const container = docHandle.body.children[0]!;
        expect(container.children[0]!.textContent).toContain("1 row");
        expect(container.children[0]!.textContent).not.toContain("1 rows");
    });

    it("flashes a 'local-only' toast every boot (no flag dedupe)", () => {
        notifyBootResult(
            { room: "icp" },
            { mode: "local-only" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        notifyBootResult(
            { room: "icp" },
            { mode: "local-only" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        const container = docHandle.body.children[0]!;
        expect(container.children).toHaveLength(2);
    });

    it("__clearMigrationFlagForTests resets the dedupe flag", () => {
        notifyBootResult(
            { room: "icp" },
            { mode: "migrated" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        __clearMigrationFlagForTests("icp", storage as never);
        const r = notifyBootResult(
            { room: "icp" },
            { mode: "migrated" },
            {
                doc: docHandle.doc as never,
                storage: storage as never,
                win: win as never
            }
        );
        expect(r).toBe("migrated");
    });
});
