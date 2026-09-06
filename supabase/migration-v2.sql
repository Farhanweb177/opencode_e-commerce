-- ============================================================
-- All in One — Migration v2 (SECURITY + FEATURES)
-- Existing databases ke liye. Supabase SQL Editor mein run karein.
-- Idempotent hai — repeat-safe.
-- ============================================================

-- ============================================================
-- PHASE A: SECURITY FIXES
-- ============================================================

-- 1) Dangerous "Authenticated" policies hatayein (admin writes ke liye unneeded)
--    Admin panel SERVICE_ROLE key se chalta hai — RLS bypass karta hai.
--    Ye policies ghalat thi: koi bhi Supabase Auth user products/categories
--    ya orders ko delete/modify kar sakta tha.

drop policy if exists "Admin write categories"    on public.categories;
drop policy if exists "Admin write products"      on public.products;
drop policy if exists "Admin read orders"         on public.orders;
drop policy if exists "Admin update orders"       on public.orders;
drop policy if exists "Admin delete orders"       on public.orders;
drop policy if exists "Admin manage coupons"      on public.coupons;

-- 2) REALTIME FIX KA DANGEROUS POLICY HATAYEIN
--    "Anon read orders for realtime" — anonymous user ko saare orders
--    (name/phone/address) dikha raha tha. Ab realtime nahi chahiye
--    (polling se notification aati hai) — isliye policy hata dein.

drop policy if exists "Anon read orders for realtime" on public.orders;

-- 3) Storage ki authenticated write policies hatayein
--    Sirf public read + service-role admin (bypass) chahiye.

drop policy if exists "Admin upload product images"  on storage.objects;
drop policy if exists "Admin update product images"  on storage.objects;
drop policy if exists "Admin delete product images"  on storage.objects;

-- 4) DANGEROUS FUNCTIONS REVOKE + DROP
--    decrement_stock aur increment_coupon_usage ko anonymous tak grant karna
--    ghalat tha — koi bhi directly call karke stock khatam kar sakta tha.
--    Ab place_order function yeh sab internally handle karta hai.

revoke execute on function public.decrement_stock(uuid, integer) from anon, authenticated;
revoke execute on function public.increment_coupon_usage(text)   from anon, authenticated;
drop function if exists public.decrement_stock(uuid, integer);
drop function if exists public.increment_coupon_usage(text);

-- ============================================================
-- PHASE B: NEW COLUMNS + FEATURES
-- ============================================================

-- payment_status column (admin confirm karega jab payment receive ho)
alter table public.orders add column if not exists payment_status text not null default 'pending';

-- Ensure check constraint exists (may already have old schema)
-- Idempotent constraint add:
do $$ begin
  alter table public.orders
    add constraint orders_payment_status_check
    check (payment_status in ('pending','received','failed'));
exception when duplicate_object then null;
end $$;

-- Full-text search vector
alter table public.products add column if not exists search_vector tsvector;

