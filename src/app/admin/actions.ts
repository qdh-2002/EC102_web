"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, login, logout, requireStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import {
  ACCESS_LEVELS,
  ITEM_KINDS,
  ITEM_STATUSES,
  QUARTERS,
  RECORDING_STATUSES,
  RESERVED_SLUGS,
  RESOURCE_TYPES,
  ROLES,
  TERM_STATUSES,
} from "@/lib/constants";
import { parseCampusDateTime, daysBetween, addDays } from "@/lib/dates";
import { termSlug, weekForDate, termName } from "@/lib/terms";
import { deleteUpload, saveUpload } from "@/lib/storage";

// ---------- helpers ----------

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optInt = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === "" ? null : Number.parseInt(v, 10);
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

function back(path: string, params: Record<string, string>): never {
  const q = new URLSearchParams(params).toString();
  redirect(`${path}${path.includes("?") ? "&" : "?"}${q}`);
}

function zodMessage(e: z.ZodError) {
  return e.issues.map((i) => `${i.path.join(".") || "form"}: ${i.message}`).join("; ");
}

const urlOrEmpty = z
  .string()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "must start with http:// or https://");

function refresh() {
  // Content changes affect many public pages; revalidating the layout is simplest.
  revalidatePath("/", "layout");
}

async function cleanupFile(filePath: string) {
  if (!filePath) return;
  // Cloned terms can share files; only delete when nothing references it any more.
  const others = await prisma.resource.count({ where: { filePath } });
  if (others === 0) await deleteUpload(filePath);
}

// ---------- auth ----------

export async function loginAction(fd: FormData) {
  const email = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  const next = str(fd, "next");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const res = await login(email, password, ip);
  if (!res.ok) back("/admin/login", { error: res.error, ...(next ? { next } : {}) });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login?saved=signedout");
}

export async function changePasswordAction(fd: FormData) {
  const me = await requireStaff();
  const pw = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (pw.length < 10) back("/admin/account", { error: "Password must be at least 10 characters." });
  if (pw !== confirm) back("/admin/account", { error: "Passwords do not match." });
  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(pw) } });
  await audit(me.id, "update", "user", me.id, "changed own password");
  back("/admin/account", { saved: "Password updated." });
}

// ---------- items (lectures, discussions, homework, exams) ----------

const itemSchema = z.object({
  termId: z.string().min(1),
  kind: z.enum(ITEM_KINDS),
  number: z.number().int().min(0).max(999).nullable(),
  title: z.string().min(1, "is required").max(200),
  week: z.number().int().min(0).max(20).nullable(),
  date: z.date().nullable(),
  dueAt: z.date().nullable(),
  description: z.string().max(10000),
  topics: z.string().max(500),
  recordingUrl: urlOrEmpty,
  recordingStatus: z.enum(RECORDING_STATUSES),
  status: z.enum(ITEM_STATUSES),
  isPlaceholder: z.boolean(),
});

function readItem(fd: FormData) {
  return itemSchema.safeParse({
    termId: str(fd, "termId"),
    kind: str(fd, "kind"),
    number: optInt(fd, "number"),
    title: str(fd, "title"),
    week: optInt(fd, "week"),
    date: parseCampusDateTime(str(fd, "date")),
    dueAt: parseCampusDateTime(str(fd, "dueAt")),
    description: str(fd, "description"),
    topics: str(fd, "topics"),
    recordingUrl: str(fd, "recordingUrl"),
    recordingStatus: str(fd, "recordingStatus") || "NONE",
    status: str(fd, "status") || "DRAFT",
    isPlaceholder: bool(fd, "isPlaceholder"),
  });
}

