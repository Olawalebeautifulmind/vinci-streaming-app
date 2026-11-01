import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getStream, getCategory, liveChatSeed, streams, type Stream } from "../lib/streams";
import { LivePill, VerifiedBadge, StreamCard } from "../components/StreamCard";

export const Route = createFileRoute("/stream/$id")({
  component: StreamView,
  loader: ({ params }) => {
    const stream = getStream(params.id);
    if (!stream) throw notFound();
    return { stream };
  },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.stream.title ?? "Craft stream"} — Vinci` },
    { name: "description", content: loaderData?.stream.description ?? "Explore a sample Vinci craft stream." },
    { property: "og:title", content: `${loaderData?.stream.title ?? "Craft stream"} — Vinci` },
    { property: "og:description", content: loaderData?.stream.description ?? "Explore a sample Vinci craft stream." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

type CamId = "overhead" | "face" | "detail";
type Cam = { id: CamId; label: string };

type MarketItem = {
  id: string;
  title: string;
  state: "Completed" | "In progress";
  priceCowries: number;
  edition: string;
  delivery: "Physical shipping" | "Digital certificate" | "Physical + digital cert";
  shipsFrom?: string;
  leadTime?: string;
};

type NextWorkOption = {
  id: string;
  label: string;
  desc: string;
  bidCowries: number;
  bidder?: string;
};

type Competition = {
  title: string;
  prompt: string;
  endsInMin: number;
  prizeCowries: number;
  entries: { id: string; user: string; title: string; votes: number; sponsored?: boolean }[];
};

function deriveExtras(stream: Stream) {
  const cat = getCategory(stream.category);
  const materials: Record<string, string[]> = {
    ceramics: ["Stoneware clay", "Ash glaze", "Kiln cone 10"],
    painting: ["Linen canvas", "Cold-pressed oil", "Sable brushes"],
    sculpture: ["Carrara marble", "Carbide chisels", "Diamond rasps"],
    "bead-making": ["Borosilicate glass", "Mandrel", "Oxy-propane torch"],
    textile: ["Hand-dyed silk", "Gold thread", "Bamboo hoop"],
    tailoring: ["Worsted wool", "Horsehair canvas", "Silk thread"],
    furniture: ["White oak", "Hand planes", "Hide glue"],
    culinary: ["Heritage flour", "Cultured butter", "Sea salt"],
  };
  const diffByCat: Record<string, "Beginner-friendly" | "Intermediate" | "Advanced" | "Master class"> = {
    ceramics: "Intermediate",
    painting: "Advanced",
    sculpture: "Master class",
    "bead-making": "Intermediate",
    textile: "Advanced",
    tailoring: "Master class",
    furniture: "Advanced",
    culinary: "Advanced",
  };
  const region = stream.creator.location;
  const market: MarketItem[] = [
    { id: "m1", title: `${stream.craft} study no.1`, state: "Completed", priceCowries: Math.round(stream.currentBidCowries * 0.4 + 800), edition: "1/1", delivery: "Physical + digital cert", shipsFrom: region, leadTime: "Ships in 5–7 days" },
    { id: "m2", title: `${stream.craft} study no.2`, state: "In progress", priceCowries: Math.round(stream.currentBidCowries * 0.65 + 500), edition: "1/1", delivery: "Physical + digital cert", shipsFrom: region, leadTime: "Ships at end of stream" },
    { id: "m3", title: `Studio print — ${stream.craft}`, state: "Completed", priceCowries: 400, edition: "12/25", delivery: "Digital certificate", leadTime: "Instant delivery" },
  ];
  const next: NextWorkOption[] = [
    { id: "n1", label: `Miniature ${stream.craft.toLowerCase()} commission`, desc: "Personalised, signed, shipped worldwide.", bidCowries: 1500, bidder: "ophelia" },
    { id: "n2", label: `Diptych in ${cat?.name.toLowerCase() ?? "studio"} style`, desc: "Two-part work, completed across two sessions.", bidCowries: 3200 },
    { id: "n3", label: "Collector's choice — your prompt", desc: "Top bid sets the brief. Streamer can decline.", bidCowries: 900, bidder: "studio_vault" },
  ];
  const minBid = 500;
  const competition: Competition = {
    title: `${cat?.name ?? "Open"} 90-min challenge`,
    prompt: `Interpret tonight's theme: "After the rain" using ${cat?.disciplines[0].toLowerCase() ?? "the craft"} only.`,
    endsInMin: 64,
    prizeCowries: 5000,
    entries: [
      { id: "e1", user: "rae", title: "Soft puddles", votes: 184 },
      { id: "e2", user: "0x4a…91d", title: "Wet stone study", votes: 142, sponsored: true },
      { id: "e3", user: "marcus", title: "Storm window", votes: 97 },
    ],
  };
  return { materials: materials[stream.category] ?? [], difficulty: diffByCat[stream.category] ?? "Intermediate", region, market, next, minBid, competition };
}

