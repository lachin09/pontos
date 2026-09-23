insert into public.categories (name, slug, description, image_url, sort_order)
values
  ('Футболки', 't-shirts', 'Базові футболки з приємних натуральних тканин.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 1),
  ('Світшоти та худі', 'sweatshirts', 'Затишні речі для прохолодних днів і щоденних образів.', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7', 2),
  ('Штани', 'trousers', 'Комфортний крій і продумані деталі на кожен день.', 'https://images.unsplash.com/photo-1542272604-787c3835535d', 3),
  ('Сорочки та верхній одяг', 'shirts-and-outerwear', 'Шари для мінливої погоди та виразного силуету.', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10', 4),
  ('Аксесуари', 'accessories', 'Невеликі речі, які завершують образ.', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b', 5)
on conflict (slug) do nothing;
