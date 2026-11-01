import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { DIFFICULTIES, FORMATS, enabledCrafts, getCraft } from "@/lib/crafts";
import { publicUrl } from "@/lib/data";
import { friendlyError, memberId } from "@/lib/format";

export const Route = createFileRoute("/live/new")({
  component: GoLivePage,
  validateSearch: z.object({ craft: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Go Live · Vinci" },
      {
        name: "description",
        content:
          "Set up your Vinci stream: craft, title and cover. Then go live from your browser or OBS.",
      },
      { property: "og:title", content: "Go Live · Vinci" },
    ],
  }),
});

function GoLivePage() {
  const { user, loading } = useAuth();
  const { profile, refreshProfile } = useWallet();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [craft, setCraft] = useState<string>(
    getCraft(search.craft)?.enabled ? search.craft! : enabledCrafts[0].slug,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [format, setFormat] = useState("studio");
  const [difficulty, setDifficulty] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [tipsOn, setTipsOn] = useState(true);
  const [auctionOn, setAuctionOn] = useState(true);
  const [versusOn, setVersusOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // creator onboarding
  const [handle, setHandle] = useState("");
  const [myCrafts, setMyCrafts] = useState<string[]>([enabledCrafts[0].slug]);

  const c = getCraft(craft)!;

  if (loading)
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="h-64 rounded-lg bg-card animate-pulse" />
      </div>
    );

  if (!user) {
    return (
      <Shell>
        <div className="rounded-lg border border-border bg-card/40 p-6 text-sm">
          <p>
            Sign in to open your studio. Streams are tied to your Vinci account so viewers can
            follow you, gift you and buy your work.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/auth"
              search={{ mode: "signup", redirect: "/live/new" }}
              className="h-10 inline-flex items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Create an account
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin", redirect: "/live/new" }}
              className="h-10 inline-flex items-center rounded-md border border-border px-5 text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (profile && !profile.is_creator) {
    const becomeCreator = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setErr(null);
      try {
        if (!profile.handle) {
          const { error } = await supabase.from("profiles").update({ handle }).eq("id", user.id);
          if (error) throw error;
        }
        const { error } = await supabase.rpc("become_creator", { _crafts: myCrafts });
        if (error) throw error;
        await refreshProfile();
      } catch (e2) {
        setErr(friendlyError(e2));
      } finally {
        setBusy(false);
      }
    };
    return (
      <Shell>
        <form
          onSubmit={becomeCreator}
          className="rounded-lg border border-border bg-card/40 p-6 space-y-5"
        >
          <div>
            <h2 className="font-display text-xl">Open your studio</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Pick your crafts and a handle. You can stream, sell and enter Versus straight away.
            </p>
          </div>
          {!profile.handle && (
            <Field
              label="Handle"
              hint="3 to 30 lowercase letters, numbers or underscores. This is your public URL."
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/creator/</span>
                <input
                  required
                  value={handle}
                  onChange={(e) =>
                    setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm font-mono"
                />
              </div>
            </Field>
          )}
          <Field label="Your crafts">
            <div className="flex gap-2 flex-wrap">
              {enabledCrafts.map((cr) => (
                <Chip
                  key={cr.slug}
                  on={myCrafts.includes(cr.slug)}
                  onClick={() =>
                    setMyCrafts((m) =>
                      m.includes(cr.slug) ? m.filter((x) => x !== cr.slug) : [...m, cr.slug],
                    )
                  }
                >
                  {cr.emoji} {cr.name}
                </Chip>
              ))}
            </div>
          </Field>
          {err && <div className="text-sm text-destructive">{err}</div>}
          <button
            disabled={busy || myCrafts.length === 0}
            className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Opening…" : "Open my studio"}
          </button>
        </form>
      </Shell>
    );
  }

  const canStart = title.trim().length >= 3 && craft;

  const onStart = async () => {
    if (!canStart) return;
    setBusy(true);
    setErr(null);
    try {
      const cover_url = cover ? await publicUrl(cover, user.id, "covers") : null;
      const { data, error } = await supabase
        .from("streams")
        .insert({
          creator_id: user.id,
          craft,
          title: title.trim(),
          description: description.trim() || null,
          discipline: discipline || null,
          format,
          difficulty: difficulty || null,
          materials,
          tags: tags
            .split(",")
            .map((t) => t.trim().replace(/^#/, ""))
            .filter(Boolean)
            .slice(0, 8),
          cover_url,
          tips_enabled: tipsOn,
          auction_enabled: auctionOn,
          versus_enabled: versusOn,
        })
        .select("id")
        .single();
      if (error) throw error;
      navigate({ to: "/studio/$id", params: { id: data.id } });
    } catch (e) {
      setErr(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <Shell>
      <div className="rounded-lg border border-border bg-card/40 p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Broadcasting as
          </div>
          <div className="mt-1 font-display text-sm">{profile?.display_name || user.email}</div>
          <div className="font-mono text-[11px] text-primary">
            {memberId(profile?.member_no)} {profile?.handle ? `· @${profile.handle}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6 rounded-lg border border-border bg-card/40 p-6">
        <Field label="Craft" required>
          <div className="flex gap-2 flex-wrap">
            {enabledCrafts.map((cr) => (
              <Chip
                key={cr.slug}
                on={craft === cr.slug}
                onClick={() => {
                  setCraft(cr.slug);
                  setDiscipline("");
                  setMaterials([]);
                }}
              >
                {cr.emoji} {cr.name}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Title" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              craft === "pottery"
                ? "e.g. Throwing six matcha cups"
                : "e.g. Lampworking glass beads at the torch"
            }
            maxLength={80}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>

        <div className="grid sm:grid-cols-3 gap-6">
          <Field label="Discipline">
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Choose…</option>
              {c.disciplines.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Format">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              {FORMATS.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">—</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Materials">
          <div className="flex gap-2 flex-wrap">
            {c.materials.map((m) => (
              <Chip
                key={m}
                on={materials.includes(m)}
                onClick={() =>
                  setMaterials((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]))
                }
              >
                {m}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Tags" hint="Comma separated, up to 8.">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="stoneware, commission"
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
        </Field>

        <Field
          label="Cover frame"
          hint="Shown on stream cards and shares. JPG, PNG or WebP up to 5 MB."
        >
          <div className="flex items-start gap-4">
            <label className="relative grid place-items-center h-32 w-44 rounded-md border border-dashed border-border bg-background overflow-hidden cursor-pointer hover:border-primary/60">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground">Click to upload</span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setCover(f);
                  setCoverPreview(f ? URL.createObjectURL(f) : null);
                }}
                className="hidden"
              />
            </label>
            {cover && (
              <button
                type="button"
                onClick={() => {
                  setCover(null);
                  setCoverPreview(null);
                }}
                className="h-9 rounded-md border border-border px-3 text-xs text-muted-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </Field>

        <div className="rounded-md border border-border/60 p-4">
          <div className="text-sm font-display">During the stream</div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <Toggle label="Gifts (🐚)" checked={tipsOn} onChange={setTipsOn} />
            <Toggle label="Auctions and sales" checked={auctionOn} onChange={setAuctionOn} />
            <Toggle label="Versus eligible" checked={versusOn} onChange={setVersusOn} />
          </div>
        </div>

        {err && <div className="text-sm text-destructive">{err}</div>}
        <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
          <div className="text-xs text-muted-foreground">
            Next you'll connect your camera or streaming app, then go live.
          </div>
          <button
            type="button"
            disabled={!canStart || busy}
            onClick={onStart}
            className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-accent disabled:opacity-50"
          >
            {busy ? "Setting up…" : "Continue to studio"}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to="/"
        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← Vinci
      </Link>
      <div className="mt-6 mb-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">
          Green room
        </div>
        <h1 className="mt-1 font-display text-3xl md:text-4xl tracking-tight">Go live</h1>
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/60"}`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between gap-3 rounded-md border px-3 h-10 text-xs transition-colors ${checked ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-background hover:border-primary/40"}`}
    >
      <span>{label}</span>
      <span
        className={`h-4 w-7 rounded-full relative transition-colors ${checked ? "bg-primary" : "bg-border"}`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all ${checked ? "left-3.5" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
