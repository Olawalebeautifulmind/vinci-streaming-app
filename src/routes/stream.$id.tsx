import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getCraft, FORMATS } from "@/lib/crafts";
import {
  displayName,
  getStream,
  listStreams,
  useLoad,
  useRealtime,
  type Battle,
  type Stream,
} from "@/lib/data";
import { syncReplay } from "@/lib/live.functions";
import { timeAgo } from "@/lib/format";
import { LivePill, VerifiedBadge, StreamCard, Avatar } from "@/components/StreamCard";
import { LivePlayer } from "@/components/LivePlayer";
import {
  ChatPanel,
  CommissionsPanel,
  GiftBar,
  Reactions,
  REACTION_EMOJI,
  StreamWorks,
  useStreamRoom,
} from "@/components/stream-panels";
import { FollowButton } from "@/components/FollowButton";
import { BattleCard } from "@/components/BattleCard";

export const Route = createFileRoute("/stream/$id")({
  component: StreamView,
  loader: async ({ params }) => {
    const stream = await getStream(params.id).catch(() => null);
    if (!stream) throw notFound();
    return { stream };
  },
  head: ({ loaderData }) => {
    const t = `${loaderData?.stream.title ?? "Live stream"} — Vinci`;
    const d = loaderData?.stream.description ?? "Watch a handmade piece being made live on Vinci.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "video.other" },
        ...(loaderData?.stream.cover_url
          ? [{ property: "og:image", content: loaderData.stream.cover_url }]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-32 text-center">
      <h1 className="font-display text-4xl">Stream not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It may not have started yet, or the link is wrong.
      </p>
      <Link to="/" className="mt-6 inline-block text-primary">
        See who's live
      </Link>
    </div>
  ),
});

function StreamView() {
  const initial = Route.useLoaderData().stream;
  const { user } = useAuth();
  const [stream, setStream] = useState(initial);
  const [replay, setReplay] = useState<string | null>(initial.replay_video_id);
  const [tab, setTab] = useState<"sales" | "bids" | "versus">("sales");
  const room = useStreamRoom(stream.id, user?.id === stream.creator_id ? "creator" : "viewer");
  const craft = getCraft(stream.craft);
  const creator = stream.creator;

  useEffect(() => setStream(initial), [initial]);
  useRealtime("streams", `id=eq.${initial.id}`, (p) =>
    setStream((cur) => ({ ...cur, ...(p.new as Stream) })),
  );

  useEffect(() => {
    if (stream.status === "ended" && stream.ingest === "app" && !replay) {
      syncReplay({ data: { streamId: stream.id } })
        .then((r) => setReplay(r.replayVideoId))
        .catch(() => {});
    }
  }, [stream.status, stream.ingest, stream.id, replay]);

  const battles = useLoad(async () => {
    const { data } = await supabase
      .from("versus_battles")
      .select("*")
      .or(`challenger_id.eq.${stream.creator_id},opponent_id.eq.${stream.creator_id}`)
      .in("status", ["live", "ended"])
      .order("created_at", { ascending: false })
      .limit(3);
    return (data ?? []) as Battle[];
  }, [stream.creator_id]);

  const more = useLoad(
    async () =>
      (await listStreams({ status: "live", limit: 4 }))
        .filter((s) => s.id !== stream.id)
        .slice(0, 3),
    [stream.id],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
      <Link
        to="/"
        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← Back to live
      </Link>
      {user?.id === stream.creator_id && (
        <Link
          to="/studio/$id"
          params={{ id: stream.id }}
          className="ml-4 text-xs uppercase tracking-widest text-primary"
        >
          Open your studio →
        </Link>
      )}

      <div className="mt-4 grid lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/80 bg-black">
            <LivePlayer stream={stream} replayVideoId={replay} />
            <Reactions reactions={room.reactions} />
            <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
              {stream.status === "live" ? (
                <LivePill />
              ) : (
                <span className="rounded-sm bg-black/70 px-2 py-0.5 text-[11px] text-white/90">
                  {replay ? "Replay" : "Ended"}
                </span>
              )}
              {stream.status === "live" && (
                <>
                  <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[11px] text-white/90">
                    {room.viewers.toLocaleString()} watching
                  </span>
                  <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[11px] text-white/90">
                    Started {timeAgo(stream.started_at)}
                  </span>
                </>
              )}
            </div>
          </div>

          {stream.status === "live" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground mr-1">
                React
              </span>
              {REACTION_EMOJI.map((e) => (
                <button
                  key={e}
                  onClick={() => room.react(e)}
                  className="h-8 w-8 rounded-sm border border-border text-base hover:border-primary/60"
                  aria-label={`React ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {creator?.handle ? (
                <Link to="/creator/$handle" params={{ handle: creator.handle }}>
                  <Avatar profile={creator} className="h-14 w-14" />
                </Link>
              ) : (
                <Avatar profile={creator} className="h-14 w-14" />
              )}
              <div>
                <h1 className="font-display text-2xl md:text-3xl leading-tight">{stream.title}</h1>
                <div className="mt-1 text-sm flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{displayName(creator)}</span>
                  {creator?.verified && <VerifiedBadge />}
                  {creator?.handle && (
                    <span className="text-muted-foreground">· @{creator.handle}</span>
                  )}
                  {creator?.city && <span className="text-muted-foreground">· {creator.city}</span>}
                </div>
              </div>
            </div>
            <FollowButton creatorId={stream.creator_id} />
          </div>

          <div className="mt-5 rounded-lg border border-border bg-card/40 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <TagBlock label="Craft" value={`${craft?.emoji} ${craft?.name}`} />
              <TagBlock label="Discipline" value={stream.discipline ?? "—"} />
              <TagBlock label="Difficulty" value={stream.difficulty ?? "—"} />
              <TagBlock
                label="Format"
                value={FORMATS.find((f) => f.slug === stream.format)?.label ?? "—"}
              />
            </div>
            {stream.materials.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground self-center">
                  Materials
                </span>
                {stream.materials.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
            {stream.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {stream.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex border-b border-border text-sm overflow-x-auto">
              {(
                [
                  { id: "sales", label: "Auction & marketplace" },
                  { id: "bids", label: "Creation bids" },
                  { id: "versus", label: "Versus" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3 -mb-px border-b-2 whitespace-nowrap ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-5 space-y-6">
              {tab === "sales" && (
                <>
                  <GiftBar stream={stream} />
                  <StreamWorks stream={stream} isCreator={user?.id === stream.creator_id} />
                </>
              )}
              {tab === "bids" && (
                <CommissionsPanel stream={stream} isCreator={user?.id === stream.creator_id} />
              )}
              {tab === "versus" &&
                ((battles.data?.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {displayName(creator)} isn't in a Versus battle right now.{" "}
                    <Link to="/versus" className="text-primary">
                      See all battles
                    </Link>
                  </div>
                ) : (
                  battles.data!.map((b) => (
                    <BattleCard key={b.id} battle={b} onChanged={() => void battles.reload()} />
                  ))
                ))}
            </div>
          </div>

          {stream.description && (
            <div className="mt-6 rounded-lg border border-border p-5">
              <h3 className="font-display text-lg">About this stream</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {stream.description}
              </p>
            </div>
          )}
        </div>

        <ChatPanel
          stream={stream}
          viewers={room.viewers}
          onReact={stream.status === "live" ? room.react : undefined}
          className="lg:sticky lg:top-20 h-[640px]"
        />
      </div>

      {(more.data?.length ?? 0) > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl mb-6">More live now</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {more.data!.map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
        </section>
      )}
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
