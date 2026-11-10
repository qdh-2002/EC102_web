import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTerm } from "@/lib/queries";
import { termName } from "@/lib/terms";
import { TermHome } from "@/components/TermHome";

export async function generateMetadata({ params }: { params: Promise<{ term: string }> }): Promise<Metadata> {
  const term = await getTerm((await params).term);
  return { title: term ? termName(term) : "Term not found" };
}

export default async function TermPage({ params }: { params: Promise<{ term: string }> }) {
  const term = await getTerm((await params).term);
  if (!term) notFound();
  return <TermHome term={term} />;
}
