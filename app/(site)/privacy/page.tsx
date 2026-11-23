import type { Metadata } from "next";
import InfoPage from "@/app/components/info-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="VaraX uses account and rental details to operate the equipment marketplace and protect customer and owner accounts."
      sections={[
        { title: "Information we store", copy: "Account information, equipment listings, favorites, booking details, and payment status are stored in MongoDB and are used to provide the services you request." },
        { title: "Authentication and payments", copy: "Better Auth manages sign-in sessions. Express APIs verify short-lived access tokens. Stripe processes card payments; VaraX does not receive or store card numbers." },
        { title: "Image uploads", copy: "Profile and equipment images are uploaded to ImgBB and the resulting hosted image URL is saved with the corresponding account or listing." },
        { title: "Browser storage and retention", copy: "The browser stores only the selected display theme for convenience. Authentication is held in secure HTTP-only cookies; account and rental data is not stored in browser local storage." },
        { title: "Privacy contact", copy: "Before public launch, replace this summary with reviewed legal terms, a data-retention schedule, and a monitored privacy contact address." },
      ]}
    />
  );
}
