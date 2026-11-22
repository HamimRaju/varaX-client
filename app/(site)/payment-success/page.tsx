import type { Metadata } from "next";
import PaymentSuccessClient from "./payment-success-client";

export const metadata: Metadata = {
  title: "Checkout Confirmation",
  description: "Review the status of your VaraX demo booking.",
};

type PaymentSuccessPageProps = {
  searchParams: Promise<{ bookingId?: string | string[] }>;
};

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const params = await searchParams;
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;
  return <PaymentSuccessClient bookingId={bookingId ?? ""} />;
}
