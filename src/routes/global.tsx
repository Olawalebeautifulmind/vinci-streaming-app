import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listStreams, useLoad, displayName, type PublicProfile } from "@/lib/data";
import { artistId } from "@/lib/format";
import { getCraft } from "@/lib/crafts";
import { Avatar, VerifiedBadge } from "@/components/StreamCard";

export const Route = createFileRoute("/global")({
  component: GlobalPage,
  head: () => ({
    meta: [
      { title: "Global & Localisation — Vinci" },
      { property: "og:title", content: "Global & Localisation — Vinci" },
      {
        property: "og:description",
        content:
          "Explore Vinci's regional artist discovery and language, currency and timezone demonstrations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Browse Vinci artists by continent, country, and city. Multi-language UI, localised Cowrie withdrawals, and timezone-aware streams.",
      },
    ],
  }),
});

type Lang = { code: string; label: string; sample: string; dir?: "ltr" | "rtl" };
const LANGUAGES: Lang[] = [
  { code: "en", label: "English", sample: "Watch the handmade, streamed live." },
  { code: "fr", label: "Français", sample: "Regardez le fait main, diffusé en direct." },
  { code: "ar", label: "العربية", sample: "شاهد الحرف اليدوية مباشرة على الهواء.", dir: "rtl" },
  { code: "pt", label: "Português", sample: "Assista ao artesanato, transmitido ao vivo." },
  { code: "sw", label: "Kiswahili", sample: "Tazama kazi za mikono, moja kwa moja." },
  { code: "zh", label: "中文", sample: "观看手工艺人的现场直播。" },
  { code: "es", label: "Español", sample: "Mira lo hecho a mano, transmitido en vivo." },
];

