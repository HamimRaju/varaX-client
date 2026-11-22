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
        { title: "Demo limitation", copy: "This frontend preview does not create legally binding bookings or process charges. Production terms must be supplied before launch." },
      ]}
    />
  );
}
