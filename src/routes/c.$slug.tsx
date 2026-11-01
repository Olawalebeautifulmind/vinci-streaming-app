import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCategory, streamsByCategory, categories, type Stream } from "../lib/streams";
import { StreamCard } from "../components/StreamCard";

export const Route = createFileRoute("/c/$slug")({
  component: CategoryPage,
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { category, streams: streamsByCategory(category.slug) };
  },
  head: ({ params }) => {
    const c = getCategory(params.slug);
    const title = c ? `${c.name} live streams — Vinci` : "Category — Vinci";
    const desc = c ? `${c.tagline}. Watch ${c.name.toLowerCase()} artists stream live and bid on originals on Vinci.` : "Vinci live craft category";
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
      <h1 className="font-display text-4xl">Category not found</h1>
      <Link to="/" className="mt-6 inline-block text-primary">Back to Vinci</Link>
    </div>
  ),
});

function CategoryPage() {
  const { category, streams } = Route.useLoaderData();
  const live = streams.length;
  const totalViewers = streams.reduce((n: number, s: { viewers: number }) => n + s.viewers, 0);

  return (
    <div>
      {/* Masthead */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 pt-12 pb-10">
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← All categories</Link>
          <div className="mt-6 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-primary">{category.emoji} Category</div>
              <h1 className="mt-3 font-display text-6xl md:text-7xl leading-[0.9] tracking-tight">{category.name}</h1>
              <p className="mt-4 max-w-xl text-muted-foreground">{category.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-sm">
              <Stat label="Streaming now" value={String(live)} />
              <Stat label="Viewers" value={totalViewers.toLocaleString()} />
              <Stat label="Disciplines" value={String(category.disciplines.length)} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {category.disciplines.map((d: string) => (
              <span key={d} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{d}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Channel feed */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl">Live channels</h2>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{live} streaming</span>
        </div>

        {streams.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <div className="font-display text-xl">No one is streaming {category.name.toLowerCase()} right now.</div>
            <p className="mt-2 text-sm text-muted-foreground">Follow this category and we'll ping you when a studio goes live.</p>
            <button className="mt-5 h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent">
              Follow {category.name}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {streams.map((s: Stream) => <StreamCard key={s.id} stream={s} />)}
          </div>
        )}
      </section>

      {/* Other categories */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="font-display text-2xl mb-6">Browse other disciplines</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.filter(c => c.slug !== category.slug).map(c => (
              <Link key={c.slug} to="/c/$slug" params={{ slug: c.slug }}
                className="group rounded-lg border border-border p-4 hover:border-primary/60 transition-colors">
                <div className="text-2xl">{c.emoji}</div>
                <div className="mt-2 font-display text-base group-hover:text-primary transition-colors">{c.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{streamsByCategory(c.slug).length} live</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}
