-- Vinci launchable MVP: Bead Making + Pottery end to end.
-- Everything that used to live in browser state (streams, chat, Cowries, gifts,
-- auctions, marketplace, certificates, creation bids, Versus, galleries, XP, IDs)
-- is persisted here. Balances only change through SECURITY DEFINER functions.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Crafts
-- ---------------------------------------------------------------------------
create table public.crafts (
  slug text primary key,
  name text not null,
  enabled boolean not null default false,
  sort int not null default 0
);
insert into public.crafts (slug, name, enabled, sort) values
  ('bead-making', 'Bead Making', true, 1),
  ('pottery', 'Pottery', true, 2),
  ('painting', 'Painting', false, 3),
  ('sculpture', 'Sculpture', false, 4),
  ('textile', 'Textile', false, 5),
  ('tailoring', 'Tailoring', false, 6),
  ('furniture', 'Furniture', false, 7),
  ('culinary', 'Culinary', false, 8);
alter table public.crafts enable row level security;
create policy "crafts readable" on public.crafts for select using (true);
grant select on public.crafts to anon, authenticated;

create or replace function public._assert_enabled_craft(_craft text)
returns void language plpgsql stable set search_path = public as $$
begin
  if not exists (select 1 from crafts where slug = _craft and enabled) then
    raise exception 'craft_not_enabled' using errcode = 'P0001';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles: public creator identity, real member number (replaces fake VNC id)
-- ---------------------------------------------------------------------------
create sequence public.member_no_seq start 1;
alter table public.profiles
  add column member_no bigint not null default nextval('public.member_no_seq') unique,
  add column bio text,
  add column city text,
  add column country_code text,
  add column crafts text[] not null default '{}',
  add column is_creator boolean not null default false,
  add column verified boolean not null default false;
alter sequence public.member_no_seq owned by public.profiles.member_no;

alter table public.profiles
  add constraint profiles_handle_format check (handle is null or handle ~ '^[a-z0-9_]{3,30}$'),
  add constraint profiles_country_format check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 600),
  add constraint profiles_display_len check (display_name is null or char_length(display_name) <= 60);

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Public can view safe profile fields" on public.profiles;
create policy "Profiles are public" on public.profiles for select using (true);

-- Users may not change their own member number or verification badge.
create or replace function public._guard_profile()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.member_no := old.member_no;
    new.verified := old.verified;
  else
    new.verified := false;
  end if;
  return new;
end $$;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public._guard_profile();

-- ---------------------------------------------------------------------------
-- Cowries: wallets + append-only ledger. Free credits at launch.
-- ---------------------------------------------------------------------------
create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  last_claim_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
create policy "own wallet" on public.wallets for select to authenticated using (auth.uid() = user_id);
grant select on public.wallets to authenticated;

create table public.cowrie_ledger (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null, -- null = platform
  delta bigint not null,
  balance_after bigint,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);
create index cowrie_ledger_user_idx on public.cowrie_ledger (user_id, created_at desc);
alter table public.cowrie_ledger enable row level security;
create policy "own ledger" on public.cowrie_ledger for select to authenticated using (auth.uid() = user_id);
grant select on public.cowrie_ledger to authenticated;

-- Platform settings (single row).
create table public.platform_settings (
  id boolean primary key default true check (id),
  starter_grant bigint not null default 1000,
  daily_claim bigint not null default 200,
  platform_fee_pct numeric not null default 20,
  real_money boolean not null default false
);
insert into public.platform_settings default values;
alter table public.platform_settings enable row level security;
create policy "settings readable" on public.platform_settings for select using (true);
grant select on public.platform_settings to anon, authenticated;

create or replace function public._move_cowries(_user uuid, _delta bigint, _reason text, _ref_type text, _ref_id text)
returns bigint language plpgsql security definer set search_path = public as $$
declare _bal bigint;
begin
  if _delta = 0 then return null; end if;
  if _user is null then
    insert into cowrie_ledger (user_id, delta, reason, ref_type, ref_id) values (null, _delta, _reason, _ref_type, _ref_id);
    return null;
  end if;
  insert into wallets (user_id) values (_user) on conflict do nothing;
  update wallets set balance = balance + _delta, updated_at = now()
    where user_id = _user and balance + _delta >= 0
    returning balance into _bal;
  if _bal is null then
    raise exception 'insufficient_cowries' using errcode = 'P0001';
  end if;
  insert into cowrie_ledger (user_id, delta, balance_after, reason, ref_type, ref_id)
    values (_user, _delta, _bal, _reason, _ref_type, _ref_id);
  return _bal;
end $$;

-- Pay a creator: they get the amount minus the platform fee; the fee is logged.
create or replace function public._pay_creator(_creator uuid, _gross bigint, _reason text, _ref_type text, _ref_id text)
returns bigint language plpgsql security definer set search_path = public as $$
declare _fee bigint; _pct numeric;
begin
  select platform_fee_pct into _pct from platform_settings;
  _fee := floor(_gross * _pct / 100);
  perform _move_cowries(_creator, _gross - _fee, _reason, _ref_type, _ref_id);
  if _fee > 0 then perform _move_cowries(null, _fee, 'platform_fee', _ref_type, _ref_id); end if;
  return _gross - _fee;
