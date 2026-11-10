import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

/**
 * Uploaded course files live on disk under UPLOAD_DIR (a persistent volume in
 * production). Files are only ever served through /files/[id], which checks
 * access rules first, so nothing in UPLOAD_DIR is publicly reachable directly.
 */
export function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || "./uploads");
}

const ALLOWED_EXT = new Set([
  ".pdf", ".ppt", ".pptx", ".key", ".doc", ".docx", ".txt", ".md", ".tex",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
  ".zip", ".m", ".mlx", ".py", ".ipynb", ".mat", ".csv",
  ".mp4", ".m4v", ".mov", ".webm", ".mp3", ".vtt",
]);

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".vtt": "text/vtt",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
};

export function isAllowedFile(name: string) {
  return ALLOWED_EXT.has(path.extname(name).toLowerCase());
}

export function safeFileName(name: string) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, path.extname(name)).replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(0, 80) || "file";
  return `${base}${ext}`;
}

/** Save an uploaded file. Returns the path relative to the upload root. */
export async function saveUpload(file: File, termSlug: string): Promise<{ relPath: string; size: number; name: string; mime: string }> {
  if (!isAllowedFile(file.name)) throw new Error(`File type not allowed: ${path.extname(file.name) || "(none)"}`);
  const name = safeFileName(file.name);
  const dir = path.join(uploadRoot(), termSlug.replace(/[^\w-]/g, ""));
  await fs.mkdir(dir, { recursive: true });
  const rel = path.join(termSlug.replace(/[^\w-]/g, ""), `${crypto.randomBytes(6).toString("hex")}-${name}`);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadRoot(), rel), buf);
  return { relPath: rel, size: buf.length, name: file.name, mime: MIME_BY_EXT[path.extname(name)] || file.type || "application/octet-stream" };
}

/** Resolve a stored relative path, refusing anything that escapes the upload root. */
export function resolveUpload(rel: string): string | null {
  const root = uploadRoot();
  const full = path.resolve(root, rel);
  if (!full.startsWith(root + path.sep)) return null;
  return full;
}

export async function deleteUpload(rel: string) {
  const full = resolveUpload(rel);
  if (!full) return;
  await fs.rm(full, { force: true });
}

