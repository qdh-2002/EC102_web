import Link from "next/link";
import { notFound } from "next/navigation";
import { getItems, getTerm, getWeeks, viewer } from "@/lib/queries";
import { coverage, termName, weekLabel } from "@/lib/terms";
import { formatDate } from "@/lib/dates";
import { itemHref } from "@/lib/links";
import { ITEM_KIND_LABEL, type ItemKind } from "@/lib/constants";
import { WeekGroups } from "@/components/WeekGroups";
import { PageHeader } from "@/components/SiteShell";
import { CoverageBadge } from "@/components/badges";

export const metadata = { title: "Course calendar" };

export default async function SchedulePage({ params, searchParams }: { params: Promise<{ term: string }>; searchParams: Promise<{ view?: string }> }) {
  const [{ term: slug }, sp] = await Promise.all([params, searchParams]);
  const term = await getTerm(slug);
  if (!term) notFound();
  const [items, weeks, { isStaff }] = await Promise.all([getItems(term.id), getWeeks(term.id), viewer()]);
  const view = sp.view === "materials" ? "materials" : "calendar";
  const lectures = items.filter((i) => i.kind === "LECTURE" && i.date);
  const covered = lectures.filter((i) => coverage(i.date) !== "upcoming").length;
  const pct = lectures.length ? Math.round((covered / lectures.length) * 100) : 0;
  const nextLecture = lectures.find((i) => coverage(i.date) !== "covered");

  // Calendar rows: every dated class, homework release/due date and exam, in date order.
  type Row = { key: string; date: Date; label: string; sub: string; href: string; kind: string; state: string; week: number | null };
  const rows: Row[] = [];
  for (const i of items) {
    const prefix = i.number != null ? `${ITEM_KIND_LABEL[i.kind as ItemKind]} ${i.number}` : ITEM_KIND_LABEL[i.kind as ItemKind];
    const href = itemHref(term.slug, i);
    if (i.kind === "LECTURE" || i.kind === "DISCUSSION") {
      if (i.date) rows.push({ key: i.id, date: i.date, label: `${prefix}: ${i.title}`, sub: i.topics.split(",").slice(0, 3).join(", "), href, kind: i.kind, state: coverage(i.date), week: i.week });
    } else if (i.kind === "HOMEWORK") {
      if (i.date) rows.push({ key: i.id + "o", date: i.date, label: `HW${i.number ?? ""} released`, sub: i.title, href, kind: "HW", state: "", week: i.week });
      if (i.dueAt) rows.push({ key: i.id + "d", date: i.dueAt, label: `HW${i.number ?? ""} due`, sub: i.title, href, kind: "HW", state: "", week: null });
    } else if (i.date || i.dueAt) {
      rows.push({ key: i.id, date: (i.dueAt ?? i.date)!, label: i.title, sub: "", href, kind: i.kind, state: "", week: i.week });
    }
  }
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());

  const tab = (key: string, label: string) => (
    <Link
      href={key === "calendar" ? `/${term.slug}/schedule` : `/${term.slug}/schedule?view=${key}`}
      aria-current={view === key ? "page" : undefined}
      className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${view === key ? "bg-ucla-darkestblue text-white ring-ucla-darkestblue" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader eyebrow={termName(term)} title="Course calendar">
        This quarter&apos;s dates, and what we have already covered in class. Each lecture keeps one recording that is reused across years, so you can
        watch ahead or catch up any time.
      </PageHeader>

      {lectures.length > 0 && (
        <section aria-label="Progress" className="card mb-6 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-ucla-darkestblue">
              {covered} of {lectures.length} lectures covered
            </p>
            {nextLecture && (
              <p className="text-sm text-slate-600">
                Next:{" "}
                <Link href={itemHref(term.slug, nextLecture)} className="font-medium text-ucla-blue hover:underline">
                  Lecture {nextLecture.number}, {nextLecture.title}
                </Link>{" "}
                ({formatDate(nextLecture.date)})
              </p>
            )}
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Lectures covered">
            <div className="h-full rounded-full bg-gradient-to-r from-ucla-blue to-ucla-gold" style={{ width: `${pct}%` }} />
          </div>
        </section>
      )}

      <div className="mb-5 flex gap-2" role="group" aria-label="View">
        {tab("calendar", "Calendar")}
        {tab("materials", "Materials by week")}
      </div>

      {view === "calendar" ? (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Course calendar for {termName(term)}</caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="w-28 px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Class / event</th>
                <th scope="col" className="hidden w-36 px-4 py-3 sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, idx) => {
                const newWeek = r.week && (idx === 0 || rows.slice(0, idx).every((x) => x.week !== r.week));
                const muted = r.state === "covered";
                return [
                  newWeek ? (
                    <tr key={`w${r.week}`} id={`week-${r.week}`} className="scroll-mt-24 bg-ucla-lighterblue/60">
                      <th colSpan={3} scope="colgroup" className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-ucla-darkestblue">
                        {weekLabel(r.week, term.numWeeks)}
                        {weeks.find((w) => w.number === r.week)?.topic && <span className="ml-2 font-medium normal-case tracking-normal text-slate-600">{weeks.find((w) => w.number === r.week)?.topic}</span>}
                      </th>
                    </tr>
                  ) : null,
                  <tr key={r.key} className={r.state === "today" ? "bg-ucla-gold/15" : ""}>
                    <td className={`whitespace-nowrap px-4 py-2.5 ${muted ? "text-slate-500" : "text-slate-800"}`}>
                      <time dateTime={r.date.toISOString()}>{formatDate(r.date)}</time>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={r.href} className={`font-medium hover:text-ucla-blue hover:underline ${r.kind === "EXAM" ? "text-red-800" : r.kind === "HW" ? "text-indigo-900" : "text-slate-900"}`}>
                        {r.label}
                      </Link>
                      {r.sub && <span className="block text-xs text-slate-500">{r.sub}</span>}
                      <span className="sm:hidden">{r.state && <CoverageBadge state={r.state} />}</span>
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">{r.state && <CoverageBadge state={r.state} />}</td>
                  </tr>,
                ];
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <WeekGroups items={items} term={term} weeks={weeks} staff={isStaff} showKind emptyWeeks />
      )}
    </>
  );
}
