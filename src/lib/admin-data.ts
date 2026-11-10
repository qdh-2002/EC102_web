import "server-only";
import { prisma } from "./db";
import { compareTermsDesc } from "./terms";

export async function adminTerms() {
  const terms = await prisma.term.findMany();
  return terms.sort(compareTermsDesc);
}

export async function pickTerm(slugOrId?: string) {
  const terms = await adminTerms();
  const term = terms.find((t) => t.id === slugOrId || t.slug === slugOrId) ?? terms.find((t) => t.isCurrent) ?? terms[0] ?? null;
  return { terms, term };
}
