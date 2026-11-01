import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";

export const Route = createFileRoute("/cowrie")({
  head: () => ({
    meta: [
      { title: "Cowrie Economics — Vinci" },
      {
        name: "description",
        content:
          "How Cowrie, Vinci's platform currency, moves from viewer to streamer. Transparent fees, real-time wallets, and clean withdrawals.",
      },
      { property: "og:title", content: "Cowrie Economics — Vinci" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content:
          "Simulate the full Cowrie gifting flow. See exactly how value moves from viewer to streamer at every stage.",
      },
    ],
  }),
  component: CowrieEconomics,
});

const RATE = 10; // 10 Cowries = £1
const PLATFORM_FEE = 0.2; // 20%
const PROCESSING_FEE = 0.025; // 2.5%
const WITHDRAW_FEE = 0.015; // 1.5%
const MIN_WITHDRAW = 100; // Cowries

const packs = [
  { name: "Starter", cowries: 50 },
  { name: "Creator", cowries: 100 },
  { name: "Patron", cowries: 500 },
  { name: "Mecenas", cowries: 2500 },
];

const tiers = [
  { label: "Rising", minMonthly: 0, fee: 0.2 },
  { label: "Established", minMonthly: 5000, fee: 0.17 },
  { label: "Top earner", minMonthly: 25000, fee: 0.13 },
];

function fmtGBP(n: number) {
  return `£${n.toFixed(2)}`;
}

