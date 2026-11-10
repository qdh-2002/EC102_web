import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { getTerm } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TermLayout({ children, params }: { children: React.ReactNode; params: Promise<{ term: string }> }) {
  const { term: slug } = await params;
  const term = await getTerm(slug);
  if (!term) notFound();
  return <SiteShell term={term}>{children}</SiteShell>;
}
