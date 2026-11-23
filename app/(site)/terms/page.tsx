import type { Metadata } from "next";
import InfoPage from "@/app/components/info-page";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms & Conditions"
      intro="A clear rental experience starts with shared expectations between equipment owners and renters."
      sections={[
        { title: "Using VaraX", copy: "Use accurate account details, communicate respectfully, and only list or request equipment you are authorized to use." },
        { title: "Rental requests", copy: "A booking request describes your preferred dates and quantity. Availability, delivery, deposits, and final terms must be confirmed with the equipment owner." },
        { title: "Equipment care", copy: "Renters should use equipment responsibly and return it in the condition agreed with the owner. Owners should provide accurate listing details." },
        { title: "Bookings and payment", copy: "Bookings are subject to availability and owner coordination. A payment is considered complete only after Stripe confirms it to VaraX; checkout redirects alone do not establish payment." },
        { title: "Before launch", copy: "These informational terms are not a substitute for locally reviewed rental, liability, cancellation, privacy, and payment terms. Obtain legal review before accepting real customers." },
      ]}
    />
  );
}
