"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(prevState, formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email or password didn't match. Try again." };
  }

  redirect("/");
}

export async function signup(prevState, formData) {
  const displayName = String(formData.get("displayName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!displayName) {
    return { error: "Enter the name you want the group to see." };
  }
  if (!email || !password) {
    return { error: "Enter an email and password." };
  }
  if (password.length < 8) {
    return { error: "Password needs to be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      success:
        "Account created — check your email to confirm it, then come back and log in.",
    };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
