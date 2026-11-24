# 🧰 VaraX Client

> **Rent smart. Work better.**<br>
> The Next.js frontend for the VaraX equipment-rental marketplace.

**Next.js 16** · **React 19** · **TypeScript** · **Better Auth 1.7**

VaraX brings equipment owners and renters together. This repository contains
the web client; user, equipment, favorite, booking, payment, and dashboard data
comes from [`varaX-server`](../varaX-server/README.md)—there are no seeded
users or listing fixtures here.

---

## ✨ At a glance

| Area | What powers it |
| --- | --- |
| Web app | Next.js App Router |
| Sign-in | Better Auth with MongoDB and JWT |
| Marketplace data | Express API (`varaX-server`) |
| Image hosting | ImgBB, through the authenticated `/api/images` route |

## 🚀 Quick start

**Requirements:** Node.js 20.19 or newer, plus a configured MongoDB database and
the VaraX Express API for marketplace data.

```sh
npm ci
cp .env.example .env
```

Fill in the values in `.env`, then start the client:

```sh
npm run dev
```

Open **http://localhost:3000**. The client and Express server must use the same
MongoDB database; point `NEXT_PUBLIC_BACKEND_URL` at the API origin, without
`/api`.

### ✅ Verification

| Command | Purpose |
| --- | --- |
| `npm run lint` | Lint the project |
| `npx eslint app/path/to/file.tsx` | Lint one file |
| `npx tsc --noEmit` | Type-check |
| `npm run build` | Create a production build |

There is currently no automated test script configured.

---

## ⚙️ Environment

Use `.env.example` as the starting point. Set secrets in your deployment
provider’s secret manager, and never commit `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Private Better Auth signing/encryption secret. Use a unique value per environment. |
| `BETTER_AUTH_URL` | Yes | Public origin of the Next.js application. |
| `NEXT_PUBLIC_APP_URL` | Yes | Same client origin, exposed to the browser auth client. |
| `CLIENT_URL` | Yes | Client origin trusted by Better Auth and allowed by the API’s CORS config. |
| `MONGODB_URI` | Yes | MongoDB connection string; use the same database as the Express API. |
| `MONGODB_DB_NAME` | No | Database name; defaults to `varax` in both services. |
| `JWT_ISSUER` | Yes | Must match the Express API’s issuer; usually the client origin. |
| `JWT_AUDIENCE` | Yes | Must match the API’s audience (example: `varax-api`). |
| `GOOGLE_CLIENT_ID` | Google sign-in | Google OAuth web client ID. |
| `GOOGLE_CLIENT_SECRET` | Google sign-in | OAuth client secret; server-side only. |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | Express API origin, without `/api` (example: `http://localhost:5001`). |
| `IMGBB_API_KEY` | Image uploads | Server-only ImgBB key; do not prefix with `NEXT_PUBLIC_`. |

### 🔒 Protect the auth secret

Generate a secret locally:

```sh
openssl rand -base64 32
```

Keep `BETTER_AUTH_SECRET` stable across restarts and deployments for each
environment. Better Auth encrypts its stored JWT signing keys with this value;
changing it prevents the app from decrypting existing keys. Restore the old
value to recover them, or plan a JWKS reset/rotation before changing it.

> [!IMPORTANT]
> Redeploy after changing any `NEXT_PUBLIC_` value. These values are included
> when the client is built.

---

## 🔑 Authentication and roles

Email/password and Google sign-in are handled by Better Auth in this app.
Regular and Google registrations create `customer` accounts; the **Join as an
owner** flow creates an `owner` account with email and password. Public signup
cannot create `admin` accounts.

The browser session uses a secure, HTTP-only cookie. For Express requests,
`authClient.token()` obtains a short-lived EdDSA access token, which the shared
API client sends as `Authorization: Bearer ...`. Neither credential is stored
in `localStorage`. Better Auth exposes `/api/auth/token` and `/api/auth/jwks`;
the Express API verifies tokens through the JWKS endpoint and checks the user’s
current role and active status in MongoDB.

### Assigning the first administrator

After registering the account, use a trusted MongoDB administration tool to
promote only that user in the `users` collection:

```javascript
db.users.updateOne(
  { email: "your-admin@example.com" },
  { $set: { role: "admin" } }
);
```

Never expose database credentials or add an admin-registration form.

---

## 🌐 Google OAuth setup

1. In Google Cloud Console, create an OAuth 2.0 **Web application** client.
2. Add the client origin to **Authorized JavaScript origins**.
3. Add `<BETTER_AUTH_URL>/api/auth/callback/google` to **Authorized redirect URIs**.
4. For local development, also add `http://localhost:3000` as an origin and
   `http://localhost:3000/api/auth/callback/google` as a redirect URI.
5. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the client environment.

Keep the OAuth consent screen and production domain configuration current.

---

## 🖼️ Image uploads and MongoDB

Authenticated users can upload JPEG, PNG, WEBP, or GIF images up to **5 MB**
through `/api/images`. The Next.js route uses the server-only `IMGBB_API_KEY`
and returns the hosted image URL; equipment and profile records store that URL.

For MongoDB Atlas, create a database user with read/write permissions and allow
network access from both hosting providers. Use the same replica-set connection
string in the client and server. **Booking and payment transactions require
MongoDB transaction support; standalone MongoDB is not sufficient.**

---

## 🚢 Deployment

- Deploy the Next.js client and Express API separately.
- Configure environment variables in each service’s secret manager and use
  HTTPS origins in production.
- Keep the API base URL, CORS `CLIENT_URL`, Better Auth URL, JWT issuer/audience,
  and JWKS URL aligned. The JWKS URL is
  `<BETTER_AUTH_URL>/api/auth/jwks`.
- Configure Stripe webhooks on the Express API at
  `/api/payments/webhook`.
- Before enabling real bookings, verify MongoDB transaction support, OAuth,
  ImgBB, and Stripe test/live settings.

See [`varaX-server/README.md`](../varaX-server/README.md) for API routes,
MongoDB indexes and transaction requirements, Stripe setup, webhook behavior,
and backend environment values.

---

## 📝 Product notes

- The light/dark display preference is the only application preference stored
  in browser `localStorage`; it is not authentication or customer data.
- Reviews and ratings are not backed by a review API yet. New equipment is
  shown without fabricated ratings.
- Email verification and password-reset flows are not enabled.
- Automated checks do not perform a live Google OAuth session or a real Stripe
  charge. Use provider test credentials and a test webhook before enabling live
  payments.
