import Link from "next/link";
import type { Term, Week } from "@prisma/client";
import { COURSE } from "@/lib/constants";
import { currentWeek, instructorNames, parseQuickLinks, termName, totalWeeks, weekLabel } from "@/lib/terms";
import { prisma } from "@/lib/db";
import { listTerms, viewer, getCurrentTerm } from "@/lib/queries";
import { MobileDrawer } from "./MobileDrawer";
import { NavLinks, type NavItem } from "./NavLinks";
import { TermSwitcher } from "./TermSwitcher";
import { IconArchive, IconExternal, IconSearch, IconSettings } from "./icons";

export async function SiteShell({ term, children }: { term: Term | null; children: React.ReactNode }) {
  const [{ staff }, terms, current] = await Promise.all([viewer(), listTerms(), getCurrentTerm()]);
  const weeks: Week[] = term ? await prisma.week.findMany({ where: { termId: term.id }, orderBy: { number: "asc" } }) : [];
  const sampleCount = term
    ? (await prisma.item.count({ where: { termId: term.id, isPlaceholder: true } })) +
      (await prisma.resource.count({ where: { isPlaceholder: true, item: { termId: term.id } } }))
    : 0;
  const nowWeek = term ? currentWeek(term) : 0;
  const base = term ? `/${term.slug}` : "";

  const nav: NavItem[] = term
    ? [
        { href: term.isCurrent ? "/" : base, label: "Home", icon: "home", exact: true },
        { href: `${base}/lectures`, label: "Lectures", icon: "lectures" },
        { href: `${base}/discussions`, label: "Discussions", icon: "discussions" },
        { href: `${base}/assignments`, label: "Homework & Exams", icon: "assignments" },
        { href: `${base}/schedule`, label: "Course calendar", icon: "schedule" },
        { href: "/search", label: "Search", icon: "search" },
        { href: "/archive", label: "All terms & archive", icon: "archive" },
      ]
    : [{ href: "/archive", label: "All terms", icon: "archive" }];

  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ucla-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-ucla-darkestblue">
        Skip to main content
      </a>
      <div className="flex">
        <MobileDrawer>
          <div className="flex h-full flex-col">
            <div className="h-1.5 bg-ucla-gold" />
            <Link href="/" className="block bg-ucla-blue px-5 py-4 text-white">
              <span className="block text-xs font-semibold uppercase tracking-widest text-ucla-gold">UCLA · {COURSE.code}</span>
              <span className="mt-0.5 block text-lg font-bold leading-tight">{COURSE.name}</span>
              {term && instructorNames(term.instructors).length > 0 && (
                <span className="mt-1 block text-sm text-white/90">{instructorNames(term.instructors).join(", ")}</span>
              )}
            </Link>
            <div className="space-y-5 px-4 py-5">
              {terms.length > 0 && term && (
                <TermSwitcher
                  active={term.slug}
                  terms={terms.map((t) => ({ slug: t.slug, label: termName(t), status: t.status, isCurrent: t.isCurrent }))}
                />
              )}
              <nav aria-label="Sections">
                <NavLinks items={nav} />
              </nav>
              {term && (
                <nav aria-label="Week-by-week timeline">
                  <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Course timeline</h2>
                  <ol className="relative ml-3 border-l-2 border-slate-200">
                    {Array.from({ length: totalWeeks(term) }, (_, i) => i + 1).map((n) => {
                      const w = weeks.find((x) => x.number === n);
                      const isNow = n === nowWeek && term.status === "ACTIVE";
                      const past = term.status === "ARCHIVED" || n < nowWeek;
                      return (
                        <li key={n} className="relative">
                          <span
                            className={`absolute -left-[7px] top-3 h-3 w-3 rounded-full border-2 ${
                              isNow ? "border-ucla-darkestgold bg-ucla-gold" : past ? "border-ucla-blue bg-ucla-blue" : "border-slate-300 bg-white"
                            }`}
                            aria-hidden="true"
                          />
                          <Link
                            href={`${base}/schedule#week-${n}`}
                            className={`ml-3 block rounded-md px-2 py-1.5 text-sm hover:bg-ucla-lighterblue ${isNow ? "bg-ucla-gold/20 font-semibold text-ucla-darkestblue" : "text-slate-700"}`}
                            aria-current={isNow ? "date" : undefined}
                          >
                            <span className="font-medium">{weekLabel(n, term.numWeeks)}</span>
                            {isNow && <span className="ml-1 text-xs font-bold uppercase text-ucla-darkblue">· now</span>}
                            {w?.topic && <span className="block truncate text-xs text-slate-500">{w.topic}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              )}
              {term && (
                <div className="space-y-1 border-t border-slate-200 pt-4 text-sm">
                  <h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Quick links</h2>
                  <a href={term.bruinLearnUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-md px-2 py-1.5 text-slate-700 hover:bg-ucla-lighterblue">
                    Bruin Learn <IconExternal size={14} />
                  </a>
                  {parseQuickLinks(term.quickLinks).map((l) => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-md px-2 py-1.5 text-slate-700 hover:bg-ucla-lighterblue">
                      {l.label} <IconExternal size={14} />
                    </a>
                  ))}
                  {term.syllabusUrl && (
                    <a href={term.syllabusUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-md px-2 py-1.5 text-slate-700 hover:bg-ucla-lighterblue">
                      Syllabus <IconExternal size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="mt-auto border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
              {staff ? (
                <Link href="/admin" className="inline-flex items-center gap-1.5 font-semibold text-ucla-darkblue hover:underline">
                  <IconSettings size={14} /> Staff dashboard ({staff.name})
                </Link>
              ) : (
                <Link href="/admin/login" className="hover:underline">
                  Course staff sign in
                </Link>
              )}
            </div>
          </div>
        </MobileDrawer>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="min-w-0 flex-1 lg:hidden">
                <Link href="/" className="block truncate font-bold text-ucla-darkestblue">
                  {COURSE.code}
                </Link>
                {term && <span className="block truncate text-xs text-slate-500">{termName(term)}</span>}
              </div>
              <p className="hidden min-w-0 flex-1 truncate text-sm text-slate-600 lg:block">
                {term ? (
                  <>
                    <span className="font-semibold text-ucla-darkestblue">{termName(term)}</span>
                    {term.status === "ACTIVE" && nowWeek >= 1 && nowWeek <= totalWeeks(term) && <> · {weekLabel(nowWeek, term.numWeeks)}</>}
                    {term.status === "ARCHIVED" && <> · Archived term</>}
                  </>
                ) : (
                  COURSE.code
                )}
              </p>
              <form action="/search" role="search" className="relative w-44 sm:w-72">
                <label htmlFor="site-search" className="sr-only">
                  Search course materials
                </label>
                <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="site-search"
                  name="q"
                  type="search"
                  placeholder="Search lectures, topics…"
                  className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-ucla-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-ucla-blue/30"
                />
                {term && <input type="hidden" name="term" value={term.slug} />}
              </form>
            </div>
          </header>

          {term && term.status === "ARCHIVED" && (
            <div className="border-b border-amber-200 bg-amber-50">
              <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-sm text-amber-900 sm:px-6 lg:px-8">
                <IconArchive size={16} />
                <span>
                  You are viewing the archived <strong>{termName(term)}</strong> offering.{" "}
                  {current && current.slug !== term.slug && (
                    <Link href="/" className="font-semibold underline">
                      Go to {termName(current)}
                    </Link>
                  )}
                </span>
              </p>
            </div>
          )}
          {term && term.status === "DRAFT" && (
            <div className="border-b border-slate-700 bg-slate-800">
              <p className="mx-auto max-w-6xl px-4 py-2.5 text-sm text-white sm:px-6 lg:px-8">
                Draft term: only signed-in course staff can see this page.
              </p>
            </div>
          )}
          {sampleCount > 0 && (
            <div className="border-b border-fuchsia-200 bg-fuchsia-50">
              <p className="mx-auto max-w-6xl px-4 py-2 text-xs text-fuchsia-900 sm:px-6 sm:text-sm lg:px-8">
                <strong>Sample content.</strong> Files and items marked &ldquo;Sample&rdquo; are placeholders for demonstration, not official course
                materials. Course staff can replace or delete them in the{" "}
                <Link href="/admin" className="underline">
                  admin dashboard
                </Link>
                .
              </p>
            </div>
          )}

          <main id="main" className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8">
            {children}
          </main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>
                {COURSE.code} ({COURSE.shortCode}): {COURSE.name}
                {term && instructorNames(term.instructors).length > 0 && <> · Taught by {instructorNames(term.instructors).join(", ")}</>} · {COURSE.department},{" "}
                {COURSE.institution}
              </p>
              <p>
                Course materials are for enrolled students. Protected content is available through{" "}
                <a className="underline" href="https://bruinlearn.ucla.edu/" target="_blank" rel="noopener noreferrer">
                  Bruin Learn
                </a>
                .
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 sm:mb-8">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-ucla-blue">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ucla-darkestblue sm:text-3xl">{title}</h1>
      {children && <div className="mt-2 max-w-3xl text-slate-600">{children}</div>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{children}</p>}
    </div>
  );
}
