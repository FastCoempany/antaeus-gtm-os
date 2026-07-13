/**
 * The Briefing's ambient weather (locked design 2026-07-02) — the sky
 * band's live read + the 7-day forecast, via keyless Open-Meteo (the
 * same provider the Outdoors Events get-there rail uses).
 *
 * Location: if the browser already granted geolocation we use it
 * quietly; otherwise Chicago — the app's operating timezone (canon
 * 2026-06-01) and the locked mockup's home. We never PROMPT for
 * location from an ambient surface.
 *
 * Defensive throughout: any failure returns null and the band renders
 * as the plain greeting — weather is a mood, never a dependency.
 */

export type WeatherKind = "sun" | "cloud" | "rain" | "snow" | "storm" | "fog";

export interface CurrentWeather {
    readonly tempF: number;
    readonly kind: WeatherKind;
    readonly label: string;
    readonly isDay: boolean;
    readonly place: string;
}

export interface DayForecast {
    readonly day: string;
    readonly kind: WeatherKind;
    readonly hiF: number;
    readonly loF: number;
}

export interface WeatherRead {
    readonly current: CurrentWeather;
    readonly days: ReadonlyArray<DayForecast>;
}

const CHICAGO = { latitude: 41.8781, longitude: -87.6298, place: "Chicago" };

/** WMO weather codes → the six kinds the band can draw. */
export function kindForCode(code: number): WeatherKind {
    if (code >= 95) return "storm";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if (code === 45 || code === 48) return "fog";
    if (code >= 2) return "cloud";
    return "sun";
}

const KIND_LABEL: Record<WeatherKind, string> = {
    sun: "Clear",
    cloud: "Cloudy",
    rain: "Rain",
    snow: "Snow",
    storm: "Storms",
    fog: "Fog"
};

export function labelForKind(kind: WeatherKind): string {
    return KIND_LABEL[kind];
}

interface FetchLike {
    (url: string): Promise<{ json(): Promise<unknown> }>;
}

interface Coords {
    readonly latitude: number;
    readonly longitude: number;
    readonly place: string;
}

/** The browser's location — only if permission is ALREADY granted. */
async function quietCoords(): Promise<Coords | null> {
    try {
        if (
            typeof navigator === "undefined" ||
            !navigator.permissions ||
            !navigator.geolocation
        ) {
            return null;
        }
        const perm = await navigator.permissions.query({ name: "geolocation" });
        if (perm.state !== "granted") return null;
        return await new Promise<Coords | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) =>
                    resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        place: ""
                    }),
                () => resolve(null),
                { maximumAge: 30 * 60_000, timeout: 4_000 }
            );
        });
    } catch {
        return null;
    }
}

function dayName(iso: string, index: number): string {
    if (index === 0) return "Today";
    try {
        return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
            weekday: "short"
        });
    } catch {
        return iso.slice(5);
    }
}

export async function loadWeather(opts: {
    readonly fetchLike?: FetchLike;
    readonly coords?: Coords | null;
} = {}): Promise<WeatherRead | null> {
    try {
        const doFetch: FetchLike =
            opts.fetchLike ?? ((url) => fetch(url) as Promise<{ json(): Promise<unknown> }>);
        const coords =
            opts.coords !== undefined
                ? opts.coords ?? CHICAGO
                : (await quietCoords()) ?? CHICAGO;
        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}` +
            `&current=temperature_2m,weather_code,is_day` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
            `&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`;
        const raw = (await (await doFetch(url)).json()) as {
            current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
            daily?: {
                time?: string[];
                weather_code?: number[];
                temperature_2m_max?: number[];
                temperature_2m_min?: number[];
            };
        };
        const cur = raw.current;
        if (!cur || typeof cur.temperature_2m !== "number" || typeof cur.weather_code !== "number") {
            return null;
        }
        const kind = kindForCode(cur.weather_code);
        const days: DayForecast[] = [];
        const d = raw.daily;
        if (d?.time && d.weather_code && d.temperature_2m_max && d.temperature_2m_min) {
            for (let i = 0; i < Math.min(7, d.time.length); i++) {
                const code = d.weather_code[i];
                const hi = d.temperature_2m_max[i];
                const lo = d.temperature_2m_min[i];
                if (typeof code !== "number" || typeof hi !== "number" || typeof lo !== "number") {
                    continue;
                }
                days.push({
                    day: dayName(d.time[i]!, i),
                    kind: kindForCode(code),
                    hiF: Math.round(hi),
                    loF: Math.round(lo)
                });
            }
        }
        return {
            current: {
                tempF: Math.round(cur.temperature_2m),
                kind,
                label: labelForKind(kind),
                isDay: cur.is_day !== 0,
                place: coords.place
            },
            days
        };
    } catch {
        return null;
    }
}
