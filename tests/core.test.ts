import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCampusDateTime, toCampusInput } from "../src/lib/dates";
import { coverage, currentWeek, hasCalendar, weekForDate, weekStart, termSlug, compareTermsDesc, instructorList, instructorNames } from "../src/lib/terms";
import { toEmbed } from "../src/lib/embed";
import { resourceState, canDownloadPublicly, isNew } from "../src/lib/access";

test("campus time parsing handles PDT and PST", () => {
  assert.equal(parseCampusDateTime("2026-10-08T23:59")!.toISOString(), "2026-10-09T06:59:00.000Z"); // PDT, UTC-7
  assert.equal(parseCampusDateTime("2026-11-12T23:59")!.toISOString(), "2026-11-13T07:59:00.000Z"); // PST, UTC-8
  assert.equal(toCampusInput(parseCampusDateTime("2026-11-12T23:59")), "2026-11-12T23:59");
  assert.equal(parseCampusDateTime(""), null);
});

test("week math", () => {
  const t = { startDate: parseCampusDateTime("2026-09-28")!, numWeeks: 10 };
  assert.equal(currentWeek(t, parseCampusDateTime("2026-11-10T12:00")!), 7);
  assert.equal(currentWeek(t, parseCampusDateTime("2026-09-01")!), 0);
  assert.equal(weekForDate(t, parseCampusDateTime("2026-12-08")!), 11); // finals week
  assert.equal(weekForDate(t, parseCampusDateTime("2027-01-20")!), null);
});

test("terms with no calendar have no current week or week dates", () => {
  const t = { startDate: null, numWeeks: 10 };
  assert.equal(hasCalendar(t), false);
  assert.equal(currentWeek(t, parseCampusDateTime("2025-10-15")!), 0);
  assert.equal(weekForDate(t, parseCampusDateTime("2025-10-15")!), null);
  assert.equal(weekStart(t, 3), null);
  assert.equal(hasCalendar({ startDate: parseCampusDateTime("2026-09-28")! }), true);
});

test("coverage by campus day", () => {
  const now = parseCampusDateTime("2026-11-10T20:00")!; // after 4pm PT = next UTC day
  assert.equal(coverage(parseCampusDateTime("2026-11-05")!, now), "covered");
  assert.equal(coverage(parseCampusDateTime("2026-11-10")!, now), "today");
  assert.equal(coverage(parseCampusDateTime("2026-11-12")!, now), "upcoming");
});

test("terms sort newest first and slugs", () => {
  assert.equal(termSlug("FALL", 2026), "fall-2026");
  const sorted = [{ quarter: "SPRING", year: 2026 }, { quarter: "FALL", year: 2026 }, { quarter: "WINTER", year: 2027 }].sort(compareTermsDesc);
  assert.deepEqual(sorted.map((t) => termSlug(t.quarter, t.year)), ["winter-2027", "fall-2026", "spring-2026"]);
  assert.deepEqual(instructorNames("Prof. Achuta Kadambi | | Instructor\nJim | j@x | Teaching Assistant"), ["Prof. Achuta Kadambi"]);
  assert.deepEqual(instructorList("Prof. A | | Instructor | https://x.edu/a\nProf. B | | Instructor | javascript:alert(1)"), [
    { name: "Prof. A", url: "https://x.edu/a" },
    { name: "Prof. B", url: "" },
  ]);
});

test("embeds", () => {
  assert.deepEqual(toEmbed("https://youtu.be/abcdefghijk"), { kind: "iframe", src: "https://www.youtube-nocookie.com/embed/abcdefghijk", provider: "YouTube" });
  assert.equal(toEmbed("https://www.youtube.com/watch?v=abcdefghijk")?.kind, "iframe");
  assert.equal(toEmbed("https://bruinlearn.ucla.edu/courses/1/external_tools/2")?.kind, "link");
  assert.equal(toEmbed("not a url"), null);
});

test("access rules", () => {
  const now = new Date("2026-11-10T00:00:00Z");
  const base = { id: "r1", url: "", filePath: "f.pdf", access: "PUBLIC", releaseAt: null as Date | null };
  assert.equal(resourceState(base, { staff: false, now }).state, "available");
  assert.equal(resourceState({ ...base, access: "STAFF" }, { staff: false, now }).state, "hidden");
  assert.equal(resourceState({ ...base, access: "STAFF" }, { staff: true, now }).state, "available");
  assert.equal(resourceState({ ...base, releaseAt: new Date("2026-11-20") }, { staff: false, now }).state, "scheduled");
  const bl = resourceState({ ...base, access: "BRUIN_LEARN", url: "https://bruinlearn.ucla.edu/x" }, { staff: false, now });
  assert.equal(bl.state === "available" && bl.href, "https://bruinlearn.ucla.edu/x"); // never the uploaded copy
  assert.equal(canDownloadPublicly({ ...base, access: "BRUIN_LEARN" }, { status: "PUBLISHED" }, { status: "ACTIVE" }, now), false);
  assert.equal(canDownloadPublicly(base, { status: "DRAFT" }, { status: "ACTIVE" }, now), false);
  assert.equal(canDownloadPublicly(base, { status: "PUBLISHED" }, { status: "DRAFT" }, now), false);
  assert.equal(canDownloadPublicly(base, { status: "PUBLISHED" }, { status: "ARCHIVED" }, now), true);
  assert.equal(isNew(new Date(now.getTime() - 86_400_000), now), true);
  assert.equal(isNew(new Date(now.getTime() - 10 * 86_400_000), now), false);
});
