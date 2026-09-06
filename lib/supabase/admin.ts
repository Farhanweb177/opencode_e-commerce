import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVICE-ROLE client — sirf server-side (server actions / admin reads) ke liye.
// RLS bypass karta hai, isliye kabhi client browser bundle mein nahi aata.
// Admin har write isi se hota hai; storefront public reads anon key + RLS se.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}