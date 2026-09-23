alter table public.orders add column customer_email text;
alter table public.orders add constraint orders_customer_email_format check (
  customer_email is null or customer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  changed_by uuid not null references auth.users(id),
  old_status public.order_status not null,
  new_status public.order_status not null,
  old_payment_status public.payment_status not null,
  new_payment_status public.payment_status not null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id, created_at desc);
alter table public.order_status_history enable row level security;
grant select on public.order_status_history to authenticated;
create policy "Admins read order status history" on public.order_status_history
  for select to authenticated using ((select public.is_active_admin()));

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  recipient_email text not null,
  recipient_type text not null check (recipient_type in ('admin', 'customer')),
  event_type text not null check (event_type in ('order_created', 'order_updated')),
  payload jsonb not null,
  attempts integer not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index notification_outbox_pending_idx on public.notification_outbox(created_at) where sent_at is null;
alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from anon, authenticated;
grant all on public.notification_outbox to service_role;

-- An update and its audit/outbox records commit together.
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
  if v_order.customer_email is not null then
    insert into public.notification_outbox(order_id, recipient_email, recipient_type, event_type, payload)
    values (p_order_id, v_order.customer_email, 'customer', 'order_updated', jsonb_build_object(
      'order_number', v_order.order_number, 'first_name', v_order.first_name,
      'status', p_status, 'payment_status', p_payment_status
    ));
  end if;
  return true;
end;
$$;
revoke all on function public.update_order_admin(uuid, public.order_status, public.payment_status) from public, anon;
grant execute on function public.update_order_admin(uuid, public.order_status, public.payment_status) to authenticated;

drop function public.create_order_secure(uuid, jsonb, jsonb, text);
create or replace function public.create_order_secure(
  p_idempotency_key uuid,
  p_customer jsonb,
  p_items jsonb,
  p_public_storage_url text,
  p_admin_notification_email text
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
  v_customer_email text;
begin
  if p_idempotency_key is null or jsonb_typeof(p_customer) <> 'object'
    or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 50 or p_public_storage_url is null then
    raise exception using errcode = '22023', message = 'Invalid order';
  end if;
  v_customer_email := lower(trim(p_customer->>'email'));
  if v_customer_email is null or v_customer_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception using errcode = '22023', message = 'Invalid customer email';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));
  select o.id, o.order_number, o.total, o.payment_status into v_order_id, v_order_number, v_total, v_payment_status
    from public.orders o where o.idempotency_key = p_idempotency_key;
  if found then return query select v_order_number, v_total, v_payment_status, false; return; end if;
  if (p_customer->>'payment_method') not in ('bank_transfer', 'cash_on_delivery')
    or (p_customer->>'delivery_method') not in ('nova_poshta', 'ukrposhta', 'courier') then
    raise exception using errcode = '22023', message = 'Invalid order';
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
  select coalesce(sum(v.price * (item->>'quantity')::integer), 0)::numeric(12, 2) into v_total
    from jsonb_array_elements(p_items) item join public.product_variants v on v.id = (item->>'variant_id')::uuid;
  v_payment_status := case when p_customer->>'payment_method' = 'cash_on_delivery' then 'cash_on_delivery'::public.payment_status else 'pending'::public.payment_status end;
  insert into public.orders (idempotency_key, first_name, last_name, phone, customer_email, city, delivery_method, delivery_address, payment_method, payment_status, status, comment, subtotal, delivery_price, total)
  values (p_idempotency_key, trim(p_customer->>'first_name'), trim(p_customer->>'last_name'), trim(p_customer->>'phone'), v_customer_email,
    trim(p_customer->>'city'), (p_customer->>'delivery_method')::public.delivery_method, trim(p_customer->>'delivery_address'),
    (p_customer->>'payment_method')::public.payment_method, v_payment_status, 'new', nullif(trim(p_customer->>'comment'), ''), v_total, 0, v_total)
  returning id, public.orders.order_number into v_order_id, v_order_number;
  insert into public.order_items (order_id, product_id, variant_id, product_name, product_image, size, color, price, quantity)
  select v_order_id, p.id, v.id, p.name, (select p_public_storage_url || image.storage_path from public.product_images image where image.product_id = p.id order by image.sort_order, image.id limit 1),
    v.size, v.color, v.price, (item->>'quantity')::integer
  from jsonb_array_elements(p_items) item join public.product_variants v on v.id = (item->>'variant_id')::uuid join public.products p on p.id = v.product_id;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_variant_id := (v_item->>'variant_id')::uuid; v_quantity := (v_item->>'quantity')::integer;
    update public.product_variants set stock = stock - v_quantity where id = v_variant_id and stock >= v_quantity;
    if not found then raise exception using errcode = 'P0001', message = 'Items unavailable or stock changed'; end if;
  end loop;
  insert into public.notification_outbox(order_id, recipient_email, recipient_type, event_type, payload)
  values (v_order_id, v_customer_email, 'customer', 'order_created', jsonb_build_object('order_number', v_order_number, 'first_name', trim(p_customer->>'first_name'), 'total', v_total, 'payment_status', v_payment_status));
  if p_admin_notification_email is not null and p_admin_notification_email <> '' then
    insert into public.notification_outbox(order_id, recipient_email, recipient_type, event_type, payload)
    values (v_order_id, p_admin_notification_email, 'admin', 'order_created', jsonb_build_object(
      'order_number', v_order_number, 'first_name', trim(p_customer->>'first_name'),
      'last_name', trim(p_customer->>'last_name'), 'phone', trim(p_customer->>'phone'),
      'customer_email', v_customer_email, 'city', trim(p_customer->>'city'),
      'delivery_method', p_customer->>'delivery_method', 'delivery_address', trim(p_customer->>'delivery_address'),
      'payment_method', p_customer->>'payment_method', 'total', v_total,
      'items', (select jsonb_agg(jsonb_build_object('name', oi.product_name, 'size', oi.size, 'color', oi.color, 'quantity', oi.quantity, 'subtotal', oi.subtotal)) from public.order_items oi where oi.order_id = v_order_id)
    ));
  end if;
  return query select v_order_number, v_total, v_payment_status, true;
end;
$$;
revoke all on function public.create_order_secure(uuid, jsonb, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.create_order_secure(uuid, jsonb, jsonb, text, text) to service_role;
