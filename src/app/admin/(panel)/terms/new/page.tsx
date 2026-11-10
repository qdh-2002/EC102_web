import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { adminTerms } from "@/lib/admin-data";
import { termName } from "@/lib/terms";
import { TermFields } from "@/components/admin/TermForm";
import { Field, Flash, Select } from "@/components/admin/fields";
import { SubmitButton } from "@/components/admin/ui";
import { cloneTermAction, saveTermAction } from "../../../actions";

export const metadata = { title: "New term" };

export default async function NewTerm({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  await requireStaff("ADMIN");
  const terms = await adminTerms();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/terms" className="text-sm text-ucla-blue hover:underline">← Terms</Link>
      <h1 className="text-2xl font-bold text-ucla-darkestblue">New term</h1>
      <Flash sp={sp} />
      {terms.length > 0 && (
        <form action={cloneTermAction} className="card space-y-4 border-ucla-lightblue p-5">
          <div>
            <h2 className="text-lg font-bold text-ucla-darkestblue">Recommended: start from a previous term</h2>
            <p className="text-sm text-slate-600">
              Copies week topics and every lecture as <strong>drafts</strong>, with dates shifted to the new calendar.
              Recording links carry over too, since each lecture keeps one recording that is reused every year. Lectures without a recording are
              marked “recording coming soon”.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Copy from" htmlFor="sourceId">
              <Select id="sourceId" name="sourceId" options={terms.map((t) => ({ value: t.id, label: termName(t) }))} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" name="copyResources" defaultChecked className="h-4 w-4" /> Also copy slides, notes and links
            </label>
          </div>
          <TermFields showWeeks={false} />
          <SubmitButton pendingText="Copying…">Create term from copy</SubmitButton>
        </form>
      )}
      <details className="card p-5" open={terms.length === 0}>
        <summary className="cursor-pointer text-lg font-bold text-ucla-darkestblue">Or create an empty term</summary>
        <form action={saveTermAction} className="mt-4 space-y-4">
          <TermFields />
          <SubmitButton>Create term</SubmitButton>
        </form>
      </details>
    </div>
  );
}
