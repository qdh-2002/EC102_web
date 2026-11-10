import { notFound } from "next/navigation";
import { getItem, getItems, getTerm, viewer } from "@/lib/queries";
import { ItemDetail } from "./ItemDetail";
import { itemHeading } from "./ItemCard";
import { termName } from "@/lib/terms";
import { ENABLED_KINDS } from "@/lib/constants";

/** Shared loader for /[term]/{lectures,discussions,assignments}/[id]. */
export async function renderDetail(params: Promise<{ term: string; id: string }>, kinds: string[]) {
  const { term: slug, id } = await params;
  const term = await getTerm(slug);
  if (!term) notFound();
  const [item, { isStaff }] = await Promise.all([getItem(term.id, id), viewer()]);
  if (!item || !kinds.includes(item.kind) || !ENABLED_KINDS.includes(item.kind as never)) notFound();
  const siblings = (await getItems(term.id, [item.kind])).map((i) => ({ id: i.id, title: i.title, number: i.number, kind: i.kind }));
  return <ItemDetail item={item} term={term} staff={isStaff} siblings={siblings} />;
}

export async function detailMetadata(params: Promise<{ term: string; id: string }>) {
  const { term: slug, id } = await params;
  const term = await getTerm(slug);
  if (!term) return {};
  const item = await getItem(term.id, id);
  if (!item) return {};
  const h = itemHeading(item);
  return { title: `${h.prefix ? h.prefix + ": " : ""}${h.title} (${termName(term)})`, description: item.description.slice(0, 160) };
}
