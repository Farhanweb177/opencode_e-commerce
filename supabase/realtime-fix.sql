-- ============================================================
-- FIX: Realtime ke liye orders table publication mein add karein
-- (Sirf orders ki INSERT notification ke liye chahiye)
-- ============================================================

-- NOTE: Agar abhi tak ye file run ho chuki hai to
-- "Anon read orders for realtime" policy HATANI HAI — ye dangerous hai.
-- Customers ke saare orders (naam/phone/address) anon tak expose ho rahe the.

drop policy if exists "Anon read orders for realtime" on public.orders;

-- Orders table realtime publication mein shamil karein (idempotent):
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
