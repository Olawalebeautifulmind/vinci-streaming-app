import { createFileRoute, Link } from "@tanstack/react-router";
import { streams, categories, streamsByCategory } from "../lib/streams";
import { StreamCard, StreamThumb, VerifiedBadge } from "../components/StreamCard";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({ meta: [
    { title: "Vinci — Discover handmade artists" },
    { name: "description", content: "Explore Vinci's handmade arts and crafts MVP, artist profiles and sample streams across eight disciplines." },
    { property: "og:title", content: "Vinci — Discover handmade artists" },
    { property: "og:description", content: "Discover handmade artists and explore sample craft streams on Vinci." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

function Index() {
  const featured = streams[0];
  const rising = streams[5];
  const grid = streams.slice(1, 5);

  return (
    <div>
      {/* HERO — magazine masthead */}
      <section className="relative border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span>Issue 001 · Live now</span>
            <span className="hidden sm:inline">Global · 24 / 7 · On-chain provenance</span>
            <span>{streams.length} artists streaming</span>
          </div>
          <h1 className="mt-8 font-display text-[14vw] sm:text-[10vw] md:text-[7.5rem] leading-[0.9] tracking-tight">
            The handmade,
            <br />
            <span className="gold-gradient-text italic">streamed live.</span>
          </h1>
          <div className="mt-8 grid md:grid-cols-3 gap-8 items-end">
            <p className="md:col-span-2 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Vinci is a global stage for handmade arts and crafts. Watch artists work in real time, bid on originals as they're being made, gift the makers you love, and collect verified pieces with on-chain provenance.
            </p>
            <div className="flex gap-3 md:justify-end">
              <Link to="/stream/$id" params={{ id: featured.id }} className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent transition-colors">
                Watch the featured stream
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED LIVE — magazine lead */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-3xl">Now streaming</h2>
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">View all live →</Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Lead story */}
          <Link to="/stream/$id" params={{ id: featured.id }} className="group lg:col-span-7 block">
            <StreamThumb stream={featured} className="aspect-[16/10]" />
            <div className="mt-5 flex items-start gap-4">
              <div className="h-12 w-12 rounded-full shrink-0" style={{ background: featured.creator.avatar }} />
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary">{featured.craft} · Live auction</div>
                <h3 className="mt-1 font-display text-3xl leading-tight group-hover:text-primary transition-colors">
                  {featured.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-prose">{featured.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{featured.creator.name}</span>
                  {featured.creator.verified && <VerifiedBadge />}
                  <span>· {featured.creator.location}</span>
                  <span>· {featured.viewers.toLocaleString()} watching</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Side stack */}
          <div className="lg:col-span-5 space-y-6">
            {grid.slice(0, 3).map(s => (
              <Link key={s.id} to="/stream/$id" params={{ id: s.id }} className="group flex gap-4">
                <StreamThumb stream={s} className="w-40 shrink-0 aspect-video" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-primary">{s.craft}</div>
                  <h4 className="mt-1 font-display text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">{s.title}</h4>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {s.creator.name} · {s.viewers.toLocaleString()} watching
                  </div>
                  <div className="mt-2 text-xs text-primary">Top bid {s.currentBidCowries.toLocaleString()} 🐚</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DISCOVER — categories */}
      <section id="discover" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-primary">Discover</div>
              <h2 className="mt-2 font-display text-4xl">Seven disciplines.<br/>One global studio.</h2>
            </div>
            <span className="hidden md:inline text-xs uppercase tracking-widest text-muted-foreground">{streams.length} streams live</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((c) => {
              const count = streamsByCategory(c.slug).length;
              return (
                <Link
                  key={c.slug}
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="group relative overflow-hidden rounded-lg border border-border p-5 hover:border-primary/60 transition-colors"
                  style={{ background: `radial-gradient(120% 80% at 20% 0%, ${c.accent}1a 0%, transparent 60%), ${c.base}` }}
                >
                  <div className="text-3xl">{c.emoji}</div>
                  <div className="mt-4 font-display text-xl group-hover:text-primary transition-colors">{c.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.tagline}</div>
                  <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-widest">
                    <span className="text-primary">{count} live now</span>
                    <span className="text-muted-foreground group-hover:text-foreground">Browse →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRENDING STREAMS */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-3xl">Trending across Vinci</h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">All disciplines</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {streams.slice(0, 6).map((s) => <StreamCard key={s.id} stream={s} />)}
          </div>
        </div>
      </section>

      {/* RISING — split */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <Link to="/stream/$id" params={{ id: rising.id }}>
            <StreamThumb stream={rising} className="aspect-[4/3]" />
          </Link>
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-primary">Rising · Trending in Europe</div>
            <h3 className="mt-3 font-display text-4xl leading-tight">{rising.title}</h3>
            <p className="mt-4 text-muted-foreground">{rising.description}</p>
            <div className="mt-6 grid grid-cols-3 gap-6 text-sm">
              <Stat label="Current bid" value={`${rising.currentBidCowries.toLocaleString()} 🐚`} />
              <Stat label="Watching" value={rising.viewers.toLocaleString()} />
              <Stat label="Started" value={`${rising.startedMinutesAgo}m ago`} />
            </div>
            <Link to="/stream/$id" params={{ id: rising.id }} className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent transition-colors">
              Enter the studio
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="collect" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">How Vinci works</div>
        <h2 className="mt-3 font-display text-4xl md:text-5xl max-w-3xl leading-tight">
          A studio, a stage, and a <span className="gold-gradient-text italic">vault</span> — all in one.
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <Step n="01" title="Verified artists go live" body="Creators verify their identity once. Every stream and every piece is then signed to their on-chain studio." />
          <Step n="02" title="Audiences engage in real time" body="Watch, chat, gift the artist, or place live bids while a piece is being made." />
          <Step n="03" title="Collect with provenance" body="When the auction closes, the piece is minted with stream footage as provenance and shipped from the studio." />
        </div>
      </section>

      {/* CREATORS STRIP */}
      <section id="creators" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display text-3xl">Featured creators</h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Verified studios</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {streams.map(s => (
              <div key={s.id} className="text-center">
                <div className="mx-auto h-20 w-20 rounded-full ring-1 ring-border" style={{ background: s.creator.avatar }} />
                <div className="mt-3 font-display text-sm flex items-center justify-center gap-1">
                  {s.creator.name.split(" ")[0]} {s.creator.verified && <VerifiedBadge />}
                </div>
                <div className="text-[11px] text-muted-foreground">{s.craft}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl md:text-6xl max-w-3xl mx-auto leading-tight">
            Are you a maker? <span className="gold-gradient-text italic">Open your studio.</span>
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-muted-foreground">Stream your craft to a global audience. Keep your royalties forever — every resale pays you back, automatically.</p>
          <div className="mt-8 flex justify-center gap-3">
            <button className="h-12 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-accent transition-colors">Apply to stream</button>
            <button className="h-12 rounded-md border border-border px-6 text-sm hover:border-primary/60 transition-colors">Read the creator guide</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl text-foreground">{value}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="border-t border-border pt-6">
      <div className="font-display text-sm text-primary">{n}</div>
      <h3 className="mt-2 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
