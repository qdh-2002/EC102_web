/**
 * Seeds the database.
 *
 *  - Always: creates/updates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 *  - When SEED_SAMPLE_CONTENT is not "false" and the database has no terms yet:
 *      * Fall 2026 (current term) with the real schedule from the ECE 102 Fall 2026
 *        syllabus (lecture titles, dates, homework release/due dates, exams).
 *        Every FILE is a generated placeholder PDF marked "Sample".
 *      * Spring 2026, an entirely sample archived term that demonstrates the archive.
 *
 * Run:  npm run db:seed        (safe to re-run; content is only created once)
 *       npm run db:reset       (wipes the database and seeds again)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { parseCampusDateTime } from "../src/lib/dates";
import { weekForDate } from "../src/lib/terms";
import { FEATURES } from "../src/lib/constants";
import { placeholderPdf } from "./pdf";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const BRUIN_LEARN = "https://bruinlearn.ucla.edu/";
const NOW = new Date();

const d = (s: string) => parseCampusDateTime(s)!;

function writePdf(termSlug: string, name: string, title: string, lines: string[]) {
  const dir = path.join(UPLOAD_DIR, termSlug);
  fs.mkdirSync(dir, { recursive: true });
  const rel = path.join(termSlug, `${crypto.randomBytes(4).toString("hex")}-${name}`);
  const buf = placeholderPdf(title, lines);
  fs.writeFileSync(path.join(UPLOAD_DIR, rel), buf);
  return { filePath: rel, fileName: name, fileSize: buf.length, mimeType: "application/pdf" };
}

type Res = {
  type: string;
  label: string;
  url?: string;
  access?: string;
  releaseAt?: Date | null;
  pdf?: { name: string; title: string; lines: string[] };
  copy?: { from: string; mime: string };
};

function copySample(termSlug: string, from: string, mime: string) {
  const dir = path.join(UPLOAD_DIR, termSlug);
  fs.mkdirSync(dir, { recursive: true });
  const name = path.basename(from);
  const rel = path.join(termSlug, `${crypto.randomBytes(4).toString("hex")}-${name}`);
  fs.copyFileSync(path.join(__dirname, "sample", from), path.join(UPLOAD_DIR, rel));
  return { filePath: rel, fileName: name, fileSize: fs.statSync(path.join(UPLOAD_DIR, rel)).size, mimeType: mime };
}

/** A short placeholder video + captions, to demonstrate the in-page player. */
const SAMPLE_VIDEO: Res[] = [
  { type: "VIDEO", label: "Recording (sample video)", copy: { from: "sample-recording.mp4", mime: "video/mp4" } },
  { type: "CAPTIONS", label: "Captions", copy: { from: "sample-recording.vtt", mime: "text/vtt" } },
];

async function addItem(
  term: { id: string; slug: string; startDate: Date; numWeeks: number },
  it: {
    kind: string;
    number?: number | null;
    title: string;
    date?: Date | null;
    dueAt?: Date | null;
    week?: number | null;
    description?: string;
    topics?: string;
    recordingStatus?: string;
    recordingUrl?: string;
    status?: string;
    publishedAt?: Date | null;
    isPlaceholder?: boolean;
    resources?: Res[];
  },
) {
  return prisma.item.create({
    data: {
      termId: term.id,
      kind: it.kind,
      number: it.number ?? null,
      title: it.title,
      date: it.date ?? null,
      dueAt: it.dueAt ?? null,
      week: it.week ?? weekForDate(term, it.date ?? it.dueAt),
      description: it.description ?? "",
      topics: it.topics ?? "",
      recordingStatus: it.recordingStatus ?? "NONE",
      recordingUrl: it.recordingUrl ?? "",
      status: it.status ?? "PUBLISHED",
      publishedAt: it.publishedAt === undefined ? (it.status === "DRAFT" ? null : it.date ?? NOW) : it.publishedAt,
      isPlaceholder: it.isPlaceholder ?? false,
      resources: {
        create: (it.resources ?? []).map((r, i) => ({
          type: r.type,
          label: r.label,
          url: r.url ?? "",
          access: r.access ?? "PUBLIC",
          releaseAt: r.releaseAt ?? null,
          sortOrder: i + 1,
          isPlaceholder: true,
          ...(r.pdf ? writePdf(term.slug, r.pdf.name, r.pdf.title, r.pdf.lines) : {}),
          ...(r.copy ? copySample(term.slug, r.copy.from, r.copy.mime) : {}),
        })),
      },
    },
  });
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.edu").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Course Admin";
  if (!password || password.length < 10) {
    console.warn("! ADMIN_PASSWORD is missing or shorter than 10 characters; skipping admin account.");
    return;
  }
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", active: true },
    create: { email, name, role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`✓ Admin account: ${email}`);
}

