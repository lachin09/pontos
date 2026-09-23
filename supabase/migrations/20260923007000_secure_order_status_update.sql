grant all on public.notification_outbox to service_role;

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
