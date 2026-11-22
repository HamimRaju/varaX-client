"use client";

import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  jwtClient,
} from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [jwtClient(), inferAdditionalFields<typeof auth>()],
});

export async function getBackendAccessToken(): Promise<string> {
  const { data, error } = await authClient.token();
  if (error || !data?.token) {
    throw new Error("Could not retrieve a VaraX API access token.");
  }
  return data.token;
}
