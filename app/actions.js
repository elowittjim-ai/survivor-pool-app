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

  // The pick screen already hides itself once a player is eliminated, but
  // that's UI, not a security boundary — this action is a direct POST target
  // regardless of what's rendered, so re-check here too.
  const { data: pastPicks } = await supabase
    .from("picks")
    .select("week, contestants(status, eliminated_week)")
    .eq("player_id", user.id)
    .lt("week", week);
  const alreadyOut = (pastPicks || []).some(
    (p) => p.contestants?.status === "eliminated" && p.contestants.eliminated_week === p.week
  );
  if (alreadyOut) {
    return { error: "You've been eliminated and can't submit picks anymore." };
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

  revalidatePath("/pick");
  revalidatePath("/");
  return { success: true };
}
