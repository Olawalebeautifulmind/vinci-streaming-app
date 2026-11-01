import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { crafts, getCraft } from "@/lib/crafts";
import { listStreams, listWorks, useLoad } from "@/lib/data";
import { StreamCard, EmptyState } from "@/components/StreamCard";
import { WorkCard } from "@/components/works";

export const Route = createFileRoute("/c/$slug")({
  component: CategoryPage,
  loader: ({ params }) => {
    const craft = getCraft(params.slug);
    if (!craft) throw notFound();
    return { craft };
  },
  head: ({ params }) => {
    const c = getCraft(params.slug);
    const title = c ? `${c.name} live streams — Vinci` : "Craft — Vinci";
    const desc = c
      ? `${c.tagline}. Watch ${c.name.toLowerCase()} makers stream live and bid on originals on Vinci.`
      : "Vinci craft";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="font-display text-4xl">Craft not found</h1>
      <Link to="/" className="mt-6 inline-block text-primary">
        Back to Vinci
      </Link>
    </div>
  ),
});

function CategoryPage() {
  const { craft } = Route.useLoaderData();
  const live = useLoad(
    () =>
      craft.enabled ? listStreams({ craft: craft.slug, status: "live" }) : Promise.resolve([]),
    [craft.slug],
  );
  const past = useLoad(
    () =>
      craft.enabled
        ? listStreams({ craft: craft.slug, status: "ended", limit: 6 })
        : Promise.resolve([]),
    [craft.slug],
  );
  const works = useLoad(
    async () =>
      craft.enabled
        ? (await listWorks({ status: ["available"], limit: 60 })).filter(
            (w) => w.craft === craft.slug,
          )
        : [],
    [craft.slug],
  );

  return (
    <div>
      <section
        className="border-b border-border/60"
        style={{
          background: `radial-gradient(80% 60% at 20% 0%, ${craft.accent}22 0%, transparent 60%)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 pt-12 pb-10">
          <Link
            to="/"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← All crafts
          </Link>
          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.25em] text-primary">
              {craft.emoji} Craft
            </div>
            <h1 className="mt-3 font-display text-6xl md:text-7xl leading-[0.9] tracking-tight">
              {craft.name}
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              {craft.enabled ? craft.description : "Coming soon to Vinci."}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {craft.disciplines.map((d) => (
              <span
                key={d}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {craft.enabled ? (
        <>
          <section className="mx-auto max-w-7xl px-6 py-14">
            <h2 className="font-display text-2xl mb-6">Live channels</h2>
            {live.loading ? (
              <div className="h-40 rounded-lg bg-card animate-pulse" />
            ) : live.data!.length === 0 ? (
              <EmptyState
                title={`No one is streaming ${craft.name.toLowerCase()} right now.`}
                body="Check back soon, or start your own stream."
              >
                <Link
                  to="/live/new"
                  search={{ craft: craft.slug }}
                  className="h-10 inline-flex items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent"
                >
                  Go live in {craft.name}
                </Link>
              </EmptyState>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {live.data!.map((s) => (
                  <StreamCard key={s.id} stream={s} />
                ))}
              </div>
            )}
          </section>
          {(works.data?.length ?? 0) > 0 && (
            <section className="mx-auto max-w-7xl px-6 pb-14">
              <h2 className="font-display text-2xl mb-6">Pieces for sale</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {works.data!.map((w) => (
                  <WorkCard key={w.id} work={w} onChanged={() => void works.reload()} />
                ))}
              </div>
            </section>
          )}
          {(past.data?.length ?? 0) > 0 && (
            <section className="mx-auto max-w-7xl px-6 pb-14">
              <h2 className="font-display text-2xl mb-6">Recent streams</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {past.data!.map((s) => (
                  <StreamCard key={s.id} stream={s} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="mx-auto max-w-7xl px-6 py-14">
          <EmptyState
            title={`${craft.name} is coming soon.`}
            body="Vinci is launching with Bead Making and Pottery first."
          />
        </section>
      )}

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="font-display text-2xl mb-6">Other crafts</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {crafts
              .filter((c) => c.slug !== craft.slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className={`group rounded-lg border border-border p-4 hover:border-primary/60 ${c.enabled ? "" : "opacity-60"}`}
                >
                  <div className="text-2xl">{c.emoji}</div>
                  <div className="mt-2 font-display text-base group-hover:text-primary">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {c.enabled ? "Live" : "Coming soon"}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
