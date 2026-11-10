import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { adminTerms } from "@/lib/admin-data";
import { termName } from "@/lib/terms";
import { formatLongDate } from "@/lib/dates";
import { Flash, StatusPill } from "@/components/admin/fields";
import { SubmitButton } from "@/components/admin/ui";
import { archiveTermAction, setCurrentTermAction } from "../../actions";

export const metadata = { title: "Terms" };

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await requireStaff();
  const terms = await adminTerms();
  const counts = await prisma.item.groupBy({ by: ["termId"], _count: true });
  const isAdmin = me.role === "ADMIN";
  return (
    <div className="space-y-5">
      <Flash sp={sp} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ucla-darkestblue">Terms</h1>
          <p className="text-sm text-slate-600">Each quarter is a term. Start a new quarter by copying a previous one, then archive the old term when it ends.</p>
        </div>
        {isAdmin && <Link href="/admin/terms/new" className="btn-primary">+ New term</Link>}
      </div>
      {!isAdmin && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Only admins can create, archive, or change the current term.</p>}
      <div className="card divide-y divide-slate-100">
        {terms.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/terms/${t.id}`} className="font-semibold text-slate-900 hover:text-ucla-blue hover:underline">{termName(t)}</Link>
                <StatusPill status={t.status} />
                {t.isCurrent && <span className="rounded-full bg-ucla-gold px-2 py-0.5 text-xs font-bold text-ucla-darkestblue">current</span>}
              </div>
              <p className="text-xs text-slate-500">
                Starts {formatLongDate(t.startDate)} · {counts.find((c) => c.termId === t.id)?._count ?? 0} items · /{t.slug}
              </p>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {!t.isCurrent && (
                  <form action={setCurrentTermAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitButton className="btn-secondary">Make current</SubmitButton>
                  </form>
                )}
                {t.status !== "ARCHIVED" ? (
                  <form action={archiveTermAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="status" value="ARCHIVED" />
                    <SubmitButton className="btn-secondary">Archive</SubmitButton>
                  </form>
                ) : (
                  <form action={archiveTermAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="status" value="ACTIVE" />
                    <SubmitButton className="btn-secondary">Unarchive</SubmitButton>
                  </form>
                )}
                <Link href={`/admin/items?term=${t.id}`} className="btn-secondary">Content</Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
