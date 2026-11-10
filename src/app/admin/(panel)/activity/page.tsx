import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "Activity log" };

export default async function ActivityPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ucla-darkestblue">Activity log</h1>
      <p className="text-sm text-slate-600">The last 200 changes made by course staff.</p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">What</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatDateTime(l.createdAt)}</td>
                <td className="px-4 py-2">{l.user?.name ?? "deleted user"}</td>
                <td className="px-4 py-2"><span className="font-medium">{l.action} {l.entity}</span> <span className="text-slate-600">{l.summary}</span></td>
              </tr>
            ))}
            {!logs.length && <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-600">No activity yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
