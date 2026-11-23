# VaraX client

The VaraX client is the Next.js App Router frontend for the equipment-rental marketplace. User, equipment, favorite, booking, payment, and dashboard data comes from `varaX-server`; the client contains no seeded users or listing fixtures.

## Stack and local development

- Node.js 20.19 or newer
- Next.js 16, React 19, TypeScript
- Better Auth 1.7 with its MongoDB adapter and JWT plugin

```sh
npm ci
cp .env.example .env
# Fill in the values below; do not commit .env.
npm run dev
```

The frontend is available at `http://localhost:3000`. Run `npm run lint`,
`npx tsc --noEmit`, and `npm run build` before deploying.

For production, set the variables from `.env.example` in the client deployment
environment and redeploy after changing any `NEXT_PUBLIC_` value. Point
`NEXT_PUBLIC_BACKEND_URL` at the deployed Express API origin (without `/api`).
The example MongoDB URI uses the existing `test` database. If you choose a
different database name, update both client and server URIs and migrate the
existing records first.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Random, private Better Auth signing/encryption secret. Generate a unique value for each environment. |
| `BETTER_AUTH_URL` | Yes | Public origin of this Next.js application. |
| `NEXT_PUBLIC_APP_URL` | Yes | Same public Next.js origin, exposed for the Better Auth browser client. |
| `CLIENT_URL` | Yes | Same client origin; trusted by Better Auth and configured as the server's CORS origin. |
| `MONGODB_URI` | Yes | MongoDB Atlas or local replica-set connection. Must point to the same database used by the Express API. |
| `JWT_ISSUER` | Yes | Must exactly match the server's `JWT_ISSUER`. Usually the client origin. |
| `JWT_AUDIENCE` | Yes | Must exactly match the server's `JWT_AUDIENCE` (example: `varax-api`). |
| `GOOGLE_CLIENT_ID` | For Google sign-in | Google OAuth web client ID. |
| `GOOGLE_CLIENT_SECRET` | For Google sign-in | Google OAuth client secret; server-side only. |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Express server origin, without `/api` (for example `http://localhost:5001`). |
| `IMGBB_API_KEY` | For image uploads | ImgBB key used only by the authenticated Next.js upload route; never add a `NEXT_PUBLIC_` prefix. |

Generate `BETTER_AUTH_SECRET` locally with `openssl rand -base64 32`. Do not
reuse it between development and production or commit it.
Keep the same secret across restarts and deployments for an environment. Better
Auth encrypts its stored JWT signing keys with this value; changing it prevents
the app from decrypting existing keys. Restore the previous value to recover
them, or plan a JWKS reset/rotation before changing it.

The Better Auth session is held in its secure, HTTP-only cookie. For Express
requests, `authClient.token()` obtains a separate short-lived EdDSA access
token. The shared API client sends it as `Authorization: Bearer ...`; neither
credential is stored in `localStorage`.

## Authentication and roles

Email/password and Google sign-in are hosted by Better Auth in this application.
New registrations and new Google accounts are assigned the `customer` role;
public registration cannot set a role. The JWT plugin exposes `/api/auth/token`
and `/api/auth/jwks`. Express verifies the JWT through the configured remote
JWKS URL and reads the user's current role and active status from MongoDB.

Promote the first administrator manually after registering the account. Using
a trusted MongoDB administration tool, update only that user's record in the
`users` collection, for example:

```javascript
db.users.updateOne(
  { email: "your-admin@example.com" },
  { $set: { role: "admin" } }
);
```

Do not expose database credentials or provide an admin-registration form.

## Google OAuth setup

In Google Cloud Console, create an OAuth 2.0 **Web application** client. Add the
client origin to **Authorized JavaScript origins** and
`<BETTER_AUTH_URL>/api/auth/callback/google` to **Authorized redirect URIs**.
For local development, also authorize `http://localhost:3000` as a JavaScript
origin and `http://localhost:3000/api/auth/callback/google` as a redirect URI.
Set the resulting client ID and secret in the client deployment environment.
Keep the OAuth consent screen and production domain configuration current.

For MongoDB Atlas, create a database user with the required read/write
permissions, allow network access from both hosting providers, and use the
same replica-set connection string in the client and server. Booking and payment
transactions will not work against standalone MongoDB.

## Image uploads

Create an ImgBB account/API key and configure `IMGBB_API_KEY` in the Next.js
server environment (not in browser code). Authenticated users can upload
JPEG, PNG, WEBP, or GIF files up to 5 MB through `/api/images`; the route returns
only the hosted image URL. Equipment writes and profile updates store that URL
in MongoDB.

## Related service and production deployment

See `varaX-server/README.md` for API routes, MongoDB indexes and transaction
requirements, Stripe setup, webhook behavior, and backend environment values.
The backend base URL, CORS `CLIENT_URL`, auth URL, JWT issuer, and JWKS URL must
be aligned across both deployments. The JWT JWKS URL is
`<BETTER_AUTH_URL>/api/auth/jwks`.

For production, set the environment variables in the hosting provider's secret
manager, use HTTPS origins, and deploy the Next.js and Express applications
separately. Configure the Stripe webhook to point to the Express
`/api/payments/webhook` endpoint. Do not enable real bookings until MongoDB
transaction support, OAuth, ImgBB, and Stripe test/live settings have been
verified.

## Current product notes

- The light/dark display preference is the only application preference stored
  in browser local storage; it is not authentication or customer data.
- Reviews and ratings are not yet backed by a review API. New equipment is
  shown without fabricated ratings.
- Email verification and password-reset flows are intentionally not enabled.
- Automated repository tests do not perform a live Google OAuth session or a
  real Stripe charge. Use provider test credentials and a test webhook before
  enabling live payments.
