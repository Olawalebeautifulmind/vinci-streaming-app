import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { GIFTS } from "@/lib/crafts";
import {
  displayName,
  listWorks,
  profilesByIds,
  useLoad,
  useRealtime,
  type ChatMessage,
  type Commission,
  type PublicProfile,
  type Stream,
} from "@/lib/data";
import { cowries, friendlyError } from "@/lib/format";
import { WorkCard, WorkForm } from "./works";

const COLORS = ["#f0d78c", "#c9a84c", "#e8a87c", "#9bd0b0", "#c4654a", "#d4a574"];
const colorFor = (id: string | null) =>
  id ? COLORS[parseInt(id.slice(0, 2), 16) % COLORS.length] : "#999";

/** Viewer count (Realtime presence) and floating emoji reactions (Realtime broadcast). */
export function useStreamRoom(streamId: string, role: "viewer" | "creator") {
  const [viewers, setViewers] = useState(0);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const chRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const popRef = useRef<(emoji: string) => void>(() => {});

  useEffect(() => {
    const key = `${role}-${Math.random().toString(36).slice(2)}`;
    const ch = supabase.channel(`room:${streamId}`, { config: { presence: { key } } });
    const pop = (emoji: string) => {
      const id = Date.now() + Math.random();
      setReactions((r) => [...r.slice(-30), { id, emoji, x: 10 + Math.random() * 80 }]);
      setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2400);
    };
    ch.on("presence", { event: "sync" }, () => {
      setViewers(Object.keys(ch.presenceState()).filter((k) => k.startsWith("viewer-")).length);
    })
      .on("broadcast", { event: "react" }, ({ payload }) => pop(String(payload.emoji).slice(0, 4)))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void ch.track({ at: Date.now() });
      });
    chRef.current = ch;
    popRef.current = pop;
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [streamId, role]);

  const react = (emoji: string) => {
    const ch = chRef.current;
    if (!ch) return;
    void ch.send({ type: "broadcast", event: "react", payload: { emoji } });
    popRef.current(emoji);
  };
  return { viewers, reactions, react };
}

