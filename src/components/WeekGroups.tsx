import type { Term, Week } from "@prisma/client";
import type { ItemWithResources } from "@/lib/queries";
import { weekLabel, weekStart } from "@/lib/terms";
import { formatDate } from "@/lib/dates";
import { ItemCard } from "./ItemCard";

/** Items grouped under "Week N · topic" headings, in timeline order. */
export function WeekGroups({
  items,
  term,
  weeks,
  staff,
  showKind = false,
  emptyWeeks = false,
}: {
  items: ItemWithResources[];
  term: Term;
  weeks: Week[];
  staff: boolean;
  showKind?: boolean;
  emptyWeeks?: boolean;
}) {
  const groups = new Map<number, ItemWithResources[]>();
  for (const it of items) {
    const k = it.week ?? 0;
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }
  const keys = emptyWeeks
    ? Array.from({ length: term.numWeeks + 1 }, (_, i) => i + 1).concat(groups.has(0) ? [0] : [])
    : [...groups.keys()].sort((a, b) => (a || 99) - (b || 99));

  return (
    <div className="space-y-8">
      {keys.map((k) => {
        const list = groups.get(k) ?? [];
        const topic = weeks.find((w) => w.number === k)?.topic;
        return (
          <section key={k} id={`week-${k}`} aria-labelledby={`wk-${k}-h`} className="scroll-mt-24">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-200 pb-2">
              <h2 id={`wk-${k}-h`} className="text-lg font-bold text-ucla-darkestblue">
                {weekLabel(k, term.numWeeks)}
              </h2>
              {topic && <span className="text-slate-600">{topic}</span>}
              {k > 0 && <span className="ml-auto text-xs text-slate-500">Week of {formatDate(weekStart(term, k))}</span>}
            </div>
            {list.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((i) => (
                  <ItemCard key={i.id} item={i} termSlug={term.slug} numWeeks={term.numWeeks} staff={staff} showKind={showKind} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nothing scheduled.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
