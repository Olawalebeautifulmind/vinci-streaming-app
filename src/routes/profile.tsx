import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Your profile · Vinci" },
      { property: "og:title", content: "Your profile · Vinci" },
      { property: "og:description", content: "Manage your Vinci profile and explore sample achievements, posts and events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Manage your Vinci identity, achievements, posts, events, and on-chain gallery." },
    ],
  }),
});

type Profile = {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  region: string | null;
  wallet_address: string | null;
};

const REGIONS = [
  "Africa", "Europe", "North America", "South America", "Asia", "Oceania", "Middle East",
];

// --- Achievement tiers ----------------------------------------------------
const TIERS = [
  { name: "Apprentice", min: 0, color: "#9ca3af" },
  { name: "Maker", min: 100, color: "#c9a84c" },
  { name: "Artisan", min: 500, color: "#e85d3a" },
  { name: "Master", min: 1500, color: "#a78bfa" },
  { name: "Luminary", min: 5000, color: "#4ade80" },
];

function levelFor(xp: number) {
  const current = [...TIERS].reverse().find(t => xp >= t.min) ?? TIERS[0];
  const next = TIERS.find(t => t.min > xp);
  const progress = next ? ((xp - current.min) / (next.min - current.min)) * 100 : 100;
  return { current, next, progress };
}

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { mode: "signin" } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      setProfile(
        (p as Profile) ?? {
          id: user.id,
          display_name: null,
          handle: null,
          avatar_url: null,
          region: null,
          wallet_address: null,
        }
      );
      setRoles((r ?? []).map((x: { role: string }) => x.role));
      setLoading(false);
    })();
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: profile.display_name,
        handle: profile.handle,
        avatar_url: profile.avatar_url,
        region: profile.region,
        wallet_address: profile.wallet_address,
      });
    setSaving(false);
    setMsg(error ? { type: "err", text: error.message } : { type: "ok", text: "Profile saved." });
  };

  // Derived: deterministic mock XP from user id (MVP — no XP table yet)
  const xp = useMemo(() => {
    if (!user) return 0;
    let h = 0;
    for (const c of user.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 2200;
  }, [user]);
  const level = levelFor(xp);

  // Personal ID derived from user uuid (short, mono)
  const personalId = useMemo(() => {
    if (!user) return "";
    return `VNC-${user.id.slice(0, 4).toUpperCase()}-${user.id.slice(-4).toUpperCase()}`;
  }, [user]);

  if (authLoading || loading || !profile) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="h-8 w-48 bg-card animate-pulse rounded" />
        <div className="mt-6 h-64 bg-card animate-pulse rounded-lg" />
      </div>
    );
  }

  const initial = (profile.display_name || user!.email || "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Vinci
      </Link>

      {/* Masthead */}
      <div className="mt-6 grid md:grid-cols-[auto_1fr_auto] gap-6 items-start">
        <div className="grid h-24 w-24 place-items-center rounded-full border border-border bg-card font-display text-3xl overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">{personalId}</div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl tracking-tight">
            {profile.display_name || "Unnamed maker"}
          </h1>
          <div className="mt-1 text-sm text-muted-foreground truncate">{user!.email}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {roles.length === 0 ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">viewer</span>
            ) : roles.map(r => (
              <span key={r} className="rounded-full bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                {r}
              </span>
            ))}
          </div>
        </div>
        {profile.handle && (
          <Link
            to="/creator/$handle"
            params={{ handle: profile.handle }}
            className="h-9 inline-flex items-center rounded-md border border-border px-4 text-xs hover:border-primary/60"
          >
            View public profile
          </Link>
        )}
      </div>

      {/* Identity strip: Level · Location · Personal ID · Wallet */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-lg overflow-hidden text-sm">
        <div className="bg-background p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Level</div>
          <div className="mt-1 font-display text-base" style={{ color: level.current.color }}>{level.current.name}</div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-card overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${level.progress}%`, background: level.current.color }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {xp} XP{level.next ? ` · ${level.next.min - xp} to ${level.next.name}` : " · max tier"}
          </div>
        </div>
        <div className="bg-background p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Location</div>
          <div className="mt-1 font-display text-base">{profile.region || "—"}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Set in Identity</div>
        </div>
        <div className="bg-background p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Personal ID</div>
          <div className="mt-1 font-mono text-sm">{personalId}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Vinci registry</div>
        </div>
        <div className="bg-background p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Wallet</div>
          <div className="mt-1 font-mono text-sm truncate">
            {profile.wallet_address ? `${profile.wallet_address.slice(0, 6)}…${profile.wallet_address.slice(-4)}` : "Not linked"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Base · ERC-721</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="identity" className="mt-10">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="events">Event Centre</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        {/* Identity (existing form) */}
        <TabsContent value="identity" className="mt-6">
          <form onSubmit={onSave} className="space-y-6 rounded-lg border border-border bg-card/40 p-6">
            <h2 className="font-display text-xl">Identity</h2>

            <Field label="Display name">
              <input
                type="text"
                value={profile.display_name ?? ""}
                onChange={e => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="How collectors will see you"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </Field>

            <Field label="Handle" hint="Used in your profile URL. Letters, numbers, underscores.">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">vinci.app/creator/</span>
                <input
                  type="text"
                  value={profile.handle ?? ""}
                  onChange={e => setProfile({ ...profile, handle: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() })}
                  placeholder="yourname"
                  className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm font-mono"
                />
              </div>
            </Field>

            <Field label="Region">
              <select
                value={profile.region ?? ""}
                onChange={e => setProfile({ ...profile, region: e.target.value || null })}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Choose a region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <Field label="Avatar URL">
              <input
                type="url"
                value={profile.avatar_url ?? ""}
                onChange={e => setProfile({ ...profile, avatar_url: e.target.value || null })}
                placeholder="https://…"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </Field>

            <Field label="Wallet address" hint="Optional. Receives royalties and gifts.">
              <input
                type="text"
                value={profile.wallet_address ?? ""}
                onChange={e => setProfile({ ...profile, wallet_address: e.target.value || null })}
                placeholder="0x…"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm font-mono"
              />
            </Field>

            {msg && (
              <div className={`text-sm ${msg.type === "ok" ? "text-primary" : "text-destructive"}`}>
                {msg.text}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => signOut().then(() => navigate({ to: "/" }))}
                className="ml-auto h-10 rounded-md border border-border px-4 text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </form>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="mt-6">
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-display text-xl">Achievements</h2>
                <p className="text-sm text-muted-foreground mt-1">Earn XP by going live, selling work, and winning Versus rounds.</p>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl" style={{ color: level.current.color }}>{level.current.name}</div>
                <div className="text-xs text-muted-foreground">{xp} XP</div>
              </div>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TIERS.map(t => {
                const reached = xp >= t.min;
                return (
                  <div
                    key={t.name}
                    className={`rounded-lg border p-4 ${reached ? "border-border bg-background" : "border-border/40 bg-card/20 opacity-60"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-display" style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}66` }}>
                        {reached ? "✓" : "○"}
                      </div>
                      <div>
                        <div className="font-display text-sm" style={{ color: t.color }}>{t.name}</div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.min} XP</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Posts feed */}
        <TabsContent value="posts" className="mt-6">
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <h2 className="font-display text-xl">Posts</h2>
              <button className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-accent">
                New post
              </button>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <article key={i} className="rounded-lg border border-border overflow-hidden bg-background">
                  <div
                    className="aspect-square relative"
                    style={{ background: `radial-gradient(120% 80% at 30% 20%, #c9a84c33 0%, transparent 60%), #1a1208` }}
                  >
                    <div className="absolute top-2 left-2 rounded-sm bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white/90">
                      {i === 2 ? "VIDEO" : "IMAGE"}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-sm">Studio sketch #{i}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">2 days ago · 12 ❤</div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 text-xs text-muted-foreground">Feed posts (images, video, text) will publish to your followers and your public profile.</div>
          </div>
        </TabsContent>

        {/* Event Centre */}
        <TabsContent value="events" className="mt-6">
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-display text-xl">Event Centre</h2>
                <p className="text-sm text-muted-foreground mt-1">Streams, drops, and live battles you've signed up for.</p>
              </div>
              <Link to="/versus" className="h-9 inline-flex items-center rounded-md border border-border px-4 text-xs hover:border-primary/60">
                Browse events
              </Link>
            </div>
            <div className="mt-6 divide-y divide-border/60 border border-border/60 rounded-lg overflow-hidden">
              {[
                { title: "Versus: Lagos vs São Paulo", when: "Fri · 21:00 GMT", role: "Voter" },
                { title: "Open Studio — Kano Calligraphy", when: "Sat · 18:00 GMT", role: "Attending" },
                { title: "Monthly Drop · Cowrie Auction", when: "Sun · 20:00 GMT", role: "Bidder" },
              ].map(ev => (
                <div key={ev.title} className="flex items-center justify-between bg-background p-4">
                  <div>
                    <div className="font-display text-sm">{ev.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{ev.when}</div>
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-wider">{ev.role}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Gallery */}
        <TabsContent value="gallery" className="mt-6">
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-primary">Artistic Ownership Registry</div>
                <h2 className="font-display text-xl mt-1">On-chain gallery</h2>
                <p className="text-sm text-muted-foreground mt-1">Every work minted to your wallet on Base · ERC-721. Collectors can buy directly on Vinci.</p>
              </div>
              <Link to="/registry" className="h-9 inline-flex items-center rounded-md border border-border px-4 text-xs hover:border-primary/60">
                Open registry
              </Link>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Ode I", token: "#0042", price: 1200, status: "Available", accent: "#c9a84c", base: "#1a1208" },
                { title: "Harmattan", token: "#0043", price: 800, status: "Available", accent: "#e85d3a", base: "#1a1208" },
                { title: "Cowrie Drift", token: "#0044", price: null, status: "Collected", accent: "#a78bfa", base: "#0d0d1a" },
              ].map(w => (
                <article key={w.token} className="group rounded-lg border border-border overflow-hidden bg-background">
                  <div
                    className="relative aspect-[4/3]"
                    style={{ background: `radial-gradient(120% 80% at 30% 20%, ${w.accent}33 0%, transparent 60%), ${w.base}` }}
                  >
                    <div className="absolute top-3 left-3 rounded-sm bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white/90">{w.token}</div>
                    <div className="absolute top-3 right-3">
                      <span className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${w.status === "Available" ? "bg-primary text-primary-foreground" : "bg-black/70 text-primary border border-primary/40"}`}>
                        {w.status}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-end p-4">
                      <span className="font-display text-2xl leading-none" style={{ color: w.accent }}>{w.title}</span>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="text-sm">
                      {w.price != null ? <span className="font-display">{w.price.toLocaleString()} 🐚</span> : <span className="text-muted-foreground">—</span>}
                    </div>
                    <button className="h-8 rounded-md border border-border px-3 text-xs hover:border-primary/60">
                      {w.status === "Available" ? "Buy" : "View"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {!profile.wallet_address && (
              <div className="mt-6 rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                Link a wallet in <span className="text-foreground">Identity</span> to surface your real minted works here.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </label>
  );
}
