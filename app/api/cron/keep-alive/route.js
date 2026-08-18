import { createAdminClient } from "@/lib/supabase/admin";

// Free-tier Supabase projects pause after 7 days with zero database
// activity, which would otherwise happen during a long between-seasons gap.
// A cheap daily read is all it takes to keep the project active — nothing
// else about this job matters beyond "a query happened."
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("season_state").select("id").limit(1);

  if (error) {
    return Response.json({ error: "Keep-alive query failed." }, { status: 500 });
  }

  return Response.json({ success: true, pingedAt: new Date().toISOString() });
}
