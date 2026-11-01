import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { getCraft } from "@/lib/crafts";
import {
  displayName,
  profilesByIds,
  useRealtime,
  type Battle,
  type PublicProfile,
} from "@/lib/data";
import { cowries, friendlyError, timeLeft } from "@/lib/format";
import { Avatar, LivePill } from "./StreamCard";

export function BattleCard({ battle, onChanged }: { battle: Battle; onChanged?: () => void }) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [b, setB] = useState(battle);
  const [people, setPeople] = useState<Map<string, PublicProfile>>(new Map());
  const [myVote, setMyVote] = useState<"a" | "b" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [, tick] = useState(0);
  const craft = getCraft(b.craft);

  useEffect(() => setB(battle), [battle]);
  useEffect(() => {
    void profilesByIds([b.challenger_id, b.opponent_id]).then(setPeople);
    if (user) {
      void supabase
        .from("versus_votes")
        .select("side")
        .eq("battle_id", b.id)
        .eq("voter_id", user.id)
        .maybeSingle()
        .then(({ data }) => setMyVote((data?.side as "a" | "b") ?? null));
    }
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [b.id, b.challenger_id, b.opponent_id, user]);
  useRealtime("versus_battles", `id=eq.${battle.id}`, (p) =>
    setB((cur) => ({ ...cur, ...(p.new as Battle) })),
  );

  const total = b.votes_a + b.votes_b;
  const pctA = total ? Math.round((b.votes_a / total) * 100) : 50;
  const isLive = b.status === "live" && b.ends_at && new Date(b.ends_at) > new Date();
  const contestant = user && [b.challenger_id, b.opponent_id].includes(user.id);

  const vote = async (side: "a" | "b") => {
    if (!requireAuth("vote")) return;
    setErr(null);
    const { error } = await supabase.rpc("vote_battle", { _id: b.id, _side: side });
    if (error) setErr(friendlyError(error));
    else setMyVote(side);
  };
  const respond = async (accept: boolean) => {
    const { error } = await supabase.rpc("respond_battle", { _id: b.id, _accept: accept });
    if (error) setErr(friendlyError(error));
    onChanged?.();
  };
  const settle = async () => {
    await supabase.rpc("settle_battle", { _id: b.id });
    onChanged?.();
  };

  useEffect(() => {
    if (b.status === "live" && b.ends_at && new Date(b.ends_at) <= new Date()) void settle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.status, b.ends_at, Math.floor(Date.now() / 5000)]);

  const side = (s: "a" | "b") => {
    const pid = s === "a" ? b.challenger_id : b.opponent_id;
    const p = people.get(pid);
    const pct = s === "a" ? pctA : 100 - pctA;
    const votes = s === "a" ? b.votes_a : b.votes_b;
    const label = s === "a" ? b.challenger_label : b.opponent_label;
    const winner = b.status === "ended" && b.winner_id === pid;
    return (
      <div
        className={`relative p-5 ${s === "b" ? "md:border-l border-border" : ""}`}
        style={{
          background: `radial-gradient(120% 80% at ${s === "a" ? "30%" : "70%"} 20%, ${craft?.accent}22 0%, transparent 60%)`,
        }}
      >
        <div className="flex items-start gap-4">
          {p?.handle ? (
            <Link to="/creator/$handle" params={{ handle: p.handle }}>
              <Avatar profile={p} className="h-14 w-14" />
            </Link>
          ) : (
            <Avatar profile={p} className="h-14 w-14" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg">
              {displayName(p)} {winner && <span className="text-primary">🏆</span>}
            </div>
            <div className="text-xs text-muted-foreground">{p?.city ?? ""}</div>
            {label && (
              <div className="mt-2 text-xs">
                <span className="rounded-sm bg-black/40 px-2 py-0.5">{label}</span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-2xl text-primary">{pct}%</div>
            <div className="text-[11px] text-muted-foreground">{votes.toLocaleString()} votes</div>
          </div>
        </div>
        {isLive && !contestant && (
          <button
            onClick={() => vote(s)}
            disabled={!!myVote}
            className={`mt-4 h-10 w-full rounded-md text-sm font-medium ${myVote === s ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary disabled:opacity-50"}`}
          >
            {myVote === s ? "Voted ✓" : myVote ? "Vote locked" : `Vote · ${b.vote_cost} 🐚`}
          </button>
        )}
        {b.status === "ended" && (
          <div className="mt-3 text-xs text-muted-foreground">
            Earned {cowries(s === "a" ? b.payout_a : b.payout_b)}
          </div>
        )}
      </div>
    );
  };

  return (
    <article className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {isLive ? (
            <LivePill />
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {b.status === "ended" ? "Final" : b.status}
            </span>
          )}
          <span className="font-display text-base">{b.title}</span>
          <span className="text-xs text-muted-foreground">
            · {craft?.emoji} {craft?.name}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Pot <span className="text-primary font-display">{cowries(b.pot)}</span>
          </span>
          {isLive && (
            <span>
              Ends in <span className="text-foreground">{timeLeft(b.ends_at)}</span>
            </span>
          )}
          {b.status === "pending" && <span>{b.duration_minutes} min once accepted</span>}
        </div>
      </div>
      <div className="grid md:grid-cols-2">
        {side("a")}
        {side("b")}
      </div>
      <div className="px-5 py-3 border-t border-border">
        <div className="h-2 w-full rounded-full bg-border overflow-hidden flex">
          <div className="h-full bg-primary transition-all" style={{ width: `${pctA}%` }} />
          <div className="h-full bg-accent/70 transition-all" style={{ width: `${100 - pctA}%` }} />
        </div>
        {b.status === "pending" && user?.id === b.opponent_id && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => respond(true)}
              className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground"
            >
              Accept challenge
            </button>
            <button
              onClick={() => respond(false)}
              className="h-9 rounded-md border border-border px-4 text-xs"
            >
              Decline
            </button>
          </div>
        )}
        {b.status === "pending" && user?.id !== b.opponent_id && (
          <div className="mt-2 text-xs text-muted-foreground">
            Waiting for {displayName(people.get(b.opponent_id))} to accept.
          </div>
        )}
        {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
      </div>
    </article>
  );
}
