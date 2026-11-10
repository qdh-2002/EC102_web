import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "../actions";
import { getStaff } from "@/lib/auth";
import { SubmitButton } from "@/components/admin/ui";
import { COURSE } from "@/lib/constants";

export const metadata = { title: "Staff sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; saved?: string }> }) {
  const sp = await searchParams;
  if (await getStaff()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-ucla-darkestblue to-ucla-blue px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="h-1.5 bg-ucla-gold" />
        <div className="p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-ucla-blue">{COURSE.code}</p>
          <h1 className="mt-1 text-xl font-bold text-ucla-darkestblue">Course staff sign in</h1>
          <p className="mt-1 text-sm text-slate-600">For instructors and TAs managing course materials. Students do not need an account.</p>
          {sp.error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {sp.error}
            </p>
          )}
          {sp.saved === "signedout" && (
            <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              You have been signed out.
            </p>
          )}
          <form action={loginAction} className="mt-5 space-y-4">
            <input type="hidden" name="next" value={sp.next ?? ""} />
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input id="email" name="email" type="email" autoComplete="username" required className="input" />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
            </div>
            <SubmitButton className="btn-primary w-full" pendingText="Signing in…">
              Sign in
            </SubmitButton>
          </form>
          <p className="mt-5 text-center text-sm">
            <Link href="/" className="text-ucla-blue hover:underline">
              ← Back to course site
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
