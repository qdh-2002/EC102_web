/**
 * Turn a recording URL into something we can embed. Anything we do not
 * recognise (including Bruin Learn / Bruincast links, which need a UCLA login)
 * is shown as an external "Watch" link instead of an iframe.
 */
export type Embed =
  | { kind: "iframe"; src: string; provider: string }
  | { kind: "video"; src: string; provider: string }
  | { kind: "link"; href: string; provider: string };

export function providerName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("bruinlearn") || host.includes("instructure")) return "Bruin Learn";
    if (host.includes("bruincast") || host.includes("kaltura")) return "Bruincast";
    if (host.includes("youtube") || host === "youtu.be") return "YouTube";
    if (host.includes("vimeo")) return "Vimeo";
    if (host.includes("zoom.us")) return "Zoom";
    if (host.includes("box.com")) return "Box";
    if (host.includes("drive.google")) return "Google Drive";
    if (host.includes("gradescope")) return "Gradescope";
    if (host.includes("piazza") || host.includes("campuswire") || host.includes("edstem")) return "Q&A forum";
    return host;
  } catch {
    return "Link";
  }
}

export function toEmbed(url: string): Embed | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const provider = providerName(url);

  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (/^[\w-]{6,}$/.test(id)) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}`, provider };
  }
  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}`, provider };
  }
  if (host.endsWith("vimeo.com")) {
    const id = u.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}`, provider };
  }
  if (host === "drive.google.com") {
    const id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview`, provider };
  }
  if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return { kind: "video", src: url, provider: "Video file" };

  return { kind: "link", href: url, provider };
}
