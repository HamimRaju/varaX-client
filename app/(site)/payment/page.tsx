import type { Metadata } from "next";
import { requireSession } from "@/app/lib/server-auth";
import PaymentCheckout from "./payment-checkout";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your VaraX rental before continuing to payment.",
};

type PaymentPageProps = {
  searchParams: Promise<{ bookingId?: string | string[] }>;
};

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = await searchParams;
  const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;
  await requireSession(`/payment?bookingId=${encodeURIComponent(bookingId ?? "")}`, "customer");
  return <PaymentCheckout bookingId={bookingId ?? ""} />;
}