// ---------------------------------------------------------------- Fall 2026

async function seedFall2026() {
  const term = await prisma.term.create({
    data: {
      slug: "fall-2026",
      quarter: "FALL",
      year: 2026,
      startDate: d("2026-09-28"), // Monday of week 1 (first lecture Tue 9/29)
      numWeeks: 10,
      isCurrent: true,
      status: "ACTIVE",
      instructors: [
        "Prof. Achuta Kadambi | | Instructor",
        "Jim Solomon | jimsolomon@g.ucla.edu | Teaching Assistant",
        "Qiudi He | qdhe02@g.ucla.edu | Teaching Assistant",
        "Haruka Johnson | | Grader",
        "Nemo Lin | | Grader",
        "Xinhang Guo | | Grader",
      ].join("\n"),
      overview:
        "An introduction to signals and systems from a mathematical perspective. A signal is a function and a representation of information; a system manipulates such functions. You will learn to represent and manipulate information not only in the domain where it is presented (the time domain) but also in a dual domain (the frequency domain), with applications from AI and robotics to circuit design.",
      logistics: [
        "Lectures: Tuesdays & Thursdays (see the course calendar)",
        "Prof. Kadambi office hours: Thursdays after class, 10–11am PT, E4 56-147J",
        "TA office hours: Tue 2–3pm, E4 67-112 (Qiudi) · Thu 12:30–1:30pm, E4 67-112 (Jim)",
        "Email the TAs with “F26 ECE 102” in the subject line. Please do not email the instructor personally.",
      ].join("\n"),
      bruinLearnUrl: BRUIN_LEARN,
      quickLinks: ["Piazza | https://piazza.com/ucla/fall2026/ecengr102", "MyUCLA | https://my.ucla.edu/", "Center for Accessible Education | https://www.cae.ucla.edu/"].join("\n"),
      weeks: {
        create: [
          "Signal operations, signal properties, complex numbers",
          "Elementary signals; systems and their properties",
          "Impulse response; convolution",
          "Convolution II; midterm review; Fourier series",
          "Fourier series II; in-class midterm",
          "Fourier series III; Fourier transform",
          "Fourier transform II & III",
          "Frequency response, impulse trains, sampling theorem",
          "Laplace transform I; Thanksgiving (no lecture Thu)",
          "Laplace transform II; research in signal processing",
          "Final exam (check MyUCLA)",
        ].map((topic, i) => ({ number: i + 1, topic })),
      },
    },
  });

  // Lecture schedule from the syllabus.
  const lectures: [string, string, string][] = [
    ["2026-09-29", "Class Overview + Signal Operations", "signal operations, time shift, time scaling, time reversal"],
    ["2026-10-01", "Signal Properties + Complex Numbers", "signal properties, even and odd, periodic signals, energy and power, complex numbers"],
    ["2026-10-06", "Elementary Signals", "unit step, unit impulse, delta function, complex exponentials, sinusoids"],
    ["2026-10-08", "Systems and Their Properties", "systems, linearity, time invariance, causality, stability, memory, LTI systems"],
    ["2026-10-13", "Impulse Response", "impulse response, LTI systems"],
    ["2026-10-15", "Convolution I", "convolution, convolution integral, LTI systems"],
    ["2026-10-20", "Convolution II", "convolution, graphical convolution, convolution properties"],
    ["2026-10-22", "Midterm Review and Fourier Series I", "midterm review, Fourier series, periodic signals"],
    ["2026-10-27", "Fourier Series II", "Fourier series, Fourier coefficients, Parseval"],
    ["2026-11-03", "Fourier Series III", "Fourier series, LTI systems and Fourier series"],
    ["2026-11-05", "Fourier Transform I", "Fourier transform, frequency domain"],
    ["2026-11-10", "Fourier Transform II", "Fourier transform, Fourier transform properties, duality"],
    ["2026-11-12", "Fourier Transform III", "Fourier transform, convolution theorem, modulation"],
    ["2026-11-17", "Frequency Response + Impulse Trains", "frequency response, impulse train, filters, Bode plot"],
    ["2026-11-19", "Sampling Theorem", "sampling, Nyquist, aliasing, reconstruction"],
    ["2026-11-24", "Laplace Transform I", "Laplace transform, region of convergence, poles and zeros"],
    ["2026-12-01", "Laplace Transform II", "Laplace transform, transfer function, stability, differential equations"],
    ["2026-12-03", "Research in Signal Processing", "research, computational imaging, applications"],
  ];
  const today = d("2026-11-10");
  for (const [i, [date, title, topics]] of lectures.entries()) {
    const n = i + 1;
    const when = d(date);
    const past = when < today;
    const isToday = date === "2026-11-10";
    const posted = past || isToday;
    await addItem(term, {
      kind: "LECTURE",
      number: n,
      title,
      date: when,
      topics,
      description: posted
        ? `Lecture ${n} of ECE 102. Slides below are a placeholder until the real deck is uploaded. Lectures are recorded as a courtesy when possible; recordings live in the Bruin Learn Media Gallery.`
        : "",
      recordingStatus: past ? "AVAILABLE" : isToday ? "PENDING" : "NONE",
      recordingUrl: past ? BRUIN_LEARN : "",
      publishedAt: posted ? when : null,
      resources: posted
        ? [
            ...(n === 1 ? SAMPLE_VIDEO : []),
            {
              type: "SLIDES",
              label: `Lecture ${n} slides (PDF)`,
              pdf: { name: `lecture-${String(n).padStart(2, "0")}-slides.pdf`, title: `ECE 102 Lecture ${n}: ${title}`, lines: ["Fall 2026 - Prof. Achuta Kadambi", "", "Sample slide deck."] },
            },
            ...(n % 3 === 0
              ? [{ type: "NOTES", label: `Lecture ${n} annotated notes`, pdf: { name: `lecture-${n}-notes.pdf`, title: `Lecture ${n} notes`, lines: ["Sample annotated notes."] } }]
              : []),
          ]
        : [],
    });
  }

  if (FEATURES.discussions) {
  // Discussions: Fridays 11am, covering that week's lectures.
  const fridays = ["10-02", "10-09", "10-16", "10-23", "10-30", "11-06", "11-13", "11-20", "11-27", "12-04"];
  const discTopics = [
    "Signal operations, signal properties & complex numbers",
    "Elementary signals; system properties",
    "Impulse response & convolution",
    "Convolution & Fourier series",
    "Fourier series (post-midterm)",
    "Fourier series & the Fourier transform",
    "Fourier transform properties",
    "Frequency response & sampling",
    "Laplace transform",
    "Laplace transform & final review",
  ];
  for (const [i, md] of fridays.entries()) {
    const n = i + 1;
    const when = d(`2026-${md}T11:00`);
    if (md === "11-27") {
      // Day after Thanksgiving (university holiday).
      await addItem(term, { kind: "DISCUSSION", number: n, title: "No discussion (Thanksgiving holiday)", date: when, recordingStatus: "NOT_RECORDED", publishedAt: null });
      continue;
    }
    const past = when < NOW;
    await addItem(term, {
      kind: "DISCUSSION",
      number: n,
      title: discTopics[i],
      date: when,
      topics: discTopics[i].toLowerCase().replace(/\s*[;&]\s*/g, ", ").replace(/\(.*\)|\bthe\b/g, "").replace(/\s+/g, " ").trim(),
      description: "Fridays 11am, Boelter Hall 5419. Section is recorded and posted to the Bruin Learn Media Gallery.",
      recordingStatus: past ? "AVAILABLE" : "NONE",
      recordingUrl: past ? BRUIN_LEARN : "",
      publishedAt: past ? when : null,
      resources: past
        ? [
            { type: "SLIDES", label: `Discussion ${n} slides`, pdf: { name: `discussion-${n}-slides.pdf`, title: `Discussion ${n} slides`, lines: [discTopics[i]] } },
          ]
        : [],
    });
  }

  }

  if (FEATURES.homeworkAndExams) {
  // Homework: release and due dates from the syllabus. Due times are assumed to be 11:59 PM PT.
  const hw: [number, string, string, string, string][] = [
    [1, "2026-10-01", "2026-10-08", "lectures 1 & 2", "signal operations, signal properties, complex numbers"],
    [2, "2026-10-06", "2026-10-15", "lectures 3 & 4", "elementary signals, system properties"],
    [3, "2026-10-08", "2026-10-22", "lectures 5, 6 & 7", "impulse response, convolution"],
    [4, "2026-10-22", "2026-11-12", "lectures 8, 9 & 10", "Fourier series"],
    [5, "2026-10-29", "2026-11-19", "lectures 11 & 12", "Fourier transform"],
    [6, "2026-11-12", "2026-11-29", "lectures 13 & 14", "Fourier transform, frequency response, impulse trains"],
    [7, "2026-11-19", "2026-12-06", "lectures 15, 16 & 17", "sampling, Laplace transform"],
  ];
  for (const [n, out, due, covers, topics] of hw) {
    const released = d(out) <= NOW;
    const dueAt = d(`${due}T23:59`);
    await addItem(term, {
      kind: "HOMEWORK",
      number: n,
      title: topics.charAt(0).toUpperCase() + topics.slice(1),
      date: d(out),
      dueAt,
      week: weekForDate(term, d(out)),
      topics,
      description: `Covers ${covers}. Submit on Bruin Learn. The homework in this class is challenging and time consuming, so start early and work through it during the week. You have 3 late days for the quarter; if you use late days, do not view the solutions until you have submitted.`,
      publishedAt: released ? d(out) : null,
      resources: released
        ? [
            { type: "PROBLEMS", label: `HW${n} problems (PDF)`, pdf: { name: `hw${n}.pdf`, title: `ECE 102 Homework ${n}`, lines: [`Covers ${covers}.`, `Due ${due} on Bruin Learn.`] } },
            { type: "SOLUTIONS", label: `HW${n} solutions`, url: BRUIN_LEARN, access: "BRUIN_LEARN", releaseAt: new Date(dueAt.getTime() + 60_000) },
          ]
        : [],
    });
  }

  await addItem(term, {
    kind: "EXAM",
    title: "Midterm Exam (in class)",
    date: d("2026-10-29"),
    dueAt: d("2026-10-29T08:00"),
    topics: "midterm, convolution, LTI systems, Fourier series",
    description: "In-class midterm, 110 minutes. One double-sided cheat sheet allowed. If you do better on the final than on the midterm, your final score replaces your midterm score.",
    publishedAt: d("2026-10-15"),
    resources: [],
  });
  await addItem(term, {
    kind: "EXAM",
    title: "Final Exam",
    week: 11,
    topics: "final exam, Fourier transform, sampling, Laplace transform",
    description: "6:30–9:30 p.m., 180 minutes. One double-sided cheat sheet allowed. The exact date and room are set by the University Registrar: check MyUCLA as the date gets closer.",
    publishedAt: d("2026-09-29"),
  });
  await addItem(term, {
    kind: "REVIEW",
    title: "Practice Midterm",
    date: d("2026-10-15"),
    topics: "practice midterm, midterm review, convolution",
    description: "Released with HW2's due date. Work it under timed conditions (110 minutes) with one double-sided cheat sheet.",
    publishedAt: d("2026-10-15"),
    resources: [
      { type: "PROBLEMS", label: "Practice midterm (PDF)", pdf: { name: "practice-midterm.pdf", title: "ECE 102 Practice Midterm", lines: ["Sample practice exam."] } },
      { type: "SOLUTIONS", label: "Practice midterm solutions", pdf: { name: "practice-midterm-solutions.pdf", title: "Practice Midterm Solutions", lines: ["Sample solutions."] } },
    ],
  });
  await addItem(term, {
    kind: "REVIEW",
    title: "Practice Final",
    date: d("2026-11-29"),
    topics: "practice final, final review",
    description: "Released with HW6's due date.",
    publishedAt: null,
  });

  }

  const ann = [
    {
      title: "HW4 is due this Thursday, 11/12",
      body: "Problem Set 4 (Fourier series, lectures 8–10) is due Thursday on Bruin Learn. HW6 goes out the same day.",
      publishedAt: d("2026-11-09T09:00"),
      pinned: true,
    },
    {
      title: "Today: Lecture 12, Fourier Transform II",
      body: "Slides are posted. The recording will appear on Bruin Learn after class.",
      publishedAt: d("2026-11-10T08:00"),
      pinned: false,
    },
    {
      title: "Welcome to ECE 102!",
      body: "Welcome to Signals and Systems with Prof. Achuta Kadambi. Ask conceptual questions on Piazza so everyone benefits, and put “F26 ECE 102” in the subject line of any email to the TAs.",
      publishedAt: d("2026-09-28T09:00"),
      pinned: false,
    },
  ];
  if (FEATURES.announcements) for (const a of ann) await prisma.announcement.create({ data: { ...a, termId: term.id, isPlaceholder: true } });
  console.log("✓ Fall 2026 (current term, schedule from the syllabus, placeholder files)");
}

