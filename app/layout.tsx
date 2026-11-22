import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { DemoPlatformProvider } from "@/app/lib/demo-platform";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VaraX | Rent Smart. Work Better.",
    template: "%s | VaraX",
  },
  description:
    "Rent trusted equipment across Bangladesh with VaraX. Find flexible rentals for work, events, and everyday projects.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DemoPlatformProvider>{children}</DemoPlatformProvider>
      </body>
    </html>
  );
}
