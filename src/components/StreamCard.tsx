import { Link } from "@tanstack/react-router";
import { getCraft } from "@/lib/crafts";
import { displayName, type PublicProfile, type StreamWithCreator } from "@/lib/data";
import { timeAgo } from "@/lib/format";

export function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-destructive/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> Live
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span
      title="Verified artist"
      className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold"
    >
      ✓
    </span>
  );
}

export function Avatar({
  profile,
  className = "h-9 w-9",
}: {
  profile: Pick<PublicProfile, "avatar_url" | "display_name" | "handle"> | null | undefined;
  className?: string;
}) {
  const initial = displayName(profile).replace("@", "").charAt(0).toUpperCase();
  return (
    <span
      className={`grid place-items-center rounded-full shrink-0 overflow-hidden border border-border bg-card font-display text-xs ${className}`}
    >
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

export function StreamThumb({
  stream,
  className = "",
}: {
  stream: StreamWithCreator;
  className?: string;
}) {
  const craft = getCraft(stream.craft);
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        background: `radial-gradient(120% 80% at 30% 20%, ${craft?.accent ?? "#c9a84c"}33 0%, transparent 60%), ${craft?.base ?? "#1a1208"}`,
      }}
    >
      {stream.cover_url ? (
        <img
          src={stream.cover_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 noise" />
          <div className="absolute inset-0 flex items-end p-3">
            <span
              className="font-display text-3xl md:text-4xl leading-none tracking-tight"
              style={{ color: craft?.accent }}
            >
              {stream.discipline || craft?.name}
            </span>
          </div>
        </>
      )}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        {stream.status === "live" ? (
          <LivePill />
        ) : (
          <span className="rounded-sm bg-black/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/90">
            {stream.replay_video_id ? "Replay" : "Ended"}
          </span>
        )}
        <span className="rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">
          {craft?.emoji} {craft?.name}
        </span>
      </div>
    </div>
  );
}

export function StreamCard({ stream }: { stream: StreamWithCreator }) {
  const handle = stream.creator?.handle;
  return (
    <div className="group block">
      <Link to="/stream/$id" params={{ id: stream.id }} className="block">
        <StreamThumb stream={stream} className="aspect-video" />
      </Link>
      <div className="mt-3 flex items-start gap-3">
        {handle ? (
          <Link
            to="/creator/$handle"
            params={{ handle }}
            aria-label={`${displayName(stream.creator)} profile`}
          >
            <Avatar profile={stream.creator} />
          </Link>
        ) : (
          <Avatar profile={stream.creator} />
        )}
        <div className="min-w-0">
          <Link to="/stream/$id" params={{ id: stream.id }} className="block">
            <h3 className="font-display text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {stream.title}
            </h3>
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{displayName(stream.creator)}</span>
            {stream.creator?.verified && <VerifiedBadge />}
            {stream.creator?.city && <span className="truncate">· {stream.creator.city}</span>}
            <span>
              ·{" "}
              {stream.status === "live"
                ? `started ${timeAgo(stream.started_at)}`
                : timeAgo(stream.ended_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="font-display text-xl">{title}</div>
      {body && <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{body}</p>}
      {children && <div className="mt-5 flex justify-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
