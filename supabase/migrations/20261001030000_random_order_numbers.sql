-- Random order numbers.
--
-- Order numbers used to count up from 1, so "№13" told a customer how few
-- orders the store had taken. New orders now get a random six-digit number
-- (100000–999999) that no other order has. Existing orders keep the numbers
-- their customers already know.
--
-- The number is only a label: links sent to customers use public_token.

create or replace function public.generate_order_number()
returns bigint
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_number bigint;
begin
  loop
    v_number := 100000 + floor(random() * 900000)::bigint;
    exit when not exists (
      select 1 from public.orders where order_number = v_number
    );
  end loop;
  return v_number;
end;
$$;

-- Orders are only created by create_order_secure, which runs as its owner.
revoke all on function public.generate_order_number() from public, anon, authenticated;

alter table public.orders
  alter column order_number drop identity,
  alter column order_number set default public.generate_order_number();
