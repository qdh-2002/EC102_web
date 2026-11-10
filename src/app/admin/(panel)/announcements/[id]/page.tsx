import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { adminTerms } from "@/lib/admin-data";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { Flash } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ui";
import { deleteAnnouncementAction } from "../../../actions";

export const metadata = { title: "Edit announcement" };

export default async function EditAnnouncement({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const a = await prisma.announcement.findUnique({ where: { id } });
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/admin/announcements" className="text-sm text-ucla-blue hover:underline">← Announcements</Link>
      <h1 className="text-2xl font-bold text-ucla-darkestblue">Edit announcement</h1>
      <Flash sp={sp} />
      <AnnouncementForm a={a} terms={await adminTerms()} termId={a.termId} />
      <form action={deleteAnnouncementAction}>
        <input type="hidden" name="id" value={a.id} />
        <ConfirmButton message="Delete this announcement?">Delete announcement</ConfirmButton>
      </form>
    </div>
  );
}
