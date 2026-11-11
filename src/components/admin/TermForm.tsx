import type { Term, Week } from "@prisma/client";
import { QUARTER_LABEL, QUARTERS } from "@/lib/constants";
import { toCampusInput } from "@/lib/dates";
import { weekLabel } from "@/lib/terms";
import { Field, Select } from "./fields";

/** Fields shared by "edit term", "new term" and "new term from a previous term". */
export function TermFields({ t, weeks = [], showWeeks = true }: { t?: Term; weeks?: Week[]; showWeeks?: boolean }) {
  const n = t?.numWeeks ?? 10;
  const noCalendar = t ? !t.startDate : false;
  return (
    // Ticking "No calendar" hides the date and week fields (CSS only, no client JS).
    <div className="space-y-4 [&:has(#noCalendar:checked)_.cal-only]:hidden">
      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Quarter" htmlFor="quarter">
            <Select id="quarter" name="quarter" defaultValue={t?.quarter ?? "FALL"} options={QUARTERS.map((q) => ({ value: q, label: QUARTER_LABEL[q] }))} />
          </Field>
          <Field label="Year" htmlFor="year">
            <input id="year" name="year" type="number" required min={2000} max={2100} defaultValue={t?.year ?? new Date().getFullYear()} className="input" />
          </Field>
          <div className="cal-only">
            <Field label="Week 1 Monday" htmlFor="startDate" hint="Drives the calendar and “this week”.">
              <input id="startDate" name="startDate" type="date" defaultValue={toCampusInput(t?.startDate, false)} className="input" />
            </Field>
          </div>
          <div className="cal-only">
            <Field label="Instruction weeks" htmlFor="numWeeks" hint="Finals week is added after.">
              <input id="numWeeks" name="numWeeks" type="number" min={1} max={15} defaultValue={n} className="input" />
            </Field>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input id="noCalendar" type="checkbox" name="noCalendar" defaultChecked={noCalendar} className="mt-0.5 h-4 w-4" />
          <span>
            No calendar for this term (no dates)
            <span className="block text-xs text-slate-500">
              Use for past terms where you only want the recordings and slides. Lectures are listed in order, with no calendar page, week timeline or “this week”.
            </span>
          </span>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status" htmlFor="status" hint="Draft terms are visible to staff only.">
          <Select id="status" name="status" defaultValue={t?.status ?? "DRAFT"} options={[{ value: "DRAFT", label: "Draft (staff only)" }, { value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived (read-only archive)" }]} />
        </Field>
        <Field label="Bruin Learn course URL" htmlFor="bruinLearnUrl">
          <input id="bruinLearnUrl" name="bruinLearnUrl" type="url" defaultValue={t?.bruinLearnUrl ?? "https://bruinlearn.ucla.edu/"} className="input" />
        </Field>
        <Field label="Syllabus URL (optional)" htmlFor="syllabusUrl">
          <input id="syllabusUrl" name="syllabusUrl" type="url" defaultValue={t?.syllabusUrl ?? ""} className="input" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isCurrent" defaultChecked={t?.isCurrent} className="h-4 w-4" /> Make this the current term (students land here by default)
      </label>
      <Field label="Course overview" htmlFor="overview" hint="Shown at the top of the homepage.">
        <textarea id="overview" name="overview" rows={3} defaultValue={t?.overview ?? ""} className="input" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Course staff" htmlFor="instructors" hint="One per line: Name | email | role | profile link (optional)">
          <textarea id="instructors" name="instructors" rows={5} defaultValue={t?.instructors ?? ""} className="input font-mono text-xs" placeholder="Prof. Jane Doe | jdoe@ucla.edu | Instructor | https://samueli.ucla.edu/people/..." />
        </Field>
        <Field label="Logistics" htmlFor="logistics" hint="One per line, e.g. lecture times, office hours, exam dates.">
          <textarea id="logistics" name="logistics" rows={5} defaultValue={t?.logistics ?? ""} className="input text-sm" />
        </Field>
      </div>
      <Field label="Quick links" htmlFor="quickLinks" hint="Shown in the sidebar. One per line: Label | https://… (e.g. Piazza, Gradescope)">
        <textarea id="quickLinks" name="quickLinks" rows={3} defaultValue={t?.quickLinks ?? ""} className="input font-mono text-xs" placeholder="Piazza | https://piazza.com/..." />
      </Field>
      {showWeeks && (
        <fieldset className="cal-only rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold">Weekly topics (timeline)</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: n + 1 }, (_, i) => i + 1).map((w) => (
              <Field key={w} label={weekLabel(w, n)} htmlFor={`week-${w}`}>
                <input id={`week-${w}`} name={`week-${w}`} defaultValue={weeks.find((x) => x.number === w)?.topic ?? ""} className="input" />
              </Field>
            ))}
          </div>
          <p className="hint">Change “Instruction weeks” and save to add or remove rows.</p>
        </fieldset>
      )}
    </div>
  );
}
