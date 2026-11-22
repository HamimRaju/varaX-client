"use client";

import Link from "next/link";
import styles from "./error.module.css";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className={styles.errorPage}>
      <section className={styles.errorCard} aria-labelledby="error-title">
        <span className={styles.errorIcon} aria-hidden="true">!</span>
        <span className={styles.errorEyebrow}>SOMETHING WENT WRONG</span>
        <h1 id="error-title">We couldn&apos;t load this page.</h1>
        <p>Your work is safe. Try again, or return to the VaraX home page.</p>
        <div className={styles.errorActions}>
          <button type="button" onClick={retry}>Try again</button>
          <Link href="/">Back to home</Link>
        </div>
      </section>
    </main>
  );
}
