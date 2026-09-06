# All in One — E-Commerce Website

Pakistan ka online shopping store — Electronics, Fashion, Cosmetics aur Laptop Accessories sab ek jagah.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL, row-level security)
- **Auth:** Supabase Auth (users) + HMAC-signed cookie session (admin)
- **Payments:** COD + Manual (JazzCash / Easypaisa / Bank Transfer)
- **Search:** PostgreSQL full-text search (GIN index)
- **CI/CD:** GitHub Actions (lint, typecheck, tests) + Vercel

## Features

### Store (Customer-facing)
- Homepage with hero, categories, featured products, new arrivals
- Category browsing with filters (sort, price, rating, stock)
- Product detail pages with reviews and ratings
- Shopping cart with localStorage persistence
- Checkout with COD + manual (JazzCash/Easypaisa/Bank) payment methods + coupon system
- Quick Order (skip cart, order directly from product card)
- Order tracking (public, no login required)
- User accounts with order history
- Wishlist
- PostgreSQL full-text search
- Responsive design (mobile + desktop)
- SEO: JSON-LD structured data, sitemap, robots, ISR pages
- Accessibility: skip link, ARIA labels, keyboard navigation

### Admin Panel
- Dashboard with stats (orders, revenue, products)
- Product CRUD with image upload + gradient picker
- Category management
- Order management with status + payment-status updates
- Coupon management (percentage/fixed, expiry, usage limits)
- Rate-limited login (HMAC session, per-IP 5 attempts, 15-min lockout)

## Security

- **Row-level security:** public tables are read-only; orders are insert-only; no client data tampering possible.
- **Atomic ordering:** `place_order` RPC re-validates price/stock server-side inside a transaction (coupon race-safe).
- **Admin sessions:** HMAC-SHA256 signed tokens (Web Crypto), 7-day expiry; cookie can't be forged.
- **Rate limiting:** per-IP buckets for admin login.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in:
```bash
cp .env.local.example .env.local
```

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `ADMIN_PASSWORD` — Admin panel password

Recommended:
- `ADMIN_SESSION_SECRET` — long random string used to sign admin cookies

Optional:
- `NEXT_PUBLIC_SITE_URL` — For sitemap/SEO/structured data
- `STRIPE_SECRET_KEY` — (future) card gateway; leave empty to keep online cards disabled

### 3. Database Setup
Go to Supabase SQL Editor and run the contents of `supabase/schema.sql` (**new project**) — or `supabase/migration-v2.sql` for an **existing** database (idempotent; applies security fixes, adds `payment_status` + full-text search, creates the `place_order` RPC).

After migrating, re-enable Realtime for the `orders` and `products` tables (see `supabase/realtime-fix.sql`).

### 4. Seed Data
After setup, visit `/admin` and click "Seed Starter Data" to import 6 categories + 30 products.

### 5. Configure Payments
Edit `lib/payment-methods.ts` to put your real JazzCash / Easypaisa / Bank account numbers (they appear on the checkout page).

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tests

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Vitest unit tests
```

## Project Structure

```
app/
├── (store)/          # Customer-facing pages
│   ├── page.tsx      # Homepage
│   ├── cart/         # Shopping cart
│   ├── checkout/     # Checkout with payment
│   ├── product/      # Product detail
│   ├── category/     # Category listing
│   ├── search/       # Search results
│   ├── account/      # User account
│   ├── login/        # User auth
│   ├── track/        # Order tracking
│   ├── wishlist/     # Wishlist
│   └── ...           # About, Contact, FAQ, etc.
├── admin/            # Admin panel
│   ├── login/        # Admin login
│   └── (dashboard)/  # Dashboard, Products, Orders, etc.
└── layout.tsx        # Root layout

components/           # Reusable UI components
lib/                  # Utilities, types, queries, actions
supabase/             # Database schema & migrations
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub (CI runs lint/typecheck/tests automatically)
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables (Supabase keys, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`)
4. Deploy — store pages use ISR (5-min revalidation)

### Other Platforms
```bash
npm run build
npm start
```

## License

MIT
