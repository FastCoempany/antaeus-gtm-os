import { describe, expect, it } from "vitest";
import { kindForCode, labelForKind, loadWeather } from "./weather";

function fetchReturning(payload: unknown) {
    const calls: string[] = [];
    const fetchLike = (url: string) => {
        calls.push(url);
        return Promise.resolve({ json: () => Promise.resolve(payload) });
    };
    return { fetchLike, calls };
}

const GOOD = {
    current: { temperature_2m: 78.4, weather_code: 0, is_day: 1 },
    daily: {
        time: ["2026-07-13", "2026-07-14", "2026-07-15"],
        weather_code: [0, 63, 3],
        temperature_2m_max: [81.2, 79.1, 84.4],
        temperature_2m_min: [66.3, 64.0, 68.2]
    }
};

describe("kindForCode", () => {
    it("maps the WMO ranges to the six kinds", () => {
        expect(kindForCode(0)).toBe("sun");
        expect(kindForCode(1)).toBe("sun");
        expect(kindForCode(3)).toBe("cloud");
        expect(kindForCode(45)).toBe("fog");
        expect(kindForCode(61)).toBe("rain");
        expect(kindForCode(81)).toBe("rain");
        expect(kindForCode(73)).toBe("snow");
        expect(kindForCode(86)).toBe("snow");
        expect(kindForCode(95)).toBe("storm");
    });

    it("labels read as plain words", () => {
        expect(labelForKind("sun")).toBe("Clear");
        expect(labelForKind("storm")).toBe("Storms");
    });
});

describe("loadWeather", () => {
    it("parses the current read + the 7-day strip", async () => {
        const { fetchLike, calls } = fetchReturning(GOOD);
        const read = await loadWeather({ fetchLike, coords: null });
        expect(read).not.toBeNull();
        expect(read!.current.tempF).toBe(78);
        expect(read!.current.kind).toBe("sun");
        expect(read!.current.label).toBe("Clear");
        expect(read!.current.isDay).toBe(true);
        expect(read!.current.place).toBe("Chicago");
        expect(read!.days).toHaveLength(3);
        expect(read!.days[0]).toEqual({ day: "Today", kind: "sun", hiF: 81, loF: 66 });
        expect(read!.days[1]!.kind).toBe("rain");
        expect(calls[0]).toContain("temperature_unit=fahrenheit");
        expect(calls[0]).toContain("forecast_days=7");
        expect(calls[0]).toContain("latitude=41.8781");
    });

    it("uses injected coords when given", async () => {
        const { fetchLike, calls } = fetchReturning(GOOD);
        const read = await loadWeather({
            fetchLike,
            coords: { latitude: 40.71, longitude: -74.01, place: "New York" }
        });
        expect(read!.current.place).toBe("New York");
        expect(calls[0]).toContain("latitude=40.71");
    });

    it("returns null quietly on a malformed payload", async () => {
        const { fetchLike } = fetchReturning({ nothing: true });
        expect(await loadWeather({ fetchLike, coords: null })).toBeNull();
    });

    it("returns null quietly when the fetch throws", async () => {
        const fetchLike = () => Promise.reject(new Error("offline"));
        expect(await loadWeather({ fetchLike, coords: null })).toBeNull();
    });

    it("skips malformed day rows instead of dropping the read", async () => {
        const { fetchLike } = fetchReturning({
            current: { temperature_2m: 60, weather_code: 3, is_day: 0 },
            daily: {
                time: ["2026-07-13", "2026-07-14"],
                weather_code: [3, null],
                temperature_2m_max: [70, 72],
                temperature_2m_min: [55, 57]
            }
        });
        const read = await loadWeather({ fetchLike, coords: null });
        expect(read!.current.isDay).toBe(false);
        expect(read!.days).toHaveLength(1);
    });
});
