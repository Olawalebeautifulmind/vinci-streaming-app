// Browser walkthrough of the core creator + viewer loop.
// Needs: local Supabase, `node tests/mock-cloudflare.mjs`, and the dev server on :3000
// configured with CLOUDFLARE_API_BASE pointing at the mock. Run: node tests/e2e.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Uses the project dependency if installed, else a globally installed Playwright.
const { chromium } = require("playwright");
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const OUT = process.env.SHOTS ?? "test-results";
fs.mkdirSync(OUT, { recursive: true });
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const run = Date.now().toString(36);
const errors = [];

const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
async function newUser(name) {
  const ctx = await browser.newContext({
    viewport: { width: 1360, height: 900 },
    permissions: ["camera", "microphone"],
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("dialog", (d) => d.accept());
  await page.goto(`${BASE}/auth?mode=signup`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Display name").fill(name);
  await page.getByPlaceholder(/email/i).fill(`${name}-${run}@test.local`);
  await page.getByPlaceholder(/password/i).fill("password123");
  await page
    .getByRole("button", { name: /create|sign up/i })
    .last()
    .click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 15000 });
  return page;
}
const step = (s) => console.log(`✓ ${s}`);

try {
  // Creator
  const maker = await newUser("Thandi");
  step("creator signed up");
  await maker.goto(`${BASE}/live/new`, { waitUntil: "networkidle" });
  await maker.getByText("Open your studio").first().waitFor();
  await maker.locator("input.font-mono").fill(`thandi_${run}`);
  await maker.getByRole("button", { name: "Open my studio" }).click();
  await maker.getByText("Broadcasting as").waitFor();
  step("creator studio opened");
  await maker.getByPlaceholder(/Lampworking/).fill("Beadweaving a Zulu-inspired collar");
  await maker.getByRole("button", { name: "Continue to studio" }).click();
  await maker.waitForURL(/\/studio\//, { timeout: 15000 });
  const streamId = maker.url().split("/studio/")[1];
  step(`Start broadcast lands on the studio (stream ${streamId})`);
  await maker.screenshot({ path: `${OUT}/01-studio-browser-mode.png` });

  await maker.getByRole("button", { name: /OBS/ }).click();
  await maker.getByText("Stream key", { exact: true }).waitFor();
  const { data: s1 } = await admin
    .from("streams")
    .select("cf_live_input_id")
    .eq("id", streamId)
    .single();
  await fetch(`http://127.0.0.1:8788/__connect?uid=${s1.cf_live_input_id}`);
  await maker.getByRole("button", { name: "Go live" }).waitFor();
  await maker.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent === "Go live" && !b.disabled,
      ),
    null,
    { timeout: 15000 },
  );
  await maker.getByRole("button", { name: "Go live" }).click();
  await maker.getByRole("button", { name: "End stream" }).waitFor({ timeout: 10000 });
  step("stream is live via streaming-app ingest");

  // Add a buy-now piece and an auction lot
  await maker.getByPlaceholder("e.g. Aurora strand").fill("Indlamu collar");
  await maker.locator("select").filter({ hasText: "Physical, I ship it" }).selectOption("digital");
  await maker.getByRole("button", { name: "Add piece" }).click();
  await maker.getByText("Piece added.").waitFor();
  await maker.getByPlaceholder("e.g. Aurora strand").fill("Sunrise cuff");
  await maker.locator("select").filter({ hasText: "Buy now" }).selectOption("auction");
  await maker.getByRole("button", { name: "Add piece" }).click();
  await maker.getByText("Piece added.").waitFor();
  step("creator listed a buy-now piece and an auction lot");
  await maker.screenshot({ path: `${OUT}/02-studio-live.png`, fullPage: true });

  // Viewer
  const fan = await newUser("Ada");
  await fan.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await fan.getByText("Beadweaving a Zulu-inspired collar").first().waitFor({ timeout: 15000 });
  await fan.screenshot({ path: `${OUT}/03-home.png`, fullPage: true });
  step("live stream shows on the home page");
  await fan.goto(`${BASE}/stream/${streamId}`, { waitUntil: "networkidle" });
  await fan.getByText("1,000").first().waitFor();
  await fan.getByPlaceholder("Say something kind…").fill("The colours are beautiful");
  await fan.getByRole("button", { name: "Send" }).click();
  await maker.getByText("The colours are beautiful").waitFor({ timeout: 10000 });
  step("chat delivered to the creator in real time");
  await fan.getByRole("button", { name: /Bouquet/ }).click();
  await fan.getByText("Gifted 🌹 Bouquet").waitFor({ timeout: 10000 });
  await fan.getByText("900").first().waitFor();
  step("gift sent, balance 1,000 → 900");

  await fan
    .locator("article", { hasText: "Indlamu collar" })
    .getByRole("button", { name: "View" })
    .click();
  await fan.getByRole("button", { name: /Buy now/ }).click();
  await fan.getByText("Certificate issued").waitFor({ timeout: 10000 });
  const serial = (
    await fan.locator(".font-mono", { hasText: "VNC-COA-" }).first().textContent()
  ).trim();
  step(`bought the piece, certificate ${serial}`);
  await fan.getByRole("button", { name: "Close" }).last().click();

  await fan.getByRole("button", { name: "Claim daily" }).click();
  await fan.getByText("600").first().waitFor({ timeout: 10000 });
  step("claimed daily Cowries, balance 400 → 600");
  await fan
    .locator("article", { hasText: "Sunrise cuff" })
    .getByRole("button", { name: "View" })
    .click();
  if (await fan.locator("textarea").count())
    await fan.locator("textarea").fill("12 Marina Rd, Lagos");
  await fan.getByRole("button", { name: "Place bid" }).click();
  await fan.getByText("You're the top bidder").waitFor({ timeout: 10000 });
  step("placed the top bid on the auction lot");
  await fan.screenshot({ path: `${OUT}/04-stream-viewer.png`, fullPage: true });
  await fan.getByRole("button", { name: "Close" }).last().click();

  await fan.getByRole("button", { name: "Creation bids" }).click();
  await fan.getByPlaceholder(/red bead bracelet/).fill("A blue anklet with brass beads");
  await fan
    .locator("form", { has: fan.getByPlaceholder(/red bead bracelet/) })
    .locator("input[type=number]")
    .fill("100");
  await fan.getByRole("button", { name: "Submit bid" }).click();
  await maker.getByRole("button", { name: "Accept" }).first().waitFor({ timeout: 10000 });
  await maker.getByRole("button", { name: "Accept" }).first().click();
  await fan.getByText("accepted", { exact: false }).first().waitFor({ timeout: 10000 });
  step("creation bid sent and accepted");

  // End stream closes the auction and issues the second certificate
  await maker.getByRole("button", { name: "End stream" }).click();
  await maker.getByText("This stream has ended.").first().waitFor({ timeout: 15000 });
  const { data: lot } = await admin
    .from("works")
    .select("auction_status, editions_sold")
    .eq("title", "Sunrise cuff")
    .eq("stream_id", streamId)
    .single();
  if (lot.auction_status !== "closed" || lot.editions_sold !== 1)
    throw new Error(`auction not settled: ${JSON.stringify(lot)}`);
  step("ending the stream closed the auction and sold the lot");

  await fan.goto(`${BASE}/certificate/${serial}`, { waitUntil: "networkidle" });
  await fan.getByText("Vinci certificate of authenticity").waitFor();
  await fan.screenshot({ path: `${OUT}/05-certificate.png`, fullPage: true });
  step("public certificate page renders");

  await fan.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await fan
    .getByText(/^VNC-\d{6}/)
    .first()
    .waitFor();
  await fan.getByRole("tab", { name: "Collection" }).click();
  await fan.getByText(serial).waitFor();
  await fan.screenshot({ path: `${OUT}/06-profile.png`, fullPage: true });
  step("profile shows real member ID and collection");

  await maker.goto(`${BASE}/creator/thandi_${run}`, { waitUntil: "networkidle" });
  await maker.getByText("Indlamu collar").first().waitFor();
  await maker.screenshot({ path: `${OUT}/07-creator.png`, fullPage: true });
  step("creator public page lists works");

  for (const path of [
    "/c/bead-making",
    "/c/pottery",
    "/versus",
    "/gallery",
    "/registry",
    "/cowrie",
    "/global",
    "/c/painting",
  ]) {
    const r = await fan.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    if (!r.ok()) throw new Error(`${path} → ${r.status()}`);
    await fan.waitForTimeout(800);
  }
  await fan.goto(`${BASE}/versus`, { waitUntil: "networkidle" });
  await fan.screenshot({ path: `${OUT}/08-versus.png`, fullPage: true });
  step("all public pages load");

  // Browser-camera mode: camera preview renders from the fake device
  await maker.goto(`${BASE}/live/new`, { waitUntil: "networkidle" });
  await maker.getByPlaceholder(/Lampworking/).fill("Torch session");
  await maker.getByRole("button", { name: "Continue to studio" }).click();
  await maker.waitForURL(/\/studio\//);
  await maker.waitForFunction(
    () => {
      const v = document.querySelector("video");
      return v && v.videoWidth > 0;
    },
    null,
    { timeout: 15000 },
  );
  await maker.screenshot({ path: `${OUT}/09-studio-camera.png` });
  step("browser camera preview works");
} catch (e) {
  console.error("✗", e.message);
  process.exitCode = 1;
} finally {
  if (errors.length) {
    console.error("Page errors:\n" + errors.join("\n"));
    process.exitCode = 1;
  }
  await browser.close();
}
