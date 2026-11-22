import type { Metadata } from "next";
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
  return <PaymentCheckout bookingId={bookingId ?? ""} />;
}
