const RULES_SECTIONS = [
  {
    title: "The Object of the Game",
    body: "Survive each week by correctly predicting who will NOT leave the game during upcoming episode — whether by tribal council vote, medical evacuation, quitting, or being asked to leave the show.",
  },
  {
    title: "Making Your Pick",
    body: "Submit your pick in the app by midnight Sunday (PST) for who you think survives the upcoming episode. If you don't submit in time, you'll automatically be assigned the next player in alphabetical order who's still available to you.",
  },
  {
    title: "Elimination",
    body: "If the player you picked gets voted out (or otherwise leaves the game) that week, you're out of the pool.",
  },
  {
    title: "The One-Pick Rule",
    body: "You can only pick each player once per \"board.\" For example, if you pick someone in week 1 and they survive, you can't pick them again in a later week — you'll need to choose someone you haven't picked yet.",
  },
  {
    title: "Clearing the Board",
    body: "Once you've picked every remaining player at least once, the board \"clears\" — you're free to start over and pick from anyone again, including players you've already picked. This usually happens for most people by season's end, though a few players each season make it all the way through without ever clearing the board.",
  },
  {
    title: "The Finale Pick",
    body: "On the final episode, you make one last pick: who you think will WIN Survivor. The one-pick rule still applies. If you've cleared the board since your last time picking them, you're free to pick anyone for the win. If you haven't cleared the board, your winner pick is limited to players you haven't picked yet.",
  },
  {
    title: "How You Win the Pool",
    body: "You win by doing two things: surviving every week, and correctly picking the eventual winner on the finale. If nobody still alive picks the winner, the pot rolls over to next season — making for a bigger prize — and the last player(s) standing (who didn't pick the winner) get a free entry into next season's pool.",
  },
  {
    title: "Recap Weeks",
    body: "Some weeks Survivor airs a recap episode or a show with no tribal council — nobody goes home. When that happens, just submit your pick as usual for the following week.",
  },
];

export default function RulesCard() {
  return (
    <div className="sp-card">
      <div className="sp-section-title">📜 Rules</div>
      {RULES_SECTIONS.map((s) => (
        <div key={s.title} style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: "var(--sp-text)", margin: "0 0 2px" }}>
            {s.title}
          </p>
          <p className="sp-section-sub" style={{ margin: 0 }}>{s.body}</p>
        </div>
      ))}
      <p className="sp-notice" style={{ marginTop: 4 }}>
        Happy Surviving! Watch Wednesday, root hard, and don&apos;t get voted off.
      </p>
    </div>
  );
}