end $$;

create or replace function public.claim_daily_cowries()
returns bigint language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _amt bigint; _last timestamptz;
begin
  if _uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  insert into wallets (user_id) values (_uid) on conflict do nothing;
  select last_claim_at into _last from wallets where user_id = _uid for update;
  if _last is not null and _last > now() - interval '24 hours' then
    raise exception 'already_claimed' using errcode = 'P0001';
  end if;
  select daily_claim into _amt from platform_settings;
  update wallets set last_claim_at = now() where user_id = _uid;
  return _move_cowries(_uid, _amt, 'daily_claim', null, null);
end $$;

-- New users: profile, viewer role, wallet with starter grant.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _grant bigint;
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'viewer');
  select starter_grant into _grant from public.platform_settings;
  insert into public.wallets (user_id) values (new.id);
  perform public._move_cowries(new.id, _grant, 'starter_grant', null, null);
  return new;
end $$;

-- Become a creator (no admin approval needed for MVP; verified badge stays admin-only).
create or replace function public.become_creator(_crafts text[])
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _c text;
begin
  if _uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if coalesce(array_length(_crafts, 1), 0) = 0 then raise exception 'choose_a_craft' using errcode = 'P0001'; end if;
  foreach _c in array _crafts loop perform _assert_enabled_craft(_c); end loop;
  update profiles set is_creator = true, crafts = _crafts where id = _uid;
  insert into user_roles (user_id, role) values (_uid, 'creator') on conflict do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- Streams (Cloudflare Stream live inputs)
-- ---------------------------------------------------------------------------
create table public.streams (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  craft text not null references public.crafts(slug),
  title text not null check (char_length(title) between 3 and 80),
  description text check (description is null or char_length(description) <= 1000),
  discipline text,
  format text not null default 'studio' check (format in ('studio','tutorial','commission','versus','showcase')),
  difficulty text check (difficulty is null or difficulty in ('Beginner-friendly','Intermediate','Advanced','Master class')),
  materials text[] not null default '{}',
  tags text[] not null default '{}',
  cover_url text,
  tips_enabled boolean not null default true,
  auction_enabled boolean not null default true,
  versus_enabled boolean not null default false,
  status text not null default 'setup' check (status in ('setup','live','ended')),
  ingest text not null default 'browser' check (ingest in ('browser','app')),
  cf_live_input_id text,
  whep_url text,
  replay_video_id text,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);
create index streams_status_idx on public.streams (status, craft, started_at desc);
create index streams_creator_idx on public.streams (creator_id, created_at desc);
alter table public.streams enable row level security;
create policy "streams public when live or ended" on public.streams for select
  using (status in ('live','ended') or creator_id = auth.uid());
create policy "creators create streams" on public.streams for insert to authenticated
  with check (creator_id = auth.uid() and status = 'setup'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_creator)
    and exists (select 1 from crafts c where c.slug = craft and c.enabled));
create policy "creators edit own streams" on public.streams for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
grant select on public.streams to anon, authenticated;
grant insert, update on public.streams to authenticated;

create or replace function public._guard_stream()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') then return new; end if;
  -- Lifecycle and provider columns are server-managed.
  new.creator_id := old.creator_id;
  new.status := old.status;
  new.ingest := old.ingest;
  new.cf_live_input_id := old.cf_live_input_id;
  new.whep_url := old.whep_url;
  new.replay_video_id := old.replay_video_id;
  new.started_at := old.started_at;
  new.ended_at := old.ended_at;
  new.last_heartbeat_at := old.last_heartbeat_at;
  new.craft := old.craft;
  return new;
end $$;
create trigger streams_guard before update on public.streams
  for each row execute function public._guard_stream();

-- Ingest credentials: only the creator can read them.
create table public.stream_secrets (
  stream_id uuid primary key references public.streams(id) on delete cascade,
  whip_url text,
  rtmps_url text,
  stream_key text,
  created_at timestamptz not null default now()
);
alter table public.stream_secrets enable row level security;
create policy "creator reads own secrets" on public.stream_secrets for select to authenticated
  using (exists (select 1 from streams s where s.id = stream_id and s.creator_id = auth.uid()));
grant select on public.stream_secrets to authenticated;

