import type { ReactNode } from "react";
import { SessionBoundary } from "@/app/components/session-boundary";

export default function OwnerDashboardRoute({
  callbackURL,
  children,
}: {
  callbackURL: string;
  children: ReactNode;
}) {
  return (
    <SessionBoundary callbackURL={callbackURL} requiredRole="owner">
      {children}
    </SessionBoundary>
  );
}
