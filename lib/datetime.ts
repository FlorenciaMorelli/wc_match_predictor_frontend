// Match kickoff helpers. The API gives the date ("2026-06-15") and a UTC time;
// these convert to the viewer's local timezone for display and day-grouping.
//
// The backend currently sends the UTC time in inconsistent shapes — "20:00",
// a bare hour "20", or with seconds/"Z" ("20:00:00Z"). normalizeUtcTime()
// absorbs all of those, so a malformed value never silently collapses a match
// to midnight (which would show the wrong time AND file it under the wrong day).
//
// Safe to format in local time without hydration concerns: the fixture is
// fetched client-side (see fixture-section.tsx), so match times never appear in
// the server-rendered HTML.

/**
 * Normalizes a UTC kickoff time to "HH:MM", or null if there's no usable time.
 * Accepts "20", "20:00", "20:00:00", and a trailing "Z" — anything else is null.
 */
export function normalizeUtcTime(timeUtc: string): string | null {
  if (!timeUtc) return null;
  const m = timeUtc.trim().match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?Z?$/i);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Builds a UTC Date from the API's date + time fields. Returns null if invalid. */
export function matchKickoff(date: string, timeUtc: string): Date | null {
  if (!date) return null;
  const time = normalizeUtcTime(timeUtc) ?? "00:00";
  const d = new Date(`${date}T${time}:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "17:00" — kickoff time in the viewer's local timezone (24h). "" if unknown. */
export function formatLocalTime(
  date: string,
  timeUtc: string,
  locale: string
): string {
  if (!normalizeUtcTime(timeUtc)) return "";
  const d = matchKickoff(date, timeUtc);
  if (!d) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** "GMT-3" / "ART" — short name of the viewer's local timezone at kickoff. */
export function localTimeZoneName(date: string, locale: string, timeUtc = "12:00"): string {
  // Resolve the zone name at the actual kickoff instant when we have one, so it
  // stays correct across DST boundaries; fall back to local noon otherwise.
  const d = matchKickoff(date, normalizeUtcTime(timeUtc) ? timeUtc : "12:00");
  if (!d) return "";
  const parts = new Intl.DateTimeFormat(locale, {
    timeZoneName: "short",
    hour: "2-digit",
  }).formatToParts(d);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

/**
 * "2026-06-14" — the viewer's local calendar date for a given kickoff.
 * Falls back to the API's date when the time is absent/unparseable (so grouping
 * stays stable instead of jumping to a midnight-UTC day).
 */
export function localDateString(date: string, timeUtc: string): string {
  const d = matchKickoff(date, timeUtc);
  if (!d || !normalizeUtcTime(timeUtc)) return date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
