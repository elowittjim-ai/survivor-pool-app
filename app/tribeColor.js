// Deterministic color per tribe name — no admin config needed, and it keeps
// working automatically if a tribe gets renamed mid-season.
const TRIBE_COLORS = ["#d9a441", "#4c8577", "#c1502e", "#7a6ff0", "#3f9bd1", "#d15fa8", "#5fbf76"];

export function tribeColor(tribe) {
  if (!tribe) return "var(--sp-text-muted)";
  let hash = 0;
  for (let i = 0; i < tribe.length; i++) {
    hash = (hash * 31 + tribe.charCodeAt(i)) | 0;
  }
  return TRIBE_COLORS[Math.abs(hash) % TRIBE_COLORS.length];
}
