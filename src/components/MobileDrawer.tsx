"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IconMenu, IconX } from "./icons";

/** Wraps the sidebar: always visible on large screens, a slide-over drawer on phones/tablets. */
export function MobileDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-ucla-darkestblue px-4 py-3 text-sm font-semibold text-white shadow-lg lg:hidden"
        aria-expanded={open}
        aria-controls="site-sidebar"
      >
        <IconMenu size={18} /> Menu &amp; weeks
      </button>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside
        id="site-sidebar"
        aria-label="Course navigation"
        className={`fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-2 lg:hidden">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Close menu">
            <IconX size={20} />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
