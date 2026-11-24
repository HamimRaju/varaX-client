import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";

export type AuthRole = "customer" | "owner" | "admin";

function normalizeRole(value: unknown): AuthRole {
  return value === "owner" || value === "admin" ? value : "customer";
}

export async function requireSession(
  callbackURL: string,
  requiredRole?: AuthRole,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/login?callbackURL=${encodeURIComponent(callbackURL)}`);
  }

  const role = normalizeRole(session.user.role);
  if (requiredRole && role !== requiredRole) {
    redirect(role === "customer" ? "/equipment" : `/dashboard/${role}`);
  }
  return { ...session, user: { ...session.user, role } };
}
