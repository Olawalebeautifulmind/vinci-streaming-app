# Vinci — Database schema
Version 1.0 · 1 November 2026 · Current-state handover

## What is actually stored
Lovable Cloud currently contains two application tables, one enum and three functions. Streaming, transactions, art, achievements, posts and events are not persisted. This handover contains no account records, personal data, passwords or database backup.

```text
Managed auth user
  ├── profiles.id                 1:1
  └── user_roles.user_id           1:many
           role → app_role
```

### public.profiles
| Column | Type | Constraints / default |
|---|---|---|
| id | uuid | Primary key; managed auth user reference, delete cascades |
| display_name | text | Nullable |
| handle | text | Nullable; unique |
| avatar_url | text | Nullable |
| region | text | Nullable |
| wallet_address | text | Nullable; private owner-readable field |
| created_at | timestamptz | Required; now() |
| updated_at | timestamptz | Required; now(); update trigger |

### public.user_roles
| Column | Type | Constraints / default |
|---|---|---|
| id | uuid | Primary key; gen_random_uuid() |
| user_id | uuid | Required; managed auth user reference, delete cascades |
| role | app_role | Required; viewer / creator / admin |
| created_at | timestamptz | Required; now() |

Unique (user_id, role). Roles are not stored on profiles and cannot be assigned through user-editable metadata.

## Functions and triggers
- handle_new_user(): security-definer signup trigger creates profile and viewer role. Display name comes from metadata or email prefix, avatar from metadata. No unique regional Artist ID is allocated.
- set_updated_at(): security-invoker profile update trigger sets timestamp; explicit public search path.
- has_role(uuid, app_role): stable security-definer lookup; execute revoked from public, anon and authenticated. Do not assume an authenticated app can call it without a separately reviewed grant.
- Functions are executable by the privileged service role in the inspected backend. This does not make service credentials available to the user.

## Current policies and grants
RLS is enabled on both tables. Profiles: authenticated SELECT where auth.uid() = id; anonymous SELECT always false; self INSERT and UPDATE. Roles: self SELECT only; no client role creation/modification policies. No DELETE policy exists.

The live table ACL inspection showed broad ALL grants to anon, authenticated and service_role; RLS still restricts row access. Historical migration files do not reproduce these explicit grants, so replaying them alone on a fresh backend may fail. See database/current_schema.sql for a consolidated fresh-install reference with explicit observed grants and the final restrictive profile-read policies. Its broad grants document the inspected state, not a recommendation; least-privilege tuning is a future security review.

## Export files
- app/supabase/migrations/: four original migrations, unchanged.
- database/current_schema.sql: schema-only consolidated reference; not an extra migration; never run after the original history or against the existing database.

## Proposed later schema — not built
| Domain | Proposed entities | Key constraints |
|---|---|---|
| Identity | artist_id_allocations, public_creator_directory | Unique regional serial; expose only approved public fields |
| Streaming | streams, stream_sessions, stream_tags, chat_messages | Explicit owner; provider IDs; durable lifecycle |
| Artwork | artworks, listings, certificates, provenance_events | Immutable identity links; verified transaction reference |
| Money | wallets, ledger_entries, purchases, gifts, withdrawals | Atomic double-entry posting; idempotent provider events |
| Orders | orders, addresses, shipments, disputes | Private buyer details; tracking and reconciliation |
| Events | events, event_artists, registrations, votes | Gallery requires >=5 artists; server-validated access |
| Social | posts, media, achievements, progress | Ownership and moderation |

All new application user IDs must be plain UUIDs or reference public.profiles; only profiles/user_roles may reference managed auth users. Each future table needs explicit grants followed by RLS and policies. No proposed table is deployed or included as executable SQL.
