# EC ENGR 102: Signals and Systems — course website

The course resource site for UCLA EC ENGR 102 (ECE 102), taught by **Prof. Achuta Kadambi**.
Students get lecture recordings, slides, discussion materials, homework and exam prep in one place.
Course staff manage everything from a built-in admin dashboard, without touching code, and the
same site is reused every quarter.

## What's in it

**For students (no login needed)**

- **Home**: course overview, instructor credit, "this week", announcements, upcoming deadlines, recently uploaded materials.
- **Built-in video player**: recordings stream in the browser (no download), with seeking, 0.75×–2× speed, ±10 s skips, resume where you left off, and captions.
- **Lecture library**: every lecture by week and number, with recording, slides and notes. Filter by "has recording" / "recording pending".
- **Discussions**: weekly slides, practice problems, solutions and section recordings.
- **Homework & exams**: problem sets, solutions (released automatically after the due date), exams, practice exams, formula sheets, links to Bruin Learn.
- **Course calendar**: this quarter's dates, with each class marked *Covered* / *Today* / *Upcoming*, and a progress bar.
- **Search**: by title, topic or keyword, filtered by term, week and type (lectures, recordings, slides, solutions, formula sheets, …).
- **Term switcher & archive**: the current term is the default; every past quarter stays browsable.
- Consistent icons and labels for recordings, slides, PDFs, solutions, formula sheets, code and links, plus clear "New", "Recording coming soon", "Not yet posted", "Available Nov 20" and "UCLA login" labels.
- Responsive (phone drawer navigation), keyboard accessible, skip link, WCAG-minded contrast, no client-side data fetching (fast first load).

**For course staff (`/admin`)**

- Sign in with email + password. Two roles:
  - **Admin** (instructor / site manager): everything, plus terms, staff accounts and permanent deletes.
  - **Editor** (TA): create, edit, publish, unpublish and archive lectures, discussions, homework, exams, files and announcements.
- Upload lecture recordings with a progress bar (multi-GB files are streamed to disk), or paste a link.
- Upload files or paste links (Box, Drive, Bruin Learn, YouTube, …). Per-file access: **Public**, **Bruin Learn only** (students are sent to Bruin Learn; the uploaded copy is never served publicly), or **Staff only**. Optional release time for solutions.
- Drafts, publish/unpublish, archive, duplicate, "flag as newly updated".
- **Start a new quarter in one step** by copying a previous term: items are copied as drafts with dates shifted to the new calendar. Each lecture keeps its one recording, which is reused every year.
- Scheduled announcements, activity log, built-in help page.

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

The seed loads **Fall 2026** with the real schedule from the ECE 102 Fall 2026 syllabus (lecture titles and
dates, discussion times, homework release/due dates, midterm, final, staff and office hours).
**Every file is a generated placeholder PDF labelled "Sample"**, recording links point to the Bruin Learn
home page, and announcements are samples. **Spring 2026** is an entirely fake archived term that shows how the archive works.
A pink banner appears on any page with sample content. When the real files are in, an admin clicks
**Dashboard → Remove all sample content**; the real schedule is kept.

Assumptions to check: homework due times are set to 11:59 PM PT, and the midterm time to 8:00 AM (the syllabus gives dates only).

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
