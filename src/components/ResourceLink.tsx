import type { Resource } from "@prisma/client";
import { resourceState } from "@/lib/access";
import { RESOURCE_TYPE_LABEL, type ResourceType } from "@/lib/constants";
import { formatDateTime, formatDate } from "@/lib/dates";
import { formatBytes } from "@/lib/format";
import { providerName } from "@/lib/embed";
import { RESOURCE_STYLE } from "./resource-style";
import { IconClock, IconDownload, IconExternal, IconLock } from "./icons";

const chipBase =
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors";

/** A single slide deck / PDF / solution link, rendered according to its access state. */
export function ResourceLink({ r, staff, compact = false }: { r: Resource; staff: boolean; compact?: boolean }) {
  const st = resourceState(r, { staff });
  if (st.state === "hidden") return null;
  const style = RESOURCE_STYLE[r.type as ResourceType] ?? RESOURCE_STYLE.LINK;
  const { Icon } = style;
  const label = compact ? RESOURCE_TYPE_LABEL[r.type as ResourceType] ?? r.label : r.label;

  if (st.state === "scheduled") {
    return (
      <span className={`${chipBase} cursor-not-allowed bg-slate-50 text-slate-500 ring-slate-200`} title={`Available ${formatDateTime(st.releaseAt)}`}>
        <Icon size={15} />
        <span>{label}</span>
        <span className="inline-flex items-center gap-0.5 text-xs font-normal">
          <IconClock size={12} /> {compact ? formatDate(st.releaseAt) : `Available ${formatDateTime(st.releaseAt)}`}
        </span>
      </span>
    );
  }
  if (st.state === "unavailable") {
    return (
      <span className={`${chipBase} cursor-not-allowed border border-dashed border-slate-300 bg-white text-slate-500 ring-0`}>
        <Icon size={15} />
        <span>{label}</span>
        <span className="text-xs font-normal">· not yet posted</span>
      </span>
    );
  }

  const staffOnly = r.access === "STAFF";
  const extra = st.bruinLearn
    ? "Bruin Learn"
    : st.external
      ? providerName(st.href)
      : r.fileSize
        ? formatBytes(r.fileSize)
        : "";
  return (
    <a
      href={st.href}
      {...(st.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${chipBase} ${style.chip} hover:brightness-95 hover:underline`}
      aria-label={`${r.label}${extra ? ` (${extra})` : ""}${st.external ? ", opens in a new tab" : ""}`}
    >
      <Icon size={15} />
      <span>{label}</span>
      {!compact && extra && <span className="text-xs font-normal opacity-80">{extra}</span>}
      {st.bruinLearn ? <IconLock size={13} /> : st.external ? <IconExternal size={13} /> : <IconDownload size={13} />}
      {r.isPlaceholder && <span className="rounded bg-fuchsia-100 px-1 text-[10px] font-bold uppercase text-fuchsia-800">Sample</span>}
      {staffOnly && <span className="rounded bg-slate-800 px-1 text-[10px] font-bold uppercase text-white">Staff</span>}
    </a>
  );
}

/** The recording chip used in lists. Missing recordings are always labelled. */
export function RecordingChip({
  available,
  status,
  href,
  compact = false,
}: {
  available: boolean;
  status: string;
  href: string;
  compact?: boolean;
}) {
  const { Icon, chip } = RESOURCE_STYLE.RECORDING;
  if (available) {
    return (
      <a href={href} className={`${chipBase} ${chip} hover:brightness-95 hover:underline`}>
        <Icon size={15} /> {compact ? "Recording" : "Watch recording"}
      </a>
    );
  }
  if (status === "PENDING") {
    return (
      <span className={`${chipBase} bg-amber-50 text-amber-900 ring-amber-200`}>
        <IconClock size={15} /> Recording coming soon
      </span>
    );
  }
  if (status === "NOT_RECORDED") {
    return (
      <span className={`${chipBase} border border-dashed border-slate-300 bg-white text-slate-500 ring-0`}>
        <Icon size={15} /> Not recorded
      </span>
    );
  }
  return null;
}
