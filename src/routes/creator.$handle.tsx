import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getCraft } from "@/lib/crafts";
import { getProfileByHandle, listStreams, listWorks, useLoad } from "@/lib/data";
import { artistId, memberId, timeAgo } from "@/lib/format";
import { Avatar, StreamCard, VerifiedBadge } from "@/components/StreamCard";
import { WorkCard } from "@/components/works";
import { FollowButton } from "@/components/FollowButton";

export const Route = createFileRoute("/creator/$handle")({
  component: CreatorProfile,
  loader: async ({ params }) => {
    const profile = await getProfileByHandle(params.handle).catch(() => null);
    if (!profile) throw notFound();
    return { profile };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const t = p ? `${p.display_name ?? p.handle} · Vinci` : "Creator · Vinci";
    return {
      meta: [
        { title: t },
        { name: "description", content: p?.bio ?? "Handmade creator on Vinci." },
        { property: "og:title", content: t },
        { property: "og:type", content: "profile" },
        ...(p?.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <h1 className="font-display text-3xl">No maker with that handle</h1>
      <Link to="/" className="mt-6 inline-block text-primary">
        Back to Vinci
      </Link>
    </div>
  ),
});

function CreatorProfile() {
  const { profile } = Route.useLoaderData();
  const live = useLoad(() => listStreams({ creatorId: profile.id, status: "live" }), [profile.id]);
  const past = useLoad(
    () => listStreams({ creatorId: profile.id, status: "ended", limit: 6 }),
    [profile.id],
  );
  const works = useLoad(() => listWorks({ creatorId: profile.id }), [profile.id]);
  const stats = useLoad(
    async () => (await supabase.rpc("user_stats", { _user: profile.id })).data?.[0] ?? null,
    [profile.id],
  );
  const posts = useLoad(
    async () =>
      (
        await supabase
          .from("posts")
          .select("*")
          .eq("author_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(12)
      ).data ?? [],
    [profile.id],
  );

  const craft = getCraft(profile.crafts[0]);
  const list = works.data ?? [];
  const collected = list.reduce((n, w) => n + w.editions_sold, 0);
  const available = list.filter((w) => w.status === "available").length;
  const location = [profile.city, profile.country_code].filter(Boolean).join(", ");

  return (
    <div>
      <section
        className="relative border-b border-border/60 overflow-hidden"
        style={{
          background: `radial-gradient(80% 60% at 20% 0%, ${craft?.accent ?? "#c9a84c"}22 0%, transparent 60%), ${craft?.base ?? "#1a1208"}`,
        }}
      >
        <div className="absolute inset-0 noise opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <div className="grid md:grid-cols-[auto_1fr_auto] gap-8 items-start">
            <Avatar profile={profile} className="h-28 w-28 md:h-36 md:w-36 text-4xl" />
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-widest text-primary">
                {profile.is_creator
                  ? artistId(profile.member_no, profile.country_code)
                  : memberId(profile.member_no)}
              </div>
              <h1 className="mt-2 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
                {profile.display_name ?? profile.handle}
                {profile.verified && (
                  <span className="ml-3 inline-flex align-middle">
                    <VerifiedBadge />
                  </span>
                )}
              </h1>
              <div className="mt-2 text-sm text-muted-foreground">@{profile.handle}</div>
              {profile.bio && (
                <p className="mt-5 max-w-2xl text-base text-foreground/90 leading-relaxed">
                  {profile.bio}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.crafts.map((c: string) => {
                  const cr = getCraft(c);
                  return cr ? (
                    <Link
                      key={c}
                      to="/c/$slug"
                      params={{ slug: c }}
                      className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary/60"
                    >
                      {cr.emoji} {cr.name}
                    </Link>
                  ) : null;
                })}
              </div>
            </div>
            <FollowButton creatorId={profile.id} />
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-px bg-border/60 border border-border/60 rounded-lg overflow-hidden text-sm">
            <Stat label="Location" value={location || "—"} />
            <Stat label="Followers" value={String(stats.data?.followers ?? 0)} />
            <Stat
              label="Streams"
              value={String(stats.data?.streams_hosted ?? 0)}
              sub={`${stats.data?.minutes_streamed ?? 0} min live`}
            />
            <Stat
              label="Works"
              value={String(list.length)}
              sub={`${collected} collected · ${available} available`}
            />
            <Stat
              label="Versus wins"
              value={String(stats.data?.versus_wins ?? 0)}
              sub={`${stats.data?.xp ?? 0} XP`}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 space-y-16">
        {(live.data?.length ?? 0) > 0 && (
          <section>
            <h2 className="font-display text-2xl md:text-3xl mb-6">Live now</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {live.data!.map((s) => (
                <StreamCard key={s.id} stream={s} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="text-[11px] uppercase tracking-widest text-primary">
            Artistic Ownership Registry
          </div>
          <h2 className="mt-1 font-display text-2xl md:text-3xl mb-6">Works</h2>
          {list.length === 0 ? (
            <div className="text-sm text-muted-foreground">No works listed yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((w) => (
                <WorkCard key={w.id} work={w} onChanged={() => void works.reload()} />
              ))}
            </div>
          )}
        </section>

        {(posts.data?.length ?? 0) > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-6">Posts</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.data!.map((p) => (
                <article
                  key={p.id}
                  className="rounded-lg border border-border overflow-hidden bg-card"
                >
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
                  )}
                  <div className="p-4">
                    <p className="text-sm whitespace-pre-line">{p.body}</p>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                      {timeAgo(p.created_at)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {(past.data?.length ?? 0) > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-6">Past streams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {past.data!.map((s) => (
                <StreamCard key={s.id} stream={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-background p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-base truncate">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
    </div>
  );
}
