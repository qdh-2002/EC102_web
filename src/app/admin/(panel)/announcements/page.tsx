import Link from "next/link";
import { prisma } from "@/lib/db";
import { pickTerm } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/dates";
import { termName } from "@/lib/terms";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { Flash, StatusPill } from "@/components/admin/fields";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ term?: string; saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { terms, term } = await pickTerm(sp.term);
  if (!term) return <p>Create a term first.</p>;
  const list = await prisma.announcement.findMany({ where: { termId: term.id }, orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }] });
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-ucla-darkestblue">New announcement</h1>
        <Flash sp={sp} />
        <AnnouncementForm terms={terms} termId={term.id} />
      </div>
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-ucla-darkestblue">{termName(term)} announcements</h2>
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/announcements/${a.id}`} className="font-semibold text-slate-900 hover:text-ucla-blue hover:underline">{a.title}</Link>
                <StatusPill status={a.status} />
                {a.pinned && <span className="text-xs font-semibold text-ucla-darkblue">pinned</span>}
                {a.publishedAt > new Date() && <span className="text-xs font-semibold text-amber-700">scheduled</span>}
                <span className="ml-auto text-xs text-slate-500">{formatDateTime(a.publishedAt)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.body}</p>
            </li>
          ))}
          {!list.length && <li className="text-slate-600">No announcements yet.</li>}
        </ul>
      </div>
    </div>
  );
}
