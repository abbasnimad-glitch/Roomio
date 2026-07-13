import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

// SERVER-ONLY. The service role key bypasses RLS entirely — never expose
// it to the browser (it must never be a NEXT_PUBLIC_* env var) and never
// call this from a Client Component. Use only in trusted server code,
// after independently verifying whatever external condition justifies
// the privileged write (e.g. confirming a Stripe payment succeeded via
// Stripe's own API before writing to boost_payments/properties).
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return createSupabaseJsClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
