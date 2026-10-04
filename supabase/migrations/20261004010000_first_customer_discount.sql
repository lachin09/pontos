-- First-customer promotion: while it is on, the first order placed gets a
-- percentage off the items. The claim is decided inside create_order_secure
-- under a lock, so two orders placed at the same moment cannot both be
-- "first". A cancelled winner frees the promotion again.

alter table public.orders
  add column discount_percent integer not null default 0
    check (discount_percent between 0 and 100),
  add column discount_amount numeric(12, 2) not null default 0
    check (discount_amount >= 0),
  add column discount_label text
    check (discount_label is null or discount_label in ('first_customer'));

-- The original total check was unnamed; find it by its definition.
do $$
declare
  v_name text;
begin
  select conname into v_name
  from pg_constraint
  where conrelid = 'public.orders'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%(total = (subtotal + delivery_price))%';
  if v_name is not null then
    execute format('alter table public.orders drop constraint %I', v_name);
  end if;
end $$;

alter table public.orders drop constraint if exists orders_total_check;
alter table public.orders
  add constraint orders_total_check
    check (total = subtotal - discount_amount + delivery_price);

-- Settings: {"firstCustomer": {"enabled": true, "percent": 30}}
insert into public.store_settings (key, value)
values ('promotions', '{"firstCustomer": {"enabled": true, "percent": 30}}'::jsonb)
on conflict (key) do nothing;

-- The discount a new order would get right now: 0 when the promotion is off
-- or already claimed by a non-cancelled order.
create or replace function public.first_customer_discount_percent()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when coalesce((s.value->'firstCustomer'->>'enabled')::boolean, false)
        and not exists (
          select 1 from public.orders o
          where o.discount_label = 'first_customer' and o.status <> 'cancelled'
        )
      then least(greatest(coalesce((s.value->'firstCustomer'->>'percent')::integer, 0), 0), 100)
      else 0
    end
    from public.store_settings s
    where s.key = 'promotions'
  ), 0);
$$;

grant execute on function public.first_customer_discount_percent() to anon, authenticated, service_role;

drop function public.create_order_secure(uuid, jsonb, jsonb, text);

