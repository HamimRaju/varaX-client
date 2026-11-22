import Link from "next/link";
import styles from "./page-states.module.css";

export function LoadingState() {
  return (
    <main className={styles.statePage}>
      <section className={styles.loadingCard} aria-label="Loading VaraX">
        <span className={styles.spinner} aria-hidden="true" />
        <h1>Loading VaraX...</h1>
        <p>Please wait a moment</p>
      </section>
    </main>
  );
}

function RoadworkIllustration() {
  return (
    <svg className={styles.roadwork} viewBox="0 0 220 130" fill="none" role="img" aria-label="Roadwork cones and a barricade">
      <ellipse cx="107" cy="114" rx="90" ry="7" fill="#E9EEF0" />
      <path d="m36 94 16-55 17 55H36Z" fill="#F1A04D" />
      <path d="m43 70 18 5-4 13-18-4 4-14Z" fill="#FFF7EC" />
      <path d="M31 95h42v7H31z" fill="#354B59" />
      <path d="m139 95 14-49 15 49h-29Z" fill="#F1A04D" />
      <path d="m145 73 18 4-4 12-18-3 4-13Z" fill="#FFF7EC" />
      <path d="M134 96h40v6h-40z" fill="#354B59" />
      <path d="M81 52h51v7H81z" fill="#334956" />
      <path d="M86 60h5v35h-5zM122 60h5v35h-5z" fill="#334956" />
      <path d="m81 57 51 31v8L81 65v-8Z" fill="#F0A04D" />
      <path d="m87 61 9 5v8l-9-5v-8Zm17 10 9 5v8l-9-5v-8Z" fill="#FFF6EA" />
      <path d="M74 99h67v5H74z" fill="#526771" />
      <circle cx="191" cy="34" r="2" fill="#EBB65B" />
      <circle cx="23" cy="40" r="2" fill="#69BDAA" />
      <path d="m185 55 2 4 4 .6-3 2.9.7 4-3.7-1.9-3.6 1.9.7-4-3-2.9 4.1-.6 1.8-4Z" fill="#70BDAA" />
    </svg>
  );
}

export function NotFoundState() {
  return (
    <main className={styles.statePage}>
      <section className={styles.notFoundCard} aria-labelledby="not-found-title">
        <RoadworkIllustration />
        <p className={styles.errorCode}>404</p>
        <h1 id="not-found-title">Page Not Found</h1>
        <p className={styles.notFoundCopy}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link className={styles.homeButton} href="/">
          Go Home
        </Link>
      </section>
    </main>
  );
}
