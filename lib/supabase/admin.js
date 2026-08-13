import { createClient } from "@supabase/supabase-js";

// For trusted server-only jobs with no logged-in user (e.g. the scheduled
// auto-lock cron) — bypasses RLS entirely via the service role key, so this
// must never be imported into anything reachable from the browser or from a
// normal user request.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