create function public.create_order_secure(
  p_idempotency_key uuid,
  p_customer jsonb,
  p_items jsonb,
  p_public_storage_url text
)
returns table (
  order_number bigint,
  total numeric,
  payment_status public.payment_status,
  was_created boolean,
  subtotal numeric,
  discount_percent integer,
  discount_amount numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_number bigint;
  v_subtotal numeric(12, 2);
  v_discount_percent integer;
  v_discount numeric(12, 2);
  v_total numeric(12, 2);
  v_payment_status public.payment_status;
  v_count integer;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity integer;
begin
  if p_idempotency_key is null or jsonb_typeof(p_customer) <> 'object'
    or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 50 or p_public_storage_url is null then
    raise exception using errcode = '22023', message = 'Invalid order';
  end if;
  if (p_customer->>'payment_method') not in ('bank_transfer', 'cash_on_delivery')
    or (p_customer->>'delivery_method') not in ('nova_poshta', 'ukrposhta', 'courier')
    or coalesce(p_customer->>'delivery_country_code', 'UA') !~ '^[A-Z]{2}$'
    or ((p_customer->>'delivery_country_code') <> 'UA' and (p_customer->>'delivery_method') <> 'nova_poshta')
    or ((p_customer->>'nova_poshta_division_id') is not null and (p_customer->>'nova_poshta_division_name') is null)
    or coalesce(p_customer->>'locale', 'uk') not in ('uk', 'ru', 'en') then
    raise exception using errcode = '22023', message = 'Invalid order';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select o.id, o.order_number, o.total, o.payment_status, o.subtotal, o.discount_percent, o.discount_amount
    into v_order_id, v_order_number, v_total, v_payment_status, v_subtotal, v_discount_percent, v_discount
    from public.orders o where o.idempotency_key = p_idempotency_key;
  if found then
    return query select v_order_number, v_total, v_payment_status, false, v_subtotal, v_discount_percent, v_discount;
    return;
  end if;
  perform v.id from public.product_variants v
    where v.id in (select (item->>'variant_id')::uuid from jsonb_array_elements(p_items) item)
    order by v.id for update;
  select count(*) into v_count from jsonb_array_elements(p_items) item
    join public.product_variants v on v.id = (item->>'variant_id')::uuid
    join public.products p on p.id = v.product_id
    where jsonb_typeof(item) = 'object' and (item->>'quantity') ~ '^[1-9][0-9]*$'
      and (item->>'quantity')::integer <= 99 and p.is_published and p.is_available
      and v.is_available and v.stock >= (item->>'quantity')::integer;
  if v_count <> jsonb_array_length(p_items) then raise exception using errcode = 'P0001', message = 'Items unavailable or stock changed'; end if;
  select coalesce(sum(v.price * (item->>'quantity')::integer), 0)::numeric(12, 2) into v_subtotal
    from jsonb_array_elements(p_items) item join public.product_variants v on v.id = (item->>'variant_id')::uuid;
  -- One order at a time decides whether the first-customer discount is free.
  perform pg_advisory_xact_lock(hashtextextended('first_customer_discount', 0));
  v_discount_percent := public.first_customer_discount_percent();
  v_discount := round(v_subtotal * v_discount_percent / 100.0, 2);
  v_total := v_subtotal - v_discount;
  v_payment_status := case when p_customer->>'payment_method' = 'cash_on_delivery'
    then 'cash_on_delivery'::public.payment_status else 'pending'::public.payment_status end;
  insert into public.orders (
    idempotency_key, first_name, last_name, phone, city, delivery_method, delivery_address,
    delivery_country_code, delivery_postal_code, nova_poshta_division_id, nova_poshta_division_name,
    nova_poshta_division_category, payment_method, payment_status, status, comment,
    subtotal, discount_percent, discount_amount, discount_label, delivery_price, total, locale
  )
  values (
    p_idempotency_key, trim(p_customer->>'first_name'), trim(p_customer->>'last_name'), trim(p_customer->>'phone'), trim(p_customer->>'city'),
    (p_customer->>'delivery_method')::public.delivery_method, trim(p_customer->>'delivery_address'),
    coalesce(nullif(p_customer->>'delivery_country_code', ''), 'UA'), nullif(trim(p_customer->>'delivery_postal_code'), ''),
    nullif(p_customer->>'nova_poshta_division_id', '')::bigint, nullif(trim(p_customer->>'nova_poshta_division_name'), ''),
    nullif(trim(p_customer->>'nova_poshta_division_category'), ''),
    (p_customer->>'payment_method')::public.payment_method, v_payment_status, 'new', nullif(trim(p_customer->>'comment'), ''),
    v_subtotal, v_discount_percent, v_discount, case when v_discount_percent > 0 then 'first_customer' end, 0, v_total,
    coalesce(p_customer->>'locale', 'uk')
  ) returning id, public.orders.order_number into v_order_id, v_order_number;
  insert into public.order_items (order_id, product_id, variant_id, product_name, product_image, size, color, price, quantity)
  select v_order_id, p.id, v.id, p.name,
    (select p_public_storage_url || image.storage_path from public.product_images image where image.product_id = p.id order by image.sort_order, image.id limit 1),
    v.size, v.color, v.price, (item->>'quantity')::integer
  from jsonb_array_elements(p_items) item
  join public.product_variants v on v.id = (item->>'variant_id')::uuid
  join public.products p on p.id = v.product_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    update public.product_variants set stock = stock - v_quantity where id = v_variant_id and stock >= v_quantity;
    if not found then raise exception using errcode = 'P0001', message = 'Items unavailable or stock changed'; end if;
  end loop;
  return query select v_order_number, v_total, v_payment_status, true, v_subtotal, v_discount_percent, v_discount;
end;
$$;

revoke all on function public.create_order_secure(uuid, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_order_secure(uuid, jsonb, jsonb, text) to service_role;
