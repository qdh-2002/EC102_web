import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { safeFileName, uploadRoot } from "@/lib/storage";

export const dynamic = "force-dynamic";

const VIDEO_EXT = new Set([".mp4", ".m4v", ".mov", ".webm"]);
const MAX_BYTES = Number(process.env.MAX_VIDEO_MB || 4096) * 1024 * 1024;

/**
 * Upload a lecture/discussion recording. The request body is the raw video file
 * and is streamed straight to disk (no size limit from server actions, no memory
 * spike), so multi-GB lecture captures work. Replaces any previous uploaded recording.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { itemId } = await params;
  const item = await prisma.item.findUnique({ where: { id: itemId }, include: { term: true, resources: true } });
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  const original = decodeURIComponent(req.headers.get("x-file-name") || "recording.mp4");
  const ext = path.extname(original).toLowerCase();
  if (!VIDEO_EXT.has(ext)) return NextResponse.json({ error: "Upload an .mp4, .m4v, .mov or .webm video." }, { status: 400 });
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) return NextResponse.json({ error: `Video is larger than ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 413 });
  if (!req.body) return NextResponse.json({ error: "Empty upload." }, { status: 400 });

  const dir = item.term.slug.replace(/[^\w-]/g, "");
  fs.mkdirSync(path.join(uploadRoot(), dir), { recursive: true });
  const rel = path.join(dir, `${crypto.randomBytes(6).toString("hex")}-${safeFileName(original)}`);
  const full = path.join(uploadRoot(), rel);
  let written = 0;
  try {
    const src = Readable.fromWeb(req.body as import("node:stream/web").ReadableStream);
    src.on("data", (c: Buffer) => {
      written += c.length;
      if (written > MAX_BYTES) src.destroy(new Error("too large"));
    });
    await pipeline(src, fs.createWriteStream(full));
  } catch (e) {
    fs.rmSync(full, { force: true });
    return NextResponse.json({ error: `Upload failed: ${(e as Error).message}` }, { status: 500 });
  }

  const mime = ext === ".webm" ? "video/webm" : ext === ".mov" ? "video/quicktime" : "video/mp4";
  const old = item.resources.filter((r) => r.type === "VIDEO" && r.filePath);
  await prisma.resource.create({
    data: { itemId, type: "VIDEO", label: "Recording", filePath: rel, fileName: original, fileSize: written, mimeType: mime, access: "PUBLIC", sortOrder: 0 },
  });
  for (const r of old) {
    await prisma.resource.delete({ where: { id: r.id } });
    if ((await prisma.resource.count({ where: { filePath: r.filePath } })) === 0) fs.rmSync(path.join(uploadRoot(), r.filePath), { force: true });
  }
  await prisma.item.update({
    where: { id: itemId },
    data: { recordingStatus: "AVAILABLE", ...(item.status === "PUBLISHED" ? { publishedAt: new Date() } : {}) },
  });
  await audit(staff.id, "create", "recording", itemId, `${original} on ${item.title}`);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, size: written });
}
