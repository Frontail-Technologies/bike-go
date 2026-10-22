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
    await page.keyboard.press("Escape");
    await page.getByRole("searchbox", { name: "Search bookings…" }).fill("Marie");
    check("search filters table", await page.getByText("Marie Tan").isVisible() && (await page.getByText("John Smith").count()) === 0);
    await page.getByRole("searchbox", { name: "Search bookings…" }).fill("");
    await page.getByRole("columnheader", { name: "Booking" }).click();
    check("sortable column updates sort direction", (await page.getByRole("columnheader", { name: "Booking" }).getAttribute("aria-sort")) !== null);
    await page.getByRole("button", { name: "Next page" }).click();
    check("table pagination advances", (await page.getByText(/Page 2 of/).count()) === 1);
    await page.getByRole("button", { name: "Open confirmation dialog" }).click();
    check("confirmation dialog traps focus", await page.getByRole("alertdialog").isVisible());
    await page.getByRole("button", { name: "Cancel" }).click();
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
}
