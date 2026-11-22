import Link from "next/link";
import styles from "./site-footer.module.css";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "All Equipment", href: "/equipment" },
  { label: "About", href: "/#about" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Contact", href: "/#contact" },
];

const supportLinks = [
  { label: "Help Center", href: "mailto:info@varax.com?subject=Help%20Center" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "FAQ", href: "/faq" },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "X", href: "https://x.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
];

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path d="M3 6h9l8 17 8-17h9L23 35h-7L3 6Z" fill="#16A085" />
        <path d="M20 23 28 6h9L23 35h-7l-3-6 7-6Z" fill="#F5F7F8" />
      </svg>
    </span>
  );
}

function SocialIcon({ label }: { label: string }) {
  if (label === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.4 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.5 1.6-1.5h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.2v3.2H10V21h3.4Z" />
      </svg>
    );
  }

  if (label === "X") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.9 3h2.8l-6.1 7 7.2 11h-5.6l-4.4-6.7L7 21H4.2l6.5-7.5L3.8 3h5.7l4 6.2L18.9 3Zm-1 16h1.6L8.7 4.9H7L17.9 19Z" />
      </svg>
    );
  }

  if (label === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.8 15.6V8.4l6.1 3.6-6.1 3.6Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.4 3H3.6a.6.6 0 0 0-.6.6v16.8a.6.6 0 0 0 .6.6h16.8a.6.6 0 0 0 .6-.6V3.6a.6.6 0 0 0-.6-.6ZM8.3 18H5.4V9.2h2.9V18ZM6.9 8a1.7 1.7 0 1 1 0-3.4A1.7 1.7 0 0 1 6.9 8ZM18.6 18h-2.9v-4.3c0-1 0-2.2-1.4-2.2s-1.6 1.1-1.6 2.1V18H9.8V9.2h2.8v1.2h.1a3 3 0 0 1 2.7-1.5c2.9 0 3.4 1.9 3.4 4.3V18Z" />
    </svg>
  );
}

function ContactIcon({ kind }: { kind: "phone" | "email" | "location" }) {
  if (kind === "phone") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m7.2 3.8 2.4-.6 2 4.7-1.8 1.5a15 15 0 0 0 4.8 4.8l1.5-1.8 4.7 2-.6 2.4a2 2 0 0 1-2.1 1.5A16.2 16.2 0 0 1 5.7 6a2 2 0 0 1 1.5-2.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "email") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="m4.5 7 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 10c0 5-7 10.2-7 10.2S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.footerCard}>
        <div className={styles.footerContent}>
          <section className={styles.brandColumn} aria-label="About VaraX">
            <Link className={styles.brand} href="/" aria-label="VaraX home">
              <BrandMark />
              <span>
                Vara<span className={styles.brandX}>X</span>
              </span>
            </Link>
            <p className={styles.tagline}>Rent Smart. Work Better.</p>
            <p className={styles.description}>
              Bangladesh&apos;s trusted equipment rental marketplace.
            </p>
            <nav className={styles.socialLinks} aria-label="Social media">
              {socialLinks.map(({ label, href }) => (
                <a
                  className={styles.socialLink}
                  href={href}
                  key={label}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <SocialIcon label={label} />
                </a>
              ))}
            </nav>
          </section>

          <nav className={styles.linkColumn} aria-label="Quick links">
            <h2>Quick Links</h2>
            <ul>
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.linkColumn} aria-label="Support">
            <h2>Support</h2>
            <ul>
              {supportLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className={styles.contactColumn} aria-labelledby="footer-contact-title">
            <h2 id="footer-contact-title">Contact Us</h2>
            <ul>
              <li>
                <ContactIcon kind="phone" />
                <a href="tel:+8801234567890">+880 1234 567890</a>
              </li>
              <li>
                <ContactIcon kind="email" />
                <a href="mailto:info@varax.com">info@varax.com</a>
              </li>
              <li>
                <ContactIcon kind="location" />
                <a
                  href="https://maps.google.com/?q=Dhaka%2C+Bangladesh"
                  target="_blank"
                  rel="noreferrer"
                >
                  Dhaka, Bangladesh
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className={styles.footerBottom}>
          <p>
            © 2026 VaraX. All rights reserved
            <span className={styles.heart} aria-label="with love">
              {" "}♥
            </span>
          </p>
          <a className={styles.backToTop} href="#top">
            <span aria-hidden="true">↑</span> Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
