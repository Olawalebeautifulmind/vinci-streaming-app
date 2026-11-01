import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getCraft } from "@/lib/crafts";
import { getStream, useLoad, useRealtime, type Stream } from "@/lib/data";
import { endStream, goLive, ingestStatus, provisionIngest } from "@/lib/live.functions";
import { publishWhip, type Session } from "@/lib/webrtc";
import { friendlyError, timeAgo } from "@/lib/format";
import { LivePill } from "@/components/StreamCard";
import {
  ChatPanel,
  CommissionsPanel,
  Reactions,
  StreamWorks,
  useStreamRoom,
} from "@/components/stream-panels";

export const Route = createFileRoute("/studio/$id")({
  component: Studio,
  head: () => ({ meta: [{ title: "Studio · Vinci" }, { name: "robots", content: "noindex" }] }),
});

type Creds = Awaited<ReturnType<typeof provisionIngest>>;

function Studio() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const s = useLoad(() => getStream(id), [id]);
  useRealtime("streams", `id=eq.${id}`, (p) =>
    s.setData((cur) => (cur ? { ...cur, ...(p.new as Stream) } : cur)),
  );

  useEffect(() => {
    if (!authLoading && !user)
      navigate({ to: "/auth", search: { mode: "signin", redirect: `/studio/${id}` } });
  }, [authLoading, user, id, navigate]);

  if (s.loading || authLoading)
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="h-96 rounded-lg bg-card animate-pulse" />
      </div>
    );
  const stream = s.data;
  if (!stream || stream.creator_id !== user?.id) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Studio not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only the creator of a stream can open its studio.
        </p>
        <Link to="/live/new" className="mt-6 inline-block text-primary">
          Set up a new stream
        </Link>
      </div>
    );
  }
  return <StudioInner stream={stream} reload={s.reload} />;
}

