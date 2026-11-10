import { SectionList } from "@/components/SectionList";

export const metadata = { title: "Lecture library" };

export default function Page(props: { params: Promise<{ term: string }>; searchParams: Promise<{ show?: string }> }) {
  return (
    <SectionList
      {...props}
      kind="LECTURE"
      title="Lecture library"
      intro="Every lecture with its recording, slides, and supplementary notes, organized by week."
    />
  );
}
