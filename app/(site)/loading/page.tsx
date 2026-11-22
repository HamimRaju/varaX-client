import type { Metadata } from "next";
import { LoadingState } from "@/app/components/page-states";

export const metadata: Metadata = {
  title: "Loading VaraX",
};

export default function LoadingPreviewPage() {
  return <LoadingState />;
}
