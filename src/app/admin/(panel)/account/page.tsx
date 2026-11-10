import { requireStaff } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/constants";
import { Field, Flash } from "@/components/admin/fields";
import { SubmitButton } from "@/components/admin/ui";
import { changePasswordAction } from "../../actions";

export const metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await requireStaff();
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-ucla-darkestblue">My account</h1>
      <p className="text-sm text-slate-600">{me.name} · {me.email} · {ROLE_LABEL[me.role]}</p>
      <Flash sp={sp} />
      <form action={changePasswordAction} className="card space-y-4 p-5">
        <h2 className="font-bold">Change password</h2>
        <Field label="New password" htmlFor="password" hint="At least 10 characters.">
          <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm">
          <input id="confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" className="input" />
        </Field>
        <SubmitButton>Update password</SubmitButton>
      </form>
    </div>
  );
}