function StudioInner({ stream, reload }: { stream: Stream; reload: () => Promise<void> }) {
  const craft = getCraft(stream.craft);
  const [mode, setMode] = useState<"browser" | "app">(stream.ingest as "browser" | "app");
  const [creds, setCreds] = useState<Creds | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const room = useStreamRoom(stream.id, "creator");

  // Browser broadcast state
  const preview = useRef<HTMLVideoElement>(null);
  const [media, setMedia] = useState<MediaStream | null>(null);
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [camId, setCamId] = useState<string>("");
  const session = useRef<Session | null>(null);
  const [rtc, setRtc] = useState<string>("idle");
  const [appState, setAppState] = useState("idle");
  const [showKey, setShowKey] = useState(false);

  const ended = stream.status === "ended";
  const live = stream.status === "live";
  const connected =
    mode === "browser" ? rtc === "connected" : ["connected", "reconnected"].includes(appState);

  // Camera preview
  useEffect(() => {
    if (mode !== "browser" || ended) return;
    let cancelled = false;
    (async () => {
      try {
        const m = await navigator.mediaDevices.getUserMedia({
          video: camId
            ? { deviceId: { exact: camId }, width: 1280, height: 720 }
            : { width: 1280, height: 720 },
          audio: true,
        });
        if (cancelled) return m.getTracks().forEach((t) => t.stop());
        setMedia((old) => {
          old?.getTracks().forEach((t) => t.stop());
          return m;
        });
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCams(devices.filter((d) => d.kind === "videoinput"));
      } catch (e) {
        setErr(
          `Camera unavailable: ${e instanceof Error ? e.message : e}. Allow camera and microphone access, or use a streaming app.`,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, camId, ended]);

  useEffect(() => {
    if (preview.current && media) preview.current.srcObject = media;
  }, [media]);

  // Release camera on leave
  useEffect(
    () => () => {
      void session.current?.stop();
      media?.getTracks().forEach((t) => t.stop());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  // Heartbeat keeps the stream listed as live
  useEffect(() => {
    if (!live) return;
    const beat = () => void supabase.rpc("stream_heartbeat", { _stream: stream.id });
    beat();
    const t = setInterval(beat, 30_000);
    return () => clearInterval(t);
  }, [live, stream.id]);

  // Poll the streaming-app connection
  useEffect(() => {
    if (mode !== "app" || !creds?.configured || ended) return;
    const poll = async () => {
      try {
        setAppState((await ingestStatus({ data: { streamId: stream.id } })).state);
      } catch {
        /* ignore transient errors */
      }
    };
    void poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [mode, creds, ended, stream.id]);

  const prepare = async (m: "browser" | "app") => {
    setBusy(true);
    setErr(null);
    try {
      const c = await provisionIngest({ data: { streamId: stream.id, ingest: m } });
      setCreds(c);
      await reload();
      return c;
    } catch (e) {
      setErr(friendlyError(e));
      return null;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!ended && mode === "app") void prepare("app");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const connectBrowser = async () => {
    if (!media) return setErr("Turn on your camera first.");
    const c = await prepare("browser");
    if (!c?.configured || !c.whipUrl) return;
    setBusy(true);
    try {
      await session.current?.stop();
      setRtc("connecting");
      const sess = await publishWhip(c.whipUrl, media);
      session.current = sess;
      sess.pc.addEventListener("connectionstatechange", () => setRtc(sess.pc.connectionState));
    } catch (e) {
      setRtc("failed");
      setErr(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    setBusy(true);
    setErr(null);
    try {
      await goLive({ data: { streamId: stream.id } });
      await reload();
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (!confirmEnd()) return;
    setBusy(true);
    try {
      await endStream({ data: { streamId: stream.id } });
      await session.current?.stop();
      media?.getTracks().forEach((t) => t.stop());
      setMedia(null);
      await reload();
    } catch (e) {
      setErr(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">
            Studio · {craft?.emoji} {craft?.name}
          </div>
          <h1 className="font-display text-2xl md:text-3xl">{stream.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {live && <LivePill />}
          <span className="text-xs text-muted-foreground">
            {live
              ? `Live ${timeAgo(stream.started_at)} · ${room.viewers} watching`
              : ended
                ? `Ended ${timeAgo(stream.ended_at)}`
                : "Not live yet"}
          </span>
          {stream.status !== "setup" && (
            <Link
              to="/stream/$id"
              params={{ id: stream.id }}
              className="h-9 inline-flex items-center rounded-md border border-border px-3 text-xs hover:border-primary/60"
            >
              Viewer page ↗
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
            {mode === "browser" && !ended ? (
              <video
                ref={preview}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm text-white/70 px-6 text-center">
                {ended
                  ? "This stream has ended."
                  : connected
                    ? "Your streaming app is connected."
                    : "Waiting for your streaming app to connect…"}
              </div>
            )}
            <Reactions reactions={room.reactions} />
            <div className="absolute top-3 left-3 rounded-sm bg-black/70 px-2 py-1 text-[11px] text-white/90">
              {mode === "browser" ? `Camera → Vinci: ${rtc}` : `Streaming app: ${appState}`}
            </div>
          </div>

          {!ended && (
            <div className="rounded-lg border border-border bg-card/40 p-5 space-y-4">
              <div className="flex gap-2">
                {(["browser", "app"] as const).map((m) => (
                  <button
                    key={m}
                    disabled={live}
                    onClick={() => setMode(m)}
                    className={`h-9 rounded-md px-4 text-xs border ${mode === m ? "border-primary bg-primary/10 text-primary" : "border-border"} disabled:opacity-50`}
                  >
                    {m === "browser" ? "Broadcast from this browser" : "Use OBS / a streaming app"}
                  </button>
                ))}
              </div>

              {creds && !creds.configured && (
                <div className="rounded-md border border-destructive/50 p-3 text-xs">
                  Live video isn't configured on this server yet. An admin needs to set{" "}
                  <code>CLOUDFLARE_ACCOUNT_ID</code> and <code>CLOUDFLARE_STREAM_API_TOKEN</code>.
                </div>
              )}

              {mode === "browser" ? (
                <div className="space-y-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    Lowest latency, nothing to install. Browser broadcasts aren't recorded yet; use
                    a streaming app if you want a replay.
                  </p>
                  {cams.length > 1 && (
                    <select
                      value={camId}
                      onChange={(e) => setCamId(e.target.value)}
                      className="h-9 rounded-md border border-border bg-background px-3 text-xs"
                    >
                      {cams.map((c) => (
                        <option key={c.deviceId} value={c.deviceId}>
                          {c.label || "Camera"}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    disabled={busy || !media || rtc === "connected"}
                    onClick={connectBrowser}
                    className="h-9 rounded-md border border-primary/60 px-4 text-xs text-primary disabled:opacity-50"
                  >
                    {rtc === "connected"
                      ? "Camera connected ✓"
                      : rtc === "connecting"
                        ? "Connecting…"
                        : "Connect camera to Vinci"}
                  </button>
                </div>
              ) : (
                creds?.configured && (
                  <div className="space-y-2 text-xs">
                    <p className="text-muted-foreground">
                      In OBS: Settings → Stream → Service "Custom". Paste the server and stream key
                      below. This broadcast is recorded for replay.
                    </p>
                    <CopyRow label="Server" value={creds.rtmpsUrl ?? ""} />
                    <CopyRow label="Stream key" value={creds.streamKey ?? ""} secret={!showKey} />
                    <button onClick={() => setShowKey((v) => !v)} className="text-primary">
                      {showKey ? "Hide key" : "Show key"}
                    </button>
                    <p className="text-muted-foreground">
                      Keep the stream key private. Anyone with it can broadcast to your stream.
                    </p>
                  </div>
                )
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                {!live ? (
                  <button
                    disabled={busy || !connected}
                    onClick={start}
                    className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    Go live
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    onClick={stop}
                    className="h-10 rounded-md bg-destructive px-6 text-sm font-medium text-white disabled:opacity-50"
                  >
                    End stream
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {live
                    ? "Keep this tab open while you're live."
                    : connected
                      ? "Video is reaching Vinci. Go live when you're ready."
                      : "Connect your video first."}
                </span>
              </div>
              {err && <div className="text-sm text-destructive">{err}</div>}
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-5">
            <StreamWorks stream={stream} isCreator />
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <CommissionsPanel stream={stream} isCreator />
          </div>
        </div>
        <ChatPanel stream={stream} viewers={room.viewers} className="lg:sticky lg:top-20" />
      </div>
    </div>
  );
}

function confirmEnd() {
  // Simple inline confirm without a blocking browser dialog would need a modal; keep it explicit.
  return typeof window === "undefined"
    ? false
    : window.confirm("End the stream for everyone? Open auctions on this stream will close.");
}

function CopyRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <code className="flex-1 truncate rounded bg-background px-2 py-1.5 font-mono">
        {secret ? "•".repeat(24) : value}
      </code>
      <button
        onClick={() => navigator.clipboard.writeText(value)}
        className="h-7 rounded-md border border-border px-2"
      >
        Copy
      </button>
    </div>
  );
}