function CowrieEconomics() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const [selected, setSelected] = useState<number>(50);
  const [custom, setCustom] = useState<string>("");
  const gifted = Number(custom) > 0 ? Math.floor(Number(custom)) : selected;

  const calc = useMemo(() => {
    const faceValue = gifted / RATE; // £
    const platformFee = +(faceValue * PLATFORM_FEE).toFixed(2);
    const processingFee = +(faceValue * PROCESSING_FEE).toFixed(2);
    const netGBP = +(faceValue - platformFee - processingFee).toFixed(2);
    const netCowries = Math.round(netGBP * RATE);
    return { faceValue, platformFee, processingFee, netGBP, netCowries };
  }, [gifted]);

  const canWithdraw = calc.netCowries >= MIN_WITHDRAW;
  const withdrawFeeGBP = +(calc.netGBP * WITHDRAW_FEE).toFixed(2);
  const payoutGBP = +(calc.netGBP - withdrawFeeGBP).toFixed(2);

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-10">
      {/* Header */}
      <Link
        to="/"
        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        ← Back to Vinci
      </Link>
      <div className="mt-4 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-primary">
            Cowrie 🐚 · platform currency
          </div>
          <h1 className="font-display text-4xl md:text-5xl mt-2">How value moves on Vinci</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            Cowries are how viewers tip, gift, and commission artists. Simulate the full gifting
            flow. Adjust the gift size to see how value moves at every stage.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Exchange rate
          </div>
          <div className="font-display text-lg">10 Cowries = £1.00</div>
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-primary/40 bg-primary/10 p-6">
        <div className="text-[11px] uppercase tracking-widest text-primary">Launch period</div>
        <h2 className="font-display text-2xl mt-1">Cowries are free while Vinci launches</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Every new member gets 1,000 Cowries and can claim 200 more each day. Use them to gift
          makers, bid in auctions, buy pieces, send creation bids and vote in Versus. Makers receive
          80% of everything spent with them. Cowries can't be bought with money or withdrawn yet;
          the stages below show how that will work later.
        </p>
        <div className="mt-4 flex gap-3 items-center text-sm">
          {user ? (
            <>
              <span>
                Your balance:{" "}
                <span className="font-display text-primary">
                  {(balance ?? 0).toLocaleString()} 🐚
                </span>
              </span>
              <Link to="/profile" className="text-primary hover:underline">
                Wallet history →
              </Link>
            </>
          ) : (
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="h-9 inline-flex items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground"
            >
              Join and get 1,000 Cowries
            </Link>
          )}
        </div>
      </section>

      {/* STAGE 1 */}
      <Stage
        n={1}
        title="Viewer buys Cowries (planned)"
        subtitle="Flat rate. No hidden markup on purchase. Not live yet."
      >
        <div className="mb-3 text-sm text-muted-foreground">
          Choose a Cowrie pack or enter a custom amount:
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {packs.map((p) => {
            const isActive = !custom && selected === p.cowries;
            return (
              <button
                key={p.name}
                onClick={() => {
                  setSelected(p.cowries);
                  setCustom("");
                }}
                className={`rounded-md border p-4 text-left transition ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/60"
                }`}
              >
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {p.name}
                </div>
                <div className="font-display text-2xl mt-1">
                  {p.cowries.toLocaleString()}{" "}
                  <span className="text-sm text-muted-foreground">cowries</span>
                </div>
                <div className="text-xs text-primary mt-1">{fmtGBP(p.cowries / RATE)}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Custom cowries:</label>
          <input
            type="number"
            min={10}
            step={10}
            placeholder="e.g. 200"
            value={custom}
            onChange={(e) => setCustom(e.target.value.slice(0, 7))}
            className="h-10 w-40 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-muted-foreground">
            {gifted > 0 ? `= ${fmtGBP(gifted / RATE)}` : ""}
          </span>
        </div>
      </Stage>

      <Arrow />

      {/* STAGE 2 */}
      <Stage
        n={2}
        title="Gift sent during stream"
        subtitle="Two transparent deductions before the streamer is credited."
      >
        <div className="flex items-baseline gap-3">
          <div className="font-display text-4xl">{gifted.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">cowries gifted</div>
          <span className="ml-2 rounded-sm bg-primary/15 text-primary px-2 py-0.5 text-xs">
            = {fmtGBP(calc.faceValue)}
          </span>
        </div>

        <div className="mt-5 divide-y divide-border border-y border-border">
          <Row label={`Face value (${RATE} Cowries = £1)`} value={fmtGBP(calc.faceValue)} strong />
          <Row
            label="Platform fee"
            badge={`${(PLATFORM_FEE * 100).toFixed(0)}%`}
            value={`− ${fmtGBP(calc.platformFee)}`}
            negative
          />
          <Row
            label="Payment processing"
            badge={`${(PROCESSING_FEE * 100).toFixed(1)}%`}
            value={`− ${fmtGBP(calc.processingFee)}`}
            negative
          />
        </div>

        <div className="mt-3 text-[11px] text-muted-foreground">
          Fees are charged at the moment of gifting — simpler and more transparent than charging at
          withdrawal.
        </div>
      </Stage>

      <Arrow />

      {/* STAGE 3 */}
      <Stage
        n={3}
        title="Streamer's wallet balance"
        subtitle="Net Cowries land instantly. The streamer sees it grow live during the stream."
      >
        <div className="flex items-center gap-3">
          <div className="font-display text-4xl text-primary">~{calc.netCowries}</div>
          <div className="text-sm text-muted-foreground">cowries credited to streamer</div>
          <span className="ml-2 rounded-sm bg-primary/15 text-primary px-2 py-0.5 text-xs">
            ≈ {fmtGBP(calc.netGBP)}
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Platform + processing fees are deducted before crediting. Streamer sees net Cowries in
          their wallet in real time.
        </p>
      </Stage>

      <Arrow />

      {/* STAGE 4 */}
      <Stage
        n={4}
        title="Withdrawal (planned)"
        subtitle={`Minimum ${MIN_WITHDRAW} Cowries (£${(MIN_WITHDRAW / RATE).toFixed(2)}). Net payout to bank, mobile money, or crypto.`}
      >
        {canWithdraw ? (
          <>
            <div className="divide-y divide-border border-y border-border">
              <Row
                label="Wallet balance"
                value={`${calc.netCowries} Cowries · ${fmtGBP(calc.netGBP)}`}
                strong
              />
              <Row
                label="Withdrawal fee"
                badge={`${(WITHDRAW_FEE * 100).toFixed(1)}%`}
                value={`− ${fmtGBP(withdrawFeeGBP)}`}
                negative
              />
              <Row label="Net payout" value={fmtGBP(payoutGBP)} strong highlight />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Bank transfer", "Mobile money", "USDC / crypto"].map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-border p-4 text-sm">
            <div className="font-display text-lg">Below minimum</div>
            <p className="text-xs text-muted-foreground mt-1">
              Streamer needs at least {MIN_WITHDRAW} Cowries ({fmtGBP(MIN_WITHDRAW / RATE)}) to cash
              out. They currently have {calc.netCowries} Cowries — {MIN_WITHDRAW - calc.netCowries}{" "}
              short.
            </p>
          </div>
        )}
      </Stage>

      {/* TIERS */}
      <section className="mt-14">
        <div className="text-[11px] uppercase tracking-widest text-primary">Future model</div>
        <h2 className="font-display text-2xl mt-1">Tiered platform fees for top earners</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Reward streamers who grow on Vinci. As monthly gifting volume increases, their platform
          fee drops — incentive to stay, build an audience, and treat Vinci as a long-term home.
        </p>
        <div className="mt-5 grid md:grid-cols-3 gap-3">
          {tiers.map((t) => (
            <div key={t.label} className="rounded-lg border border-border p-5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {t.label}
              </div>
              <div className="font-display text-3xl mt-1">{(t.fee * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground mt-1">platform fee</div>
              <div className="mt-3 text-xs text-muted-foreground">
                {t.minMonthly === 0
                  ? "Default rate for all new streamers."
                  : `Once monthly volume reaches ${t.minMonthly.toLocaleString()}+ Cowries gifted.`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14 grid md:grid-cols-2 gap-4">
        <Faq q="Why charge fees at gifting, not withdrawal?">
          Gifting-time fees are visible to both viewer and streamer in real time — no surprises at
          payout. It also means the wallet balance the streamer sees is always the true cashable
          amount.
        </Faq>
        <Faq q="Why a withdrawal fee at all?">
          1.5% covers currency conversion and bank / mobile-money / crypto rail costs. Vinci does
          not earn margin on the withdrawal — it is pass-through.
        </Faq>
        <Faq q="Are Cowries refundable?">
          Cowries are non-refundable once purchased, but they never expire and can be used for any
          creator on Vinci.
        </Faq>
        <Faq q="What if a streamer declines a Creation Bid?">
          The viewer is refunded the full Cowrie amount they staked — no platform or processing fee
          is deducted on a decline.
        </Faq>
      </section>
    </div>
  );
}

function Stage({
  n,
  title,
  subtitle,
  children,
}: {
  n: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-6">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Stage {n}</div>
      <h2 className="font-display text-2xl mt-1">{title}</h2>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center py-2 text-muted-foreground" aria-hidden>
      <svg width="16" height="28" viewBox="0 0 16 28" fill="none">
        <path
          d="M8 1v24m0 0l-6-6m6 6l6-6"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Row({
  label,
  badge,
  value,
  negative,
  strong,
  highlight,
}: {
  label: string;
  badge?: string;
  value: string;
  negative?: boolean;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className={strong ? "text-foreground" : "text-muted-foreground"}>{label}</span>
        {badge && (
          <span className="rounded-sm bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <div
        className={`font-display ${negative ? "text-destructive" : highlight ? "text-primary text-lg" : strong ? "text-foreground" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="font-display text-base">{q}</div>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
