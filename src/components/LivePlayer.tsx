import { useEffect, useRef, useState } from "react";
import { playWhep, streamHost } from "@/lib/webrtc";
import type { Stream } from "@/lib/data";

/**
 * Plays a Vinci stream:
 * - live browser broadcasts over WebRTC (WHEP),
 * - live streaming-app broadcasts and recordings with the Cloudflare Stream player.
 */
export function LivePlayer({
  stream,
  replayVideoId,
}: {
  stream: Stream;
  replayVideoId?: string | null;
}) {
  const host = streamHost(stream.whep_url);

  if (stream.status === "live" && stream.ingest === "browser" && stream.whep_url) {
    return <WhepVideo url={stream.whep_url} />;
  }
  if (host && stream.status === "live" && stream.ingest === "app" && stream.cf_live_input_id) {
    return (
      <CfIframe
        src={`https://${host}/${stream.cf_live_input_id}/iframe?autoplay=true&muted=true`}
      />
    );
  }
  const replay = replayVideoId ?? stream.replay_video_id;
  if (host && stream.status === "ended" && replay) {
    return <CfIframe src={`https://${host}/${replay}/iframe`} />;
  }
  return (
    <Placeholder>
      {stream.status === "ended"
        ? stream.ingest === "browser"
          ? "This stream has ended. Browser broadcasts are not recorded yet."
          : "This stream has ended. The replay appears here once it has processed."
        : "Waiting for the creator's video…"}
    </Placeholder>
  );
}

function CfIframe({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      className="absolute inset-0 h-full w-full border-0"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      title="Live stream"
    />
  );
}

function WhepVideo({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"connecting" | "playing" | "failed">("connecting");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stop: (() => Promise<void>) | null = null;
    let cancelled = false;
    (async () => {
      try {
        setState("connecting");
        const s = await playWhep(url, ref.current!);
        if (cancelled) return void s.stop();
        stop = s.stop;
        s.pc.addEventListener("connectionstatechange", () => {
          if (s.pc.connectionState === "connected") setState("playing");
          if (s.pc.connectionState === "failed" || s.pc.connectionState === "disconnected")
            setState("failed");
        });
      } catch {
        if (!cancelled) setState("failed");
      }
    })();
    return () => {
      cancelled = true;
      void stop?.();
    };
  }, [url, attempt]);

  // Retry while the creator's camera is still connecting.
  useEffect(() => {
    if (state !== "failed") return;
    const t = setTimeout(() => setAttempt((a) => a + 1), 4000);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        controls
        className="absolute inset-0 h-full w-full bg-black object-contain"
      />
      {state !== "playing" && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <span className="rounded-sm bg-black/70 px-3 py-1.5 text-xs text-white/80">
            {state === "connecting" ? "Connecting to the studio…" : "Reconnecting…"}
          </span>
        </div>
      )}
    </>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="absolute inset-0 noise" />
      <p className="relative max-w-sm text-center text-sm text-white/70 px-6">{children}</p>
    </div>
  );
}
