# Supabase + Admin Panel Setup Guide

Is guide ko follow kar ke aap apni e-commerce website ko Supabase se connect
kar sakte hain aur Admin Panel use karna shuru kar sakte hain.

## Step 1: Supabase Project Banayein

1. https://supabase.com par jayein aur **Sign Up / Login** karein (GitHub se bhi ho sakta hai)
2. **New Project** par click karein
3. Project ka naam rakhein (e.g. `all-in-one-store`)
4. Database password set karein (kahin safe save kar lein)
5. Region select karein — **Singapore** ya **Mumbai** Pakistan ke liye fastest hai
6. **Create New Project** par click karein (~2 minute wait)

## Step 2: Database Schema Run Karein

1. Supabase dashboard mein **SQL Editor** kholein (left sidebar mein)
2. Is project ki file **`supabase/schema.sql`** ka pura content copy karein
3. SQL Editor mein paste kar ke **Run** button dabayein
4. Ye tables ban jayengi:
   - `categories` — product categories
   - `products` — saare products (ab `stock` ke saath)
   - `orders` — customers ke orders (coupon/discount/user ke saath)
   - `reviews` — product reviews
   - `coupons` — discount codes
   - `product-images` storage bucket (photos ke liye)

> **Existing database update karna?** Agar aap ke paas pehle se chala hua
> database hai jisme data maujood hai, to `schema.sql` kai baar nahi chale
> (kuch statements duplicate error de sakte hain). Iski bajaye **`supabase/migration-v2.sql`** run karein — ye security fixes (RLS), nayi
> fields/features (`payment_status`, full-text search, atomic `place_order`
> RPC) safely add karta hai aur 2 starter coupons (`WELCOME10`, `FLAT150`)
> bhi daal deta hai.
> Scenarion: **Fresh project** → `schema.sql` · **Pehle se existing** →
> `migration-v2.sql` (pichla `migration-fullstack.sql` bhi updated hai).
>
> Migration ke baad **Database → Realtime** mein `orders` (aur `products`)
> table ke liye publication toggle ON karein (dekhain `supabase/realtime-fix.sql`).

## Step 3: API Credentials Copy Karein

1. **Settings → API** mein jayein
2. Ye 2 cheezein copy karein:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public key** (Project API Keys ke andar)

## Step 4: `.env.local` File Banayein

