# Vinci — Technical requirements document
Version 1.0 · 1 November 2026

## Baseline architecture
React 19 + TanStack Start/Router v1; Vite 7; Tailwind CSS v4; shadcn UI primitives; TanStack Query. Lovable Cloud provides auth and a PostgreSQL-backed profile/role store. Deployment configuration targets a bundled Cloudflare-compatible server runtime. The source has an SSR error wrapper and request error middleware.

```text
Browser → TanStack pages → static sample catalogue / local UI state
        → Lovable Cloud authentication
        → authenticated profile + role reads / profile write (RLS)
```

No implemented video ingest, realtime messaging, payment processor, ledger, contract, shipping service or 3D engine exists. The gallery uses SVG/CSS room simulation; camera selection changes a simulated feed.

## Source map
| Location | Responsibility |
|---|---|
| src/routes/__root.tsx | Document shell, shared navigation, auth provider, footer |
| src/routes/index.tsx | Discover |
| src/routes/c.$slug.tsx | Discipline catalogue |
| src/routes/stream.$id.tsx | Sample stream, chat, transactions and certificate UI |
| src/routes/creator.$handle.tsx | Sample public creator profile |
| src/routes/auth.tsx; src/hooks/use-auth.tsx | Auth forms, session and client guard helper |
| src/routes/profile.tsx | Persisted owner profile + illustrative profile tabs |
| src/routes/live.new.tsx | Public setup form and visitor number |
| src/routes/registry.tsx; gallery.tsx; versus.tsx; global.tsx; cowrie.tsx | Feature demonstrations |
| src/lib/streams.ts | Sample catalogue, creators, portfolio and chat data |
| src/integrations/ | Generated auth and Cloud clients |
| src/styles.css | Typography, theme and motion |
| supabase/migrations/ | Existing profile/role SQL history |

## Current functional boundaries
Auth forms call hosted auth; Google/Apple controls use Lovable's OAuth integration. Hosted provider enablement, redirects, email confirmation and recovery settings must be checked on the target deployment; source alone does not establish settings. Profile data is owner-readable and editable, but public creator profiles are static, not a projection of users' private rows. Most monetary interactions change browser state and are not server-authorised. The public Go Live form permits visitors but its generated stream ID is absent from the static catalogue, so Start broadcast reaches the not-found state.

## Required production work — deferred
1. Video: managed ingest/playback, broadcast lifecycle, signed ingest credentials, replay storage and bandwidth controls; real device permissions and multi-camera composition.
2. Money: approved payment/payout provider, server-authenticated actions, integer minor-unit ledger, balance locks, idempotency, refunds and reconciliation. Cowries apply throughout; do not treat the gift commission as an agreed marketplace commission.
3. Identity: server-issued unique ART-region-serial ID; avoid collision-prone visitor and shortened UUID display IDs as authoritative identifiers.
4. Art: audited contract, network choice, wallet consent, artwork fingerprinting, certificate metadata, transfer history and confirmation handling. Registry labels are not proof of chain activity.
5. Gallery: >=5 confirmed artists, agreed Cowrie entry fee, access entitlement, actual interactive 3D rendering, accurate dimensions/colour/media and purchase-to-shipment workflow.
6. Safety: creator moderation, reporting, rate limits, account/role enforcement, privacy policies and dispute handling.

## Nonfunctional acceptance targets — proposed, not measured
- Prevent overspending, duplicate payment callbacks and cross-user private data access.
- Instrument critical flows without logging session tokens, wallets alongside unnecessary personal data, or delivery addresses.
- Keyboard-accessible controls, reduced-motion support and mobile/desktop checks.
- Define stream latency, concurrent viewer, uptime and cost budgets before selecting infrastructure; none is guaranteed by this MVP.
- Server code must be Worker-compatible and bundled; VITE_ variables are public. Never place private keys in browser configuration.

## Portability
Use the included package manifest and lockfile. @lovable.dev/vite-tanstack-config and hosted OAuth introduce platform dependencies; a clean local install requires registry availability and target environment configuration. Database migrations do not export auth configuration or users. The generated admin client is included as source but ordinary current profile flows do not require an admin key; Lovable Cloud private service keys cannot be retrieved for this handover. Do not treat the code folder as an offline or already self-hosted app.
