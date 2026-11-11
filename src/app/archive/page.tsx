import Link from "next/link";
import { SiteShell, PageHeader, EmptyState } from "@/components/SiteShell";
import { getCurrentTerm, listTerms } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { instructorNames, termName } from "@/lib/terms";
import { formatLongDate } from "@/lib/dates";
import { IconArchive, IconChevronRight } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "All terms & archive" };

export default async function ArchivePage() {
  const [terms, current] = await Promise.all([listTerms(), getCurrentTerm()]);
  const counts = await prisma.item.groupBy({ by: ["termId", "kind"], where: { status: "PUBLISHED" }, _count: true });
  const count = (termId: string, kind: string) => counts.find((c) => c.termId === termId && c.kind === kind)?._count ?? 0;
  const byYear = new Map<string, typeof terms>();
  for (const t of terms) {
    // UCLA academic year runs Fall → Summer, e.g. Fall 2026 belongs to 2026–27.
    const ay = t.quarter === "FALL" ? t.year : t.year - 1;
    const key = `${ay}–${String(ay + 1).slice(2)}`;
    byYear.set(key, [...(byYear.get(key) ?? []), t]);
  }

  return (
    <SiteShell term={current}>
      <PageHeader title="All terms & archive">
        Materials from every offering of the course stay available here. Content and policies may differ between terms, so always check the current term first.
      </PageHeader>
      {terms.length === 0 && <EmptyState title="No terms yet" />}
      <div className="space-y-8">
        {[...byYear.entries()].map(([year, list]) => (
          <section key={year} aria-labelledby={`ay-${year}`}>
            <h2 id={`ay-${year}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Academic year {year}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((t) => (
                <li key={t.id}>
                  <Link href={t.isCurrent ? "/" : `/${t.slug}`} className="card group flex items-center gap-4 p-5 hover:border-ucla-blue hover:shadow-md">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-ucla-darkestblue">{termName(t)}</span>
                        {t.isCurrent && <span className="rounded-full bg-ucla-gold px-2 py-0.5 text-xs font-bold text-ucla-darkestblue">Current</span>}
                        {t.status === "ARCHIVED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            <IconArchive size={12} /> Archived
                          </span>
                        )}
                        {t.status === "DRAFT" && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">Draft</span>}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">
                        Taught by {instructorNames(t.instructors).join(", ") || "instructor TBA"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t.startDate ? `Starts ${formatLongDate(t.startDate)}` : "No calendar"} · {count(t.id, "LECTURE")} lectures
                      </p>
                    </div>
                    <IconChevronRight size={20} className="text-slate-400 group-hover:text-ucla-blue" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
