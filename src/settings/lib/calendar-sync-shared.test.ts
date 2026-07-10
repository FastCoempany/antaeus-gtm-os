import { describe, it, expect } from "vitest";
import {
    unfoldIcs,
    parseIcs,
    occurrencesInWindow,
    matchedMeetingsFromIcs
} from "../../../supabase/functions/calendar-sync/_shared";

const ICS = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:evt-1",
    "SUMMARY:Discovery — Northwind",
    "DTSTART:20260708T150000Z",
    "DTEND:20260708T154500Z",
    "ORGANIZER:mailto:me@vectyr.ai",
    "ATTENDEE;CN=Sarah:mailto:sarah@northwind.com",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "UID:evt-2",
    "SUMMARY:Dentist",
    "DTSTART:20260709T090000Z",
    "END:VEVENT",
    "END:VCALENDAR"
].join("\r\n");

const NOW = new Date("2026-07-10T12:00:00Z");
const ACCOUNTS = [{ name: "Northwind Robotics", domain: "northwind.com" }];

describe("ics parsing", () => {
    it("unfolds folded lines", () => {
        expect(unfoldIcs("SUMMARY:Long\r\n  tail")).toEqual(["SUMMARY:Long tail"]);
    });

    it("parses events with attendees + organizer", () => {
        const evs = parseIcs(ICS);
        expect(evs).toHaveLength(2);
        expect(evs[0]).toMatchObject({
            uid: "evt-1",
            title: "Discovery — Northwind",
            startsAt: "2026-07-08T15:00:00.000Z",
            organizer: "me@vectyr.ai"
        });
        expect(evs[0]!.attendees).toEqual(["sarah@northwind.com"]);
    });

    it("all-day dates anchor at noon UTC", () => {
        const evs = parseIcs("BEGIN:VEVENT\nUID:d\nDTSTART;VALUE=DATE:20260712\nEND:VEVENT");
        expect(evs[0]!.startsAt).toBe("2026-07-12T12:00:00.000Z");
    });
});

describe("occurrencesInWindow", () => {
    const win: [Date, Date] = [new Date("2026-07-03T00:00:00Z"), new Date("2026-07-24T00:00:00Z")];

    it("single events pass through only when in-window", () => {
        const ev = parseIcs(ICS)[0]!;
        expect(occurrencesInWindow(ev, ...win)).toEqual(["2026-07-08T15:00:00.000Z"]);
        expect(occurrencesInWindow(ev, new Date("2026-08-01T00:00:00Z"), new Date("2026-08-10T00:00:00Z"))).toEqual([]);
    });

    it("expands a weekly standing call inside the window", () => {
        const evs = parseIcs(
            "BEGIN:VEVENT\nUID:w\nDTSTART:20260701T160000Z\nRRULE:FREQ=WEEKLY\nATTENDEE:mailto:x@northwind.com\nEND:VEVENT"
        );
        const occ = occurrencesInWindow(evs[0]!, ...win);
        expect(occ).toEqual([
            "2026-07-08T16:00:00.000Z",
            "2026-07-15T16:00:00.000Z",
            "2026-07-22T16:00:00.000Z"
        ]);
    });

    it("honors COUNT on recurring rules", () => {
        const evs = parseIcs(
            "BEGIN:VEVENT\nUID:c\nDTSTART:20260701T160000Z\nRRULE:FREQ=WEEKLY;COUNT=2\nEND:VEVENT"
        );
        expect(occurrencesInWindow(evs[0]!, ...win)).toEqual(["2026-07-08T16:00:00.000Z"]);
    });
});

describe("matchedMeetingsFromIcs", () => {
    it("keeps only meetings with a watched-account attendee", () => {
        const meetings = matchedMeetingsFromIcs(ICS, ACCOUNTS, NOW);
        expect(meetings).toHaveLength(1);
        expect(meetings[0]).toMatchObject({
            icsUid: "evt-1",
            accountName: "Northwind Robotics"
        });
    });

    it("stores nothing from an unmatched calendar", () => {
        expect(matchedMeetingsFromIcs(ICS, [{ name: "Elsewhere", domain: "elsewhere.io" }], NOW)).toEqual([]);
    });
});
