import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import PickView from "../PickView";
import TabNav from "../TabNav";

export default async function PickPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_approved, is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_approved) {
    redirect("/login");
  }

  const { data: seasonState } = await supabase
    .from("season_state")
    .select("current_week, is_complete, picks_locked, season_started")
    .eq("id", 1)
    .single();
  const currentWeek = seasonState?.current_week ?? 1;

  const { data: contestants } = await supabase
    .from("contestants")
    .select("id, name, tribe, photo_url")
    .eq("status", "active")
    .order("name");

  const { data: myPicks } = await supabase
    .from("picks")
    .select("week, contestant_id, contestants(name, status, eliminated_week)")
    .eq("player_id", user.id)
    .order("week");

  const picks = myPicks || [];

  let meStatus = { alive: true };
  for (const pick of picks) {
    if (pick.week >= currentWeek) continue;
    const c = pick.contestants;
    if (c && c.status === "eliminated" && c.eliminated_week === pick.week) {
      meStatus = { alive: false, outWeek: pick.week, outContestant: c.name };
      break;
    }
  }

  const usedIds = picks.filter((p) => p.week < currentWeek).map((p) => p.contestant_id);
  const active = contestants || [];
  const eligibleCount = active.filter((c) => !usedIds.includes(c.id)).length;
  const clearedBoard = eligibleCount === 0 && active.length > 0;

  const currentPick = picks.find((p) => p.week === currentWeek) || null;

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

      <TabNav active="pick" showResults={!!seasonState?.is_complete} />

      <main className="sp-main">
        {meStatus.alive ? (
          <PickView
            week={currentWeek}
            contestants={active}
            usedIds={usedIds}
            clearedBoard={clearedBoard}
            currentPickId={currentPick?.contestant_id || null}
            currentPickName={currentPick?.contestants?.name || null}
            picksLocked={!!seasonState?.picks_locked}
            seasonStarted={!!seasonState?.season_started}
          />
        ) : (
          <div className="sp-card">
            <div className="sp-section-title">You&apos;re out for this season</div>
            <p className="sp-section-sub">
              You picked {meStatus.outContestant}, who was voted out in week {meStatus.outWeek}.
            </p>
            <div className="sp-status-out">💀 Eliminated week {meStatus.outWeek}</div>
          </div>
        )}
      </main>
    </div>
  );
}
