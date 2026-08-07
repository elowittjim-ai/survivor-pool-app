import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// @supabase/ssr defaults to the PKCE flow, so Supabase's own /auth/v1/verify
// endpoint redirects here with a `code` query param (not a token_hash, and
// not a URL fragment) — exchange it for a real session server-side.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=reset-link-invalid");
}
