import Link from "next/link";
import { prisma } from "@/lib/db";
import { pickTerm } from "@/lib/admin-data";
import { ITEM_KIND_LABEL, ITEM_KINDS, ITEM_STATUSES, RECORDING_STATUS_LABEL, type ItemKind, type RecordingStatus } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { termName, weekLabel } from "@/lib/terms";
import { Flash, StatusPill } from "@/components/admin/fields";
import { SubmitButton } from "@/components/admin/ui";
import { setItemStatusAction } from "../../actions";
import { itemHref } from "@/lib/links";

export const metadata = { title: "Course content" };

type SP = { term?: string; kind?: string; status?: string; q?: string; saved?: string; error?: string };

export default async function ItemsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { terms, term } = await pickTerm(sp.term);
  if (!term) return <p>No terms yet. <Link href="/admin/terms/new" className="underline">Create one</Link>.</p>;
  const kind = ITEM_KINDS.includes(sp.kind as ItemKind) ? sp.kind : undefined;
  const status = ITEM_STATUSES.includes(sp.status as never) ? sp.status : undefined;
  const items = await prisma.item.findMany({
    where: { termId: term.id, ...(kind ? { kind } : {}), ...(status ? { status } : {}) },
    include: { _count: { select: { resources: true } } },
    orderBy: [{ week: "asc" }, { date: "asc" }, { kind: "asc" }, { number: "asc" }],
  });
  const q = (sp.q ?? "").toLowerCase();
  const shown = q ? items.filter((i) => `${i.title} ${i.topics}`.toLowerCase().includes(q)) : items;
  const returnTo = `/admin/items?${new URLSearchParams({ term: term.id, ...(kind ? { kind } : {}), ...(status ? { status } : {}) })}`;

  return (
    <div className="space-y-5">
      <Flash sp={sp} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ucla-darkestblue">Course content</h1>
        <Link href={`/admin/items/new?term=${term.id}&kind=${kind ?? "LECTURE"}`} className="btn-primary">
          + New {kind ? ITEM_KIND_LABEL[kind as ItemKind].toLowerCase() : "item"}
        </Link>
      </div>
      <form className="card grid gap-3 p-4 sm:grid-cols-5 sm:items-end">
        <div>
          <label className="label" htmlFor="f-term">Term</label>
          <select id="f-term" name="term" defaultValue={term.id} className="input">
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {termName(t)} {t.isCurrent ? "(current)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-kind">Type</label>
          <select id="f-kind" name="kind" defaultValue={kind ?? ""} className="input">
            <option value="">All types</option>
            {ITEM_KINDS.map((k) => (
              <option key={k} value={k}>{ITEM_KIND_LABEL[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-status">Status</label>
          <select id="f-status" name="status" defaultValue={status ?? ""} className="input">
            <option value="">Any status</option>
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>{s.toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-q">Title contains</label>
          <input id="f-q" name="q" defaultValue={sp.q ?? ""} className="input" />
        </div>
        <button className="btn-secondary">Filter</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Week</th>
              <th scope="col" className="px-4 py-3">Item</th>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Files</th>
              <th scope="col" className="px-4 py-3">Recording</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{weekLabel(i.week, term.numWeeks)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/items/${i.id}`} className="font-medium text-slate-900 hover:text-ucla-blue hover:underline">
                    <span className="text-slate-500">{ITEM_KIND_LABEL[i.kind as ItemKind]} {i.number ?? ""}</span> {i.title}
                  </Link>
                  {i.isPlaceholder && <span className="ml-2 rounded bg-fuchsia-50 px-1.5 text-xs text-fuchsia-800">sample</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(i.date)}</td>
                <td className="px-4 py-3 text-slate-600">{i._count.resources}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {i.kind === "LECTURE" || i.kind === "DISCUSSION" ? RECORDING_STATUS_LABEL[i.recordingStatus as RecordingStatus] : "—"}
                </td>
                <td className="px-4 py-3"><StatusPill status={i.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <form action={setItemStatusAction} className="inline">
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <input type="hidden" name="status" value={i.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <SubmitButton className="text-xs font-semibold text-ucla-blue hover:underline" pendingText="…">
                      {i.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </SubmitButton>
                  </form>
                  <a href={itemHref(term.slug, i)} target="_blank" rel="noreferrer" className="ml-3 text-xs font-semibold text-slate-600 hover:underline">
                    View
                  </a>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-600">No items match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
