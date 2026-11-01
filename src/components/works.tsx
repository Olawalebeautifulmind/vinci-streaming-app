import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { getCraft, enabledCrafts } from "@/lib/crafts";
import { displayName, publicUrl, type WorkWithCreator, type Work } from "@/lib/data";
import { cowries, friendlyError, timeLeft } from "@/lib/format";

export function WorkThumb({
  work,
  className = "aspect-[4/3]",
}: {
  work: Work;
  className?: string;
}) {
  const craft = getCraft(work.craft);
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 80% at 30% 20%, ${craft?.accent ?? "#c9a84c"}33 0%, transparent 60%), ${craft?.base ?? "#1a1208"}`,
      }}
    >
      {work.image_url ? (
        <img
          src={work.image_url}
          alt={work.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 noise opacity-70" />
          <div className="absolute inset-0 flex items-end p-4">
            <span className="font-display text-2xl leading-none" style={{ color: craft?.accent }}>
              {work.title}
            </span>
          </div>
        </>
      )}
      <div className="absolute top-3 right-3">
        <WorkStatusPill work={work} />
      </div>
    </div>
  );
}

export function WorkStatusPill({ work }: { work: Work }) {
  const label =
    work.status === "sold_out"
      ? "Collected"
      : work.status === "archived"
        ? "Archived"
        : work.sale_mode === "auction" && work.auction_status === "open"
          ? "Auction"
          : work.sale_mode === "fixed"
            ? "Available"
            : "Portfolio";
  const styles =
    label === "Available" || label === "Auction"
      ? "bg-primary text-primary-foreground"
      : label === "Collected"
        ? "bg-black/70 text-primary border border-primary/40"
        : "bg-black/70 text-white/70";
  return (
    <span
      className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

export function priceLine(w: Work) {
  if (w.sale_mode === "auction") {
    if (w.auction_status === "open")
      return w.current_bid ? `Top bid ${cowries(w.current_bid)}` : `Starts at ${cowries(w.price)}`;
    return w.current_bid ? `Sold at auction · ${cowries(w.current_bid)}` : "Auction closed";
  }
  if (w.sale_mode === "fixed")
    return `${cowries(w.price)} · ${w.edition_size - w.editions_sold}/${w.edition_size} left`;
  return "Not for sale";
}

export function WorkCard({ work, onChanged }: { work: WorkWithCreator; onChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="group rounded-lg border border-border overflow-hidden bg-card hover:border-primary/40 transition-colors">
      <button onClick={() => setOpen(true)} className="block w-full text-left">
        <WorkThumb work={work} />
      </button>
      <div className="p-4 space-y-2">
        <div className="text-sm font-medium truncate">{work.title}</div>
        {work.creator?.handle && (
          <Link
            to="/creator/$handle"
            params={{ handle: work.creator.handle }}
            className="block text-xs text-muted-foreground hover:text-primary truncate"
          >
            {displayName(work.creator)}
          </Link>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary font-display">{priceLine(work)}</span>
          <button
            onClick={() => setOpen(true)}
            className="h-7 rounded-md border border-border px-2 hover:border-primary/60"
          >
            View
          </button>
        </div>
      </div>
      {open && <WorkDialog work={work} onClose={() => setOpen(false)} onChanged={onChanged} />}
    </article>
  );
}

/** Buy now, bid, or close the auction. Shows the certificate after a sale. */
export function WorkDialog({
  work,
  onClose,
  onChanged,
}: {
  work: WorkWithCreator;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [w, setW] = useState(work);
  const [ship, setShip] = useState("");
  const [bid, setBid] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [serial, setSerial] = useState<string | null>(null);
  const [, tick] = useState(0);
  const own = user?.id === w.creator_id;
  const minBid = w.current_bid ? w.current_bid + w.min_increment : (w.price ?? 0);

  useEffect(() => setBid(minBid), [minBid]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    const ch = supabase
      .channel(`work:${w.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "works", filter: `id=eq.${w.id}` },
        (p) => setW((cur) => ({ ...cur, ...(p.new as Work) })),
      )
      .subscribe();
    return () => {
      clearInterval(t);
      void supabase.removeChannel(ch);
    };
  }, [w.id]);

  const act = async (
    fn: () => PromiseLike<{ data: unknown; error: { message: string } | null }>,
  ) => {
    if (!requireAuth("collect this piece")) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await fn();
    setBusy(false);
    if (error) return setErr(friendlyError(error));
    if (typeof data === "string") setSerial(data);
    onChanged?.();
  };

  const needsShip = w.delivery === "physical";
  const auctionOpen = w.sale_mode === "auction" && w.auction_status === "open";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-card overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <WorkThumb work={w} className="aspect-[16/9]" />
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-display text-2xl">{w.title}</h3>
            <div className="text-xs text-muted-foreground mt-1">
              {displayName(w.creator)} · {getCraft(w.craft)?.name}
              {w.medium ? ` · ${w.medium}` : ""} · Edition of {w.edition_size} ·{" "}
              {w.delivery === "physical" ? "Ships to you" : "Digital certificate"}
              {w.ships_from ? ` · from ${w.ships_from}` : ""}
            </div>
            {w.description && <p className="mt-3 text-sm text-muted-foreground">{w.description}</p>}
          </div>

          {serial ? (
            <div className="rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
              <div className="text-[10px] uppercase tracking-widest text-primary">
                Certificate issued
              </div>
              <div className="font-mono mt-1">{serial}</div>
              <Link
                to="/certificate/$serial"
                params={{ serial }}
                className="mt-3 inline-block text-primary hover:underline"
              >
                View certificate →
              </Link>
            </div>
          ) : (
            <>
              <div className="font-display text-lg text-primary">{priceLine(w)}</div>
              {auctionOpen && (
                <div className="text-xs text-muted-foreground">
                  Closes in {timeLeft(w.auction_ends_at)}
                </div>
              )}

              {!own &&
                needsShip &&
                (w.sale_mode === "fixed" ? w.status === "available" : auctionOpen) && (
                  <textarea
                    value={ship}
                    onChange={(e) => setShip(e.target.value.slice(0, 300))}
                    placeholder="Shipping address (only the artist sees this)"
                    rows={2}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                )}

              {!own && w.sale_mode === "fixed" && w.status === "available" && (
                <button
                  disabled={busy}
                  onClick={() =>
                    act(() =>
                      supabase.rpc("buy_work", { _work: w.id, _shipping: ship || undefined }),
                    )
                  }
                  className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-accent disabled:opacity-50"
                >
                  Buy now · {cowries(w.price)}
                </button>
              )}

              {!own && auctionOpen && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={minBid}
                    step={w.min_increment}
                    value={bid}
                    onChange={(e) => setBid(Number(e.target.value))}
                    className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm"
                  />
                  <button
                    disabled={busy}
                    onClick={() =>
                      act(() =>
                        supabase.rpc("place_bid", {
                          _work: w.id,
                          _amount: bid,
                          _shipping: ship || undefined,
                        }),
                      )
                    }
                    className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-accent disabled:opacity-50"
                  >
                    Place bid
                  </button>
                </div>
              )}
              {w.top_bidder_id && user?.id === w.top_bidder_id && auctionOpen && (
                <div className="text-xs text-primary">
                  You're the top bidder. Your bid is held until you're outbid or the auction closes.
                </div>
              )}

              {own && auctionOpen && (
                <button
                  disabled={busy}
                  onClick={() => act(() => supabase.rpc("close_auction", { _work: w.id }))}
                  className="h-10 w-full rounded-md border border-primary/60 text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  Close auction now {w.current_bid ? `and sell for ${cowries(w.current_bid)}` : ""}
                </button>
              )}
              {own && <div className="text-xs text-muted-foreground">This is your piece.</div>}
            </>
          )}
          {err && <div className="text-sm text-destructive">{err}</div>}
          <button
            onClick={onClose}
            className="h-9 w-full rounded-md border border-border text-xs hover:border-primary/60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Creators add a piece: buy-now listing, auction lot, or portfolio-only. */
