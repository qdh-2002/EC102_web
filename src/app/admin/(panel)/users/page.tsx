import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABEL, ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { Field, Flash, Select } from "@/components/admin/fields";
import { SubmitButton } from "@/components/admin/ui";
import { createUserAction, updateUserAction } from "../../actions";

export const metadata = { title: "Staff accounts" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await requireStaff("ADMIN");
  const users = await prisma.user.findMany({ orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }] });
  const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ucla-darkestblue">Staff accounts</h1>
        <p className="text-sm text-slate-600">
          <strong>Admins</strong> manage terms, staff accounts and can permanently delete. <strong>Editors</strong> (TAs) add, edit, publish and archive
          lectures, recordings and slides. Students never need an account.
        </p>
      </div>
      <Flash sp={sp} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Role / status / password reset</th>
              <th scope="col" className="px-4 py-3">Last sign in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className={u.active ? "" : "bg-slate-50 text-slate-500"}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{u.name}{u.id === me.id && " (you)"}</p>
                  <p className="text-xs">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <form action={updateUserAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <label className="sr-only" htmlFor={`role-${u.id}`}>Role</label>
                    <select id={`role-${u.id}`} name="role" defaultValue={u.role} className="input w-auto py-1">
                      {ROLES.map((r) => <option key={r} value={r}>{r.toLowerCase()}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" name="active" defaultChecked={u.active} className="h-4 w-4" /> active
                    </label>
                    <label className="sr-only" htmlFor={`pw-${u.id}`}>New password</label>
                    <input id={`pw-${u.id}`} name="password" type="password" placeholder="new password (optional)" autoComplete="new-password" className="input w-48 py-1" />
                    <SubmitButton className="btn-secondary py-1">Update</SubmitButton>
                  </form>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={createUserAction} className="card max-w-2xl space-y-4 p-5">
        <h2 className="text-lg font-bold text-ucla-darkestblue">Add a staff member</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="u-name"><input id="u-name" name="name" required className="input" /></Field>
          <Field label="Email" htmlFor="u-email"><input id="u-email" name="email" type="email" required className="input" placeholder="name@g.ucla.edu" /></Field>
          <Field label="Role" htmlFor="u-role"><Select id="u-role" name="role" defaultValue="EDITOR" options={roleOptions} /></Field>
          <Field label="Temporary password" htmlFor="u-pw" hint="At least 10 characters. They can change it under their account.">
            <input id="u-pw" name="password" type="text" required minLength={10} autoComplete="off" className="input" />
          </Field>
        </div>
        <SubmitButton>Create account</SubmitButton>
      </form>
    </div>
  );
}
