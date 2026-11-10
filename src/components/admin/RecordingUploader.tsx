"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Uploads a recording with a progress bar (XHR streams the file; works for multi-GB videos). */
export function RecordingUploader({ itemId, current }: { itemId: string; current?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const upload = () => {
    const file = input.current?.files?.[0];
    if (!file) return;
    setMsg(null);
    setPct(0);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/admin/recording/${itemId}`);
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    xhr.setRequestHeader("content-type", "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setPct(null);
      let body: { error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        setMsg({ ok: true, text: "Recording uploaded. Students can now watch it on the page." });
        if (input.current) input.current.value = "";
        router.refresh();
      } else setMsg({ ok: false, text: body.error || `Upload failed (${xhr.status}).` });
    };
    xhr.onerror = () => {
      setPct(null);
      setMsg({ ok: false, text: "Network error during upload." });
    };
    xhr.send(file);
  };

  return (
    <div className="space-y-2 rounded-lg bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-800">Upload a video file (plays in the browser, no download needed)</p>
      {current && <p className="text-xs text-slate-600">Current recording: {current}. Uploading a new one replaces it.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`rec-${itemId}`} className="sr-only">Recording video file</label>
        <input id={`rec-${itemId}`} ref={input} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.m4v,.mov,.webm" className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ucla-lighterblue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ucla-darkestblue" />
        <button type="button" onClick={upload} disabled={pct !== null} className="btn-primary">
          {pct !== null ? `Uploading ${pct}%` : "Upload recording"}
        </button>
      </div>
      {pct !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
          <div className="h-full bg-ucla-blue transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>}
      <p className="hint">MP4 (H.264/AAC) plays everywhere. Add a “Captions (.vtt)” file below to show subtitles.</p>
    </div>
  );
}
