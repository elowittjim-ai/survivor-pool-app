import { redirect } from "next/navigation";

// Chat now lives on the Home screen — keep old /chat links working.
export default function ChatPage() {
  redirect("/");
}
