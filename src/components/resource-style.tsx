import type { ResourceType } from "@/lib/constants";
import { IconCheck, IconCode, IconFile, IconLink, IconNotes, IconPencil, IconSigma, IconSlides, IconVideo } from "./icons";

/**
 * One place that decides how each resource type looks, so slides, recordings,
 * PDFs etc. are recognisable everywhere on the site. Colour is never the only
 * cue: every chip also shows an icon and a text label.
 */
export const RESOURCE_STYLE: Record<ResourceType | "RECORDING", { Icon: (p: { size?: number }) => React.ReactElement; chip: string }> = {
  RECORDING: { Icon: IconVideo, chip: "bg-rose-50 text-rose-800 ring-rose-200" },
  VIDEO: { Icon: IconVideo, chip: "bg-rose-50 text-rose-800 ring-rose-200" },
  SLIDES: { Icon: IconSlides, chip: "bg-sky-50 text-sky-900 ring-sky-200" },
  NOTES: { Icon: IconNotes, chip: "bg-amber-50 text-amber-900 ring-amber-200" },
  HANDOUT: { Icon: IconFile, chip: "bg-slate-50 text-slate-800 ring-slate-200" },
  PROBLEMS: { Icon: IconPencil, chip: "bg-indigo-50 text-indigo-900 ring-indigo-200" },
  SOLUTIONS: { Icon: IconCheck, chip: "bg-emerald-50 text-emerald-900 ring-emerald-200" },
  FORMULA_SHEET: { Icon: IconSigma, chip: "bg-violet-50 text-violet-900 ring-violet-200" },
  CAPTIONS: { Icon: IconNotes, chip: "bg-slate-50 text-slate-800 ring-slate-200" },
  CODE: { Icon: IconCode, chip: "bg-teal-50 text-teal-900 ring-teal-200" },
  LINK: { Icon: IconLink, chip: "bg-slate-50 text-slate-800 ring-slate-200" },
};
