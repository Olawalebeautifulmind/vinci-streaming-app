import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { crafts, enabledCrafts } from "@/lib/crafts";
import { housekeeping, listStreams, listWorks, useLoad, useRealtime } from "@/lib/data";
import { StreamCard, StreamThumb, EmptyState, Avatar } from "@/components/StreamCard";
import { WorkCard } from "@/components/works";
import { displayName } from "@/lib/data";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Vinci — Bead making and pottery, streamed live" },
      {
        name: "description",
        content:
          "Watch bead makers and potters create live, bid on originals, gift Cowries and collect certified handmade work.",
      },
      { property: "og:title", content: "Vinci — Bead making and pottery, streamed live" },
      {
        property: "og:description",
        content: "Watch handmade work being made live. Bid, gift and collect.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const live = useLoad(async () => {
    await housekeeping();
    return listStreams({ status: "live", limit: 12 });
  }, []);
  const recent = useLoad(() => listStreams({ status: "ended", limit: 6 }), []);
  const works = useLoad(() => listWorks({ status: ["available"], limit: 8 }), []);
  useRealtime("streams", "", () => void live.reload());

  useEffect(() => {
    const t = setInterval(() => void live.reload(), 60_000);
    return () => clearInterval(t);
  }, [live.reload]);

  const streams = live.data ?? [];
  const featured = streams[0];

  return (
    <div>
      <section className="relative border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <span>Live now · Bead Making & Pottery</span>
            <span>
              {streams.length} studio{streams.length === 1 ? "" : "s"} streaming
            </span>
          </div>
          <h1 className="mt-8 font-display text-[14vw] sm:text-[10vw] md:text-[7.5rem] leading-[0.9] tracking-tight">
            The handmade,
            <br />
            <span className="gold-gradient-text italic">streamed live.</span>
          </h1>
          <div className="mt-8 grid md:grid-cols-3 gap-8 items-end">
            <p className="md:col-span-2 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Watch bead makers and potters work in real time. Bid on pieces as they're made, gift
              the makers you love with Cowries, and collect work that comes with a Vinci certificate
              of authenticity.
            </p>
            <div className="flex gap-3 md:justify-end">
              {featured ? (
                <Link
                  to="/stream/$id"
                  params={{ id: featured.id }}
                  className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent"
                >
                  Watch live now
                </Link>
              ) : (
                <Link
                  to="/live/new"
                  className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent"
                >
                  Open your studio
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-3xl">Now streaming</h2>
        </div>
        {live.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-video rounded-lg bg-card animate-pulse" />
            ))}
          </div>
        ) : featured ? (
          <div className="grid lg:grid-cols-12 gap-8">
            <Link
              to="/stream/$id"
              params={{ id: featured.id }}
              className="group lg:col-span-7 block"
            >
              <StreamThumb stream={featured} className="aspect-[16/10]" />
              <div className="mt-5 flex items-start gap-4">
                <Avatar profile={featured.creator} className="h-12 w-12" />
                <div>
                  <h3 className="font-display text-3xl leading-tight group-hover:text-primary transition-colors">
                    {featured.title}
                  </h3>
                  {featured.description && (
                    <p className="mt-2 text-sm text-muted-foreground max-w-prose line-clamp-3">
                      {featured.description}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {displayName(featured.creator)}
                  </div>
                </div>
              </div>
            </Link>
            <div className="lg:col-span-5 grid gap-6 content-start">
              {streams.slice(1, 4).map((s) => (
                <StreamCard key={s.id} stream={s} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No one is live right now."
            body="Studios go live throughout the day. Follow a maker to see when they start, or open your own studio."
          >
            <Link
              to="/live/new"
              className="h-10 inline-flex items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent"
            >
              Go live
            </Link>
          </EmptyState>
        )}
        {streams.length > 4 && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {streams.slice(4).map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
        )}
      </section>

      <section id="discover" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="text-[11px] uppercase tracking-[0.25em] text-primary">Discover</div>
          <h2 className="mt-2 font-display text-4xl mb-8">Two crafts live today. More coming.</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {crafts.map((c) =>
              c.enabled ? (
                <Link
                  key={c.slug}
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="group relative overflow-hidden rounded-lg border border-primary/40 p-5 hover:border-primary transition-colors md:col-span-2"
                  style={{
                    background: `radial-gradient(120% 80% at 20% 0%, ${c.accent}22 0%, transparent 60%), ${c.base}`,
                  }}
                >
                  <div className="text-4xl">{c.emoji}</div>
                  <div className="mt-4 font-display text-2xl group-hover:text-primary transition-colors">
                    {c.name}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{c.tagline}</div>
                  <div className="mt-4 text-[11px] uppercase tracking-widest text-primary">
                    {streams.filter((s) => s.craft === c.slug).length} live now · Browse →
                  </div>
                </Link>
              ) : (
                <div key={c.slug} className="rounded-lg border border-border/60 p-5 opacity-60">
                  <div className="text-2xl">{c.emoji}</div>
                  <div className="mt-3 font-display text-lg">{c.name}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                    Coming soon
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {(works.data?.length ?? 0) > 0 && (
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-3xl">For sale now</h2>
              <Link
                to="/registry"
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Registry →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {works.data!.map((w) => (
                <WorkCard key={w.id} work={w} onChanged={() => void works.reload()} />
              ))}
            </div>
          </div>
        </section>
      )}

      {(recent.data?.length ?? 0) > 0 && (
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <h2 className="font-display text-3xl mb-6">Recently streamed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {recent.data!.map((s) => (
                <StreamCard key={s.id} stream={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="collect" className="border-t border-border/60 mx-auto max-w-7xl px-6 py-20">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          How Vinci works
        </div>
        <h2 className="mt-3 font-display text-4xl md:text-5xl max-w-3xl leading-tight">
          A studio, a stage, and a <span className="gold-gradient-text italic">registry</span>, all
          in one.
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <Step
            n="01"
            title="Makers go live"
            body="Bead makers and potters stream straight from the browser or from OBS. No extra software required."
          />
          <Step
            n="02"
            title="Audiences take part"
            body="Chat, gift Cowries, send a creation bid, or bid on the piece while it's still on the wheel."
          />
          <Step
            n="03"
            title="Collect with provenance"
            body="Every sale issues a numbered Vinci certificate that links the piece to the maker and the stream it was made on."
          />
        </div>
        <div className="mt-12 flex gap-3 flex-wrap">
          {enabledCrafts.map((c) => (
            <Link
              key={c.slug}
              to="/c/$slug"
              params={{ slug: c.slug }}
              className="h-11 inline-flex items-center rounded-md border border-border px-5 text-sm hover:border-primary/60"
            >
              {c.emoji} {c.name}
            </Link>
          ))}
          <Link
            to="/live/new"
            className="h-11 inline-flex items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent"
          >
            Open your studio
          </Link>
        </div>
      </section>
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
