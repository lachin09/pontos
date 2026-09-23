# PONTOS storefront

A Next.js clothing storefront built phase by phase from `../CREATION_PLAN.md`. The storefront catalog reads published products from Supabase. Checkout creates orders through a server route that validates the request and asks Postgres to price the cart and reserve stock atomically.

## Development

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase database

The database schema, RLS policies, starter categories, secure order function, and `product-images` storage bucket are in `supabase/migrations/`. The PONTOS project is linked for this workspace. `.env.example` documents the required variable names; the ignored `.env.local` is configured for this workspace. Keep credentials there; never commit it or expose a secret/service role key in a `NEXT_PUBLIC_` variable. See [DATABASE.md](./DATABASE.md) for access policy details.

The protected admin area is at `/admin`; product, category, and order management are under `/admin/products`, `/admin/categories`, and `/admin/orders`. Only accounts with an active row in `admin_profiles` can sign in. See [DATABASE.md](./DATABASE.md#give-an-owner-access-to-admin) to grant or revoke owner access.

New orders appear in the bell in the admin header. Alerts are stored in Supabase and remain unread until opened; the bell checks for new orders every 20 seconds while an admin page is open. Apply database changes with `npx supabase db push`.

Checkout accepts international destinations and street addresses. Nova Post branch search requires a server-only `NOVA_POSHTA_API_KEY`; without it, customers can still choose address delivery. Add the key to `.env.local` for development and to Vercel Environment Variables for production. Never use a `NEXT_PUBLIC_` prefix for this key.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
