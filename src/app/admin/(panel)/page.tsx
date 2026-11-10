import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickTerm } from "@/lib/admin-data";
import { currentWeek, termName, weekLabel } from "@/lib/terms";
import { formatDateTime } from "@/lib/dates";
import { ITEM_KIND_LABEL, type ItemKind } from "@/lib/constants";
import { Flash } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ui";
import { deleteSampleContentAction } from "../actions";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await requireStaff();
  const { term } = await pickTerm();
  if (!term) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-ucla-darkestblue">Welcome! Let&apos;s set up the first term.</h1>
        <p className="mt-2 text-slate-600">Create a term (e.g. Fall 2026) to start adding lectures and materials.</p>
        {me.role === "ADMIN" && (
          <Link href="/admin/terms/new" className="btn-primary mt-4">
            Create a term
          </Link>
        )}
      </div>
    );
  }
  const [items, logs, sampleCount] = await Promise.all([
    prisma.item.findMany({ where: { termId: term.id }, include: { resources: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
    prisma.item.count({ where: { isPlaceholder: true } }).then(async (n) => n + (await prisma.resource.count({ where: { isPlaceholder: true } }))),
  ]);
  const wk = currentWeek(term);
  const drafts = items.filter((i) => i.status === "DRAFT");
  const pendingRec = items.filter((i) => (i.kind === "LECTURE" || i.kind === "DISCUSSION") && i.status === "PUBLISHED" && i.recordingStatus === "PENDING");
  const empty = items.filter((i) => i.status === "PUBLISHED" && i.resources.length === 0 && !i.recordingUrl);
  const stat = (label: string, n: number, href: string) => (
    <Link href={href} className="card p-4 hover:border-ucla-blue">
      <p className="text-2xl font-bold text-ucla-darkestblue">{n}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </Link>
  );
  const base = `/admin/items?term=${term.id}`;

  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ucla-blue">
            Current term: {termName(term)}
            {wk >= 1 && wk <= term.numWeeks + 1 ? ` · ${weekLabel(wk, term.numWeeks)}` : ""}
          </p>
          <h1 className="text-2xl font-bold text-ucla-darkestblue">Welcome, {me.name.split(" ")[0]}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/items/new?term=${term.id}&kind=LECTURE`} className="btn-primary">
            + Lecture
          </Link>
          <Link href={`/admin/items/new?term=${term.id}&kind=DISCUSSION`} className="btn-secondary">
            + Discussion
          </Link>
          <Link href={`/admin/items/new?term=${term.id}&kind=HOMEWORK`} className="btn-secondary">
            + Homework
          </Link>
          <Link href={`/admin/items/new?term=${term.id}&kind=EXAM`} className="btn-secondary">
            + Exam
          </Link>
          <Link href="/admin/announcements" className="btn-gold">
            Post announcement
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stat("Lectures", items.filter((i) => i.kind === "LECTURE").length, `${base}&kind=LECTURE`)}
        {stat("Drafts (hidden from students)", drafts.length, `${base}&status=DRAFT`)}
        {stat("Recordings still pending", pendingRec.length, `${base}&kind=LECTURE`)}
        {stat("Published with no materials", empty.length, base)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold text-ucla-darkestblue">Needs attention</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {[...pendingRec.map((i) => ({ i, why: "recording pending" })), ...drafts.map((i) => ({ i, why: "draft" }))].slice(0, 10).map(({ i, why }) => (
              <li key={i.id + why} className="flex items-center justify-between gap-3 py-2">
                <Link href={`/admin/items/${i.id}`} className="font-medium text-slate-900 hover:text-ucla-blue hover:underline">
                  {ITEM_KIND_LABEL[i.kind as ItemKind]} {i.number ?? ""}: {i.title}
                </Link>
                <span className="shrink-0 text-xs text-slate-500">{why}</span>
              </li>
            ))}
            {!pendingRec.length && !drafts.length && <li className="py-2 text-slate-600">All caught up.</li>}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="font-bold text-ucla-darkestblue">Recent activity</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="py-2">
                <span className="font-medium">{l.user?.name ?? "Someone"}</span> {l.action}d {l.entity} <span className="text-slate-600">{l.summary}</span>
                <span className="block text-xs text-slate-500">{formatDateTime(l.createdAt)}</span>
              </li>
            ))}
            {!logs.length && <li className="py-2 text-slate-600">No activity yet.</li>}
          </ul>
        </section>
      </div>

      {sampleCount > 0 && me.role === "ADMIN" && (
        <section className="card border-fuchsia-200 bg-fuchsia-50 p-5">
          <h2 className="font-bold text-fuchsia-900">Sample content is still on the site</h2>
          <p className="mt-1 text-sm text-fuchsia-900">
            {sampleCount} items and files are marked as sample/placeholder content (placeholder PDFs, demo announcements and the demo Spring 2026
            archive). When the real files are uploaded, remove them in one step. The real schedule, week topics and staff accounts are kept.
          </p>
          <form action={deleteSampleContentAction} className="mt-3">
            <ConfirmButton message="Delete all sample items and announcements? This cannot be undone.">Remove all sample content</ConfirmButton>
          </form>
        </section>
      )}
    </div>
  );
}
