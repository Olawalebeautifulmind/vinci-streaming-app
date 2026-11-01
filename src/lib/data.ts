import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Stream = Tables<"streams">;
export type Work = Tables<"works">;
export type ChatMessage = Tables<"chat_messages">;
export type Certificate = Tables<"certificates">;
export type Battle = Tables<"versus_battles">;
export type Gallery = Tables<"galleries">;
export type Commission = Tables<"commission_requests">;

export type PublicProfile = Pick<
  Profile,
  | "id"
  | "handle"
  | "display_name"
  | "avatar_url"
  | "city"
  | "country_code"
  | "verified"
  | "member_no"
  | "crafts"
  | "is_creator"
>;
export const PROFILE_COLS =
  "id, handle, display_name, avatar_url, city, country_code, verified, member_no, crafts, is_creator";

export type StreamWithCreator = Stream & { creator: PublicProfile | null };
export type WorkWithCreator = Work & { creator: PublicProfile | null };

const STREAM_SELECT = `*, creator:profiles!streams_creator_id_fkey(${PROFILE_COLS})`;
const WORK_SELECT = `*, creator:profiles!works_creator_id_fkey(${PROFILE_COLS})`;

function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export async function housekeeping() {
  // Idempotent, time-based jobs. Cheap enough to run on page loads in the MVP;
  // move to a Supabase cron (pg_cron) when traffic grows.
  await Promise.allSettled([
    supabase.rpc("end_stale_streams"),
    supabase.rpc("close_expired_auctions"),
    supabase.rpc("settle_expired_battles"),
  ]);
}

export async function listStreams(
  opts: { craft?: string; status?: "live" | "ended"; creatorId?: string; limit?: number } = {},
) {
  let q = supabase
    .from("streams")
    .select(STREAM_SELECT)
    .order("started_at", { ascending: false, nullsFirst: false })
    .limit(opts.limit ?? 24);
  q = q.eq("status", opts.status ?? "live");
  if (opts.craft) q = q.eq("craft", opts.craft);
  if (opts.creatorId) q = q.eq("creator_id", opts.creatorId);
  return must(await q) as unknown as StreamWithCreator[];
}

export async function getStream(id: string) {
  const r = await supabase.from("streams").select(STREAM_SELECT).eq("id", id).maybeSingle();
  return must(r) as unknown as StreamWithCreator | null;
}

export async function getProfileByHandle(handle: string) {
  return must(
    await supabase.from("profiles").select("*").eq("handle", handle).maybeSingle(),
  ) as Profile | null;
}

export async function listWorks(
  opts: {
    creatorId?: string;
    streamId?: string;
    ids?: string[];
    status?: string[];
    limit?: number;
  } = {},
) {
  let q = supabase
    .from("works")
    .select(WORK_SELECT)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 60);
  if (opts.creatorId) q = q.eq("creator_id", opts.creatorId);
  if (opts.streamId) q = q.eq("stream_id", opts.streamId);
  if (opts.ids)
    q = q.in("id", opts.ids.length ? opts.ids : ["00000000-0000-0000-0000-000000000000"]);
  if (opts.status) q = q.in("status", opts.status);
  return must(await q) as unknown as WorkWithCreator[];
}

export async function profilesByIds(ids: string[]) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return new Map<string, PublicProfile>();
  const rows = must(
    await supabase.from("profiles").select(PROFILE_COLS).in("id", uniq),
  ) as PublicProfile[];
  return new Map(rows.map((p) => [p.id, p]));
}

export const displayName = (p: Pick<PublicProfile, "display_name" | "handle"> | null | undefined) =>
  p?.display_name || (p?.handle ? `@${p.handle}` : "Vinci member");

export async function publicUrl(file: File, userId: string, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw new Error(up.error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Small data-loading hook with a reload function. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const reload = useCallback(async () => {
    try {
      setData(await run());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [run]);
  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

/** Re-run `onChange` whenever rows in `table` matching `filter` change (Supabase Realtime). */
export function useRealtime(
  table: string,
  filter: string | null,
  onChange: (payload: { new: unknown; old: unknown; eventType: string }) => void,
) {
  useEffect(() => {
    if (filter === null) return;
    const ch = supabase
      .channel(`rt:${table}:${filter}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        (p: { new: unknown; old: unknown; eventType: string }) => onChange(p),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}