export async function saveItemAction(fd: FormData) {
  const me = await requireStaff();
  const id = str(fd, "id");
  const parsed = readItem(fd);
  const from = id ? `/admin/items/${id}` : `/admin/items/new?term=${str(fd, "termId")}&kind=${str(fd, "kind")}`;
  if (!parsed.success) back(from, { error: zodMessage(parsed.error) });
  const data = parsed.data;
  const term = await prisma.term.findUnique({ where: { id: data.termId } });
  if (!term) back(from, { error: "Term not found." });
  if (data.week == null) data.week = weekForDate(term, data.date ?? data.dueAt);
  // Adding a recording link implies it is available.
  if (data.recordingUrl && data.recordingStatus === "NONE") data.recordingStatus = "AVAILABLE";

  if (id) {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) back("/admin/items", { error: "Item not found." });
    const publishedAt = data.status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt;
    await prisma.item.update({ where: { id }, data: { ...data, publishedAt } });
    await audit(me.id, "update", "item", id, data.title);
    refresh();
    back(`/admin/items/${id}`, { saved: "1" });
  } else {
    const created = await prisma.item.create({ data: { ...data, publishedAt: data.status === "PUBLISHED" ? new Date() : null } });
    await audit(me.id, "create", "item", created.id, data.title);
    refresh();
    back(`/admin/items/${created.id}`, { saved: "Created. Now add slides, notes, or other files below." });
  }
}

export async function setItemStatusAction(fd: FormData) {
  const me = await requireStaff();
  const id = str(fd, "id");
  const status = z.enum(ITEM_STATUSES).parse(str(fd, "status"));
  const returnTo = str(fd, "returnTo") || `/admin/items/${id}`;
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) back("/admin/items", { error: "Item not found." });
  await prisma.item.update({
    where: { id },
    data: { status, publishedAt: status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt },
  });
  await audit(me.id, status.toLowerCase(), "item", id, existing.title);
  refresh();
  back(returnTo, { saved: `Marked as ${status.toLowerCase()}.` });
}

export async function markItemNewAction(fd: FormData) {
  const me = await requireStaff();
  const id = str(fd, "id");
  await prisma.item.update({ where: { id }, data: { publishedAt: new Date() } });
  await audit(me.id, "update", "item", id, "re-flagged as new");
  refresh();
  back(`/admin/items/${id}`, { saved: "Item will show a “New” badge." });
}

export async function duplicateItemAction(fd: FormData) {
  const me = await requireStaff();
  const id = str(fd, "id");
  const src = await prisma.item.findUnique({ where: { id }, include: { resources: true } });
  if (!src) back("/admin/items", { error: "Item not found." });
  const copy = await prisma.item.create({
    data: {
      termId: src.termId,
      kind: src.kind,
      number: src.number != null ? src.number + 1 : null,
      title: `${src.title} (copy)`,
      week: src.week,
      description: src.description,
      topics: src.topics,
      status: "DRAFT",
      recordingStatus: src.kind === "LECTURE" || src.kind === "DISCUSSION" ? "PENDING" : "NONE",
      isPlaceholder: src.isPlaceholder,
    },
  });
  await audit(me.id, "create", "item", copy.id, `duplicated from ${src.title}`);
  back(`/admin/items/${copy.id}`, { saved: "Duplicated as a draft." });
}

export async function deleteItemAction(fd: FormData) {
  const me = await requireStaff("ADMIN");
  const id = str(fd, "id");
  const item = await prisma.item.findUnique({ where: { id }, include: { resources: true } });
  if (!item) back("/admin/items", { error: "Item not found." });
  await prisma.item.delete({ where: { id } });
  for (const r of item.resources) await cleanupFile(r.filePath);
  await audit(me.id, "delete", "item", id, item.title);
  refresh();
  back(`/admin/items?term=${item.termId}`, { saved: `Deleted “${item.title}”.` });
}

// ---------- resources (files and links attached to items) ----------

const resourceSchema = z.object({
  type: z.enum(RESOURCE_TYPES),
  label: z.string().min(1, "is required").max(200),
  url: urlOrEmpty,
  access: z.enum(ACCESS_LEVELS),
  releaseAt: z.date().nullable(),
  sortOrder: z.number().int(),
});

function readResource(fd: FormData) {
  return resourceSchema.safeParse({
    type: str(fd, "type"),
    label: str(fd, "label"),
    url: str(fd, "url"),
    access: str(fd, "access") || "PUBLIC",
    releaseAt: parseCampusDateTime(str(fd, "releaseAt")),
    sortOrder: optInt(fd, "sortOrder") ?? 0,
  });
}

