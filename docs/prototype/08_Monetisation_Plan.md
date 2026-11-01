# Vinci — Monetisation plan
Version 1.0 · 1 November 2026 · Agreed economics + deferred operations

## Current operating reality
There is no live payment, money wallet, withdrawal, commission settlement, paid admission or bank/crypto payout. The app contains calculators and local UI simulations. The following agreed gifting model is a product requirement, not collected revenue.

## Cowrie purchase and gift model
1. Purchase: 10 Cowries = £1; no hidden purchase markup. Demo packs: 50 (£5), 100 (£10), 500 (£50), 2,500 (£250).
2. Gift: 20% platform fee and 2.5% processing fee deducted on gifting.
3. Wallet: intended net credit is 77.5% of gift face value, visible instantly after confirmed settlement.
4. Withdrawal: minimum 100 net Cowries (£10 equivalent); 1.5% withdrawal fee. Intended rails: bank, mobile money or crypto; none integrated.

Example: 500 Cowries costs £50. A gift incurs £10 platform fee and £1.25 processing fee. Creator net £38.75, mathematically 387.5 Cowries; withdrawal fee £0.58 and indicative payout £38.17 using penny rounding. The existing simulator rounds displayed net Cowries to 388 while calculating payout from £38.75. This mismatch is a known reason to adopt a documented minor-unit/rounding policy before real balances. Do not treat 388 as an audited ledger value.

At 100 gifted Cowries, the current calculator rounds creator net to 78 Cowries: below the 100-Cowrie withdrawal threshold. The threshold applies to accumulated creator wallet balance in the intended product, whereas the simulator checks one illustrative gift.

## Other Cowrie uses
| Use | Requirement / economics status |
|---|---|
| Marketplace and live auctions | Cowrie pricing; marketplace commission not agreed |
| Creation/next-work bids | Cowrie-funded proposals; reserve/accept/decline/refund mechanics not implemented |
| Competitions and Versus votes | Cowrie spend; sponsor/reward/platform split not agreed |
| Virtual gallery | >=5 showcasing artists agree viewer entry fee in Cowries; admission revenue split not agreed |
| Shipping | Vinci coordinates physical delivery; carrier charges, customs, insurance and margin not agreed |

Do not automatically apply the 20% gifting fee to marketplace sales, admission, votes or sponsorship. Avoid double charging purchase and gift fees. Payment and withdrawal charges are cost allowances, not verified provider quotations or guaranteed pass-through amounts.

## Optional ideas — not adopted
The app illustrates lower platform rates for higher earners (20% / 17% / 13% with sample monthly thresholds). These are proposals only; the base gifting calculator uses flat 20%. Creator subscriptions, promoted listings, event sponsorships and logistics margin could be explored later; no price or entitlement is approved.

## Unit economics framework
Gross gifting platform revenue = settled gift GBP × 20%.
Contribution = platform revenue − uncovered processing/payout costs − video bandwidth/ingest − hosting/storage − moderation/support − refunds/fraud − applicable taxes/fees.
Cowrie sale cash is not automatically earned platform revenue: unspent balances and creator obligations require finance/legal treatment. Track balances, gift deductions, refundable stakes and payouts separately. No assumptions about volume, profitability or tax status are supplied.

## Operational gates
Approved payment/payout provider, identity/KYC where required, regional stored-value review, server-authorised atomic ledger, idempotent signed callbacks, reconciliation, payout eligibility, FX quotation/expiry, refunds/chargebacks and dispute controls. Never derive monetary permission from localStorage. Define rounding and fee configuration once server-side, with tests for 10 Cowries/£1, 20%, 2.5%, 100 minimum and 1.5% before launch.
