import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Virtual Galleries — Vinci" },
      {
        name: "description",
        content:
          "Step inside live 3D galleries. Five or more artists showcase, viewers walk the room, and every piece on the wall is buyable — Vinci handles the shipping.",
      },
      { property: "og:title", content: "Virtual Galleries — Vinci" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "Live 3D group shows on Vinci. Pay one entry fee, walk the room, buy the art — we handle the logistics between artist and buyer.",
      },
    ],
  }),
  component: GalleryIndex,
});

type GalleryStatus = "live" | "upcoming" | "ended";

type Gallery = {
  id: string;
  title: string;
  curator: string;
  status: GalleryStatus;
  entryFee: number; // cowries 🐚
  artistCount: number;
  viewers: number;
  startsIn?: string;
  cover: string;
  palette: [string, string];
  pieces: number;
};

const GALLERIES: Gallery[] = [
  {
    id: "lagos-loom",
    title: "Lagos Loom: Threads of the South",
    curator: "Adaeze O.",
    status: "live",
    entryFee: 12,
    artistCount: 7,
    viewers: 318,
    cover: "Indigo textile macro, raked light",
    palette: ["#1a2a6c", "#b21f1f"],
    pieces: 24,
  },
  {
    id: "kiln-room-3",
    title: "Kiln Room 3 — Ash & Iron",
    curator: "Vinci Studio",
    status: "live",
    entryFee: 8,
    artistCount: 5,
    viewers: 142,
    cover: "Wood-fired ceramics, low spot",
    palette: ["#2d1b00", "#c97b2c"],
    pieces: 18,
  },
  {
    id: "paper-cities",
    title: "Paper Cities",
    curator: "Hiroshi K.",
    status: "upcoming",
    entryFee: 15,
    artistCount: 6,
    viewers: 0,
    startsIn: "Sat · 7pm WAT",
    cover: "Cut-paper skylines",
    palette: ["#0f3057", "#e8e8e8"],
    pieces: 30,
  },
  {
    id: "rust-belt",
    title: "Rust Belt Revival",
    curator: "Marcus T.",
    status: "upcoming",
    entryFee: 10,
    artistCount: 5,
    viewers: 0,
    startsIn: "Sun · 3pm EST",
    cover: "Reclaimed steel sculpture",
    palette: ["#3a1c0a", "#a84a1f"],
    pieces: 20,
  },
];

