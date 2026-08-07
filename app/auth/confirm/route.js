import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Where Supabase sends the user after they click a password-reset (or other
// OTP-based) email link. Exchanges the token for a real session, then hands
// off to whatever page actually needs that session (e.g. /reset-password).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=reset-link-invalid");
}
