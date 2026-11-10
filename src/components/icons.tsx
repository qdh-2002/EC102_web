import type { SVGProps } from "react";

// Small inline icon set (no icon font / network request). All icons are decorative
// by default; pair them with visible text or an aria-label on the parent.
type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 16, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconVideo = (p: P) => (
  <Base {...p}><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 10 6-3v10l-6-3" /></Base>
);
export const IconSlides = (p: P) => (
  <Base {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M12 17v4M8 21h8M7 8h6M7 12h10" /></Base>
);
export const IconFile = (p: P) => (
  <Base {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Base>
);
export const IconNotes = (p: P) => (
  <Base {...p}><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h4" /></Base>
);
export const IconCheck = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Base>
);
export const IconSigma = (p: P) => (
  <Base {...p}><path d="M18 4H6l6 8-6 8h12" /></Base>
);
export const IconCode = (p: P) => (
  <Base {...p}><path d="m8 7-5 5 5 5M16 7l5 5-5 5" /></Base>
);
export const IconLink = (p: P) => (
  <Base {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></Base>
);
export const IconPencil = (p: P) => (
  <Base {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" /></Base>
);
export const IconLock = (p: P) => (
  <Base {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Base>
);
export const IconClock = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Base>
);
export const IconSearch = (p: P) => (
  <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Base>
);
export const IconMenu = (p: P) => (
  <Base {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Base>
);
export const IconX = (p: P) => (
  <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>
);
export const IconCalendar = (p: P) => (
  <Base {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Base>
);
export const IconMegaphone = (p: P) => (
  <Base {...p}><path d="m3 11 15-6v14L3 13z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></Base>
);
export const IconArchive = (p: P) => (
  <Base {...p}><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" /></Base>
);
export const IconExternal = (p: P) => (
  <Base {...p}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Base>
);
export const IconDownload = (p: P) => (
  <Base {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Base>
);
export const IconHome = (p: P) => (
  <Base {...p}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Base>
);
export const IconBook = (p: P) => (
  <Base {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></Base>
);
export const IconUsers = (p: P) => (
  <Base {...p}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" /></Base>
);
export const IconClipboard = (p: P) => (
  <Base {...p}><rect x="5" y="4" width="14" height="18" rx="2" /><path d="M9 2h6v4H9zM9 12h6M9 16h4" /></Base>
);
export const IconWave = (p: P) => (
  <Base {...p}><path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0" /></Base>
);
export const IconSparkle = (p: P) => (
  <Base {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></Base>
);
export const IconAlert = (p: P) => (
  <Base {...p}><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18h.01" /></Base>
);
export const IconSettings = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Base>
);
export const IconChevronRight = (p: P) => (
  <Base {...p}><path d="m9 6 6 6-6 6" /></Base>
);
