import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";
import TabNav from "./TabNav";
import AskQuestionForm from "./AskQuestionForm";
import RulesCard from "./RulesCard";

export default async function HomePage() {
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
    .select("current_week, is_complete, commissioner_message")
    .eq("id", 1)
    .single();
  const currentWeek = seasonState?.current_week ?? 1;

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

      <TabNav active="home" showResults={!!seasonState?.is_complete} />

      <main className="sp-main">
        <div className="sp-hero">
          <img src="/survivor-logo.png" alt="Survivor" className="sp-hero-logo" />
          <div className="sp-display sp-hero-title">Welcome back, {profile.display_name}</div>
          <p className="sp-hero-sub">Week {currentWeek} is underway — outwit, outplay, outlast.</p>
          <Link href="/pick" className="sp-btn sp-btn-primary" style={{ marginTop: 14 }}>
            🔥 Make this week&apos;s pick
          </Link>
        </div>

        {seasonState?.commissioner_message && (
          <div className="sp-card">
            <div className="sp-section-title">📣 From the Commissioner</div>
            <p className="sp-section-sub" style={{ whiteSpace: "pre-wrap" }}>
              {seasonState.commissioner_message}
            </p>
          </div>
        )}

        <RulesCard />

        <AskQuestionForm />
      </main>
    </div>
  );
}