export async function addResourceAction(fd: FormData) {
  const me = await requireStaff();
  const itemId = str(fd, "itemId");
  const from = `/admin/items/${itemId}`;
  const item = await prisma.item.findUnique({ where: { id: itemId }, include: { term: true, resources: true } });
  if (!item) back("/admin/items", { error: "Item not found." });
  const parsed = readResource(fd);
  if (!parsed.success) back(from, { error: zodMessage(parsed.error) });
  const data = parsed.data;
  const file = fd.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && !data.url) back(from, { error: "Upload a file or paste a link." });
  if (data.access === "BRUIN_LEARN" && !data.url) back(from, { error: "Bruin Learn-only materials need a Bruin Learn link so students can reach them." });

  let fileData = {};
  if (hasFile) {
    try {
      const saved = await saveUpload(file, item.term.slug);
      fileData = { filePath: saved.relPath, fileName: saved.name, fileSize: saved.size, mimeType: saved.mime };
    } catch (e) {
      back(from, { error: (e as Error).message });
    }
  }
  const sortOrder = data.sortOrder || (Math.max(0, ...item.resources.map((r) => r.sortOrder)) + 1);
  await prisma.resource.create({ data: { ...data, sortOrder, itemId, ...fileData } });
  // New uploads on a published item show the "New" badge.
  if (item.status === "PUBLISHED") await prisma.item.update({ where: { id: itemId }, data: { publishedAt: new Date() } });
  await audit(me.id, "create", "resource", itemId, `${data.label} on ${item.title}`);
  refresh();
  back(from, { saved: `Added “${data.label}”.` });
}

export async function updateResourceAction(fd: FormData) {
  const me = await requireStaff();
  const id = str(fd, "id");
  const r = await prisma.resource.findUnique({ where: { id }, include: { item: { include: { term: true } } } });
  if (!r) back("/admin/items", { error: "Resource not found." });
  const from = `/admin/items/${r.itemId}`;
  const parsed = readResource(fd);
  if (!parsed.success) back(from, { error: zodMessage(parsed.error) });
  const data = parsed.data;
  const file = fd.get("file");
  let fileData = {};
  if (file instanceof File && file.size > 0) {
    try {
      const saved = await saveUpload(file, r.item.term.slug);
      fileData = { filePath: saved.relPath, fileName: saved.name, fileSize: saved.size, mimeType: saved.mime };
    } catch (e) {
      back(from, { error: (e as Error).message });
    }
  }
  if (!data.url && !r.filePath && !("filePath" in fileData)) back(from, { error: "A resource needs a file or a link." });
  if (data.access === "BRUIN_LEARN" && !data.url) back(from, { error: "Bruin Learn-only materials need a Bruin Learn link." });
  await prisma.resource.update({ where: { id }, data: { ...data, ...fileData } });
  if ("filePath" in fileData && r.filePath) await cleanupFile(r.filePath);
  await audit(me.id, "update", "resource", id, data.label);
  refresh();
  back(from, { saved: `Updated “${data.label}”.` });
}

export async function deleteResourceAction(fd: FormData) {
  const me = await requireStaff();
  const id = str(fd, "id");
  const r = await prisma.resource.findUnique({ where: { id } });
  if (!r) back("/admin/items", { error: "Resource not found." });
  await prisma.resource.delete({ where: { id } });
  await cleanupFile(r.filePath);
  await audit(me.id, "delete", "resource", id, r.label);
  refresh();
  back(`/admin/items/${r.itemId}`, { saved: `Removed “${r.label}”.` });
}

// ---------- announcements ----------

const announcementSchema = z.object({
  termId: z.string().min(1),
  title: z.string().min(1, "is required").max(200),
  body: z.string().min(1, "is required").max(10000),
  pinned: z.boolean(),
  status: z.enum(ITEM_STATUSES),
  publishedAt: z.date(),
});

export async function saveAnnouncementAction(fd: FormData) {
  const me = await requireStaff();
  const id = str(fd, "id");
  const parsed = announcementSchema.safeParse({
    termId: str(fd, "termId"),
    title: str(fd, "title"),
    body: str(fd, "body"),
    pinned: bool(fd, "pinned"),
    status: str(fd, "status") || "PUBLISHED",
    publishedAt: parseCampusDateTime(str(fd, "publishedAt")) ?? new Date(),
  });
  const from = id ? `/admin/announcements/${id}` : "/admin/announcements";
  if (!parsed.success) back(from, { error: zodMessage(parsed.error) });
  if (id) {
    await prisma.announcement.update({ where: { id }, data: parsed.data });
    await audit(me.id, "update", "announcement", id, parsed.data.title);
  } else {
    const a = await prisma.announcement.create({ data: parsed.data });
    await audit(me.id, "create", "announcement", a.id, parsed.data.title);
  }
  refresh();
  back("/admin/announcements", { saved: "Announcement saved." });
}

