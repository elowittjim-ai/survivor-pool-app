"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitPick(prevState, formData) {
  const contestantId = String(formData.get("contestantId") || "");
  if (!contestantId) {
    return { error: "Pick a contestant first." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to be logged in." };
  }

  const { data: week, error: weekError } = await supabase.rpc(
    "current_season_week"
  );
  if (weekError || !week) {
    return { error: "Couldn't find the current week. Try again." };
  }

  // RLS also enforces player_id = auth.uid(), is_approved, and week = current
  // week — this upsert can only ever affect the caller's own current pick.
  const { error } = await supabase
    .from("picks")
    .upsert(
      { player_id: user.id, week, contestant_id: contestantId },
      { onConflict: "player_id,week" }
    );

  if (error) {
    return { error: "Couldn't save your pick — it may be locked already." };
  }

  revalidatePath("/");
  return { success: true };
}
