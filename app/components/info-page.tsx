import Link from "next/link";
import styles from "./info-page.module.css";

export type InfoSection = { title: string; copy: string };

export default function InfoPage({ title, intro, sections }: {
  title: string;
  intro: string;
  sections: InfoSection[];
}) {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <span className={styles.eyebrow}>VARAX MARKETPLACE</span>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
        <div className={styles.notice}>This information is a frontend project preview and should be reviewed before public launch.</div>
        {sections.map((section) => (
          <section className={styles.section} key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.copy}</p>
          </section>
        ))}
        <Link className={styles.link} href="/">Return to VaraX <span aria-hidden="true">→</span></Link>
      </article>
    </main>
  );
}
