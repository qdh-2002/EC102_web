import Link from "next/link";
import { SiteShell, EmptyState } from "@/components/SiteShell";
import { TermHome } from "@/components/TermHome";
import { getCurrentTerm } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const term = await getCurrentTerm();
  return (
    <SiteShell term={term}>
      {term ? (
        <TermHome term={term} />
      ) : (
        <EmptyState title="No terms published yet">
          Course staff can create the first term in the <Link className="underline" href="/admin">admin dashboard</Link>.
        </EmptyState>
      )}
    </SiteShell>
  );
}
