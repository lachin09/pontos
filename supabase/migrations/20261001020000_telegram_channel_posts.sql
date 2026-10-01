-- Telegram channel posts.
--
-- channel_post_pending: the product has not been announced in the store's
--   Telegram channel yet. The admin API posts it after the first save where
--   it is published with photos, then clears the flag, so later edits never
--   post it again. Connecting a channel clears the flag for everything
--   already published: only products added afterwards are announced.
--
-- Read and written by signed-in admins only ("Admins manage products").

alter table public.products
  add column channel_post_pending boolean not null default true;
