import { WIDTHS, overflowReport, scrollThrough, trackLayoutShift, watch } from "../lib.mjs";

// Mirrors src/features/bookings/pricing.ts so the UI is checked against independent arithmetic.
const GST = 0.18;
const FEE = 49;
const expectedPayable = ({ price, deposit, days, helmet = false, jacket = false }) => {
  const rental = price * days;
  const extras = (helmet ? 100 * days : 0) + (jacket ? 150 * days : 0);
  return rental + extras + Math.round((rental + extras) * GST) + FEE + deposit;
};
const CLASSIC = { id: "royal-enfield-classic-350", price: 1200, deposit: 3000 };
const digits = (text) => Number(String(text).replace(/[^\d]/g, ""));

const PAGES = [
  "/",
  "/bikes",
  `/bikes/${CLASSIC.id}`,
  `/bikes/${CLASSIC.id}/book`,
  "/bookings",
  "/bookings/RG820461",
  "/bookings/RG820461/confirmation",
  "/profile",
  "/signin",
];

/** Picks two enabled calendar cells in `scope` and returns the day count between them. */
/** Aria labels of the enabled cells, read before anything is selected. */
const cellLabels = (scope) =>
  scope.locator('[role="gridcell"] [role="button"]:not([aria-disabled="true"])').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));

async function pickRange(scope, from, to, tap = false, labels) {
  const cells = scope.locator('[role="gridcell"] [role="button"]:not([aria-disabled="true"])');
  const first = cells.nth(from);
  const last = cells.nth(to);
  const parse = (label) => new Date(label.match(/([A-Z][a-z]+ [0-9]{1,2}, [0-9]{4})/)[1] + " 12:00 UTC");
  const known = labels ?? (await cellLabels(scope));
  const days = Math.round((parse(known[to]) - parse(known[from])) / 864e5);
  await (tap ? first.tap() : first.click());
  await (tap ? last.tap() : last.click());
  return Math.max(1, days);
}

/** Space between the lowest piece of content and the highest fixed bar (nav or CTA). Negative = overlap. */
const coverGap = (page) =>
  page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    const main = document.getElementById("main");
    let lowest = 0;
    for (const el of main.querySelectorAll("*")) {
      if (el.children.length) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;
      let p = el;
      let fixed = false;
      while (p && p !== main) {
        if (getComputedStyle(p).position === "fixed" || p.getAttribute("aria-hidden") === "true") fixed = true;
        p = p.parentElement;
      }
      if (!fixed) lowest = Math.max(lowest, r.bottom);
    }
    const bars = [...document.querySelectorAll("nav[aria-label='Primary'], [data-testid='sticky-cta'], [data-testid='flow-footer']")]
      .filter((b) => getComputedStyle(b).position === "fixed" && b.getBoundingClientRect().height > 0)
      .map((b) => b.getBoundingClientRect().top);
    return { gap: bars.length ? Math.min(...bars) - lowest : Infinity, bars: bars.length };
  });

const settle = async (page, ms = 700) => {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(ms);
};

