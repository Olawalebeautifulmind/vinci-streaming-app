// End-to-end database tests against a local Supabase (`npx supabase start`).
// Run: node --test tests/db.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!ANON || !SERVICE)
  throw new Error(
    "Set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (see `npx supabase status -o env`).",
  );

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const run = Date.now().toString(36);

async function makeUser(name) {
  const email = `${name}-${run}@test.local`;
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signUp({
    email,
    password: "password123",
    options: { data: { display_name: name } },
  });
  if (error) throw error;
  return { c, id: data.user.id, email };
}
const balance = async (u) => (await u.c.from("wallets").select("balance").single()).data.balance;
const rpc = async (u, fn, args) => {
  const { data, error } = await u.c.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
};
const rpcErr = async (u, fn, args) => {
  const { error } = await u.c.rpc(fn, args);
  return error?.message ?? null;
};

let ada, bea, cal, dee; // ada + dee creators, bea + cal viewers
let stream;

before(async () => {
  [ada, bea, cal, dee] = await Promise.all(["ada", "bea", "cal", "dee"].map(makeUser));
  await ada.c
    .from("profiles")
    .update({ handle: `ada_${run}` })
    .eq("id", ada.id);
  await dee.c
    .from("profiles")
    .update({ handle: `dee_${run}` })
    .eq("id", dee.id);
  await rpc(ada, "become_creator", { _crafts: ["bead-making"] });
  await rpc(dee, "become_creator", { _crafts: ["pottery"] });
});

test("new users get a starter grant, a member number and a public profile", async () => {
  assert.equal(await balance(bea), 1000);
  const { data } = await anon
    .from("profiles")
    .select("member_no, display_name")
    .eq("id", bea.id)
    .single();
  assert.ok(data.member_no > 0);
  assert.equal(data.display_name, "bea");
});

test("wallets cannot be edited or read by others", async () => {
  await bea.c.from("wallets").update({ balance: 999999 }).eq("user_id", bea.id);
  assert.equal(await balance(bea), 1000);
  const { data } = await bea.c.from("wallets").select("*").eq("user_id", ada.id);
  assert.equal(data.length, 0);
  assert.match(
    await rpcErr(bea, "_move_cowries", {
      _user: bea.id,
      _delta: 100,
      _reason: "x",
      _ref_type: null,
      _ref_id: null,
    }),
    /permission denied|Could not find/,
  );
});

test("member number and verified badge cannot be self-edited", async () => {
  const before = (await bea.c.from("profiles").select("member_no").eq("id", bea.id).single()).data
    .member_no;
  await bea.c.from("profiles").update({ member_no: 1, verified: true }).eq("id", bea.id);
  const after = (
    await bea.c.from("profiles").select("member_no, verified").eq("id", bea.id).single()
  ).data;
  assert.equal(after.member_no, before);
  assert.equal(after.verified, false);
});

test("only creators can create streams, only for enabled crafts", async () => {
  const bad = await bea.c
    .from("streams")
    .insert({ creator_id: bea.id, craft: "bead-making", title: "Not a creator" });
  assert.ok(bad.error);
  const off = await ada.c
    .from("streams")
    .insert({ creator_id: ada.id, craft: "painting", title: "Disabled craft" });
  assert.ok(off.error);
  const ok = await ada.c
    .from("streams")
    .insert({ creator_id: ada.id, craft: "bead-making", title: "Lampwork beads live" })
    .select()
    .single();
  assert.ifError(ok.error);
  stream = ok.data;
  assert.equal(stream.status, "setup");
});

test("setup streams are hidden; creators cannot flip status themselves", async () => {
  const { data } = await anon.from("streams").select("id").eq("id", stream.id);
  assert.equal(data.length, 0);
  await ada.c
    .from("streams")
    .update({ status: "live", title: "Lampwork beads, live now" })
    .eq("id", stream.id);
  const s = (await ada.c.from("streams").select("status, title").eq("id", stream.id).single()).data;
  assert.equal(s.status, "setup");
  assert.equal(s.title, "Lampwork beads, live now");
});

