/**
 * Captures the major mobile screens (390x844) into docs/screenshots/phase-2 and a contact sheet.
 *
 *   bun run build && node qa/screenshots.mjs        # starts its own server
 *   QA_BASE_URL=http://localhost:3000 node qa/screenshots.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, launchBrowser, startServer } from "./lib.mjs";

const OUT = join(ROOT, "docs", "screenshots", "phase-2");
mkdirSync(OUT, { recursive: true });

const server = process.env.QA_BASE_URL ? { base: process.env.QA_BASE_URL, stop() {} } : await startServer(3101);
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const shots = [];

async function snap(name, label) {
  await page.waitForTimeout(800);
  const file = `${String(shots.length + 1).padStart(2, "0")}-${name}.png`;
  await page.screenshot({ path: join(OUT, file) });
  shots.push({ file, label });
  console.log("saved", file);
}

const go = async (path) => {
  await page.goto(server.base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
};

try {
  await go("/signin");
  await snap("signin", "Welcome and sign in");

  await go("/");
  await snap("home", "Home");
  await page.evaluate(() => document.getElementById("featured")?.scrollIntoView());
  await snap("home-featured", "Featured bikes");

  await go("/bikes");
  await snap("browse", "Browse");
  await page.getByRole("button", { name: /^Filters/ }).tap();
  await snap("filters", "Filters drawer");

  await go("/bikes/royal-enfield-classic-350");
  await snap("details", "Motorcycle details");
  await page.getByRole("button", { name: /Select pickup and drop dates/ }).tap();
  await page.waitForTimeout(500);
  const cells = page.getByRole("dialog").locator('[role="gridcell"] [role="button"]:not([aria-disabled="true"])');
  await cells.nth(0).tap();
  await cells.nth(2).tap();
  await snap("details-dates", "Select dates");
  await page.getByRole("dialog").getByRole("button", { name: /^Confirm/ }).tap();
  await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById("dates-title")?.scrollIntoView({ block: "start" }));
  await snap("details-summary", "Dates and price");

  await page.locator("[data-testid='sticky-cta'] button").tap();
  await page.waitForURL("**/book**");
  await page.getByText("Helmet · $2 / day").tap();
  await snap("book-1-dates", "Booking: dates");
  const next = () => page.locator("[data-testid='flow-footer']:visible button");
  await next().tap();
  await snap("book-2-rider", "Booking: rider");
  await next().tap();
  await snap("book-3-licence", "Booking: licence");
  await next().tap();
  await page.getByText(/accept the rental terms/).tap();
  await snap("book-4-review", "Booking: review");
  await next().tap();
  await snap("book-5-payment", "Booking: payment");
  await next().tap();
  await page.waitForURL("**/confirmation", { timeout: 8000 });
  await snap("confirmation", "Confirmation");

  await go("/bookings");
  await snap("bookings", "My bookings");
  await go("/bookings/RG820461");
  await snap("booking-details", "Booking details");
  await go("/profile");
  await snap("profile", "Profile");

  // Contact sheet: one image with every screen, in the spirit of the design reference.
  const cards = shots
    .map((s) => `<figure><img src="${s.file}"><figcaption>${s.label}</figcaption></figure>`)
    .join("");
  writeFileSync(
    join(OUT, "_sheet.html"),
    `<!doctype html><meta charset="utf-8"><style>
      body{margin:0;padding:32px;background:#f7f8fa;font-family:system-ui,sans-serif;width:2050px}
      .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:24px}
      figure{margin:0;display:flex;flex-direction:column;gap:8px}
      img{width:100%;border-radius:28px;border:6px solid #111;display:block;box-sizing:border-box}
      figcaption{font-size:15px;font-weight:700;text-align:center}
    </style><div class="grid">${cards}</div>`,
  );
  const sheet = await browser.newPage({ viewport: { width: 2114, height: 1000 } });
  await sheet.goto("file:///" + join(OUT, "_sheet.html").replace(/\\/g, "/"));
  await sheet.waitForTimeout(500);
  await sheet.screenshot({ path: join(OUT, "phase-2-mobile.png"), fullPage: true });
  console.log("saved phase-2-mobile.png");
} finally {
  await browser.close();
  server.stop();
}
