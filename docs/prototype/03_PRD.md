# Vinci — Product requirements document
Version 1.0 · 1 November 2026

## Product purpose
Vinci is a global stage for handmade creators: audiences explore craft, engage with makers and eventually commission or collect authentic work. This release is an MVP demonstration with working account/profile integration, not a commercial streaming service.

## Audiences
- Visitor: discovers sample artists and streams without an account; can prepare a non-monetised broadcast under a Visitor Number.
- Registered viewer: owns a profile; intended future buyer, gifter, bidder and voter.
- Creator/streamer: intended owner of identity, portfolio, events and earning tools.
- Vinci operator: intended event moderation, trust, payments and fulfilment owner; no operator dashboard is built.

## Product requirements and delivery status
| ID | Requirement | Current status |
|---|---|---|
| P01 | Painting, Sculpture, Bead Making, Textile, Tailoring, Furniture, Ceramics, Culinary discovery | Eight sample category pages |
| P02 | Public watching/browsing | Public sample stream pages; no real video/replays |
| P03 | Sign-up/sign-in and profile | Auth integration and persisted owner profile fields |
| P04 | Unique region-coded creator ID | Sample ART IDs; account VNC display ID only; allocation missing |
| P05 | Achievement level, posts, events and gallery on profile | Illustrative tabs/data; no persistence |
| P06 | Go Live requires title, discipline, category and cover | Form validation; simulated start fails catalogue lookup |
| P07 | Visitors get number, cannot monetise | Local visitor number and disabled setup toggles; no server monetisation enforcement |
| P08 | Multi-camera, realtime chat and reactions | Simulated viewer/local interactions |
| P09 | Marketplace, auction, creation bid, timed competition | Cowrie-priced local UI demonstrations |
| P10 | All payment activity in Cowries | Display/model convention; no real charges |
| P11 | Certificate tied to artist ID and buyer wallet | Mock certificate only; no minting |
| P12 | Versus: >=2 same-category artists; paid votes; leaderboard | Sample battles and local counters |
| P13 | Live gallery: >=5 artists, agreed entry fee, art purchase, Vinci logistics | Faux-3D sample room and flows; no admission/fulfilment |
| P14 | Regional discovery, seven languages, local payout currency, timezone schedule | Static filters and preview/calculator features, not full translation or payouts |

## Expected complete-product journeys
Discover → watch → engage → account → acquire Cowries → spend → creator receives net value → eligible withdrawal. Artwork order → certificate → delivery. Gallery artists agree fee → publish event → visitor pays admission → inspects accurate artwork → buys → Vinci coordinates delivery.

## Product acceptance gates for a real pilot
Monetisation must require verified account authorization on the server. Paid actions need confirmed settlement and audit records. Certificates need genuine chain evidence. Artist IDs must be durable and unique. Gallery eligibility must enforce five confirmed artists. Visitors may browse and use non-monetised setup but receive no creator ID. None of these commercial gates is satisfied solely by the current demonstration.

## Success measurement — future instrumentation
Track discover-to-stream opens, completed signups, profile saves, repeat viewer visits and qualitative creator feedback first. Measure payment conversion, successful deliveries, creator retention, complaints and withdrawal completion only once those operations exist. No baseline analytics, target volumes or commercial traction is claimed.

## Out of scope now
Production video/CDN, real balances/payouts, wallet connection/contracts, multi-user realtime interaction, physical logistics, persisted social/event content, native apps and complete international compliance.
