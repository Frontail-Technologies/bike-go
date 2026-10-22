import { WIDTHS, overflowReport, scrollThrough, trackLayoutShift, watch } from "../lib.mjs";

// Mirrors src/features/bookings/pricing.ts so the UI is checked against independent arithmetic.
const TAX = 0.18;
const FEE = 1;
const expectedPayable = ({ price, deposit, days, helmet = false, jacket = false }) => {
  const rental = price * days;
  const extras = (helmet ? 2 * days : 0) + (jacket ? 2 * days : 0);
  return Math.round((rental + extras + (rental + extras) * TAX + FEE + deposit) * 100) / 100;
};
const CLASSIC = { id: "royal-enfield-classic-350", price: 15, deposit: 36 };
const digits = (text) => Number(String(text).replace(/[^\d.]/g, ""));

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
  "/help",
  "/help/faq",
  "/help/report",
  "/legal",
  "/legal/terms",
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
    const bars = [...document.querySelectorAll("nav[aria-label='Primary'], [data-testid='sticky-cta'], [data-testid='flow-footer'], [data-testid='screen-footer']")]
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

  // ---------------------------------------------------------------- 2. native chrome rules and pinned bars
  section("2. native chrome: tab vs stack screens, pinned bars, safe area");
  const TAB_ROUTES = ["/", "/bikes", "/bookings", "/profile"];
  const STACK_ROUTES = [`/bikes/${CLASSIC.id}`, `/bikes/${CLASSIC.id}/book`, "/bikes/filters", "/bookings/RG820461", "/bookings/RG820461/confirmation", "/help", "/help/faq", "/help/report", "/legal", "/legal/terms"];
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, hasTouch: w < 768, isMobile: w < 768 });
    const page = await ctx.newPage();
    for (const path of [...TAB_ROUTES, ...STACK_ROUTES]) {
      const isStack = STACK_ROUTES.includes(path);
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      if (path === "/bikes/filters" && w >= 1024) {
        check(`/bikes/filters @${w} hands off to the sidebar on Bikes`, new URL(page.url()).pathname === "/bikes", page.url());
        continue;
      }
      const chrome = await page.evaluate(() => {
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
        };
        const headers = [...document.querySelectorAll("header")].filter((h) => visible(h) && !h.className.includes("range-calendar"));
        return {
          appBar: headers.some((h) => h.className.includes("md:hidden")),
          site: headers.some((h) => !h.className.includes("md:hidden")),
          bottomNav: [...document.querySelectorAll("nav[aria-label='Primary']")].some((n) => getComputedStyle(n).position === "fixed" && visible(n)),
          back: [...document.querySelectorAll("button")].some((b) => b.getAttribute("aria-label") === "Go back" && visible(b)),
        };
      });
      if (w < 768) {
        const ok = chrome.appBar && !chrome.site && (isStack ? !chrome.bottomNav && chrome.back : chrome.bottomNav && !chrome.back);
        check(`${path} @${w} ${isStack ? "stack: app bar with back, no bottom nav" : "tab: app bar and bottom nav"}`, ok, JSON.stringify(chrome));
      } else {
        check(`${path} @${w} website header only (no app bar, no bottom nav)`, chrome.site && !chrome.appBar && !chrome.bottomNav, JSON.stringify(chrome));
      }
    }
    await ctx.close();
  }

  for (const w of [360, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    for (const path of ["/", "/bikes", `/bikes/${CLASSIC.id}`, "/bookings", "/bookings/RG820461", "/profile", "/bikes/filters"]) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const { gap, bars } = await coverGap(page);
      check(`${path} @${w} content clears fixed bars (${bars} bar(s))`, gap >= 0, `gap ${Math.round(gap)}px`);
    }

    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    const pinned = await page.evaluate(() => {
      const cta = document.querySelector("[data-testid='sticky-cta']").getBoundingClientRect();
      return { bottom: Math.round(cta.bottom), vh: window.innerHeight, height: Math.round(cta.height) };
    });
    check(`details @${w} Book bar is pinned to the bottom edge (no nav to sit above)`, pinned.bottom === pinned.vh, JSON.stringify(pinned));

    // Simulate a 24px home-indicator inset: the bar grows to cover it and stays on the edge.
    await page.addStyleTag({ content: ":root{--safe-bottom:24px !important}" });
    await page.waitForTimeout(100);
    const withInset = await page.evaluate(() => {
      const cta = document.querySelector("[data-testid='sticky-cta']").getBoundingClientRect();
      return { bottom: Math.round(cta.bottom), vh: window.innerHeight, height: Math.round(cta.height) };
    });
    check(`details @${w} safe-area inset grows the bar and keeps it on the edge`, withInset.bottom === withInset.vh && withInset.height >= pinned.height + 23, JSON.stringify({ pinned, withInset }));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    const geo = await page.evaluate(() => {
      const cta = document.querySelector("[data-testid='sticky-cta']").getBoundingClientRect();
      return { ctaBottom: cta.bottom, vh: window.innerHeight };
    });
    check("details @768 Book bar sits on the viewport edge", Math.abs(geo.ctaBottom - geo.vh) <= 1, JSON.stringify(geo));
    const { gap } = await coverGap(page);
    check("details @768 content clears the Book bar", gap >= 0, `gap ${Math.round(gap)}px`);
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
    const phone = await page.evaluate(() => {
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const bar = [...document.querySelectorAll("header")].find((h) => h.className.includes("md:hidden") && vis(h));
      return {
        title: bar?.querySelector("h1")?.textContent,
        barFilter: !!bar?.querySelector("a[aria-label^='Filters']"),
        barSort: !!bar?.querySelector("button[aria-label^='Sort']"),
        pickup: [...document.querySelectorAll("main button")].some((b) => /Pickup dates/.test(b.textContent) && vis(b)),
        searchbox: [...document.querySelectorAll("input")].some((i) => i.type === "search" && vis(i)),
        categoryTabs: [...document.querySelectorAll("[role='tablist']")].some((t) => t.getAttribute("aria-label") === "Bike category" && vis(t)),
        sortOnPage: [...document.querySelectorAll("main button[aria-label^='Sort']")].filter((b) => vis(b) && !b.closest("header")).length,
      };
    });
    check(
      "bikes (phone): filter and sort icons in the app bar; the page shows only the pickup date",
      phone.title === "Bikes" && phone.barFilter && phone.barSort && phone.pickup && !phone.searchbox && !phone.categoryTabs && phone.sortOnPage === 0,
      JSON.stringify(phone),
    );
    // The pickup field must read as a field: white surface and a border, not grey on grey.
    const field = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("main button")].find((b) => /Pickup dates/.test(b.textContent) && b.getBoundingClientRect().width > 0);
      const cs = getComputedStyle(btn);
      return { bg: cs.backgroundColor, border: parseFloat(cs.borderTopWidth), page: getComputedStyle(document.body).backgroundColor };
    });
    check("pickup field is a white, bordered surface (distinct from the page)", field.bg === "rgb(255, 255, 255)" && field.border >= 1 && field.bg !== field.page, JSON.stringify(field));

    // Search icon opens a popup input at the top of the screen.
    await page.getByRole("button", { name: "Search bikes" }).tap();
    await page.waitForTimeout(600);
    const popup = page.getByRole("dialog");
    const popupBox = await popup.boundingBox();
    check("search icon opens a popup near the top of the screen", (await popup.isVisible()) && popupBox.y < 200, JSON.stringify(popupBox));
    check("the search input is focused for typing", await page.evaluate(() => document.activeElement?.closest("[role='dialog']") !== null && document.activeElement?.tagName === "INPUT"));
    await page.keyboard.type("duke");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(800);
    check("Enter applies the search and closes the popup", (await page.getByRole("dialog").count()) === 0 && (await page.locator("main article:visible").count()) === 1);
    check("the search shows as a clearable chip", (await page.getByRole("button", { name: /Clear search/ }).innerText()).includes("duke"));
    await page.getByRole("button", { name: /Clear search/ }).tap();
    await page.waitForTimeout(600);
    check("clearing the chip restores every bike", (await page.locator("main article:visible").count()) === 10);
    await page.getByRole("button", { name: "Search bikes" }).tap();
    await page.waitForTimeout(600);
    await page.goBack();
    await page.waitForTimeout(600);
    check("system Back dismisses the search popup and stays on Bikes", (await page.getByRole("dialog").count()) === 0 && new URL(page.url()).pathname === "/bikes", page.url());

    await page.getByRole("link", { name: /^Filters/ }).tap();
    await page.waitForURL("**/bikes/filters");
    await page.waitForTimeout(600);
    check(
      "filters open as a full screen: back, Reset, no bottom nav",
      (await page.getByRole("button", { name: "Reset" }).isVisible()) &&
        (await page.getByRole("button", { name: "Go back" }).isVisible()) &&
        (await page.evaluate(() => ![...document.querySelectorAll("nav[aria-label='Primary']")].some((n) => getComputedStyle(n).position === "fixed" && n.getBoundingClientRect().height > 0))),
    );
    const sw = await page.evaluate(() => {
      const control = document.querySelector(".switch__control")?.getBoundingClientRect();
      // The label is a bare text node inside the switch content, so measure it with a Range.
      let label;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.textContent.trim() === "Available bikes only") {
          const range = document.createRange();
          range.selectNodeContents(n);
          label = range.getBoundingClientRect();
          break;
        }
      }
      return control && label ? { dy: Math.abs(control.top + control.height / 2 - (label.top + label.height / 2)), beside: label.left >= control.right - 1 } : null;
    });
    check("filter switch label sits beside its toggle", sw !== null && sw.dy < 14 && sw.beside, JSON.stringify(sw));
    await page.getByRole("button", { name: "Yamaha" }).tap();
    await page.waitForTimeout(300);
    check("filters show a live result count", (await page.getByRole("button", { name: /Show 1 bike/ }).count()) === 1);
    await page.getByRole("button", { name: /Show 1 bike/ }).tap();
    await page.waitForURL("**/bikes");
    await page.waitForTimeout(700);
    check("Show N bikes returns to Bikes with the filter applied", (await page.locator("main article:visible").count()) === 1);
    check("filter link shows the active count", (await page.getByRole("link", { name: "Filters, 1 active" }).count()) === 1);

    await page.getByRole("link", { name: /^Filters/ }).tap();
    await page.waitForURL("**/bikes/filters");
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Reset" }).tap();
    await page.getByRole("button", { name: /Show 10 bikes/ }).tap();
    await page.waitForURL("**/bikes");
    await page.waitForTimeout(700);
    check("reset restores every bike", (await page.locator("main article:visible").count()) === 10);

    await page.getByRole("button", { name: /^Sort/ }).tap();
    await page.waitForTimeout(500);
    await page.getByRole("dialog").getByText("Price: low to high").tap();
    await page.waitForTimeout(700);
    const prices = await page.locator("main article").evaluateAll((els) => els.map((el) => Number(el.textContent.match(/\$([\d,]+)/)[1].replace(/,/g, ""))));
    check("sort: low to high orders cards by price", prices.every((p, i) => i === 0 || prices[i - 1] <= p), prices.join(","));
    check("sort sheet closes on choice", (await page.getByRole("dialog").count()) === 0);

    await page.goto(BASE + "/bikes?q=zzzz", { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    check("a search from Home shows as a removable chip", (await page.getByRole("button", { name: /Clear search/ }).count()) === 1);
    check("empty state when nothing matches", (await page.getByText("No bikes match").count()) === 1);
    await page.getByRole("button", { name: "Reset filters" }).tap();
    await page.waitForTimeout(700);
    check("empty state reset brings bikes back", (await page.locator("main article").count()) === 10 && (await page.getByRole("button", { name: /Clear search/ }).count()) === 0);
    check("browse: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/bikes", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    check("desktop: filters are a sidebar, not a drawer", (await page.getByRole("complementary", { name: "Filters" }).isVisible()) && !(await page.getByRole("link", { name: /^Filters/ }).first().isVisible()));
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

  {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/bikes", { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    check(
      "tablet: search, category tabs and a Filters button are on the page",
      (await page.getByRole("searchbox").isVisible()) && (await page.getByRole("tablist", { name: "Bike category" }).isVisible()) && (await page.getByRole("link", { name: /^Filters/ }).isVisible()),
    );
    await page.getByRole("link", { name: /^Filters/ }).click();
    await page.waitForURL("**/bikes/filters");
    await page.waitForTimeout(700);
    check(
      "tablet: Filters stays a page (no sidebar yet) with its own title and Reset",
      new URL(page.url()).pathname === "/bikes/filters" && (await page.getByRole("heading", { name: "Filters" }).isVisible()) && (await page.getByRole("button", { name: "Reset" }).isVisible()),
      page.url(),
    );
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
        header: top([...document.querySelectorAll("header")].find((h) => h.getBoundingClientRect().height > 0)),
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
      const header = [...document.querySelectorAll("header")].find((h) => h.getBoundingClientRect().height > 0);
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
    check("card shows amber price and rating with review count", (await page.locator("section[aria-labelledby='popular'] article").first().innerText()).match(/\$[\d,]+[\s\S]*\(\d+\)/) !== null);

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
    const hero = await page.evaluate(() => {
      const gallery = document.querySelector("[aria-label$='photos']").getBoundingClientRect();
      const bar = document.querySelector("header[class*='fixed']");
      const back = [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Go back").getBoundingClientRect();
      return { left: gallery.left, right: gallery.right, top: gallery.top, vw: window.innerWidth, backTop: back.top, bg: getComputedStyle(bar).backgroundColor };
    });
    check("hero runs edge to edge, up under the status bar", hero.left === 0 && hero.right === hero.vw && hero.top === 0, JSON.stringify(hero));
    check("back, save and share float over the hero (bar transparent)", hero.bg === "rgba(0, 0, 0, 0)" && hero.backTop >= 0 && hero.backTop < 24, JSON.stringify(hero));
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(600);
    const solid = await page.evaluate(() => getComputedStyle(document.querySelector("header[class*='fixed']")).backgroundColor);
    check("the floating bar turns solid after scrolling past the hero", solid !== "rgba(0, 0, 0, 0)", solid);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

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
    await page.getByText("Helmet · $2 / day").tap();
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
    // Steps are history entries: system Back returns to the previous step, Forward comes back.
    await page.goBack();
    await page.waitForTimeout(700);
    check("system Back returns to the previous step (rider)", (await page.getByText("Step 2 of 5").count()) === 1 && /step=2/.test(page.url()), page.url());
    await page.goForward();
    await page.waitForTimeout(700);
    check("Forward returns to the licence step", (await page.getByText("Step 3 of 5").count()) === 1 && /step=3/.test(page.url()), page.url());
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

    // Android Back from the confirmation must not drop into the finished payment step.
    await page.goBack();
    await page.waitForURL(`**/bookings/${ref}`, { timeout: 8000 });
    await page.waitForTimeout(600);
    check("system Back after paying lands on the booking, not the finished flow", new URL(page.url()).pathname === `/bookings/${ref}`, page.url());
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
    await page.waitForTimeout(600);
    const editBox = await page.getByRole("dialog").boundingBox();
    check("Edit details opens as a bottom sheet on phones", Math.abs(editBox.y + editBox.height - 844) < 2, JSON.stringify(editBox));
    await page.getByLabel("Full name").fill("Rahul S. Sharma");
    await page.getByRole("button", { name: "Save" }).tap();
    await page.waitForTimeout(500);
    check("editing details updates the profile", (await page.getByText("Rahul S. Sharma").first().isVisible()));
    await page.getByText("Offers and news").tap();
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    check("profile changes persist after reload", (await page.getByText("Rahul S. Sharma").first().isVisible()) && (await page.getByRole("switch", { name: "Offers and news" }).isChecked()));

    // Update licence is a form too: a sheet, validated, saved as "in review".
    await page.getByRole("button", { name: "Update licence" }).tap();
    await page.waitForTimeout(600);
    const licBox = await page.getByRole("dialog").boundingBox();
    check("Update licence opens as a bottom sheet on phones", Math.abs(licBox.y + licBox.height - 844) < 2, JSON.stringify(licBox));
    await page.getByLabel("Licence number").fill("bad");
    await page.getByRole("button", { name: "Submit" }).tap();
    await page.waitForTimeout(400);
    check("licence sheet rejects a malformed number", (await page.getByText("Use the format RJ14 2021 0012345.").count()) === 1);
    await page.getByLabel("Licence number").fill("RJ14 2022 0099887");
    await page.getByRole("button", { name: "Submit" }).tap();
    await page.waitForTimeout(800);
    check("a valid licence closes the sheet and shows In review", (await page.getByRole("dialog").count()) === 0 && (await page.getByText("In review").first().isVisible()));

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

  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Edit details" }).click();
    await page.waitForTimeout(600);
    const box = await page.getByRole("dialog").boundingBox();
    check("desktop: Edit details is a centred dialog, not a bottom sheet", box.y > 40 && box.width < 600 && box.y + box.height < 880, JSON.stringify(box));
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
    await page.locator("main article h3:visible").first().tap();
    await page.waitForURL("**/bikes/**");
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Go back" }).tap();
    await page.waitForURL(BASE + "/bikes");
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
      "headline, Google and Telegram buttons are visible",
      (await page.getByRole("heading", { level: 1 }).first().isVisible()) &&
        (await page.getByRole("button", { name: "Continue with Google" }).isVisible()) &&
        (await page.getByRole("button", { name: "Continue with Telegram" }).isVisible()),
    );
    check("no mobile-number field on sign in", (await page.getByLabel("Mobile number").count()) === 0);
    check("four slide dots", (await page.getByRole("group", { name: "Choose a slide" }).getByRole("button").count()) === 4);
    await page.getByRole("button", { name: "Show slide 3" }).tap();
    await page.waitForTimeout(600);
    check("dots change the slide", await page.getByText("MINUTES").first().isVisible());

    await page.getByRole("button", { name: "Continue with Google" }).tap();
    await page.waitForURL(BASE + "/", { timeout: 8000 });
    await page.waitForTimeout(600);
    check("Google sign in opens Home", (await page.getByText("Popular Bikes").count()) === 1);
    check("sign in: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/signin", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    check("desktop: both providers are offered", (await page.getByRole("button", { name: "Continue with Google" }).isVisible()) && (await page.getByRole("button", { name: "Continue with Telegram" }).isVisible()));
    await page.getByRole("button", { name: "Continue with Telegram" }).click();
    await page.waitForURL(BASE + "/", { timeout: 8000 });
    check("desktop: Telegram sign in opens Home", page.url() === BASE + "/");
    await ctx.close();
  }

  // ---------------------------------------------------------------- 11. native behaviours: Back, transitions, PWA
  section("11. native behaviours: Back, transitions, PWA");
  {
    const mobile = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

    // Deep link: Back must not leave the app; it falls back to the parent list.
    let ctx = await browser.newContext(mobile);
    let page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Go back" }).tap();
    await page.waitForURL(BASE + "/bikes", { timeout: 8000 });
    check("deep link: app bar Back falls back to the Bikes list", new URL(page.url()).pathname === "/bikes");
    await ctx.close();

    // In-app: Back pops one screen; a closed sheet leaves no stray history entry.
    ctx = await browser.newContext(mobile);
    page = await ctx.newPage();
    watch(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.locator('nav[aria-label="Primary"]').getByRole("link", { name: "Bikes" }).tap();
    await page.waitForURL(BASE + "/bikes");
    await page.waitForTimeout(900);
    await page.locator("main article h3:visible").first().tap();
    await page.waitForURL("**/bikes/**");
    await page.waitForTimeout(800);
    const detailsUrl = page.url();

    await page.getByRole("button", { name: /Select pickup and drop dates/ }).tap();
    await page.waitForTimeout(600);
    check("sheet opens on details", await page.getByRole("dialog").isVisible());
    await page.goBack();
    await page.waitForTimeout(600);
    check("system Back closes the sheet and stays on the screen", (await page.getByRole("dialog").count()) === 0 && page.url() === detailsUrl, page.url());

    await page.getByRole("button", { name: /Select pickup and drop dates/ }).tap();
    await page.waitForTimeout(600);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
    check("Esc closes the sheet", (await page.getByRole("dialog").count()) === 0);
    await page.goBack();
    await page.waitForURL(BASE + "/bikes", { timeout: 8000 });
    check("a closed sheet leaves no stray entry: one Back leaves the screen", new URL(page.url()).pathname === "/bikes", page.url());

    // Filters is a pushed screen: the app bar Back returns to Bikes.
    await page.getByRole("link", { name: /^Filters/ }).tap();
    await page.waitForURL("**/bikes/filters");
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Go back" }).tap();
    await page.waitForURL(BASE + "/bikes", { timeout: 8000 });
    check("Filters: app bar Back returns to Bikes", new URL(page.url()).pathname === "/bikes");
    check("native Back flows: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();

    // Stack screens slide in; pinned bars are never inside the animated element.
    ctx = await browser.newContext(mobile);
    page = await ctx.newPage();
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const slide = await page.evaluate(() => {
      const el = document.querySelector(".rgo-stack-in");
      const c = el && getComputedStyle(el);
      const bars = [document.querySelector("[data-testid='sticky-cta']"), document.querySelector("header[class*='fixed']")];
      const trapped = bars.some((bar) => {
        for (let p = bar.parentElement; p && p !== document.documentElement; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (cs.transform !== "none" || cs.filter !== "none" || cs.willChange.includes("transform")) return true;
        }
        return false;
      });
      return { name: c?.animationName, duration: c?.animationDuration, trapped };
    });
    check("stack screens slide in over 220ms", slide.name === "rgo-stack-in" && slide.duration === "0.22s", JSON.stringify(slide));
    check("pinned bars have no transformed ancestor (they cannot jump)", slide.trapped === false, JSON.stringify(slide));
    await ctx.close();

    ctx = await browser.newContext({ ...mobile, reducedMotion: "reduce" });
    page = await ctx.newPage();
    await page.goto(BASE + `/bikes/${CLASSIC.id}`, { waitUntil: "networkidle" });
    const reduced = await page.evaluate(() => getComputedStyle(document.querySelector(".rgo-stack-in")).animationDuration);
    check("stack slide collapses under reduced motion", /^(0s|1e-05s|0\.00001s)$/.test(reduced), reduced);
    await ctx.close();

    // Regression: the slide used to overflow the page by 24px, so mobile browsers zoomed the page out for
    // ~300ms (innerHeight 844 -> 896, scale < 1) and the Book bar popped. Sample every frame.
    ctx = await browser.newContext(mobile);
    page = await ctx.newPage();
    const sample = () =>
      page.evaluate(() => {
        window.__v = [];
        const t0 = performance.now();
        (function tick() {
          const t = performance.now() - t0;
          const cta = [...document.querySelectorAll("[data-testid='sticky-cta'],[data-testid='flow-footer']")].find((e) => e.getBoundingClientRect().width > 0);
          window.__v.push({ ih: innerHeight, iw: innerWidth, scale: visualViewport.scale, cta: cta ? Math.round(cta.getBoundingClientRect().bottom) : null });
          if (t < 700) requestAnimationFrame(tick);
        })();
      });
    const frames = async (label) => {
      await page.waitForTimeout(1000);
      const v = await page.evaluate(() => window.__v);
      const uniq = (k) => [...new Set(v.map((f) => f[k]))];
      const ctaSeen = uniq("cta").filter((c) => c !== null);
      check(
        `${label}: viewport never changes size or zooms during the slide`,
        uniq("ih").length === 1 && uniq("iw").length === 1 && uniq("scale").every((x) => x === 1),
        JSON.stringify({ ih: uniq("ih"), iw: uniq("iw"), scale: uniq("scale") }),
      );
      check(`${label}: the pinned bar stays on the bottom edge`, ctaSeen.every((c) => c === 844), JSON.stringify(ctaSeen));
    };
    await page.goto(BASE + "/bikes", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await sample();
    await page.locator("main article h3:visible").first().tap();
    await page.waitForURL("**/bikes/**");
    await frames("Bikes -> Details");
    await page.getByRole("button", { name: /Select pickup and drop dates/ }).tap();
    await page.waitForTimeout(500);
    const dates = page.getByRole("dialog").locator('[role="gridcell"] [role="button"]:not([aria-disabled="true"])');
    await dates.nth(0).tap();
    await dates.nth(2).tap();
    await page.getByRole("dialog").getByRole("button", { name: /^Confirm/ }).tap();
    await page.waitForTimeout(500);
    await sample();
    await page.locator("[data-testid='sticky-cta'] button").tap();
    await page.waitForURL("**/book**");
    await frames("Details -> Booking");
    await sample();
    await page.getByRole("button", { name: "Go back" }).tap();
    await page.waitForURL((u) => !/\/book/.test(u.pathname));
    await frames("Booking -> Details (Back)");
    await ctx.close();

    // Installable PWA.
    ctx = await browser.newContext(mobile);
    page = await ctx.newPage();
    const res = await page.request.get(BASE + "/manifest.webmanifest");
    const manifest = await res.json();
    check("manifest is served and installable (standalone)", res.ok() && manifest.display === "standalone" && manifest.name === "RideGo" && manifest.start_url === "/", JSON.stringify({ display: manifest.display, name: manifest.name }));
    let iconsOk = manifest.icons?.length >= 3 && manifest.icons.some((i) => i.purpose === "maskable");
    for (const icon of manifest.icons ?? []) {
      const r = await page.request.get(BASE + icon.src);
      iconsOk = iconsOk && r.ok() && (r.headers()["content-type"] ?? "").includes("image/png");
    }
    check("manifest icons (including a maskable one) all load as PNG", iconsOk, JSON.stringify(manifest.icons));
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const themeHome = await page.locator('meta[name="theme-color"]').first().getAttribute("content");
    await page.goto(BASE + "/signin", { waitUntil: "networkidle" });
    const themeSignIn = await page.locator('meta[name="theme-color"]').last().getAttribute("content");
    check("status bar colour is white on app screens and dark on the welcome screen", themeHome?.toLowerCase() === "#ffffff" && themeSignIn?.toLowerCase() === "#111111", `${themeHome} / ${themeSignIn}`);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 12. help, legal, artwork
  section("12. help, legal and artwork");
  {
    const mobile = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
    const ctx = await browser.newContext(mobile);
    const page = await ctx.newPage();
    const logs = watch(page);

    // Profile links to real pages
    await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.getByRole("link", { name: /Help center/ }).tap();
    await page.waitForURL("**/help");
    await page.waitForTimeout(600);
    check(
      "Profile -> Help center opens the Help screen with Chat, Call and Email",
      (await page.getByRole("button", { name: /Chat/ }).isVisible()) && (await page.getByRole("link", { name: /Call/ }).isVisible()) && (await page.getByRole("link", { name: /Email/ }).isVisible()),
    );
    check("Help is a stack screen: back, no bottom nav", (await page.getByRole("button", { name: "Go back" }).isVisible()) && (await page.evaluate(() => ![...document.querySelectorAll("nav[aria-label='Primary']")].some((n) => getComputedStyle(n).position === "fixed" && n.getBoundingClientRect().height > 0))));
    await page.getByRole("button", { name: "Go back" }).tap();
    await page.waitForURL("**/profile");

    // Popular question deep-links into the FAQ with that answer open
    await page.getByRole("link", { name: /Help center/ }).tap();
    await page.waitForURL("**/help");
    await page.getByRole("link", { name: /How do I cancel/ }).tap();
    await page.waitForURL("**/help/faq**");
    await page.waitForTimeout(700);
    const cancel = page.getByRole("button", { name: /How do I cancel/ });
    check("FAQ deep link opens the chosen answer", (await cancel.getAttribute("aria-expanded")) === "true", await cancel.getAttribute("aria-expanded"));
    const book = page.getByRole("button", { name: /How do I book a bike/ });
    await book.tap();
    await page.waitForTimeout(400);
    check("tapping a question opens it", (await book.getAttribute("aria-expanded")) === "true");
    await book.tap();
    await page.waitForTimeout(400);
    check("tapping again closes it", (await book.getAttribute("aria-expanded")) === "false");
    await book.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    check("keyboard (Enter) toggles a question", (await book.getAttribute("aria-expanded")) === "true");

    // Report an issue: validation, then success
    await page.goto(BASE + "/help/report", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Send report" }).tap();
    await page.waitForTimeout(500);
    check("report: an empty message is rejected with guidance", (await page.getByText(/at least 20 characters/).count()) === 1);
    await page.getByLabel("What happened?").fill("The bike was not at the hub at the booked time.");
    await page.getByRole("button", { name: "Send report" }).tap();
    await page.waitForSelector("[data-testid='ticket-ref']", { timeout: 6000 });
    check("report: success shows a support reference", /^SUP-\d{5}$/.test((await page.getByTestId("ticket-ref").innerText()).trim()));

    // Legal pages
    await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.getByRole("link", { name: /Terms of service/ }).tap();
    await page.waitForURL("**/legal/terms");
    await page.waitForTimeout(700);
    const sections = await page.locator("article h2").count();
    check("terms: title, update date and a numbered section list", (await page.getByRole("heading", { level: 1, name: "Terms of service" }).count()) === 1 && sections === 5 && (await page.getByText(/Last updated/).first().isVisible()));
    await page.getByRole("link", { name: /Damage, theft and accidents/ }).tap();
    await page.waitForTimeout(700);
    const inView = await page.evaluate(() => {
      const r = document.getElementById("damage").getBoundingClientRect();
      return r.top >= 0 && r.top < 200;
    });
    check("a table-of-contents link scrolls its section into view, clear of the app bar", inView);
    check("help and legal: no console errors/warnings", logs.length === 0, logs.join(" | "));

    // Artwork loads through the image optimiser
    const imgs = {};
    await page.goto(BASE + "/signin", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    imgs.signin = await page.evaluate(() => [...document.querySelectorAll("img")].map((i) => ({ src: i.currentSrc, w: i.naturalWidth })));
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    imgs.home = await page.evaluate(() => [...document.querySelectorAll("img")].map((i) => ({ src: i.currentSrc, w: i.naturalWidth })));
    const hasArt = (list, name) => list.some((i) => i.src.includes("/_next/image") && decodeURIComponent(i.src).includes(name) && i.w > 0);
    check("sign-in background artwork loads", hasArt(imgs.signin, "welcome.jpg"), JSON.stringify(imgs.signin));
    check("Home banner and offer artwork load", hasArt(imgs.home, "home-banner.jpg") && hasArt(imgs.home, "offer-banner.jpg"), JSON.stringify(imgs.home));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 13. images and placeholders
  section("13. images");
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