export default async function run({ browser, base: BASE, t }) {
  const { check, section } = t;
  const shot = async (page, name) => page.screenshot({ path: new URL(`../screenshots/${name}.png`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") });
  void shot;

  // ---------------------------------------------------------------- 1. every page, every width
  section("1. responsive: overflow, layout shift, console, hydration");
  for (const path of PAGES) {
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
      const page = await ctx.newPage();
      const logs = watch(page);
      await trackLayoutShift(page);
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await scrollThrough(page);
      const m = await overflowReport(page);
      const ok = m.scrollWidth <= m.innerWidth && m.offenders.length === 0;
      check(`${path} @${w} no horizontal overflow`, ok, ok ? "" : JSON.stringify(m));
      check(`${path} @${w} layout shift ${m.cls.toFixed(3)} (<= 0.1)`, m.cls <= 0.1);
      check(`${path} @${w} no console errors, warnings or hydration issues`, logs.length === 0, logs.join(" | "));
      await ctx.close();
    }
  }

  // ---------------------------------------------------------------- 2. bottom nav and sticky bars never cover content
  section("2. bottom nav and sticky CTA clearance");
  for (const w of [360, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    for (const path of ["/", "/bikes", `/bikes/${CLASSIC.id}`, "/bookings", "/bookings/RG820461", "/profile"]) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const { gap, bars } = await coverGap(page);
      check(`${path} @${w} content clears fixed bars (${bars} bar(s), gap ${Math.round(gap)}px)`, bars > 0 && gap >= 0);
    }

    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    const geo = await page.evaluate(() => {
      const nav = [...document.querySelectorAll("nav[aria-label='Primary']")].find((n) => getComputedStyle(n).position === "fixed").getBoundingClientRect();
      const cta = document.querySelector("[data-testid='sticky-cta']").getBoundingClientRect();
      return { navTop: nav.top, ctaBottom: cta.bottom, ctaTop: cta.top };
    });
    check(`details @${w} sticky CTA sits directly on the bottom nav`, Math.abs(geo.ctaBottom - geo.navTop) <= 1 && geo.ctaTop < geo.navTop, JSON.stringify(geo));

    // Simulate a 24px home-indicator inset: nav grows, CTA must follow it.
    await page.addStyleTag({ content: ":root{--safe-bottom:24px !important}" });
    await page.waitForTimeout(100);
    const withInset = await page.evaluate(() => {
      const nav = [...document.querySelectorAll("nav[aria-label='Primary']")].find((n) => getComputedStyle(n).position === "fixed").getBoundingClientRect();
      const cta = document.querySelector("[data-testid='sticky-cta']").getBoundingClientRect();
      return { navHeight: nav.height, navTop: nav.top, ctaBottom: cta.bottom };
    });
    check(`details @${w} safe-area inset lifts the nav and the CTA with it`, withInset.navHeight >= 64 + 24 - 1 && Math.abs(withInset.ctaBottom - withInset.navTop) <= 1, JSON.stringify(withInset));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    const geo = await page.evaluate(() => {
      const cta = document.querySelector("[data-testid='sticky-cta']").getBoundingClientRect();
      const navs = [...document.querySelectorAll("nav[aria-label='Primary']")].filter((n) => getComputedStyle(n).position === "fixed" && n.getBoundingClientRect().height > 0);
      return { ctaBottom: cta.bottom, vh: window.innerHeight, fixedNavs: navs.length };
    });
    check("details @768 no bottom nav; CTA sits on the viewport edge", geo.fixedNavs === 0 && Math.abs(geo.ctaBottom - geo.vh) <= 1, JSON.stringify(geo));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 3. browse: filters, sort, search, tabs
  section("3. browse");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);

    await page.goto(BASE + "/bikes", { waitUntil: "domcontentloaded" });
    const skeleton = await page.getByRole("status", { name: "Loading bikes" }).first().isVisible().catch(() => false);
    check("loading skeleton is shown first", skeleton);
    const skelH = await page.evaluate(() => document.querySelector('[data-testid="card-skeleton"]')?.getBoundingClientRect().height ?? 0);
    await settle(page);
    check("skeleton disappears once loaded", (await page.getByRole("status", { name: "Loading bikes" }).count()) === 0);
    const cardH = await page.locator("main article").first().evaluate((el) => el.getBoundingClientRect().height);
    check("skeleton card height matches a real card (no shift)", skelH > 0 && Math.abs(skelH - cardH) <= 2, `${skelH} vs ${cardH}`);

    check("shows all 10 bikes", (await page.locator("main article").count()) === 10);
    await page.getByRole("button", { name: /^Filters/ }).tap();
    await page.waitForTimeout(600);
    const sheet = page.getByRole("dialog");
    check("filter drawer opens as a bottom sheet", (await sheet.boundingBox()).y + (await sheet.boundingBox()).height >= 843);
    await sheet.getByRole("button", { name: "Yamaha" }).tap();
    await page.waitForTimeout(200);
    check("drawer shows a live result count", (await sheet.getByRole("button", { name: /Show 1 bike/ }).count()) === 1);
    await sheet.getByRole("button", { name: /Show 1 bike/ }).tap();
    await page.waitForTimeout(700);
    check("drawer closes after applying", (await page.getByRole("dialog").count()) === 0);
    check("filtered to one bike", (await page.locator("main article").count()) === 1);
    check("filter button shows the active count", (await page.getByRole("button", { name: "Filters, 1 active" }).count()) === 1);

    await page.getByRole("button", { name: /^Filters/ }).tap();
    await page.waitForTimeout(500);
    await page.getByRole("dialog").getByRole("button", { name: "Reset" }).tap();
    await page.getByRole("dialog").getByRole("button", { name: /Show 10 bikes/ }).tap();
    await page.waitForTimeout(700);
    check("reset restores every bike", (await page.locator("main article").count()) === 10);

    await page.getByRole("button", { name: /^Sort/ }).tap();
    await page.waitForTimeout(500);
    await page.getByRole("dialog").getByText("Price: low to high").tap();
    await page.waitForTimeout(700);
    const prices = await page.locator("main article").evaluateAll((els) => els.map((el) => Number(el.textContent.match(/₹([\d,]+)/)[1].replace(/,/g, ""))));
    check("sort: low to high orders cards by price", prices.every((p, i) => i === 0 || prices[i - 1] <= p), prices.join(","));
    check("sort sheet closes on choice", (await page.getByRole("dialog").count()) === 0);

    await page.getByRole("searchbox").fill("zzzz");
    await page.waitForTimeout(500);
    check("empty state when nothing matches", (await page.getByText("No bikes match").count()) === 1);
    await page.getByRole("button", { name: "Reset filters" }).tap();
    await page.waitForTimeout(700);
    check("empty state reset brings bikes back", (await page.locator("main article").count()) === 10);
    check("browse: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/bikes", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    check("desktop: filters are a sidebar, not a drawer", (await page.getByRole("complementary", { name: "Filters" }).isVisible()) && !(await page.getByRole("button", { name: /^Filters/ }).first().isVisible()));
    const tablist = page.getByRole("tablist", { name: "Bike category" });
    await tablist.getByRole("tab", { name: "All" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    check("category tabs: ArrowRight selects the next tab", (await tablist.getByRole("tab", { name: "Cruiser" }).getAttribute("aria-selected")) === "true");
    check("category tabs filter the grid (3 cruisers)", (await page.locator("main article").count()) === 3);
    await tablist.getByRole("tab", { name: "Sports" }).click();
    await page.waitForTimeout(500);
    check("category tabs: click selects", (await page.locator("main article").count()) === 3);
    await page.getByRole("complementary", { name: "Filters" }).getByRole("button", { name: "Yamaha" }).click();
    await page.waitForTimeout(500);
    check("desktop sidebar filters apply immediately", (await page.locator("main article").count()) === 1);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 4. home: category selector and touch carousel
  section("4. home");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    // Layout follows the reference: header, city row, banner, search, categories, popular bikes.
    const order = await page.evaluate(() => {
      const top = (el) => el?.getBoundingClientRect().top ?? Infinity;
      const q = (sel) => document.querySelector(sel);
      return {
        header: top(q("header")),
        city: top([...document.querySelectorAll("button")].find((b) => /Pickup city/.test(b.getAttribute("aria-label") || "") && b.getBoundingClientRect().width > 0)),
        banner: top(q("section[aria-label='Welcome']")),
        search: top(q("[role='search'], input[type='search']")),
        categories: top(q("[role='group'][aria-label='Bike category']")),
        popular: top(q("#popular")),
      };
    });
    const sequence = ["header", "city", "banner", "search", "categories", "popular"].map((k) => order[k]);
    check("home order: header, city, banner, search, categories, popular", sequence.every((v, i) => i === 0 || v > sequence[i - 1]), JSON.stringify(order));
    check("mobile header holds only the logo and notifications", (await page.evaluate(() => {
      const header = document.querySelector("header");
      const visibleButtons = [...header.querySelectorAll("button, a")].filter((el) => el.getBoundingClientRect().width > 0);
      return visibleButtons.length;
    })) <= 3);
    check("city row reads Jaipur, Rajasthan", (await page.getByRole("button", { name: /Pickup city: Jaipur, Rajasthan/ }).locator("visible=true").count()) === 1);
    check("banner shows FREEDOM STARTS HERE", (await page.getByText("FREEDOM").first().isVisible()) && (await page.getByText("STARTS HERE").first().isVisible()));

    const circles = page.getByRole("group", { name: "Bike category" }).getByRole("button");
    check("four round category buttons", (await circles.count()) === 4);
    const spread = await circles.evaluateAll((els) => {
      const rects = els.map((e) => e.getBoundingClientRect());
      const left = rects[0].left;
      const right = rects[rects.length - 1].right;
      return { span: right - left, vw: window.innerWidth, gaps: rects.slice(1).map((r, i) => Math.round(r.left - rects[i].right)) };
    });
    check("category buttons spread across the row (not bunched)", spread.span >= spread.vw * 0.8, JSON.stringify(spread));

    await circles.filter({ hasText: "Adventure" }).tap();
    await page.waitForTimeout(600);
    check("category button reports pressed", (await circles.filter({ hasText: "Adventure" }).getAttribute("aria-pressed")) === "true");
    const names = await page.locator("section[aria-labelledby='popular'] article h3").allInnerTexts();
    check("category filters the popular bikes", names.length === 2 && names.every((n) => /Himalayan|Xpulse/.test(n)), names.join(", "));
    const indicator = await circles.filter({ hasText: "Adventure" }).evaluate((b) => !!b.querySelector("span[aria-hidden]"));
    check("category selection uses the animated indicator", indicator);
    await circles.filter({ hasText: "Adventure" }).tap();
    await page.waitForTimeout(600);
    check("pressing the selected category again shows all bikes", (await page.locator("section[aria-labelledby='popular'] article").count()) === 8);

    const row = page.locator("section[aria-labelledby='popular'] > div").nth(1);
    const scroller = await row.evaluate((el) => ({ scrollable: el.scrollWidth > el.clientWidth, overflowX: getComputedStyle(el).overflowX }));
    check("popular bikes scroll sideways on phones", scroller.scrollable && scroller.overflowX === "auto", JSON.stringify(scroller));
    const visibleCards = await page.locator("section[aria-labelledby='popular'] article").evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().left >= 0 && e.getBoundingClientRect().right <= window.innerWidth).length);
    check("two popular bikes fully visible, the next peeking in", visibleCards === 2, String(visibleCards));
    check("View All link with chevron", (await page.getByRole("link", { name: "View All" }).first().isVisible()));
    check("card shows amber price and rating with review count", (await page.locator("section[aria-labelledby='popular'] article").first().innerText()).match(/₹[\d,]+[\s\S]*\(\d+\)/) !== null);

    const carousel = page.getByRole("region", { name: "Featured bikes" });
    await carousel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const rail = await page.evaluate(() => {
      const root = document.querySelector("[aria-label='Featured bikes']");
      const r = root.getBoundingClientRect();
      const cards = [...root.querySelectorAll("article")];
      const popularFirst = document.querySelector("section[aria-labelledby='popular'] article");
      return {
        left: Math.round(r.left),
        right: Math.round(r.right),
        vw: window.innerWidth,
        firstLeft: Math.round(cards[0].getBoundingClientRect().left),
        popularLeft: Math.round(popularFirst.getBoundingClientRect().left),
        peeks: cards.some((c) => c.getBoundingClientRect().left < window.innerWidth && c.getBoundingClientRect().right > window.innerWidth),
        background: getComputedStyle(cards[0]).backgroundColor,
        textColor: getComputedStyle(cards[0].querySelector("h3")).color,
      };
    });
    check("featured rail runs edge to edge, like the popular row", rail.left === 0 && rail.right === rail.vw, JSON.stringify(rail));
    check("first featured card is inset exactly like the first popular card", rail.firstLeft === rail.popularLeft && rail.firstLeft >= 15 && rail.firstLeft <= 17, JSON.stringify(rail));
    check("next featured card trails off the right edge", rail.peeks, JSON.stringify(rail));
    check("featured cards are light with dark text", rail.background === "rgb(255, 255, 255)" && rail.textColor !== "rgb(255, 255, 255)", `${rail.background} / ${rail.textColor}`);
    const activeDot = () => carousel.evaluate((root) => [...root.querySelectorAll('div[aria-hidden="true"].h-6 span')].findIndex((d) => d.className.includes("w-5")));
    const before = await activeDot();
    const box = await carousel.boundingBox();
    const cdp = await ctx.newCDPSession(page);
    const y = box.y + 140;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + 330, y }] });
    for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + 330 - i * 28, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(800);
    const after = await activeDot();
    check("featured carousel advances by touch swipe", before === 0 && after > 0, `${before} -> ${after}`);
    check("home: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const grid = await page.locator("section[aria-labelledby='popular'] > div").nth(1).evaluate((el) => ({ display: getComputedStyle(el).display, cols: getComputedStyle(el).gridTemplateColumns.split(" ").length }));
    check("desktop: popular bikes become a 4-column grid", grid.display === "grid" && grid.cols === 4, JSON.stringify(grid));
    check("desktop: city picker moves into the header", await page.locator("header").getByRole("button", { name: /Pickup city/ }).isVisible());
    await ctx.close();
  }

  // ---------------------------------------------------------------- 5. details: dates and pricing (mobile and desktop)
  section("5. details: dates and price recalculation");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    check("details: name, price and Book CTA above the fold", await page.evaluate(() => {
      const h1 = document.querySelector("h1").getBoundingClientRect();
      const cta = document.querySelector("[data-testid='sticky-cta']").getBoundingClientRect();
      return h1.bottom < window.innerHeight && cta.top < window.innerHeight;
    }));
    check("CTA asks for dates first", (await page.locator("[data-testid='sticky-cta'] button").innerText()) === "Select dates");

    await page.getByRole("button", { name: /Select pickup and drop dates/ }).tap();
    await page.waitForTimeout(600);
    const sheet = page.getByRole("dialog");
    const days = await pickRange(sheet, 0, 2, true);
    await page.waitForTimeout(300);
    check(`mobile date range gives ${days} days in the confirm button`, (await sheet.getByRole("button", { name: /^Confirm/ }).innerText()).includes(`${days} day`));
    await sheet.getByRole("button", { name: /^Confirm/ }).tap();
    await page.waitForTimeout(600);
    const total = digits(await page.locator("[data-testid='summary-total']:visible").first().innerText());
    check(`mobile total recalculates (${days} days)`, total === expectedPayable({ price: CLASSIC.price, deposit: CLASSIC.deposit, days }), `${total}`);
    check("CTA switches to Book now once dates are set", (await page.locator("[data-testid='sticky-cta'] button").innerText()) === "Book now");
    check("security deposit is itemised and labelled refundable", (await page.getByText("Refundable").first().isVisible()) && (await page.getByText("Security deposit").first().isVisible()));

    await page.locator("[data-testid='sticky-cta'] button").tap();
    await page.waitForURL(`**/bikes/${CLASSIC.id}/book**`);
    await page.waitForTimeout(500);
    check("Book now opens the booking flow with the chosen dates", (await page.getByText("Step 1 of 5").count()) === 1 && /start=/.test(page.url()));
    check("booking flow hides the bottom nav", (await page.evaluate(() => [...document.querySelectorAll("nav[aria-label='Primary']")].filter((n) => getComputedStyle(n).position === "fixed").length)) === 0);
    const footer = await page.evaluate(() => {
      const bar = [...document.querySelectorAll("[data-testid='flow-footer']")].find((b) => b.getBoundingClientRect().height > 0);
      const r = bar.getBoundingClientRect();
      return { bottom: r.bottom, vh: window.innerHeight };
    });
    check("flow footer sits on the safe-area edge", Math.abs(footer.bottom - footer.vh) <= 1, JSON.stringify(footer));
    check("details flow: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const panel = page.getByRole("complementary", { name: "Book this bike" });
    check("desktop: booking panel is visible and sticky", (await panel.isVisible()) && (await panel.locator("> div").evaluate((el) => getComputedStyle(el).position)) === "sticky");
    check("desktop: mobile sticky bar is hidden", (await page.locator("[data-testid='sticky-cta']").isVisible()) === false);
    check("desktop: Book now disabled until dates are chosen", await panel.getByRole("button", { name: "Book now" }).isDisabled());
    const labels = await cellLabels(panel);
    const d1 = await pickRange(panel, 0, 2, false, labels);
    await page.waitForTimeout(300);
    const t1 = digits(await panel.locator("[data-testid='summary-total']").innerText());
    check(`desktop total for ${d1} days`, t1 === expectedPayable({ price: CLASSIC.price, deposit: CLASSIC.deposit, days: d1 }), `${t1}`);
    const d2 = await pickRange(panel, 0, 4, false, labels);
    await page.waitForTimeout(300);
    const t2 = digits(await panel.locator("[data-testid='summary-total']").innerText());
    check(`desktop total recalculates for ${d2} days`, t2 === expectedPayable({ price: CLASSIC.price, deposit: CLASSIC.deposit, days: d2 }) && t2 !== t1, `${t2}`);
    check("booked dates can't be picked (28-29 Oct)", (await panel.locator('[role="gridcell"] [aria-label*="October 28"]').getAttribute("aria-disabled")) === "true");
    await ctx.close();
  }

  // ---------------------------------------------------------------- 6. booking flow end to end
  section("6. booking flow, confirmation, bookings and details");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: /Select pickup and drop dates/ }).tap();
    await page.waitForTimeout(500);
    const days = await pickRange(page.getByRole("dialog"), 0, 2, true);
    await page.getByRole("dialog").getByRole("button", { name: /^Confirm/ }).tap();
    await page.waitForTimeout(500);
    await page.locator("[data-testid='sticky-cta'] button").tap();
    await page.waitForURL("**/book**");
    await page.waitForTimeout(600);

    const next = () => page.locator("[data-testid='flow-footer']:visible button");
    // Step 1: add-ons change the footer total.
    const base1 = digits(await page.locator("[data-testid='flow-footer']:visible .tabular").first().innerText());
    check("flow total starts at the details total", base1 === expectedPayable({ price: CLASSIC.price, deposit: CLASSIC.deposit, days }), `${base1}`);
    await page.getByText("Helmet · ₹100 / day").tap();
    await page.waitForTimeout(300);
    const withHelmet = digits(await page.locator("[data-testid='flow-footer']:visible .tabular").first().innerText());
    check("adding a helmet recalculates the total", withHelmet === expectedPayable({ price: CLASSIC.price, deposit: CLASSIC.deposit, days, helmet: true }), `${withHelmet}`);
    await next().tap();
    await page.waitForTimeout(700);

    // Step 2: rider details validate. (A single tap must advance exactly one step.)
    check("step 2 is rider details", (await page.getByText("Step 2 of 5").count()) === 1);
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByLabel("Mobile number").blur();
    await page.waitForTimeout(200);
    check("invalid phone shows an inline error", (await page.getByText("Enter a 10-digit mobile number.").count()) === 1);
    await next().tap();
    await page.waitForTimeout(400);
    check("invalid step does not advance", (await page.getByText("Step 2 of 5").count()) === 1);
    await page.getByLabel("Mobile number").fill("9876543210");
    await next().tap();
    await page.waitForTimeout(500);

    // Step 3: licence placeholder.
    check("step 3 is licence", (await page.getByText("Step 3 of 5").count()) === 1);
    check("licence photo upload is a placeholder", (await page.getByText("Upload is coming soon").count()) === 1);
    await next().tap();
    await page.waitForTimeout(500);

    // Step 4: review. Total here must match the maths, and Continue needs the terms.
    check("step 4 is review", (await page.getByText("Step 4 of 5").count()) === 1);
    const reviewTotal = digits(await page.locator("[data-testid='summary-total']:visible").first().innerText());
    check("review total matches the itemised maths", reviewTotal === expectedPayable({ price: CLASSIC.price, deposit: CLASSIC.deposit, days, helmet: true }), `${reviewTotal}`);
    check("continue is disabled until terms are accepted", await next().isDisabled());
    await page.getByText(/accept the rental terms/).tap();
    await page.waitForTimeout(200);
    await next().tap();
    await page.waitForTimeout(500);

    // Step 5: payment placeholder, then confirmation.
    check("step 5 is payment (simulated)", (await page.getByText("Step 5 of 5").count()) === 1 && (await page.getByText(/Payments are simulated/).count()) === 1);
    await next().tap();
    await page.waitForURL("**/confirmation", { timeout: 8000 });
    await page.waitForTimeout(600);
    const ref = (await page.getByTestId("booking-ref").innerText()).trim();
    check("confirmation shows a booking reference", /^RG\d+$/.test(ref), ref);
    check("confirmation shows success, pickup and amount", (await page.getByRole("heading", { name: "Booking confirmed" }).isVisible()) && (await page.getByText("Bring your original driving licence.").count()) === 1 && digits(await page.locator("[data-testid='summary-total']:visible").first().innerText()) === reviewTotal);
    check("confirmation offers View booking and Back home", (await page.getByRole("link", { name: "View booking" }).count()) === 1 && (await page.getByRole("link", { name: "Back home" }).count()) === 1);

    await page.getByRole("link", { name: "View booking" }).tap();
    await page.waitForURL(`**/bookings/${ref}`);
    await page.waitForTimeout(600);
    check("booking details shows the new booking as Upcoming", (await page.getByText("Upcoming").first().isVisible()) && (await page.getByText(ref).first().isVisible()));
    check("booking details shows deposit, timeline and rider", (await page.getByText("Security deposit").first().isVisible()) && (await page.getByRole("list", { name: "Booking progress" }).isVisible()) && (await page.getByText("Rahul Sharma").first().isVisible()));

    // My bookings: the new booking is in Upcoming, then cancel it.
    await page.goto(BASE + "/bookings", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    check("My bookings lists the new booking under Upcoming", (await page.getByText(ref).count()) === 1);
    await page.goto(BASE + `/bookings/${ref}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Cancel booking" }).tap();
    await page.waitForTimeout(500);
    await page.getByRole("dialog").getByRole("button", { name: "Cancel booking" }).tap();
    await page.waitForTimeout(600);
    check("cancelling updates the status", (await page.getByText("Cancelled").first().isVisible()) && (await page.getByRole("button", { name: "Cancel booking" }).count()) === 0);
    check("booking flow end to end: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/bookings", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const tablist = page.getByRole("tablist", { name: "Booking status" });
    check("tabs: Upcoming selected by default", (await tablist.getByRole("tab", { name: "Upcoming" }).getAttribute("aria-selected")) === "true");
    await tablist.getByRole("tab", { name: "Completed" }).click();
    await page.waitForTimeout(500);
    check("tabs (mouse): Completed shows 2 bookings", (await page.locator("main article").count()) === 2);
    await tablist.getByRole("tab", { name: "Active" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    check("tabs (keyboard): ArrowRight moves to Completed", (await tablist.getByRole("tab", { name: "Completed" }).getAttribute("aria-selected")) === "true");
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    check("tabs (keyboard): Cancelled shows 1 booking", (await tablist.getByRole("tab", { name: "Cancelled" }).getAttribute("aria-selected")) === "true" && (await page.locator("main article").count()) === 1);
    await tablist.getByRole("tab", { name: "Active" }).click();
    await page.waitForTimeout(500);
    check("active booking offers Extend rental", (await page.getByRole("button", { name: "Extend rental" }).count()) === 1);
    await tablist.getByRole("tab", { name: "Completed" }).click();
    await page.waitForTimeout(500);
    check("completed bookings offer Book again", (await page.getByRole("link", { name: "Book again" }).count()) === 2);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 7. profile, favourites, persistence
  section("7. profile and persistence");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    check("profile shows verified state and licence", (await page.getByText("Verified rider").isVisible()) && (await page.getByText(/RJ14/).first().isVisible()));
    await page.getByRole("button", { name: "Edit details" }).tap();
    await page.waitForTimeout(500);
    await page.getByLabel("Full name").fill("Rahul S. Sharma");
    await page.getByRole("button", { name: "Save" }).tap();
    await page.waitForTimeout(500);
    check("editing details updates the profile", (await page.getByText("Rahul S. Sharma").first().isVisible()));
    await page.getByText("Offers and news").tap();
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    check("profile changes persist after reload", (await page.getByText("Rahul S. Sharma").first().isVisible()) && (await page.getByRole("switch", { name: "Offers and news" }).isChecked()));

    await page.getByRole("button", { name: "Log out" }).tap();
    await page.waitForTimeout(500);
    check("logout asks for confirmation", await page.getByRole("dialog").isVisible());
    await page.keyboard.press("Escape");

    await page.goto(BASE + "/bikes", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const heart = page.getByRole("button", { name: /^Save Royal Enfield Classic 350/ });
    await heart.tap();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    check("saved bike persists after reload", (await page.getByRole("button", { name: /^Remove Royal Enfield Classic 350 from saved/ }).count()) === 1);
    check("profile: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 8. navigation: layout shift across client transitions
  section("8. page transitions");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);
    await trackLayoutShift(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const nav = page.locator('nav[aria-label="Primary"]');
    for (const name of ["Bikes", "Bookings", "Profile", "Home"]) {
      await nav.getByRole("link", { name }).tap();
      await page.waitForTimeout(900);
    }
    await nav.getByRole("link", { name: "Bikes" }).tap();
    await page.waitForTimeout(900);
    await page.locator("main article h3").first().tap();
    await page.waitForURL("**/bikes/**");
    await page.waitForTimeout(900);
    const cls = await page.evaluate(() => window.__cls);
    check(`client navigation adds no layout shift (${cls.toFixed(3)} <= 0.1)`, cls <= 0.1);
    check("transitions: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 9. reduced motion
  section("9. reduced motion");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector(".rgo-page-in")).animationDuration);
    check("page transition collapses under reduced motion", /^(0s|1e-05s|0\.00001s)$/.test(anim), anim);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(250);
    const visible = await page.evaluate(() => {
      const els = [...document.querySelectorAll("#main [style*='opacity']")];
      return els.filter((el) => el.getBoundingClientRect().top < window.innerHeight).every((el) => Number(getComputedStyle(el).opacity) === 1);
    });
    check("reveals and grids are visible immediately", visible);
    const sports = page.getByRole("group", { name: "Bike category" }).getByRole("button", { name: "Sports" });
    await sports.tap();
    await page.waitForTimeout(120);
    check("category selection still works", (await sports.getAttribute("aria-pressed")) === "true");
    check("reduced motion: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 10. sign in
  section("10. sign in");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/signin", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    check("welcome screen fits the viewport without scrolling", await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1));
    check(
      "headline, Get Started and Sign In are visible",
      (await page.getByRole("heading", { level: 1 }).first().isVisible()) &&
        (await page.getByRole("button", { name: "Get Started" }).isVisible()) &&
        (await page.getByRole("button", { name: "Sign In" }).isVisible()),
    );
    check("four slide dots", (await page.getByRole("group", { name: "Choose a slide" }).getByRole("button").count()) === 4);
    await page.getByRole("button", { name: "Show slide 3" }).tap();
    await page.waitForTimeout(600);
    check("dots change the slide", await page.getByText("MINUTES").first().isVisible());

    await page.getByRole("button", { name: "Sign In" }).tap();
    await page.waitForTimeout(600);
    const dlg = page.getByRole("dialog");
    const box = await dlg.boundingBox();
    check("Sign In opens a bottom sheet", (await dlg.isVisible()) && Math.abs(box.y + box.height - 844) < 2, JSON.stringify(box));
    await dlg.getByLabel("Mobile number").fill("12345");
    await dlg.getByRole("button", { name: "Send code" }).tap();
    await page.waitForTimeout(400);
    check("invalid number is rejected", (await dlg.getByText("Enter a 10-digit mobile number.").count()) === 1);
    await dlg.getByLabel("Mobile number").fill("9876543210");
    await dlg.getByRole("button", { name: "Send code" }).tap();
    await page.waitForTimeout(500);
    check("code step appears", (await dlg.getByText("Verification code").count()) >= 1);
    await dlg.locator("input").first().fill("111111");
    await page.waitForTimeout(400);
    check("wrong code shows an error", (await dlg.getByText("That code is not right. Try again.").count()) === 1);
    await dlg.locator("input").first().fill("123456");
    await page.waitForURL(BASE + "/", { timeout: 8000 });
    await page.waitForTimeout(600);
    check("correct code signs in and opens Home", (await page.getByText("Popular Bikes").count()) === 1);
    check("sign in: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/signin", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Get Started" }).click();
    await page.waitForTimeout(500);
    const dlg = page.getByRole("dialog");
    const box = await dlg.boundingBox();
    check("desktop: Get Started opens a centred dialog with name and phone", (await dlg.getByLabel("Full name").isVisible()) && box.y > 40 && box.width < 600, JSON.stringify(box));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 11. images and placeholders
  section("11. images");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const bad = await page.evaluate(() => {
      const issues = [];
      for (const svg of document.querySelectorAll("svg[viewBox='0 0 400 300']")) if (svg.getAttribute("preserveAspectRatio") !== "xMidYMid meet") issues.push("svg not meet");
      for (const img of document.querySelectorAll("img")) {
        const r = img.getBoundingClientRect();
        const fit = getComputedStyle(img).objectFit;
        if (r.width && img.naturalWidth && Math.abs(r.width / r.height - img.naturalWidth / img.naturalHeight) > 0.05 && fit === "fill") issues.push("img stretched");
      }
      return issues;
    });
    check("no stretched images or artwork", bad.length === 0, bad.join(","));
    await ctx.close();
  }
}
