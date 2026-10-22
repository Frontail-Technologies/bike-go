import { SHOTS, WIDTHS, overflowReport, scrollThrough, trackLayoutShift, watch } from "../lib.mjs";

/** Phase 1 and 1.5: design system, overlays, shells and motion patterns. */
export default async function run({ browser, base: BASE, t }) {
  const { check, section } = t;

  // ------------------------------------------------------------ A. responsive, console, layout shift
  section("A. design system and admin: responsive / console / layout shift");
  for (const path of ["/design-system", "/admin"]) {
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
      const page = await ctx.newPage();
      const logs = watch(page);
      await trackLayoutShift(page);
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      await scrollThrough(page);
      const m = await overflowReport(page);
      const ok = m.scrollWidth <= m.innerWidth && m.offenders.length === 0;
      check(`${path} @${w} no horizontal overflow`, ok, ok ? "" : JSON.stringify(m));
      check(`${path} @${w} layout shift ${m.cls.toFixed(3)} (<= 0.1)`, m.cls <= 0.1);
      check(`${path} @${w} no console errors/warnings`, logs.length === 0, logs.join(" | "));
      await ctx.close();
    }
  }

  // ------------------------------------------------------------ B. mobile overlays and calendar
  section("B. mobile: sheet, select, modal, calendar, nav demo");
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/design-system#overlays", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    await page.locator("#overlays").getByRole("button", { name: "Filters" }).first().tap();
    await page.waitForTimeout(600);
    const dialog = page.getByRole("dialog");
    check("sheet opens", await dialog.isVisible());
    const box = await dialog.boundingBox();
    check("sheet anchored to bottom", Math.abs(box.y + box.height - 844) < 2, JSON.stringify(box));
    const lock = await page.evaluate(() => getComputedStyle(document.body).overflow + "|" + getComputedStyle(document.documentElement).overflow);
    check("body scroll locked while open", /hidden/.test(lock), lock);

    await dialog.getByRole("button", { name: /Price range|Any price/ }).first().tap();
    await page.waitForTimeout(500);
    const listbox = page.getByRole("listbox");
    check("select listbox visible inside sheet", await listbox.isVisible());
    const lb = await listbox.boundingBox();
    check("listbox inside viewport", lb.x >= 0 && lb.y >= 0 && lb.x + lb.width <= 390 && lb.y + lb.height <= 844, JSON.stringify(lb));
    const hit = await page.evaluate(() => {
      const opt = document.querySelector('[role="option"]');
      const r = opt.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return !!el && opt.contains(el);
    });
    check("options not covered by sheet (z-order)", hit);
    await page.getByRole("option", { name: /Under/ }).tap();
    await page.waitForTimeout(300);
    check("select value updates", (await dialog.innerText()).includes("Under $12"));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    check("Esc closes sheet", (await page.getByRole("dialog").count()) === 0);
    check("body scroll unlocked after close", !/hidden/.test(await page.evaluate(() => getComputedStyle(document.body).overflow)));

    await page.locator("#overlays").getByRole("button", { name: "Cancel booking" }).tap();
    await page.waitForTimeout(500);
    check("modal opens", await page.getByRole("dialog").isVisible());
    check("focus moves into modal", await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    await page.locator("#ridego").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const status = page.locator("#ridego div.bg-brand-soft[aria-live=polite]");
    check("default duration is 2 days (23-25 Oct)", /\b2 days\b/.test(await status.innerText()));
    const cells = page.locator('#ridego [role="gridcell"] [role="button"]:not([aria-disabled="true"])');
    const first = cells.nth(0);
    const fourth = cells.nth(3);
    const parse = (label) => new Date(label.match(/([A-Z][a-z]+ [0-9]{1,2}, [0-9]{4})/)[1] + " 12:00 UTC");
    const days = Math.round((parse(await fourth.getAttribute("aria-label")) - parse(await first.getAttribute("aria-label"))) / 864e5);
    await first.tap();
    await fourth.tap();
    await page.waitForTimeout(300);
    const txt = await status.innerText();
    check(`duration updates after picking a range (expect ${days} days)`, new RegExp(`\\b${days} days\\b`).test(txt), JSON.stringify(txt));
    const cell = await first.boundingBox();
    check("calendar cells meet 44px touch target", cell.width >= 44 && cell.height >= 44, `${cell.width}x${cell.height}`);
    const unavailable = await page.locator('#ridego [role="gridcell"] [aria-label*="October 28"]').getAttribute("aria-disabled");
    check("unavailable dates (28 Oct) are disabled", unavailable === "true");

    await page.locator("#navigation").scrollIntoViewIfNeeded();
    await page.locator('#navigation nav[aria-label="Primary"]').getByRole("link", { name: "Bookings" }).tap();
    await page.waitForTimeout(400);
    const cur = await page.locator('#navigation nav[aria-label="Primary"] a[aria-current="page"]').innerText();
    check("demo bottom nav switches active tab", /Bookings/.test(cur), cur);
    check("mobile flows: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  // ------------------------------------------------------------ C. desktop
  section("C. desktop: popover, admin sidebar, card hover");
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/design-system#overlays", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.locator("#overlays").getByRole("button", { name: "Filters" }).nth(1).click();
    await page.waitForTimeout(500);
    const pop = page.getByRole("dialog");
    check("desktop overlay is a popover, not a full-width sheet", (await pop.boundingBox()).width < 500);
    await pop.getByRole("button", { name: /Brand|Royal Enfield/ }).first().click();
    await page.waitForTimeout(400);
    check("select opens inside popover", await page.getByRole("listbox").isVisible());
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
    const w1 = (await page.locator("aside").boundingBox()).width;
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await page.waitForTimeout(500);
    const w2 = (await page.locator("aside").boundingBox()).width;
    check("admin sidebar collapses", w1 > 200 && w2 < 100, `${w1} -> ${w2}`);

    await page.goto(BASE + "/design-system#motion", { waitUntil: "networkidle" });
    await page.locator("#motion").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const card = page.locator("#motion article").first();
    await card.scrollIntoViewIfNeeded();
    const before = await card.evaluate((el) => getComputedStyle(el).translate);
    await card.hover();
    await page.waitForTimeout(350);
    const after = await card.evaluate((el) => getComputedStyle(el).translate);
    check("card lifts on hover (desktop)", /-2px/.test(after) && !/-2px/.test(before), `${before} -> ${after}`);
    check("card has no 3D tilt", (await card.evaluate((el) => getComputedStyle(el).transform)) === "none");
    check("desktop flows: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  // ------------------------------------------------------------ D. motion components
  section("D. motion & interaction");
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/design-system", { waitUntil: "networkidle" });
    await page.evaluate(() => document.getElementById("motion").scrollIntoView());
    await page.waitForTimeout(800);

    const tablist = page.locator("#motion").getByRole("tablist").first();
    await tablist.getByRole("tab", { name: "Sports" }).click();
    await page.waitForTimeout(500);
    const sel = await tablist.evaluate((list) => {
      const tab = list.querySelector('[role="tab"][aria-selected="true"]');
      const ind = tab.querySelector("span[aria-hidden]");
      const a = tab.getBoundingClientRect();
      const b = ind?.getBoundingClientRect();
      return { label: tab.textContent.trim(), has: !!ind, dx: b ? Math.abs(b.x - a.x) : 99, dw: b ? Math.abs(b.width - a.width) : 99 };
    });
    check("animated selection: indicator settles on the selected tab", sel.has && sel.label === "Sports" && sel.dx < 2 && sel.dw < 2, JSON.stringify(sel));

    const seg = page.locator("#motion").getByRole("tablist").nth(1);
    await seg.getByRole("tab", { name: "Week" }).click();
    await page.waitForTimeout(400);
    check("segmented control selects", (await seg.getByRole("tab", { name: "Week" }).getAttribute("aria-selected")) === "true");

    await page.locator("#motion article").first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1300);
    const opacities = await page.evaluate(() =>
      [...document.querySelectorAll("#motion article")].slice(0, 4).map((a) => Number(getComputedStyle(a.parentElement).opacity)),
    );
    check("staggered grid items all end fully visible", opacities.length >= 4 && opacities.every((o) => o === 1), JSON.stringify(opacities));

    const ticker = page.locator("#motion p.text-2xl span[aria-hidden]:not(.invisible)").first();
    await ticker.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    check("metric ticker ends at the final value", (await ticker.innerText()) === "$5,810", await ticker.innerText());
    await page.getByRole("button", { name: "Change values" }).click();
    await page.waitForTimeout(1300);
    const changed = await ticker.innerText();
    check("metric ticker tweens to the changed value", changed !== "$5,810" && /^\$[\d,]+$/.test(changed), changed);

    const car = page.locator("#motion [aria-roledescription=carousel]").first();
    await car.scrollIntoViewIfNeeded();
    const activeDot = () => car.evaluate((root) => [...root.querySelectorAll('div[aria-hidden="true"].h-6 span')].findIndex((d) => d.className.includes("w-5")));
    const d0 = await activeDot();
    const cb = await car.boundingBox();
    await page.mouse.move(cb.x + cb.width * 0.8, cb.y + 150);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(cb.x + cb.width * 0.8 - i * 40, cb.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(700);
    const d1 = await activeDot();
    check("carousel drag snaps to the next slide", d0 === 0 && d1 > 0, `${d0} -> ${d1}`);
    check("carousel artwork never stretches (meet fit)", (await car.evaluate((root) => root.querySelector("svg").getAttribute("preserveAspectRatio"))) === "xMidYMid meet");

    const items = page.locator('#motion ul[aria-label="Recent bookings"] > li');
    const n0 = await items.count();
    await page.getByRole("button", { name: "Add booking" }).click();
    await page.waitForTimeout(600);
    check("activity list adds an entry", (await items.count()) === n0 + 1, `${n0} -> ${await items.count()}`);

    await page.locator("#motion").getByText("Preview reduced motion").click();
    await page.waitForTimeout(200);
    check("reduced-motion preview toggles the forced class", (await page.locator(".rgo-force-reduced").count()) === 1);
    check("motion section: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const style = await page.evaluate(() => {
      const c = getComputedStyle(document.querySelector(".rgo-page-in"));
      return `${c.animationName} ${c.animationDuration}`;
    });
    check("customer pages use the 200ms page transition", style === "rgo-page-in 0.2s", style);
    const t0 = Date.now();
    await page.locator('nav[aria-label="Primary"]').last().getByRole("link", { name: "Bikes" }).click();
    await page.waitForURL("**/bikes");
    check("navigation is not delayed by the transition", Date.now() - t0 < 1500, `${Date.now() - t0}ms`);
    await ctx.close();
  }

  // ------------------------------------------------------------ E. OS reduced motion
  section("E. OS reduced motion");
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const logs = watch(page);
    await page.goto(BASE + "/design-system", { waitUntil: "networkidle" });
    const btn = await page.evaluate(() => {
      const c = getComputedStyle(document.querySelector("button.button"));
      return c.transitionProperty + "|" + c.transitionDuration;
    });
    check("HeroUI button transitions disabled", /^none|0\.01ms|1e-05s/.test(btn), btn);
    await page.evaluate(() => document.getElementById("motion").scrollIntoView());
    const ticker = page.locator("#motion p.text-2xl span[aria-hidden]:not(.invisible)").first();
    await ticker.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    check("ticker shows its final value immediately", (await ticker.innerText()) === "$5,810", await ticker.innerText());
    const reveal = page.locator("#motion").getByText("Choose your ride");
    await reveal.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const vis = await reveal.evaluate((el) => {
      const w = el.parentElement;
      const s = getComputedStyle(w);
      return { opacity: s.opacity, filter: s.filter, transform: s.transform };
    });
    check(
      "reveal is a plain fade (no blur, no offset)",
      vis.opacity === "1" && ["none", "blur(0px)"].includes(vis.filter) && ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(vis.transform),
      JSON.stringify(vis),
    );
    check("reduced motion: no console errors/warnings", logs.length === 0, logs.join(" | "));
    await ctx.close();
  }

  void SHOTS;
}
