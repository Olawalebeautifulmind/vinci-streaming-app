import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCreator, streamsByCreator, getCategory, type PortfolioWork, type CategorySlug } from "../lib/streams";
import { StreamCard, VerifiedBadge } from "../components/StreamCard";


export const Route = createFileRoute("/creator/$handle")({
  component: CreatorProfile,
  loader: ({ params }) => {
    const creator = getCreator(params.handle);
    if (!creator) throw notFound();
    return { creator };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.creator.name} (${loaderData.creator.artistId}) · Vinci` },
          { name: "description", content: loaderData.creator.bio },
          { property: "og:title", content: `${loaderData.creator.name} (${loaderData.creator.artistId}) · Vinci` },
          { property: "og:description", content: loaderData.creator.bio },
          { property: "og:type", content: "profile" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [],
  }),
});

function CreatorProfile() {
  const { creator } = Route.useLoaderData();
  const live = streamsByCreator(creator.handle);
  const collected = creator.portfolio.filter((w: PortfolioWork) => w.status === "Collected").length;
  const available = creator.portfolio.filter((w: PortfolioWork) => w.status === "Available").length;

  const accent = creator.portfolio[0]?.thumbAccent ?? "#c9a84c";
  const base = creator.portfolio[0]?.thumbColor ?? "#1a1208";

  return (
    <div>
      {/* Masthead */}
      <section
        className="relative border-b border-border/60 overflow-hidden"
        style={{ background: `radial-gradient(80% 60% at 20% 0%, ${accent}22 0%, transparent 60%), ${base}` }}
      >
        <div className="absolute inset-0 noise opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Vinci</Link>
          <div className="mt-6 grid md:grid-cols-[auto_1fr_auto] gap-8 items-start">
            <div className="h-28 w-28 md:h-36 md:w-36 rounded-full border border-border shadow-xl" style={{ background: creator.avatar }} />
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary">{creator.artistId}</div>
              <h1 className="mt-2 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
                {creator.name}
                {creator.verified && <span className="ml-3 inline-flex align-middle"><VerifiedBadge /></span>}
              </h1>
              <div className="mt-2 text-sm text-muted-foreground">@{creator.handle}</div>
              <p className="mt-5 max-w-2xl text-base text-foreground/90 leading-relaxed">{creator.bio}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {creator.disciplines.map((d: CategorySlug) => {
                  const cat = getCategory(d);
                  return cat ? (
                    <Link key={d} to="/c/$slug" params={{ slug: d }} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary/60">
                      {cat.emoji} {cat.name}
                    </Link>
                  ) : null;
                })}
                <span className="rounded-full bg-primary/10 text-primary border border-primary/30 px-3 py-1 text-xs">{creator.skillLevel}</span>
              </div>
            </div>
            <div className="flex gap-2 md:flex-col">
              <button className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent">Follow</button>
              <button className="h-10 rounded-md border border-border px-5 text-sm hover:border-primary/60">Commission</button>
            </div>
          </div>

          {/* Identity strip */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-px bg-border/60 border border-border/60 rounded-lg overflow-hidden text-sm">
            <Stat label="Location" value={`${creator.city}, ${creator.country}`} sub={creator.continent} />
            <Stat label="Followers" value={creator.followers.toLocaleString()} sub={`Since ${creator.joinedYear}`} />
            <Stat label="Works minted" value={String(creator.portfolio.length)} sub={`${collected} collected · ${available} available`} />
            <Stat label="Wallet" value={creator.walletShort} sub="Verified on-chain" />
            <Stat label="Registry" value={creator.artistId} sub={creator.registryAddress} mono />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 space-y-16">
        {/* Live now */}
        {live.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-6">
              <h2 className="font-display text-2xl md:text-3xl">Live now</h2>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{live.length} active stream{live.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {live.map(s => <StreamCard key={s.id} stream={s} />)}
            </div>
          </section>
        )}

        {/* Artistic Ownership Registry */}
        <section>
          <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-primary">Artistic Ownership Registry</div>
              <h2 className="mt-1 font-display text-2xl md:text-3xl">Verified portfolio of {creator.name.split(" ")[0]}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Every work minted to <span className="font-mono text-foreground">{creator.artistId}</span> on Base · ERC-721.</p>
            </div>
            <div className="text-xs text-muted-foreground font-mono">{creator.registryAddress}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creator.portfolio.map((w: PortfolioWork) => (
              <article key={w.id} className="group rounded-lg border border-border overflow-hidden bg-card">
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
                <div className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{w.medium}</span>
                    <span>{w.year}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm">
                      {w.priceCowries != null ? (
                        <span className="font-display">{w.priceCowries.toLocaleString()} 🐚</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    {w.collector && (
                      <div className="text-[11px] text-muted-foreground">held by <span className="text-foreground">{w.collector}</span></div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* About / identity */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border p-6">
            <h3 className="font-display text-lg">Identity</h3>
            <dl className="mt-4 grid grid-cols-2 gap-y-4 text-sm">
              <Row label="Artist ID" value={creator.artistId} mono />
              <Row label="Skill level" value={creator.skillLevel} />
              <Row label="City" value={creator.city} />
              <Row label="Country" value={`${creator.country} (${creator.countryCode})`} />
              <Row label="Continent" value={creator.continent} />
              <Row label="Joined" value={String(creator.joinedYear)} />
            </dl>
          </div>
          <div className="rounded-lg border border-border p-6">
            <h3 className="font-display text-lg">On-chain</h3>
            <dl className="mt-4 grid grid-cols-2 gap-y-4 text-sm">
              <Row label="Wallet" value={creator.walletShort} mono />
              <Row label="Chain" value="Base · ERC-721" />
              <Row label="Registry" value={creator.registryAddress} mono />
              <Row label="Royalty" value="10%" />
              <Row label="Works minted" value={String(creator.portfolio.length)} />
              <Row label="Verified" value={creator.verified ? "Yes" : "Pending"} />
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, mono = false }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="bg-background p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 ${mono ? "font-mono text-sm" : "font-display text-base"}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-foreground" : "text-foreground"}>{value}</dd>
    </>
  );
}

function StatusPill({ status }: { status: "Collected" | "Available" | "Archived" }) {
  const styles =
    status === "Available" ? "bg-primary text-primary-foreground" :
    status === "Collected" ? "bg-black/70 text-primary border border-primary/40" :
    "bg-black/70 text-white/60";
  return <span className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${styles}`}>{status}</span>;
}
