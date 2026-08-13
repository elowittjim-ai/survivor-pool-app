// Assigns the alphabetical auto-pick to anyone approved who hasn't picked
// yet for `week` (and isn't already eliminated from an earlier week). `pool`
// is which contestants are eligible to be auto-picked from — a manual lock
// only knows who's active so far, while closeWeek also folds in whoever's
// just been eliminated that same week (mirrors the validated prototype, so a
// straggler's auto-pick can still match this week's boot and count as "out").
// Shared by the admin lock/close actions and the scheduled auto-lock cron
// job, so both go through the exact same logic.
export async function autoPickStragglers(supabase, week, pool) {
  const { data: approvedPlayers } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_approved", true);

  const { data: existingPicks } = await supabase
    .from("picks")
    .select("player_id, week, contestant_id")
    .eq("week", week);
  const pickedThisWeek = new Set((existingPicks || []).map((p) => p.player_id));

  const { data: allPicks } = await supabase
    .from("picks")
    .select("player_id, week, contestant_id, contestants(status, eliminated_week)");

  const usedByPlayer = new Map();
  const alreadyOutPlayers = new Set();
  for (const p of allPicks || []) {
    if (!usedByPlayer.has(p.player_id)) usedByPlayer.set(p.player_id, new Set());
    usedByPlayer.get(p.player_id).add(p.contestant_id);
    const c = p.contestants;
    if (p.week < week && c && c.status === "eliminated" && c.eliminated_week === p.week) {
      alreadyOutPlayers.add(p.player_id);
    }
  }

  const stragglerRows = [];
  for (const player of approvedPlayers || []) {
    if (pickedThisWeek.has(player.id) || alreadyOutPlayers.has(player.id)) continue;
    const used = usedByPlayer.get(player.id) || new Set();
    let eligible = pool.filter((c) => !used.has(c.id));
    if (eligible.length === 0 && pool.length > 0) eligible = pool;
    if (eligible.length === 0) continue;
    const autoPick = [...eligible].sort((a, b) => a.name.localeCompare(b.name))[0];
    stragglerRows.push({ player_id: player.id, week, contestant_id: autoPick.id });
  }

  if (stragglerRows.length === 0) return null;

  const { error } = await supabase
    .from("picks")
    .upsert(stragglerRows, { onConflict: "player_id,week" });
  return error;
}
