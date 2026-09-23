-- Email notifications are paused. Keep only durable in-admin order alerts.
drop function if exists public.update_order_admin(uuid, public.order_status, public.payment_status);
drop function if exists public.create_order_secure(uuid, jsonb, jsonb, text, text);
drop function if exists public.create_order_secure(uuid, jsonb, jsonb, text);
drop table if exists public.notification_outbox;
alter table public.orders drop column if exists customer_email;

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_number bigint not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index admin_notifications_unread_idx on public.admin_notifications(is_read, created_at desc);
alter table public.admin_notifications enable row level security;
grant select, update on public.admin_notifications to authenticated;
create policy "Admins read order notifications" on public.admin_notifications
  for select to authenticated using ((select public.is_active_admin()));
create policy "Admins mark order notifications read" on public.admin_notifications
  for update to authenticated using ((select public.is_active_admin()))
  with check ((select public.is_active_admin()));

create or replace function public.create_admin_order_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_notifications(order_id, order_number, title, message)
  values (
    new.id,
    new.order_number,
    'Нове замовлення #' || new.order_number::text,
    trim(new.first_name || ' ' || new.last_name) || ' · ' || new.total::text || ' ₴'
  );
  return new;
end;
$$;
create trigger orders_create_admin_notification
  after insert on public.orders
  for each row execute function public.create_admin_order_notification();

create or replace function public.update_order_admin(
  p_order_id uuid,
  p_status public.order_status,
  p_payment_status public.payment_status
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_active_admin() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return false; end if;
  if v_order.status = p_status and v_order.payment_status = p_payment_status then return true; end if;
  update public.orders set status = p_status, payment_status = p_payment_status where id = p_order_id;
  insert into public.order_status_history(order_id, changed_by, old_status, new_status, old_payment_status, new_payment_status)
  values (p_order_id, auth.uid(), v_order.status, p_status, v_order.payment_status, p_payment_status);
  return true;
end;
$$;
revoke all on function public.update_order_admin(uuid, public.order_status, public.payment_status) from public, anon;
grant execute on function public.update_order_admin(uuid, public.order_status, public.payment_status) to authenticated;

create or replace function public.create_order_secure(
  p_idempotency_key uuid,
  p_customer jsonb,
  p_items jsonb,
  p_public_storage_url text
)
returns table (order_number bigint, total numeric, payment_status public.payment_status, was_created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order_number bigint;
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
    or (p_customer->>'delivery_method') not in ('nova_poshta', 'ukrposhta', 'courier') then
    raise exception using errcode = '22023', message = 'Invalid order';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select o.id, o.order_number, o.total, o.payment_status into v_order_id, v_order_number, v_total, v_payment_status
    from public.orders o where o.idempotency_key = p_idempotency_key;
  if found then return query select v_order_number, v_total, v_payment_status, false; return; end if;
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
  select coalesce(sum(v.price * (item->>'quantity')::integer), 0)::numeric(12, 2) into v_total
    from jsonb_array_elements(p_items) item join public.product_variants v on v.id = (item->>'variant_id')::uuid;
  v_payment_status := case when p_customer->>'payment_method' = 'cash_on_delivery'
    then 'cash_on_delivery'::public.payment_status else 'pending'::public.payment_status end;
  insert into public.orders (idempotency_key, first_name, last_name, phone, city, delivery_method, delivery_address, payment_method, payment_status, status, comment, subtotal, delivery_price, total)
  values (p_idempotency_key, trim(p_customer->>'first_name'), trim(p_customer->>'last_name'), trim(p_customer->>'phone'), trim(p_customer->>'city'),
    (p_customer->>'delivery_method')::public.delivery_method, trim(p_customer->>'delivery_address'),
    (p_customer->>'payment_method')::public.payment_method, v_payment_status, 'new', nullif(trim(p_customer->>'comment'), ''), v_total, 0, v_total)
  returning id, public.orders.order_number into v_order_id, v_order_number;
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
  return query select v_order_number, v_total, v_payment_status, true;
end;
$$;
revoke all on function public.create_order_secure(uuid, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_order_secure(uuid, jsonb, jsonb, text) to service_role;
