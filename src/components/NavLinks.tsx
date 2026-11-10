"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArchive, IconBook, IconCalendar, IconClipboard, IconHome, IconSearch, IconUsers } from "./icons";

const ICONS = { home: IconHome, lectures: IconBook, discussions: IconUsers, assignments: IconClipboard, schedule: IconCalendar, search: IconSearch, archive: IconArchive };

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
        const Icon = ICONS[it.icon];
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-ucla-blue text-white shadow-sm" : "text-slate-700 hover:bg-ucla-lighterblue hover:text-ucla-darkestblue"
              }`}
            >
              <Icon size={18} />
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
