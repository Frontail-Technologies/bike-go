import { chromium } from "playwright-core";

let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel });
    break;
  } catch {
    // Try the next locally installed browser.
  }
}
if (!browser) throw new Error("No installed Edge or Chrome browser was found.");

const failures = [];
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
for (const width of [390, 768, 1024, 1280, 1440, 1920]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const logs = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) logs.push(message.text());
  });
  page.on("pageerror", (error) => logs.push(error.message));

  for (const route of ["/", "/bikes"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflows) failures.push(`${route} overflows at ${width}px`);
  }

  const detailHref = await page.locator("main a").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")).find((href) => href?.startsWith("/bikes/") && href !== "/bikes/filters") ?? null,
  );
  if (!detailHref) failures.push(`/bikes has no vehicle links at ${width}px`);
  if (detailHref) {
    await page.goto(`${baseUrl}${detailHref}`, { waitUntil: "networkidle" });
    if (!(await page.locator("main").first().isVisible())) failures.push(`vehicle detail is missing at ${width}px`);
  }

  const runtimeErrors = logs.filter((entry) => /hydration|uncaught|typeerror/i.test(entry));
  if (runtimeErrors.length) failures.push(`console error at ${width}px: ${runtimeErrors.join(" | ").slice(0, 300)}`);
  await page.close();
}

await browser.close();
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Customer integration browser smoke passed.");
