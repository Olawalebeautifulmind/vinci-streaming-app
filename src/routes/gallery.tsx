import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { enabledCrafts, getCraft } from "@/lib/crafts";
import {
  displayName,
  listWorks,
  profilesByIds,
  useLoad,
  type Gallery,
  type WorkWithCreator,
} from "@/lib/data";
import { cowries, friendlyError } from "@/lib/format";
import { WorkDialog, priceLine } from "@/components/works";
import { EmptyState } from "@/components/StreamCard";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Virtual Galleries — Vinci" },
      {
        name: "description",
        content:
          "Group shows of bead making and pottery. Pay one entry fee, walk the room, buy straight off the wall.",
      },
      { property: "og:title", content: "Virtual Galleries — Vinci" },
    ],
  }),
  component: GalleryIndex,
});

const statusOf = (g: Gallery) => {
  const now = Date.now();
  if (now < new Date(g.starts_at).getTime()) return "upcoming";
  if (now > new Date(g.ends_at).getTime()) return "ended";
  return "live";
};

function GalleryIndex() {
  const { profile } = useWallet();
  const [selected, setSelected] = useState<Gallery | null>(null);
  const galleries = useLoad(async () => {
    const { data } = await supabase
      .from("galleries")
      .select("*")
      .order("starts_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as Gallery[];
    const { data: hung } = await supabase
      .from("gallery_works")
      .select("gallery_id, work_id")
      .in("gallery_id", rows.map((r) => r.id).concat(["00000000-0000-0000-0000-000000000000"]));
    const counts = new Map<string, number>();
    for (const h of hung ?? []) counts.set(h.gallery_id, (counts.get(h.gallery_id) ?? 0) + 1);
    return {
      rows: rows.filter((g) => statusOf(g) !== "ended"),
      counts,
      curators: await profilesByIds(rows.map((r) => r.curator_id)),
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Vinci · Virtual Gallery
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl tracking-tight">
          Walk the room. Buy the wall.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Group shows curated by makers. One entry fee gets you in, split between the artists on the
          wall. Every piece is for sale, and the maker ships it to you.
        </p>
      </header>

      {profile?.is_creator && <CreateGallery onCreated={() => void galleries.reload()} />}

      {galleries.loading ? (
        <div className="h-40 rounded-lg bg-card animate-pulse" />
      ) : galleries.data!.rows.length === 0 ? (
        <EmptyState
          title="No galleries open right now."
          body={
            profile?.is_creator
              ? "Curate the first one above."
              : "Makers curate group shows here. Check back soon."
          }
        />
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.data!.rows.map((g) => (
            <article key={g.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div
                className="relative aspect-[4/3]"
                style={{ background: `linear-gradient(135deg, ${g.palette_a}, ${g.palette_b})` }}
              >
                <MiniRoomSVG palette={[g.palette_a, g.palette_b]} />
                <div className="absolute left-3 top-3">
                  {statusOf(g) === "live" ? (
                    <span className="rounded-sm bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                      Open
                    </span>
                  ) : (
                    <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white">
                      {new Date(g.starts_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="absolute right-3 top-3 rounded-sm bg-black/60 px-2 py-0.5 text-[10px] font-mono text-white">
                  {g.entry_fee ? `${g.entry_fee} 🐚 entry` : "Free entry"}
                </div>
                <div className="absolute bottom-3 left-3 text-[11px] text-white/90">
                  {getCraft(g.craft)?.emoji} {galleries.data!.counts.get(g.id) ?? 0} pieces
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg leading-tight">{g.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Curated by {displayName(galleries.data!.curators.get(g.curator_id))}
                </p>
                {g.theme && <p className="mt-1 text-xs text-muted-foreground">{g.theme}</p>}
                <button
                  onClick={() => setSelected(g)}
                  className="mt-4 h-9 w-full rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-accent"
                >
                  {statusOf(g) === "live" ? "Enter the room" : "Preview & RSVP"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="mt-16 rounded-xl border border-border bg-card/40 p-8">
        <h2 className="font-display text-2xl">How a Vinci Gallery works</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="font-mono text-xs text-primary">01</p>
            <h3 className="mt-2 font-display">A maker curates a show</h3>
            <p className="mt-1 text-muted-foreground">
              They set the theme, dates and one entry fee. Other makers hang their available pieces.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs text-primary">02</p>
            <h3 className="mt-2 font-display">Viewers pay once</h3>
            <p className="mt-1 text-muted-foreground">
              The fee is split equally between the artists on the wall. Artists and the curator
              enter free.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs text-primary">03</p>
            <h3 className="mt-2 font-display">Buy off the wall</h3>
            <p className="mt-1 text-muted-foreground">
              Tap a frame to buy. You get a Vinci certificate and the maker ships the piece.
            </p>
          </div>
        </div>
      </section>

      {selected && (
        <GalleryRoom
          gallery={selected}
          onClose={() => {
            setSelected(null);
            void galleries.reload();
          }}
        />
      )}
    </div>
  );
}

function CreateGallery({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [craft, setCraft] = useState<string>(enabledCrafts[0].slug);
  const [fee, setFee] = useState(10);
  const [start, setStart] = useState(() =>
    new Date(Date.now() - 60_000).toISOString().slice(0, 16),
  );
  const [days, setDays] = useState(7);
  const [err, setErr] = useState<string | null>(null);
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-8 h-10 rounded-md border border-primary/40 bg-primary/10 px-4 text-xs font-medium text-primary"
      >
        Curate a gallery
      </button>
    );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const starts = new Date(start);
    const c = getCraft(craft)!;
    const { error } = await supabase.from("galleries").insert({
      curator_id: user!.id,
      title,
      theme: theme || null,
      craft,
      entry_fee: fee,
      starts_at: starts.toISOString(),
      ends_at: new Date(starts.getTime() + days * 86400_000).toISOString(),
      palette_a: c.base,
      palette_b: c.accent,
    });
    if (error) return setErr(friendlyError(error));
    setOpen(false);
    onCreated();
  };
  const input = "h-9 w-full rounded-md border border-border bg-background px-3 text-sm mt-1";
  return (
    <form
      onSubmit={submit}
      className="mb-10 rounded-lg border border-border bg-card/40 p-5 grid gap-3 md:grid-cols-3"
    >
      <label className="text-xs text-muted-foreground md:col-span-2">
        Title
        <input
          required
          minLength={3}
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={input}
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Craft
        <select value={craft} onChange={(e) => setCraft(e.target.value)} className={input}>
          {enabledCrafts.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted-foreground md:col-span-3">
        Theme
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Ash & iron: wood-fired cups"
          className={input}
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Entry fee (🐚)
        <input
          type="number"
          min={0}
          max={10000}
          value={fee}
          onChange={(e) => setFee(Number(e.target.value))}
          className={input}
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Opens
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className={input}
        />
      </label>
      <label className="text-xs text-muted-foreground">
        Runs for (days)
        <input
          type="number"
          min={1}
          max={60}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className={input}
        />
      </label>
      <div className="md:col-span-3 flex gap-2 items-center">
        <button className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground">
          Create gallery
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 rounded-md border border-border px-4 text-xs"
        >
          Cancel
        </button>
        {err && <span className="text-xs text-destructive">{err}</span>}
      </div>
    </form>
  );
}

function GalleryRoom({ gallery, onClose }: { gallery: Gallery; onClose: () => void }) {
  const { user } = useAuth();
  const { profile } = useWallet();
  const requireAuth = useRequireAuth();
  const status = statusOf(gallery);
  const [hasPass, setHasPass] = useState(false);
  const [rsvp, setRsvp] = useState(false);
  const [wall, setWall] = useState(0);
  const [piece, setPiece] = useState<WorkWithCreator | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const works = useLoad(async () => {
    const { data } = await supabase
      .from("gallery_works")
      .select("work_id")
      .eq("gallery_id", gallery.id);
    return listWorks({ ids: (data ?? []).map((d) => d.work_id) });
  }, [gallery.id]);
  const mine = useLoad(
    async () =>
      profile?.is_creator && user ? listWorks({ creatorId: user.id, status: ["available"] }) : [],
    [user?.id, profile?.is_creator],
  );

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("gallery_passes")
      .select("gallery_id")
      .eq("gallery_id", gallery.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setHasPass(!!data));
    void supabase
      .from("gallery_rsvps")
      .select("gallery_id")
      .eq("gallery_id", gallery.id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setRsvp(!!data));
  }, [user, gallery.id]);

  const enter = async () => {
    if (!requireAuth("enter the gallery")) return;
    setErr(null);
    const { error } = await supabase.rpc("enter_gallery", { _gallery: gallery.id });
    if (error) setErr(friendlyError(error));
    else setHasPass(true);
  };
  const toggleRsvp = async () => {
    if (!requireAuth("RSVP")) return;
    if (rsvp)
      await supabase
        .from("gallery_rsvps")
        .delete()
        .eq("gallery_id", gallery.id)
        .eq("user_id", user!.id);
    else await supabase.from("gallery_rsvps").insert({ gallery_id: gallery.id, user_id: user!.id });
    setRsvp(!rsvp);
  };
  const hang = async (workId: string) => {
    const { error } = await supabase
      .from("gallery_works")
      .insert({ gallery_id: gallery.id, work_id: workId });
    if (error) setErr(friendlyError(error));
    void works.reload();
  };

  const list = works.data ?? [];
  const walls = [list.slice(0, 4), list.slice(4, 6), list.slice(6, 8)];
  const canSee = hasPass || status !== "live";
  const hungIds = new Set(list.map((w) => w.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-background max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {status === "live" ? "Open now" : "Preview"} ·{" "}
              {gallery.entry_fee ? `${gallery.entry_fee} 🐚 entry` : "Free"}
            </p>
            <h2 className="font-display text-lg leading-tight">{gallery.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground"
          >
            Close
          </button>
        </header>

        <div className="relative aspect-[16/9] bg-neutral-950">
          {status === "live" && !hasPass ? (
            <div className="absolute inset-0 grid place-items-center text-center p-6">
              <div>
                <p className="text-sm text-white/80">{list.length} pieces on the walls.</p>
                <button
                  onClick={enter}
                  className="mt-4 h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground"
                >
                  Enter · {gallery.entry_fee ? cowries(gallery.entry_fee) : "free"}
                </button>
              </div>
            </div>
          ) : (
            <Room
              walls={walls}
              wall={wall}
              palette={[gallery.palette_a, gallery.palette_b]}
              onPick={setPiece}
            />
          )}
          {canSee && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 rounded-full bg-black/70 px-3 py-1.5">
              {["Back wall", "Left wall", "Right wall"].map((label, i) => (
                <button
                  key={label}
                  onClick={() => setWall(i)}
                  className={`rounded-full px-3 py-1 text-[11px] ${wall === i ? "bg-primary text-primary-foreground" : "text-white/70"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card/40 p-4 space-y-3">
          {status === "upcoming" && (
            <button
              onClick={toggleRsvp}
              className="h-9 rounded-md border border-primary/60 px-4 text-xs text-primary"
            >
              {rsvp ? "RSVP'd ✓ (tap to cancel)" : "RSVP"}
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            {canSee ? "Tap a frame to see the piece and buy it." : ""}
          </p>
          {profile?.is_creator && (mine.data?.length ?? 0) > 0 && (
            <div className="text-xs">
              <div className="text-muted-foreground mb-2">Hang one of your available pieces:</div>
              <div className="flex flex-wrap gap-2">
                {mine
                  .data!.filter((w) => !hungIds.has(w.id) && w.craft === gallery.craft)
                  .map((w) => (
                    <button
                      key={w.id}
                      onClick={() => hang(w.id)}
                      className="h-8 rounded-md border border-border px-3 hover:border-primary/60"
                    >
                      + {w.title}
                    </button>
                  ))}
              </div>
            </div>
          )}
          {err && <div className="text-xs text-destructive">{err}</div>}
        </div>
        {piece && (
          <WorkDialog
            work={piece}
            onClose={() => setPiece(null)}
            onChanged={() => void works.reload()}
          />
        )}
      </div>
    </div>
  );
}

function Room({
  walls,
  wall,
  palette,
  onPick,
}: {
  walls: WorkWithCreator[][];
  wall: number;
  palette: [string, string];
  onPick: (w: WorkWithCreator) => void;
}) {
  const styles: React.CSSProperties[] = [
    { left: "20%", right: "20%", top: "10%", bottom: "30%" },
    {
      left: "0%",
      width: "20%",
      top: "10%",
      bottom: "30%",
      transform: "perspective(800px) rotateY(35deg)",
      transformOrigin: "right",
    },
    {
      right: "0%",
      width: "20%",
      top: "10%",
      bottom: "30%",
      transform: "perspective(800px) rotateY(-35deg)",
      transformOrigin: "left",
    },
  ];
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${palette[1]}33, transparent 60%), #0a0a0a`,
      }}
    >
      {walls.map((pieces, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-around px-3 transition-opacity"
          style={{
            ...styles[i],
            background: wall === i ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
            opacity: wall === i ? 1 : 0.35,
          }}
        >
          {pieces.length === 0 && wall === i && (
            <span className="text-[11px] text-white/40">Empty wall</span>
          )}
          {pieces.map((w) => (
            <button
              key={w.id}
              disabled={wall !== i}
              onClick={() => onPick(w)}
              title={`${w.title} · ${priceLine(w)}`}
              className="group relative aspect-[3/4] h-[70%] overflow-hidden rounded-sm border border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:scale-[1.04] transition-transform disabled:cursor-default"
              style={{ background: palette[0] }}
            >
              {w.image_url && (
                <img
                  src={w.image_url}
                  alt={w.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span className="absolute bottom-1 left-1 right-1 rounded-sm bg-black/60 px-1 py-0.5 text-[9px] text-white/90 truncate">
                {w.title}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function MiniRoomSVG({ palette }: { palette: [string, string] }) {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full opacity-90">
      <polygon points="0,300 400,300 320,180 80,180" fill="rgba(0,0,0,0.35)" />
      <rect x="80" y="60" width="240" height="120" fill="rgba(255,255,255,0.06)" />
      <rect x="110" y="90" width="50" height="60" fill={palette[1]} opacity="0.85" />
      <rect x="175" y="80" width="50" height="70" fill="rgba(255,255,255,0.85)" />
      <rect x="240" y="95" width="50" height="55" fill={palette[0]} opacity="0.85" />
      <polygon points="0,0 80,60 80,180 0,300" fill="rgba(0,0,0,0.45)" />
      <polygon points="400,0 320,60 320,180 400,300" fill="rgba(0,0,0,0.45)" />
    </svg>
  );
}
