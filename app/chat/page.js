import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import TabNav from "../TabNav";
import ChatView from "./ChatView";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_approved, is_admin, chat_muted")
    .eq("id", user.id)
    .single();
  if (!profile?.is_approved) redirect("/login");

  const { data: seasonState } = await supabase
    .from("season_state")
    .select("current_week, is_complete")
    .eq("id", 1)
    .single();

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, author_id, content, flagged, deleted, created_at, profiles(display_name, is_admin)")
    .order("created_at");

  return (
    <div>
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

      <TabNav active="chat" showResults={!!seasonState?.is_complete} />

      <main className="sp-main">
        <ChatView
          messages={messages || []}
          currentUserId={user.id}
          isAdmin={!!profile.is_admin}
          isMuted={!!profile.chat_muted}
        />
      </main>
    </div>
  );
}