function StreamView() {
  const { stream } = Route.useLoaderData();
  const extras = useMemo(() => deriveExtras(stream), [stream]);

  const [chat, setChat] = useState(liveChatSeed);
  const [msg, setMsg] = useState("");
  const [bid, setBid] = useState(stream.currentBidCowries);
  const [topBidder, setTopBidder] = useState(stream.topBidder ?? "—");
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const cams: Cam[] = [
    { id: "overhead", label: "Overhead" },
    { id: "face", label: "Face cam" },
    { id: "detail", label: "Detail" },
  ];
  const [activeCam, setActiveCam] = useState<CamId>("overhead");

  const [tab, setTab] = useState<"market" | "auction" | "next" | "comp">("auction");

  // marketplace state
  const [marketSold, setMarketSold] = useState<Record<string, boolean>>({});

  // next-work bidding state
  const [nextBids, setNextBids] = useState(() =>
    Object.fromEntries(extras.next.map(n => [n.id, { bid: n.bidCowries, bidder: n.bidder ?? "—" }])) as Record<string, { bid: number; bidder: string }>
  );

  // competition voting
  const [votes, setVotes] = useState(() => Object.fromEntries(extras.competition.entries.map(e => [e.id, e.votes])) as Record<string, number>);
  const [voted, setVoted] = useState<string | null>(null);

  // Cowrie wallet (platform currency, 1 Cowrie ≈ $0.10)
  const [cowries, setCowries] = useState(1240);
  const [showTopUp, setShowTopUp] = useState(false);

  // Creation Bids (viewer-proposed commissions in Cowries)
  type CreationBid = { id: string; user: string; prompt: string; amount: number; status: "pending" | "accepted" | "declined" };
  const [creationBids, setCreationBids] = useState<CreationBid[]>([
    { id: "cb1", user: "ophelia", prompt: "Make a red ceramic bowl with gold rim", amount: 500, status: "pending" },
    { id: "cb2", user: "0x4a…91d", prompt: "Tiny vase, cobalt glaze, single bloom", amount: 320, status: "pending" },
    { id: "cb3", user: "marcus", prompt: "Wabi-sabi tea cup, ash glaze", amount: 780, status: "accepted" },
  ]);
  const [bidPrompt, setBidPrompt] = useState("");
  const [bidAmount, setBidAmount] = useState(250);

  // floating emoji reactions
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);

  useEffect(() => {
    const i = setInterval(() => {
      const seed = liveChatSeed[Math.floor(Math.random() * liveChatSeed.length)];
      setChat(c => [...c.slice(-40), seed]);
    }, 4500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: "smooth" });
  }, [chat]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setChat(c => [...c, { user: "you", msg: msg.trim(), color: "#f0d78c" }]);
    setMsg("");
  };

  const placeBid = () => {
    const next = bid + 500;
    setBid(next);
    setTopBidder("you");
    setChat(c => [...c, { user: "you", msg: `Placed bid ${next.toLocaleString()} 🐚 on current work`, color: "#c9a84c" }]);
  };

  const gift = (amt: number, label: string) => {
    if (cowries < amt) { setShowTopUp(true); return; }
    setCowries(c => c - amt);
    setChat(c => [...c, { user: "you", msg: `Gifted ${label} · ${amt} Cowries 🐚`, color: "#f0d78c" }]);
  };

  const sendReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = 10 + Math.random() * 80;
    setReactions(r => [...r, { id, emoji, x }]);
    setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 2400);
  };

  // Certificate-of-authenticity modal (post-purchase)
  type Certificate = {
    item: MarketItem;
    tokenId: string;
    txHash: string;
    buyerWallet: string;
    artistId: string;
    issuedAt: string;
  };
  const [cert, setCert] = useState<Certificate | null>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const buyerWallet = "0xV1nc…you";

  const buyMarket = (item: MarketItem) => {
    setMarketSold(s => ({ ...s, [item.id]: true }));
    const tokenId = `#${(Math.floor(Math.random() * 9000) + 1000)}`;
    const txHash = `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`;
    const artistId = `ART-${stream.creator.location.split(",").pop()?.trim().slice(0, 2).toUpperCase() ?? "XX"}-${String(Math.floor(Math.random() * 999)).padStart(5, "0")}`;
    setCert({
      item, tokenId, txHash, buyerWallet, artistId,
      issuedAt: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
    });
    setChat(c => [...c, { user: "you", msg: `Bought "${item.title}" for ${item.priceCowries.toLocaleString()} 🐚 · cert ${tokenId}`, color: "#c9a84c" }]);
  };

  const bidNext = (id: string) => {
    setNextBids(prev => {
      const cur = prev[id];
      const next = cur.bid + 500;
      setChat(c => [...c, { user: "you", msg: `Bid ${next.toLocaleString()} 🐚 for next work`, color: "#f0d78c" }]);
      return { ...prev, [id]: { bid: next, bidder: "you" } };
    });
  };

  const submitCreationBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidPrompt.trim() || bidAmount < 50) return;
    if (cowries < bidAmount) { setShowTopUp(true); return; }
    setCowries(c => c - bidAmount);
    const id = `cb${Date.now()}`;
    setCreationBids(b => [{ id, user: "you", prompt: bidPrompt.trim(), amount: bidAmount, status: "pending" }, ...b]);
    setChat(c => [...c, { user: "you", msg: `Creation bid: "${bidPrompt.trim()}" — ${bidAmount} Cowries 🐚`, color: "#c9a84c" }]);
    setBidPrompt("");
  };

  const resolveCreationBid = (id: string, accept: boolean) => {
    setCreationBids(b => b.map(x => {
      if (x.id !== id) return x;
      // refund declined bids
      if (!accept && x.user === "you") setCowries(c => c + x.amount);
      return { ...x, status: accept ? "accepted" : "declined" };
    }));
  };
  const castVote = (id: string) => {
    if (voted) return;
    setVoted(id);
    setVotes(v => ({ ...v, [id]: v[id] + 1 }));
  };

  const more = streams.filter(s => s.id !== stream.id).slice(0, 3);
  const cat = getCategory(stream.category);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
      <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back to live</Link>

      <div className="mt-4 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* MAIN */}
        <div>
          {/* video */}
          <div
            className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/80"
            style={{ background: `radial-gradient(120% 80% at 30% 20%, ${stream.thumbAccent}44 0%, transparent 60%), ${stream.thumbColor}` }}
          >
            <div className="absolute inset-0 noise" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <span className="font-display text-6xl md:text-8xl" style={{ color: stream.thumbAccent }}>{stream.craft}</span>
                <div className="mt-3 text-xs text-white/70 tracking-widest uppercase">
                  {cams.find(c => c.id === activeCam)?.label} cam · simulated feed
                </div>
              </div>
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <LivePill />
              <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[11px] text-white/90">{stream.viewers.toLocaleString()} watching</span>
              <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[11px] text-white/90">Started {stream.startedMinutesAgo}m ago</span>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button className="h-8 rounded-sm bg-black/60 px-3 text-xs text-white hover:bg-black/80">HD</button>
              <button className="h-8 rounded-sm bg-black/60 px-3 text-xs text-white hover:bg-black/80">Theatre</button>
            </div>

            {/* picture-in-picture cams */}
            <div className="absolute bottom-3 left-3 flex items-end gap-2">
              {cams.filter(c => c.id !== activeCam).map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCam(c.id)}
                  className="group relative h-16 w-24 overflow-hidden rounded-md border border-white/20 bg-black/40 backdrop-blur hover:border-primary transition"
                  title={`Switch to ${c.label}`}
                  style={{ background: `radial-gradient(120% 80% at 30% 20%, ${stream.thumbAccent}33 0%, transparent 60%), ${stream.thumbColor}` }}
                >
                  <div className="absolute inset-0 noise opacity-50" />
                  <div className="absolute bottom-1 left-1 right-1 text-[9px] uppercase tracking-widest text-white/90">{c.label}</div>
                </button>
              ))}
            </div>

            {/* floating emoji reactions */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {reactions.map(r => (
                <span
                  key={r.id}
                  className="absolute bottom-4 text-2xl animate-[float-up_2.4s_ease-out_forwards]"
                  style={{ left: `${r.x}%` }}
                >
                  {r.emoji}
                </span>
              ))}
            </div>
          </div>

          {/* camera switcher + reactions row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground mr-1">Multi-cam</span>
            {cams.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCam(c.id)}
                className={`h-8 rounded-sm px-3 text-xs transition border ${
                  activeCam === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"
                }`}
              >
                {c.label}
              </button>
            ))}
            <span className="ml-auto text-[11px] uppercase tracking-widest text-muted-foreground">React</span>
            {["❤️","🔥","👏","🎨","🐚","🤯"].map(e => (
              <button
                key={e}
                onClick={() => sendReaction(e)}
                className="h-8 w-8 rounded-sm border border-border text-base hover:border-primary/60 hover:bg-card transition"
                aria-label={`React ${e}`}
              >
                {e}
              </button>
            ))}
          </div>


          {/* meta */}
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link
                to="/creator/$handle"
                params={{ handle: stream.creator.handle }}
                className="h-14 w-14 rounded-full shrink-0 hover:ring-2 hover:ring-primary/60 transition"
                style={{ background: stream.creator.avatar }}
                aria-label={`${stream.creator.name} profile`}
              />
              <div>
                <h1 className="font-display text-2xl md:text-3xl leading-tight">{stream.title}</h1>
                <div className="mt-1 text-sm flex items-center gap-2 flex-wrap">
                  <Link to="/creator/$handle" params={{ handle: stream.creator.handle }} className="font-medium hover:text-primary">
                    {stream.creator.name}
                  </Link>
                  {stream.creator.verified && <VerifiedBadge />}
                  <Link to="/creator/$handle" params={{ handle: stream.creator.handle }} className="text-muted-foreground hover:text-foreground">· @{stream.creator.handle}</Link>
                  <span className="text-muted-foreground">· {stream.creator.location}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="h-10 rounded-md border border-border px-4 text-sm hover:border-primary/60">Follow</button>
              <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-accent">Subscribe</button>
            </div>
          </div>

          {/* stream tagging */}
          <div className="mt-5 rounded-lg border border-border bg-card/40 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <TagBlock label="Craft" value={cat ? `${cat.emoji} ${cat.name}` : stream.craft} />
              <TagBlock label="Difficulty" value={extras.difficulty} />
              <TagBlock label="Region" value={extras.region} />
              <TagBlock label="Started" value={`${stream.startedMinutesAgo}m ago`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground self-center">Materials</span>
              {extras.materials.map(m => (
                <span key={m} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{m}</span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground self-center">Tags</span>
              {stream.tags.map((t: string) => (
                <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">#{t}</span>
              ))}
            </div>
          </div>

          {/* PANEL TABS */}
          <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex border-b border-border text-sm">
              {([
                { id: "auction", label: "Live auction" },
                { id: "market", label: "Marketplace" },
                { id: "next", label: "Bid next work" },
                { id: "comp", label: "Competition" },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3 -mb-px border-b-2 transition ${
                    tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* LIVE AUCTION */}
            {tab === "auction" && (
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-primary">Live auction · Cowries</div>
                    <div className="mt-1 font-display text-3xl">{bid.toLocaleString()} 🐚 <span className="text-base text-muted-foreground font-sans">≈ £{(bid / 10).toFixed(2)}</span></div>
                    <div className="text-xs text-muted-foreground mt-1">Top bidder: <span className="text-foreground">{topBidder}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Closes when stream ends</div>
                    <div className="font-display text-xl">~ 38m</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number" step={50} min={bid + 500} defaultValue={bid + 500}
                      className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
                    />
                    <span className="text-sm text-muted-foreground">🐚</span>
                  </div>
                  <button onClick={placeBid} className="h-11 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent">
                    Place bid
                  </button>
                </div>
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] uppercase tracking-widest text-primary">Cowrie gifting 🐚</div>
                    <div className="text-xs text-muted-foreground">Balance: <span className="text-foreground font-display">{cowries.toLocaleString()}</span> Cowries</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { l: "🐚 Shell", v: 25 },
                      { l: "🌹 Bouquet", v: 100 },
                      { l: "✨ Spark", v: 250 },
                      { l: "🏆 Patron", v: 1000 },
                    ].map(g => (
                      <button key={g.l} onClick={() => gift(g.v, g.l)} className="h-11 rounded-md border border-border text-xs hover:border-primary/60 flex flex-col items-center justify-center">
                        <span>{g.l}</span>
                        <span className="text-muted-foreground text-[10px]">{g.v} Cowries</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* MARKETPLACE */}
            {tab === "market" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-primary">Live art marketplace</div>
                    <div className="text-xs text-muted-foreground mt-1">Buy in real time — mid-stream or at the moment of completion. Every piece ships with a blockchain certificate of authenticity.</div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{extras.market.length} listings</span>
                </div>

                {/* Shipping address (only needed once) */}
                <div className="rounded-md border border-dashed border-border p-3 mb-4 flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Ship to</span>
                  <input
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Address (only for physical items)"
                    className="h-9 flex-1 min-w-[200px] rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
                  />
                  <span className="text-[11px] text-muted-foreground">Wallet · <span className="text-foreground font-mono">{buyerWallet}</span></span>
                </div>

                <ul className="divide-y divide-border">
                  {extras.market.map(item => {
                    const sold = marketSold[item.id];
                    const needsAddress = item.delivery !== "Digital certificate" && !shippingAddress.trim();
                    return (
                      <li key={item.id} className="flex items-start gap-4 py-4">
                        <div
                          className="h-16 w-16 rounded-md shrink-0 relative overflow-hidden"
                          style={{ background: `radial-gradient(120% 80% at 30% 20%, ${stream.thumbAccent}44 0%, transparent 60%), ${stream.thumbColor}` }}
                        >
                          <div className="absolute inset-0 noise" />
                          {item.state === "In progress" && (
                            <span className="absolute bottom-1 left-1 right-1 text-center text-[8px] uppercase tracking-widest text-white/90 bg-black/60 rounded-sm">Live</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.state} · Edition {item.edition}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="rounded-sm border border-primary/40 text-primary px-1.5 py-0.5 uppercase tracking-wider">{item.delivery}</span>
                            {item.shipsFrom && <span className="text-muted-foreground">From {item.shipsFrom}</span>}
                            {item.leadTime && <span className="text-muted-foreground">· {item.leadTime}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display text-primary">{item.priceCowries.toLocaleString()} 🐚</div>
                          <div className="text-[10px] text-muted-foreground">≈ £{(item.priceCowries / 10).toFixed(2)}</div>
                          <button
                            onClick={() => buyMarket(item)}
                            disabled={sold || needsAddress}
                            title={needsAddress ? "Add a shipping address first" : ""}
                            className="mt-1 h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sold ? "Owned ✓" : item.state === "In progress" ? "Buy mid-stream" : "Buy now"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                  Each purchase mints an ERC-721 certificate on Base, binding the work to the streamer's Artist ID and your wallet. Stream footage is embedded as provenance.
                </p>
              </div>
            )}

            {/* NEXT-WORK BIDDING */}
            {tab === "next" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-primary">Bid on what's next</div>
                    <div className="text-xs text-muted-foreground mt-1">Top bid decides the next piece. Streamer minimum bid: {extras.minBid.toLocaleString()} 🐚</div>
                  </div>
                </div>
                <ul className="space-y-3">
                  {extras.next.map(opt => {
                    const cur = nextBids[opt.id];
                    return (
                      <li key={opt.id} className="rounded-md border border-border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-display text-base">{opt.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Top bid <span className="text-primary">{cur.bid.toLocaleString()} 🐚</span> by <span className="text-foreground">{cur.bidder}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => bidNext(opt.id)}
                            className="h-9 rounded-md border border-border px-3 text-xs hover:border-primary/60 shrink-0"
                          >
                            +250 🐚
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* CREATION BIDS — Cowrie commissions */}
                <div className="mt-6 border-t border-border pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-primary">Creation bids 🐚</div>
                      <div className="text-xs text-muted-foreground mt-1">Propose what the streamer makes next. Streamer can accept or decline.</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Balance: <span className="text-foreground">{cowries.toLocaleString()}</span></div>
                  </div>

                  <form onSubmit={submitCreationBid} className="rounded-md border border-border p-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                    <input
                      value={bidPrompt}
                      onChange={e => setBidPrompt(e.target.value.slice(0, 120))}
                      placeholder='e.g. "Make a red ceramic bowl with gold rim"'
                      className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={50} step={50}
                        value={bidAmount}
                        onChange={e => setBidAmount(Math.max(50, +e.target.value || 50))}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
                      />
                      <span className="text-xs text-muted-foreground">🐚</span>
                    </div>
                    <button className="h-10 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-accent">
                      Submit bid
                    </button>
                  </form>

                  <ul className="mt-3 space-y-2">
                    {creationBids.map(b => (
                      <li key={b.id} className="rounded-md border border-border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm truncate">"{b.prompt}"</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              by <span className="text-foreground">{b.user}</span> · <span className="text-primary">{b.amount} Cowries</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {b.status === "pending" ? (
                              <>
                                <button onClick={() => resolveCreationBid(b.id, true)} className="h-8 rounded-md bg-primary/20 text-primary px-3 text-xs hover:bg-primary/30">Accept</button>
                                <button onClick={() => resolveCreationBid(b.id, false)} className="h-8 rounded-md border border-border px-3 text-xs hover:border-primary/60">Decline</button>
                              </>
                            ) : (
                              <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm ${b.status === "accepted" ? "bg-primary/20 text-primary" : "bg-border text-muted-foreground"}`}>
                                {b.status === "accepted" ? "Accepted" : "Declined · refunded"}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}


            {/* COMPETITION */}
            {tab === "comp" && (
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-primary">Open competition</div>
                    <div className="font-display text-xl mt-1">{extras.competition.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 max-w-xl">{extras.competition.prompt}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Prize pool</div>
                    <div className="font-display text-lg text-primary">{extras.competition.prizeCowries.toLocaleString()} 🐚</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Closes in</div>
                    <div className="font-display text-sm">{extras.competition.endsInMin}m</div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {extras.competition.entries.map(e => {
                    const v = votes[e.id];
                    const max = Math.max(...Object.values(votes));
                    const pct = (v / max) * 100;
                    return (
                      <li key={e.id} className="rounded-md border border-border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm truncate">
                              {e.title} <span className="text-muted-foreground text-xs">· {e.user}</span>
                              {e.sponsored && <span className="ml-2 rounded-sm bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary uppercase tracking-wider">Sponsored</span>}
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-display">{v}</div>
                            <button
                              onClick={() => castVote(e.id)}
                              disabled={!!voted}
                              className="mt-1 h-8 rounded-md border border-border px-3 text-xs hover:border-primary/60 disabled:opacity-50"
                            >
                              {voted === e.id ? "Voted" : voted ? "—" : "Vote"}
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex gap-2">
                  <button className="h-9 rounded-md border border-border px-3 text-xs hover:border-primary/60">Submit an entry</button>
                  <button className="h-9 rounded-md border border-border px-3 text-xs hover:border-primary/60">Sponsor (1,000 🐚)</button>
                  <button className="h-9 rounded-md border border-border px-3 text-xs hover:border-primary/60">Apply as judge</button>
                </div>
              </div>
            )}
          </div>

          {/* about */}
          <div className="mt-6 rounded-lg border border-border p-5">
            <h3 className="font-display text-lg">About this stream</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{stream.description}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Meta label="Craft" value={stream.craft} />
              <Meta label="Edition" value="1 of 1" />
              <Meta label="Royalty" value="10%" />
              <Meta label="Chain" value="Cowries · Base" />
            </div>
          </div>
        </div>

        {/* CHAT */}
        <aside className="rounded-lg border border-border bg-card flex flex-col h-[640px] lg:sticky lg:top-20">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <span className="font-display text-sm">Live chat</span>
            <span className="text-[11px] text-muted-foreground">{stream.viewers.toLocaleString()} viewers</span>
          </div>
          {/* Cowrie wallet strip */}
          <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-background/40">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-base">🐚</span>
              <span className="font-display text-sm">{cowries.toLocaleString()}</span>
              <span className="text-muted-foreground">Cowries</span>
            </div>
            <button onClick={() => setShowTopUp(true)} className="h-7 rounded-sm border border-border px-2 text-[11px] hover:border-primary/60">
              Top up
            </button>
          </div>
          <div ref={chatBoxRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm">
            {chat.map((c, i) => (
              <div key={i} className="leading-snug">
                <span className="font-medium" style={{ color: c.color }}>{c.user}</span>
                <span className="text-muted-foreground"> </span>
                <span>{c.msg}</span>
              </div>
            ))}
          </div>
          {/* quick emoji reactions in chat */}
          <div className="border-t border-border px-3 py-2 flex items-center gap-1">
            {["❤️","🔥","👏","🎨","🐚","🤯"].map(e => (
              <button key={e} onClick={() => sendReaction(e)} className="h-7 w-7 rounded-sm text-sm hover:bg-background transition" aria-label={`React ${e}`}>
                {e}
              </button>
            ))}
          </div>
          <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
            <input
              value={msg}
              onChange={e => setMsg(e.target.value.slice(0, 240))}
              placeholder="Say something kind…"
              className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
            />
            <button className="h-10 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-accent">Send</button>
          </form>
        </aside>
      </div>

      {/* Cowrie top-up dialog */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setShowTopUp(false)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6" onClick={e => e.stopPropagation()}>
            <div className="text-[11px] uppercase tracking-widest text-primary">Buy Cowries 🐚</div>
            <h3 className="font-display text-2xl mt-1">Top up your wallet</h3>
            <p className="text-xs text-muted-foreground mt-1">Cowries are Vinci's platform currency. Use them to gift creators and place creation bids. 10 Cowries = £1.00 · <Link to="/cowrie" className="text-primary hover:underline">See how fees work</Link></p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[500, 1500, 5000, 12000].map(amt => (
                <button
                  key={amt}
                  onClick={() => { setCowries(c => c + amt); setShowTopUp(false); }}
                  className="rounded-md border border-border p-3 hover:border-primary text-left"
                >
                  <div className="font-display text-lg">{amt.toLocaleString()} 🐚</div>
                  <div className="text-[11px] text-muted-foreground">£{(amt / 10).toFixed(2)}</div>

                </button>
              ))}
            </div>
            <button onClick={() => setShowTopUp(false)} className="mt-4 h-9 w-full rounded-md border border-border text-xs hover:border-primary/60">Close</button>
          </div>
        </div>
      )}

      {/* Certificate of Authenticity dialog */}
      {cert && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setCert(null)}>
          <div className="w-full max-w-lg rounded-lg border border-primary/40 bg-card overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div
              className="relative px-6 py-5 border-b border-border"
              style={{ background: `radial-gradient(120% 80% at 30% 20%, ${stream.thumbAccent}33 0%, transparent 60%), ${stream.thumbColor}` }}
            >
              <div className="absolute inset-0 noise opacity-40" />
              <div className="relative">
                <div className="text-[10px] uppercase tracking-widest text-primary">Certificate of authenticity · Base · ERC-721</div>
                <h3 className="font-display text-2xl mt-1">{cert.item.title}</h3>
                <div className="text-xs text-white/70 mt-1">Minted live · {cert.issuedAt}</div>
              </div>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <CertRow label="Token ID" value={cert.tokenId} mono />
              <CertRow label="Transaction" value={cert.txHash} mono />
              <CertRow label="Artist" value={`${stream.creator.name} · ${cert.artistId}`} />
              <CertRow label="Buyer wallet" value={cert.buyerWallet} mono />
              <CertRow label="Edition" value={cert.item.edition} />
              <CertRow label="Price" value={`${cert.item.priceCowries.toLocaleString()} 🐚 · £${(cert.item.priceCowries / 10).toFixed(2)}`} />
              <CertRow label="Delivery" value={cert.item.delivery} />
              {cert.item.delivery !== "Digital certificate" && (
                <CertRow label="Ships to" value={shippingAddress || "(not provided)"} />
              )}
              <CertRow label="Royalty" value="10% to artist on resale" />
              <CertRow label="Provenance" value="Live stream footage embedded" />

              <div className="pt-3 flex gap-2">
                <button onClick={() => setCert(null)} className="h-10 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-accent">Done</button>
                <Link to="/registry" className="h-10 grid place-items-center rounded-md border border-border px-4 text-sm hover:border-primary/60">View in registry</Link>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* more streams */}
      <section className="mt-16">
        <h2 className="font-display text-2xl mb-6">More live now</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {more.map(s => <StreamCard key={s.id} stream={s} />)}
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-sm">{value}</div>
    </div>
  );
}

function TagBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-sm">{value}</div>
    </div>
  );
}

function CertRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : "text-sm"} text-foreground truncate`}>{value}</span>
    </div>
  );
}
