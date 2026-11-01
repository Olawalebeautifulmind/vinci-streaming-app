import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { categories, type CategorySlug } from "../lib/streams";
import { LivePill } from "../components/StreamCard";

export const Route = createFileRoute("/versus")({
  component: VersusPage,
  head: () => ({
    meta: [
      { title: "Versus · Live craft battles · Vinci" },
      { name: "description", content: "Two artists, one craft, live. Vote with Cowries and crown the winner in Vinci's Versus battles." },
      { property: "og:title", content: "Versus · Live craft battles · Vinci" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Watch artists go head-to-head and vote with Cowries." },
    ],
  }),
});

type Side = {
  handle: string;
  name: string;
  city: string;
  avatar: string;
  craftLabel: string;
  accent: string;
  base: string;
  wins: number;
};

type Battle = {
  id: string;
  category: CategorySlug;
  title: string;
  endsInMin: number;
  viewers: number;
  potCowries: number;
  a: Side;
  b: Side;
  startVotesA: number;
  startVotesB: number;
};

const grad = (a: string, b: string) => `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;

const battles: Battle[] = [
  {
    id: "vs-ceramics-01",
    category: "ceramics",
    title: "Wabi vs Wheel — 60-minute teacup duel",
    endsInMin: 42,
    viewers: 3120,
    potCowries: 18400,
    startVotesA: 1240,
    startVotesB: 980,
    a: { handle: "akira.studio", name: "Akira Mori", city: "Kyoto, JP", avatar: grad("#c9a84c", "#3a2a14"), craftLabel: "Wabi tea cup", accent: "#c9a84c", base: "#1a1208", wins: 12 },
    b: { handle: "elena.clay", name: "Elena Vasquez", city: "Oaxaca, MX", avatar: grad("#e8a87c", "#4a2a1a"), craftLabel: "Wheel-thrown cup", accent: "#e8a87c", base: "#1a1410", wins: 7 },
  },
  {
    id: "vs-painting-01",
    category: "painting",
    title: "Alla prima portrait race — single sitting",
    endsInMin: 18,
    viewers: 2210,
    potCowries: 9600,
    startVotesA: 640,
    startVotesB: 720,
    a: { handle: "marin.oil", name: "Marin Halász", city: "Budapest, HU", avatar: grad("#e8a87c", "#2a1a14"), craftLabel: "Oil portrait", accent: "#e8a87c", base: "#1a0e08", wins: 5 },
    b: { handle: "yuki.aqua", name: "Yuki Tanabe", city: "Tokyo, JP", avatar: grad("#9bd0b0", "#1a1a1a"), craftLabel: "Watercolour portrait", accent: "#9bd0b0", base: "#0e1418", wins: 2 },
  },
  {
    id: "vs-sculpture-01",
    category: "sculpture",
    title: "Marble vs Bronze — 24h reveal battle",
    endsInMin: 720,
    viewers: 4480,
    potCowries: 42000,
    startVotesA: 2110,
    startVotesB: 1980,
    a: { handle: "lorenzo.carve", name: "Lorenzo Bianchi", city: "Carrara, IT", avatar: grad("#dcdcdc", "#2a2a2a"), craftLabel: "Marble bust", accent: "#dcdcdc", base: "#15161a", wins: 18 },
    b: { handle: "akin.foundry", name: "Akin Bello", city: "Lagos, NG", avatar: grad("#c9a84c", "#1a1208"), craftLabel: "Bronze head", accent: "#f0c060", base: "#1a1208", wins: 14 },
  },
];

type VoteState = Record<string, { a: number; b: number; picked: "a" | "b" | null }>;

function VersusPage() {
  const initial = useMemo<VoteState>(
    () => Object.fromEntries(battles.map(b => [b.id, { a: b.startVotesA, b: b.startVotesB, picked: null }])),
    []
  );
  const [votes, setVotes] = useState<VoteState>(initial);
  const [cowries, setCowries] = useState(1240);
  const [costPerVote] = useState(10);

  const castVote = (id: string, side: "a" | "b") => {
    const v = votes[id];
    if (v.picked) return;
    if (cowries < costPerVote) return;
    setCowries(c => c - costPerVote);
    setVotes(prev => ({ ...prev, [id]: { ...prev[id], [side]: prev[id][side] + 1, picked: side } }));
  };

  // Leaderboard: aggregate by artist across battles + base wins
  const leaderboard = useMemo(() => {
    const map = new Map<string, { handle: string; name: string; city: string; avatar: string; wins: number; cowries: number; audience: number }>();
    for (const b of battles) {
      const v = votes[b.id];
      const total = v.a + v.b;
      const shareA = total ? v.a / total : 0.5;
      const earnedA = Math.round(b.potCowries * shareA);
      const earnedB = b.potCowries - earnedA;
      for (const [side, earned] of [[b.a, earnedA], [b.b, earnedB]] as const) {
        const prev = map.get(side.handle) ?? { handle: side.handle, name: side.name, city: side.city, avatar: side.avatar, wins: side.wins, cowries: 0, audience: 0 };
        prev.cowries += earned;
        prev.audience += Math.round(b.viewers / 2);
        map.set(side.handle, prev);
      }
    }
    return [...map.values()].sort((x, y) => y.cowries - x.cowries);
  }, [votes]);

  return (
    <div>
      {/* Masthead */}
      <section
        className="relative border-b border-border/60 overflow-hidden"
        style={{ background: "radial-gradient(80% 60% at 20% 0%, #c9a84c22 0%, transparent 60%), #15110a" }}
      >
        <div className="absolute inset-0 noise opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Versus mode</div>
          <h1 className="mt-2 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight max-w-3xl">
            Two hands. One craft. The room decides.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-foreground/80 leading-relaxed">
            Watch artists go head-to-head live in the same craft category. Spend Cowries to vote — the pot splits with the winner.
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs">
            <span className="rounded-full border border-border bg-background/60 px-3 py-1.5">
              Wallet · <span className="font-display text-primary">{cowries.toLocaleString()} 🐚</span>
            </span>
            <span className="rounded-full border border-border bg-background/60 px-3 py-1.5">
              {costPerVote} 🐚 per vote
            </span>
            <Link to="/cowrie" className="text-primary hover:underline">Top up</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 space-y-12">
        {/* Battles */}
        <section className="space-y-6">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <h2 className="font-display text-2xl md:text-3xl">Live battles</h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{battles.length} active</span>
          </div>

          <div className="grid gap-6">
            {battles.map(b => {
              const v = votes[b.id];
              const total = v.a + v.b;
              const pctA = total ? Math.round((v.a / total) * 100) : 50;
              const pctB = 100 - pctA;
              const cat = categories.find(c => c.slug === b.category);

              return (
                <article key={b.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <LivePill />
                      <span className="font-display text-base">{b.title}</span>
                      {cat && <span className="text-xs text-muted-foreground">· {cat.emoji} {cat.name}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{b.viewers.toLocaleString()} watching</span>
                      <span>Pot <span className="text-primary font-display">{b.potCowries.toLocaleString()} 🐚</span></span>
                      <span>Ends in <span className="text-foreground">{b.endsInMin < 60 ? `${b.endsInMin}m` : `${Math.round(b.endsInMin / 60)}h`}</span></span>
                    </div>
                  </div>

                  {/* Sides */}
                  <div className="grid md:grid-cols-2">
                    <SideCard side={b.a} pct={pctA} votes={v.a} picked={v.picked === "a"} disabled={!!v.picked || cowries < costPerVote} onVote={() => castVote(b.id, "a")} />
                    <SideCard side={b.b} pct={pctB} votes={v.b} picked={v.picked === "b"} disabled={!!v.picked || cowries < costPerVote} onVote={() => castVote(b.id, "b")} mirror />
                  </div>

                  {/* Bar */}
                  <div className="px-5 py-4 border-t border-border">
                    <div className="h-2 w-full rounded-full bg-border overflow-hidden flex">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pctA}%` }} />
                      <div className="h-full bg-accent/70 transition-all" style={{ width: `${pctB}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{pctA}% · {v.a.toLocaleString()} votes</span>
                      <span>{v.picked ? `You voted ${v.picked === "a" ? b.a.name : b.b.name}` : `Spend ${costPerVote} 🐚 to vote`}</span>
                      <span>{v.b.toLocaleString()} votes · {pctB}%</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-primary">Versus leaderboard</div>
              <h2 className="mt-1 font-display text-2xl md:text-3xl">Top battle artists</h2>
              <p className="mt-1 text-sm text-muted-foreground">Wins, Cowries earned per battle, and total audience reached.</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_80px_120px_120px] gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <span>#</span><span>Artist</span><span className="text-right">Wins</span><span className="text-right">Cowries</span><span className="text-right">Audience</span>
            </div>
            <ul className="divide-y divide-border">
              {leaderboard.map((row, i) => (
                <li key={row.handle} className="grid grid-cols-[40px_1fr_80px_120px_120px] gap-3 px-4 py-3 items-center text-sm">
                  <span className={`font-display ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                  <Link to="/creator/$handle" params={{ handle: row.handle }} className="flex items-center gap-3 min-w-0 hover:text-primary">
                    <span className="h-8 w-8 rounded-full shrink-0" style={{ background: row.avatar }} />
                    <span className="min-w-0">
                      <span className="block truncate">{row.name}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">{row.city}</span>
                    </span>
                  </Link>
                  <span className="text-right font-display">{row.wins}</span>
                  <span className="text-right font-display text-primary">{row.cowries.toLocaleString()} 🐚</span>
                  <span className="text-right text-muted-foreground">{row.audience.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-lg border border-border p-6 grid md:grid-cols-3 gap-6 text-sm">
          <Step n="1" title="Pick a side" body="Choose the artist whose work you back. One vote per battle, per viewer." />
          <Step n="2" title="Spend Cowries" body={`Each vote costs ${costPerVote} Cowries. Cowries fund the pot and the platform.`} />
          <Step n="3" title="Winner takes the pot" body="When the timer ends, the side with the most votes claims the larger share. Both artists earn." />
        </section>
      </div>
    </div>
  );
}

function SideCard({ side, pct, votes, picked, disabled, onVote, mirror = false }: {
  side: Side; pct: number; votes: number; picked: boolean; disabled: boolean; onVote: () => void; mirror?: boolean;
}) {
  return (
    <div
      className={`relative p-5 ${mirror ? "md:border-l border-border" : ""}`}
      style={{ background: `radial-gradient(120% 80% at ${mirror ? "70%" : "30%"} 20%, ${side.accent}22 0%, transparent 60%), ${side.base}` }}
    >
      <div className="absolute inset-0 noise opacity-40" />
      <div className="relative flex items-start gap-4">
        <Link to="/creator/$handle" params={{ handle: side.handle }} className="h-14 w-14 rounded-full shrink-0 hover:ring-2 hover:ring-primary/60 transition" style={{ background: side.avatar }} aria-label={side.name} />
        <div className="min-w-0 flex-1">
          <Link to="/creator/$handle" params={{ handle: side.handle }} className="font-display text-lg hover:text-primary">{side.name}</Link>
          <div className="text-xs text-muted-foreground">@{side.handle} · {side.city}</div>
          <div className="mt-2 text-xs">
            <span className="rounded-sm bg-black/40 px-2 py-0.5 text-white/90">{side.craftLabel}</span>
            <span className="ml-2 text-muted-foreground">{side.wins} wins</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-2xl" style={{ color: side.accent }}>{pct}%</div>
          <div className="text-[11px] text-muted-foreground">{votes.toLocaleString()} votes</div>
        </div>
      </div>
      <div className="relative mt-4">
        <button
          onClick={onVote}
          disabled={disabled}
          className={`h-10 w-full rounded-md text-sm font-medium transition ${
            picked
              ? "bg-primary text-primary-foreground"
              : disabled
                ? "border border-border text-muted-foreground cursor-not-allowed"
                : "border border-border hover:border-primary hover:bg-background/40"
          }`}
        >
          {picked ? "Voted ✓" : disabled ? "Vote locked" : `Vote · 10 🐚`}
        </button>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-primary">Step {n}</div>
      <div className="mt-1 font-display text-lg">{title}</div>
      <p className="mt-2 text-muted-foreground text-xs leading-relaxed">{body}</p>
    </div>
  );
}
