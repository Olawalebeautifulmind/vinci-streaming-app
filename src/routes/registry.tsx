import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listWorks, profilesByIds, useLoad, displayName, type Certificate } from "@/lib/data";
import { cowries } from "@/lib/format";
import { WorkCard } from "@/components/works";
import { EmptyState } from "@/components/StreamCard";

export const Route = createFileRoute("/registry")({
  component: RegistryPage,
  head: () => ({
    meta: [
      { title: "Artistic Ownership Registry · Vinci" },
      {
        name: "description",
        content:
          "Every piece sold on Vinci, with a numbered certificate tracing it to the maker and the stream it was made on.",
      },
      { property: "og:title", content: "Artistic Ownership Registry · Vinci" },
    ],
  }),
});

function RegistryPage() {
  const [filter, setFilter] = useState<"all" | "available" | "collected">("all");
  const [query, setQuery] = useState("");
  const works = useLoad(() => listWorks({ status: ["available", "sold_out"], limit: 200 }), []);
  const certs = useLoad(async () => {
    const { data } = await supabase
      .from("certificates")
      .select("*")
      .order("issued_at", { ascending: false })
      .limit(30);
    const rows = (data ?? []) as Certificate[];
    return { rows, people: await profilesByIds(rows.flatMap((r) => [r.creator_id, r.owner_id])) };
  }, []);

  const all = works.data ?? [];
  const q = query.toLowerCase().trim();
  const filtered = all.filter((w) => {
    if (filter === "available" && w.status !== "available") return false;
    if (filter === "collected" && w.editions_sold === 0) return false;
    if (!q) return true;
    return (
      w.title.toLowerCase().includes(q) ||
      displayName(w.creator).toLowerCase().includes(q) ||
      (w.medium ?? "").toLowerCase().includes(q)
    );
  });

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
            Artistic Ownership Registry
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight max-w-3xl">
            Every work, traced to the hand that made it.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-foreground/80 leading-relaxed">
            Each sale on Vinci issues a numbered certificate binding the piece, edition, maker,
            owner and the stream it was made on. Every certificate has a public page and a SHA-256
            fingerprint anyone can check.
          </p>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-lg overflow-hidden text-sm">
            <Stat label="Works listed" value={all.length} />
            <Stat label="Makers" value={new Set(all.map((w) => w.creator_id)).size} />
            <Stat label="Editions collected" value={all.reduce((n, w) => n + w.editions_sold, 0)} />
            <Stat label="Available" value={all.filter((w) => w.status === "available").length} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 space-y-10">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-1.5">
            {(["all", "available", "collected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wider ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, maker, medium…"
            className="h-9 w-full md:w-80 rounded-md border border-border bg-background px-3 text-sm"
          />
        </div>

        {works.loading ? (
          <div className="h-40 rounded-lg bg-card animate-pulse" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={all.length ? "No works match." : "The registry is empty so far."}
            body={
              all.length ? "Try clearing the filters." : "Pieces appear here as makers list them."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((w) => (
              <WorkCard key={w.id} work={w} onChanged={() => void works.reload()} />
            ))}
          </div>
        )}

        <section>
          <h2 className="font-display text-2xl mb-4">Latest certificates</h2>
          {(certs.data?.rows.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground">No certificates issued yet.</div>
          ) : (
            <div className="rounded-lg border border-border divide-y divide-border">
              {certs.data!.rows.map((c) => (
                <Link
                  key={c.id}
                  to="/certificate/$serial"
                  params={{ serial: c.serial }}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-card"
                >
                  <span className="font-mono text-primary">{c.serial}</span>
                  <span className="truncate text-muted-foreground">
                    {displayName(certs.data!.people.get(c.creator_id))} →{" "}
                    {displayName(certs.data!.people.get(c.owner_id))}
                  </span>
                  <span className="shrink-0">{cowries(c.price)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl">{value.toLocaleString()}</div>
    </div>
  );
}