export async function deleteAnnouncementAction(fd: FormData) {
  const me = await requireStaff();
  const id = str(fd, "id");
  const a = await prisma.announcement.delete({ where: { id } });
  await audit(me.id, "delete", "announcement", id, a.title);
  refresh();
  back("/admin/announcements", { saved: "Announcement deleted." });
}

// ---------- terms ----------

const termSchema = z.object({
  quarter: z.enum(QUARTERS),
  year: z.number().int().min(2000).max(2100),
  startDate: z.date().nullable(), // null = term with no calendar
  numWeeks: z.number().int().min(1).max(15),
  status: z.enum(TERM_STATUSES),
  instructors: z.string().max(5000),
  overview: z.string().max(5000),
  logistics: z.string().max(5000),
  bruinLearnUrl: urlOrEmpty,
  syllabusUrl: urlOrEmpty,
  quickLinks: z.string().max(3000),
});

function readTerm(fd: FormData) {
  const noCalendar = bool(fd, "noCalendar");
  return termSchema
    .refine((t) => noCalendar || t.startDate, { message: "Week 1 Monday is required (or tick “No calendar”).", path: ["startDate"] })
    .safeParse({
    quarter: str(fd, "quarter"),
    year: optInt(fd, "year"),
    startDate: noCalendar ? null : parseCampusDateTime(str(fd, "startDate")),
    numWeeks: optInt(fd, "numWeeks") ?? 10,
    status: str(fd, "status") || "DRAFT",
    instructors: str(fd, "instructors"),
    overview: str(fd, "overview"),
    logistics: str(fd, "logistics"),
    bruinLearnUrl: str(fd, "bruinLearnUrl") || "https://bruinlearn.ucla.edu/",
    syllabusUrl: str(fd, "syllabusUrl"),
    quickLinks: str(fd, "quickLinks"),
  });
}

async function saveWeeks(termId: string, fd: FormData, numWeeks: number) {
  for (let n = 1; n <= numWeeks + 1; n++) {
    const topic = str(fd, `week-${n}`);
    await prisma.week.upsert({
      where: { termId_number: { termId, number: n } },
      update: { topic },
      create: { termId, number: n, topic },
    });
  }
  await prisma.week.deleteMany({ where: { termId, number: { gt: numWeeks + 1 } } });
}

async function makeCurrent(termId: string) {
  await prisma.$transaction([
    prisma.term.updateMany({ where: { id: { not: termId } }, data: { isCurrent: false } }),
    prisma.term.update({ where: { id: termId }, data: { isCurrent: true, status: "ACTIVE" } }),
  ]);
}

export async function saveTermAction(fd: FormData) {
  const me = await requireStaff("ADMIN");
  const id = str(fd, "id");
  const from = id ? `/admin/terms/${id}` : "/admin/terms/new";
  const parsed = readTerm(fd);
  if (!parsed.success) back(from, { error: zodMessage(parsed.error) });
  const data = parsed.data;
  const slug = termSlug(data.quarter, data.year);
  if (RESERVED_SLUGS.includes(slug)) back(from, { error: "Invalid term." });
  const clash = await prisma.term.findUnique({ where: { slug } });
  if (clash && clash.id !== id) back(from, { error: `${termName(data)} already exists.` });

  let termId = id;
  if (id) {
    await prisma.term.update({ where: { id }, data: { ...data, slug } });
    await audit(me.id, "update", "term", id, termName(data));
  } else {
    const t = await prisma.term.create({ data: { ...data, slug } });
    termId = t.id;
    await audit(me.id, "create", "term", t.id, termName(data));
  }
  await saveWeeks(termId, fd, data.numWeeks);
  if (bool(fd, "isCurrent")) await makeCurrent(termId);
  refresh();
  back(`/admin/terms/${termId}`, { saved: "Term saved." });
}

