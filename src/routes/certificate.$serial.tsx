import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getCraft } from "@/lib/crafts";
import { displayName, profilesByIds } from "@/lib/data";
import { artistId, cowries, memberId } from "@/lib/format";
import { WorkThumb } from "@/components/works";

export const Route = createFileRoute("/certificate/$serial")({
  component: CertificatePage,
  loader: async ({ params }) => {
    const { data: cert } = await supabase
      .from("certificates")
      .select("*")
      .eq("serial", params.serial)
      .maybeSingle();
    if (!cert) throw notFound();
    const [{ data: work }, people, { data: stream }] = await Promise.all([
      supabase.from("works").select("*").eq("id", cert.work_id).single(),
      profilesByIds([cert.creator_id, cert.owner_id]),
      cert.stream_id
        ? supabase
            .from("streams")
            .select("id, title, started_at")
            .eq("id", cert.stream_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    return {
      cert,
      work: work!,
      creator: people.get(cert.creator_id) ?? null,
      owner: people.get(cert.owner_id) ?? null,
      stream,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.cert.serial ?? "Certificate"} · ${loaderData?.work.title ?? ""} · Vinci`,
      },
      {
        name: "description",
        content: `Vinci certificate of authenticity for "${loaderData?.work.title}".`,
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <h1 className="font-display text-3xl">Certificate not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Check the serial number. Genuine Vinci certificates look like VNC-COA-000123.
      </p>
    </div>
  ),
});

function CertificatePage() {
  const { cert, work, creator, owner, stream } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-lg border border-primary/40 bg-card overflow-hidden shadow-2xl">
        <WorkThumb work={work} className="aspect-[16/9]" />
        <div className="px-6 py-5 border-b border-border">
          <div className="text-[10px] uppercase tracking-widest text-primary">
            Vinci certificate of authenticity
          </div>
          <h1 className="font-display text-3xl mt-1">{work.title}</h1>
          <div className="text-xs text-muted-foreground mt-1">
            Issued{" "}
            {new Date(cert.issued_at).toLocaleString("en-GB", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </div>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <Row label="Serial" value={cert.serial} mono />
          <Row
            label="Maker"
            value={`${displayName(creator)} · ${artistId(creator?.member_no, creator?.country_code)}`}
          />
          <Row label="Owner" value={`${displayName(owner)} · ${memberId(owner?.member_no)}`} />
          <Row
            label="Craft"
            value={`${getCraft(work.craft)?.name ?? work.craft}${work.medium ? ` · ${work.medium}` : ""}`}
          />
          <Row label="Edition" value={`${cert.edition_no} of ${cert.edition_size}`} />
          <Row label="Price" value={cowries(cert.price)} />
          <Row label="Made on stream" value={stream ? stream.title : "—"} />
          <Row label="Fingerprint" value={cert.fingerprint} mono />
          <p className="pt-3 text-[11px] text-muted-foreground leading-relaxed">
            This certificate is recorded in Vinci's registry and can't be edited. The SHA-256
            fingerprint is computed from the serial, work, maker, owner, edition, price and stream
            at the moment of sale. On-chain minting is planned for a later release.
          </p>
          <div className="pt-3 flex gap-2 flex-wrap">
            {creator?.handle && (
              <Link
                to="/creator/$handle"
                params={{ handle: creator.handle }}
                className="h-10 inline-flex items-center rounded-md border border-border px-4 text-sm hover:border-primary/60"
              >
                Maker's profile
              </Link>
            )}
            {stream && (
              <Link
                to="/stream/$id"
                params={{ id: stream.id }}
                className="h-10 inline-flex items-center rounded-md border border-border px-4 text-sm hover:border-primary/60"
              >
                The stream
              </Link>
            )}
            <Link
              to="/registry"
              className="h-10 inline-flex items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Registry
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">
        {label}
      </span>
      <span className={`text-right ${mono ? "font-mono text-xs break-all" : "text-sm"}`}>
        {value}
      </span>
    </div>
  );
}
