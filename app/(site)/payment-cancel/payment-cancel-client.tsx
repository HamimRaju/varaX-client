"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/app/lib/api";
import { usePlatform } from "@/app/lib/platform-context";
import styles from "../payment/payment.module.css";

export default function PaymentCancelClient({
  bookingId,
}: {
  bookingId: string;
}) {
  const router = useRouter();
  const { ready, user, getPaymentStatus } = usePlatform();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (ready && (!user || user.role !== "customer")) {
      router.replace(`/login?callbackURL=${encodeURIComponent(`/payment-cancel?bookingId=${bookingId}`)}`);
    }
  }, [bookingId, ready, router, user]);

  useEffect(() => {
    if (!ready || !user || user.role !== "customer" || !bookingId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void getPaymentStatus(bookingId)
        .then((payment) => {
          if (active) setStatus(payment.status);
        })
        .catch((error: unknown) => {
          if (active) setMessage(getErrorMessage(error, "Payment status could not be checked."));
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [bookingId, getPaymentStatus, ready, user]);

  if (!ready || !user || user.role !== "customer") {
    return <main className={styles.checkoutPage}><p className={styles.loading}>Checking your checkout…</p></main>;
  }

  const paid = status === "paid";
  return (
    <main className={styles.checkoutPage}>
      <section className={styles.checkoutCard}>
        <span className={styles.secureIcon}>{paid ? "✓" : "×"}</span>
        <span className={styles.eyebrow}>STRIPE CHECKOUT</span>
        <h1>{paid ? "Payment received" : "Checkout cancelled"}</h1>
        <p className={styles.subheading}>
          {paid
            ? "Stripe confirmed this payment. Your booking is being updated."
            : "No payment was confirmed. Your booking remains unpaid; you can return to checkout to try again."}
        </p>
        {message ? <p className={styles.paymentError} role="alert">{message}</p> : null}
        <div className={styles.cancelActions}>
          {paid ? (
            <Link className={styles.primaryButton} href={`/payment-success?bookingId=${encodeURIComponent(bookingId)}`}>
              View payment status
            </Link>
          ) : (
            <Link className={styles.primaryButton} href={`/payment?bookingId=${encodeURIComponent(bookingId)}`}>
              Return to checkout
            </Link>
          )}
          <Link className={styles.cancelLink} href={`/dashboard/customer/rentals`}>View my rentals</Link>
        </div>
      </section>
    </main>
  );
}