export async function setCurrentTermAction(fd: FormData) {
  const me = await requireStaff("ADMIN");
  const id = str(fd, "id");
  await makeCurrent(id);
  await audit(me.id, "update", "term", id, "set as current term");
  refresh();
  back("/admin/terms", { saved: "Current term updated. Students now land on this term by default." });
}

export async function archiveTermAction(fd: FormData) {
  const me = await requireStaff("ADMIN");
  const id = str(fd, "id");
  const status = z.enum(TERM_STATUSES).parse(str(fd, "status"));
  await prisma.term.update({ where: { id }, data: { status, ...(status !== "ACTIVE" ? { isCurrent: false } : {}) } });
  await audit(me.id, "update", "term", id, `status → ${status}`);
  refresh();
  back("/admin/terms", { saved: `Term marked ${status.toLowerCase()}.` });
}

/**
 * Start a new quarter from a previous one: copies week topics, every item (as a
 * draft, with dates shifted to the new calendar) and, optionally, attached files
 * and links. Recording links are kept (one recording per lecture, reused every year).
 */
export async function cloneTermAction(fd: FormData) {
  const me = await requireStaff("ADMIN");
  const sourceId = str(fd, "sourceId");
  const from = "/admin/terms/new";
  const parsed = readTerm(fd);
  if (!parsed.success) back(from, { error: zodMessage(parsed.error) });
  const data = parsed.data;
  const source = await prisma.term.findUnique({ where: { id: sourceId }, include: { weeks: true, items: { include: { resources: true } } } });
  if (!source) back(from, { error: "Source term not found." });
  const slug = termSlug(data.quarter, data.year);
  if (await prisma.term.findUnique({ where: { slug } })) back(from, { error: `${termName(data)} already exists.` });
  const copyResources = bool(fd, "copyResources");
  // Shift dates onto the new calendar. A new term with no calendar gets no dates; a source with
  // no calendar has nothing to shift from, so its (normally empty) dates are kept as they are.
  const newStart = data.startDate;
  const offset = source.startDate && newStart ? daysBetween(source.startDate, newStart) : 0;
  const shift = (d: Date | null) => (!newStart ? null : d ? addDays(d, offset) : null);

  const term = await prisma.term.create({
    data: {
      ...data,
      slug,
      instructors: data.instructors || source.instructors,
      overview: data.overview || source.overview,
      logistics: data.logistics || source.logistics,
      syllabusUrl: data.syllabusUrl,
      quickLinks: data.quickLinks || source.quickLinks,
      weeks: { create: source.weeks.map((w) => ({ number: w.number, topic: w.topic, notes: w.notes })) },
    },
  });
  for (const it of source.items.filter((i) => i.status !== "ARCHIVED")) {
    await prisma.item.create({
      data: {
        termId: term.id,
        kind: it.kind,
        number: it.number,
        title: it.title,
        week: it.week,
        date: shift(it.date),
        dueAt: shift(it.dueAt),
        description: it.description,
        topics: it.topics,
        // One recording per lecture is kept and reused every year, so links carry over.
        recordingUrl: it.recordingUrl,
        recordingStatus:
          it.recordingUrl || it.resources.some((r) => r.type === "VIDEO" && r.filePath)
            ? it.recordingStatus
            : it.kind === "LECTURE" || it.kind === "DISCUSSION"
              ? "PENDING"
              : "NONE",
        status: "DRAFT",
        isPlaceholder: it.isPlaceholder,
        resources: {
              create: it.resources.filter((r) => copyResources || r.type === "VIDEO" || r.type === "CAPTIONS").map((r) => ({
                type: r.type,
                label: r.label,
                url: r.url,
                filePath: r.filePath,
                fileName: r.fileName,
                fileSize: r.fileSize,
                mimeType: r.mimeType,
                access: r.access,
                releaseAt: shift(r.releaseAt),
                sortOrder: r.sortOrder,
                isPlaceholder: r.isPlaceholder,
              })),
            },
      },
    });
  }
  await audit(me.id, "create", "term", term.id, `cloned from ${termName(source)}`);
  refresh();
  back(`/admin/terms/${term.id}`, {
    saved: `Created ${termName(data)} from ${termName(source)}: ${source.items.length} items copied as drafts. Review dates, then publish items as the quarter goes.`,
  });
}

