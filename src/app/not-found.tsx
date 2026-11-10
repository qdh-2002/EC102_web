import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-ucla-blue">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ucla-darkestblue">Page not found</h1>
        <p className="mt-2 text-slate-600">This material may have moved to another term, or it has not been published yet.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">Current term</Link>
          <Link href="/archive" className="btn-secondary">All terms</Link>
          <Link href="/search" className="btn-secondary">Search</Link>
        </div>
      </div>
    </main>
  );
}
