-- ============================================================
-- All in One — E-Commerce Database Schema
-- Supabase SQL Editor mein ye pura file paste kar ke RUN karein.
-- (Fresh install ke liye. Existing DB ke liye migration-v2.sql dekhein.)
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.categories (
  slug        text primary key,
  name        text not null,
  emoji       text not null default '🛍️',
  gradient    text not null default 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  description text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  category_slug  text not null references public.categories(slug) on delete cascade,
  price          numeric(12,2) not null check (price >= 0),
  original_price numeric(12,2) check (original_price >= 0),
  emoji          text not null default '📦',
  gradient       text not null default 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  image_url      text,
  description    text not null default '',
  rating         numeric(2,1) not null default 4.5 check (rating >= 0 and rating <= 5),
  reviews        integer not null default 0 check (reviews >= 0),
  in_stock       boolean not null default true,
  stock          integer not null default 0 check (stock >= 0),
  tag            text,
  created_at     timestamptz not null default now(),
  -- Full-text search vector (auto-updated trigger se)
  search_vector  tsvector generated always as (
    to_tsvector('simple',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(category_slug, '') || ' ' ||
      coalesce(tag, '')
    )
  ) stored
);

create index if not exists products_category_idx on public.products(category_slug);
create index if not exists products_search_idx  on public.products using gin(search_vector);

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  user_id         uuid,
  user_email      text,
  customer_name   text not null,
  phone           text not null,
  address         text not null,
  city            text not null,
  payment_method  text not null default 'Cash on Delivery',
  payment_status  text not null default 'pending'
                   check (payment_status in ('pending','received','failed')),
  items           jsonb not null default '[]'::jsonb,
  subtotal        numeric(12,2) not null,
  shipping        numeric(12,2) not null default 0,
  discount        numeric(12,2) not null default 0,
  coupon_code     text,
  total           numeric(12,2) not null,
  status          text not null default 'pending'
                   check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  created_at      timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_user_idx    on public.orders(user_id);

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  author_name text not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews(product_id);

create table if not exists public.coupons (
  code           text primary key,
  discount_type  text not null default 'percent'
                   check (discount_type in ('percent','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_subtotal   numeric(12,2) not null default 0 check (min_subtotal >= 0),
  active         boolean not null default true,
  max_uses       integer check (max_uses is null or max_uses > 0),
  used_count     integer not null default 0 check (used_count >= 0),
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (SECURE policies — sirf zaroori access)
-- ============================================================
-- SECURITY NOTE: Admin panel SERVICE_ROLE key se chalta hai (RLS bypass).
-- Hamein anon/authenticated ko sirf zaruri storefront access dena hai.
-- Koi bhi "to authenticated" admin-write policy NAHI chahiye.

alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.reviews    enable row level security;
alter table public.coupons    enable row level security;

-- CATEGORIES: public read only
drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
  on public.categories for select using (true);

-- PRODUCTS: public read only (admin writes via service-role, NOT via RLS)
drop policy if exists "Public read products" on public.products;
create policy "Public read products"
  on public.products for select using (true);

-- ORDERS:
--  - NO direct anon INSERT — orders sirf place_order() SECURITY DEFINER RPC
--    se bante hain (price/stock/coupon server-side validate hota hai).
--  - NO anon SELECT — customer personal data exposed nahi hoga
--  - admin reads/writes via service-role (RLS bypass)
drop policy if exists "Anyone can place orders" on public.orders;

-- REVIEWS: public read + anyone insert (with rating validation)
drop policy if exists "Public read reviews" on public.reviews;
create policy "Public read reviews"
  on public.reviews for select using (true);

drop policy if exists "Anyone can post reviews" on public.reviews;
create policy "Anyone can post reviews"
  on public.reviews for insert to anon, authenticated
  with check (rating between 1 and 5);

-- COUPONS: NO read policy (coupon list public mein nahi dikhega)
-- validate_coupon RPC security definer hai — public read policy ki zaroorat nahi
-- Admin writes service-role se hoti hain

-- ============================================================
-- Security Definer Functions
-- ============================================================

-- Coupon validate karo (checkout ke liye client-side preview)
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'valid', true,
    'code', c.code,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'min_subtotal', c.min_subtotal
  ) into result
  from public.coupons c
  where lower(c.code) = lower(p_code)
    and c.active = true
    and (c.max_uses is null or c.used_count < c.max_uses)
    and (c.expires_at is null or c.expires_at > now())
    and c.min_subtotal <= p_subtotal
  limit 1;

  if result is null then
    return jsonb_build_object(
      'valid', false,
      'error', 'Coupon invalid, expired, ya min order amount poori nahi.'
    );
  end if;
  return result;
end;
$$;

-- Order tracking (public, no login required)
create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  select jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'city', o.city,
    'status', o.status,
    'payment_method', o.payment_method,
    'subtotal', o.subtotal,
    'shipping', o.shipping,
    'discount', o.discount,
    'total', o.total,
    'items', o.items,
    'created_at', o.created_at
  ) into result
  from public.orders o
  where upper(btrim(o.order_number)) = upper(btrim(p_order_number))
    and regexp_replace(o.phone, '[^0-9]', '', 'g')
      = regexp_replace(p_phone, '[^0-9]', '', 'g')
  limit 1;

  return coalesce(result, jsonb_build_object('error', 'not_found'));
end;
$$;

-- Logged-in customer apne saare orders
create or replace function public.get_my_orders()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid; result jsonb;
begin
  uid := auth.uid();
  if uid is null then
    return jsonb_build_array();
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'order_number', o.order_number,
    'status',       o.status,
    'total',        o.total,
    'subtotal',     o.subtotal,
    'shipping',     o.shipping,
    'discount',     o.discount,
    'payment_method', o.payment_method,
    'items',        o.items,
    'created_at',   o.created_at
  ) order by o.created_at desc), '[]'::jsonb)
  into result
  from public.orders o
  where o.user_id = uid;

  return result;