// ---------------------------------------------------------------- Spring 2026 (all sample)

async function seedSampleArchive() {
  const term = await prisma.term.create({
    data: {
      slug: "spring-2026",
      quarter: "SPRING",
      year: 2026,
      startDate: d("2026-03-30"),
      numWeeks: 10,
      status: "ARCHIVED",
      isSample: true,
      instructors: "Sample Instructor | | Instructor\nSample TA | | Teaching Assistant",
      overview: "SAMPLE ARCHIVED TERM. This whole term is demo content showing how past quarters stay browsable. Delete it from the admin dashboard when you go live.",
      logistics: "Sample: lectures Tue/Thu, discussions Fri",
      bruinLearnUrl: BRUIN_LEARN,
      weeks: {
        create: ["Signals", "Systems", "Convolution", "Convolution", "Midterm", "Fourier series", "Fourier transform", "Sampling", "Laplace", "Review", "Finals"].map((topic, i) => ({
          number: i + 1,
          topic,
        })),
      },
    },
  });
  const topics = ["Introduction to signals", "Systems and properties", "LTI systems and convolution", "Convolution examples", "Fourier series", "Fourier transform", "Sampling and aliasing", "Laplace transform"];
  for (const [i, t] of topics.entries()) {
    await addItem(term, {
      kind: "LECTURE",
      number: i + 1,
      title: t,
      date: new Date(d("2026-03-31").getTime() + i * 7 * 86_400_000), // one sample lecture per week
      topics: t.toLowerCase(),
      isPlaceholder: true,
      recordingStatus: i === 3 ? "NOT_RECORDED" : "AVAILABLE",
      recordingUrl: i === 3 ? "" : BRUIN_LEARN,
      resources: [...(i === 0 ? SAMPLE_VIDEO : []), { type: "SLIDES", label: `Lecture ${i + 1} slides`, pdf: { name: `s26-lecture-${i + 1}.pdf`, title: `Sample lecture ${i + 1}`, lines: [t] } }],
    });
  }
  if (FEATURES.homeworkAndExams) {
  await addItem(term, {
    kind: "REVIEW",
    title: "Final formula sheet (sample)",
    week: 10,
    isPlaceholder: true,
    topics: "formula sheet, Fourier transform pairs, Laplace transform pairs",
    resources: [{ type: "FORMULA_SHEET", label: "Transform pairs formula sheet", pdf: { name: "formula-sheet.pdf", title: "Sample formula sheet", lines: ["Fourier and Laplace transform pairs"] } }],
  });
  await addItem(term, {
    kind: "HOMEWORK",
    number: 1,
    title: "Sample homework",
    date: d("2026-04-02"),
    dueAt: d("2026-04-09T23:59"),
    isPlaceholder: true,
    resources: [{ type: "PROBLEMS", label: "Sample HW1", pdf: { name: "s26-hw1.pdf", title: "Sample homework 1", lines: [] } }],
  });
  }
  console.log("✓ Spring 2026 (sample archived term)");
}

async function main() {
  await seedAdmin();
  const sample = process.env.SEED_SAMPLE_CONTENT !== "false";
  if ((await prisma.term.count()) > 0) {
    console.log("• Terms already exist; not adding sample content. Use `npm run db:reset` to start over.");
    return;
  }
  if (sample) {
    await seedFall2026();
    await seedSampleArchive();
  } else {
    console.log("• SEED_SAMPLE_CONTENT=false: create your first term in /admin/terms/new.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
