import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { creators, type PortfolioWork, type Creator } from "../lib/streams";

export const Route = createFileRoute("/registry")({
  component: RegistryPage,
  head: () => ({
    meta: [
      { title: "Artistic Ownership Registry · Vinci" },
      { name: "description", content: "Every work made on Vinci, minted on-chain to its creator's Artist ID. Browse the global registry of verified handmade originals." },
      { property: "og:title", content: "Artistic Ownership Registry · Vinci" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "All works minted on Vinci, traced to the artist who made them." },
    ],
  }),
});

type Entry = PortfolioWork & { creator: Creator };

function RegistryPage() {
  const entries: Entry[] = useMemo(
    () => creators.flatMap(c => c.portfolio.map(w => ({ ...w, creator: c }))),
    []
  );

  const [filter, setFilter] = useState<"all" | "Available" | "Collected" | "Archived">("all");
  const [query, setQuery] = useState("");

  const filtered = entries.filter(e => {
    if (filter !== "all" && e.status !== filter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.creator.name.toLowerCase().includes(q) ||
      e.creator.artistId.toLowerCase().includes(q) ||
      e.tokenId.toLowerCase().includes(q)
    );
  });

  const totals = {
    works: entries.length,
    artists: creators.length,
    collected: entries.filter(e => e.status === "Collected").length,
    available: entries.filter(e => e.status === "Available").length,
  };

  return (
    <div>
      {/* Masthead */}
      <section className="relative border-b border-border/60 overflow-hidden"
        style={{ background: "radial-gradient(80% 60% at 20% 0%, #c9a84c22 0%, transparent 60%), #15110a" }}>
        <div className="absolute inset-0 noise opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Artistic Ownership Registry</div>
          <h1 className="mt-2 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight max-w-3xl">
            Every work, traced to the hand that made it.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-foreground/80 leading-relaxed">
            Every original sold on Vinci is minted on Base (ERC-721) to the creator's Artist ID.
            Provenance, royalties and stream footage travel with the piece — forever.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-lg overflow-hidden text-sm">
            <Stat label="Works minted" value={totals.works.toLocaleString()} />
            <Stat label="Verified artists" value={totals.artists.toLocaleString()} />
            <Stat label="Collected" value={totals.collected.toLocaleString()} />
            <Stat label="Available" value={totals.available.toLocaleString()} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 space-y-8">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "Available", "Collected", "Archived"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wider transition ${
                  filter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, artist, ART-ID, token…"
            className="h-9 w-full md:w-80 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No works match. Try clearing the filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(w => (
              <article key={`${w.creator.handle}-${w.id}`} className="group rounded-lg border border-border overflow-hidden bg-card hover:border-primary/40 transition-colors">
                <div
                  className="relative aspect-[4/3]"
                  style={{ background: `radial-gradient(120% 80% at 30% 20%, ${w.thumbAccent}33 0%, transparent 60%), ${w.thumbColor}` }}
                >
                  <div className="absolute inset-0 noise opacity-70" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <span className="font-display text-2xl leading-none" style={{ color: w.thumbAccent }}>{w.title}</span>
                  </div>
                  <div className="absolute top-3 left-3 rounded-sm bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white/90">{w.tokenId}</div>
                  <div className="absolute top-3 right-3">
                    <StatusPill status={w.status} />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <Link
                    to="/creator/$handle"
                    params={{ handle: w.creator.handle }}
                    className="flex items-center gap-2 group/link"
                  >
                    <span className="h-7 w-7 rounded-full shrink-0" style={{ background: w.creator.avatar }} />
                    <span className="min-w-0">
                      <span className="block text-sm truncate group-hover/link:text-primary transition-colors">{w.creator.name}</span>
                      <span className="block text-[10px] font-mono text-muted-foreground truncate">{w.creator.artistId}</span>
                    </span>
                  </Link>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate pr-2">{w.medium}</span>
                    <span>{w.year}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="text-sm">
                      {w.priceCowries != null ? (
                        <span className="font-display">
                          {w.priceCowries.toLocaleString()} 🐚
                          <span className="ml-1 text-[10px] text-muted-foreground">≈ £{(w.priceCowries / 10).toFixed(2)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    {w.collector ? (
                      <div className="text-[10px] text-muted-foreground">held by <span className="text-foreground">{w.collector}</span></div>
                    ) : (
                      <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">{w.creator.registryAddress}</div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* On-chain note */}
        <section className="rounded-lg border border-border p-6 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary">Chain</div>
            <div className="mt-1 font-display">Base · ERC-721</div>
            <p className="mt-2 text-muted-foreground text-xs">Low-fee L2 minting. Each piece is non-fungible and bound to its Artist ID at mint time.</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary">Royalty</div>
            <div className="mt-1 font-display">10% to creator, in perpetuity</div>
            <p className="mt-2 text-muted-foreground text-xs">Enforced on every secondary sale routed through Vinci's marketplace.</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary">Provenance</div>
            <div className="mt-1 font-display">Stream footage embedded</div>
            <p className="mt-2 text-muted-foreground text-xs">Token metadata links to the original live session — the proof of authorship lives with the token.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "Collected" | "Available" | "Archived" }) {
  const styles =
    status === "Available" ? "bg-primary text-primary-foreground" :
    status === "Collected" ? "bg-black/70 text-primary border border-primary/40" :
    "bg-black/70 text-white/60";
  return <span className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${styles}`}>{status}</span>;
}
