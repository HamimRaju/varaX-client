import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/app/components/page-states";
import { requireSession } from "@/app/lib/server-auth";
import PaymentCancelClient from "./payment-cancel-client";

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: "Your Stripe checkout was cancelled; no payment was confirmed.",
};

type PaymentCancelPageProps = {
  searchParams: Promise<{ bookingId?: string | string[] }>;
};

export default function PaymentCancelPage({
  searchParams,
}: PaymentCancelPageProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentCancelContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PaymentCancelContent({
  searchParams,
}: PaymentCancelPageProps) {
  const params = await searchParams;
  const bookingId = Array.isArray(params.bookingId)
    ? params.bookingId[0]
    : params.bookingId;
  await requireSession(
    `/payment-cancel?bookingId=${encodeURIComponent(bookingId ?? "")}`,
    "customer",
  );
  return <PaymentCancelClient bookingId={bookingId ?? ""} />;
}
