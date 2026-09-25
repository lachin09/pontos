alter table public.product_images
  add column color text check (color is null or length(trim(color)) between 1 and 80);

create index product_images_product_color_sort_idx
  on public.product_images(product_id, color, sort_order);
