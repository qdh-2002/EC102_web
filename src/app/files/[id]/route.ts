import fs from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaff } from "@/lib/auth";
import { canDownloadPublicly } from "@/lib/access";
import { resolveUpload } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Serves uploaded course files. Every request is checked against the access
 * rules: drafts, staff-only files, unreleased solutions and Bruin Learn-only
 * files are refused unless a staff member is signed in.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.resource.findUnique({ where: { id }, include: { item: { include: { term: true } } } });
  if (!r || !r.filePath) return new NextResponse("Not found", { status: 404 });

  if (!canDownloadPublicly(r, r.item, r.item.term)) {
    const staff = await getStaff();
    if (!staff) {
      return new NextResponse(
        r.releaseAt && r.releaseAt > new Date() ? "This file has not been released yet." : "This file is restricted to course staff.",
        { status: 403 },
      );
    }
  }

  const full = resolveUpload(r.filePath);
  if (!full || !fs.existsSync(full)) return new NextResponse("File missing on server", { status: 404 });
  const size = fs.statSync(full).size;
  const inline = /^(application\/pdf|image\/|video\/|audio\/|text\/plain|text\/vtt)/.test(r.mimeType);
  const safeName = (r.fileName || "download").replace(/["\\\r\n]/g, "");
  const headers: Record<string, string> = {
    "Content-Type": r.mimeType || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(r.fileName || "download")}`,
    "Cache-Control": r.access === "PUBLIC" && !r.releaseAt ? "public, max-age=3600" : "private, no-store",
    "X-Content-Type-Options": "nosniff",
    ...(r.mimeType.includes("svg") ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
  };

  // Range requests let the in-page video player stream and seek without downloading the whole file.
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(full, { start, end })) as ReadableStream;
    return new NextResponse(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(full)) as ReadableStream;
  return new NextResponse(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
