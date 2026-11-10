import Link from "next/link";
import { notFound } from "next/navigation";
import { getItems, getTerm, viewer } from "@/lib/queries";
import { termName } from "@/lib/terms";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState, PageHeader } from "@/components/SiteShell";
import { IconExternal, IconSigma } from "@/components/icons";

export const metadata = { title: "Homework & exams" };

export default async function AssignmentsPage({ params }: { params: Promise<{ term: string }> }) {
  const term = await getTerm((await params).term);
  if (!term) notFound();
  const [items, { isStaff }] = await Promise.all([getItems(term.id, ["HOMEWORK", "EXAM", "REVIEW"]), viewer()]);
  const homework = items.filter((i) => i.kind === "HOMEWORK").sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  const exams = items.filter((i) => i.kind === "EXAM");
  const review = items.filter((i) => i.kind === "REVIEW");
  const formulaSheets = items.flatMap((i) => i.resources.filter((r) => r.type === "FORMULA_SHEET" && (isStaff || r.access !== "STAFF")));

  const card = (i: (typeof items)[number]) => (
    <ItemCard key={i.id} item={i} termSlug={term.slug} numWeeks={term.numWeeks} staff={isStaff} showWeek />
  );

  return (
    <>
      <PageHeader eyebrow={termName(term)} title="Homework & exams">
        Problem sets, solutions, practice exams, review materials, and formula sheets. Solutions appear automatically after each due date.
      </PageHeader>

      <div className="mb-8 flex flex-col gap-3 rounded-xl border border-ucla-lightblue bg-ucla-lighterblue p-4 text-sm text-ucla-darkestblue sm:flex-row sm:items-center sm:justify-between">
        <p>
          <strong>Submitting work?</strong> Homework is submitted and graded on Bruin Learn. Grades and regrade requests are also handled there.
        </p>
        <a href={term.bruinLearnUrl} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0">
          Open Bruin Learn <IconExternal size={14} />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      <div className="space-y-10">
        <section aria-labelledby="hw">
          <h2 id="hw" className="mb-3 border-b border-slate-200 pb-2 text-lg font-bold text-ucla-darkestblue">
            Homework
          </h2>
          {homework.length ? <div className="grid gap-3 md:grid-cols-2">{homework.map(card)}</div> : <EmptyState title="No homework posted yet" />}
        </section>

        <section aria-labelledby="exams">
          <h2 id="exams" className="mb-3 border-b border-slate-200 pb-2 text-lg font-bold text-ucla-darkestblue">
            Exams
          </h2>
          {exams.length ? <div className="grid gap-3 md:grid-cols-2">{exams.map(card)}</div> : <EmptyState title="No exam information posted yet" />}
        </section>

        <section aria-labelledby="review">
          <h2 id="review" className="mb-3 border-b border-slate-200 pb-2 text-lg font-bold text-ucla-darkestblue">
            Review &amp; practice
          </h2>
          {formulaSheets.length > 0 && (
            <p className="mb-3 flex items-center gap-2 text-sm text-slate-700">
              <IconSigma size={16} className="text-violet-700" />
              {formulaSheets.length} formula sheet{formulaSheets.length > 1 ? "s" : ""} available below.
              <Link href={`/search?term=${term.slug}&type=FORMULA_SHEET`} className="font-medium text-ucla-blue hover:underline">
                Show all
              </Link>
            </p>
          )}
          {review.length ? <div className="grid gap-3 md:grid-cols-2">{review.map(card)}</div> : <EmptyState title="No review materials posted yet" />}
        </section>
      </div>
    </>
  );
}
