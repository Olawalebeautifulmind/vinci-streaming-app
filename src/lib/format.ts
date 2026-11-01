export const cowries = (n: number | null | undefined) => `${(n ?? 0).toLocaleString()} 🐚`;

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function timeLeft(iso: string | null | undefined) {
  if (!iso) return "";
  const s = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
  if (s <= 0) return "ended";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export const memberId = (no: number | null | undefined) =>
  no ? `VNC-${String(no).padStart(6, "0")}` : "VNC-…";
export const artistId = (no: number | null | undefined, cc: string | null | undefined) =>
  no ? `ART-${cc ?? "XX"}-${String(no).padStart(5, "0")}` : "";

const FRIENDLY: Record<string, string> = {
  insufficient_cowries: "Not enough Cowries. Claim your daily Cowries or try a smaller amount.",
  not_authenticated: "Please sign in first.",
  stream_not_live: "This stream isn't live.",
  tips_disabled: "The creator turned gifts off for this stream.",
  cannot_gift_self: "You can't gift your own stream.",
  not_for_sale: "That piece is no longer for sale.",
  cannot_buy_own_work: "You can't buy your own work.",
  shipping_required: "Add a shipping address for physical pieces.",
  auction_not_open: "This auction has closed.",
  auction_ended: "This auction has ended.",
  cannot_bid_own_work: "You can't bid on your own work.",
  already_claimed: "You've already claimed today's Cowries. Come back tomorrow.",
  already_voted: "You've already voted in this battle.",
  contestants_cannot_vote: "Contestants can't vote in their own battle.",
  battle_not_live: "This battle isn't live.",
  opponent_not_found: "No creator with that handle.",
  cannot_battle_self: "You can't battle yourself.",
  creators_only: "Only creators can do that. Turn on your studio in your profile.",
  gallery_not_open: "This gallery isn't open right now.",
  craft_not_enabled: "That craft isn't open yet. Bead Making and Pottery are live.",
  choose_a_craft: "Choose at least one craft.",
  cannot_commission_self: "You can't send a creation bid to yourself.",
  min_50: "Creation bids start at 50 Cowries.",
  already_resolved: "Already handled.",
  not_allowed: "You can't do that.",
};

export function friendlyError(e: unknown): string {
  const msg =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e && "message" in e
        ? String((e as { message: unknown }).message)
        : String(e);
  const low = msg.match(/^bid_too_low:(\d+)/);
  if (low) return `Bid at least ${Number(low[1]).toLocaleString()} Cowries.`;
  if (msg.includes("duplicate key") && msg.includes("handle")) return "That handle is taken.";
  if (msg.includes("profiles_handle_format"))
    return "Handles are 3 to 30 lowercase letters, numbers or underscores.";
  return FRIENDLY[msg] ?? msg;
}
