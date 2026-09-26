-- Telegram order notifications.
--
-- public_token: an unguessable id for links sent to the customer (the
--   Telegram deep link). Never expose order ids or numbers for this.
-- telegram_chat_id: the chat that asked for updates on this order.
--
-- Both columns are only read and written server-side with the service role
-- (orders has no public RLS policy), so no policy changes are needed.

alter table public.orders
  add column public_token uuid not null default gen_random_uuid(),
  add column telegram_chat_id bigint;

create unique index orders_public_token_key on public.orders (public_token);
