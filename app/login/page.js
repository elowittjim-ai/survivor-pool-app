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

    const { data: seasonState } = await supabase
      .from("season_state")
      .select("buy_in_amount")
      .eq("id", 1)
      .single();
    const buyIn = seasonState?.buy_in_amount ?? 25;

    const venmoUrl = `https://venmo.com/u/Jim-Elowitt?txn=pay&amount=${buyIn}&note=${encodeURIComponent("Survivor Pool buy-in")}`;

    return (
      <div className="sp-auth">
        <h1 className="sp-display sp-auth-title">SURVIVOR POOL</h1>
        <div className="sp-card" style={{ marginTop: 20 }}>
          <div className="sp-section-title">Waiting on approval</div>
          <p className="sp-section-sub">
            {`Hey ${profile?.display_name || user.email} — your account is created. Send your $${buyIn} buy-in below, and the commissioner unlocks the pool once it's in.`}
          </p>
          <a
            href={venmoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sp-btn sp-btn-primary sp-btn-block"
            style={{ marginBottom: 10, textDecoration: "none" }}
          >
            💸 Pay ${buyIn} on Venmo
          </a>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--sp-text)",
              background: "var(--sp-gold-soft)",
              border: "1px solid var(--sp-gold)",
              borderRadius: 8,
              padding: "10px 12px",
              margin: "10px 0 0",
              lineHeight: 1.4,
            }}
          >
            When you pay, put your game name and email in the Venmo note — I need an
            individual email from every player, even if someone else is covering your
            buy-in.
          </p>
          <form action={signOut} style={{ marginTop: 14 }}>
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
