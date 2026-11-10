import type { Resource } from "@prisma/client";
import { addResourceAction, deleteResourceAction, updateResourceAction } from "@/app/admin/actions";
import { ACCESS_LABEL, ACCESS_LEVELS, RESOURCE_TYPE_LABEL, ENABLED_RESOURCE_TYPES } from "@/lib/constants";
import { formatDateTime, toCampusInput } from "@/lib/dates";
import { formatBytes } from "@/lib/format";
import { RESOURCE_STYLE } from "../resource-style";
import type { ResourceType } from "@/lib/constants";
import { Field, Select } from "./fields";
import { ConfirmButton, SubmitButton } from "./ui";

const typeOptions = ENABLED_RESOURCE_TYPES.map((t) => ({ value: t, label: RESOURCE_TYPE_LABEL[t] }));
const accessOptions = ACCESS_LEVELS.map((a) => ({ value: a, label: ACCESS_LABEL[a] }));

function ResourceFields({ r, prefix }: { r?: Resource; prefix: string }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <Field label="Type" htmlFor={`${prefix}-type`}>
          <Select id={`${prefix}-type`} name="type" defaultValue={r?.type ?? "SLIDES"} options={r && !typeOptions.some((o) => o.value === r.type) ? [...typeOptions, { value: r.type, label: RESOURCE_TYPE_LABEL[r.type as ResourceType] ?? r.type }] : typeOptions} />
        </Field>
        <Field label="Label" htmlFor={`${prefix}-label`}>
          <input id={`${prefix}-label`} name="label" required defaultValue={r?.label ?? ""} className="input" placeholder="e.g. Lecture 7 slides (PDF)" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={r?.filePath ? "Replace file" : "Upload file"} htmlFor={`${prefix}-file`} hint="PDF, PowerPoint, Keynote, images.">
          <input id={`${prefix}-file`} name="file" type="file" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ucla-lighterblue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ucla-darkestblue" />
        </Field>
        <Field label="…or link" htmlFor={`${prefix}-url`} hint="Box, Google Drive, Bruin Learn, etc.">
          <input id={`${prefix}-url`} name="url" type="url" defaultValue={r?.url ?? ""} className="input" placeholder="https://" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Who can access" htmlFor={`${prefix}-access`} hint="Protected material: choose Bruin Learn only.">
          <Select id={`${prefix}-access`} name="access" defaultValue={r?.access ?? "PUBLIC"} options={accessOptions} />
        </Field>
        <Field label="Release at (optional)" htmlFor={`${prefix}-releaseAt`} hint="Hidden from students until then.">
          <input id={`${prefix}-releaseAt`} name="releaseAt" type="datetime-local" defaultValue={toCampusInput(r?.releaseAt)} className="input" />
        </Field>
        <Field label="Order" htmlFor={`${prefix}-sortOrder`}>
          <input id={`${prefix}-sortOrder`} name="sortOrder" type="number" defaultValue={r?.sortOrder ?? ""} className="input" />
        </Field>
      </div>
    </>
  );
}

export function ResourceManager({ itemId, resources }: { itemId: string; resources: Resource[] }) {
  return (
    <section aria-labelledby="res-h" className="space-y-4">
      <h2 id="res-h" className="text-lg font-bold text-ucla-darkestblue">
        Files &amp; links ({resources.length})
      </h2>
      {resources.length > 0 && (
        <ul className="space-y-3">
          {resources.map((r) => {
            const { Icon, chip } = RESOURCE_STYLE[r.type as ResourceType] ?? RESOURCE_STYLE.LINK;
            return (
              <li key={r.id} className="card">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ring-1 ring-inset ${chip}`}>
                      <Icon size={13} /> {RESOURCE_TYPE_LABEL[r.type as ResourceType]}
                    </span>
                    <span className="min-w-0 flex-1 font-medium text-slate-900">{r.label}</span>
                    <span className="text-xs text-slate-500">
                      {r.filePath ? `${r.fileName} · ${formatBytes(r.fileSize)}` : r.url ? "link" : ""}
                      {r.isPlaceholder && " · sample"}
                      {r.access !== "PUBLIC" && ` · ${r.access === "STAFF" ? "staff only" : "Bruin Learn only"}`}
                      {r.releaseAt && ` · releases ${formatDateTime(r.releaseAt)}`}
                    </span>
                    <span className="text-xs font-semibold text-ucla-blue">Edit ▾</span>
                  </summary>
                  <div className="space-y-3 border-t border-slate-100 p-4">
                    <form action={updateResourceAction} className="space-y-3">
                      <input type="hidden" name="id" value={r.id} />
                      <ResourceFields r={r} prefix={`r-${r.id}`} />
                      <div className="flex flex-wrap gap-2">
                        <SubmitButton className="btn-primary">Save</SubmitButton>
                        {r.filePath && (
                          <a href={`/files/${r.id}`} className="btn-secondary" target="_blank" rel="noreferrer">
                            Open file
                          </a>
                        )}
                      </div>
                    </form>
                    <form action={deleteResourceAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmButton message={`Remove “${r.label}”? Uploaded files are deleted from the server.`}>Remove</ConfirmButton>
                    </form>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
      <form action={addResourceAction} className="card space-y-3 border-dashed p-4 sm:p-5">
        <h3 className="font-semibold text-slate-900">Add slides, notes or a link</h3>
        <input type="hidden" name="itemId" value={itemId} />
        <ResourceFields prefix="new" />
        <SubmitButton pendingText="Uploading…">Add</SubmitButton>
      </form>
    </section>
  );
}