test("ingest secrets are visible to the creator only", async () => {
  await admin
    .from("stream_secrets")
    .insert({ stream_id: stream.id, whip_url: "https://example/whip", stream_key: "k" });
  assert.equal(
    (await ada.c.from("stream_secrets").select("*").eq("stream_id", stream.id)).data.length,
    1,
  );
  assert.equal(
    (await bea.c.from("stream_secrets").select("*").eq("stream_id", stream.id)).data.length,
    0,
  );
  assert.equal(
    (await anon.from("stream_secrets").select("*").eq("stream_id", stream.id)).data?.length ?? 0,
    0,
  );
});

test("chat only works on live streams and only as yourself", async () => {
  const pre = await bea.c
    .from("chat_messages")
    .insert({ stream_id: stream.id, user_id: bea.id, body: "hello" });
  assert.ok(pre.error);
  await admin
    .from("streams")
    .update({
      status: "live",
      started_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
    })
    .eq("id", stream.id);
  assert.ifError(
    (
      await bea.c
        .from("chat_messages")
        .insert({ stream_id: stream.id, user_id: bea.id, body: "hello" })
    ).error,
  );
  assert.ok(
    (
      await bea.c
        .from("chat_messages")
        .insert({ stream_id: stream.id, user_id: cal.id, body: "spoof" })
    ).error,
  );
  assert.ok(
    (
      await bea.c
        .from("chat_messages")
        .insert({ stream_id: stream.id, user_id: bea.id, body: "fake gift", kind: "gift" })
    ).error,
  );
  const { data } = await anon.from("chat_messages").select("body").eq("stream_id", stream.id);
  assert.deepEqual(
    data.map((m) => m.body),
    ["hello"],
  );
});

test("gifts move Cowries to the creator minus the 20% platform fee", async () => {
  const a0 = await balance(ada);
  await rpc(bea, "send_gift", { _stream: stream.id, _gift: "bouquet" });
  assert.equal(await balance(bea), 900);
  assert.equal(await balance(ada), a0 + 80);
  assert.match(
    await rpcErr(ada, "send_gift", { _stream: stream.id, _gift: "shell" }),
    /cannot_gift_self/,
  );
  const { data } = await anon
    .from("chat_messages")
    .select("kind, amount")
    .eq("stream_id", stream.id)
    .eq("kind", "gift");
  assert.equal(data[0].amount, 100);
});

test("buy now issues an order and a public certificate", async () => {
  const w = (
    await ada.c
      .from("works")
      .insert({
        creator_id: ada.id,
        craft: "bead-making",
        stream_id: stream.id,
        title: "Aurora strand",
        price: 300,
        edition_size: 2,
        delivery: "physical",
      })
      .select()
      .single()
  ).data;
  assert.match(await rpcErr(bea, "buy_work", { _work: w.id }), /shipping_required/);
  const a0 = await balance(ada);
  const serial = await rpc(bea, "buy_work", { _work: w.id, _shipping: "1 Bead St, Lagos" });
  assert.match(serial, /^VNC-COA-\d{6}$/);
  assert.equal(await balance(bea), 600);
  assert.equal(await balance(ada), a0 + 240);
  const cert = (await anon.from("certificates").select("*").eq("serial", serial).single()).data;
  assert.equal(cert.owner_id, bea.id);
  assert.equal(cert.edition_no, 1);
  assert.equal(cert.fingerprint.length, 64);
  // Shipping address is private to buyer and seller.
  assert.equal((await cal.c.from("orders").select("*").eq("work_id", w.id)).data.length, 0);
  assert.equal(
    (await ada.c.from("orders").select("shipping_address").eq("work_id", w.id).single()).data
      .shipping_address,
    "1 Bead St, Lagos",
  );
  // Second edition sells out the work.
  await rpc(cal, "buy_work", { _work: w.id, _shipping: "2 Clay Rd" });
  assert.equal(
    (await anon.from("works").select("status, editions_sold").eq("id", w.id).single()).data.status,
    "sold_out",
  );
  assert.match(await rpcErr(cal, "buy_work", { _work: w.id, _shipping: "x" }), /not_for_sale/);
});

