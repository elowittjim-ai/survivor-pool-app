"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}

export async function approvePlayer(prevState, formData) {
  const profileId = String(formData.get("profileId") || "");
  if (!profileId) return { error: "Missing player." };

  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Admins only." };

  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", profileId);

  if (error) return { error: "Couldn't approve that player." };

  revalidatePath("/admin");
  return { success: true };
}

export async function promoteToAdmin(prevState, formData) {
  const profileId = String(formData.get("profileId") || "");
  if (!profileId) return { error: "Missing player." };

  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Admins only." };

  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", profileId);

  if (error) return { error: "Couldn't make them a co-admin." };

  revalidatePath("/admin");
  return { success: true };
}

export async function revokeAccess(prevState, formData) {
  const profileId = String(formData.get("profileId") || "");
  if (!profileId) return { error: "Missing player." };

  const supabase = await createClient();
  const user = await requireAdmin(supabase);
  if (!user) return { error: "Admins only." };
  if (profileId === user.id) return { error: "You can't revoke your own access." };

  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: false, is_admin: false })
    .eq("id", profileId);

  if (error) return { error: "Couldn't revoke access." };

  revalidatePath("/admin");
  return { success: true };
}

export async function bulkApprove(prevState, formData) {
  const raw = String(formData.get("emails") || "");
  const emails = [...new Set(
    raw
      .split(/[\n,]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  )];
  if (emails.length === 0) return { error: "Paste at least one email." };

  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Admins only." };

  const { data: matches, error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .in("email", emails)
    .eq("is_approved", false)
    .select("email");

  if (error) return { error: "Couldn't bulk-approve — try again." };

  const matchedEmails = new Set((matches || []).map((m) => m.email));
  const notFound = emails.filter((e) => !matchedEmails.has(e));

  revalidatePath("/admin");
  return {
    success: true,
    summary: `Approved ${matches?.length || 0} of ${emails.length}.` +
      (notFound.length > 0 ? ` No pending signup yet for: ${notFound.join(", ")}.` : ""),
  };
}

export async function toggleMute(prevState, formData) {
  const profileId = String(formData.get("profileId") || "");
  const mute = formData.get("mute") === "true";
  if (!profileId) return { error: "Missing player." };

  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Admins only." };

  const { error } = await supabase
    .from("profiles")
    .update({ chat_muted: mute })
    .eq("id", profileId);

  if (error) return { error: "Couldn't update mute status." };

  revalidatePath("/admin");
  return { success: true };
}

export async function addContestant(prevState, formData) {
  const name = String(formData.get("name") || "").trim();
  const tribe = String(formData.get("tribe") || "").trim();
  if (!name) return { error: "Enter a contestant name." };

  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Admins only." };

  const { error } = await supabase
    .from("contestants")
    .insert({ name, tribe: tribe || null });

  if (error) return { error: "Couldn't add that contestant." };

  revalidatePath("/admin");
  return { success: true };
}

export async function closeWeek(prevState, formData) {
  const supabase = await createClient();
  const user = await requireAdmin(supabase);
  if (!user) return { error: "Admins only." };

  const eliminatedIds = formData.getAll("eliminate").map(String);

  const { data: seasonState } = await supabase
    .from("season_state")
    .select("current_week")
    .eq("id", 1)
    .single();
  const week = seasonState?.current_week ?? 1;

  if (eliminatedIds.length > 0) {
    const { error: elimError } = await supabase
      .from("contestants")
      .update({ status: "eliminated", eliminated_week: week })
      .in("id", eliminatedIds);
    if (elimError) return { error: "Couldn't record eliminations." };
  }

  // Pool for auto-pick: anyone still active, plus anyone just eliminated this week
  // (mirrors the validated prototype so a straggler's auto-pick can still match
  // this week's boot and count as correctly "out").
  const { data: pool } = await supabase
    .from("contestants")
    .select("id, name")
    .or(`status.eq.active,eliminated_week.eq.${week}`)
    .order("name");

  const { data: approvedPlayers } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_approved", true);

  const { data: existingPicks } = await supabase
    .from("picks")
    .select("player_id, week, contestant_id")
    .eq("week", week);
  const pickedThisWeek = new Set((existingPicks || []).map((p) => p.player_id));

  const { data: allPicks } = await supabase
    .from("picks")
    .select("player_id, week, contestant_id, contestants(status, eliminated_week)");

  // A player who was already knocked out in an earlier week shouldn't get a
  // fresh auto-pick here — once you're out, you're out. Only picks from
  // weeks before this one count toward that (this week's own elimination,
  // just recorded above, doesn't retroactively disqualify anyone from it).
  const usedByPlayer = new Map();
  const alreadyOutPlayers = new Set();
  for (const p of allPicks || []) {
    if (!usedByPlayer.has(p.player_id)) usedByPlayer.set(p.player_id, new Set());
    usedByPlayer.get(p.player_id).add(p.contestant_id);
    const c = p.contestants;
    if (p.week < week && c && c.status === "eliminated" && c.eliminated_week === p.week) {
      alreadyOutPlayers.add(p.player_id);
    }
  }

  const stragglerRows = [];
  for (const player of approvedPlayers || []) {
    if (pickedThisWeek.has(player.id) || alreadyOutPlayers.has(player.id)) continue;
    const used = usedByPlayer.get(player.id) || new Set();
    let eligible = (pool || []).filter((c) => !used.has(c.id));
    if (eligible.length === 0 && (pool || []).length > 0) eligible = pool;
    if (eligible.length === 0) continue;
    const autoPick = [...eligible].sort((a, b) => a.name.localeCompare(b.name))[0];
    stragglerRows.push({ player_id: player.id, week, contestant_id: autoPick.id });
  }

  if (stragglerRows.length > 0) {
    const { error: autoPickError } = await supabase
      .from("picks")
      .upsert(stragglerRows, { onConflict: "player_id,week" });
    if (autoPickError) return { error: "Couldn't auto-pick for stragglers." };
  }

  const { error: advanceError } = await supabase
    .from("season_state")
    .update({ current_week: week + 1 })
    .eq("id", 1);
  if (advanceError) return { error: "Couldn't advance the week." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

async function logCorrection(supabase, adminId, description) {
  await supabase.from("corrections").insert({ admin_id: adminId, description });
}

export async function fixPick(prevState, formData) {
  const playerId = String(formData.get("playerId") || "");
  const week = Number(formData.get("week"));
  const contestantId = String(formData.get("contestantId") || "");
  if (!playerId || !week || !contestantId) return { error: "Fill in player, week, and contestant." };

  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return { error: "Admins only." };

  const [{ data: player }, { data: newContestant }, { data: existingPick }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", playerId).single(),
    supabase.from("contestants").select("name").eq("id", contestantId).single(),
    supabase.from("picks").select("contestant_id, contestants(name)").eq("player_id", playerId).eq("week", week).maybeSingle(),
  ]);

  const { error } = await supabase
    .from("picks")
    .upsert({ player_id: playerId, week, contestant_id: contestantId }, { onConflict: "player_id,week" });

  if (error) return { error: "Couldn't save that correction." };

  const from = existingPick?.contestants?.name;
  const playerName = player?.display_name || "Unknown player";
  const newName = newContestant?.name || "Unknown contestant";
  await logCorrection(
    supabase,
    admin.id,
    from && from !== newName
      ? `Changed ${playerName}'s week ${week} pick from ${from} to ${newName}.`
      : `Set ${playerName}'s week ${week} pick to ${newName}.`
  );

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/grid");
  revalidatePath("/results");
  return { success: true };
}

export async function fixContestantStatus(prevState, formData) {
  const contestantId = String(formData.get("contestantId") || "");
  const action = String(formData.get("statusAction") || "");
  const week = Number(formData.get("week"));
  if (!contestantId || (action !== "eliminate" && action !== "revert")) {
    return { error: "Missing contestant or action." };
  }
  if (action === "eliminate" && !week) return { error: "Enter which week they were eliminated." };

  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return { error: "Admins only." };

  const { data: contestant } = await supabase
    .from("contestants")
    .select("name, status, eliminated_week")
    .eq("id", contestantId)
    .single();
  const name = contestant?.name || "Unknown contestant";

  const update =
    action === "eliminate"
      ? { status: "eliminated", eliminated_week: week }
      : { status: "active", eliminated_week: null };

  const { error } = await supabase.from("contestants").update(update).eq("id", contestantId);
  if (error) return { error: "Couldn't update that contestant." };

  await logCorrection(
    supabase,
    admin.id,
    action === "eliminate"
      ? `Marked ${name} eliminated in week ${week}${contestant?.status === "eliminated" ? ` (was week ${contestant.eliminated_week})` : ""}.`
      : `Reverted ${name} to active (was eliminated week ${contestant?.eliminated_week}).`
  );

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/grid");
  revalidatePath("/results");
  return { success: true };
}

export async function updateCommissionerMessage(prevState, formData) {
  const message = String(formData.get("message") || "").trim();

  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Admins only." };

  const { error } = await supabase
    .from("season_state")
    .update({ commissioner_message: message || null })
    .eq("id", 1);

  if (error) return { error: "Couldn't save that message." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function declareWinner(prevState, formData) {
  const contestantId = String(formData.get("contestantId") || "");
  if (!contestantId) return { error: "Pick a winner." };

  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return { error: "Admins only." };

  const { error } = await supabase
    .from("season_state")
    .update({ season_winner_contestant_id: contestantId, is_complete: true })
    .eq("id", 1);

  if (error) return { error: "Couldn't declare the winner." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}
