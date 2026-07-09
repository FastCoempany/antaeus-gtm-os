/**
 * The get-there layer (canon §4.22, 2026-07-07 founder-directed):
 * outbound decision-links + a weather glance ONLY. The room hands off
 * to the real sites and never stores an itinerary — it helps the
 * operator decide and depart, it does not track the trip.
 */

export interface WeatherGlance {
    /** °C for the event's start date (or today when undated). */
    readonly tempC: number;
    /** "sun" | "cloud" | "rain" — drives the glyph. */
    readonly kind: "sun" | "cloud" | "rain";
}

const cache = new Map<string, WeatherGlance | null>();

function kindForCode(code: number): WeatherGlance["kind"] {
    if (code >= 51) return "rain";
    if (code >= 1) return "cloud";
    return "sun";
}

/**
 * Best-effort weather for a place + date via the keyless Open-Meteo
 * pair (geocoding + forecast). Returns null quietly on any failure or
 * when the date is beyond the 16-day forecast window.
 */
export async function weatherFor(
    place: string,
    dateIso: string | null
): Promise<WeatherGlance | null> {
    const where = place.trim();
    if (!where) return null;
    const key = `${where.toLowerCase()}|${dateIso ?? ""}`;
    if (cache.has(key)) return cache.get(key) ?? null;
    try {
        const geo = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(where)}&count=1`
        ).then((r) => r.json() as Promise<{ results?: Array<{ latitude: number; longitude: number }> }>);
        const hit = geo.results?.[0];
        if (!hit) {
            cache.set(key, null);
            return null;
        }
        const today = new Date();
        const target = dateIso ? new Date(dateIso) : today;
        const daysOut = Math.round((target.getTime() - today.getTime()) / 86_400_000);
        if (daysOut < 0 || daysOut > 15) {
            cache.set(key, null);
            return null;
        }
        const day = target.toISOString().slice(0, 10);
        const fc = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&daily=weather_code,temperature_2m_max&start_date=${day}&end_date=${day}&timezone=auto`
        ).then((r) => r.json() as Promise<{ daily?: { weather_code?: number[]; temperature_2m_max?: number[] } }>);
        const code = fc.daily?.weather_code?.[0];
        const temp = fc.daily?.temperature_2m_max?.[0];
        if (typeof code !== "number" || typeof temp !== "number") {
            cache.set(key, null);
            return null;
        }
        const glance: WeatherGlance = { tempC: Math.round(temp), kind: kindForCode(code) };
        cache.set(key, glance);
        return glance;
    } catch {
        cache.set(key, null);
        return null;
    }
}

/** Google Flights search for the city + dates — an outbound link only. */
export function flightsHref(place: string, startIso: string | null): string {
    const q = `flights to ${place}${startIso ? ` on ${startIso.slice(0, 10)}` : ""}`;
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}

/** Hotel search near the venue — an outbound link only. */
export function hotelsHref(place: string, startIso: string | null): string {
    const q = `hotels in ${place}${startIso ? ` ${startIso.slice(0, 10)}` : ""}`;
    return `https://www.google.com/travel/hotels?q=${encodeURIComponent(q)}`;
}

/** Build a downloadable .ics for the event — add to calendar, nothing stored. */
export function calendarIcs(name: string, startIso: string | null, endIso: string | null, place: string | null): string {
    const fmt = (iso: string): string => iso.slice(0, 10).replace(/-/g, "");
    const start = startIso ? fmt(startIso) : fmt(new Date().toISOString());
    const endSrc = endIso ?? startIso;
    // DTEND is exclusive for all-day events — add a day.
    const endDate = endSrc ? new Date(endSrc) : new Date();
    endDate.setDate(endDate.getDate() + 1);
    const end = fmt(endDate.toISOString());
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Antaeus//Outdoors Events//EN",
        "BEGIN:VEVENT",
        `SUMMARY:${name.replace(/[\n,;]/g, " ")}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        ...(place ? [`LOCATION:${place.replace(/[\n,;]/g, " ")}`] : []),
        "END:VEVENT",
        "END:VCALENDAR"
    ];
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