test("auction holds only the top bid, refunds the outbid, pays on close", async () => {
  const w = (
    await ada.c
      .from("works")
      .insert({
        creator_id: ada.id,
        craft: "bead-making",
        stream_id: stream.id,
        title: "Collar lot",
        price: 100,
        sale_mode: "auction",
        delivery: "digital",
      })
      .select()
      .single()
  ).data;
  assert.equal(w.auction_status, "open");
  const b0 = await balance(bea),
    c0 = await balance(cal),
    a0 = await balance(ada);
  await rpc(bea, "place_bid", { _work: w.id, _amount: 100 });
  assert.equal(await balance(bea), b0 - 100);
  assert.match(await rpcErr(cal, "place_bid", { _work: w.id, _amount: 120 }), /bid_too_low:150/);
  await rpc(cal, "place_bid", { _work: w.id, _amount: 150 });
  assert.equal(await balance(bea), b0, "outbid bidder refunded");
  assert.equal(await balance(cal), c0 - 150);
  await rpc(cal, "place_bid", { _work: w.id, _amount: 200 }); // raise own bid: only the difference is held
  assert.equal(await balance(cal), c0 - 200);
  assert.match(await rpcErr(bea, "close_auction", { _work: w.id }), /not_allowed/);
  const serial = await rpc(ada, "close_auction", { _work: w.id });
  assert.match(serial, /^VNC-COA-/);
  assert.equal(await balance(ada), a0 + 160);
  assert.equal(await balance(cal), c0 - 200);
  assert.match(await rpcErr(bea, "place_bid", { _work: w.id, _amount: 500 }), /auction_not_open/);
});

test("creators cannot rewrite commercial terms after a sale", async () => {
  const w = (
    await ada.c
      .from("works")
      .insert({
        creator_id: ada.id,
        craft: "bead-making",
        title: "Locked price",
        price: 50,
        edition_size: 3,
        delivery: "digital",
      })
      .select()
      .single()
  ).data;
  await rpc(bea, "buy_work", { _work: w.id });
  await ada.c.from("works").update({ price: 1, title: "Renamed" }).eq("id", w.id);
  const after = (
    await anon.from("works").select("price, title, editions_sold").eq("id", w.id).single()
  ).data;
  assert.equal(after.price, 50);
  assert.equal(after.title, "Renamed");
  assert.equal(after.editions_sold, 1);
});

test("creation bids: decline refunds, accept pays the creator", async () => {
  const b0 = await balance(bea),
    a0 = await balance(ada);
  const id1 = await rpc(bea, "submit_commission", {
    _stream: stream.id,
    _prompt: "Red bead bracelet",
    _amount: 100,
  });
  const id2 = await rpc(bea, "submit_commission", {
    _stream: stream.id,
    _prompt: "Blue anklet",
    _amount: 50,
  });
  assert.equal(await balance(bea), b0 - 150);
  assert.match(await rpcErr(bea, "resolve_commission", { _id: id1, _accept: true }), /not_allowed/);
  await rpc(ada, "resolve_commission", { _id: id1, _accept: false });
  await rpc(ada, "resolve_commission", { _id: id2, _accept: true });
  assert.equal(await balance(bea), b0 - 50);
  assert.equal(await balance(ada), a0 + 40);
});

