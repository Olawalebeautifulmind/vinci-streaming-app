# Vinci

Live streaming for makers. Creators broadcast while they work, and viewers chat, send Cowrie gifts, buy pieces, bid in auctions, commission work, and vote in Versus battles. Each sale issues a certificate of authenticity.

This MVP covers **Bead Making** and **Pottery** end to end. The other six crafts appear as "coming soon".

## What is real

| Feature | How it works |
| --- | --- |
| Accounts and profiles | Supabase Auth (email, plus Google or Apple if enabled). Every member gets a member ID (`VNC-000123`); creators also get an artist ID (`ART-NG-00123`). |
| Going live | Cloudflare Stream. Creators broadcast either from the browser camera (WebRTC/WHIP) or from OBS and other streaming apps (RTMPS). |
| Chat, viewer count, reactions | Supabase Realtime. |
| Cowries | Free in-app credits for launch. Every member gets 1,000 at signup and can claim 200 a day. Creators receive gifts and sales minus a 20% platform fee. Every movement is recorded in `cowrie_ledger`. There are no payments or payouts. |
| Selling | Buy-now pieces and timed auctions. Only the top bid is held; an outbid bidder is refunded at once. A bid in the last minute extends the auction by a minute. |
| Certificates | Serial `VNC-COA-000001` with a SHA-256 fingerprint, public at `/certificate/<serial>`. They are stored in Postgres, not on a blockchain. |
| Creation bids | Viewers offer Cowries for a custom piece; the creator accepts or declines, and a declined bid is refunded. |
| Versus | Two creators battle; viewers vote (10 Cowries per vote); the winner is settled when time runs out. |
| Gallery | Curated shows with paid entry, split equally between the artists hanging work. |
| XP and levels | Calculated from real activity (streams, minutes live, sales, wins, gifts, bids, followers). |

All money-like rules run in Postgres functions (`supabase/migrations/20261101000100_vinci_mvp.sql`) behind row-level security, so the browser can't change balances, prices, or stream state directly.

## Run it locally

You need Node 22+, Bun (or npm) and Docker.

```sh
bun install
npx supabase start                   # local Postgres, Auth, Realtime, Storage; applies migrations
npx supabase status -o env           # copy API_URL and ANON_KEY / SERVICE_ROLE_KEY into .env
cp .env.example .env                 # then fill it in
bun run dev                          # http://localhost:3000
```

Without Cloudflare keys, everything works except going live; the studio says live video isn't configured. To try the go-live flow without Cloudflare, run `bun run mock:cloudflare` and set `CLOUDFLARE_API_BASE=http://127.0.0.1:8788/client/v4`, `CLOUDFLARE_ACCOUNT_ID=test` and `CLOUDFLARE_STREAM_API_TOKEN=test-token`. The mock creates live inputs but carries no video.

## Tests

```sh
bun run test:db      # 18 database tests: wallets, gifts, sales, auctions, commissions, Versus, galleries, RLS
bun run mock:cloudflare &  # then, with the dev server running against the mock:
bun run test:e2e     # browser walkthrough of creator and viewer (needs Playwright)
```

Both expect the env vars above to point at local Supabase.

## Deploy

### 1. Supabase

1. Create a project at supabase.com.
2. Link it and push the schema:
   ```sh
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
3. Auth > URL Configuration: set the Site URL to your domain and add `https://<your-domain>/**` to the redirect URLs.
4. Auth > Providers: enable Email. Google and Apple are optional and need their own client IDs.
5. Settings > API: note the project URL, the publishable (anon) key and the service role key.

### 2. Cloudflare Stream

1. In the Cloudflare dashboard, enable Stream on your account.
2. Create an API token with the **Stream: Edit** permission.
3. Note your account ID.

### 3. Cloudflare Workers

The app builds to a Cloudflare Worker (`wrangler.jsonc`).

```sh
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_STREAM_API_TOKEN

VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... VITE_SUPABASE_PROJECT_ID=... bun run build
npx wrangler deploy --config .output/server/wrangler.json
```

The build writes the Worker to `.output/`. The Worker is named `vinci`, so the secrets above attach to it.

Keep the service role key and Stream token in Worker secrets only. Never put them in a `VITE_` variable, because those are bundled into the browser code.

## Known limits

- **Browser-camera broadcasts are not recorded.** Cloudflare doesn't record WebRTC input. Streams from OBS are recorded and replay on the stream page afterwards.
- **Certificates are not on-chain.** They're signed records in the database with a public lookup page.
- **Cowries can't be bought or cashed out yet.** The Cowrie page marks these as planned.
- **Housekeeping runs on page loads.** Ending stale streams (no heartbeat for 3 minutes), closing expired auctions and settling Versus battles happen when people open pages. With more traffic, move these to `pg_cron`.
- **Only Bead Making and Pottery are enabled.** To open another craft, set `enabled = true` on its row in the `crafts` table and add it to `src/lib/crafts.ts`.

## Project layout

```
src/routes/            pages (TanStack Start file routes)
src/components/        stream panels, player, works, battles
src/lib/live.functions.ts   server functions for go-live (use the service role)
src/lib/cloudflare.server.ts Cloudflare Stream API client (server only)
supabase/migrations/   schema, policies and business rules
tests/                 database tests, browser walkthrough, Cloudflare mock
docs/prototype/        the original prototype's PRD, TRD and flows
```
