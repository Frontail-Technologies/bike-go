import { overflowReport, watch } from "../lib.mjs";

const widths = [768, 1024, 1280, 1440, 1920];

export default async function run({ browser, base, t }) {
  const { check, section } = t;
  section("A. admin showcase responsive layout");
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const logs = watch(page);
    await page.goto(`${base}/admin/ui`, { waitUntil: "networkidle" });
    const metrics = await overflowReport(page);
    check(`/admin/ui @${width} loads`, await page.getByRole("heading", { name: "Admin UI foundation" }).isVisible());
    check(`/admin/ui @${width} no page overflow`, metrics.scrollWidth <= metrics.innerWidth, JSON.stringify(metrics));
    check(`/admin/ui @${width} no console errors`, logs.length === 0, logs.join(" | "));
    if (width < 1024) check(`/admin/ui @${width} uses mobile navigation`, await page.getByRole("button", { name: "Open menu" }).isVisible());
    else check(`/admin/ui @${width} uses 232px sidebar`, Math.round((await page.locator("aside").boundingBox()).width) === 232);
    await context.close();
  }

  section("B. navigation and controls");
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const logs = watch(page);
    await page.goto(`${base}/admin/ui`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await page.waitForTimeout(250);
    check("desktop sidebar collapses to 72px", Math.round((await page.locator("aside").boundingBox()).width) === 72);
    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await page.getByRole("button", { name: "Open profile menu" }).click();
    check("profile dropdown opens", await page.getByRole("menu").isVisible());
    await page.keyboard.press("ArrowDown");
    check("profile dropdown supports keyboard focus", await page.evaluate(() => !!document.activeElement?.closest('[role="menu"]')));
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "All statuses" }).focus();
    await page.keyboard.press("ArrowDown");
    check("select opens from keyboard", await page.getByRole("listbox").isVisible());
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    check("select accepts keyboard selection", (await page.getByRole("button", { name: /statuses|Ongoing|Completed|Pending/ }).nth(0).innerText()) !== "All statuses");
    await page.getByRole("button", { name: /statuses|Ongoing|Completed|Pending/ }).nth(0).click();
    await page.getByRole("option", { name: "All statuses" }).click();
    await page.getByRole("searchbox", { name: "Search bookings…" }).fill("Marie");
    check("search filters table", await page.getByText("Marie Tan").isVisible() && (await page.getByText("John Smith").count()) === 0);
    await page.getByRole("searchbox", { name: "Search bookings…" }).fill("");
    await page.getByRole("columnheader", { name: "Booking" }).click();
    check("sortable column updates sort direction", (await page.getByRole("columnheader", { name: "Booking" }).getAttribute("aria-sort")) !== null);
    const rowAction = page.locator('button[aria-label^="Actions for"]').first();
    const rowActionLabel = await rowAction.getAttribute("aria-label");
    await rowAction.focus();
    await page.keyboard.press("Enter");
    check("table action menu opens from keyboard", await page.getByRole("menu", { name: rowActionLabel }).isVisible());
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Next page" }).click();
    check("table pagination advances", (await page.locator('.pagination [aria-current="page"]').innerText()) === "2");
    await page.getByRole("tab", { name: "Overview" }).focus();
    await page.keyboard.press("ArrowRight");
    check("tabs support arrow-key navigation", (await page.getByRole("tab", { name: "Bookings" }).getAttribute("aria-selected")) === "true");
    await page.getByRole("button", { name: "Open drawer demo" }).click();
    check("showcase drawer traps focus", await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')));
    await page.keyboard.press("Escape");
    check("showcase drawer closes with Escape", (await page.getByRole("dialog", { name: "Drawer demonstration" }).count()) === 0);
    await page.getByRole("button", { name: "Open modal demo" }).click();
    check("modal traps focus", await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    check("modal closes with Escape", !(await page.getByRole("dialog", { name: "Neutral workflow" }).isVisible()));
    await page.getByRole("button", { name: "Open confirmation dialog" }).click();
    check("confirmation dialog traps focus", await page.getByRole("alertdialog").isVisible());
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    check("confirmation dialog closes with Escape", !(await page.getByRole("alertdialog").isVisible()));
    await page.locator('input[type="file"]').first().setInputFiles({ name: "vehicle.png", mimeType: "image/png", buffer: Buffer.from("fake-image") });
    check("image uploader creates local preview state", await page.getByText("1/5 images").isVisible());
    check("interactive showcase has no console errors", logs.length === 0, logs.join(" | "));
    await context.close();
  }

  section("C. mobile drawer, redirect, reduced motion");
  {
    const context = await browser.newContext({ viewport: { width: 768, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`${base}/admin/ui`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    check("mobile navigation drawer opens", await page.getByRole("dialog", { name: "Admin navigation" }).isVisible());
    const duration = await page.locator("[data-admin-ui]").evaluate((root) => getComputedStyle(root.querySelector("button")).transitionDuration);
    check("admin respects reduced motion", duration === "0.01ms" || duration === "1e-05s" || duration === "0s", duration);
    await page.goto(`${base}/admin/bikes`, { waitUntil: "networkidle" });
    check("legacy bikes route redirects to vehicles", page.url().endsWith("/admin/vehicles"));
    await context.close();
  }

  section("D. production admin screens");
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const logs = watch(page);
    await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
    const metrics = await overflowReport(page);
    check(`/admin @${width} loads dashboard`, await page.getByRole("heading", { name: "Dashboard" }).isVisible());
    check(`/admin @${width} no page overflow`, metrics.scrollWidth <= metrics.innerWidth, JSON.stringify(metrics));
    check(`/admin @${width} no hydration or console errors`, logs.length === 0, logs.join(" | "));
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const logs = watch(page);
    await page.goto(`${base}/admin/vehicles`, { waitUntil: "networkidle" });
    await page.getByRole("searchbox", { name: "Search vehicles…" }).fill("Toyota Vios");
    check("vehicle search filters the list", await page.getByRole("row").filter({ hasText: "Toyota Vios" }).isVisible() && (await page.getByRole("row").filter({ hasText: "Honda Click 125" }).count()) === 0);
    await page.getByRole("searchbox", { name: "Search vehicles…" }).fill("");
    await page.getByRole("button", { name: "Next page" }).click();
    check("vehicle pagination advances", (await page.locator('.pagination [aria-current="page"]').innerText()) === "2");
    await page.goto(`${base}/admin/vehicles/00000000-0000-4000-8000-000000000001`, { waitUntil: "networkidle" });
    check("vehicle details render", await page.getByRole("heading", { name: "Honda Click 125" }).isVisible());
    await page.getByRole("button", { name: "Edit" }).click();
    check("vehicle edit form loads existing data", await page.getByRole("textbox", { name: "Vehicle name" }).inputValue() === "Honda Click 125");
    await page.goto(`${base}/admin/vehicles/new`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Add Vehicle" }).click();
    check("add vehicle shows inline validation", await page.getByText("Enter at least 2 characters.").isVisible());
    await page.goto(`${base}/admin/locations`, { waitUntil: "networkidle" });
    check("Cambodia locations render", await page.getByText("Phnom Penh Central").isVisible() && await page.getByText("Siem Reap Riverside").isVisible());
    await page.getByRole("button", { name: "Edit" }).first().click();
    check("location edit form loads existing data", await page.getByRole("textbox", { name: "Location name" }).inputValue() === "Phnom Penh Central");
    check("production admin interactions have no console errors", logs.length === 0, logs.join(" | "));
    await context.close();
  }
}