test("Versus: challenge, accept, one paid vote per viewer, settle by vote share", async () => {
  const id = await rpc(ada, "create_battle", {
    _opponent_handle: `dee_${run}`,
    _title: "Bead vs clay",
    _craft: "bead-making",
    _duration: 10,
  });
  assert.match(await rpcErr(bea, "vote_battle", { _id: id, _side: "a" }), /battle_not_live/);
  await rpc(dee, "respond_battle", { _id: id, _accept: true });
  const b0 = await balance(bea);
  await rpc(bea, "vote_battle", { _id: id, _side: "a" });
  assert.match(await rpcErr(bea, "vote_battle", { _id: id, _side: "b" }), /already_voted/);
  await rpc(cal, "vote_battle", { _id: id, _side: "a" });
  assert.match(
    await rpcErr(ada, "vote_battle", { _id: id, _side: "a" }),
    /contestants_cannot_vote/,
  );
  assert.equal(await balance(bea), b0 - 10);
  const a0 = await balance(ada),
    d0 = await balance(dee);
  await admin
    .from("versus_battles")
    .update({ ends_at: new Date(Date.now() - 1000).toISOString() })
    .eq("id", id);
  await rpc(bea, "settle_expired_battles", {});
  const b = (await anon.from("versus_battles").select("*").eq("id", id).single()).data;
  assert.equal(b.status, "ended");
  assert.equal(b.winner_id, ada.id);
  assert.equal(await balance(ada), a0 + 16); // pot 20, fee 4, 2/2 votes to A
  assert.equal(await balance(dee), d0);
  const lb = (await anon.from("versus_leaderboard").select("*").eq("id", ada.id).single()).data;
  assert.equal(lb.wins, 1);
});

test("galleries: entry fee split between hanging artists, pass is idempotent", async () => {
  const g = (
    await dee.c
      .from("galleries")
      .insert({ curator_id: dee.id, craft: "pottery", title: "Kiln Room", entry_fee: 20 })
      .select()
      .single()
  ).data;
  const pot = (
    await dee.c
      .from("works")
      .insert({
        creator_id: dee.id,
        craft: "pottery",
        title: "Ash cup",
        price: 80,
        delivery: "physical",
      })
      .select()
      .single()
  ).data;
  const bead = (
    await ada.c
      .from("works")
      .insert({
        creator_id: ada.id,
        craft: "bead-making",
        title: "Cuff",
        price: 90,
        delivery: "physical",
      })
      .select()
      .single()
  ).data;
  assert.ifError(
    (await dee.c.from("gallery_works").insert({ gallery_id: g.id, work_id: pot.id })).error,
  );
  assert.ifError(
    (await ada.c.from("gallery_works").insert({ gallery_id: g.id, work_id: bead.id })).error,
  );
  assert.ok(
    (await bea.c.from("gallery_works").insert({ gallery_id: g.id, work_id: bead.id })).error,
  );
  const b0 = await balance(bea),
    a0 = await balance(ada),
    d0 = await balance(dee);
  await rpc(bea, "enter_gallery", { _gallery: g.id });
  await rpc(bea, "enter_gallery", { _gallery: g.id });
  assert.equal(await balance(bea), b0 - 20);
  assert.equal(await balance(ada), a0 + 8);
  assert.equal(await balance(dee), d0 + 8);
});

test("daily claim works once per 24h", async () => {
  const b0 = await balance(cal);
  await rpc(cal, "claim_daily_cowries", {});
  assert.equal(await balance(cal), b0 + 200);
  assert.match(await rpcErr(cal, "claim_daily_cowries", {}), /already_claimed/);
});

test("XP comes from real activity", async () => {
  const [s] = await rpc(ada, "user_stats", { _user: ada.id });
  assert.ok(s.works_sold >= 3);
  assert.equal(s.versus_wins, 1);
  assert.ok(s.xp >= 3 * 50 + 100);
});

test("ledger always matches wallet balances", async () => {
  for (const u of [ada, bea, cal, dee]) {
    const { data } = await u.c.from("cowrie_ledger").select("delta");
    const sum = data.reduce((n, r) => n + Number(r.delta), 0);
    assert.equal(sum, await balance(u));
  }
});

test("stale live streams end themselves", async () => {
  await admin
    .from("streams")
    .update({ last_heartbeat_at: new Date(Date.now() - 10 * 60_000).toISOString() })
    .eq("id", stream.id);
  await rpc(bea, "end_stale_streams", {});
  assert.equal(
    (await anon.from("streams").select("status").eq("id", stream.id).single()).data.status,
    "ended",
  );
});
