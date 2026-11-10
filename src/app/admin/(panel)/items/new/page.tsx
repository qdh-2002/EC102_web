import Link from "next/link";
import { pickTerm } from "@/lib/admin-data";
import { ItemForm } from "@/components/admin/ItemForm";
import { Flash } from "@/components/admin/fields";
import { ITEM_KIND_LABEL, ITEM_KINDS, type ItemKind } from "@/lib/constants";

export const metadata = { title: "New item" };

export default async function NewItem({ searchParams }: { searchParams: Promise<{ term?: string; kind?: string; error?: string }> }) {
  const sp = await searchParams;
  const { terms, term } = await pickTerm(sp.term);
  if (!term) return <p>Create a term first.</p>;
  const kind = ITEM_KINDS.includes(sp.kind as ItemKind) ? (sp.kind as ItemKind) : "LECTURE";
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={`/admin/items?term=${term.id}`} className="text-sm text-ucla-blue hover:underline">← Course content</Link>
      <h1 className="text-2xl font-bold text-ucla-darkestblue">New {ITEM_KIND_LABEL[kind].toLowerCase()}</h1>
      <Flash sp={sp} />
      <ItemForm terms={terms} term={term} kind={kind} />
      <p className="text-sm text-slate-500">After creating, you can attach slides, notes, solutions and other files.</p>
    </div>
  );
}
