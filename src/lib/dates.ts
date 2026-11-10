import { COURSE_TIMEZONE } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

function fmt(d: Date, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone: COURSE_TIMEZONE, ...opts }).format(d);
}

/** "Tue, Oct 6" */
export function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return fmt(d, { weekday: "short", month: "short", day: "numeric" });
}

/** "Oct 6, 2026" */
export function formatLongDate(d: Date | null | undefined): string {
  if (!d) return "";
  return fmt(d, { month: "short", day: "numeric", year: "numeric" });
}

/** "Tue, Oct 6, 11:59 PM" */
export function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "";
  return fmt(d, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** ISO date string (YYYY-MM-DD) for machine-readable <time> elements. */
export function isoDate(d: Date): string {
  return d.toISOString();
}

/** Offset (ms) between UTC and campus time at the given instant. */
function tzOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COURSE_TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * Parse a `<input type="datetime-local">` or `<input type="date">` value as
 * campus (Los Angeles) time. Returns null for empty input.
 */
export function parseCampusDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00"] = m;
  const naiveUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  // Two passes handle the DST boundary correctly.
  let guess = naiveUtc - tzOffsetMs(new Date(naiveUtc));
  guess = naiveUtc - tzOffsetMs(new Date(guess));
  return new Date(guess);
}

/** Format a Date for a datetime-local input, in campus time. */
export function toCampusInput(d: Date | null | undefined, withTime = true): string {
  if (!d) return "";
  const local = new Date(d.getTime() + tzOffsetMs(d));
  const iso = local.toISOString();
  return withTime ? iso.slice(0, 16) : iso.slice(0, 10);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export { DAY_MS };