-- For existing rows — populate search_vector manually (trigger future mein set karega)
update public.products set search_vector = to_tsvector('simple',
  coalesce(name, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(category_slug, '') || ' ' ||
  coalesce(tag, '')
);

-- GIN index for full-text search
create index if not exists products_search_idx on public.products using gin(search_vector);

-- Trigger to keep search_vector updated on INSERT/UPDATE
create or replace function public.products_search_update() returns trigger
language plpgsql as $$
begin
  new.search_vector := to_tsvector('simple',
    coalesce(new.name, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.category_slug, '') || ' ' ||
    coalesce(new.tag, '')
  );
  return new;
end;
$$;

drop trigger if exists trg_products_search_update on public.products;
create trigger trg_products_search_update
  before insert or update on public.products
  for each row execute function public.products_search_update();

-- ============================================================
-- PHASE C: ATOMIC ORDER FUNCTION (place_order)
-- ============================================================

create or replace function public.place_order(
  p_order_number    text,
  p_user_id         uuid,
  p_user_email      text,
  p_customer_name   text,
  p_phone           text,
  p_address         text,
  p_city            text,
  p_payment_method  text,
  p_items           jsonb,       -- [{productId, quantity}]
  p_coupon_code     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id          uuid;
  v_subtotal    numeric := 0;
  v_shipping    numeric;
  v_discount    numeric := 0;
  v_total       numeric;
  v_item        jsonb;
  v_product     record;
  v_dtype       text;
  v_dvalue      numeric;
  v_min_sub     numeric;
  v_items_snap  jsonb  := '[]'::jsonb;
  v_order_item  jsonb;
begin
  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'Delivery details incomplete hain.' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select p.id, p.slug, p.name, p.emoji, p.price, p.stock
      into v_product
      from public.products p
      where p.id = (v_item->>'productId')::uuid;

    if v_product is null then
      raise exception 'Product nahi mila (id: %)', v_item->>'productId'
        using errcode = 'P0001';
    end if;

    if (v_item->>'quantity')::int <= 0 then
      raise exception 'Invalid quantity for %', v_product.name
        using errcode = 'P0001';
    end if;

    if v_product.stock < (v_item->>'quantity')::int then
      raise exception '"%s" ki stock khatam ho gayi hai (%d available)',
        v_product.name, v_product.stock
        using errcode = 'P0001';
    end if;

    update public.products
      set stock    = stock - (v_item->>'quantity')::int,
          in_stock = (stock - (v_item->>'quantity')::int) > 0
    where id = v_product.id;

    v_subtotal := v_subtotal + v_product.price * (v_item->>'quantity')::int;

    v_order_item := jsonb_build_object(
      'productId', v_product.id,
      'slug',      v_product.slug,
      'name',      v_product.name,
      'emoji',     v_product.emoji,
      'price',     v_product.price,
      'quantity',  (v_item->>'quantity')::int
    );
    v_items_snap := v_items_snap || v_order_item;
  end loop;

  v_shipping := case when v_subtotal >= 2000 then 0 else 200 end;

  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    select c.discount_type, c.discount_value, c.min_subtotal
      into v_dtype, v_dvalue, v_min_sub
      from public.coupons c
      where lower(c.code) = lower(p_coupon_code)
        and c.active = true
        and (c.max_uses is null or c.used_count < max_uses)
        and (c.expires_at is null or c.expires_at > now())
      limit 1;

    if v_dtype is not null and v_subtotal >= v_min_sub then
      if v_dtype = 'percent' then
        v_discount := round(v_subtotal * v_dvalue / 100);
      else
        v_discount := least(v_dvalue, v_subtotal);
      end if;

      update public.coupons set used_count = used_count + 1
        where lower(code) = lower(p_coupon_code)
          and (max_uses is null or used_count < max_uses);
    end if;
  end if;

  v_total := greatest(0, v_subtotal + v_shipping - v_discount);

  insert into public.orders (
    order_number, user_id, user_email, customer_name, phone, address, city,
    payment_method, payment_status, items, subtotal, shipping, discount,
    coupon_code, total, status
  ) values (
    p_order_number, p_user_id, p_user_email, p_customer_name, p_phone,
    p_address, p_city, p_payment_method, 'pending',
    v_items_snap, v_subtotal, v_shipping, v_discount,
    case when btrim(p_coupon_code) = '' then null else btrim(p_coupon_code) end,
    v_total, 'pending'
  ) returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'order_number', p_order_number,
    'subtotal',     v_subtotal,
    'shipping',     v_shipping,
    'discount',     v_discount,
    'total',        v_total
  );
exception
  when others then
    raise;
end;
$$;

-- Grant execute (anon checkout ke liye)
revoke execute on function public.place_order from anon, authenticated;
grant execute on function public.place_order to anon, authenticated;

-- ============================================================
-- PHASE D: SEED COUPONS
-- ============================================================

insert into public.coupons (code, discount_type, discount_value, min_subtotal, active, max_uses)
values
  ('WELCOME10', 'percent', 10, 500,  true, 500),
  ('FLAT150',   'fixed',  150, 1000, true, 300)
on conflict (code) do nothing;

-- ============================================================
-- DONE! Yeh file safe hai baar baar chalane ke liye.
-- ============================================================
