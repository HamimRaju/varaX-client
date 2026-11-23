import type { Metadata } from "next";
import { requireSession } from "@/app/lib/server-auth";
import PaymentSuccessClient from "./payment-success-client";

export const metadata: Metadata = {
  title: "Checkout Confirmation",
  description: "Review the verified status of your VaraX payment.",
};

type PaymentSuccessPageProps = {
  searchParams: Promise<{ bookingId?: string | string[] }>;
};

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const params = await searchParams;
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;
  await requireSession(`/payment-success?bookingId=${encodeURIComponent(bookingId ?? "")}`, "customer");
  return <PaymentSuccessClient bookingId={bookingId ?? ""} />;
}
