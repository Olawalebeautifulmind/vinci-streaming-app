import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { enabledCrafts, getCraft } from "@/lib/crafts";
import {
  listWorks,
  profilesByIds,
  publicUrl,
  useLoad,
  displayName,
  type Profile,
} from "@/lib/data";
import { artistId, cowries, friendlyError, memberId, timeAgo } from "@/lib/format";
import { WorkCard, WorkForm } from "@/components/works";
import { Avatar } from "@/components/StreamCard";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Your profile · Vinci" }, { name: "robots", content: "noindex" }],
  }),
});

const TIERS = [
  { name: "Apprentice", min: 0, color: "#9ca3af" },
  { name: "Maker", min: 100, color: "#c9a84c" },
  { name: "Artisan", min: 500, color: "#e85d3a" },
  { name: "Master", min: 1500, color: "#a78bfa" },
  { name: "Luminary", min: 5000, color: "#4ade80" },
];
function levelFor(xp: number) {
  const current = [...TIERS].reverse().find((t) => xp >= t.min) ?? TIERS[0];
  const next = TIERS.find((t) => t.min > xp);
  const progress = next ? ((xp - current.min) / (next.min - current.min)) * 100 : 100;
  return { current, next, progress };
}

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile: liveProfile, refreshProfile, balance } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user)
      navigate({ to: "/auth", search: { mode: "signin", redirect: "/profile" } });
  }, [authLoading, user, navigate]);

  const stats = useLoad(
    async () =>
      user ? ((await supabase.rpc("user_stats", { _user: user.id })).data?.[0] ?? null) : null,
    [user?.id],
  );

  if (authLoading || !user || !liveProfile) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="h-8 w-48 bg-card animate-pulse rounded" />
        <div className="mt-6 h-64 bg-card animate-pulse rounded-lg" />
      </div>
    );
  }
  const p = liveProfile;
  const xp = Number(stats.data?.xp ?? 0);
  const level = levelFor(xp);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid md:grid-cols-[auto_1fr_auto] gap-6 items-start">
        <Avatar profile={p} className="h-24 w-24 text-3xl" />
        <div className="min-w-0">
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">
            {memberId(p.member_no)}
            {p.is_creator ? ` · ${artistId(p.member_no, p.country_code)}` : ""}
          </div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl tracking-tight">
            {p.display_name || "Unnamed maker"}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground truncate">{user.email}</div>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {p.is_creator ? "creator" : "viewer"}
            </span>
            {p.verified && (
              <span className="rounded-full bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                verified
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {p.handle && (
            <Link
              to="/creator/$handle"
              params={{ handle: p.handle }}
              className="h-9 inline-flex items-center rounded-md border border-border px-4 text-xs hover:border-primary/60"
            >
              Public profile
            </Link>
          )}
          <button
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
            className="h-9 rounded-md border border-border px-4 text-xs text-muted-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-lg overflow-hidden text-sm">
        <div className="bg-background p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Level</div>
          <div className="mt-1 font-display text-base" style={{ color: level.current.color }}>
            {level.current.name}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-card overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${level.progress}%`, background: level.current.color }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {xp} XP{level.next ? ` · ${level.next.min - xp} to ${level.next.name}` : " · max tier"}
          </div>
        </div>
        <Cell label="Cowries" value={cowries(balance)} sub="Free credits during launch" />
        <Cell
          label="Member ID"
          value={memberId(p.member_no)}
          sub={`Joined ${new Date(p.created_at).getFullYear()}`}
          mono
        />
        <Cell
          label="Location"
          value={[p.city, p.country_code].filter(Boolean).join(", ") || "—"}
          sub="Set in Identity"
        />
      </div>

      <Tabs defaultValue="identity" className="mt-10">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="studio">Studio</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        <TabsContent value="identity" className="mt-6">
          <IdentityForm profile={p} onSaved={refreshProfile} />
        </TabsContent>
        <TabsContent value="studio" className="mt-6">
          <StudioTab profile={p} onChanged={refreshProfile} />
        </TabsContent>
        <TabsContent value="wallet" className="mt-6">
          <WalletTab />
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <OrdersTab userId={user.id} />
        </TabsContent>
        <TabsContent value="collection" className="mt-6">
          <CollectionTab userId={user.id} />
        </TabsContent>
        <TabsContent value="achievements" className="mt-6">
          <Card
            title="Achievements"
            subtitle="XP comes from what you actually do on Vinci: 20 per stream, 1 per minute live, 50 per sale, 100 per Versus win, 5 per bid, 1 per 10 Cowries gifted, 2 per follower."
          >
            <div className="grid sm:grid-cols-4 gap-3 text-sm mb-6">
              <Cell label="Streams" value={String(stats.data?.streams_hosted ?? 0)} />
              <Cell label="Works sold" value={String(stats.data?.works_sold ?? 0)} />
              <Cell label="Versus wins" value={String(stats.data?.versus_wins ?? 0)} />
              <Cell label="Bids placed" value={String(stats.data?.bids_placed ?? 0)} />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {TIERS.map((t) => (
                <div
                  key={t.name}
                  className={`rounded-lg border p-4 ${xp >= t.min ? "border-border bg-background" : "border-border/40 opacity-50"}`}
                >
                  <div className="font-display text-sm" style={{ color: t.color }}>
                    {xp >= t.min ? "✓ " : ""}
                    {t.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t.min} XP
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
          <PostsTab userId={user.id} />
        </TabsContent>
        <TabsContent value="events" className="mt-6">
          <EventsTab userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IdentityForm({ profile, onSaved }: { profile: Profile; onSaved: () => Promise<void> }) {
  const [p, setP] = useState(profile);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setP(profile), [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const avatar_url = file ? await publicUrl(file, p.id, "avatars") : p.avatar_url;
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: p.display_name?.trim() || null,
          handle: p.handle || null,
          bio: p.bio?.trim() || null,
          city: p.city?.trim() || null,
          country_code: p.country_code?.toUpperCase() || null,
          region: p.region,
          avatar_url,
          wallet_address: p.wallet_address?.trim() || null,
        })
        .eq("id", p.id);
      if (error) throw error;
      setFile(null);
      await onSaved();
      setMsg({ ok: true, text: "Profile saved." });
    } catch (err) {
      setMsg({ ok: false, text: friendlyError(err) });
    } finally {
      setSaving(false);
    }
  };
  const input = "w-full h-10 rounded-md border border-border bg-background px-3 text-sm";
  return (
    <form onSubmit={save} className="space-y-5 rounded-lg border border-border bg-card/40 p-6">
      <h2 className="font-display text-xl">Identity</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <F label="Display name">
          <input
            maxLength={60}
            value={p.display_name ?? ""}
            onChange={(e) => setP({ ...p, display_name: e.target.value })}
            className={input}
          />
        </F>
        <F label="Handle" hint="3 to 30 lowercase letters, numbers or underscores.">
          <input
            value={p.handle ?? ""}
            onChange={(e) =>
              setP({ ...p, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })
            }
            className={`${input} font-mono`}
          />
        </F>
        <F label="City">
          <input
            value={p.city ?? ""}
            onChange={(e) => setP({ ...p, city: e.target.value })}
            className={input}
          />
        </F>
        <F label="Country code" hint="Two letters, e.g. NG, GB, ZA. Used in your Artist ID.">
          <input
            maxLength={2}
            value={p.country_code ?? ""}
            onChange={(e) =>
              setP({ ...p, country_code: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })
            }
            className={`${input} font-mono`}
          />
        </F>
      </div>
      <F label="Bio">
        <textarea
          maxLength={600}
          rows={3}
          value={p.bio ?? ""}
          onChange={(e) => setP({ ...p, bio: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </F>
      <F label="Avatar">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
      </F>
      <F
        label="Wallet address (optional)"
        hint="Saved for future on-chain certificates. Not used yet."
      >
        <input
          value={p.wallet_address ?? ""}
          onChange={(e) => setP({ ...p, wallet_address: e.target.value })}
          placeholder="0x…"
          className={`${input} font-mono`}
        />
      </F>
      {msg && (
        <div className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</div>
      )}
      <button
        disabled={saving}
        className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function StudioTab({ profile, onChanged }: { profile: Profile; onChanged: () => Promise<void> }) {
  const [myCrafts, setMyCrafts] = useState<string[]>(
    profile.crafts.length ? profile.crafts : [enabledCrafts[0].slug],
  );
  const [err, setErr] = useState<string | null>(null);
  const streams = useLoad(
    async () =>
      (
        await supabase
          .from("streams")
          .select("*")
          .eq("creator_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(30)
      ).data ?? [],
    [profile.id],
  );
  const works = useLoad(() => listWorks({ creatorId: profile.id }), [profile.id]);

  const save = async () => {
    setErr(null);
    const { error } = await supabase.rpc("become_creator", { _crafts: myCrafts });
    if (error) setErr(friendlyError(error));
    else await onChanged();
  };

  return (
    <div className="space-y-6">
      <Card
        title={profile.is_creator ? "Your crafts" : "Open your studio"}
        subtitle={
          profile.is_creator
            ? "Shown on your public profile."
            : "Become a creator to stream, sell and battle. Set a handle in Identity first."
        }
      >
        <div className="flex gap-2 flex-wrap">
          {enabledCrafts.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() =>
                setMyCrafts((m) =>
                  m.includes(c.slug) ? m.filter((x) => x !== c.slug) : [...m, c.slug],
                )
              }
              className={`rounded-full border px-3 py-1.5 text-xs ${myCrafts.includes(c.slug) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
          <button
            onClick={save}
            disabled={!profile.handle || myCrafts.length === 0}
            className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {profile.is_creator ? "Save crafts" : "Open my studio"}
          </button>
        </div>
        {err && <div className="mt-2 text-xs text-destructive">{err}</div>}
      </Card>

      {profile.is_creator && (
        <>
          <Card title="Your streams">
            <Link
              to="/live/new"
              className="mb-4 h-9 inline-flex items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground"
            >
              New stream
            </Link>
            <div className="divide-y divide-border border border-border rounded-lg">
              {(streams.data ?? []).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate">{s.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {getCraft(s.craft)?.name} · {s.status} · {timeAgo(s.created_at)}
                    </div>
                  </div>
                  <Link
                    to={s.status === "ended" ? "/stream/$id" : "/studio/$id"}
                    params={{ id: s.id }}
                    className="h-8 inline-flex items-center rounded-md border border-border px-3 text-xs"
                  >
                    {s.status === "ended" ? "View" : "Open studio"}
                  </Link>
                </div>
              ))}
              {streams.data?.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground">No streams yet.</div>
              )}
            </div>
          </Card>
          <Card
            title="Add a piece"
            subtitle="List work outside of a stream: buy now, auction, or portfolio only."
          >
            <WorkForm onCreated={() => void works.reload()} />
          </Card>
          <Card title="Your works">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(works.data ?? []).map((w) => (
                <WorkCard key={w.id} work={w} onChanged={() => void works.reload()} />
              ))}
            </div>
            {works.data?.length === 0 && (
              <div className="text-xs text-muted-foreground">No works yet.</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

const REASONS: Record<string, string> = {
  starter_grant: "Welcome grant",
  daily_claim: "Daily Cowries",
  gift_sent: "Gift sent",
  gift_received: "Gift received",
  purchase: "Purchase",
  sale: "Sale",
  bid_hold: "Bid held",
  bid_refund_outbid: "Outbid, refunded",
  commission_hold: "Creation bid held",
  commission_refund: "Creation bid refunded",
  commission_accepted: "Creation bid accepted",
  versus_vote: "Versus vote",
  versus_payout: "Versus payout",
  gallery_entry: "Gallery entry",
  gallery_entry_share: "Gallery entry share",
};

function WalletTab() {
  const { balance, lastClaimAt } = useWallet();
  const [msg, setMsg] = useState<string | null>(null);
  const ledger = useLoad(
    async () =>
      (
        await supabase
          .from("cowrie_ledger")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
    [balance],
  );
  const canClaim = !lastClaimAt || Date.now() - new Date(lastClaimAt).getTime() > 24 * 3600_000;
  return (
    <Card
      title={`Wallet · ${cowries(balance)}`}
      subtitle="Cowries are free in-app credits during launch. They can't be bought or cashed out yet."
    >
      <button
        disabled={!canClaim}
        onClick={async () => {
          const { error } = await supabase.rpc("claim_daily_cowries");
          setMsg(error ? friendlyError(error) : "Claimed!");
        }}
        className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50"
      >
        {canClaim ? "Claim daily Cowries" : "Daily Cowries claimed"}
      </button>
      {msg && <span className="ml-3 text-xs text-muted-foreground">{msg}</span>}
      <div className="mt-5 divide-y divide-border border border-border rounded-lg">
        {(ledger.data ?? []).map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span>{REASONS[r.reason] ?? r.reason}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
            <span
              className={`font-display ${r.delta > 0 ? "text-primary" : "text-muted-foreground"}`}
            >
              {r.delta > 0 ? "+" : ""}
              {r.delta.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OrdersTab({ userId }: { userId: string }) {
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [actErr, setActErr] = useState<string | null>(null);
  const orders = useLoad(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const rows = data ?? [];
    const [people, works] = await Promise.all([
      profilesByIds(rows.flatMap((o) => [o.buyer_id, o.seller_id])),
      listWorks({ ids: rows.map((o) => o.work_id) }),
    ]);
    return { rows, people, works: new Map(works.map((w) => [w.id, w])) };
  }, [userId]);
  const act = async (fn: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await fn;
    setActErr(error ? friendlyError(error) : null);
    void orders.reload();
  };
  const rows = orders.data?.rows ?? [];
  return (
    <Card
      title="Orders"
      subtitle="Pieces you've bought and pieces you've sold. Ship physical pieces and add tracking here."
    >
      {rows.length === 0 && <div className="text-xs text-muted-foreground">No orders yet.</div>}
      {actErr && <div className="mb-3 text-xs text-destructive">{actErr}</div>}
      <div className="space-y-3">
        {rows.map((o) => {
          const w = orders.data!.works.get(o.work_id);
          const selling = o.seller_id === userId;
          return (
            <div key={o.id} className="rounded-md border border-border p-4 text-sm">
              <div className="flex justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{w?.title ?? "Piece"}</div>
                  <div className="text-xs text-muted-foreground">
                    {selling
                      ? `Sold to ${displayName(orders.data!.people.get(o.buyer_id))}`
                      : `Bought from ${displayName(orders.data!.people.get(o.seller_id))}`}{" "}
                    · edition {o.edition_no} · {cowries(o.price)} · {timeAgo(o.created_at)}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest rounded-sm border border-border px-2 py-1 self-start">
                  {o.status}
                </span>
              </div>
              {o.shipping_address && selling && (
                <div className="mt-2 text-xs">Ship to: {o.shipping_address}</div>
              )}
              {o.tracking && (
                <div className="mt-1 text-xs text-muted-foreground">Tracking: {o.tracking}</div>
              )}
              {selling && o.status === "paid" && w?.delivery === "physical" && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={tracking[o.id] ?? ""}
                    onChange={(e) => setTracking({ ...tracking, [o.id]: e.target.value })}
                    placeholder="Tracking number or note"
                    className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs"
                  />
                  <button
                    onClick={() =>
                      act(
                        supabase.rpc("mark_order_shipped", {
                          _order: o.id,
                          _tracking: tracking[o.id] ?? "",
                        }),
                      )
                    }
                    className="h-8 rounded-md bg-primary px-3 text-xs text-primary-foreground"
                  >
                    Mark shipped
                  </button>
                </div>
              )}
              {!selling && o.status === "shipped" && (
                <button
                  onClick={() => act(supabase.rpc("mark_order_delivered", { _order: o.id }))}
                  className="mt-3 h-8 rounded-md border border-border px-3 text-xs"
                >
                  I received it
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CollectionTab({ userId }: { userId: string }) {
  const certs = useLoad(
    async () =>
      (
        await supabase
          .from("certificates")
          .select("*")
          .eq("owner_id", userId)
          .order("issued_at", { ascending: false })
      ).data ?? [],
    [userId],
  );
  return (
    <Card title="Your collection" subtitle="Every piece you own, with its certificate.">
      {(certs.data ?? []).length === 0 && (
        <div className="text-xs text-muted-foreground">Nothing collected yet.</div>
      )}
      <div className="divide-y divide-border border border-border rounded-lg">
        {(certs.data ?? []).map((c) => (
          <Link
            key={c.id}
            to="/certificate/$serial"
            params={{ serial: c.serial }}
            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-card"
          >
            <span className="font-mono text-primary">{c.serial}</span>
            <span className="text-xs text-muted-foreground">
              Edition {c.edition_no}/{c.edition_size} · {timeAgo(c.issued_at)}
            </span>
            <span>{cowries(c.price)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function PostsTab({ userId }: { userId: string }) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const posts = useLoad(
    async () =>
      (
        await supabase
          .from("posts")
          .select("*")
          .eq("author_id", userId)
          .order("created_at", { ascending: false })
      ).data ?? [],
    [userId],
  );
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const image_url = file ? await publicUrl(file, userId, "posts") : null;
      const { error } = await supabase
        .from("posts")
        .insert({ author_id: userId, body: body.trim(), image_url });
      if (error) throw error;
      setBody("");
      setFile(null);
      void posts.reload();
    } catch (e2) {
      setErr(friendlyError(e2));
    }
  };
  return (
    <Card title="Posts" subtitle="Share progress shots and studio news on your public profile.">
      <form onSubmit={create} className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="What are you working on?"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <button
            disabled={!body.trim()}
            className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            Post
          </button>
        </div>
        {err && <div className="text-xs text-destructive">{err}</div>}
      </form>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(posts.data ?? []).map((p) => (
          <article
            key={p.id}
            className="rounded-lg border border-border overflow-hidden bg-background"
          >
            {p.image_url && (
              <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
            )}
            <div className="p-3">
              <p className="text-sm whitespace-pre-line">{p.body}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>{timeAgo(p.created_at)}</span>
                <button
                  onClick={async () => {
                    await supabase.from("posts").delete().eq("id", p.id);
                    void posts.reload();
                  }}
                  className="hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

function EventsTab({ userId }: { userId: string }) {
  const ev = useLoad(async () => {
    const [rsvps, votes, battles, bids] = await Promise.all([
      supabase
        .from("gallery_rsvps")
        .select("gallery_id, galleries(title, starts_at)")
        .eq("user_id", userId),
      supabase
        .from("versus_votes")
        .select("battle_id, side, versus_battles(title, status, ends_at)")
        .eq("voter_id", userId),
      supabase
        .from("versus_battles")
        .select("id, title, status, ends_at")
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`),
      supabase
        .from("bids")
        .select("work_id, amount, created_at, works(title, auction_status, top_bidder_id)")
        .eq("bidder_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    type Row = { title: string; when: string; role: string };
    const rows: Row[] = [];
    for (const r of (rsvps.data ?? []) as unknown as {
      galleries: { title: string; starts_at: string };
    }[])
      rows.push({
        title: `Gallery: ${r.galleries.title}`,
        when: new Date(r.galleries.starts_at).toLocaleString(),
        role: "RSVP",
      });
    for (const b of battles.data ?? [])
      rows.push({ title: `Versus: ${b.title}`, when: b.status, role: "Contestant" });
    for (const v of (votes.data ?? []) as unknown as {
      versus_battles: { title: string; status: string };
    }[])
      rows.push({
        title: `Versus: ${v.versus_battles.title}`,
        when: v.versus_battles.status,
        role: "Voter",
      });
    const seen = new Set<string>();
    for (const b of (bids.data ?? []) as unknown as {
      work_id: string;
      works: { title: string; auction_status: string; top_bidder_id: string };
    }[]) {
      if (seen.has(b.work_id)) continue;
      seen.add(b.work_id);
      rows.push({
        title: `Auction: ${b.works.title}`,
        when: b.works.auction_status,
        role:
          b.works.top_bidder_id === userId
            ? b.works.auction_status === "closed"
              ? "Won"
              : "Top bidder"
            : "Outbid",
      });
    }
    return rows;
  }, [userId]);
  return (
    <Card
      title="Event Centre"
      subtitle="Galleries you've RSVP'd to, battles you're in or voted on, and auctions you've bid on."
    >
      <div className="divide-y divide-border/60 border border-border/60 rounded-lg overflow-hidden">
        {(ev.data ?? []).map((e, i) => (
          <div key={i} className="flex items-center justify-between bg-background p-4">
            <div>
              <div className="font-display text-sm">{e.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{e.when}</div>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-wider">
              {e.role}
            </span>
          </div>
        ))}
        {ev.data?.length === 0 && (
          <div className="p-4 text-xs text-muted-foreground">
            Nothing yet. Browse{" "}
            <Link to="/versus" className="text-primary">
              Versus
            </Link>{" "}
            or{" "}
            <Link to="/gallery" className="text-primary">
              galleries
            </Link>
            .
          </div>
        )}
      </div>
    </Card>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-6">
      <h2 className="font-display text-xl">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1 mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-background p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 ${mono ? "font-mono text-sm" : "font-display text-base"}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </label>
  );
}
