alter function public.save_product_with_variants(uuid, jsonb, jsonb)
  rename to save_product_with_variants_internal;

create or replace function public.save_product_with_variants(
  p_product_id text,
  p_product jsonb,
  p_variants jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
begin
  if p_product_id is null or p_product_id = '' then
    return public.save_product_with_variants_internal(null::uuid, p_product, p_variants);
  end if;
  return public.save_product_with_variants_internal(p_product_id::uuid, p_product, p_variants);
end;
$$;

revoke all on function public.save_product_with_variants(text, jsonb, jsonb) from public, anon;
grant execute on function public.save_product_with_variants(text, jsonb, jsonb) to authenticated;
