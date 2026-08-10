import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import AdminView from "./AdminView";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_admin, is_approved")
    .eq("id", user.id)
    .single();

  if (!profile?.is_approved) redirect("/login");
  if (!profile?.is_admin) redirect("/");

  const { data: pendingPlayers } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("is_approved", false)
    .order("display_name");

  const { data: approvedPlayers } = await supabase
    .from("profiles")
    .select("id, display_name, is_admin, chat_muted")
    .eq("is_approved", true)
    .order("display_name");

  const { data: activeContestants } = await supabase
    .from("contestants")
    .select("id, name, tribe, photo_url")
    .eq("status", "active")
    .order("name");

  const { data: allContestants } = await supabase
    .from("contestants")
    .select("id, name, status, eliminated_week")
    .order("name");

  const { data: recentCorrections } = await supabase
    .from("corrections")
    .select("id, description, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: seasonState } = await supabase
    .from("season_state")
    .select("current_week, is_complete, commissioner_message")
    .eq("id", 1)
    .single();
  const currentWeek = seasonState?.current_week ?? 1;

  // RLS lets admins see current-week picks (unlike regular players, who only
  // see closed weeks) — that's what makes this live view possible.
  const { data: currentWeekPicks } = await supabase
    .from("picks")
    .select("player_id, contestants(name)")
    .eq("week", currentWeek);

  return (
    <div>
      <div className="sp-header">
        <div className="sp-brand">
          <div className="sp-brand-mark">🛡️</div>
          <div>
            <div className="sp-display sp-brand-title">ADMIN</div>
            <div className="sp-brand-sub">Week {currentWeek}</div>
          </div>
        </div>
        <div className="sp-header-right">
          <Link href="/pick" className="sp-btn sp-btn-secondary">Pick screen</Link>
          <span className="sp-user-chip">👤 {profile.display_name}</span>
          <form action={signOut}>
            <button type="submit" className="sp-btn sp-btn-secondary">Sign out</button>
          </form>
        </div>
      </div>
      <main className="sp-main">
        <AdminView
          pendingPlayers={pendingPlayers || []}
          approvedPlayers={approvedPlayers || []}
          currentUserId={user.id}
          activeContestants={activeContestants || []}
          allContestants={allContestants || []}
          recentCorrections={recentCorrections || []}
          currentWeek={currentWeek}
          isComplete={!!seasonState?.is_complete}
          commissionerMessage={seasonState?.commissioner_message}
          currentWeekPicks={currentWeekPicks || []}
        />
      </main>
    </div>
  );
}
