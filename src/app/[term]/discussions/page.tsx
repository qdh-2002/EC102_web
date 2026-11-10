import { SectionList } from "@/components/SectionList";

export const metadata = { title: "Discussion resources" };

export default function Page(props: { params: Promise<{ term: string }>; searchParams: Promise<{ show?: string }> }) {
  return (
    <SectionList
      {...props}
      kind="DISCUSSION"
      title="Discussion resources"
      intro="Weekly discussion slides, practice problems, solutions, and section recordings."
    />
  );
}
