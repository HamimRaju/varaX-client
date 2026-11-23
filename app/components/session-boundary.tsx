import { Suspense, type ReactNode } from "react";
import { LoadingState } from "@/app/components/page-states";
import { requireSession, type AuthRole } from "@/app/lib/server-auth";

type SessionBoundaryProps = {
  callbackURL: string;
  requiredRole?: AuthRole;
  children: ReactNode;
};

export function SessionBoundary({
  callbackURL,
  requiredRole,
  children,
}: SessionBoundaryProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthenticatedContent callbackURL={callbackURL} requiredRole={requiredRole}>
        {children}
      </AuthenticatedContent>
    </Suspense>
  );
}

async function AuthenticatedContent({
  callbackURL,
  requiredRole,
  children,
}: SessionBoundaryProps) {
  await requireSession(callbackURL, requiredRole);
  return children;
}
