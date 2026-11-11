import type { Item, Term } from "@prisma/client";
import { saveItemAction } from "@/app/admin/actions";
import { ITEM_KIND_LABEL, ENABLED_KINDS, ITEM_STATUSES, RECORDING_STATUS_LABEL, RECORDING_STATUSES } from "@/lib/constants";
import { toCampusInput } from "@/lib/dates";
import { hasCalendar, termName, weekLabel } from "@/lib/terms";
import { Field, Select } from "./fields";
import { SubmitButton } from "./ui";
import { RecordingUploader } from "./RecordingUploader";

export function ItemForm({ item, terms, term, kind, videoName }: { item?: Item; terms: Term[]; term: Term; kind: string; videoName?: string }) {
  const k = item?.kind ?? kind;
  const showRecording = k === "LECTURE" || k === "DISCUSSION";
  return (
    <form action={saveItemAction} className="card space-y-5 p-5 sm:p-6">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Term" htmlFor="termId">
          <Select id="termId" name="termId" defaultValue={item?.termId ?? term.id} options={terms.map((t) => ({ value: t.id, label: termName(t) }))} />
        </Field>
        <Field label="Type" htmlFor="kind">
          <Select id="kind" name="kind" defaultValue={k} options={ENABLED_KINDS.map((x) => ({ value: x, label: ITEM_KIND_LABEL[x] }))} />
        </Field>
        <Field label="Status" htmlFor="status" hint="Only published items are visible to students.">
          <Select id="status" name="status" defaultValue={item?.status ?? "DRAFT"} options={ITEM_STATUSES.map((s) => ({ value: s, label: s === "DRAFT" ? "Draft (hidden)" : s === "PUBLISHED" ? "Published (visible)" : "Archived (hidden, kept)" }))} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <Field label="Number" htmlFor="number" hint="e.g. Lecture 7">
          <input id="number" name="number" type="number" min={0} defaultValue={item?.number ?? ""} className="input" />
        </Field>
        <Field label="Title" htmlFor="title">
          <input id="title" name="title" required maxLength={200} defaultValue={item?.title ?? ""} className="input" placeholder="e.g. Convolution and the impulse response" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="date" hint={hasCalendar(term) ? "The day of the class." : "Optional. This term has no calendar, so you can leave it blank."}>
          <input id="date" name="date" type="date" defaultValue={toCampusInput(item?.date, false)} className="input" />
        </Field>
        {k === "LECTURE" || k === "DISCUSSION" ? (
          <input type="hidden" name="dueAt" value={toCampusInput(item?.dueAt)} />
        ) : (
          <Field label={k === "HOMEWORK" ? "Due date & time" : "Exam / event time"} htmlFor="dueAt" hint="Optional. Pacific time.">
            <input id="dueAt" name="dueAt" type="datetime-local" defaultValue={toCampusInput(item?.dueAt)} className="input" />
          </Field>
        )}
        <Field label="Week" htmlFor="week" hint={hasCalendar(term) ? "Leave blank to work it out from the date." : "Optional."}>
          <select id="week" name="week" defaultValue={item?.week ?? ""} className="input">
            <option value="">{hasCalendar(term) ? "Auto from date" : "None"}</option>
            {Array.from({ length: term.numWeeks + 1 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {weekLabel(n, term.numWeeks)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description (optional)" htmlFor="description" hint="Shown on the lecture page.">
        <textarea id="description" name="description" rows={4} defaultValue={item?.description ?? ""} className="input" />
      </Field>
      <Field label="Topics (optional)" htmlFor="topics" hint="Comma separated, used for search, e.g. convolution, impulse response">
        <input id="topics" name="topics" defaultValue={item?.topics ?? ""} className="input" />
      </Field>
      {showRecording ? (
        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-800">Recording</legend>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Recording status" htmlFor="recordingStatus" hint="Students see “coming soon” or “not recorded” labels.">
              <Select id="recordingStatus" name="recordingStatus" defaultValue={item?.recordingStatus ?? "PENDING"} options={RECORDING_STATUSES.map((s) => ({ value: s, label: RECORDING_STATUS_LABEL[s] }))} />
            </Field>
            <Field label="…or recording link" htmlFor="recordingUrl" hint="YouTube, Vimeo, Google Drive and direct .mp4 links play on the page. Bruincast / Bruin Learn / Zoom links open behind UCLA login.">
              <input id="recordingUrl" name="recordingUrl" type="url" defaultValue={item?.recordingUrl ?? ""} className="input" placeholder="https://bruinlearn.ucla.edu/courses/…" />
            </Field>
          </div>
          {item ? <div className="mt-3"><RecordingUploader itemId={item.id} current={videoName} /></div> : <p className="hint mt-2">Save first, then you can upload a video file here.</p>}
        </fieldset>
      ) : (
        <input type="hidden" name="recordingStatus" value={item?.recordingStatus ?? "NONE"} />
      )}
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isPlaceholder" defaultChecked={item?.isPlaceholder ?? false} className="h-4 w-4 rounded border-slate-300" />
        Sample / placeholder content (shows a “Sample content” badge)
      </label>
      <div className="flex gap-3 border-t border-slate-100 pt-4">
        <SubmitButton>{item ? "Save changes" : "Create"}</SubmitButton>
      </div>
    </form>
  );
}
