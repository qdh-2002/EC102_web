import { toEmbed } from "@/lib/embed";
import { VideoPlayer } from "./VideoPlayer";
import { IconClock, IconExternal, IconLock, IconVideo } from "./icons";

export function RecordingPlayer({
  url,
  status,
  title,
  video,
}: {
  url: string;
  status: string;
  title: string;
  /** An uploaded recording on this site; takes priority over the link. */
  video?: { src: string; captions?: string; key: string } | null;
}) {
  if (video) return <VideoPlayer src={video.src} captions={video.captions} title={title} storageKey={video.key} />;
  if (status === "PENDING" || (status === "AVAILABLE" && !url)) {
    return (
      <Placeholder icon={<IconClock size={28} />} title="Recording coming soon">
        Recordings are usually posted within 24–48 hours of class. Check back later.
      </Placeholder>
    );
  }
  if (status === "NOT_RECORDED") {
    return (
      <Placeholder icon={<IconVideo size={28} />} title="This session was not recorded">
        Please use the slides and notes below, or ask on the course Q&amp;A forum.
      </Placeholder>
    );
  }
  if (status !== "AVAILABLE") return null;

  const e = toEmbed(url);
  if (!e) return null;
  if (e.kind === "iframe") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-slate-200">
        <iframe
          src={e.src}
          title={`Recording: ${title}`}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  if (e.kind === "video") return <VideoPlayer src={e.src} title={title} storageKey={url} />;
  const protectedHost = e.provider === "Bruin Learn" || e.provider === "Bruincast" || e.provider === "Zoom";
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-gradient-to-br from-ucla-darkestblue to-ucla-blue p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15">
          <IconVideo size={24} />
        </span>
        <div>
          <p className="font-semibold">Recording on {e.provider}</p>
          <p className="text-sm text-white/80">
            {protectedHost ? "Course recordings are protected. Sign in with your UCLA Logon to watch." : "Opens in a new tab."}
          </p>
        </div>
      </div>
      <a
        href={e.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-ucla-gold px-4 py-2 font-semibold text-ucla-darkestblue hover:bg-ucla-darkgold"
      >
        {protectedHost ? <IconLock size={16} /> : null} Watch recording <IconExternal size={14} />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  );
}

function Placeholder({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-slate-600">
      <span className="text-slate-400">{icon}</span>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );
}