create or replace function public.stream_heartbeat(_stream uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update streams set last_heartbeat_at = now()
    where id = _stream and creator_id = auth.uid() and status = 'live';
end $$;

-- Streams whose studio stopped sending heartbeats for 3 minutes are ended.
create or replace function public.end_stale_streams()
returns int language plpgsql security definer set search_path = public as $$
declare _n int;
begin
  update streams set status = 'ended', ended_at = coalesce(last_heartbeat_at, now())
    where status = 'live' and coalesce(last_heartbeat_at, started_at) < now() - interval '3 minutes';
  get diagnostics _n = row_count;
  return _n;
end $$;

-- ---------------------------------------------------------------------------
-- Chat (realtime)
-- ---------------------------------------------------------------------------
create table public.chat_messages (
  id bigint generated always as identity primary key,
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'chat' check (kind in ('chat','gift','bid','purchase','commission','system')),
  body text not null check (char_length(body) between 1 and 240),
  amount bigint,
  created_at timestamptz not null default now()
);
create index chat_stream_idx on public.chat_messages (stream_id, id desc);
alter table public.chat_messages enable row level security;
create policy "chat readable with stream" on public.chat_messages for select
  using (exists (select 1 from streams s where s.id = stream_id and (s.status in ('live','ended') or s.creator_id = auth.uid())));
create policy "signed-in users chat on live streams" on public.chat_messages for insert to authenticated
  with check (user_id = auth.uid() and kind = 'chat' and amount is null
    and exists (select 1 from streams s where s.id = stream_id and s.status = 'live'));
grant select on public.chat_messages to anon, authenticated;
grant insert on public.chat_messages to authenticated;

create or replace function public._chat_event(_stream uuid, _user uuid, _kind text, _body text, _amount bigint)
returns void language sql security definer set search_path = public as $$
  insert into chat_messages (stream_id, user_id, kind, body, amount) values (_stream, _user, _kind, left(_body, 240), _amount);
$$;

-- ---------------------------------------------------------------------------
-- Gifts
-- ---------------------------------------------------------------------------
create table public.gifts (
  id bigint generated always as identity primary key,
  stream_id uuid not null references public.streams(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  gift text not null,
  amount bigint not null,
  creator_net bigint not null,
  created_at timestamptz not null default now()
);
alter table public.gifts enable row level security;
create policy "gifts public" on public.gifts for select using (true);
grant select on public.gifts to anon, authenticated;

create or replace function public.send_gift(_stream uuid, _gift text)
returns bigint language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _s streams; _amt bigint; _label text; _net bigint; _gid bigint;
begin
  if _uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select * into _s from streams where id = _stream;
  if _s.id is null or _s.status <> 'live' then raise exception 'stream_not_live' using errcode = 'P0001'; end if;
  if not _s.tips_enabled then raise exception 'tips_disabled' using errcode = 'P0001'; end if;
  if _s.creator_id = _uid then raise exception 'cannot_gift_self' using errcode = 'P0001'; end if;
  case _gift
    when 'shell' then _amt := 25; _label := '🐚 Shell';
    when 'bouquet' then _amt := 100; _label := '🌹 Bouquet';
    when 'spark' then _amt := 250; _label := '✨ Spark';
    when 'patron' then _amt := 1000; _label := '🏆 Patron';
    else raise exception 'unknown_gift' using errcode = 'P0001';
  end case;
  insert into gifts (stream_id, sender_id, creator_id, gift, amount, creator_net)
    values (_stream, _uid, _s.creator_id, _gift, _amt, 0) returning id into _gid;
  perform _move_cowries(_uid, -_amt, 'gift_sent', 'gift', _gid::text);
  _net := _pay_creator(_s.creator_id, _amt, 'gift_received', 'gift', _gid::text);
  update gifts set creator_net = _net where id = _gid;
  perform _chat_event(_stream, _uid, 'gift', 'Gifted ' || _label, _amt);
  return _gid;
end $$;

-- ---------------------------------------------------------------------------
-- Works: portfolio, marketplace listings and auction lots in one table
-- ---------------------------------------------------------------------------
create table public.works (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  craft text not null references public.crafts(slug),
  stream_id uuid references public.streams(id) on delete set null,
  title text not null check (char_length(title) between 2 and 80),
  description text check (description is null or char_length(description) <= 1000),
  medium text,
  year int,
  image_url text,
  delivery text not null default 'physical' check (delivery in ('physical','digital')),
  ships_from text,
  lead_time text,
  edition_size int not null default 1 check (edition_size between 1 and 500),
  editions_sold int not null default 0,
  sale_mode text not null default 'fixed' check (sale_mode in ('fixed','auction','none')),
  price bigint check (price is null or price >= 0), -- fixed price, or auction starting bid
  min_increment bigint not null default 50 check (min_increment > 0),
  status text not null default 'available' check (status in ('draft','available','sold_out','archived')),
  auction_status text check (auction_status in ('open','closed')),
  auction_ends_at timestamptz,
  current_bid bigint,
  top_bidder_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (sale_mode = 'none' or price is not null),
  check (sale_mode <> 'auction' or edition_size = 1)
);
create index works_creator_idx on public.works (creator_id, created_at desc);
create index works_stream_idx on public.works (stream_id);
alter table public.works enable row level security;
create policy "works public unless draft" on public.works for select using (status <> 'draft' or creator_id = auth.uid());
create policy "creators add works" on public.works for insert to authenticated
  with check (creator_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_creator)
    and exists (select 1 from crafts c where c.slug = craft and c.enabled)
    and (stream_id is null or exists (select 1 from streams s where s.id = stream_id and s.creator_id = auth.uid())));
create policy "creators edit own works" on public.works for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
grant select on public.works to anon, authenticated;
grant insert, update on public.works to authenticated;

create or replace function public._guard_work()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() = 'service_role' or current_user in ('postgres', 'supabase_admin') then return new; end if;
  if tg_op = 'INSERT' then
    new.editions_sold := 0; new.current_bid := null; new.top_bidder_id := null;
    new.auction_status := case when new.sale_mode = 'auction' then 'open' else null end;
    if new.sale_mode = 'auction' and new.auction_ends_at is null then
      new.auction_ends_at := now() + interval '60 minutes';
    end if;
    return new;
  end if;
  new.creator_id := old.creator_id;
  new.editions_sold := old.editions_sold;
  new.current_bid := old.current_bid;
  new.top_bidder_id := old.top_bidder_id;
  new.auction_status := old.auction_status;
  if old.editions_sold > 0 or old.current_bid is not null then
    -- Commercial terms freeze once someone has bought or bid.
    new.price := old.price; new.sale_mode := old.sale_mode; new.edition_size := old.edition_size;
    new.auction_ends_at := old.auction_ends_at; new.min_increment := old.min_increment;
  end if;
  return new;
end $$;
create trigger works_guard before insert or update on public.works
  for each row execute function public._guard_work();

create table public.bids (
  id bigint generated always as identity primary key,
  work_id uuid not null references public.works(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null,
  created_at timestamptz not null default now()
);
create index bids_work_idx on public.bids (work_id, amount desc);
alter table public.bids enable row level security;
create policy "bids public" on public.bids for select using (true);
grant select on public.bids to anon, authenticated;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  price bigint not null,
  edition_no int not null,
  source text not null check (source in ('buy_now','auction','gallery')),
  shipping_address text,
  status text not null default 'paid' check (status in ('paid','shipped','delivered')),
  tracking text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "buyer or seller sees order" on public.orders for select to authenticated
  using (auth.uid() in (buyer_id, seller_id));
grant select on public.orders to authenticated;

create sequence public.certificate_seq start 1;
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  serial text not null unique,
  work_id uuid not null references public.works(id),
  order_id uuid not null references public.orders(id),
  creator_id uuid not null references public.profiles(id),
  owner_id uuid not null references public.profiles(id),
  stream_id uuid references public.streams(id) on delete set null,
  edition_no int not null,
  edition_size int not null,
  price bigint not null,
  fingerprint text not null,
  issued_at timestamptz not null default now()
);
alter table public.certificates enable row level security;
create policy "certificates public" on public.certificates for select using (true);
grant select on public.certificates to anon, authenticated;

create or replace function public._issue_sale(_w works, _buyer uuid, _price bigint, _source text, _ship text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare _order uuid; _ed int; _serial text; _fp text;
begin
  _ed := _w.editions_sold + 1;
  insert into orders (work_id, buyer_id, seller_id, price, edition_no, source, shipping_address)
    values (_w.id, _buyer, _w.creator_id, _price, _ed, _source, case when _w.delivery = 'physical' then _ship end)
    returning id into _order;
  perform _pay_creator(_w.creator_id, _price, 'sale', 'order', _order::text);
  update works set editions_sold = _ed,
    status = case when _ed >= edition_size then 'sold_out' else status end
    where id = _w.id;
  _serial := 'VNC-COA-' || lpad(nextval('certificate_seq')::text, 6, '0');
  _fp := encode(digest(concat_ws('|', _serial, _w.id, _w.creator_id, _buyer, _ed, _w.edition_size, _price, _w.stream_id, now()), 'sha256'), 'hex');
  insert into certificates (serial, work_id, order_id, creator_id, owner_id, stream_id, edition_no, edition_size, price, fingerprint)
    values (_serial, _w.id, _order, _w.creator_id, _buyer, _w.stream_id, _ed, _w.edition_size, _price, _fp);
  return _serial;
end $$;

create or replace function public.buy_work(_work uuid, _shipping text default null)
returns text language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _w works; _serial text;
begin
  if _uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select * into _w from works where id = _work for update;
  if _w.id is null or _w.status <> 'available' or _w.sale_mode <> 'fixed' then raise exception 'not_for_sale' using errcode = 'P0001'; end if;
  if _w.creator_id = _uid then raise exception 'cannot_buy_own_work' using errcode = 'P0001'; end if;
  if _w.delivery = 'physical' and coalesce(trim(_shipping), '') = '' then raise exception 'shipping_required' using errcode = 'P0001'; end if;
  perform _move_cowries(_uid, -_w.price, 'purchase', 'work', _w.id::text);
  _serial := _issue_sale(_w, _uid, _w.price, 'buy_now', _shipping);
  if _w.stream_id is not null then
    perform _chat_event(_w.stream_id, _uid, 'purchase', 'Collected "' || _w.title || '" · ' || _serial, _w.price);
  end if;
  return _serial;
end $$;

-- Auction: only the top bid is held. A new top bid refunds the previous one.
create table public.auction_shipping (
  work_id uuid not null references public.works(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  shipping_address text not null,
  primary key (work_id, bidder_id)
);
alter table public.auction_shipping enable row level security; -- server-side only

create or replace function public.place_bid(_work uuid, _amount bigint, _shipping text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _w works; _min bigint;
begin
  if _uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select * into _w from works where id = _work for update;
  if _w.id is null or _w.sale_mode <> 'auction' or _w.auction_status <> 'open' or _w.status <> 'available' then
    raise exception 'auction_not_open' using errcode = 'P0001';
  end if;
  if _w.auction_ends_at <= now() then raise exception 'auction_ended' using errcode = 'P0001'; end if;
  if _w.creator_id = _uid then raise exception 'cannot_bid_own_work' using errcode = 'P0001'; end if;
  if _w.delivery = 'physical' and coalesce(trim(_shipping), '') = '' then raise exception 'shipping_required' using errcode = 'P0001'; end if;
  _min := case when _w.current_bid is null then _w.price else _w.current_bid + _w.min_increment end;
  if _amount < _min then raise exception 'bid_too_low:%', _min using errcode = 'P0001'; end if;
  if _w.top_bidder_id = _uid then
    perform _move_cowries(_uid, -(_amount - _w.current_bid), 'bid_hold', 'work', _w.id::text);
  else
    perform _move_cowries(_uid, -_amount, 'bid_hold', 'work', _w.id::text);
    if _w.top_bidder_id is not null then
      perform _move_cowries(_w.top_bidder_id, _w.current_bid, 'bid_refund_outbid', 'work', _w.id::text);
    end if;
  end if;
  update works set current_bid = _amount, top_bidder_id = _uid,
    -- anti-sniping: a bid in the final minute extends the auction by a minute
    auction_ends_at = greatest(auction_ends_at, now() + interval '1 minute')
    where id = _w.id;
  insert into bids (work_id, bidder_id, amount) values (_w.id, _uid, _amount);
  if _w.delivery = 'physical' then
    insert into auction_shipping (work_id, bidder_id, shipping_address) values (_w.id, _uid, _shipping)
      on conflict (work_id, bidder_id) do update set shipping_address = excluded.shipping_address;
  end if;
  if _w.stream_id is not null then
    perform _chat_event(_w.stream_id, _uid, 'bid', 'Bid on "' || _w.title || '"', _amount);
  end if;
  return _amount;
end $$;

-- Creator can close any time; anyone can close once the timer has run out.
create or replace function public.close_auction(_work uuid)
returns text language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _w works; _serial text; _ship text;
begin
  select * into _w from works where id = _work for update;
  if _w.id is null or _w.sale_mode <> 'auction' then raise exception 'not_an_auction' using errcode = 'P0001'; end if;
  if _w.auction_status = 'closed' then return null; end if;
  if not (auth.role() = 'service_role' or _uid = _w.creator_id or _w.auction_ends_at <= now()) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  update works set auction_status = 'closed' where id = _w.id;
  if _w.top_bidder_id is null then
    update works set sale_mode = 'none' where id = _w.id;
    return null;
  end if;
  select shipping_address into _ship from auction_shipping where work_id = _w.id and bidder_id = _w.top_bidder_id;
  -- Funds were already held from the bidder; pay the creator and issue the certificate.
  _serial := _issue_sale(_w, _w.top_bidder_id, _w.current_bid, 'auction', _ship);
  if _w.stream_id is not null then
    perform _chat_event(_w.stream_id, _w.top_bidder_id, 'purchase', 'Won the auction for "' || _w.title || '" · ' || _serial, _w.current_bid);
  end if;
  return _serial;
end $$;

create or replace function public.close_expired_auctions()
returns int language plpgsql security definer set search_path = public as $$
declare _id uuid; _n int := 0;
begin
  for _id in select id from works where sale_mode = 'auction' and auction_status = 'open' and auction_ends_at <= now() loop
    perform close_auction(_id); _n := _n + 1;
  end loop;
  return _n;
end $$;

create or replace function public.mark_order_shipped(_order uuid, _tracking text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update orders set status = 'shipped', tracking = left(_tracking, 120)
    where id = _order and seller_id = auth.uid() and status = 'paid';
  if not found then raise exception 'not_allowed' using errcode = 'P0001'; end if;
end $$;

create or replace function public.mark_order_delivered(_order uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update orders set status = 'delivered' where id = _order and buyer_id = auth.uid() and status = 'shipped';
  if not found then raise exception 'not_allowed' using errcode = 'P0001'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- Creation bids (viewer-proposed commissions)
-- ---------------------------------------------------------------------------
create table public.commission_requests (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 3 and 120),
  amount bigint not null check (amount >= 50),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index commission_stream_idx on public.commission_requests (stream_id, created_at desc);
alter table public.commission_requests enable row level security;
create policy "commissions public" on public.commission_requests for select using (true);
grant select on public.commission_requests to anon, authenticated;

create or replace function public.submit_commission(_stream uuid, _prompt text, _amount bigint)
returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _s streams; _id uuid;
begin
  if _uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select * into _s from streams where id = _stream;
  if _s.id is null or _s.status <> 'live' then raise exception 'stream_not_live' using errcode = 'P0001'; end if;
  if _s.creator_id = _uid then raise exception 'cannot_commission_self' using errcode = 'P0001'; end if;
  if _amount < 50 then raise exception 'min_50' using errcode = 'P0001'; end if;
  insert into commission_requests (stream_id, creator_id, requester_id, prompt, amount)
    values (_stream, _s.creator_id, _uid, trim(_prompt), _amount) returning id into _id;
  perform _move_cowries(_uid, -_amount, 'commission_hold', 'commission', _id::text);
  perform _chat_event(_stream, _uid, 'commission', 'Creation bid: "' || trim(_prompt) || '"', _amount);
  return _id;
end $$;

create or replace function public.resolve_commission(_id uuid, _accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare _c commission_requests;
begin
  select * into _c from commission_requests where id = _id for update;
  if _c.id is null or _c.creator_id <> auth.uid() then raise exception 'not_allowed' using errcode = 'P0001'; end if;
  if _c.status <> 'pending' then raise exception 'already_resolved' using errcode = 'P0001'; end if;
  update commission_requests set status = case when _accept then 'accepted' else 'declined' end, resolved_at = now() where id = _id;
  if _accept then
    perform _pay_creator(_c.creator_id, _c.amount, 'commission_accepted', 'commission', _id::text);
  else
    perform _move_cowries(_c.requester_id, _c.amount, 'commission_refund', 'commission', _id::text);
  end if;
  perform _chat_event(_c.stream_id, _c.creator_id, 'system',
    case when _accept then 'Accepted creation bid: "' else 'Declined (refunded): "' end || _c.prompt || '"', _c.amount);
end $$;

-- ---------------------------------------------------------------------------
-- Versus battles
-- ---------------------------------------------------------------------------
create table public.versus_battles (
  id uuid primary key default gen_random_uuid(),
  craft text not null references public.crafts(slug),
  title text not null check (char_length(title) between 3 and 80),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  opponent_id uuid not null references public.profiles(id) on delete cascade,
  challenger_label text,
  opponent_label text,
  status text not null default 'pending' check (status in ('pending','live','ended','declined')),
  duration_minutes int not null default 60 check (duration_minutes between 10 and 1440),
  vote_cost bigint not null default 10,
  starts_at timestamptz,
  ends_at timestamptz,
  votes_a int not null default 0,
  votes_b int not null default 0,
  pot bigint not null default 0,
  payout_a bigint,
  payout_b bigint,
  winner_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (challenger_id <> opponent_id)
);
alter table public.versus_battles enable row level security;
create policy "battles public" on public.versus_battles for select using (true);
grant select on public.versus_battles to anon, authenticated;

create table public.versus_votes (
  battle_id uuid not null references public.versus_battles(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  side text not null check (side in ('a','b')),
  created_at timestamptz not null default now(),
  primary key (battle_id, voter_id)
);
alter table public.versus_votes enable row level security;
create policy "own votes" on public.versus_votes for select to authenticated using (voter_id = auth.uid());
grant select on public.versus_votes to authenticated;

create or replace function public.create_battle(_opponent_handle text, _title text, _craft text, _duration int, _my_label text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _opp uuid; _id uuid;
begin
  if not exists (select 1 from profiles where id = _uid and is_creator) then raise exception 'creators_only' using errcode = 'P0001'; end if;
  perform _assert_enabled_craft(_craft);
  select id into _opp from profiles where handle = lower(_opponent_handle) and is_creator;
  if _opp is null then raise exception 'opponent_not_found' using errcode = 'P0001'; end if;
  if _opp = _uid then raise exception 'cannot_battle_self' using errcode = 'P0001'; end if;
  insert into versus_battles (craft, title, challenger_id, opponent_id, duration_minutes, challenger_label)
    values (_craft, _title, _uid, _opp, coalesce(_duration, 60), _my_label) returning id into _id;
  return _id;
end $$;

create or replace function public.respond_battle(_id uuid, _accept boolean, _my_label text default null)
returns void language plpgsql security definer set search_path = public as $$
declare _b versus_battles;
begin
  select * into _b from versus_battles where id = _id for update;
  if _b.id is null or _b.opponent_id <> auth.uid() or _b.status <> 'pending' then raise exception 'not_allowed' using errcode = 'P0001'; end if;
  if _accept then
    update versus_battles set status = 'live', starts_at = now(), ends_at = now() + make_interval(mins => duration_minutes),
      opponent_label = _my_label where id = _id;
  else
    update versus_battles set status = 'declined' where id = _id;
  end if;
end $$;

create or replace function public.vote_battle(_id uuid, _side text)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _b versus_battles;
begin
  if _uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select * into _b from versus_battles where id = _id for update;
  if _b.id is null or _b.status <> 'live' or _b.ends_at <= now() then raise exception 'battle_not_live' using errcode = 'P0001'; end if;
  if _uid in (_b.challenger_id, _b.opponent_id) then raise exception 'contestants_cannot_vote' using errcode = 'P0001'; end if;
  if _side not in ('a','b') then raise exception 'bad_side' using errcode = 'P0001'; end if;
  insert into versus_votes (battle_id, voter_id, side) values (_id, _uid, _side);
  perform _move_cowries(_uid, -_b.vote_cost, 'versus_vote', 'battle', _id::text);
  update versus_battles set pot = pot + _b.vote_cost,
    votes_a = votes_a + (_side = 'a')::int, votes_b = votes_b + (_side = 'b')::int
    where id = _id;
exception when unique_violation then
  raise exception 'already_voted' using errcode = 'P0001';
end $$;

-- Pot (minus platform fee) is split by vote share; the side with more votes wins.
create or replace function public.settle_battle(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _b versus_battles; _pct numeric; _net bigint; _a bigint; _total int;
begin
  select * into _b from versus_battles where id = _id for update;
  if _b.id is null or _b.status <> 'live' or _b.ends_at > now() then return; end if;
  select platform_fee_pct into _pct from platform_settings;
  _net := _b.pot - floor(_b.pot * _pct / 100);
  _total := _b.votes_a + _b.votes_b;
  _a := case when _total = 0 then 0 else floor(_net * _b.votes_a::numeric / _total) end;
  if _b.pot - _net > 0 then perform _move_cowries(null, _b.pot - _net, 'platform_fee', 'battle', _id::text); end if;
  if _a > 0 then perform _move_cowries(_b.challenger_id, _a, 'versus_payout', 'battle', _id::text); end if;
  if _net - _a > 0 then perform _move_cowries(_b.opponent_id, _net - _a, 'versus_payout', 'battle', _id::text); end if;
  update versus_battles set status = 'ended', payout_a = _a, payout_b = _net - _a,
    winner_id = case when _b.votes_a > _b.votes_b then _b.challenger_id when _b.votes_b > _b.votes_a then _b.opponent_id end
    where id = _id;
end $$;

create or replace function public.settle_expired_battles()
returns int language plpgsql security definer set search_path = public as $$
declare _id uuid; _n int := 0;
begin
  for _id in select id from versus_battles where status = 'live' and ends_at <= now() loop
    perform settle_battle(_id); _n := _n + 1;
  end loop;
  return _n;
end $$;

create or replace view public.versus_leaderboard with (security_invoker = true) as
select p.id, p.handle, p.display_name, p.avatar_url, p.city, p.country_code,
  count(*) filter (where b.winner_id = p.id) as wins,
  count(*) as battles,
  coalesce(sum(case when b.challenger_id = p.id then b.payout_a else b.payout_b end), 0) as cowries_earned,
  coalesce(sum(b.votes_a + b.votes_b), 0) as votes_received_total
from public.versus_battles b
join public.profiles p on p.id in (b.challenger_id, b.opponent_id)
where b.status = 'ended'
group by p.id;
grant select on public.versus_leaderboard to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Virtual galleries
-- ---------------------------------------------------------------------------
create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references public.profiles(id) on delete cascade,
  craft text not null references public.crafts(slug),
  title text not null check (char_length(title) between 3 and 80),
  theme text,
  entry_fee bigint not null default 0 check (entry_fee between 0 and 10000),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default now() + interval '7 days',
  palette_a text not null default '#2d1b00',
  palette_b text not null default '#c97b2c',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
alter table public.galleries enable row level security;
create policy "galleries public" on public.galleries for select using (true);
create policy "creators curate" on public.galleries for insert to authenticated
  with check (curator_id = auth.uid() and exists (select 1 from profiles p where p.id = auth.uid() and p.is_creator)
    and exists (select 1 from crafts c where c.slug = craft and c.enabled));
create policy "curator edits" on public.galleries for update to authenticated
  using (curator_id = auth.uid()) with check (curator_id = auth.uid());
grant select on public.galleries to anon, authenticated;
grant insert, update on public.galleries to authenticated;

create table public.gallery_works (
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gallery_id, work_id)
);
alter table public.gallery_works enable row level security;
create policy "gallery works public" on public.gallery_works for select using (true);
create policy "artists hang own works" on public.gallery_works for insert to authenticated
  with check (exists (select 1 from works w where w.id = work_id and w.creator_id = auth.uid() and w.status = 'available')
    and exists (select 1 from galleries g where g.id = gallery_id and g.ends_at > now()));
create policy "artists remove own works" on public.gallery_works for delete to authenticated
  using (exists (select 1 from works w where w.id = work_id and w.creator_id = auth.uid()));
grant select on public.gallery_works to anon, authenticated;
grant insert, delete on public.gallery_works to authenticated;

create table public.gallery_passes (
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  paid bigint not null default 0,
  created_at timestamptz not null default now(),
  primary key (gallery_id, user_id)
);
alter table public.gallery_passes enable row level security;
create policy "own passes" on public.gallery_passes for select to authenticated using (user_id = auth.uid());
grant select on public.gallery_passes to authenticated;

create table public.gallery_rsvps (
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gallery_id, user_id)
);
alter table public.gallery_rsvps enable row level security;
create policy "own rsvps" on public.gallery_rsvps for select to authenticated using (user_id = auth.uid());
create policy "rsvp self" on public.gallery_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy "un-rsvp self" on public.gallery_rsvps for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on public.gallery_rsvps to authenticated;

-- Entry fee is split equally between the artists hanging work in the room.
create or replace function public.enter_gallery(_gallery uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _g galleries; _artists uuid[]; _share bigint; _a uuid; _n int;
begin
  if _uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select * into _g from galleries where id = _gallery;
  if _g.id is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if now() < _g.starts_at or now() > _g.ends_at then raise exception 'gallery_not_open' using errcode = 'P0001'; end if;
  if exists (select 1 from gallery_passes where gallery_id = _gallery and user_id = _uid) then return; end if;
  select array_agg(distinct w.creator_id) into _artists
    from gallery_works gw join works w on w.id = gw.work_id where gw.gallery_id = _gallery;
  if _g.entry_fee = 0 or _uid = _g.curator_id or _uid = any(coalesce(_artists, '{}')) then
    insert into gallery_passes (gallery_id, user_id, paid) values (_gallery, _uid, 0);
    return;
  end if;
  perform _move_cowries(_uid, -_g.entry_fee, 'gallery_entry', 'gallery', _gallery::text);
  insert into gallery_passes (gallery_id, user_id, paid) values (_gallery, _uid, _g.entry_fee);
  _n := coalesce(array_length(_artists, 1), 0);
  if _n = 0 then
    perform _pay_creator(_g.curator_id, _g.entry_fee, 'gallery_entry_share', 'gallery', _gallery::text);
  else
    _share := _g.entry_fee / _n;
    foreach _a in array _artists loop
      perform _pay_creator(_a, _share, 'gallery_entry_share', 'gallery', _gallery::text);
    end loop;
    if _g.entry_fee - _share * _n > 0 then
      perform _move_cowries(null, _g.entry_fee - _share * _n, 'platform_fee', 'gallery', _gallery::text);
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Social: follows and posts
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);
alter table public.follows enable row level security;
create policy "follows public" on public.follows for select using (true);
create policy "follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "posts public" on public.posts for select using (true);
create policy "write own posts" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "delete own posts" on public.posts for delete to authenticated using (author_id = auth.uid());
grant select on public.posts to anon, authenticated;
grant insert, delete on public.posts to authenticated;

-- ---------------------------------------------------------------------------
-- XP and levels (replaces the fake hash-derived XP)
-- ---------------------------------------------------------------------------
create or replace function public.user_stats(_user uuid)
returns table (xp bigint, streams_hosted bigint, minutes_streamed bigint, works_sold bigint, versus_wins bigint, cowries_gifted bigint, bids_placed bigint, followers bigint)
language sql stable security definer set search_path = public as $$
  with s as (
    select count(*) as n, coalesce(sum(least(extract(epoch from (coalesce(ended_at, now()) - started_at)) / 60, 240)), 0)::bigint as mins
    from streams where creator_id = _user and started_at is not null
  ), sold as (select count(*) as n from orders where seller_id = _user),
  wins as (select count(*) as n from versus_battles where winner_id = _user),
  g as (select coalesce(sum(amount), 0) as n from gifts where sender_id = _user),
  b as (select count(*) as n from bids where bidder_id = _user),
  f as (select count(*) as n from follows where creator_id = _user)
  select (s.n * 20 + s.mins + sold.n * 50 + wins.n * 100 + g.n / 10 + b.n * 5 + f.n * 2)::bigint,
    s.n, s.mins, sold.n, wins.n, g.n::bigint, b.n, f.n
  from s, sold, wins, g, b, f;
$$;
grant execute on function public.user_stats(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Function permissions: internal helpers are not callable by clients.
-- ---------------------------------------------------------------------------
revoke execute on function public._move_cowries(uuid, bigint, text, text, text) from public, anon, authenticated;
revoke execute on function public._pay_creator(uuid, bigint, text, text, text) from public, anon, authenticated;
revoke execute on function public._chat_event(uuid, uuid, text, text, bigint) from public, anon, authenticated;
revoke execute on function public._issue_sale(public.works, uuid, bigint, text, text) from public, anon, authenticated;
revoke execute on function public._assert_enabled_craft(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke execute on function public.claim_daily_cowries() from public, anon;
revoke execute on function public.become_creator(text[]) from public, anon;
revoke execute on function public.stream_heartbeat(uuid) from public, anon;
revoke execute on function public.send_gift(uuid, text) from public, anon;
revoke execute on function public.buy_work(uuid, text) from public, anon;
revoke execute on function public.place_bid(uuid, bigint, text) from public, anon;
revoke execute on function public.close_auction(uuid) from public, anon;
revoke execute on function public.mark_order_shipped(uuid, text) from public, anon;
revoke execute on function public.mark_order_delivered(uuid) from public, anon;
revoke execute on function public.submit_commission(uuid, text, bigint) from public, anon;
revoke execute on function public.resolve_commission(uuid, boolean) from public, anon;
revoke execute on function public.create_battle(text, text, text, int, text) from public, anon;
revoke execute on function public.respond_battle(uuid, boolean, text) from public, anon;
revoke execute on function public.vote_battle(uuid, text) from public, anon;
revoke execute on function public.enter_gallery(uuid) from public, anon;
grant execute on function public.claim_daily_cowries(), public.become_creator(text[]), public.stream_heartbeat(uuid),
  public.send_gift(uuid, text), public.buy_work(uuid, text), public.place_bid(uuid, bigint, text), public.close_auction(uuid),
  public.mark_order_shipped(uuid, text), public.mark_order_delivered(uuid), public.submit_commission(uuid, text, bigint),
  public.resolve_commission(uuid, boolean), public.create_battle(text, text, text, int, text), public.respond_battle(uuid, boolean, text),
  public.vote_battle(uuid, text), public.enter_gallery(uuid) to authenticated;
-- Housekeeping is safe for anyone to trigger (idempotent, time-based).
grant execute on function public.end_stale_streams(), public.close_expired_auctions(), public.settle_expired_battles(), public.settle_battle(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.chat_messages, public.streams, public.works,
  public.commission_requests, public.versus_battles, public.wallets;

-- ---------------------------------------------------------------------------
-- Storage: public images, uploads only into your own folder
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
