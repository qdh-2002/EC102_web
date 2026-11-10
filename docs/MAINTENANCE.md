# Maintaining the site

Everything below is done in the browser at `/admin`. No code changes are needed for normal use.

## Every week (TAs / editors)

1. **Before lecture:** Course content → open the lecture (or *+ Lecture*) → attach slides under **Files & links**.
   Uploading to a published item gives it a "New" badge and puts it in "Recently uploaded" for 7 days.
2. **After lecture:** open the lecture and either
   - **Upload recording** (recommended): pick the video file and watch the progress bar. It plays in the site's own
     video player, so students stream it in the browser with no download: instant seeking, 0.75×–2× speed,
     ±10 s skips, "resume where you left off", and captions if you add a *Captions (.vtt)* file. Uploading a new
     video replaces the old one. Export as MP4 (H.264 + AAC) for the widest browser support.
   - or paste a recording link. YouTube, Vimeo, Google Drive and direct .mp4 links also play inside the page;
     Bruincast / Bruin Learn Media Gallery / Zoom links open in a new tab behind UCLA login.
   - If a lecture was not recorded, choose *Not recorded* so students are not left waiting.
3. **Discussion:** same flow with the discussion item: slides, practice problems, solutions, recording.
4. **Homework:** create it with release date and due date/time, attach the problems, and attach solutions with
   a **Release at** time after the due date. Solutions show "Available …" until then. Per the syllabus late-day policy,
   solutions can stay on Bruin Learn: choose *Bruin Learn only* and paste the Bruin Learn link.
5. **Announcements:** Announcements → write → optionally pin or schedule for later.

Mistake in a file? Open the file row → *Replace file* → Save, then *Flag as newly updated*.

## Access levels (who can see a file)

| Level | Students see | Use for |
|---|---|---|
| Public on this site | Download link | Your own slides, notes, handouts |
| Bruin Learn only | Lock icon, link to Bruin Learn | Recordings, copyrighted material, solutions |
| Course staff only | Nothing | Answer keys, drafts, grading rubrics |

Items also have a status: **Draft** (staff only, shown with a dark "Draft" badge when staff preview the site),
**Published**, or **Archived** (hidden but kept, useful for retired lectures).

## Recordings and the course calendar

There is **one recording per lecture**, reused every year. When a new term is created from a previous one,
each lecture keeps its recording (uploaded video and captions, or link) without copying the file. Each term's own dates form that year's **course calendar** (sidebar →
*Course calendar*), which marks every class as *Covered*, *Today* or *Upcoming* and shows overall progress, so
students can see where the class is. If a recording is replaced, update the link on the lecture in the current term.

## Starting a new quarter (admins, ~15 minutes)

1. Terms → **+ New term** → *Start from a previous term*. Pick the last offering, the new quarter/year and the
   **Monday of week 1**. Keep "Also copy slides, notes and links" checked.
   Everything is copied as **drafts**, dates are shifted, and recording links carry over.
2. Open the new term and update staff, office hours, logistics, Bruin Learn URL, quick links (Piazza, etc.) and week topics.
3. Fix any dates that moved (holidays fall differently each year), e.g. via Course content filtered by term.
4. Check **Make this the current term** and save. Students now land on it.
5. Archive the previous term (Terms → *Archive*). It stays under *All terms & archive*.
6. Publish items as the quarter goes (or publish all lectures up front so students see the whole calendar).

## Staff accounts (admins)

Staff accounts → *Add a staff member* with a temporary password (share it privately). They change it under
their name → *My account*. At the end of a quarter, untick *active* for departing TAs instead of deleting them, so the
activity log keeps their history. If every admin is locked out, run on the server:

```bash
npm run create-admin -- you@g.ucla.edu "Your Name" "new-long-password"
# Docker: docker compose exec web npx tsx scripts/create-admin.ts you@g.ucla.edu "Your Name" "new-long-password"
```

## Going live

1. Upload the real files for past lectures (or delete the placeholders).
2. Dashboard → **Remove all sample content** (deletes sample files, sample announcements and the demo Spring 2026 term;
   the real Fall 2026 schedule stays).
3. Change the seed admin password, and set a strong `AUTH_SECRET`.

## Changing things in code (developers)

| Want to… | Edit |
|---|---|
| Course name, code, department | `src/lib/constants.ts` → `COURSE` |
| Add a resource type (e.g. "Lab") | `RESOURCE_TYPES` + label in `src/lib/constants.ts`, icon/colour in `src/components/resource-style.tsx` |
| Colours / branding | `tailwind.config.ts` (`ucla.*` palette) |
| "New" badge duration | `NEW_BADGE_DAYS` in `src/lib/constants.ts` |
| Who can see what | `src/lib/access.ts` (single place, covered by `tests/core.test.ts`) |
| Database schema | `prisma/schema.prisma`, then `npx prisma db push` |

Run `npm run lint && npm test && npm run build` before deploying a code change.