Project root mein `.env.local` naam ki file banayein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
ADMIN_PASSWORD=apna-mazboot-password
ADMIN_EMAIL=admin@example.com
ADMIN_SESSION_SECRET=koyi-lambi-random-chayee-string
```

Production mein `NEXT_PUBLIC_SITE_URL` bhi set karein (Stripe redirect aur
`sitemap.xml` ke liye):

```env
NEXT_PUBLIC_SITE_URL=https://aapki-website.com
```

> Tip: `.env.local.example` file ko rename/copy kar ke values bhar sakte hain.

Phir dev server restart karein (`Ctrl+C` phir `npm run dev`) — env files sirf
startup par load hoti hain.

## Step 5: Admin User Banayein

**Option A (Recommended): Supabase dashboard se**

1. Supabase dashboard mein **Authentication → Users** kholein
2. **Add user → Create new user** par click karein
3. Apna email + strong password daal kar user banayein
   - "Auto Confirm User" checkbox ON rakhein

**Option B: Public signups disable na karna ho to**

- Agar aap chahte hain ke login page se koi signup na kar sake:
  - **Authentication → Sign In / Providers → Email** mein jayein
  - **"Allow new users to sign up"** ko OFF kar dein

> Login/signup khud bhi kam karta hai: website par **Account → Go to Login**
> se signup ho sakta hai. Signup ke baad customer apne orders
> (Account → My Orders) aur reviews dekh sakta hai.

## Step 6: Admin Panel Password

`.env.local` mein set karein (admin `/admin/login` ke liye):

```env
ADMIN_PASSWORD=apna-mazboot-password
ADMIN_EMAIL=admin@example.com
```

> `ADMIN_PASSWORD` nahi set to default `change-me` chalta hai — production se
> pehle zaroor badlein.

## Step 7: (Optional) Sirf Apne Email Ko Admin Banayein

`.env.local` mein ye line add karein taake sirf aapka email admin ban sake
(dusre authenticated users block ho jayenge):

```env
ADMIN_EMAILS=aapka@email.com
```

## Step 8: Starter Data Import Karein

1. Website chalayein: `npm run dev`
2. Browser mein **http://localhost:3000/admin/login** kholein
3. Apne admin credentials se login karein
4. Dashboard par **"🌱 Import Starter Data"** button dabayein
   - Ye 6 categories aur 30 products database mein daal dega
   - Sirf khali tables par chalega, duplicate nahi banayega

Bas! Ab jo bhi changes admin panel se karenge wo store par turant nazar
aayenge.

## Step 9: Manual Payments (JazzCash / Easypaisa / Bank Transfer)

Store par **COD** + **manual transfer** payments available hain:

1. `lib/payment-methods.ts` kholein
2. `MANUAL_PAYMENT_METHODS` ke andar **`display`** (aapke JazzCash / Easypaisa /
   Bank account numbers) aur **`accountTitle`** update karein
3. Ye details checkout page par customer ko dikhayi jayengi

Online card gateway (Stripe) abhi **disabled** hai — customer Card select
nahi kar sakta, website demo payment se protected hai.

---

## Admin Panel Features

| Page | URL | Kya kar sakte hain |
|------|-----|-------------------|
| Dashboard | `/admin` | Stats (orders, revenue, products) + recent orders |
| Products | `/admin/products` | List/search (paginated), add, edit, delete, stock update |
| Categories | `/admin/categories` | Add/edit/delete categories |
| Coupons | `/admin/coupons` | Discount codes banayein/edit/delete karein (% ya fixed Rs.) |
| Orders | `/admin/orders` | Order details, status update (pending → confirmed → shipped → delivered), **payment status** (pending → received), delete |
| Login | `/admin/login` | Admin authentication |

Product form mein **photo upload** bhi hai — image Supabase Storage ke
`product-images` bucket mein upload hoti hai aur product card par show hoti hai.
Photo na ho to emoji + gradient card dikhta hai (jaise pehle tha).

## Customer Features

- **Account / Login** (`/login`) — Supabase email+password se signup/signin
- **My Account** (`/account`) — logged-in customer apne orders + status dekh sakta hai
- **Track Order** (`/track`) — bina login ke order number + phone se status check
- **Wishlist** (`/wishlist`) — products save karein (browser mein store hoti hai)
- **Search** (`/search`) — naam, category ya description se products dhoondein
- **Coupons** — checkout par discount codes (`WELCOME10`, `FLAT150` starter hain)
- **Reviews** — har product par customers rating + comment de sakte hain
- **Stock** — products par stock count, low stock warning, aur "out of stock" status

## Security Notes

- **RLS (Row Level Security)** enabled hai:
  - Products/categories **public read-only** hain (koi bhi write nahi kar sakta — sirf admin)
  - Orders **insert-only** — anon/authenticated users sirf order place kar sakte
    hain, dirty price/stock tamper nahi kar sakte
  - Reviews public read + insert (spam protection server-side)
  - **Dangerous policies removed:** koi bhi logged-in user products/categories/
    coupons update nahi kar sakta; anonymous users orders **dekh** nahi sakte
- **Atomic ordering:** saara server-side validation transaction mein — `place_order`
  RPC price/stock database se re-fetch karta hai, coupon race-safe hai
  (functions: `place_order`, `validate_coupon`, `track_order`, `get_my_orders`)
- **Admin session:** cookie ab HMAC-SHA256 signed token hai (7-din expiry,
  `ADMIN_SESSION_SECRET` se signed) — static forged cookie kaam nahi karti
- **Rate limiting:** login par per-IP buckets (5 attempts, 15-min lockout)
- `.env.local` ko git commit NAHI karna (already `.gitignore` mein hai)
- anon key public hoti hai (browser mein jati hai) — normal; RLS data protect karta hai
- Service role key kabhi frontend code mein use na karein

## Tests & CI

- `npm run lint` · `npm run typecheck` · `npm test` (Vitest unit tests in `lib/`)
- GitHub Actions workflow `.github/workflows/ci.yml` har push/PR par ye teeno chalata hai

## Troubleshooting

**"Supabase configured nahi hai" login page par**
→ `.env.local` check karein, dev server restart karein.

**Admin panel mein changes save nahi ho rahe**
→ Check karein ke aap logged in hain aur schema.sql run ho chuka hai.

**Store par purana data dikh raha hai**
→ Agar database khali hai to site static fallback data dikhati hai. Starter
data import karein ya products add karein.

**Image upload fail**
→ schema.sql dobara run karein (storage bucket policies ban jayengi).

**7 din baad project pause ho gaya (free tier)**
→ Supabase dashboard mein project open karein aur **Restore** button dabayein.
