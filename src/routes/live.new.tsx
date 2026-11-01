import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/live/new")({
  component: GoLivePage,
  head: () => ({
    meta: [
      { title: "Go Live · Vinci" },
      { property: "og:title", content: "Go Live · Vinci" },
      { property: "og:description", content: "Prepare a Vinci stream with a title, discipline, category and cover frame." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "description", content: "Set up your stream — title, discipline, cover frame. Anyone can go live." },
    ],
  }),
});

const DISCIPLINES = [
  "Painting", "Calligraphy", "Sculpture", "Ceramics", "Textile",
  "Digital", "Photography", "Printmaking", "Music", "Performance",
];

const CATEGORIES = [
  { slug: "studio", label: "Studio session" },
  { slug: "tutorial", label: "Tutorial / masterclass" },
  { slug: "commission", label: "Live commission" },
  { slug: "versus", label: "Versus battle" },
  { slug: "showcase", label: "Showcase / drop" },
];

function GoLivePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [category, setCategory] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [tipsOn, setTipsOn] = useState(false);
  const [auctionOn, setAuctionOn] = useState(false);
  const [versusOn, setVersusOn] = useState(false);
  const [starting, setStarting] = useState(false);

  // Visitor number (anonymous broadcaster identity). Client-only to avoid SSR mismatch.
  const [visitorNumber, setVisitorNumber] = useState<string | null>(null);
  useEffect(() => {
    if (user) return;
    let v = localStorage.getItem("vinci_visitor_number");
    if (!v) {
      const n = Math.floor(1000 + Math.random() * 9000);
      v = `VISITOR-${n}`;
      localStorage.setItem("vinci_visitor_number", v);
    }
    setVisitorNumber(v);
  }, [user]);

  const personalId = useMemo(() => {
    if (!user) return null;
    return `VNC-${user.id.slice(0, 4).toUpperCase()}-${user.id.slice(-4).toUpperCase()}`;
  }, [user]);

  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setCover(reader.result as string);
    reader.readAsDataURL(f);
  };

  const canStart = title.trim() && discipline && category && cover;

  const onStart = async () => {
    if (!canStart) return;
    setStarting(true);
    // MVP: simulate ingest handshake, then land on a placeholder live page.
    await new Promise(r => setTimeout(r, 600));
    const streamId = `live-${Date.now().toString(36)}`;
    navigate({ to: "/stream/$id", params: { id: streamId } });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← Vinci
      </Link>

      <div className="mt-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Green room</div>
        <h1 className="mt-1 font-display text-3xl md:text-4xl tracking-tight">Go live</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anyone can broadcast. Title, discipline and a cover frame are required.
          {!user && " Sign in to unlock tips, auctions and Versus."}
        </p>
      </div>

      {/* Identity strip */}
      <div className="mt-6 rounded-lg border border-border bg-card/40 p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Broadcasting as</div>
          {loading ? (
            <div className="mt-1 h-5 w-40 bg-card animate-pulse rounded" />
          ) : user ? (
            <div className="mt-1">
              <div className="font-display text-sm">{user.user_metadata?.display_name || user.email}</div>
              <div className="font-mono text-[11px] text-primary">{personalId}</div>
            </div>
          ) : (
            <div className="mt-1">
              <div className="font-display text-sm">Anonymous broadcaster</div>
              <div className="font-mono text-[11px] text-muted-foreground" suppressHydrationWarning>
                {visitorNumber ?? "VISITOR-…"}
              </div>
            </div>
          )}
        </div>
        {!user && (
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="h-9 inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-4 text-xs text-primary hover:bg-primary/20"
          >
            Sign up to get a Personal ID
          </Link>
        )}
      </div>

      {/* Setup */}
      <div className="mt-6 space-y-6 rounded-lg border border-border bg-card/40 p-6">
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Late-night ink studies"
            maxLength={80}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-6">
          <Field label="Discipline" required>
            <select
              value={discipline}
              onChange={e => setDiscipline(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Choose…</option>
              {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Category" required>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Choose…</option>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Cover frame" required hint="Shown on stream cards and shares. Use a clear, high-contrast image.">
          <div className="flex items-start gap-4">
            <label className="relative grid place-items-center h-32 w-44 rounded-md border border-dashed border-border bg-background overflow-hidden cursor-pointer hover:border-primary/60">
              {cover ? (
                <img src={cover} alt="Cover preview" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">Click to upload</span>
              )}
              <input type="file" accept="image/*" onChange={onCoverChange} className="hidden" />
            </label>
            {cover && (
              <button
                type="button"
                onClick={() => setCover(null)}
                className="h-9 rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </Field>

        {/* Monetisation — gated */}
        <div className="rounded-md border border-border/60 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-display">Monetisation</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {user ? "Choose how viewers can support this stream." : "Sign in to receive tips, run an auction, or enter Versus."}
              </div>
            </div>
            {!user && (
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="h-8 inline-flex items-center rounded-md border border-border px-3 text-xs hover:border-primary/60"
              >
                Sign in
              </Link>
            )}
          </div>

          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <Toggle
              label="Tips (🐚)"
              checked={tipsOn}
              disabled={!user}
              onChange={setTipsOn}
            />
            <Toggle
              label="Live auction"
              checked={auctionOn}
              disabled={!user}
              onChange={setAuctionOn}
            />
            <Toggle
              label="Versus eligible"
              checked={versusOn}
              disabled={!user}
              onChange={setVersusOn}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
          <div className="text-xs text-muted-foreground">
            {canStart ? "Ready to broadcast." : "Title, discipline, category and cover are required."}
          </div>
          <button
            type="button"
            disabled={!canStart || starting}
            onClick={onStart}
            className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? "Connecting…" : "Start broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}{required && <span className="text-primary ml-1">*</span>}
      </div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </label>
  );
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 rounded-md border px-3 h-10 text-xs transition-colors ${
        disabled
          ? "border-border/40 bg-card/20 text-muted-foreground cursor-not-allowed"
          : checked
            ? "border-primary/60 bg-primary/10 text-primary"
            : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <span>{label}</span>
      <span className={`h-4 w-7 rounded-full relative transition-colors ${checked && !disabled ? "bg-primary" : "bg-border"}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all ${checked && !disabled ? "left-3.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}
