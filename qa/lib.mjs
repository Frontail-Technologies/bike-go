import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const WIDTHS = [360, 390, 768, 1024, 1440];
export const SHOTS = join(ROOT, "qa", "screenshots");

/** Starts `next start` on a free-ish port and resolves once it answers. Needs a prior `bun run build`. */
export async function startServer(port = 3100) {
  const base = `http://localhost:${port}`;
  const child = spawn(process.execPath, [join(ROOT, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(base);
      if (res.ok) return { base, stop: () => child.kill() };
    } catch {
      /* not up yet */
    }
    if (child.exitCode !== null) throw new Error(`next start exited early:\n${log}`);
    await new Promise((r) => setTimeout(r, 400));
  }
  child.kill();
  throw new Error(`next start did not become ready:\n${log}`);
}

/** Uses an installed browser through Playwright channels (no download). Override with QA_CHANNEL. */
export async function launchBrowser() {
  const channels = process.env.QA_CHANNEL ? [process.env.QA_CHANNEL] : ["msedge", "chrome"];
  let lastError;
  for (const channel of channels) {
    try {
      return await chromium.launch({ channel });
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`No usable browser (tried ${channels.join(", ")}). Set QA_CHANNEL. ${lastError}`);
}

/** Pass/fail reporter shared by every suite. */
export function createReporter() {
  const state = { pass: 0, fail: 0, failures: [] };
  return {
    state,
    check(name, ok, extra = "") {
      if (ok) state.pass++;
      else {
        state.fail++;
        state.failures.push(name);
      }
      console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? "  " + extra : ""}`);
    },
    section(title) {
      console.log(`\n== ${title} ==`);
    },
  };
}

/** Collects console errors/warnings and uncaught errors for a page. */
export function watch(page) {
  const logs = [];
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && logs.push(`${m.type()}: ${m.text().slice(0, 240)}`));
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message.slice(0, 240)}`));
  return logs;
}

/** Scrolls the whole page so once-only reveals fire, then returns to the top. */
export async function scrollThrough(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
}

/** Records layout shift for the page lifetime (call before navigation). */
export async function trackLayoutShift(page) {
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
}

/** Elements that poke past the viewport and are not inside an intentional scroller. */
export function overflowReport(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const offenders = [];
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 1 && r.width > 0) {
        let p = el.parentElement;
        let clipped = false;
        while (p && p !== document.body) {
          if (["auto", "scroll", "hidden", "clip"].includes(getComputedStyle(p).overflowX)) {
            clipped = true;
            break;
          }
          p = p.parentElement;
        }
        if (!clipped) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} right=${Math.round(r.right)}`);
      }
    }
    return { scrollWidth: de.scrollWidth, innerWidth: window.innerWidth, offenders: offenders.slice(0, 4), cls: window.__cls ?? 0 };
  });
}

export function ensureShots() {
  mkdirSync(SHOTS, { recursive: true });
  return SHOTS;
}