function GalleryIndex() {
  const [selected, setSelected] = useState<Gallery | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Vinci · Virtual Gallery
          </p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl tracking-tight">
            Walk the room. Buy the wall.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Live 3D group shows hosted by 5+ streamers at once. One entry fee
            (set by the artists) gets you inside. Every piece on the wall is
            for sale — Vinci handles shipping between the artist and you.
          </p>
        </div>
        <Link
          to="/live/new"
          className="self-start inline-flex h-10 items-center rounded-md border border-primary/40 bg-primary/10 px-4 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          Propose a gallery
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GALLERIES.map((g) => (
          <GalleryCard key={g.id} gallery={g} onOpen={() => setSelected(g)} />
        ))}
      </section>

      <HowItWorks />

      {selected && (
        <GalleryRoomModal gallery={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function GalleryCard({
  gallery,
  onOpen,
}: {
  gallery: Gallery;
  onOpen: () => void;
}) {
  const isLive = gallery.status === "live";
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gallery.palette[0]}, ${gallery.palette[1]})`,
        }}
      >
        <MiniRoomSVG palette={gallery.palette} />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
          ) : (
            <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur">
              {gallery.startsIn ?? "Soon"}
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 rounded-sm bg-black/60 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur">
          {gallery.entryFee} 🐚 entry
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
          <span>{gallery.artistCount} artists · {gallery.pieces} pieces</span>
          {isLive && <span>{gallery.viewers} inside</span>}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg leading-tight">{gallery.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Curated by {gallery.curator}
        </p>
        <button
          onClick={onOpen}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-accent transition-colors"
        >
          {isLive ? "Enter the room" : "Preview & RSVP"}
        </button>
      </div>
    </article>
  );
}

function MiniRoomSVG({ palette }: { palette: [string, string] }) {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full opacity-90">
      {/* floor */}
      <polygon points="0,300 400,300 320,180 80,180" fill="rgba(0,0,0,0.35)" />
      {/* back wall */}
      <rect x="80" y="60" width="240" height="120" fill="rgba(255,255,255,0.06)" />
      {/* frames */}
      <rect x="110" y="90" width="50" height="60" fill={palette[1]} opacity="0.85" />
      <rect x="175" y="80" width="50" height="70" fill="rgba(255,255,255,0.85)" />
      <rect x="240" y="95" width="50" height="55" fill={palette[0]} opacity="0.85" />
      {/* side walls (perspective) */}
      <polygon points="0,0 80,60 80,180 0,300" fill="rgba(0,0,0,0.45)" />
      <polygon points="400,0 320,60 320,180 400,300" fill="rgba(0,0,0,0.45)" />
      {/* spot */}
      <ellipse cx="200" cy="240" rx="120" ry="18" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "5+ artists agree to a show",
      body: "Streamers form a gallery, vote on a theme, and set one shared entry fee in cowries 🐚.",
    },
    {
      n: "02",
      title: "Viewers pay once, walk the room",
      body: "Enter a live 3D space. Move between walls, see each piece full-scale, chat with the artist on the spot.",
    },
    {
      n: "03",
      title: "Buy off the wall",
      body: "Tap a frame to buy. Vinci handles shipping between the artist and you — provenance stays on-chain.",
    },
  ];
  return (
    <section className="mt-16 rounded-xl border border-border bg-card/40 p-8">
      <h2 className="font-display text-2xl">How a Vinci Gallery works</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s) => (
          <div key={s.n}>
            <p className="font-mono text-xs text-primary">{s.n}</p>
            <h3 className="mt-2 font-display text-base">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GalleryRoomModal({
  gallery,
  onClose,
}: {
  gallery: Gallery;
  onClose: () => void;
}) {
  const [wall, setWall] = useState(0); // 0 = back, 1 = left, 2 = right
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);

  const pieces = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        artist: ["Adaeze", "Hiroshi", "Marcus", "Lina", "Tomás", "Yuki"][i],
        title: ["Tide", "Furnace", "Loom 04", "Quiet Hands", "Ash Map", "Red Thread"][i],
        price: 80 + i * 35,
        cowries: 40 + i * 18,
      })),
    [gallery.id],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {gallery.status === "live" ? "Live now" : "Preview"} · {gallery.entryFee} 🐚 entry
            </p>
            <h2 className="font-display text-lg leading-tight">{gallery.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </header>

        {/* 3D-ish room */}
        <div className="relative aspect-[16/9] bg-neutral-950">
          <Room3D palette={gallery.palette} wall={wall} onPick={setSelectedPiece} />

          {/* wall switcher */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur">
            {["Back wall", "Left wall", "Right wall"].map((label, i) => (
              <button
                key={label}
                onClick={() => setWall(i)}
                className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                  wall === i
                    ? "bg-primary text-primary-foreground"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* viewer count */}
          {gallery.status === "live" && (
            <div className="absolute top-3 right-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-mono text-white backdrop-blur">
              👥 {gallery.viewers} inside
            </div>
          )}
        </div>

        {/* piece strip */}
        <div className="border-t border-border bg-card/40 p-4">
          {selectedPiece === null ? (
            <p className="text-xs text-muted-foreground">
              Tap a frame in the room to see the piece, the artist, and buy.
              Vinci ships it to you — the artist never touches logistics.
            </p>
          ) : (
            <PieceDetail
              piece={pieces[selectedPiece % pieces.length]}
              onClose={() => setSelectedPiece(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Room3D({
  palette,
  wall,
  onPick,
}: {
  palette: [string, string];
  wall: number;
  onPick: (idx: number) => void;
}) {
  // Render a faux-perspective room. The active wall shows 4 frames; others dim.
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ambient gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${palette[0]}33, transparent 60%), #0a0a0a`,
        }}
      />
      {/* floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.04))",
          transform: "perspective(800px) rotateX(55deg)",
          transformOrigin: "top",
        }}
      />
      {/* back wall */}
      <Wall
        active={wall === 0}
        style={{ left: "20%", right: "20%", top: "10%", bottom: "30%" }}
        palette={palette}
        startIdx={0}
        onPick={onPick}
      />
      {/* left wall */}
      <Wall
        active={wall === 1}
        style={{
          left: "0%",
          width: "20%",
          top: "10%",
          bottom: "30%",
          transform: "perspective(800px) rotateY(35deg)",
          transformOrigin: "right",
        }}
        palette={palette}
        startIdx={2}
        onPick={onPick}
        compact
      />
      {/* right wall */}
      <Wall
        active={wall === 2}
        style={{
          right: "0%",
          width: "20%",
          top: "10%",
          bottom: "30%",
          transform: "perspective(800px) rotateY(-35deg)",
          transformOrigin: "left",
        }}
        palette={palette}
        startIdx={4}
        onPick={onPick}
        compact
      />
    </div>
  );
}

function Wall({
  active,
  style,
  palette,
  startIdx,
  onPick,
  compact = false,
}: {
  active: boolean;
  style: React.CSSProperties;
  palette: [string, string];
  startIdx: number;
  onPick: (idx: number) => void;
  compact?: boolean;
}) {
  const count = compact ? 2 : 4;
  return (
    <div
      className="absolute flex items-center justify-around px-3 transition-opacity"
      style={{
        ...style,
        background: active
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.02)",
        opacity: active ? 1 : 0.35,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const idx = startIdx + i;
        const fill = i % 2 === 0 ? palette[0] : palette[1];
        return (
          <button
            key={i}
            disabled={!active}
            onClick={() => onPick(idx)}
            className="group relative aspect-[3/4] h-[70%] overflow-hidden rounded-sm border border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.04] disabled:cursor-default"
            style={{ background: fill }}
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <span className="absolute bottom-1 left-1 right-1 rounded-sm bg-black/50 px-1 py-0.5 text-[9px] text-white/90 opacity-0 group-hover:opacity-100">
              View
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PieceDetail({
  piece,
  onClose,
}: {
  piece: { id: number; artist: string; title: string; price: number; cowries: number };
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {piece.artist}
        </p>
        <h3 className="font-display text-lg leading-tight">{piece.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Verified on-chain · Ships worldwide via Vinci · Authenticity guarantee
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-display text-xl">${piece.price}</p>
          <p className="text-[10px] text-muted-foreground">or {piece.cowries} 🐚</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-accent">
          Buy now
        </button>
        <button
          onClick={onClose}
          className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Back to wall
        </button>
      </div>
    </div>
  );
}
