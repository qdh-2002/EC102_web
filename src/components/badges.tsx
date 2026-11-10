import { IconAlert, IconClock, IconLock, IconSparkle } from "./icons";

const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap";

export function NewBadge() {
  return (
    <span className={`${base} bg-ucla-gold text-ucla-darkestblue ring-ucla-darkestgold`}>
      <IconSparkle size={12} /> New
    </span>
  );
}

export function PlaceholderBadge() {
  return (
    <span className={`${base} bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200`} title="Sample content for demonstration. Replace before use.">
      Sample content
    </span>
  );
}

export function DraftBadge({ label = "Draft (staff only)" }: { label?: string }) {
  return <span className={`${base} bg-slate-800 text-white ring-slate-800`}>{label}</span>;
}

export function PendingBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${base} bg-amber-50 text-amber-900 ring-amber-300`}>
      <IconClock size={12} /> {children}
    </span>
  );
}

export function MissingBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${base} bg-slate-100 text-slate-600 ring-slate-300`}>
      <IconAlert size={12} /> {children}
    </span>
  );
}

export function LockBadge({ children = "UCLA login" }: { children?: React.ReactNode }) {
  return (
    <span className={`${base} bg-ucla-lighterblue text-ucla-darkestblue ring-ucla-lightblue`}>
      <IconLock size={12} /> {children}
    </span>
  );
}

export function KindBadge({ children }: { children: React.ReactNode }) {
  return <span className={`${base} bg-white text-ucla-darkblue ring-ucla-lightblue`}>{children}</span>;
}

export function CoverageBadge({ state, label }: { state: string; label?: string }) {
  if (state === "covered")
    return <span className={`${base} bg-emerald-50 text-emerald-800 ring-emerald-200`}>✓ {label ?? "Covered"}</span>;
  if (state === "today") return <span className={`${base} bg-ucla-gold text-ucla-darkestblue ring-ucla-darkestgold`}>● Today</span>;
  if (state === "upcoming") return <span className={`${base} bg-white text-slate-600 ring-slate-300`}>Upcoming</span>;
  return null;
}
