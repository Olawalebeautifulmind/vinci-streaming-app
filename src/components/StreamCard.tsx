import { Link } from "@tanstack/react-router";
import type { Stream } from "../lib/streams";

export function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-destructive/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
      <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" /> Live
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span title="Verified artist" className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">✓</span>
  );
}

export function StreamThumb({ stream, className = "" }: { stream: Stream; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ background: `radial-gradient(120% 80% at 30% 20%, ${stream.thumbAccent}33 0%, transparent 60%), ${stream.thumbColor}` }}
    >
      <div className="absolute inset-0 noise" />
      <div className="absolute inset-0 flex items-end p-3">
        <span className="font-display text-3xl md:text-5xl leading-none tracking-tight" style={{ color: stream.thumbAccent }}>
          {stream.craft}
        </span>
      </div>
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <LivePill />
        <span className="rounded-sm bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">{stream.viewers.toLocaleString()} watching</span>
      </div>
      <div className="absolute bottom-3 right-3 rounded-sm bg-black/70 px-2 py-1 text-[11px] text-primary font-medium">
        {stream.currentBidCowries.toLocaleString()} 🐚
      </div>
    </div>
  );
}

export function StreamCard({ stream, size = "md" }: { stream: Stream; size?: "sm" | "md" | "lg" }) {
  const aspect = size === "lg" ? "aspect-[16/10]" : size === "sm" ? "aspect-[4/3]" : "aspect-video";
  return (
    <div className="group block">
      <Link to="/stream/$id" params={{ id: stream.id }} className="block">
        <StreamThumb stream={stream} className={aspect} />
      </Link>
      <div className="mt-3 flex items-start gap-3">
        <Link
          to="/creator/$handle"
          params={{ handle: stream.creator.handle }}
          className="h-9 w-9 rounded-full shrink-0 hover:ring-2 hover:ring-primary/60 transition"
          style={{ background: stream.creator.avatar }}
          aria-label={`${stream.creator.name} profile`}
        />
        <div className="min-w-0">
          <Link to="/stream/$id" params={{ id: stream.id }} className="block">
            <h3 className="font-display text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {stream.title}
            </h3>
          </Link>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              to="/creator/$handle"
              params={{ handle: stream.creator.handle }}
              className="truncate hover:text-foreground"
            >
              {stream.creator.name}
            </Link>
            {stream.creator.verified && <VerifiedBadge />}
            <span>·</span>
            <span className="truncate">{stream.creator.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
