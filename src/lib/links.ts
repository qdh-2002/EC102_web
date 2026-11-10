export function sectionForKind(kind: string) {
  if (kind === "LECTURE") return "lectures";
  if (kind === "DISCUSSION") return "discussions";
  return "assignments";
}

export function itemHref(termSlug: string, item: { id: string; kind: string }) {
  return `/${termSlug}/${sectionForKind(item.kind)}/${item.id}`;
}
