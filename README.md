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

Checkout accepts international destinations. Customers type their Nova Post / Ukrposhta branch or street address themselves; there is no branch lookup.

## Architecture

- `app/api/**` route handlers are thin: they parse input with `lib/http/route.ts` (`route`, `adminRoute`, `readJson`) and call a service. Expected failures are thrown as `AppError` (`lib/errors.ts`) and turned into JSON responses in one place.
- `services/` holds business rules (e.g. image clean-up after deletes). `repositories/*.ts` define the data contracts; `repositories/supabase/` implements them. Storefront readers and admin writers get separate interfaces.
- `lib/server/storefront-services.ts` and `lib/server/admin-services.ts` are the composition roots — the only places that pick implementations.
- Browser code never calls `fetch` directly: it uses the typed functions in `lib/api/`.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
