export const metadata = { title: "Help" };

const steps: { title: string; body: React.ReactNode }[] = [
  { title: "Post a lecture", body: <>Course content → <em>+ New lecture</em>. Fill in number, title and date (the week is worked out automatically), set status to <em>Published</em>, then attach slides and notes in the panel on the right. Set the recording status to <em>Recording coming soon</em> until the video is ready.</> },
  { title: "Add the recording later", body: <>Open the lecture, paste the link under <em>Recording</em> and save. YouTube, Vimeo and Google Drive links play on the page. Bruincast / Bruin Learn Media Gallery links open behind UCLA login, which keeps protected recordings protected.</> },
  { title: "Release solutions automatically", body: <>Attach the solutions with type <em>Solutions</em> and a <em>Release at</em> time after the due date. Students see “Available …” until then. If solutions must stay on Bruin Learn, choose access <em>Bruin Learn only</em> and paste the Bruin Learn link.</> },
  { title: "Copyrighted or protected material", body: <><strong>Public on this site</strong>: anyone with the link can download. <strong>Bruin Learn only</strong>: the site shows a lock and sends students to Bruin Learn; uploaded files are never served publicly. <strong>Course staff only</strong>: hidden from students entirely (answer keys, drafts).</> },
  { title: "Fix a mistake", body: <>Edit and save. To announce a corrected file, use <em>Flag as newly updated</em> so it shows a “New” badge again.</> },
  { title: "Start a new quarter", body: <>Admins: Terms → <em>+ New term</em> → <em>Start from a previous term</em>. Everything is copied as drafts with dates shifted, and each lecture keeps its existing recording link (there is one recording per lecture, reused every year). The new term&apos;s dates become this year&apos;s course calendar, which shows students what has already been covered. Review, make the new term current, and archive the old one. Students can still browse old terms under <em>All terms &amp; archive</em>.</> },
  { title: "Go live", body: <>Before launch, an admin removes all sample content from the Dashboard in one click.</> },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-ucla-darkestblue">How to manage the course site</h1>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="card p-5">
            <h2 className="font-bold text-slate-900">{i + 1}. {s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{s.body}</p>
          </li>
        ))}
      </ol>
      <p className="text-sm text-slate-500">More detail is in docs/MAINTENANCE.md in the project repository.</p>
    </div>
  );
}
