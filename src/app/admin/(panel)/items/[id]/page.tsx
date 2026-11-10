import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { adminTerms } from "@/lib/admin-data";
import { ItemForm } from "@/components/admin/ItemForm";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { Flash, StatusPill } from "@/components/admin/fields";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { ITEM_KIND_LABEL, type ItemKind } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { itemHref } from "@/lib/links";
import { termName } from "@/lib/terms";
import { deleteItemAction, duplicateItemAction, markItemNewAction, setItemStatusAction } from "../../../actions";

export const metadata = { title: "Edit item" };

export default async function EditItem({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp, me] = await Promise.all([params, searchParams, requireStaff()]);
  const item = await prisma.item.findUnique({ where: { id }, include: { resources: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }, term: true } });
  if (!item) notFound();
  const terms = await adminTerms();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/admin/items?term=${item.termId}`} className="text-sm text-ucla-blue hover:underline">← {termName(item.term)} content</Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{ITEM_KIND_LABEL[item.kind as ItemKind]} {item.number ?? ""} · {termName(item.term)}</p>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-ucla-darkestblue">
            {item.title} <StatusPill status={item.status} />
          </h1>
          <p className="text-xs text-slate-500">
            Last updated {formatDateTime(item.updatedAt)}
            {item.publishedAt && ` · first published ${formatDateTime(item.publishedAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={itemHref(item.term.slug, item)} target="_blank" rel="noreferrer" className="btn-secondary">Preview ↗</a>
          <form action={setItemStatusAction}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
            <SubmitButton className={item.status === "PUBLISHED" ? "btn-secondary" : "btn-gold"}>
              {item.status === "PUBLISHED" ? "Unpublish" : "Publish now"}
            </SubmitButton>
          </form>
        </div>
      </div>
      <Flash sp={sp} />
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <ItemForm item={item} terms={terms} term={item.term} kind={item.kind} videoName={item.resources.find((r) => r.type === "VIDEO" && r.filePath)?.fileName} />
        <div className="space-y-6">
          <ResourceManager itemId={item.id} resources={item.resources} />
          <section className="card space-y-3 p-5">
            <h2 className="font-bold text-ucla-darkestblue">More actions</h2>
            <div className="flex flex-wrap gap-2">
              <form action={markItemNewAction}>
                <input type="hidden" name="id" value={item.id} />
                <SubmitButton className="btn-secondary">Flag as newly updated</SubmitButton>
              </form>
              <form action={duplicateItemAction}>
                <input type="hidden" name="id" value={item.id} />
                <SubmitButton className="btn-secondary">Duplicate</SubmitButton>
              </form>
              {item.status !== "ARCHIVED" && (
                <form action={setItemStatusAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="status" value="ARCHIVED" />
                  <ConfirmButton className="btn-secondary" message="Archive this item? It will be hidden from students but kept for future terms.">
                    Archive
                  </ConfirmButton>
                </form>
              )}
              {me.role === "ADMIN" && (
                <form action={deleteItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmButton message="Permanently delete this item and its uploaded files? Archiving is usually better.">Delete</ConfirmButton>
                </form>
              )}
            </div>
            <p className="text-xs text-slate-500">Archive hides an item but keeps it. Only admins can permanently delete.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
