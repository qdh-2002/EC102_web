import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { logoutAction } from "../actions";
import { COURSE, FEATURES, ROLE_LABEL } from "@/lib/constants";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Admin", template: `%s | Admin | ${COURSE.code}` }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  const links = [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/items", label: "Lectures" },
    ...(FEATURES.announcements ? [{ href: "/admin/announcements", label: "Announcements" }] : []),
    { href: "/admin/terms", label: "Terms" },
    ...(me.role === "ADMIN" ? [{ href: "/admin/users", label: "Staff accounts" }] : []),
    { href: "/admin/activity", label: "Activity log" },
    { href: "/admin/help", label: "Help" },
  ];
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-ucla-darkestblue text-white">
        <div className="h-1 bg-ucla-gold" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/admin" className="font-bold">
            {COURSE.code} <span className="font-normal text-ucla-lightblue">Course admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/" className="text-ucla-lightblue hover:text-white hover:underline" target="_blank">
              View site ↗
            </Link>
            <Link href="/admin/account" className="hidden text-white/80 hover:text-white hover:underline sm:inline" title={ROLE_LABEL[me.role]}>
              {me.name} · {me.role.toLowerCase()}
            </Link>
            <form action={logoutAction}>
              <button className="rounded-md border border-white/30 px-2.5 py-1 hover:bg-white/10">Sign out</button>
            </form>
          </div>
        </div>
        <AdminNav links={links} />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
