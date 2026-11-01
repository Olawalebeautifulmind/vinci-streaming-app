import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  connectionState,
  createLiveInput,
  disableLiveInput,
  getLiveInput,
  isStreamConfigured,
  latestRecording,
} from "./cloudflare.server";

const streamInput = z.object({ streamId: z.string().uuid() });

async function ownStream(userId: string, streamId: string) {
  const { data, error } = await supabaseAdmin
    .from("streams")
    .select("*")
    .eq("id", streamId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.creator_id !== userId) throw new Error("Stream not found");
  return data;
}

/** Creates (or reuses) a Cloudflare live input and returns the creator's ingest credentials. */
export const provisionIngest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ streamId: z.string().uuid(), ingest: z.enum(["browser", "app"]) }))
  .handler(async ({ data, context }) => {
    const stream = await ownStream(context.userId, data.streamId);
    if (stream.status === "ended") throw new Error("This stream has ended");
    if (!isStreamConfigured()) {
      return { configured: false as const };
    }
    let secrets = (
      await supabaseAdmin
        .from("stream_secrets")
        .select("*")
        .eq("stream_id", stream.id)
        .maybeSingle()
    ).data;
    if (!stream.cf_live_input_id || stream.ingest !== data.ingest || !secrets) {
      if (stream.status === "live")
        throw new Error("End the stream before switching broadcast method");
      const input = await createLiveInput({
        name: stream.title,
        streamId: stream.id,
        record: data.ingest === "app",
      });
      secrets = {
        stream_id: stream.id,
        whip_url: input.webRTC?.url ?? null,
        rtmps_url: input.rtmps?.url ?? null,
        stream_key: input.rtmps?.streamKey ?? null,
        created_at: new Date().toISOString(),
      };
      const up = await supabaseAdmin.from("stream_secrets").upsert(secrets);
      if (up.error) throw new Error(up.error.message);
      const st = await supabaseAdmin
        .from("streams")
        .update({
          cf_live_input_id: input.uid,
          ingest: data.ingest,
          whep_url: input.webRTCPlayback?.url ?? null,
        })
        .eq("id", stream.id);
      if (st.error) throw new Error(st.error.message);
    }
    return {
      configured: true as const,
      ingest: data.ingest,
      whipUrl: secrets.whip_url,
      rtmpsUrl: secrets.rtmps_url,
      streamKey: secrets.stream_key,
    };
  });

export const ingestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(streamInput)
  .handler(async ({ data, context }) => {
    const stream = await ownStream(context.userId, data.streamId);
    if (!stream.cf_live_input_id || !isStreamConfigured()) return { state: "idle" };
    return { state: connectionState(await getLiveInput(stream.cf_live_input_id)) };
  });

export const goLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(streamInput)
  .handler(async ({ data, context }) => {
    const stream = await ownStream(context.userId, data.streamId);
    if (stream.status !== "setup") throw new Error("Stream already started");
    if (!stream.cf_live_input_id) throw new Error("Connect your camera or streaming app first");
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("streams")
      .update({ status: "live", started_at: now, last_heartbeat_at: now })
      .eq("id", stream.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const endStream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(streamInput)
  .handler(async ({ data, context }) => {
    const stream = await ownStream(context.userId, data.streamId);
    if (stream.cf_live_input_id && isStreamConfigured()) {
      await disableLiveInput(stream.cf_live_input_id).catch((e) => console.error(e));
    }
    const { error } = await supabaseAdmin
      .from("streams")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", stream.id);
    if (error) throw new Error(error.message);
    // Settle any auctions still open on this stream.
    const { data: lots } = await supabaseAdmin
      .from("works")
      .select("id")
      .eq("stream_id", stream.id)
      .eq("sale_mode", "auction")
      .eq("auction_status", "open");
    for (const lot of lots ?? []) {
      const r = await supabaseAdmin.rpc("close_auction", { _work: lot.id });
      if (r.error) console.error("close_auction", lot.id, r.error.message);
    }
    return { ok: true };
  });

/** Looks up the recording of an ended streaming-app broadcast. Safe to call by anyone. */
export const syncReplay = createServerFn({ method: "POST" })
  .inputValidator(streamInput)
  .handler(async ({ data }) => {
    const { data: s } = await supabaseAdmin
      .from("streams")
      .select("*")
      .eq("id", data.streamId)
      .maybeSingle();
    if (!s || s.status !== "ended" || s.ingest !== "app" || !s.cf_live_input_id)
      return { replayVideoId: s?.replay_video_id ?? null };
    if (s.replay_video_id || !isStreamConfigured()) return { replayVideoId: s.replay_video_id };
    const uid = await latestRecording(s.cf_live_input_id).catch(() => null);
    if (uid) await supabaseAdmin.from("streams").update({ replay_video_id: uid }).eq("id", s.id);
    return { replayVideoId: uid };
  });

export const liveVideoConfigured = createServerFn({ method: "GET" }).handler(async () => ({
  configured: isStreamConfigured(),
}));
