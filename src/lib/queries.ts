import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { compareTermsDesc } from "./terms";
import { getStaff } from "./auth";
import { hasRecording } from "./access";
import { ENABLED_KINDS } from "./constants";

export const itemInclude = {
  resources: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.ItemInclude;

export type ItemWithResources = Prisma.ItemGetPayload<{ include: typeof itemInclude }>;

/** Cached per request so layout + page share one lookup. */
export const viewer = cache(async () => {
  const staff = await getStaff();
  return { staff, isStaff: !!staff };
});

function termWhere(isStaff: boolean): Prisma.TermWhereInput {
  return isStaff ? {} : { status: { not: "DRAFT" } };
}

function itemWhere(isStaff: boolean): Prisma.ItemWhereInput {
  // Staff preview drafts on the public pages (they are badged); students only see published.
  const kind = { kind: { in: [...ENABLED_KINDS] } };
  return isStaff ? { status: { not: "ARCHIVED" }, ...kind } : { status: "PUBLISHED", ...kind };
}

export const listTerms = cache(async () => {
  const { isStaff } = await viewer();
  const terms = await prisma.term.findMany({ where: termWhere(isStaff) });
  return terms.sort(compareTermsDesc);
});

export const getCurrentTerm = cache(async () => {
  const terms = await listTerms();
  return terms.find((t) => t.isCurrent && t.status !== "DRAFT") ?? terms.find((t) => t.status === "ACTIVE") ?? terms[0] ?? null;
});

export const getTerm = cache(async (slug: string) => {
  const terms = await listTerms();
  return terms.find((t) => t.slug === slug) ?? null;
});

export async function getWeeks(termId: string) {
  return prisma.week.findMany({ where: { termId }, orderBy: { number: "asc" } });
}

export async function getItems(termId: string, kinds?: string[]) {
  const { isStaff } = await viewer();
  return prisma.item.findMany({
    where: { termId, ...itemWhere(isStaff), ...(kinds ? { kind: { in: kinds } } : {}) },
    include: itemInclude,
    orderBy: [{ week: "asc" }, { date: "asc" }, { number: "asc" }, { createdAt: "asc" }],
  });
}

export async function getItem(termId: string, id: string) {
  const { isStaff } = await viewer();
  return prisma.item.findFirst({ where: { id, termId, ...itemWhere(isStaff) }, include: itemInclude });
}

export async function getRecentItems(termId: string, take = 6) {
  const { isStaff } = await viewer();
  return prisma.item.findMany({
    where: { termId, ...itemWhere(isStaff), publishedAt: { not: null } },
    include: itemInclude,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getAnnouncements(termId: string, take = 5) {
  const { isStaff } = await viewer();
  return prisma.announcement.findMany({
    where: { termId, ...(isStaff ? { status: { not: "ARCHIVED" } } : { status: "PUBLISHED", publishedAt: { lte: new Date() } }) },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take,
  });
}

export type SearchFilters = { q: string; term: string; week: string; type: string };

/**
 * Course content is small (a few hundred items per term), so search runs in
 * memory. This keeps it identical on SQLite and PostgreSQL and lets us rank results.
 */
export async function searchItems(f: SearchFilters) {
  const { isStaff } = await viewer();
  const terms = await listTerms();
  const termIds = f.term === "all" || !f.term ? terms.map((t) => t.id) : terms.filter((t) => t.slug === f.term).map((t) => t.id);
  const RESOURCE_FILTERS = new Set(["SLIDES", "NOTES", "HANDOUT", "PROBLEMS", "SOLUTIONS", "FORMULA_SHEET", "VIDEO", "CODE", "LINK", "RECORDING"]);
  const kindFilter = f.type && !RESOURCE_FILTERS.has(f.type) ? f.type : "";
  const resFilter = RESOURCE_FILTERS.has(f.type) ? f.type : "";

  const items = await prisma.item.findMany({
    where: {
      termId: { in: termIds },
      ...itemWhere(isStaff),
      ...(kindFilter ? { kind: kindFilter } : {}),
      ...(f.week ? { week: Number(f.week) } : {}),
    },
    include: { ...itemInclude, term: true },
  });

  const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = items
    .filter((it) => {
      if (resFilter === "RECORDING") return hasRecording(it);
      if (resFilter) return it.resources.some((r) => r.type === resFilter && (isStaff || r.access !== "STAFF"));
      return true;
    })
    .map((it) => {
      if (!words.length) return { it, score: 1 };
      const title = it.title.toLowerCase();
      const topics = it.topics.toLowerCase();
      const desc = it.description.toLowerCase();
      const res = it.resources.filter((r) => isStaff || r.access !== "STAFF").map((r) => r.label.toLowerCase()).join(" ");
      let score = 0;
      for (const w of words) {
        let s = 0;
        if (title.includes(w)) s += 5;
        if (topics.includes(w)) s += 4;
        if (res.includes(w)) s += 2;
        if (desc.includes(w)) s += 1;
        if (!s) return { it, score: 0 }; // every word must match somewhere
        score += s;
      }
      return { it, score };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score || compareTermsDesc(a.it.term, b.it.term) || (a.it.week ?? 99) - (b.it.week ?? 99) || (a.it.number ?? 0) - (b.it.number ?? 0));
  return scored.map((x) => x.it);
}
