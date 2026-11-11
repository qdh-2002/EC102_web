import Link from "next/link";
import type { Term } from "@prisma/client";
import { COURSE, FEATURES } from "@/lib/constants";
import { formatDateTime, formatLongDate, formatDate } from "@/lib/dates";
import { currentWeek, hasCalendar, instructorNames, parseInstructors, termName, totalWeeks, weekLabel } from "@/lib/terms";
import { getAnnouncements, getItems, getWeeks } from "@/lib/queries";
import { itemHref } from "@/lib/links";
import { hasRecording, isNew } from "@/lib/access";
import { itemHeading } from "./ItemCard";
import { DraftBadge, NewBadge, PlaceholderBadge } from "./badges";
import { IconBook, IconCalendar, IconClipboard, IconExternal, IconMegaphone, IconUsers, IconWave, IconClock } from "./icons";
import { EmptyState } from "./SiteShell";
import { InstructorLinks } from "./InstructorLinks";

export async function TermHome({ term }: { term: Term }) {
  const [announcements, all, weeks] = await Promise.all([
    FEATURES.announcements ? getAnnouncements(term.id) : Promise.resolve([]),
    getItems(term.id),
    getWeeks(term.id),
  ]);
  const base = `/${term.slug}`;
  const nowWeek = currentWeek(term);
  const inTerm = term.status === "ACTIVE" && nowWeek >= 1 && nowWeek <= totalWeeks(term);
  const thisWeek = inTerm ? all.filter((i) => i.week === nowWeek) : [];
  const weekTopic = weeks.find((w) => w.number === nowWeek)?.topic;
  const now = new Date();
  const upcoming = all
    .filter((i) => (i.kind === "HOMEWORK" || i.kind === "EXAM") && i.dueAt && i.dueAt > now)
    .sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime())
    .slice(0, 4);
  const staffList = parseInstructors(term.instructors);
  const instructors = instructorNames(term.instructors);
  const counts = {
    lectures: all.filter((i) => i.kind === "LECTURE").length,
    recordings: all.filter((i) => i.kind === "LECTURE" && hasRecording(i)).length,
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ucla-darkestblue via-ucla-darkblue to-ucla-blue p-6 text-white shadow-md sm:p-8">
        <IconWave size={260} className="pointer-events-none absolute -right-10 -top-10 text-white/10" strokeWidth={1.2} />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-widest text-ucla-gold">
            {COURSE.code} · {termName(term)}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{COURSE.name}</h1>
          {instructors.length > 0 && (
            <p className="mt-2 text-lg text-white">
              Taught by <span className="font-semibold text-ucla-gold"><InstructorLinks instructors={term.instructors} className="underline decoration-ucla-gold/50 underline-offset-4 hover:decoration-ucla-gold" /></span>
            </p>
          )}
          {term.overview && <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90">{term.overview}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`${base}/lectures`} className="btn-gold">
              <IconBook size={16} /> Lectures
            </Link>
            {hasCalendar(term) && (
              <Link href={`${base}/schedule`} className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
                <IconCalendar size={16} /> Course calendar
              </Link>
            )}
            <a href={term.bruinLearnUrl} target="_blank" rel="noopener noreferrer" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
              Bruin Learn <IconExternal size={14} />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* This week */}
          {inTerm && (
            <section aria-labelledby="this-week" className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="this-week" className="flex items-center gap-2 text-lg font-bold text-ucla-darkestblue">
                  <IconCalendar size={20} className="text-ucla-blue" /> This week: {weekLabel(nowWeek, term.numWeeks)}
                  {weekTopic && <span className="font-normal text-slate-600">· {weekTopic}</span>}
                </h2>
                <Link href={`${base}/schedule#week-${nowWeek}`} className="text-sm font-medium text-ucla-blue hover:underline">
                  Course calendar →
                </Link>
              </div>
              {thisWeek.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {thisWeek.map((i) => {
                    const h = itemHeading(i);
                    return (
                      <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                        <span className="w-24 shrink-0 text-xs font-semibold uppercase text-slate-500">{i.date ? formatDate(i.date) : ""}</span>
                        <Link href={itemHref(term.slug, i)} className="min-w-0 flex-1 font-medium text-slate-900 hover:text-ucla-blue hover:underline">
                          {h.prefix && <span className="text-ucla-blue">{h.prefix}: </span>}
                          {h.title}
                        </Link>
                        {isNew(i.publishedAt) && <NewBadge />}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">Nothing posted for this week yet.</p>
              )}
            </section>
          )}

          {/* Announcements */}
          {FEATURES.announcements && (
          <section aria-labelledby="announcements">
            <h2 id="announcements" className="mb-3 flex items-center gap-2 text-lg font-bold text-ucla-darkestblue">
              <IconMegaphone size={20} className="text-ucla-blue" /> Announcements
            </h2>
            {announcements.length ? (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className={`card p-4 ${a.pinned ? "border-l-4 border-l-ucla-gold" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{a.title}</h3>
                      {a.pinned && <span className="text-xs font-semibold uppercase text-ucla-darkblue">Pinned</span>}
                      {isNew(a.publishedAt) && <NewBadge />}
                      {a.status === "DRAFT" && <DraftBadge />}
                      {a.isPlaceholder && <PlaceholderBadge />}
                      <time dateTime={a.publishedAt.toISOString()} className="ml-auto text-xs text-slate-500">
                        {formatLongDate(a.publishedAt)}
                      </time>
                    </div>
                    <div className="prose-course mt-1 whitespace-pre-line text-sm text-slate-700">{a.body}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No announcements yet" />
            )}
          </section>

          )}

        </div>

        <aside className="space-y-6" aria-label="Course information">
          {FEATURES.homeworkAndExams && (
          <section aria-labelledby="deadlines" className="card p-5">
            <h2 id="deadlines" className="flex items-center gap-2 font-bold text-ucla-darkestblue">
              <IconClock size={18} className="text-ucla-blue" /> Upcoming deadlines
            </h2>
            {upcoming.length ? (
              <ul className="mt-3 space-y-3">
                {upcoming.map((i) => (
                  <li key={i.id}>
                    <Link href={itemHref(term.slug, i)} className="font-medium text-slate-900 hover:text-ucla-blue hover:underline">
                      {itemHeading(i).prefix || i.title}
                      {itemHeading(i).prefix && <span className="font-normal text-slate-600">: {i.title}</span>}
                    </Link>
                    <p className="text-sm text-slate-600">
                      <time dateTime={i.dueAt!.toISOString()}>{formatDateTime(i.dueAt)}</time>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No upcoming deadlines.</p>
            )}
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Submissions and grades are on{" "}
              <a href={term.bruinLearnUrl} className="font-medium text-ucla-blue underline" target="_blank" rel="noopener noreferrer">
                Bruin Learn
              </a>
              .
            </p>
          </section>

          )}

          <section aria-labelledby="quick-links" className="card p-5">
            <h2 id="quick-links" className="font-bold text-ucla-darkestblue">
              Quick links
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {[
                { href: `${base}/lectures`, label: "Lectures", Icon: IconBook },
                ...(hasCalendar(term) ? [{ href: `${base}/schedule`, label: "Calendar", Icon: IconCalendar }] : []),
              ].map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex flex-col items-start gap-1 rounded-lg border border-slate-200 p-3 font-medium text-slate-800 hover:border-ucla-blue hover:bg-ucla-lighterblue">
                    <Icon size={18} className="text-ucla-blue" /> {label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              {counts.lectures} lectures posted · {counts.recordings} recordings available
            </p>
          </section>

          {(staffList.length > 0 || term.logistics) && (
            <section aria-labelledby="staff" className="card p-5">
              <h2 id="staff" className="font-bold text-ucla-darkestblue">
                Course staff &amp; logistics
              </h2>
              {staffList.length > 0 && (
                <ul className="mt-3 space-y-2 text-sm">
                  {staffList.map((s) => (
                    <li key={s.name + s.email}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:text-ucla-blue hover:decoration-ucla-blue">
                          {s.name}
                          <span className="sr-only"> (profile, opens in a new tab)</span>
                        </a>
                      ) : (
                        <span className="font-medium text-slate-900">{s.name}</span>
                      )}
                      {s.role && <span className="text-slate-500"> · {s.role}</span>}
                      {s.email && (
                        <a href={`mailto:${s.email}`} className="block text-ucla-blue hover:underline">
                          {s.email}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {term.logistics && (
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-700">
                  {term.logistics
                    .split("\n")
                    .filter(Boolean)
                    .map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
