import type { ReactNode } from "react";

export function Field({ label, htmlFor, hint, children, className = "" }: { label: string; htmlFor: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function Select({ id, name, defaultValue, options, required }: { id: string; name: string; defaultValue?: string; options: { value: string; label: string }[]; required?: boolean }) {
  return (
    <select id={id} name={name} defaultValue={defaultValue} className="input" required={required}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Flash({ sp }: { sp: { saved?: string; error?: string } }) {
  if (sp.error)
    return (
      <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {sp.error === "forbidden" ? "Your role does not allow that action. Ask a site admin." : sp.error}
      </div>
    );
  if (sp.saved)
    return (
      <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {sp.saved === "1" ? "Saved." : sp.saved}
      </div>
    );
  return null;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    DRAFT: "bg-slate-100 text-slate-700 ring-slate-300",
    ARCHIVED: "bg-amber-50 text-amber-900 ring-amber-200",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${map[status] ?? map.DRAFT}`}>{status.toLowerCase()}</span>;
}
