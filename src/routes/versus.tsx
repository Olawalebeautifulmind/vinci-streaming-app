import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { enabledCrafts } from "@/lib/crafts";
import { displayName, useLoad, useRealtime, type Battle } from "@/lib/data";
import { cowries, friendlyError } from "@/lib/format";
import { BattleCard } from "@/components/BattleCard";
import { Avatar, EmptyState } from "@/components/StreamCard";

export const Route = createFileRoute("/versus")({
  component: VersusPage,
  head: () => ({
    meta: [
      { title: "Versus · Live craft battles · Vinci" },
      {
        name: "description",
        content:
          "Two makers, one craft, live. Vote with Cowries and crown the winner in Vinci's Versus battles.",
      },
      { property: "og:title", content: "Versus · Live craft battles · Vinci" },
    ],
  }),
});

function VersusPage() {
  const { user } = useAuth();
  const { balance, profile } = useWallet();
  const battles = useLoad(async () => {
    await supabase.rpc("settle_expired_battles");
    const { data } = await supabase
      .from("versus_battles")
      .select("*")
      .in("status", ["pending", "live", "ended"])
      .order("created_at", { ascending: false })
      .limit(40);
    return (data ?? []) as Battle[];
  }, []);
  const board = useLoad(async () => {
    const { data } = await supabase
      .from("versus_leaderboard")
      .select("*")
      .order("wins", { ascending: false })
      .order("cowries_earned", { ascending: false })
      .limit(20);
    return data ?? [];
  }, []);
  useRealtime("versus_battles", "", () => void battles.reload());

  const all = battles.data ?? [];
  const live = all.filter((b) => b.status === "live");
  const pending = all.filter(
    (b) => b.status === "pending" && user && [b.challenger_id, b.opponent_id].includes(user.id),
  );
  const ended = all.filter((b) => b.status === "ended").slice(0, 10);

  return (
    <div>
      <section
        className="relative border-b border-border/60 overflow-hidden"
        style={{
          background: "radial-gradient(80% 60% at 20% 0%, #c9a84c22 0%, transparent 60%), #15110a",
        }}
      >
        <div className="absolute inset-0 noise opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-16">
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">
            Versus mode
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight max-w-3xl">
            Two hands. One craft. The room decides.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-foreground/80 leading-relaxed">
            Makers challenge each other to timed battles. Each vote costs 10 Cowries and goes into
            the pot. When time runs out, the pot (minus 20%) is split by vote share and the side
            with more votes takes the win.
          </p>
          {user && (
            <div className="mt-8 flex items-center gap-3 text-xs">
              <span className="rounded-full border border-border bg-background/60 px-3 py-1.5">
                Wallet · <span className="font-display text-primary">{cowries(balance)}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 space-y-12">
        {profile?.is_creator && <ChallengeForm onCreated={() => void battles.reload()} />}

        {pending.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Your challenges</h2>
            {pending.map((b) => (
              <BattleCard key={b.id} battle={b} onChanged={() => void battles.reload()} />
            ))}
          </section>
        )}

        <section className="space-y-6">
          <h2 className="font-display text-2xl md:text-3xl">Live battles</h2>
          {battles.loading ? (
            <div className="h-40 rounded-lg bg-card animate-pulse" />
          ) : live.length === 0 ? (
            <EmptyState
              title="No battles running right now."
              body={
                profile?.is_creator
                  ? "Challenge another maker above."
                  : "Makers start battles from this page. Check back soon."
              }
            />
          ) : (
            live.map((b) => (
              <BattleCard key={b.id} battle={b} onChanged={() => void battles.reload()} />
            ))
          )}
        </section>

        {ended.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl">Recent results</h2>
            {ended.map((b) => (
              <BattleCard key={b.id} battle={b} />
            ))}
          </section>
        )}

        <section>
          <div className="text-[11px] uppercase tracking-widest text-primary">
            Versus leaderboard
          </div>
          <h2 className="mt-1 font-display text-2xl md:text-3xl mb-6">Top battle artists</h2>
          {(board.data?.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">
              The leaderboard fills in after the first battle ends.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[40px_1fr_70px_70px_120px] gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <span>#</span>
                  <span>Artist</span>
                  <span className="text-right">Wins</span>
                  <span className="text-right">Battles</span>
                  <span className="text-right">Cowries</span>
                </div>
                <ul className="divide-y divide-border">
                  {board.data!.map((row, i) => (
                    <li
                      key={row.id!}
                      className="grid grid-cols-[40px_1fr_70px_70px_120px] gap-3 px-4 py-3 items-center text-sm"
                    >
                      <span
                        className={`font-display ${i === 0 ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {i + 1}
                      </span>
                      {row.handle ? (
                        <Link
                          to="/creator/$handle"
                          params={{ handle: row.handle }}
                          className="flex items-center gap-3 min-w-0 hover:text-primary"
                        >
                          <Avatar profile={row as never} className="h-8 w-8" />
                          <span className="truncate">{displayName(row as never)}</span>
                        </Link>
                      ) : (
                        <span>{displayName(row as never)}</span>
                      )}
                      <span className="text-right font-display">{row.wins}</span>
                      <span className="text-right text-muted-foreground">{row.battles}</span>
                      <span className="text-right font-display text-primary">
                        {cowries(row.cowries_earned)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChallengeForm({ onCreated }: { onCreated: () => void }) {
  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");
  const [craft, setCraft] = useState<string>(enabledCrafts[0].slug);
  const [minutes, setMinutes] = useState(60);
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.rpc("create_battle", {
      _opponent_handle: handle.replace(/^@/, ""),
      _title: title,
      _craft: craft,
      _duration: minutes,
      _my_label: label || undefined,
    });
    if (error) setMsg({ ok: false, text: friendlyError(error) });
    else {
      setMsg({ ok: true, text: "Challenge sent. It starts when they accept." });
      setHandle("");
      setTitle("");
      onCreated();
    }
  };
  const input = "h-9 w-full rounded-md border border-border bg-background px-3 text-sm";
  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-border bg-card/40 p-5 grid gap-3 md:grid-cols-6 items-end"
    >
      <div className="md:col-span-6 font-display">Challenge a maker</div>
      <label className="text-xs text-muted-foreground md:col-span-2">
        Opponent handle
        <input
          required
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@thandi_beads"
          className={`${input} mt-1`}
        />
      </label>
      <label className="text-xs text-muted-foreground md:col-span-2">
        Battle title
        <input
          required
          minLength={3}
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="60-minute teacup duel"
          className={`${input} mt-1`}
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Craft
        <select
          value={craft}
          onChange={(e) => setCraft(e.target.value)}
          className={`${input} mt-1`}
        >
          {enabledCrafts.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted-foreground">
        Minutes
        <input
          type="number"
          min={10}
          max={1440}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className={`${input} mt-1`}
        />
      </label>
      <label className="text-xs text-muted-foreground md:col-span-3">
        What you'll make (optional)
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Wheel-thrown cup"
          className={`${input} mt-1`}
        />
      </label>
      <button className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground md:col-span-1">
        Send challenge
      </button>
      {msg && (
        <div className={`md:col-span-6 text-xs ${msg.ok ? "text-primary" : "text-destructive"}`}>
          {msg.text}
        </div>
      )}
    </form>
  );
}
