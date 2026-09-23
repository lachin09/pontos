create or replace function public.save_product_with_variants(
  p_product_id uuid,
  p_product jsonb,
  p_variants jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_product_id uuid;
  v_variant jsonb;
  v_variant_id uuid;
begin
  if not public.is_active_admin() then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;
  if jsonb_typeof(p_product) <> 'object'
    or jsonb_typeof(p_variants) <> 'array'
    or jsonb_array_length(p_variants) < 1
    or jsonb_array_length(p_variants) > 100 then
    raise exception using errcode = '22023', message = 'Invalid product';
  end if;

  if p_product_id is null then
    insert into public.products (
      category_id, name, slug, description, composition, care_instructions,
      price, old_price, is_published, is_available, is_featured, is_new, is_sale
    ) values (
      (p_product->>'category_id')::uuid,
      trim(p_product->>'name'), trim(p_product->>'slug'),
      coalesce(p_product->>'description', ''),
      coalesce(p_product->>'composition', ''),
      coalesce(p_product->>'care_instructions', ''),
      (p_product->>'price')::numeric,
      nullif(p_product->>'old_price', '')::numeric,
      (p_product->>'is_published')::boolean,
      (p_product->>'is_available')::boolean,
      (p_product->>'is_featured')::boolean,
      (p_product->>'is_new')::boolean,
      (p_product->>'is_sale')::boolean
    ) returning id into v_product_id;
  else
    update public.products set
      category_id = (p_product->>'category_id')::uuid,
      name = trim(p_product->>'name'),
      slug = trim(p_product->>'slug'),
      description = coalesce(p_product->>'description', ''),
      composition = coalesce(p_product->>'composition', ''),
      care_instructions = coalesce(p_product->>'care_instructions', ''),
      price = (p_product->>'price')::numeric,
      old_price = nullif(p_product->>'old_price', '')::numeric,
      is_published = (p_product->>'is_published')::boolean,
      is_available = (p_product->>'is_available')::boolean,
      is_featured = (p_product->>'is_featured')::boolean,
      is_new = (p_product->>'is_new')::boolean,
      is_sale = (p_product->>'is_sale')::boolean
    where id = p_product_id
    returning id into v_product_id;
    if not found then
      raise exception using errcode = 'P0002', message = 'Product not found';
    end if;
  end if;

  for v_variant in select value from jsonb_array_elements(p_variants)
  loop
    if nullif(v_variant->>'id', '') is null then
      insert into public.product_variants (
        product_id, sku, size, color, color_hex, price, stock, is_available
      ) values (
        v_product_id, trim(v_variant->>'sku'), trim(v_variant->>'size'),
        trim(v_variant->>'color'), upper(v_variant->>'color_hex'),
        (v_variant->>'price')::numeric, (v_variant->>'stock')::integer,
        (v_variant->>'is_available')::boolean
      );
    else
      v_variant_id := (v_variant->>'id')::uuid;
      update public.product_variants set
        sku = trim(v_variant->>'sku'),
        size = trim(v_variant->>'size'),
        color = trim(v_variant->>'color'),
        color_hex = upper(v_variant->>'color_hex'),
        price = (v_variant->>'price')::numeric,
        stock = (v_variant->>'stock')::integer,
        is_available = (v_variant->>'is_available')::boolean
      where id = v_variant_id and product_id = v_product_id;
      if not found then
        raise exception using errcode = '22023', message = 'Invalid product variant';
      end if;
    end if;
  end loop;

  -- Retire removed variants instead of deleting them so historical order lines
  -- keep valid product snapshots and old variant combinations remain unique.
  update public.product_variants v
  set stock = 0, is_available = false
  where v.product_id = v_product_id
    and not exists (
      select 1 from jsonb_array_elements(p_variants) item
      where nullif(item->>'id', '') is not null
        and (item->>'id')::uuid = v.id
        or nullif(item->>'id', '') is null and item->>'sku' = v.sku
    );

  return v_product_id;
end;
$$;

revoke all on function public.save_product_with_variants(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_product_with_variants(uuid, jsonb, jsonb) to authenticated;
