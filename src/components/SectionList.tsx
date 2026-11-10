import Link from "next/link";
import { hasRecording } from "@/lib/access";
import { notFound } from "next/navigation";
import { getItems, getTerm, getWeeks, viewer } from "@/lib/queries";
import { termName } from "@/lib/terms";
import { WeekGroups } from "./WeekGroups";
import { EmptyState, PageHeader } from "./SiteShell";

type Filter = { key: string; label: string; test: (i: Awaited<ReturnType<typeof getItems>>[number]) => boolean };

const FILTERS: Filter[] = [
  { key: "all", label: "All", test: () => true },
  { key: "recorded", label: "Has recording", test: (i) => hasRecording(i) },
  { key: "missing", label: "Recording pending / missing", test: (i) => !hasRecording(i) },
];

/** Lecture and discussion library pages. */
export async function SectionList({
  params,
  searchParams,
  kind,
  title,
  intro,
}: {
  params: Promise<{ term: string }>;
  searchParams: Promise<{ show?: string }>;
  kind: "LECTURE" | "DISCUSSION";
  title: string;
  intro: string;
}) {
  const [{ term: slug }, sp] = await Promise.all([params, searchParams]);
  const term = await getTerm(slug);
  if (!term) notFound();
  const [items, weeks, { isStaff }] = await Promise.all([getItems(term.id, [kind]), getWeeks(term.id), viewer()]);
  const active = FILTERS.find((f) => f.key === sp.show) ?? FILTERS[0];
  const shown = items.filter(active.test);
  const path = `/${term.slug}/${kind === "LECTURE" ? "lectures" : "discussions"}`;
  const recorded = items.filter(FILTERS[1].test).length;

  return (
    <>
      <PageHeader eyebrow={termName(term)} title={title}>
        <p>{intro}</p>
        <p className="mt-1 text-sm text-slate-500">
          {items.length} posted · {recorded} with recordings
        </p>
      </PageHeader>
      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? path : `${path}?show=${f.key}`}
            aria-current={f.key === active.key ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
              f.key === active.key ? "bg-ucla-darkestblue text-white ring-ucla-darkestblue" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <Link href={`/search?term=${term.slug}&type=${kind}`} className="ml-auto text-sm font-medium text-ucla-blue hover:underline">
          Advanced search →
        </Link>
      </div>
      {shown.length ? (
        <WeekGroups items={shown} term={term} weeks={weeks} staff={isStaff} />
      ) : (
        <EmptyState title={items.length ? "Nothing matches this filter" : `No ${title.toLowerCase()} posted yet`}>
          {items.length ? "Try another filter." : "Materials will appear here as course staff upload them."}
        </EmptyState>
      )}
    </>
  );
}
