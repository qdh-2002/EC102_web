import type { Announcement, Term } from "@prisma/client";
import { saveAnnouncementAction } from "@/app/admin/actions";
import { toCampusInput } from "@/lib/dates";
import { termName } from "@/lib/terms";
import { Field, Select } from "./fields";
import { SubmitButton } from "./ui";

export function AnnouncementForm({ a, terms, termId }: { a?: Announcement; terms: Term[]; termId: string }) {
  return (
    <form action={saveAnnouncementAction} className="card space-y-4 p-5">
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Term" htmlFor="a-term">
          <Select id="a-term" name="termId" defaultValue={a?.termId ?? termId} options={terms.map((t) => ({ value: t.id, label: termName(t) }))} />
        </Field>
        <Field label="Status" htmlFor="a-status">
          <Select id="a-status" name="status" defaultValue={a?.status ?? "PUBLISHED"} options={[{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }, { value: "ARCHIVED", label: "Archived" }]} />
        </Field>
        <Field label="Publish at" htmlFor="a-pub" hint="Leave blank for now. Future times are scheduled.">
          <input id="a-pub" name="publishedAt" type="datetime-local" defaultValue={toCampusInput(a?.publishedAt)} className="input" />
        </Field>
      </div>
      <Field label="Title" htmlFor="a-title">
        <input id="a-title" name="title" required defaultValue={a?.title ?? ""} className="input" />
      </Field>
      <Field label="Message" htmlFor="a-body">
        <textarea id="a-body" name="body" required rows={4} defaultValue={a?.body ?? ""} className="input" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="pinned" defaultChecked={a?.pinned} className="h-4 w-4" /> Pin to top of homepage
      </label>
      <SubmitButton>{a ? "Save" : "Post announcement"}</SubmitButton>
    </form>
  );
}
