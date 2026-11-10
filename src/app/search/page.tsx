import Link from "next/link";
import { SiteShell, PageHeader, EmptyState } from "@/components/SiteShell";
import { ItemCard } from "@/components/ItemCard";
import { getCurrentTerm, getTerm, listTerms, searchItems, viewer } from "@/lib/queries";
import { ITEM_KIND_PLURAL, ITEM_KINDS, RESOURCE_TYPE_LABEL, RESOURCE_TYPES } from "@/lib/constants";
import { termName, weekLabel } from "@/lib/terms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

type SP = { q?: string; term?: string; week?: string; type?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const current = await getCurrentTerm();
  const filters = {
    q: (sp.q ?? "").slice(0, 200),
    term: sp.term ?? current?.slug ?? "all",
    week: sp.week && /^\d+$/.test(sp.week) ? sp.week : "",
    type: sp.type ?? "",
  };
  const shellTerm = (filters.term !== "all" && (await getTerm(filters.term))) || current;
  const [terms, { isStaff }] = await Promise.all([listTerms(), viewer()]);
  const searched = !!(filters.q || filters.week || filters.type || sp.term);
  const results = searched ? await searchItems(filters) : [];
  const maxWeeks = Math.max(10, ...terms.map((t) => t.numWeeks)) + 1;
  const numWeeksOf = (termId: string) => terms.find((t) => t.id === termId)?.numWeeks ?? 10;

  return (
    <SiteShell term={shellTerm}>
      <PageHeader title="Search course materials">Search by title, topic, or keyword, and narrow results by term, week, and type.</PageHeader>

      <form action="/search" className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="q" className="label">
            Keywords
          </label>
          <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="e.g. convolution, Laplace, Bode plot" className="input" />
        </div>
        <div>
          <label htmlFor="term" className="label">
            Term
          </label>
          <select id="term" name="term" defaultValue={filters.term} className="input">
            <option value="all">All terms</option>
            {terms.map((t) => (
              <option key={t.id} value={t.slug}>
                {termName(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="week" className="label">
            Week
          </label>
          <select id="week" name="week" defaultValue={filters.week} className="input">
            <option value="">Any week</option>
            {Array.from({ length: maxWeeks }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {weekLabel(n, maxWeeks - 1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="label">
            Type
          </label>
          <select id="type" name="type" defaultValue={filters.type} className="input">
            <option value="">Any type</option>
            <optgroup label="Section">
              {ITEM_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ITEM_KIND_PLURAL[k]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Has resource">
              <option value="RECORDING">Recordings</option>
              {RESOURCE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {RESOURCE_TYPE_LABEL[r]}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <button type="submit" className="btn-primary h-[38px]">
          Search
        </button>
      </form>

      {!searched ? (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Popular topics</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {["convolution", "LTI systems", "Fourier series", "Fourier transform", "Laplace transform", "sampling", "Bode plot", "filters", "impulse response"].map((t) => (
              <li key={t}>
                <Link href={`/search?q=${encodeURIComponent(t)}&term=all`} className="rounded-full bg-ucla-lighterblue px-3 py-1.5 text-sm font-medium text-ucla-darkestblue hover:bg-ucla-lightblue">
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <section aria-live="polite" aria-labelledby="results-h">
          <h2 id="results-h" className="mb-3 text-sm font-semibold text-slate-600">
            {results.length} result{results.length === 1 ? "" : "s"}
            {filters.q && (
              <>
                {" "}
                for &ldquo;<span className="text-slate-900">{filters.q}</span>&rdquo;
              </>
            )}
          </h2>
          {results.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {results.map((i) => (
                <ItemCard
                  key={i.id}
                  item={i}
                  termSlug={i.term.slug}
                  numWeeks={numWeeksOf(i.termId)}
                  staff={isStaff}
                  showKind
                  showWeek
                  termLabel={filters.term === "all" ? termName(i.term) : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No matching materials">
              Try fewer keywords, or search <Link className="underline" href={`/search?q=${encodeURIComponent(filters.q)}&term=all`}>all terms</Link>.
            </EmptyState>
          )}
        </section>
      )}
    </SiteShell>
  );
}
