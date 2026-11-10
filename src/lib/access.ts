import { NEW_BADGE_DAYS } from "./constants";
import { DAY_MS } from "./dates";

/**
 * Rules for what a student (not signed in) may see. Staff see everything,
 * with labels. Keeping this logic in one file makes it easy to audit.
 */

export type ResourceLike = {
  url: string;
  filePath: string;
  access: string;
  releaseAt: Date | null;
};

export type ResourceState =
  | { state: "available"; href: string; external: boolean; bruinLearn: boolean }
  | { state: "scheduled"; releaseAt: Date }
  | { state: "unavailable" }
  | { state: "hidden" };

export function resourceState(r: ResourceLike & { id: string }, opts: { staff: boolean; now?: Date }): ResourceState {
  const now = opts.now ?? new Date();
  if (r.access === "STAFF" && !opts.staff) return { state: "hidden" };
  if (!opts.staff && r.releaseAt && r.releaseAt > now) return { state: "scheduled", releaseAt: r.releaseAt };
  if (r.filePath) {
    // Uploaded files with Bruin Learn-only access are never served publicly;
    // staff should link to the Bruin Learn copy instead.
    if (r.access === "BRUIN_LEARN" && !opts.staff) {
      return r.url ? { state: "available", href: r.url, external: true, bruinLearn: true } : { state: "unavailable" };
    }
    return { state: "available", href: `/files/${r.id}`, external: false, bruinLearn: false };
  }
  if (r.url) return { state: "available", href: r.url, external: true, bruinLearn: r.access === "BRUIN_LEARN" };
  return { state: "unavailable" };
}

/** Can an anonymous visitor download this uploaded file right now? */
export function canDownloadPublicly(
  r: ResourceLike,
  item: { status: string },
  term: { status: string },
  now = new Date(),
): boolean {
  if (term.status === "DRAFT") return false;
  if (item.status !== "PUBLISHED") return false;
  if (r.access !== "PUBLIC") return false;
  if (r.releaseAt && r.releaseAt > now) return false;
  return true;
}

export function isNew(publishedAt: Date | null | undefined, now = new Date()): boolean {
  if (!publishedAt) return false;
  const age = now.getTime() - publishedAt.getTime();
  return age >= 0 && age < NEW_BADGE_DAYS * DAY_MS;
}

type RecItem = { recordingStatus: string; recordingUrl: string; resources: { type: string; filePath: string; access: string }[] };

/** The uploaded recording video for an item, if any (played in-page, never downloaded). */
export function recordingVideo<R extends { type: string; filePath: string; access: string }>(item: { resources: R[] }, staff = false): R | null {
  return item.resources.find((r) => r.type === "VIDEO" && r.filePath && (r.access === "PUBLIC" || staff)) ?? null;
}

/** Does this item have a watchable recording (a link or an uploaded video)? */
export function hasRecording(item: RecItem) {
  return item.recordingStatus === "AVAILABLE" && (!!item.recordingUrl || !!recordingVideo(item));
}
