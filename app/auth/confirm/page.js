"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Supabase's default (non-custom-SMTP) email templates link to Supabase's own
// /auth/v1/verify endpoint, which verifies the token server-side and redirects
// here with the session in the URL fragment (#access_token=...&refresh_token=...)
// rather than as query params — fragments never reach a server route handler,
// so this has to run client-side to read them.
export default function AuthConfirmPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    const next = searchParams.get("next") || "/";
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");

    if (!access_token || !refresh_token) {
      setFailed(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setFailed(true);
      } else {
        router.replace(next);
      }
    });
  }, [router]);

  return (
    <div className="sp-auth">
      <h1 className="sp-display sp-auth-title">SURVIVOR POOL</h1>
      <p className="sp-auth-sub">
        {failed ? "That link has expired or was already used." : "Signing you in…"}
      </p>
      {failed && (
        <button
          type="button"
          className="sp-btn sp-btn-primary sp-btn-block"
          style={{ marginTop: 14 }}
          onClick={() => router.replace("/login")}
        >
          Back to log in
        </button>
      )}
    </div>
  );
}
