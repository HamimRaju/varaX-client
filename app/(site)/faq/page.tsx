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
        { title: "How does a booking work?", copy: "Choose equipment, select dates and quantity, provide contact and delivery details, then pay through Stripe Checkout. The booking is confirmed only after Stripe verifies payment through its webhook." },
        { title: "Can I list my equipment?", copy: "Create an account, ask VaraX to assign the Owner role, and submit a listing from the owner workspace. New listings remain Pending until an administrator reviews them." },
        { title: "Are payments real?", copy: "Checkout uses the Stripe account configured for this deployment. The platform must be configured with valid Stripe credentials and a verified webhook before payments can be enabled." },
      ]}
    />
  );
}
