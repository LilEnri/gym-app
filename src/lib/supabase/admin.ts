import { createClient } from "@supabase/supabase-js";

/**
 * Client con service role key — bypassa RLS.
 * USARE SOLO IN ROUTE HANDLER / SERVER ACTION lato server.
 * MAI esporre al client.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY non configurata");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
