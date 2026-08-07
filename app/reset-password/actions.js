"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(prevState, formData) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    return { error: "Password needs to be at least 8 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "That reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Couldn't update your password. Try again." };
  }

  redirect("/");
}
