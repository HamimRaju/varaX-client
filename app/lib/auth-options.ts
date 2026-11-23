import { jwt } from "better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";

type AuthDatabase = NonNullable<BetterAuthOptions["database"]>;

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be configured for Better Auth.`);
  }
  return value;
}

function trustedOrigin(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    throw new Error("Configured Better Auth origins must be valid URLs.");
  }
}

export function createAuthOptions(database: AuthDatabase) {
  const baseURL = requiredEnvironmentValue("BETTER_AUTH_URL");
  const secret = requiredEnvironmentValue("BETTER_AUTH_SECRET");
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
    throw new Error(
      "Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google sign-in.",
    );
  }

  const isProduction = process.env.NODE_ENV === "production";
  const issuer = process.env.JWT_ISSUER?.trim() || new URL(baseURL).origin;
  const audience = process.env.JWT_AUDIENCE?.trim() || "varax-api";
  const origins = [
    trustedOrigin(process.env.NEXT_PUBLIC_APP_URL),
    trustedOrigin(process.env.CLIENT_URL),
    trustedOrigin(baseURL),
  ];

  return {
    appName: "VaraX",
    baseURL,
    secret,
    database,
    trustedOrigins: [...new Set(origins.filter((origin): origin is string => Boolean(origin)))],
    user: {
      modelName: "users",
      additionalFields: {
        role: {
          type: ["customer", "owner", "admin"],
          required: false,
          defaultValue: "customer",
          input: false,
        },
        isActive: {
          type: "boolean",
          required: false,
          defaultValue: true,
          input: false,
        },
        phone: { type: "string", required: false },
        address: { type: "string", required: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              role: "customer",
              isActive: true,
            },
          }),
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
      minPasswordLength: 6,
      maxPasswordLength: 128,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-up/email": { window: 3_600, max: 5 },
        "/sign-in/social": { window: 60, max: 10 },
        "/sign-up/social": { window: 3_600, max: 10 },
      },
    },
    ...(googleClientId && googleClientSecret
      ? {
          socialProviders: {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          },
        }
      : {}),
    advanced: {
      database: {
        // MongoDB-generated ObjectIds match the Mongoose User references.
        generateId: false,
      },
      useSecureCookies: isProduction,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      },
    },
    plugins: [
      jwt({
        jwks: {
          keyPairConfig: { alg: "EdDSA", crv: "Ed25519" },
        },
        jwt: {
          issuer,
          audience,
          expirationTime: "15m",
          definePayload: ({ user }) => ({
            email: user.email,
            role: user.role ?? "customer",
          }),
        },
      }),
    ],
  } satisfies BetterAuthOptions;
}
