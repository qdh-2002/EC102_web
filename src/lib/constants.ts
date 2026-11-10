// Central list of every "enum" value used by the site. Adding a new resource type
// or item kind only requires editing this file.

export const QUARTERS = ["FALL", "WINTER", "SPRING", "SUMMER"] as const;
export type Quarter = (typeof QUARTERS)[number];
export const QUARTER_LABEL: Record<Quarter, string> = {
  FALL: "Fall",
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
};
// Order within an academic year for sorting (Fall 2026 comes after Spring 2026).
export const QUARTER_ORDER: Record<Quarter, number> = { WINTER: 0, SPRING: 1, SUMMER: 2, FALL: 3 };

export const TERM_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type TermStatus = (typeof TERM_STATUSES)[number];

export const ITEM_KINDS = ["LECTURE", "DISCUSSION", "HOMEWORK", "EXAM", "REVIEW"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];
export const ITEM_KIND_LABEL: Record<ItemKind, string> = {
  LECTURE: "Lecture",
  DISCUSSION: "Discussion",
  HOMEWORK: "Homework",
  EXAM: "Exam",
  REVIEW: "Review / Practice",
};
export const ITEM_KIND_PLURAL: Record<ItemKind, string> = {
  LECTURE: "Lectures",
  DISCUSSION: "Discussions",
  HOMEWORK: "Homework",
  EXAM: "Exams",
  REVIEW: "Review & practice",
};

export const ITEM_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const RECORDING_STATUSES = ["AVAILABLE", "PENDING", "NONE", "NOT_RECORDED"] as const;
export type RecordingStatus = (typeof RECORDING_STATUSES)[number];
export const RECORDING_STATUS_LABEL: Record<RecordingStatus, string> = {
  AVAILABLE: "Recording available",
  PENDING: "Recording coming soon",
  NONE: "No recording",
  NOT_RECORDED: "Not recorded",
};

export const RESOURCE_TYPES = [
  "SLIDES",
  "NOTES",
  "HANDOUT",
  "PROBLEMS",
  "SOLUTIONS",
  "FORMULA_SHEET",
  "VIDEO",
  "CAPTIONS",
  "CODE",
  "LINK",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];
export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  SLIDES: "Slides",
  NOTES: "Notes",
  HANDOUT: "Handout",
  PROBLEMS: "Problems",
  SOLUTIONS: "Solutions",
  FORMULA_SHEET: "Formula sheet",
  VIDEO: "Video",
  CAPTIONS: "Captions (.vtt)",
  CODE: "Code",
  LINK: "Link",
};

export const ACCESS_LEVELS = ["PUBLIC", "BRUIN_LEARN", "STAFF"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];
export const ACCESS_LABEL: Record<AccessLevel, string> = {
  PUBLIC: "Public on this site",
  BRUIN_LEARN: "Bruin Learn only (UCLA login)",
  STAFF: "Course staff only",
};

export const ROLES = ["ADMIN", "EDITOR"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin (instructor / site manager)",
  EDITOR: "Editor (TA / content staff)",
};

/** Items published within this many days get a "New" badge. */
export const NEW_BADGE_DAYS = 7;

/** All dates are shown in campus time. */
export const COURSE_TIMEZONE = "America/Los_Angeles";

export const COURSE = {
  code: "EC ENGR 102",
  name: "Signals and Systems",
  shortCode: "ECE 102",
  department: "Electrical and Computer Engineering",
  institution: "UCLA Samueli School of Engineering",
};

/** URL segments that can never be used as a term slug. */
export const RESERVED_SLUGS = ["admin", "api", "search", "archive", "files", "login", "about", "_next"];

/**
 * Keep the site simple: by default it is a lecture recordings + slides site.
 * Flip these to true to bring back discussions, the homework/exams section or announcements
 * (all the code is still there).
 */
export const FEATURES = {
  discussions: false,
  homeworkAndExams: false,
  announcements: false,
};

/** Item kinds staff can create and students can browse. */
export const ENABLED_KINDS: readonly ItemKind[] = ITEM_KINDS.filter(
  (k) => k === "LECTURE" || (k === "DISCUSSION" && FEATURES.discussions) || (k !== "DISCUSSION" && FEATURES.homeworkAndExams),
);

/** Resource types offered in the admin and search. */
export const ENABLED_RESOURCE_TYPES: readonly ResourceType[] = FEATURES.homeworkAndExams
  ? RESOURCE_TYPES
  : ["SLIDES", "NOTES", "VIDEO", "CAPTIONS", "LINK"];
