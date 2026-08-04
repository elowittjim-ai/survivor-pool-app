import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";
import { signOut } from "./actions";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_approved, display_name")
      .eq("id", user.id)
      .single();

    if (profile?.is_approved) {
      redirect("/");
    }

    return (
      <div className="sp-auth">
        <h1 className="sp-display sp-auth-title">SURVIVOR POOL</h1>
        <div className="sp-card" style={{ marginTop: 20 }}>
          <div className="sp-section-title">Waiting on approval</div>
          <p className="sp-section-sub">
            Hey {profile?.display_name || user.email} — your account is created. The
            commissioner unlocks the pool once they&apos;ve confirmed your $25 Venmo
            buy-in. Check back soon.
          </p>
          <form action={signOut}>
            <button type="submit" className="sp-btn sp-btn-secondary sp-btn-block">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}
