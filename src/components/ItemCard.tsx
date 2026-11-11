import Link from "next/link";
import type { ItemWithResources } from "@/lib/queries";
import { hasRecording, isNew } from "@/lib/access";
import { formatDate, formatDateTime } from "@/lib/dates";
import { ITEM_KIND_LABEL, type ItemKind } from "@/lib/constants";
import { itemHref } from "@/lib/links";
import { coverage, weekLabel } from "@/lib/terms";
import { splitTopics } from "@/lib/format";
import { ResourceLink, RecordingChip } from "./ResourceLink";
import { CoverageBadge, DraftBadge, MissingBadge, NewBadge, PlaceholderBadge } from "./badges";

type Props = {
  item: ItemWithResources;
  termSlug: string;
  numWeeks: number;
  staff: boolean;
  showWeek?: boolean;
  showKind?: boolean;
  termLabel?: string;
};

export function itemHeading(item: { kind: string; number: number | null; title: string }) {
  const prefix = item.number != null ? `${ITEM_KIND_LABEL[item.kind as ItemKind] ?? item.kind} ${item.number}` : "";
  return { prefix, title: item.title };
}

/** The standard card used for every lecture, discussion, homework and exam in lists. */
export function ItemCard({ item, termSlug, numWeeks, staff, showWeek = false, showKind = false, termLabel }: Props) {
  const href = itemHref(termSlug, item);
  const { prefix, title } = itemHeading(item);
  const visibleRes = item.resources.filter((r) => staff || r.access !== "STAFF");
  const hasRecordingSlot = item.kind === "LECTURE" || item.kind === "DISCUSSION";
  const nothingYet = visibleRes.length === 0 && !hasRecording(item);

  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-ucla-lightblue hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {termLabel && <span className="text-ucla-darkblue">{termLabel}</span>}
        {showKind && <span>{ITEM_KIND_LABEL[item.kind as ItemKind]}</span>}
        {showWeek && item.week != null && <span>{weekLabel(item.week, numWeeks)}</span>}
        {item.date && (
          <time dateTime={item.date.toISOString()} className="normal-case tracking-normal">
            {formatDate(item.date)}
          </time>
        )}
        <span className="ml-auto flex flex-wrap gap-1.5 normal-case tracking-normal">
          {hasRecordingSlot && <CoverageBadge state={coverage(item.date)} label="Covered in class" />}
          {isNew(item.publishedAt) && item.status === "PUBLISHED" && <NewBadge />}
          {item.status === "DRAFT" && <DraftBadge />}
          {item.isPlaceholder && <PlaceholderBadge />}
        </span>
      </div>
      <h3 className="mt-1.5 text-base font-semibold leading-snug text-slate-900 sm:text-lg">
        <Link href={href} className="hover:text-ucla-blue hover:underline focus-visible:underline">
          {prefix && <span className="text-ucla-blue">{prefix}: </span>}
          {title}
        </Link>
      </h3>
      {item.dueAt && (
        <p className="mt-1 text-sm text-slate-700">
          <span className="font-medium">{item.kind === "HOMEWORK" ? "Due" : "When"}:</span>{" "}
          <time dateTime={item.dueAt.toISOString()}>{formatDateTime(item.dueAt)}</time>
        </p>
      )}
      {item.topics && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Topics">
          {splitTopics(item.topics).slice(0, 5).map((t) => (
            <li key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
              {t}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {hasRecordingSlot && <RecordingChip available={hasRecording(item)} status={item.recordingStatus} href={href} compact />}
        {visibleRes.filter((r) => !(hasRecordingSlot && r.type === "VIDEO" && r.filePath) && r.type !== "CAPTIONS").map((r) => (
          <ResourceLink key={r.id} r={r} staff={staff} compact />
        ))}
        {nothingYet && !hasRecordingSlot && <MissingBadge>Materials not yet posted</MissingBadge>}
        {nothingYet && hasRecordingSlot && item.recordingStatus === "NONE" && <MissingBadge>Materials not yet posted</MissingBadge>}
      </div>
    </article>
  );
}
