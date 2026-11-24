import type { Metadata } from "next";
import AdminSectionPage from "../admin-section-page";

export const metadata: Metadata = {
  title: "All Rentals",
  description: "Monitor VaraX rental bookings and payment status.",
};

export default function AllRentalsPage() {
  return (
    <AdminSectionPage
      section="rentals"
      callbackURL="/dashboard/all-rentals"
    />
  );
}
