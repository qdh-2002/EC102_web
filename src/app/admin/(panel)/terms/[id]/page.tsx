import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { termName } from "@/lib/terms";
import { TermFields } from "@/components/admin/TermForm";
import { Flash } from "@/components/admin/fields";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { deleteTermAction, saveTermAction } from "../../../actions";

export const metadata = { title: "Edit term" };

export default async function EditTerm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp, me] = await Promise.all([params, searchParams, requireStaff()]);
  const t = await prisma.term.findUnique({ where: { id }, include: { weeks: true } });
  if (!t) notFound();
  const isAdmin = me.role === "ADMIN";
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/terms" className="text-sm text-ucla-blue hover:underline">← Terms</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ucla-darkestblue">{termName(t)}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/items?term=${t.id}`} className="btn-secondary">Content</Link>
          <a href={`/${t.slug}`} target="_blank" rel="noreferrer" className="btn-secondary">View ↗</a>
        </div>
      </div>
      <Flash sp={sp} />
      {isAdmin ? (
        <form action={saveTermAction} className="card space-y-4 p-5">
          <input type="hidden" name="id" value={t.id} />
          <TermFields t={t} weeks={t.weeks} />
          <SubmitButton>Save term</SubmitButton>
        </form>
      ) : (
        <p className="card p-5 text-sm text-slate-600">Only admins can edit term settings.</p>
      )}
      {isAdmin && (
        <form action={deleteTermAction} className="card space-y-3 border-red-200 p-5">
          <h2 className="font-bold text-red-800">Delete term</h2>
          <p className="text-sm text-slate-600">Deletes the term and every item and uploaded file in it. Archiving is almost always better.</p>
          <input type="hidden" name="id" value={t.id} />
          <label htmlFor="confirm" className="label">Type <code>{t.slug}</code> to confirm</label>
          <input id="confirm" name="confirm" className="input max-w-xs" autoComplete="off" />
          <ConfirmButton message={`Permanently delete ${termName(t)}?`}>Delete term permanently</ConfirmButton>
        </form>
      )}
    </div>
  );
}
