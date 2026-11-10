import { notFound } from "next/navigation";
import { SectionList } from "@/components/SectionList";
import { FEATURES } from "@/lib/constants";

export const metadata = { title: "Discussion resources" };

export default function Page(props: { params: Promise<{ term: string }>; searchParams: Promise<{ show?: string }> }) {
  if (!FEATURES.discussions) notFound();
  return (
    <SectionList
      {...props}
      kind="DISCUSSION"
      title="Discussion resources"
      intro="Weekly discussion slides, practice problems, solutions, and section recordings."
    />
  );
}
