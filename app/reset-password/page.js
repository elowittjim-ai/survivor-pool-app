import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only reachable with a valid session, which the /auth/confirm handler
  // just established from the emailed reset link.
  if (!user) redirect("/login");

  return <ResetPasswordForm />;
}
