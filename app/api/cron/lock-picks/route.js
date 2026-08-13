import { createAdminClient } from "@/lib/supabase/admin";
import { autoPickStragglers } from "@/lib/autoPickStragglers";

// Vercel invokes this on the schedule in vercel.json with
// `Authorization: Bearer $CRON_SECRET` — only when that env var is set on
// the project, which is what actually gates this route. Without it, every
// request is rejected, including Vercel's own.
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: seasonState } = await supabase
    .from("season_state")
    .select("current_week, is_complete, picks_locked")
    .eq("id", 1)
    .single();

  if (!seasonState || seasonState.is_complete || seasonState.picks_locked) {
    return Response.json({ skipped: true });
  }

  const week = seasonState.current_week;

  const { data: pool } = await supabase
    .from("contestants")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  const autoPickError = await autoPickStragglers(supabase, week, pool || []);
  if (autoPickError) {
    return Response.json({ error: "Couldn't auto-pick for stragglers." }, { status: 500 });
  }

  const { error } = await supabase.from("season_state").update({ picks_locked: true }).eq("id", 1);
  if (error) {
    return Response.json({ error: "Couldn't lock picks." }, { status: 500 });
  }

  return Response.json({ success: true, week });
}
