# EC ENGR 102: Signals and Systems — course website

The course resource site for UCLA EC ENGR 102 (ECE 102), taught by **Prof. Achuta Kadambi**.
Students get lecture recordings, slides, discussion materials, homework and exam prep in one place.
Course staff manage everything from a built-in admin dashboard, without touching code, and the
same site is reused every quarter.

## What's in it

A deliberately simple site for **lecture recordings and slides**, reused every quarter.

**For students (no login needed)**

- **Home**: course overview, "Taught by Prof. Achuta Kadambi", this week's classes, recently uploaded recordings and slides.
- **Lectures** and **Discussions**: every class by week, each with its recording and slides.
- **Video player**: recordings stream in the browser (no download), with seeking, 0.75×–2× speed, ±10 s skips, resume where you left off, and captions.
- **Course calendar**: each quarter's own dates, with every class marked *Covered* / *Today* / *Upcoming* and a progress bar, so students know where the class is.
- **Search** by title or topic, and a **term switcher / archive** for past quarters.
- Clear labels for "New", "Recording coming soon", "Not recorded", "Not yet posted" and "UCLA login" (Bruin Learn) links. Works on phones.

**For course staff (`/admin`)**

- Two roles: **Admin** (instructor / site manager: terms, staff accounts, deletes) and **Editor** (TAs: add lectures and discussions, upload recordings and slides, publish).
- Upload a recording with a progress bar (large files are fine) or paste a link; attach slides (PDF/PowerPoint) or links.
- Per-file access: **Public**, **Bruin Learn only** (students are sent to Bruin Learn behind UCLA login), or **Staff only**.
- **New quarter in one step**: copy last quarter's term with dates shifted. Each lecture keeps its one recording, which is reused every year; the new dates become that quarter's calendar.

Homework/exams pages and announcements are built but switched off to keep things simple. Turn them on in
`src/lib/constants.ts` (`FEATURES`) if you ever want them.

## Quick start (local)

Requires Node.js 20+.

```bash
cp .env.example .env          # then edit ADMIN_EMAIL / ADMIN_PASSWORD / AUTH_SECRET
npm install
npm run setup                 # creates the SQLite database and seeds sample content
npm run dev                   # http://localhost:3000   (admin: http://localhost:3000/admin)
```

Other scripts: `npm test` (unit tests), `npm run lint` (type check), `npm run build && npm start`,
`npm run create-admin -- email "Name" "password"`.

## Sample content

The seed loads **Fall 2026** with the real lecture schedule from the ECE 102 Fall 2026 syllabus (lecture titles and
dates, Friday discussions, staff and office hours). **Every file is a placeholder labelled "Sample"** (slide PDFs and
one short demo video on Lecture 1), and other recording links point to the Bruin Learn home page. **Spring 2026** is an entirely fake archived term that shows how the archive works.
A pink banner appears on any page with sample content. When the real files are in, an admin clicks
**Dashboard → Remove all sample content**; the real schedule is kept.


## Docs

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): hosting options, environment variables, backups, security.
- [docs/MAINTENANCE.md](docs/MAINTENANCE.md): weekly workflow, starting a new quarter, adding staff, changing the design.

## Project layout

```
prisma/schema.prisma     data model (Term → Week, Item → Resource, Announcement, User, AuditLog)
prisma/seed.ts           admin account + sample content
src/app/                 pages (App Router). [term]/… = student pages, admin/… = CMS
src/app/admin/actions.ts every create/update/delete (server actions, role-checked, audited)
src/components/          reusable UI (ItemCard, ResourceLink, RecordingPlayer, SiteShell, …)
src/lib/                 access rules, dates (Pacific time), term/week math, embeds, auth, storage
src/middleware.ts        protects /admin
tests/                   unit tests for dates, weeks, embeds and access rules
```

Stack: Next.js 15 (App Router, server components, server actions), React 19, Tailwind CSS 3, Prisma 6
(SQLite by default, PostgreSQL supported), jose (signed session cookies), bcrypt.
