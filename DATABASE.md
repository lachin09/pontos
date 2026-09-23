# Database and Supabase setup

## Schema

`supabase/migrations/20260923000000_initial_schema.sql` creates the categories, products, product images, product variants, admin profiles, orders, order items, and store settings tables. It defines order and delivery enums, foreign keys, checks, indexes, update timestamps, RLS, and the public `product-images` Storage bucket. `supabase/migrations/20260923001000_seed_store_categories.sql` adds the starter clothing categories used by the current storefront. `supabase/migrations/20260923002000_secure_order_creation.sql` adds order idempotency and a transaction that validates live product availability, prices from the database, and decrements stock once per successful order. `supabase/migrations/20260923003000_order_item_image_snapshot.sql` stores the current product image URL on each order item. `supabase/migrations/20260923004000_save_product_with_variants.sql` adds atomic product and variant saving, restricted to active admins. `supabase/migrations/20260923005000_product_save_api_signature.sql` defines the API signature used for both create and update operations.

Product image records store a bucket path in `storage_path`; resolve it to a public Storage URL in the data layer. Product listing reads are limited to active categories and published products. Orders and settings have no anonymous read access. Authenticated admin policies require an active row in `admin_profiles`.

## Apply to a Supabase project

1. Create a Supabase project and install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. From this directory, log in and link the project:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Review the migration and apply it:

   ```bash
   supabase db push
   ```

4. In Supabase Auth, create an admin user. Add its Auth UUID to `public.admin_profiles` using the Dashboard SQL editor or a trusted server-side admin tool:

   ```sql
   insert into public.admin_profiles (user_id) values ('AUTH_USER_UUID');
   ```

   Do not expose admin profile insertion to public clients.

## Give an owner access to `/admin`

1. In Supabase Dashboard, open **Authentication → Users** and create the owner account with their email and a strong password. Public account registration is not part of this store.
2. Copy that user's UUID from the Users table.
3. In **SQL Editor**, run the following using that UUID:

   ```sql
   insert into public.admin_profiles (user_id, is_active)
   values ('AUTH_USER_UUID', true);
   ```

4. Open `https://your-store-domain/admin`. It redirects to the login screen until the owner signs in. To remove access later, set `is_active = false` for that user in `admin_profiles`.

Only trusted project owners should add rows to `admin_profiles`. The admin login checks this active allowlist after password authentication; authenticated users cannot grant themselves access.

The workspace is linked to the PONTOS project (`gszipxnrxzhwpvgrqxvf`), and the migrations have been applied. Table RLS flags, policy count, and bucket configuration were confirmed through read-only database metadata queries. Access behavior still needs role-based RLS verification before production use.

## Access model

- Anonymous clients can select active categories, published products, their images, and variants. They cannot write catalog data or read orders.
- Authenticated users can read their own `admin_profiles` row. Only active admins can manage catalog data, orders, order items, settings, and objects in the product image bucket.
- Public image delivery is intentional because product photos are public storefront content. Upload, update, and delete operations remain restricted to active admins.
- Customer order creation is not exposed to anon/authenticated database roles. `POST /api/orders` validates the checkout payload and calls the transactional database function using a server-only credential. The database calculates item prices from current variants, checks published/available status and stock, and decrements stock only after creating the order. The API returns only the order number, total, and payment status. Never put a secret/service role key in client code.
- Admin product APIs verify the Supabase session and active `admin_profiles` row on every request. The database product save function independently checks the active admin role and runs as the signed-in admin under RLS.
- Delivery is charged by the carrier separately when the customer receives the parcel; it is not included in the store order total.

## Verification still required

After linking the project and applying the migration, verify through the Supabase SQL editor/API with anon, an ordinary authenticated user, and an active admin:

- public reads return only active categories and published products;
- anonymous and ordinary users cannot read or mutate orders or write catalog/storage objects;
- an active admin can manage catalog records and upload product images;
- the `product-images` bucket is public for retrieval and enforces the image MIME and 10 MiB limits.

Do not test with production customer data.
