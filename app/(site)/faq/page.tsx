import type { Metadata } from "next";
import InfoPage from "@/app/components/info-page";

export const metadata: Metadata = { title: "Frequently Asked Questions" };

export default function FaqPage() {
  return (
    <InfoPage
      title="Frequently Asked Questions"
      intro="Quick answers to common questions about finding and renting equipment through VaraX."
      sections={[
        { title: "How do I find equipment?", copy: "Browse categories or use search, location, rental type, price, and availability filters on the All Equipment page." },
        { title: "How does a booking work?", copy: "Choose equipment, select dates and quantity, provide contact and delivery details, then review the demo checkout." },
        { title: "Can I list my equipment?", copy: "Use the owner demo workspace to add a listing. New preview listings begin in Pending status for admin review." },
        { title: "Are payments real?", copy: "No. Checkout is a frontend demonstration. Stripe and production booking confirmation will be connected during backend integration." },
      ]}
    />
  );
}
