# Vinci — User flow document
Version 1.0 · 1 November 2026

Labels: [working] calls hosted account/profile storage; [demo] local/static experience; [future] not implemented.

## 1. Visitor discovery
Home → eight Discover categories → category feed → sample stream → sample creator profile. No sign-in is required. Unknown category, creator or stream ID → not-found view. Stream counts, verified labels and portfolios are examples, not verified operational records.

## 2. Account and profile
Header Sign up / Sign in → /auth → enter credentials → validation → hosted auth response → success navigation. Signup trigger creates profile and viewer role. Confirmation/provider outcomes depend on hosted configuration. [working integration]
Signed-in avatar → /profile → edit display name, handle, avatar URL, region, wallet → Save → owner-scoped update → reload/read-back. Duplicate handles or access/network failures should show an error. Achievements, Posts, Event Centre and Gallery tabs remain illustrative; viewing them does not persist activity. [working fields + demo tabs]
Sign out → clears hosted session. Public discovery stays available.

## 3. Visitor Go Live
Go live → visitor number generated in local browser storage → title + discipline + category + cover image → monetisation toggles disabled → Start broadcast → simulated delay → generated /stream/live-* URL → not-found because no stream record exists. This is a known MVP limitation, not a successful live broadcast. [demo]
Registered variant: shortened VNC display ID and monetisation toggles enabled; the same simulated start limitation applies. No creator role validation, camera capture or upload occurs.

## 4. Stream engagement and money
Sample stream → switch camera / chat / reaction → local viewer state. [demo]
Top-up → Cowrie pack or amount → simulated balance → gift / auction bid / creation proposal / competition action. [demo]
Intended future: authenticated charge confirmed → ledger credit → server-validated spend → net creator credit; insufficient funds rejects; declined creation bid returns reserved stake exactly once. Cross-page or cross-user balances are not guaranteed in this MVP.

## 5. Purchase and certificate
Sample stream → Marketplace → item → delivery choice/details → simulated purchase → mock certificate (sample artist/token/buyer/transaction fields). [demo]
Future: price locked → paid order → actual certificate confirmation → private shipping record → packaging → carrier tracking → delivery → dispute/return route. Entered demo addresses do not create shipping tasks.

## 6. Versus
/versus → select sample battle → spend demo Cowries to vote → bars/leaderboard update locally. [demo]
Future: same craft and >=2 artists confirmed → scheduled battle → server-timed voting window → authenticated votes debited → deterministic result → reward settlement.

## 7. Virtual gallery
/gallery → sample live/upcoming event → demo entry flow → faux-3D room → wall/work selection → artwork purchase demonstration. [demo]
Future: >=5 artists accept event + agree Cowrie fee → published schedule → paid admission → genuine 3D inspection with accurate artwork scale → order/certificate → Vinci delivery coordination. Cancellations must trigger defined admission/order refund rules; those rules are not yet agreed.

## 8. Regional and currency exploration
/global → continent/country/city filter → sample artist list; select language → preview text, not complete site translation; change timezone → schedule conversion; choose currency → indicative withdrawal calculator, not guaranteed FX or bank payout. [demo]

## 9. Registry
/registry → search/filter sample creator works → inspect availability/token labels. [demo]
Future: authoritative artist identity and recorded chain transaction must establish authenticity, ownership and transfer history.
