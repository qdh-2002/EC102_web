"use client";

import { useRouter, usePathname } from "next/navigation";

type T = { slug: string; label: string; status: string; isCurrent: boolean };

/** Switch term while staying on the same section (e.g. lectures → lectures). */
export function TermSwitcher({ terms, active }: { terms: T[]; active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div>
      <label htmlFor="term-switcher" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Academic term
      </label>
      <select
        id="term-switcher"
        value={active}
        onChange={(e) => {
          const slug = e.target.value;
          const parts = pathname.split("/").filter(Boolean);
          const onTermPage = parts[0] && terms.some((t) => t.slug === parts[0]);
          const section = onTermPage && parts[1] && parts.length <= 2 ? `/${parts[1]}` : "";
          router.push(`/${slug}${section}`);
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-ucla-blue focus:outline-none focus:ring-2 focus:ring-ucla-blue/30"
      >
        {terms.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.label}
            {t.isCurrent ? " (current)" : t.status === "ARCHIVED" ? " (archived)" : t.status === "DRAFT" ? " (draft)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