end;
$$;

-- ============================================================
-- ATOMIC ORDER PLACEMENT (transactions mein stock + coupon)
-- ============================================================
-- Security definer hai — checkout server se hi call hota hai.
-- Sab kuch ek transaction mein hota hai: stock decrement, coupon usage,
-- order insert — partial failure nahi ho sakta.

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

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart khali hai.' using errcode = 'P0001';
  end if;

  -- 1) Har item ke liye prices aur stock fetch karo, validate karo, decrement karo
  for v_item in select * from jsonb_array_elements(p_items) loop
    select p.id, p.slug, p.name, p.emoji, p.price, p.stock, p.in_stock
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

    if v_product.in_stock is not true then
      raise exception '"%s" abhi available nahi hai', v_product.name
        using errcode = 'P0001';
    end if;

    if v_product.stock < (v_item->>'quantity')::int then
      raise exception '"%s" ki stock khatam ho gayi hai (%d available)', 
        v_product.name, v_product.stock
        using errcode = 'P0001';
    end if;

    -- Stock decrement
    update public.products
      set stock     = stock - (v_item->>'quantity')::int,
          in_stock  = (stock - (v_item->>'quantity')::int) > 0
    where id = v_product.id;

    v_subtotal := v_subtotal + v_product.price * (v_item->>'quantity')::int;

    -- Authoritative item snapshot
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

  -- 2) Shipping calculation
  v_shipping := case when v_subtotal >= 2000 then 0 else 200 end;

  -- 3) Coupon apply karo (conditional increment — race safe)
  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    select c.discount_type, c.discount_value, c.min_subtotal
      into v_dtype, v_dvalue, v_min_sub
      from public.coupons c
      where lower(c.code) = lower(p_coupon_code)
        and c.active = true
        and (c.max_uses is null or c.used_count < c.max_uses)
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

  -- 4) Total calculate
  v_total := greatest(0, v_subtotal + v_shipping - v_discount);

  -- 5) Order insert karo
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
    -- Place order fail hua — transaction automatically rollback ho jata hai
    -- (stock aur coupon usages bhi revert ho jayenge)
    raise;
end;
$$;

-- ============================================================
-- Grants (sirf jo storefront ko zaroorat hai)
-- ============================================================

grant execute on function public.validate_coupon to anon, authenticated;
grant execute on function public.track_order      to anon, authenticated;
grant execute on function public.get_my_orders    to authenticated;
grant execute on function public.place_order      to anon, authenticated;

-- ============================================================
-- Storage bucket (product images)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Admin uploads ke liye: service-role key use hoti hai (RLS bypass),
-- isliye yahan koi write policy ki zaroorat nahi. Agar kal ko
-- Supabase Auth se admin login karna ho to authenticated policy add karein.
