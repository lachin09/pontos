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

Order emails use Resend. Set `RESEND_API_KEY`, a verified-domain `PONTOS_EMAIL_FROM`, `ADMIN_ORDER_EMAIL`, and a random `CRON_SECRET` in local and production environment settings. New-order emails are attempted immediately; failed messages remain queued for the scheduled retry. The order/status tables and notification queue must be migrated with `npx supabase db push`.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
