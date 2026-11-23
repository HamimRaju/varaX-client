import { SessionBoundary } from "@/app/components/session-boundary";
import DashboardEntry from "./entry";

export default function DashboardPage() {
  return (
    <SessionBoundary callbackURL="/dashboard">
      <DashboardEntry />
    </SessionBoundary>
  );
}
