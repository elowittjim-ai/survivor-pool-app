import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import TabNav from "../TabNav";
import SeasonGridTable, { buildGridData } from "../SeasonGridTable";

export default async function GridPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_approved, is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_approved) redirect("/login");

  const { data: seasonState } = await supabase
    .from("season_state")
    .select("current_week, is_complete")
    .eq("id", 1)
    .single();
  const currentWeek = seasonState?.current_week ?? 1;

  const { data: players } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("is_approved", true)
    .order("display_name");

  // Columns = every contestant who's ever been in the game, not just the
  // active ones — a player's history includes contestants now eliminated.
  const { data: allContestants } = await supabase
    .from("contestants")
    .select("id, name, tribe, status, eliminated_week");

  // Only closed weeks — this week's picks never render here (5.7 deadline gating).
  const { data: closedPicks } = await supabase
    .from("picks")
    .select("player_id, week, contestant_id, contestants(status, eliminated_week)")
    .lt("week", currentWeek);

  const gridData = buildGridData(players, allContestants, closedPicks);

  return (
    <div>
      <div className="sp-header">
        <div className="sp-brand">
          <div className="sp-brand-mark">🔥</div>
          <div>
            <div className="sp-display sp-brand-title">SURVIVOR POOL</div>
            <div className="sp-brand-sub">Week {currentWeek}</div>
          </div>
        </div>
        <div className="sp-header-right">
          {profile.is_admin && (
            <Link href="/admin" className="sp-btn sp-btn-secondary">Admin</Link>
          )}
          <span className="sp-user-chip">👤 {profile.display_name}</span>
          <form action={signOut}>
            <button type="submit" className="sp-btn sp-btn-secondary">Sign out</button>
          </form>
        </div>
      </div>

      <TabNav active="grid" showResults={!!seasonState?.is_complete} />

      <main className="sp-main">
        <div className="sp-card">
          <div className="sp-section-title">Season grid</div>
          <p className="sp-section-sub">
            Every player&apos;s pick history, one column per contestant — same layout as the
            old spreadsheet. This week&apos;s pick stays blank until the admin closes it.
          </p>
          <SeasonGridTable
            {...gridData}
            emptyContestantsMessage="No contestants yet — the admin adds the cast in Admin."
          />
        </div>
      </main>
    </div>
  );
}
