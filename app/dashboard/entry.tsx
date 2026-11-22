"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemoPlatform } from "@/app/lib/demo-platform";
import styles from "./workspace.module.css";

export default function DashboardEntry() {
  const router = useRouter();
  const { ready, user } = useDemoPlatform();

  useEffect(() => {
    if (ready && user) router.replace(`/dashboard/${user.role}`);
  }, [ready, router, user]);

  if (!ready || user) {
    return <main className={styles.entryPage}><p>Opening your VaraX workspace…</p></main>;
  }

  return (
    <main className={styles.entryPage}>
      <div className={styles.entryShell}>
        <Link className={styles.backHome} href="/">← Back to VaraX</Link>
        <span className={styles.workspaceEyebrow}>YOUR VARAX WORKSPACE</span>
        <h1>Sign in to continue</h1>
        <p className={styles.entryIntro}>
          Your server-assigned account role determines which workspace you can access.
        </p>
        <Link
          className={styles.primaryAction}
          href="/login?callbackURL=%2Fdashboard"
        >
          Sign in to VaraX <span aria-hidden="true">→</span>
        </Link>
        <p className={styles.entryLogin}>
          New to VaraX? <Link href="/register">Create a customer account</Link>
        </p>
      </div>
    </main>
  );
}
