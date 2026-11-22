import type { Metadata } from "next";
import InfoPage from "@/app/components/info-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      intro="Your account and rental details should be handled with care and used only to support the marketplace experience."
      sections={[
        { title: "Information in this preview", copy: "Demo profile, favorite, listing, and booking changes are stored in your browser so you can explore the interface." },
        { title: "How information is used", copy: "In a production service, contact and booking information would be used to coordinate rentals, support accounts, and maintain platform safety." },
        { title: "Browser storage", copy: "Clear this browser's local storage to remove locally saved demo data. Do not enter sensitive payment information in this preview." },
        { title: "Before launch", copy: "A production privacy policy must be updated to describe the final backend, analytics, data retention, and user rights." },
      ]}
    />
  );
}
