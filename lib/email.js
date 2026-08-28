// Sends via Resend's HTTP API directly (no SDK dependency). Silently no-ops
// without RESEND_API_KEY set so local dev and any pre-setup deploys don't
// break — approval itself must never fail because the email did.
const FROM_ADDRESS = process.env.RESEND_FROM || "Survivor Pool <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://survivor-pool-app-cbta.vercel.app";

export async function sendApprovalEmail({ to, displayName }) {
  if (!process.env.RESEND_API_KEY || !to) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to,
        subject: "You're in — Survivor Pool access approved",
        text: `Hey ${displayName || "there"},\n\nYour buy-in's confirmed and you're approved. Head to the app to make your pick:\n${SITE_URL}`,
      }),
    });
    if (!res.ok) {
      console.error("Approval email failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Approval email failed:", err);
  }
}
