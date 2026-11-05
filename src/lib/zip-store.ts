/**
 * Minimal store-only ZIP writer (no compression, no dependencies).
 *
 * Used by Settings "Download my workspace" to bundle one CSV per part
 * of the workspace into a single file. CSVs are small and the browser
 * download is local, so skipping compression keeps this ~80 lines
 * instead of pulling in a zip library.
 *
 * Format: PKZIP APPNOTE local file headers + central directory + end
 * record. File names are UTF-8 (general-purpose flag bit 11).
 */

export interface ZipEntry {
    /** Path inside the archive, forward slashes. */
    readonly name: string;
    readonly data: string | Uint8Array;
}

let CRC_TABLE: Uint32Array | null = null;

function crcTable(): Uint32Array {
    if (CRC_TABLE) return CRC_TABLE;
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    CRC_TABLE = table;
    return table;
}

export function crc32(bytes: Uint8Array): number {
    const table = crcTable();
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        crc = (table[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8)) >>> 0;
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(d: Date): { time: number; date: number } {
    const year = Math.max(1980, d.getFullYear());
    return {
        time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
        date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
    };
}

export function createZip(entries: ReadonlyArray<ZipEntry>, now: Date = new Date()): Uint8Array {
    const enc = new TextEncoder();
    const { time, date } = dosDateTime(now);
    const locals: Uint8Array[] = [];
    const centrals: Uint8Array[] = [];
    let offset = 0;

    for (const e of entries) {
        const name = enc.encode(e.name);
        const data = typeof e.data === "string" ? enc.encode(e.data) : e.data;
        const crc = crc32(data);

        const local = new Uint8Array(30 + name.length + data.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true); // version needed
        lv.setUint16(6, 0x0800, true); // UTF-8 names
        lv.setUint16(8, 0, true); // stored
        lv.setUint16(10, time, true);
        lv.setUint16(12, date, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true);
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true);
        local.set(name, 30);
        local.set(data, 30 + name.length);
        locals.push(local);

        const central = new Uint8Array(46 + name.length);
        const cv = new DataView(central.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true); // version made by
        cv.setUint16(6, 20, true); // version needed
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, time, true);
        cv.setUint16(14, date, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, name.length, true);
        cv.setUint32(42, offset, true);
        central.set(name, 46);
        centrals.push(central);

        offset += local.length;
    }

    const centralSize = centrals.reduce((n, c) => n + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    const out = new Uint8Array(offset + centralSize + end.length);
    let p = 0;
    for (const part of [...locals, ...centrals, end]) {
        out.set(part, p);
        p += part.length;
    }
    return out;
}
