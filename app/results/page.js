import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import TabNav from "../TabNav";
import SeasonGridTable, { buildGridData } from "../SeasonGridTable";

export default async function ResultsPage() {
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
    .select("current_week, is_complete, season_winner_contestant_id, buy_in_amount, total_prize_pool")
    .eq("id", 1)
    .single();

  const header = (
    <div className="sp-header">
      <div className="sp-brand">
        <div className="sp-brand-mark">🔥</div>
        <div>
          <div className="sp-display sp-brand-title">SURVIVOR POOL</div>
          <div className="sp-brand-sub">Week {seasonState?.current_week ?? 1}</div>
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
  );

  if (!seasonState?.is_complete) {
    return (
      <div>
        {header}
        <TabNav active="results" showResults={false} />
        <main className="sp-main">
          <div className="sp-card">
            <div className="sp-section-title">No results yet</div>
            <p className="sp-section-sub">
              This fills in once the admin declares a season winner.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { data: winnerContestant } = await supabase
    .from("contestants")
    .select("name")
    .eq("id", seasonState.season_winner_contestant_id)
    .single();

  const { data: players } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("is_approved", true)
    .order("display_name");

  const { data: allContestants } = await supabase
    .from("contestants")
    .select("id, name, tribe, status, eliminated_week");

  const { data: allPicks } = await supabase
    .from("picks")
    .select("player_id, week, contestant_id, contestants(name, status, eliminated_week)")
    .order("week");

  // Season's over, so every week is fair game to show — no deadline-gating
  // left to respect (0005 extends the same to a direct DB read; this is the
  // read the UI actually uses).
  const gridData = buildGridData(players, allContestants, allPicks);

  const picksByPlayer = new Map();
  for (const pick of allPicks || []) {
    if (!picksByPlayer.has(pick.player_id)) picksByPlayer.set(pick.player_id, []);
    picksByPlayer.get(pick.player_id).push(pick);
  }

  const potAmount =
    seasonState.total_prize_pool != null
      ? Number(seasonState.total_prize_pool)
      : (players?.length || 0) * Number(seasonState.buy_in_amount || 0);

  const survivors = [];
  const poolWinners = [];
  for (const player of players || []) {
    const playerPicks = picksByPlayer.get(player.id) || [];
    const outWeek = playerPicks.find(
      (p) => p.contestants?.status === "eliminated" && p.contestants.eliminated_week === p.week
    );
    if (outWeek) continue;
    survivors.push(player);
    if (playerPicks.some((p) => p.contestant_id === seasonState.season_winner_contestant_id)) {
      poolWinners.push(player);
    }
  }

  const shareEach = poolWinners.length > 0 ? Math.round((potAmount / poolWinners.length) * 100) / 100 : 0;

  return (
    <div>
      {header}
      <TabNav active="results" showResults={true} />
      <main className="sp-main">
        <div className="sp-card">
          <div className="sp-section-title">
            🏆 {winnerContestant?.name || "Unknown"} won the season
          </div>
          <p className="sp-section-sub">
            {survivors.length} of {players?.length || 0} players made it to the end without
            an elimination.
          </p>

          {poolWinners.length > 0 ? (
            <>
              <div
                className="sp-banner"
                style={{ margin: "0 0 14px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}
              >
                {poolWinners.length === 1
                  ? "1 player both survived and picked the winner — they take the full pot."
                  : `${poolWinners.length} players both survived and picked the winner — they split the pot evenly.`}
              </div>
              {poolWinners.map((p) => (
                <div key={p.id} className="sp-row">
                  <span>{p.display_name}</span>
                  <span className="sp-pill" style={{ background: "var(--sp-gold-soft)", color: "var(--sp-gold)" }}>
                    ${shareEach.toLocaleString()}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <>
              <div
                className="sp-banner"
                style={{ margin: "0 0 14px", background: "var(--sp-danger-soft)", color: "#f0a99e" }}
              >
                Nobody who survived picked {winnerContestant?.name || "the winner"} — the $
                {potAmount.toLocaleString()} pot rolls over to next season.
              </div>
              {survivors.length > 0 && (
                <>
                  <p className="sp-section-sub" style={{ marginTop: 4 }}>
                    These players made it furthest without a winning pick:
                  </p>
                  {survivors.map((p) => (
                    <div key={p.id} className="sp-row">
                      <span>{p.display_name}</span>
                      <span className="sp-pill" style={{ background: "var(--sp-gold-soft)", color: "var(--sp-gold)" }}>
                        Free entry
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          <p className="sp-notice" style={{ marginTop: 14 }}>
            {seasonState.total_prize_pool != null
              ? `Total pot: $${potAmount.toLocaleString()}, set by the commissioner.`
              : `Pot is $${seasonState.buy_in_amount} × ${players?.length || 0} approved players.`}
          </p>
        </div>

        <div className="sp-card">
          <div className="sp-section-title">Final season grid</div>
          <p className="sp-section-sub">
            The full pick history for the season, same layout as the old spreadsheet.
          </p>
          <SeasonGridTable {...gridData} />
        </div>
      </main>
    </div>
  );
}