export async function deleteTermAction(fd: FormData) {
  const me = await requireStaff("ADMIN");
  const id = str(fd, "id");
  const confirm = str(fd, "confirm");
  const term = await prisma.term.findUnique({ where: { id }, include: { items: { include: { resources: true } } } });
  if (!term) back("/admin/terms", { error: "Term not found." });
  if (confirm !== term.slug) back(`/admin/terms/${id}`, { error: `Type ${term.slug} to confirm deletion.` });
  const files = term.items.flatMap((i) => i.resources.map((r) => r.filePath)).filter(Boolean);
  await prisma.term.delete({ where: { id } });
  for (const f of files) await cleanupFile(f);
  await audit(me.id, "delete", "term", id, termName(term));
  refresh();
  back("/admin/terms", { saved: `Deleted ${termName(term)}.` });
}

// ---------- sample content ----------

export async function deleteSampleContentAction() {
  const me = await requireStaff("ADMIN");
  const items = await prisma.item.findMany({ where: { isPlaceholder: true }, include: { resources: true } });
  const sampleFiles = await prisma.resource.findMany({ where: { isPlaceholder: true } });
  await prisma.item.deleteMany({ where: { isPlaceholder: true } });
  await prisma.resource.deleteMany({ where: { isPlaceholder: true } });
  await prisma.announcement.deleteMany({ where: { isPlaceholder: true } });
  // Sample-only terms (every item was sample content) are removed too.
  await prisma.term.deleteMany({ where: { isSample: true } });
  const paths = [...items.flatMap((i) => i.resources.map((r) => r.filePath)), ...sampleFiles.map((r) => r.filePath)].filter(Boolean);
  for (const f of new Set(paths)) await cleanupFile(f);
  await audit(me.id, "delete", "item", "", `removed ${items.length} sample items`);
  refresh();
  back("/admin", { saved: `Removed ${items.length} sample items, ${sampleFiles.length} sample files, sample announcements and the sample archive term. Real schedule entries were kept.` });
}

// ---------- users ----------

const userSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(100),
  role: z.enum(ROLES),
});

export async function createUserAction(fd: FormData) {
  const me = await requireStaff("ADMIN");
  const parsed = userSchema.safeParse({ email: str(fd, "email").toLowerCase(), name: str(fd, "name"), role: str(fd, "role") });
  if (!parsed.success) back("/admin/users", { error: zodMessage(parsed.error) });
  const pw = String(fd.get("password") ?? "");
  if (pw.length < 10) back("/admin/users", { error: "Temporary password must be at least 10 characters." });
  if (await prisma.user.findUnique({ where: { email: parsed.data.email } })) back("/admin/users", { error: "An account with that email already exists." });
  const u = await prisma.user.create({ data: { ...parsed.data, passwordHash: await hashPassword(pw) } });
  await audit(me.id, "create", "user", u.id, `${u.email} as ${u.role}`);
  back("/admin/users", { saved: `Account created for ${u.email}. Share the temporary password privately and ask them to change it.` });
}

export async function updateUserAction(fd: FormData) {
  const me = await requireStaff("ADMIN");
  const id = str(fd, "id");
  const role = z.enum(ROLES).parse(str(fd, "role"));
  const active = bool(fd, "active");
  if (id === me.id && (role !== "ADMIN" || !active)) back("/admin/users", { error: "You cannot demote or deactivate your own account." });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) back("/admin/users", { error: "User not found." });
  if (target.role === "ADMIN" && (role !== "ADMIN" || !active)) {
    const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } });
    if (admins <= 1) back("/admin/users", { error: "There must be at least one active admin." });
  }
  const pw = String(fd.get("password") ?? "");
  if (pw && pw.length < 10) back("/admin/users", { error: "New password must be at least 10 characters." });
  await prisma.user.update({ where: { id }, data: { role, active, ...(pw ? { passwordHash: await hashPassword(pw) } : {}) } });
  await audit(me.id, "update", "user", id, `${target.email}: role ${role}, ${active ? "active" : "deactivated"}${pw ? ", password reset" : ""}`);
  back("/admin/users", { saved: `Updated ${target.email}.` });
}
