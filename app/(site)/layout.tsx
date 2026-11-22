import type { ReactNode } from "react";
import SiteFooter from "@/app/components/site-footer";
import SiteNavbar from "@/app/components/site-navbar";
import styles from "./site-layout.module.css";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div id="top" className={styles.siteLayout}>
      <SiteNavbar />
      {children}
      <SiteFooter />
    </div>
  );
}
