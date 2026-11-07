-- ============================================================
-- All in One — Full-Stack Migration (existing databases ke liye)
-- Supabase SQL Editor mein paste kar ke RUN karein.
-- Ye file purani database par chalti hai; nayi install ke liye
-- sirf schema.sql kafi hai. Runs are idempotent (repeat-safe).
-- ============================================================

-- ---------- Products: numeric stock ----------

alter table public.products add column if not exists stock integer not null default 0;
update public.products set stock = 100 where stock <= 0 and in_stock = true;

-- ---------- Orders: user + coupon + payment status ----------

alter table public.orders add column if not exists user_id uuid;
alter table public.orders add column if not exists user_email text;
alter table public.orders add column if not exists discount numeric(12,2) not null default 0;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists payment_status text not null default 'pending';

do $$ begin
  alter table public.orders
    add constraint orders_payment_status_check
    check (payment_status in ('pending','received','failed'));
exception when duplicate_object then null;
end $$;

create index if not exists orders_user_idx on public.orders(user_id);

-- ---------- Product reviews ----------

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  author_name text not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews(product_id);

alter table public.reviews enable row level security;

drop policy if exists "Public read reviews" on public.reviews;
create policy "Public read reviews"
  on public.reviews for select using (true);

drop policy if exists "Anyone can post reviews" on public.reviews;
create policy "Anyone can post reviews"
  on public.reviews for insert to anon, authenticated
  with check (rating between 1 and 5);

-- ---------- Coupons ----------

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

alter table public.coupons enable row level security;

-- ---------- SECURITY FIX: Dangerous "Authenticated" policies REMOVE ----------

drop policy if exists "Admin write categories"  on public.categories;
drop policy if exists "Admin write products"    on public.products;
drop policy if exists "Admin read orders"       on public.orders;
drop policy if exists "Admin update orders"     on public.orders;
drop policy if exists "Admin delete orders"     on public.orders;
drop policy if exists "Admin manage coupons"    on public.coupons;
drop policy if exists "Anon read orders for realtime" on public.orders;
drop policy if exists "Anyone can place orders"      on public.orders;
drop policy if exists "Admin upload product images"   on storage.objects;
drop policy if exists "Admin update product images"   on storage.objects;
drop policy if exists "Admin delete product images"   on storage.objects;

-- ---------- SECURITY FIX: Remove dangerous RPC grants ----------

revoke execute on function public.decrement_stock(uuid, integer)    from anon, authenticated;
revoke execute on function public.increment_coupon_usage(text)      from anon, authenticated;
drop function if exists public.decrement_stock(uuid, integer);
drop function if exists public.increment_coupon_usage(text);

-- ---------- Security definer functions ----------

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

-- ---------- ATOMIC ORDER FUNCTION ----------

create or replace function public.place_order(
  p_order_number    text,
  p_user_id         uuid,
  p_user_email      text,
  p_customer_name   text,
  p_phone           text,
  p_address         text,
  p_city            text,
  p_payment_method  text,
  p_items           jsonb,
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

-- ---------- Grants ----------

grant execute on function public.validate_coupon to anon, authenticated;
grant execute on function public.track_order      to anon, authenticated;
grant execute on function public.get_my_orders    to authenticated;
grant execute on function public.place_order      to anon, authenticated;

-- ---------- Product images bucket ----------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- ---------- Seed coupons ----------

insert into public.coupons (code, discount_type, discount_value, min_subtotal, active, max_uses)
values
  ('WELCOME10', 'percent', 10, 500,  true, 500),
  ('FLAT150',   'fixed',  150, 1000, true, 300)
on conflict (code) do nothing;

-- ---------- Realtime ----------

do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    raise notice 'orders already in supabase_realtime';
  else
    alter publication supabase_realtime add table public.orders;
  end if;
exception when undefined_object then
  create publication supabase_realtime for table public.orders;
end $$;