export function WorkForm({
  streamId,
  defaultCraft,
  onCreated,
}: {
  streamId?: string;
  defaultCraft?: string;
  onCreated?: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [craft, setCraft] = useState(defaultCraft ?? enabledCrafts[0].slug);
  const [medium, setMedium] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"fixed" | "auction" | "none">("fixed");
  const [price, setPrice] = useState(500);
  const [edition, setEdition] = useState(1);
  const [delivery, setDelivery] = useState<"physical" | "digital">("physical");
  const [shipsFrom, setShipsFrom] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setMsg(null);
    try {
      const image_url = file ? await publicUrl(file, user.id, "works") : null;
      const { error } = await supabase.from("works").insert({
        creator_id: user.id,
        craft,
        stream_id: streamId ?? null,
        title: title.trim(),
        medium: medium.trim() || null,
        description: description.trim() || null,
        year: new Date().getFullYear(),
        image_url,
        sale_mode: mode,
        price: mode === "none" ? null : price,
        edition_size: mode === "auction" ? 1 : edition,
        delivery,
        ships_from: shipsFrom.trim() || null,
        auction_ends_at:
          mode === "auction" ? new Date(Date.now() + minutes * 60_000).toISOString() : null,
      });
      if (error) throw error;
      setTitle("");
      setDescription("");
      setFile(null);
      setMsg({ ok: true, text: "Piece added." });
      onCreated?.();
    } catch (err) {
      setMsg({ ok: false, text: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  };

  const input = "h-9 w-full rounded-md border border-border bg-background px-3 text-sm";
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2 text-xs text-muted-foreground">
        Title
        <input
          required
          minLength={2}
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${input} mt-1`}
          placeholder="e.g. Aurora strand"
        />
      </label>
      {!defaultCraft && (
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
      )}
      <label className="text-xs text-muted-foreground">
        Medium
        <input
          value={medium}
          onChange={(e) => setMedium(e.target.value)}
          className={`${input} mt-1`}
          placeholder="e.g. Glass seed beads"
        />
      </label>
      <label className="text-xs text-muted-foreground">
        How it sells
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          className={`${input} mt-1`}
        >
          <option value="fixed">Buy now</option>
          <option value="auction">Live auction</option>
          <option value="none">Portfolio only</option>
        </select>
      </label>
      {mode !== "none" && (
        <label className="text-xs text-muted-foreground">
          {mode === "auction" ? "Starting bid (🐚)" : "Price (🐚)"}
          <input
            type="number"
            min={0}
            step={10}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className={`${input} mt-1`}
          />
        </label>
      )}
      {mode === "fixed" && (
        <label className="text-xs text-muted-foreground">
          Edition size
          <input
            type="number"
            min={1}
            max={500}
            value={edition}
            onChange={(e) => setEdition(Number(e.target.value))}
            className={`${input} mt-1`}
          />
        </label>
      )}
      {mode === "auction" && (
        <label className="text-xs text-muted-foreground">
          Auction length (minutes)
          <input
            type="number"
            min={2}
            max={1440}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className={`${input} mt-1`}
          />
        </label>
      )}
      <label className="text-xs text-muted-foreground">
        Delivery
        <select
          value={delivery}
          onChange={(e) => setDelivery(e.target.value as typeof delivery)}
          className={`${input} mt-1`}
        >
          <option value="physical">Physical, I ship it</option>
          <option value="digital">Digital certificate only</option>
        </select>
      </label>
      {delivery === "physical" && (
        <label className="text-xs text-muted-foreground">
          Ships from
          <input
            value={shipsFrom}
            onChange={(e) => setShipsFrom(e.target.value)}
            className={`${input} mt-1`}
            placeholder="City, country"
          />
        </label>
      )}
      <label className="text-xs text-muted-foreground">
        Photo (optional)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-xs"
        />
      </label>
      <label className="sm:col-span-2 text-xs text-muted-foreground">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={2}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          disabled={busy || title.trim().length < 2}
          className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-accent disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add piece"}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? "text-primary" : "text-destructive"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
