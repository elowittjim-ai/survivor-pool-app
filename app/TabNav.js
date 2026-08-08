import Link from "next/link";

export default function TabNav({ active, showResults }) {
  return (
    <nav className="sp-tabs">
      <Link href="/" className={"sp-tab" + (active === "home" ? " sp-tab-active" : "")}>
        🏝️ Home
      </Link>
      <Link href="/pick" className={"sp-tab" + (active === "pick" ? " sp-tab-active" : "")}>
        🔥 Pick
      </Link>
      <Link href="/grid" className={"sp-tab" + (active === "grid" ? " sp-tab-active" : "")}>
        🗂️ Season grid
      </Link>
      <Link href="/chat" className={"sp-tab" + (active === "chat" ? " sp-tab-active" : "")}>
        💬 Chat
      </Link>
      {showResults && (
        <Link href="/results" className={"sp-tab" + (active === "results" ? " sp-tab-active" : "")}>
          🏆 Results
        </Link>
      )}
    </nav>
  );
}
