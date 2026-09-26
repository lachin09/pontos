-- Order status changes from the owner's Telegram chat.
--
-- Bot actions have no Supabase user, so status history records where a
-- change came from instead of requiring one.

alter table public.order_status_history
  alter column changed_by drop not null,
  add column changed_via text not null default 'admin'
    check (changed_via in ('admin', 'telegram')),
  add column telegram_chat_id bigint,
  add constraint order_status_history_actor_check check (
    (changed_via = 'admin' and changed_by is not null)
    or (changed_via = 'telegram' and telegram_chat_id is not null)
  );

-- Callable only with the service role (the webhook). The chat must be one of
-- the owner chats saved in store_settings, so even a bug in the app cannot
-- let another chat change orders.
create or replace function public.update_order_status_from_telegram(
  p_order_id uuid,
  p_status public.order_status,
  p_payment_status public.payment_status,
  p_chat_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_owner_chats jsonb;
begin
  select value->'ownerChatIds' into v_owner_chats
  from public.store_settings where key = 'telegram';
  if v_owner_chats is null
    or jsonb_typeof(v_owner_chats) <> 'array'
    or not (v_owner_chats @> to_jsonb(p_chat_id)) then
    raise exception using errcode = '42501', message = 'Chat is not an owner chat';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return false; end if;
  if v_order.status = p_status and v_order.payment_status = p_payment_status then
    return true;
  end if;

  update public.orders
  set status = p_status, payment_status = p_payment_status
  where id = p_order_id;

  insert into public.order_status_history(
    order_id, changed_by, changed_via, telegram_chat_id,
    old_status, new_status, old_payment_status, new_payment_status
  )
  values (
    p_order_id, null, 'telegram', p_chat_id,
    v_order.status, p_status, v_order.payment_status, p_payment_status
  );
  return true;
end;
$$;

revoke all on function public.update_order_status_from_telegram(uuid, public.order_status, public.payment_status, bigint)
  from public, anon, authenticated;
grant execute on function public.update_order_status_from_telegram(uuid, public.order_status, public.payment_status, bigint)
  to service_role;
