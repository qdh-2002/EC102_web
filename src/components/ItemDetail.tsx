import Link from "next/link";
import type { Term } from "@prisma/client";
import type { ItemWithResources } from "@/lib/queries";
import { ITEM_KIND_LABEL, RECORDING_STATUS_LABEL, type ItemKind, type RecordingStatus } from "@/lib/constants";
import { formatDate, formatDateTime, formatLongDate } from "@/lib/dates";
import { coverage, weekLabel } from "@/lib/terms";
import { hasRecording, isNew, recordingVideo, resourceState } from "@/lib/access";
import { VideoPlayer } from "./VideoPlayer";
import { splitTopics } from "@/lib/format";
import { sectionForKind } from "@/lib/links";
import { itemHeading } from "./ItemCard";
import { RecordingPlayer } from "./RecordingPlayer";
import { ResourceLink } from "./ResourceLink";
import { CoverageBadge, DraftBadge, KindBadge, MissingBadge, NewBadge, PlaceholderBadge } from "./badges";
import { IconExternal, IconPencil } from "./icons";

const hasRecordingSlot = (kind: string) => kind === "LECTURE" || kind === "DISCUSSION";

export function ItemDetail({ item, term, staff, siblings }: { item: ItemWithResources; term: Term; staff: boolean; siblings: { id: string; title: string; number: number | null; kind: string }[] }) {
  const h = itemHeading(item);
  const section = sectionForKind(item.kind);
  const mainVideo = hasRecordingSlot(item.kind) ? recordingVideo({ resources: item.resources.filter((r) => resourceState(r, { staff }).state === "available") }, staff) : null;
  const captions = item.resources.find((r) => r.type === "CAPTIONS" && r.filePath && resourceState(r, { staff }).state === "available");
  const resources = item.resources.filter((r) => resourceState(r, { staff }).state !== "hidden" && r.id !== mainVideo?.id && r.type !== "CAPTIONS");
  const idx = siblings.findIndex((s) => s.id === item.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const sectionLabel = section === "lectures" ? "Lectures" : section === "discussions" ? "Discussions" : "Homework & Exams";

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href={`/${term.slug}/${section}`} className="hover:text-ucla-blue hover:underline">
              {sectionLabel}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>{weekLabel(item.week, term.numWeeks)}</li>
        </ol>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge>{ITEM_KIND_LABEL[item.kind as ItemKind]}</KindBadge>
          {hasRecordingSlot(item.kind) && <CoverageBadge state={coverage(item.date)} label="Covered in class" />}
          {isNew(item.publishedAt) && item.status === "PUBLISHED" && <NewBadge />}
          {item.status === "DRAFT" && <DraftBadge />}
          {item.isPlaceholder && <PlaceholderBadge />}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ucla-darkestblue sm:text-3xl">
          {h.prefix && <span className="text-ucla-blue">{h.prefix}: </span>}
          {h.title}
        </h1>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <div className="flex gap-1">
            <dt className="font-medium text-slate-800">Week:</dt>
            <dd>{weekLabel(item.week, term.numWeeks)}</dd>
          </div>
          {item.date && (
            <div className="flex gap-1">
              <dt className="font-medium text-slate-800">{item.kind === "HOMEWORK" ? "Released:" : "Date:"}</dt>
              <dd>
                <time dateTime={item.date.toISOString()}>{formatLongDate(item.date)}</time>
              </dd>
            </div>
          )}
          {item.dueAt && (
            <div className="flex gap-1">
              <dt className="font-medium text-slate-800">{item.kind === "HOMEWORK" ? "Due:" : "Time:"}</dt>
              <dd>
                <time dateTime={item.dueAt.toISOString()}>{formatDateTime(item.dueAt)}</time>
              </dd>
            </div>
          )}
          {hasRecordingSlot(item.kind) && (
            <div className="flex gap-1">
              <dt className="font-medium text-slate-800">Recording:</dt>
              <dd>{RECORDING_STATUS_LABEL[item.recordingStatus as RecordingStatus]}</dd>
            </div>
          )}
        </dl>
        {staff && (
          <Link href={`/admin/items/${item.id}`} className="btn-secondary mt-4">
            <IconPencil size={14} /> Edit in admin
          </Link>
        )}
      </header>

      {hasRecordingSlot(item.kind) && coverage(item.date) === "upcoming" && hasRecording(item) && (
        <p className="rounded-lg border border-ucla-lightblue bg-ucla-lighterblue px-4 py-2 text-sm text-ucla-darkestblue">
          We have not covered this in class yet this quarter. The recording below is from our recording library, so you can preview it early.
        </p>
      )}
      {hasRecordingSlot(item.kind) && (item.recordingStatus !== "NONE" || mainVideo) && (
        <section aria-label="Recording">
          <RecordingPlayer
            url={item.recordingUrl}
            status={mainVideo ? "AVAILABLE" : item.recordingStatus}
            title={item.title}
            video={mainVideo ? { src: `/files/${mainVideo.id}`, captions: captions ? `/files/${captions.id}` : undefined, key: mainVideo.id } : null}
          />
        </section>
      )}

      {item.description && (
        <section aria-labelledby="about" className="card p-5">
          <h2 id="about" className="font-bold text-ucla-darkestblue">
            Overview
          </h2>
          <div className="prose-course mt-1 whitespace-pre-line text-slate-700">{item.description}</div>
          {item.topics && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Topics">
              {splitTopics(item.topics).map((t) => (
                <li key={t}>
                  <Link href={`/search?q=${encodeURIComponent(t)}&term=all`} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-ucla-lighterblue">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="materials">
        <h2 id="materials" className="mb-3 font-bold text-ucla-darkestblue">
          Materials
        </h2>
        {resources.length ? (
          <ul className="card divide-y divide-slate-100">
            {resources.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
                {r.type === "VIDEO" && r.filePath && resourceState(r, { staff }).state === "available" ? (
                  <div className="w-full space-y-2">
                    <p className="text-sm font-medium text-slate-800">{r.label}</p>
                    <VideoPlayer src={`/files/${r.id}`} title={r.label} storageKey={r.id} />
                  </div>
                ) : (
                  <ResourceLink r={r} staff={staff} />
                )}
                {r.releaseAt && staff && <span className="text-xs text-slate-500">Releases {formatDateTime(r.releaseAt)}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <MissingBadge>No materials posted yet</MissingBadge>
        )}
        {(item.kind === "HOMEWORK" || item.kind === "EXAM") && (
          <p className="mt-3 text-sm text-slate-600">
            Submit work and view grades on{" "}
            <a href={term.bruinLearnUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ucla-blue underline">
              Bruin Learn <IconExternal size={12} />
            </a>
            .
          </p>
        )}
      </section>

      {(prev || next) && (
        <nav aria-label="Previous and next" className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
          {prev ? (
            <Link href={`/${term.slug}/${section}/${prev.id}`} className="card flex-1 p-3 text-sm hover:border-ucla-blue">
              <span className="block text-xs text-slate-500">← Previous</span>
              <span className="font-medium text-slate-900">{itemHeading(prev).prefix || prev.title}</span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link href={`/${term.slug}/${section}/${next.id}`} className="card flex-1 p-3 text-right text-sm hover:border-ucla-blue">
              <span className="block text-xs text-slate-500">Next →</span>
              <span className="font-medium text-slate-900">{itemHeading(next).prefix || next.title}</span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      )}
      <p className="sr-only">Last updated {formatDate(item.updatedAt)}</p>
    </article>
  );
}
