import { DAY_MS, addDays } from "./dates";
import { COURSE_TIMEZONE, QUARTER_LABEL, QUARTER_ORDER, type Quarter } from "./constants";

export type TermLike = {
  slug: string;
  quarter: string;
  year: number;
  startDate: Date;
  numWeeks: number;
  status: string;
  isCurrent: boolean;
};

export function termName(t: { quarter: string; year: number }): string {
  return `${QUARTER_LABEL[t.quarter as Quarter] ?? t.quarter} ${t.year}`;
}

export function termSlug(quarter: string, year: number): string {
  return `${quarter.toLowerCase()}-${year}`;
}

/** Newest first. */
export function compareTermsDesc(a: { quarter: string; year: number }, b: { quarter: string; year: number }) {
  if (a.year !== b.year) return b.year - a.year;
  return (QUARTER_ORDER[b.quarter as Quarter] ?? 0) - (QUARTER_ORDER[a.quarter as Quarter] ?? 0);
}

/** Total number of weeks shown in the timeline, including finals week. */
export function totalWeeks(t: Pick<TermLike, "numWeeks">) {
  return t.numWeeks + 1;
}

export function weekLabel(week: number | null | undefined, numWeeks: number): string {
  if (!week) return "Unscheduled";
  if (week === numWeeks + 1) return "Finals week";
  return `Week ${week}`;
}

/** Monday of the given week. */
export function weekStart(t: Pick<TermLike, "startDate">, week: number): Date {
  return addDays(t.startDate, (week - 1) * 7);
}

/**
 * Which week of the term `now` falls in. Returns 0 before the term starts and
 * numWeeks + 2 after finals week ends.
 */
export function currentWeek(t: Pick<TermLike, "startDate" | "numWeeks">, now = new Date()): number {
  const diff = now.getTime() - t.startDate.getTime();
  if (diff < 0) return 0;
  const w = Math.floor(diff / (7 * DAY_MS)) + 1;
  return Math.min(w, t.numWeeks + 2);
}

/** Infer the week number for a date within a term (null if outside). */
export function weekForDate(t: Pick<TermLike, "startDate" | "numWeeks">, d: Date | null | undefined): number | null {
  if (!d) return null;
  const w = currentWeek(t, d);
  if (w < 1 || w > t.numWeeks + 1) return null;
  return w;
}

export function parseInstructors(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, email = "", role = ""] = line.split("|").map((s) => s.trim());
      return { name, email, role };
    });
}

export function instructorNames(text: string): string[] {
  return parseInstructors(text)
    .filter((s) => /instructor|professor|lecturer/i.test(s.role))
    .map((s) => s.name);
}

export function parseQuickLinks(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url = ""] = line.split("|").map((s) => s.trim());
      return { label, url };
    })
    .filter((l) => /^https?:\/\//.test(l.url));
}

/** Has this scheduled class happened yet? Compared by campus calendar day. */
export type Coverage = "covered" | "today" | "upcoming" | "unscheduled";
export function coverage(date: Date | null | undefined, now = new Date()): Coverage {
  if (!date) return "unscheduled";
  const day = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: COURSE_TIMEZONE }).format(x);
  const a = day(date);
  const b = day(now);
  return a < b ? "covered" : a === b ? "today" : "upcoming";
}
