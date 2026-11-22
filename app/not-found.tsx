import SiteNavbar from "@/app/components/site-navbar";
import SiteFooter from "@/app/components/site-footer";
import { NotFoundState } from "@/app/components/page-states";

export default function NotFound() {
  return (
    <>
      <SiteNavbar />
      <NotFoundState />
      <SiteFooter />
    </>
  );
}
