"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ links }: { links: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="mx-auto max-w-7xl overflow-x-auto px-2 sm:px-4">
      <ul className="flex gap-1 whitespace-nowrap">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block border-b-[3px] px-3 py-2.5 text-sm font-medium ${active ? "border-ucla-gold text-white" : "border-transparent text-white/70 hover:text-white"}`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
