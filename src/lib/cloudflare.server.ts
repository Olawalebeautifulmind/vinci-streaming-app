// Cloudflare Stream Live Inputs. Server-only: the API token never reaches the browser.
// Docs: https://developers.cloudflare.com/stream/stream-live/ and /stream/webrtc-beta/

type LiveInput = {
  uid: string;
  rtmps?: { url: string; streamKey: string };
  webRTC?: { url: string };
  webRTCPlayback?: { url: string };
  status?: unknown;
};

type CfVideo = { uid: string; readyToStream?: boolean; status?: { state?: string } };

function config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  const base = process.env.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4";
  if (!accountId || !token) {
    throw new Error(
      "Live video is not configured yet: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN.",
    );
  }
  return { accountId, token, base };
}

export function isStreamConfigured() {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN);
}

async function cf<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { accountId, token, base } = config();
  const res = await fetch(`${base}/accounts/${accountId}/stream${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => null)) as {
    success?: boolean;
    result?: T;
    errors?: { message: string }[];
  } | null;
  if (!res.ok || !body?.success) {
    const msg = body?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
    throw new Error(`Cloudflare Stream error: ${msg}`);
  }
  return body.result as T;
}

/**
 * Browser broadcasts use WebRTC (WHIP in, WHEP out). Cloudflare cannot record those yet.
 * Streaming-app broadcasts (OBS, Larix) use RTMPS, are recorded, and play back as HLS.
 */
export function createLiveInput(opts: { name: string; streamId: string; record: boolean }) {
  return cf<LiveInput>("/live_inputs", {
    method: "POST",
    headers: { "Idempotency-Key": `${opts.streamId}-${opts.record ? "app" : "browser"}` },
    body: JSON.stringify({
      meta: { name: opts.name, vinci_stream_id: opts.streamId },
      recording: { mode: opts.record ? "automatic" : "off" },
    }),
  });
}

export function getLiveInput(uid: string) {
  return cf<LiveInput>(`/live_inputs/${uid}`);
}

export async function disableLiveInput(uid: string) {
  await cf<LiveInput>(`/live_inputs/${uid}`, {
    method: "PUT",
    body: JSON.stringify({ enabled: false }),
  });
}

export async function latestRecording(uid: string): Promise<string | null> {
  const videos = await cf<CfVideo[]>(`/live_inputs/${uid}/videos`);
  const ready = videos.find((v) => v.readyToStream || v.status?.state === "ready");
  return ready?.uid ?? null;
}

/** Normalises Cloudflare's live input status, which may be a string or { current: { state } }. */
export function connectionState(input: LiveInput): string {
  const s = input.status as string | { current?: { state?: string } } | null | undefined;
  if (!s) return "idle";
  if (typeof s === "string") return s;
  return s.current?.state ?? "idle";
}
