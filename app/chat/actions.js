"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Starter keyword list for the "flag for admin review" scan described in the
// PRD (5.13) — deliberately small and easy to edit later. Matching only flags
// a message for the admin to look at; it's never auto-deleted or auto-hidden.
const FLAG_WORDS = ["fuck", "shit", "bitch", "asshole", "cunt", "nigger", "faggot"];

function looksFlaggable(content) {
  const lower = content.toLowerCase();
  return FLAG_WORDS.some((word) => lower.includes(word));
}

export async function postMessage(prevState, formData) {
  const content = String(formData.get("content") || "").trim();
  if (!content) return { error: "Type a message first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // RLS also enforces author_id = auth.uid(), is_approved, and not muted —
  // this insert can only ever succeed as the caller's own, unmuted post.
  const { error } = await supabase.from("chat_messages").insert({
    author_id: user.id,
    content,
    flagged: looksFlaggable(content),
  });

  if (error) return { error: "Couldn't send — you may be muted." };

  revalidatePath("/chat");
  return { success: true };
}

export async function deleteMessage(prevState, formData) {
  const messageId = String(formData.get("messageId") || "");
  if (!messageId) return { error: "Missing message." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_messages")
    .update({ deleted: true })
    .eq("id", messageId);

  if (error) return { error: "Couldn't delete — admins only." };

  revalidatePath("/chat");
  return { success: true };
}
