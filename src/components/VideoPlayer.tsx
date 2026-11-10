"use client";

import { useEffect, useRef, useState } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

/**
 * In-page player for recordings hosted on this site. Streams with HTTP range
 * requests (instant seeking, no download), remembers where each student left off,
 * and offers playback speed, ±10 s skips and captions.
 */
export function VideoPlayer({ src, title, captions, storageKey }: { src: string; title: string; captions?: string; storageKey: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const key = `ec102:pos:${storageKey}`;

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(key));
      const s = Number(localStorage.getItem("ec102:speed"));
      if (saved > 15) setResumeAt(saved);
      if (SPEEDS.includes(s)) setSpeed(s);
    } catch {}
  }, [key]);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
    try {
      localStorage.setItem("ec102:speed", String(speed));
    } catch {}
  }, [speed]);

  const save = () => {
    const v = ref.current;
    if (!v || !v.duration) return;
    try {
      if (v.currentTime > v.duration - 20) localStorage.removeItem(key);
      else localStorage.setItem(key, String(Math.floor(v.currentTime)));
    } catch {}
  };

  const skip = (s: number) => {
    const v = ref.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || Infinity, v.currentTime + s));
  };
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  return (
    <div className="overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-slate-200">
      <video
        ref={ref}
        src={src}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={(e) => (e.currentTarget.playbackRate = speed)}
        onTimeUpdate={(e) => Math.floor(e.currentTarget.currentTime) % 5 === 0 && save()}
        onPause={save}
        aria-label={`Recording: ${title}`}
        className="aspect-video w-full bg-black"
      >
        {captions && <track kind="captions" src={captions} srcLang="en" label="English" default />}
        Your browser cannot play this video.
      </video>
      <div className="flex flex-wrap items-center gap-2 bg-ucla-darkestblue px-3 py-2 text-sm text-white">
        <button type="button" onClick={() => skip(-10)} className="rounded px-2 py-1 hover:bg-white/10" aria-label="Back 10 seconds">
          ⟲ 10s
        </button>
        <button type="button" onClick={() => skip(10)} className="rounded px-2 py-1 hover:bg-white/10" aria-label="Forward 10 seconds">
          10s ⟳
        </button>
        <label className="ml-1 flex items-center gap-1.5">
          <span className="text-white/70">Speed</span>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded bg-white/10 px-1.5 py-1 text-white [&>option]:text-slate-900">
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        {resumeAt != null && (
          <button
            type="button"
            onClick={() => {
              if (ref.current) {
                ref.current.currentTime = resumeAt;
                ref.current.play().catch(() => {});
              }
              setResumeAt(null);
            }}
            className="ml-auto rounded bg-ucla-gold px-2.5 py-1 font-semibold text-ucla-darkestblue hover:bg-ucla-darkgold"
          >
            Resume at {fmt(resumeAt)}
          </button>
        )}
      </div>
    </div>
  );
}