export function Reactions({
  reactions,
}: {
  reactions: { id: number; emoji: string; x: number }[];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="absolute bottom-4 text-2xl animate-[float-up_2.4s_ease-out_forwards]"
          style={{ left: `${r.x}%` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}

export const REACTION_EMOJI = ["❤️", "🔥", "👏", "📿", "🏺", "🐚"];

export function ChatPanel({
  stream,
  viewers,
  onReact,
  className = "",
}: {
  stream: Stream;
  viewers: number;
  onReact?: (e: string) => void;
  className?: string;
}) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [people, setPeople] = useState<Map<string, PublicProfile>>(new Map());
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const learn = async (ids: (string | null)[]) => {
    const missing = ids.filter((id): id is string => !!id && !people.has(id));
    if (!missing.length) return;
    const m = await profilesByIds(missing);
    setPeople((p) => new Map([...p, ...m]));
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("stream_id", stream.id)
        .order("id", { ascending: false })
        .limit(80);
      const rows = (data ?? []).reverse();
      setMsgs(rows);
      void learn(rows.map((r) => r.user_id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.id]);

  useRealtime("chat_messages", `stream_id=eq.${stream.id}`, (p) => {
    if (p.eventType !== "INSERT") return;
    const row = p.new as ChatMessage;
    setMsgs((m) => (m.some((x) => x.id === row.id) ? m : [...m.slice(-150), row]));
    void learn([row.user_id]);
  });

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!requireAuth("chat")) return;
    setErr(null);
    const { error } = await supabase
      .from("chat_messages")
      .insert({ stream_id: stream.id, user_id: user!.id, body: text.trim().slice(0, 240) });
    if (error)
      setErr(
        stream.status === "live" ? friendlyError(error) : "Chat opens when the stream is live.",
      );
    else setText("");
  };

  return (
    <aside
      className={`rounded-lg border border-border bg-card flex flex-col h-[560px] ${className}`}
    >
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-display text-sm">Live chat</span>
        <span className="text-[11px] text-muted-foreground">
          {stream.status === "live" ? `${viewers.toLocaleString()} watching` : "Stream ended"}
        </span>
      </div>
      <WalletStrip />
      <div ref={box} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm">
        {msgs.length === 0 && (
          <div className="text-xs text-muted-foreground">No messages yet. Say hello.</div>
        )}
        {msgs.map((m) => {
          const who = m.user_id ? people.get(m.user_id) : null;
          const special = m.kind !== "chat";
          return (
            <div
              key={m.id}
              className={`leading-snug ${special ? "rounded-md bg-primary/10 px-2 py-1" : ""}`}
            >
              <span className="font-medium" style={{ color: colorFor(m.user_id) }}>
                {m.user_id === stream.creator_id ? "🎙 " : ""}
                {displayName(who)}
              </span>{" "}
              <span>{m.body}</span>
              {m.amount ? (
                <span className="ml-1 text-primary text-xs">{cowries(m.amount)}</span>
              ) : null}
            </div>
          );
        })}
      </div>
      {onReact && (
        <div className="border-t border-border px-3 py-2 flex items-center gap-1">
          {REACTION_EMOJI.map((e) => (
            <button
              key={e}
              onClick={() => onReact(e)}
              className="h-7 w-7 rounded-sm text-sm hover:bg-background"
              aria-label={`React ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 240))}
          placeholder={user ? "Say something kind…" : "Sign in to chat"}
          className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
        />
        <button className="h-10 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-accent">
          Send
        </button>
      </form>
      {err && <div className="px-3 pb-2 text-xs text-destructive">{err}</div>}
    </aside>
  );
}

export function WalletStrip() {
  const { user } = useAuth();
  const { balance, lastClaimAt } = useWallet();
  const [msg, setMsg] = useState<string | null>(null);
  if (!user) {
    return (
      <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground bg-background/40">
        <Link to="/auth" search={{ mode: "signup" }} className="text-primary hover:underline">
          Join free
        </Link>{" "}
        and get 1,000 Cowries to gift and bid.
      </div>
    );
  }
  const canClaim = !lastClaimAt || Date.now() - new Date(lastClaimAt).getTime() > 24 * 3600_000;
  return (
    <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-background/40">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-base">🐚</span>
        <span className="font-display text-sm">{(balance ?? 0).toLocaleString()}</span>
        <span className="text-muted-foreground">Cowries</span>
      </div>
      {canClaim ? (
        <button
          onClick={async () => {
            const { error } = await supabase.rpc("claim_daily_cowries");
            setMsg(error ? friendlyError(error) : "+ daily Cowries");
          }}
          className="h-7 rounded-sm border border-primary/50 px-2 text-[11px] text-primary hover:bg-primary/10"
        >
          Claim daily
        </button>
      ) : (
        <span className="text-[11px] text-muted-foreground">{msg ?? "Daily claimed"}</span>
      )}
    </div>
  );
}

export function GiftBar({ stream }: { stream: Stream }) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [err, setErr] = useState<string | null>(null);
  if (!stream.tips_enabled) return null;
  if (user?.id === stream.creator_id) return null;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-primary mb-2">
        Cowrie gifting 🐚
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {GIFTS.map((g) => (
          <button
            key={g.id}
            disabled={stream.status !== "live"}
            onClick={async () => {
              if (!requireAuth("gift")) return;
              setErr(null);
              const { error } = await supabase.rpc("send_gift", {
                _stream: stream.id,
                _gift: g.id,
              });
              if (error) setErr(friendlyError(error));
            }}
            className="h-11 rounded-md border border-border text-xs hover:border-primary/60 flex flex-col items-center justify-center disabled:opacity-50"
          >
            <span>{g.label}</span>
            <span className="text-muted-foreground text-[10px]">{g.amount} Cowries</span>
          </button>
        ))}
      </div>
      {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
      <div className="mt-2 text-[11px] text-muted-foreground">
        The maker receives 80%. Cowries are free credits during launch.
      </div>
    </div>
  );
}

export function StreamWorks({ stream, isCreator }: { stream: Stream; isCreator: boolean }) {
  const works = useLoad(() => listWorks({ streamId: stream.id }), [stream.id]);
  const [formOpen, setFormOpen] = useState(true);
  useRealtime("works", `stream_id=eq.${stream.id}`, () => void works.reload());
  const list = works.data ?? [];
  const lots = list.filter((w) => w.sale_mode === "auction");
  const market = list.filter((w) => w.sale_mode !== "auction");
  return (
    <div className="space-y-6">
      {isCreator && stream.auction_enabled && stream.status !== "ended" && (
        <details
          className="rounded-md border border-border p-4"
          open={formOpen}
          onToggle={(e) => setFormOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-sm font-display">
            Add a piece to this stream
          </summary>
          <div className="mt-4">
            <WorkForm
              streamId={stream.id}
              defaultCraft={stream.craft}
              onCreated={() => void works.reload()}
            />
          </div>
        </details>
      )}
      <Section
        title="Live auction"
        empty={isCreator ? "Add an auction lot above." : "No auction lots on this stream yet."}
      >
        {lots.map((w) => (
          <WorkCard key={w.id} work={w} onChanged={() => void works.reload()} />
        ))}
      </Section>
      <Section
        title="Marketplace"
        empty={isCreator ? "Add a buy-now piece above." : "Nothing listed for sale yet."}
      >
        {market.map((w) => (
          <WorkCard key={w.id} work={w} onChanged={() => void works.reload()} />
        ))}
      </Section>
      <p className="text-[11px] text-muted-foreground">
        Every sale issues a numbered Vinci certificate linking the piece, the maker and this stream.
      </p>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-primary mb-3">{title}</div>
      {children.length === 0 ? (
        <div className="text-xs text-muted-foreground">{empty}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">{children}</div>
      )}
    </div>
  );
}

export function CommissionsPanel({ stream, isCreator }: { stream: Stream; isCreator: boolean }) {
  const requireAuth = useRequireAuth();
  const [prompt, setPrompt] = useState("");
  const [amount, setAmount] = useState(250);
  const [err, setErr] = useState<string | null>(null);
  const list = useLoad(async () => {
    const { data } = await supabase
      .from("commission_requests")
      .select("*")
      .eq("stream_id", stream.id)
      .order("amount", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as Commission[];
    return { rows, people: await profilesByIds(rows.map((r) => r.requester_id)) };
  }, [stream.id]);
  useRealtime("commission_requests", `stream_id=eq.${stream.id}`, () => void list.reload());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth("send a creation bid")) return;
    setErr(null);
    const { error } = await supabase.rpc("submit_commission", {
      _stream: stream.id,
      _prompt: prompt,
      _amount: amount,
    });
    if (error) setErr(friendlyError(error));
    else setPrompt("");
  };
  const resolve = async (id: string, accept: boolean) => {
    const { error } = await supabase.rpc("resolve_commission", { _id: id, _accept: accept });
    if (error) setErr(friendlyError(error));
  };

  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-primary">Creation bids 🐚</div>
      <div className="text-xs text-muted-foreground mt-1">
        Propose what the maker makes next. Your Cowries are held and refunded in full if the maker
        declines.
      </div>
      {!isCreator && stream.status === "live" && (
        <form
          onSubmit={submit}
          className="mt-3 rounded-md border border-border p-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 120))}
            placeholder={
              stream.craft === "pottery"
                ? '"A cobalt bud vase"'
                : '"A red bead bracelet with gold clasp"'
            }
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
          <input
            type="number"
            min={50}
            step={50}
            value={amount}
            onChange={(e) => setAmount(Math.max(50, Number(e.target.value) || 50))}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
          <button
            disabled={prompt.trim().length < 3}
            className="h-10 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            Submit bid
          </button>
        </form>
      )}
      {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
      <ul className="mt-3 space-y-2">
        {(list.data?.rows ?? []).map((b) => (
          <li
            key={b.id}
            className="rounded-md border border-border p-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-sm">"{b.prompt}"</div>
              <div className="text-xs text-muted-foreground mt-1">
                by {displayName(list.data?.people.get(b.requester_id))} ·{" "}
                <span className="text-primary">{cowries(b.amount)}</span>
              </div>
            </div>
            {b.status === "pending" && isCreator ? (
              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => resolve(b.id, true)}
                  className="h-8 rounded-md bg-primary/20 text-primary px-3 text-xs"
                >
                  Accept
                </button>
                <button
                  onClick={() => resolve(b.id, false)}
                  className="h-8 rounded-md border border-border px-3 text-xs"
                >
                  Decline
                </button>
              </div>
            ) : (
              <span
                className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm ${b.status === "accepted" ? "bg-primary/20 text-primary" : b.status === "declined" ? "bg-border text-muted-foreground" : "border border-border text-muted-foreground"}`}
              >
                {b.status === "declined" ? "Declined · refunded" : b.status}
              </span>
            )}
          </li>
        ))}
        {list.data?.rows.length === 0 && (
          <li className="text-xs text-muted-foreground">No creation bids yet.</li>
        )}
      </ul>
    </div>
  );
}
