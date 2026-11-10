import { renderDetail, detailMetadata } from "@/components/section-detail";

type P = { params: Promise<{ term: string; id: string }> };

export const generateMetadata = ({ params }: P) => detailMetadata(params);

export default function Page({ params }: P) {
  return renderDetail(params, ["DISCUSSION"]);
}