type Currency = { code: string; symbol: string; perCowrie: number; country: string; flag: string };
// Base: 10 🐚 = £1 → 1 🐚 = £0.10. Other rates rough indicative.
const CURRENCIES: Currency[] = [
  { code: "GBP", symbol: "£", perCowrie: 0.1, country: "United Kingdom", flag: "🇬🇧" },
  { code: "USD", symbol: "$", perCowrie: 0.13, country: "United States", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", perCowrie: 0.12, country: "Eurozone", flag: "🇪🇺" },
  { code: "NGN", symbol: "₦", perCowrie: 195, country: "Nigeria", flag: "🇳🇬" },
  { code: "GHS", symbol: "₵", perCowrie: 1.6, country: "Ghana", flag: "🇬🇭" },
  { code: "KES", symbol: "KSh", perCowrie: 17, country: "Kenya", flag: "🇰🇪" },
  { code: "ZAR", symbol: "R", perCowrie: 2.4, country: "South Africa", flag: "🇿🇦" },
  { code: "INR", symbol: "₹", perCowrie: 11, country: "India", flag: "🇮🇳" },
  { code: "JPY", symbol: "¥", perCowrie: 19, country: "Japan", flag: "🇯🇵" },
];

const REGION_PREFIXES: { prefix: string; country: string; flag: string }[] = [
  { prefix: "ART-NG-", country: "Nigeria", flag: "🇳🇬" },
  { prefix: "ART-UK-", country: "United Kingdom", flag: "🇬🇧" },
  { prefix: "ART-JP-", country: "Japan", flag: "🇯🇵" },
  { prefix: "ART-MX-", country: "Mexico", flag: "🇲🇽" },
  { prefix: "ART-IT-", country: "Italy", flag: "🇮🇹" },
  { prefix: "ART-ZA-", country: "South Africa", flag: "🇿🇦" },
  { prefix: "ART-IN-", country: "India", flag: "🇮🇳" },
  { prefix: "ART-DE-", country: "Germany", flag: "🇩🇪" },
];

function GlobalPage() {
  const [lang, setLang] = useState<Lang>(LANGUAGES[0]);
  const [country, setCountry] = useState<string>("All");
  const [city, setCity] = useState<string>("All");
  const [cur, setCur] = useState<Currency>(CURRENCIES[0]);
  const [cowries, setCowries] = useState<number>(5000);

  const makers = useLoad(async () => {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, handle, display_name, avatar_url, city, country_code, verified, member_no, crafts, is_creator",
      )
      .eq("is_creator", true)
      .limit(500);
    return (data ?? []) as PublicProfile[];
  }, []);
  const live = useLoad(() => listStreams({ status: "live", limit: 50 }), []);
  const creators = makers.data ?? [];
  const countries = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(creators.map((c) => c.country_code).filter(Boolean) as string[]),
      ).sort(),
    ],
    [creators],
  );
  const cities = useMemo(() => {
    const pool = creators.filter((c) => country === "All" || c.country_code === country);
    return [
      "All",
      ...Array.from(new Set(pool.map((c) => c.city).filter(Boolean) as string[])).sort(),
    ];
  }, [creators, country]);
  const filtered = creators.filter(
    (c) => (country === "All" || c.country_code === country) && (city === "All" || c.city === city),
  );
  const liveIds = new Set((live.data ?? []).map((s) => s.creator_id));

  // Client-only timezone to avoid SSR hydration mismatch.
  const [clientTz, setClientTz] = useState<string | null>(null);
  useEffect(() => {
    setClientTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const gross = cowries * cur.perCowrie;
  const conversion = gross * 0.025; // 2.5% FX/transfer
  const net = gross - conversion;
  const fmt = (n: number) =>
    `${cur.symbol}${n.toLocaleString(undefined, { maximumFractionDigits: cur.perCowrie < 1 ? 2 : 0 })}`;

  return (
    <div>
      {/* Masthead */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-10">
          <div className="text-[11px] uppercase tracking-[0.25em] text-primary">
            Global & Localisation
          </div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl leading-[1] tracking-tight">
            One stage. <span className="gold-gradient-text italic">Every region.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Find makers by country and city, see every live stream in your own time zone, and
            preview how Vinci will localise languages and Cowrie withdrawals.
          </p>
        </div>
      </section>

      {/* Language */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-3xl">Multi-language</h2>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Preview · UI translations coming
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l)}
              className={`h-9 rounded-full border px-4 text-sm transition-colors ${
                lang.code === l.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div
          dir={lang.dir ?? "ltr"}
          className="rounded-lg border border-border bg-card/40 p-8 font-display text-2xl md:text-4xl leading-tight"
        >
          {lang.sample}
        </div>
      </section>

      {/* Region discovery */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-3xl">Browse by region</h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {filtered.length} artists
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            <Select
              label="Country"
              value={country}
              options={countries}
              onChange={(v) => {
                setCountry(v);
                setCity("All");
              }}
            />
            <Select label="City" value={city} options={cities} onChange={setCity} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to="/creator/$handle"
                params={{ handle: c.handle ?? "" }}
                className="group rounded-lg border border-border p-5 hover:border-primary/60 transition-colors flex gap-4"
              >
                <Avatar profile={c} className="h-14 w-14" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg flex items-center gap-1 group-hover:text-primary transition-colors truncate">
                    {displayName(c)} {c.verified && <VerifiedBadge />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[c.city, c.country_code].filter(Boolean).join(", ") || "Location not set"} ·{" "}
                    {c.crafts.map((x) => getCraft(x)?.name).join(", ")}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-widest">
                    <span className="text-primary">{artistId(c.member_no, c.country_code)}</span>
                    {liveIds.has(c.id) && <span className="text-muted-foreground">· live now</span>}
                  </div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No artists match this region yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Region prefix */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-[11px] uppercase tracking-[0.25em] text-primary">
            Artist ID schema
          </div>
          <h2 className="mt-3 font-display text-3xl">Every ID carries its country.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Streamer ID codes follow{" "}
            <span className="font-mono text-foreground">ART-[ISO]-[serial]</span>. The two-letter
            prefix locks each artist to a verified country of origin and shows up everywhere their
            work appears.
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {REGION_PREFIXES.map((r) => (
              <div key={r.prefix} className="rounded-md border border-border bg-background p-4">
                <div className="text-2xl">{r.flag}</div>
                <div className="mt-2 font-mono text-sm text-primary">{r.prefix}…</div>
                <div className="text-xs text-muted-foreground">{r.country}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Currency localisation */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-primary">
                Cowrie withdrawal
              </div>
              <h2 className="mt-2 font-display text-3xl">Withdraw in your local currency.</h2>
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Illustration · withdrawals open after launch
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calculator */}
            <div className="rounded-lg border border-border bg-card/40 p-6">
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Cowries to withdraw
              </label>
              <input
                type="number"
                min={0}
                value={cowries}
                onChange={(e) => setCowries(Math.max(0, Number(e.target.value) || 0))}
                className="mt-2 w-full bg-transparent border-b border-border focus:border-primary outline-none font-display text-3xl py-2"
              />

              <div className="mt-6 flex flex-wrap gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCur(c)}
                    className={`h-9 rounded-full border px-3 text-xs transition-colors ${
                      cur.code === c.code
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.flag} {c.code}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <Row label="Gross" value={fmt(gross)} />
                <Row label="Conversion + transfer (2.5%)" value={`− ${fmt(conversion)}`} />
                <div className="border-t border-border pt-2 flex items-center justify-between font-display text-2xl">
                  <span>Net payout</span>
                  <span className="gold-gradient-text">{fmt(net)}</span>
                </div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-2">
                  → Bank · Mobile money · Crypto wallet
                </div>
              </div>
            </div>

            {/* Rate table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Region</th>
                    <th className="text-left px-4 py-3">Code</th>
                    <th className="text-right px-4 py-3">Per 🐚</th>
                    <th className="text-right px-4 py-3">100 🐚</th>
                  </tr>
                </thead>
                <tbody>
                  {CURRENCIES.map((c) => (
                    <tr key={c.code} className="border-t border-border">
                      <td className="px-4 py-3">
                        {c.flag} {c.country}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.code}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.symbol}
                        {c.perCowrie.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-primary">
                        {c.symbol}
                        {(c.perCowrie * 100).toLocaleString(undefined, {
                          maximumFractionDigits: c.perCowrie < 1 ? 2 : 0,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 text-[11px] text-muted-foreground border-t border-border">
                Rates are illustrative. Cowries are free credits during launch and cannot be
                withdrawn yet.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Time zone scheduling */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-primary">Scheduling</div>
              <h2 className="mt-2 font-display text-3xl">Live now, in your time zone.</h2>
            </div>
            <span
              className="text-xs uppercase tracking-widest text-muted-foreground"
              suppressHydrationWarning
            >
              Your tz: {clientTz ?? "…"}
            </span>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Stream</th>
                  <th className="text-left px-4 py-3">Artist</th>
                  <th className="text-left px-4 py-3">Studio</th>
                  <th className="text-left px-4 py-3">Started (your time)</th>
                </tr>
              </thead>
              <tbody>
                {(live.data ?? []).map((st) => (
                  <tr key={st.id} className="border-t border-border">
                    <td className="px-4 py-3 font-display">
                      <Link to="/stream/$id" params={{ id: st.id }} className="hover:text-primary">
                        {st.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{displayName(st.creator)}</td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">
                        {[st.creator?.city, st.creator?.country_code].filter(Boolean).join(", ") ||
                          "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary" suppressHydrationWarning>
                      {clientTz && st.started_at
                        ? new Intl.DateTimeFormat(undefined, {
                            timeZone: clientTz,
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(st.started_at))
                        : "…"}
                    </td>
                  </tr>
                ))}
                {(live.data ?? []).length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs">
                      No one is live right now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-11 rounded-md border border-border bg-background px-3 text-sm focus:border-primary outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
