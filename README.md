# VaraX — Equipment Rental Platform

VaraX is a responsive equipment rental marketplace concept for Bangladesh. It helps customers discover and request construction, photography, vehicle, agriculture, electronics, and event equipment from local owners.

## Project status

- **Live URL:** Not deployed yet
- **Client:** Next.js App Router, React, TypeScript
- **Current mode:** Frontend demo with browser-persisted sample accounts, listings, favorites, and bookings
- **Payments:** Demo checkout only; it does not process real payments

## Key features

- Responsive home page with featured equipment, categories, customer reviews, and rental steps
- Equipment catalog with search, category, location, rental-type, price, availability, sorting, and pagination controls
- Private equipment details and a booking form with date, quantity, contact, delivery, and notes fields
- Customer, owner, and admin dashboard previews
- Owner listing creation, editing, and deletion; new listings start as pending
- Admin listing review, user-role management, and rental monitoring
- Favorites, profile editing, demo checkout, payment status screens, loading states, and error recovery
- Persistent light/dark theme preference

## Demo access

Open `/login` and choose **Customer demo**, **Owner demo**, or **Admin demo**. Demo changes are stored in this browser's local storage. They are for frontend review only and do not replace server-side authorization.

## Run locally

Node.js 20.19 or newer is required.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Main packages

- `next`, `react`, `react-dom`
- `typescript`
- `framer-motion`
- `better-auth`, `@better-auth/mongo-adapter`, `mongodb`
- `tailwindcss` (global setup), CSS Modules (component and page styling)

## Available scripts

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## Production work still required

The demo data layer must be connected to the production API. Configure authentication providers and environment variables, enforce roles and permissions on the server, and integrate Stripe Checkout/webhooks before accepting real bookings or payments. Replace this README's deployment status with the live URL when deployed.
