/**
 * Renders the PWA icons from src/app/icon.svg into public/icons (run: `bun run icons`).
 * Uses the same installed browser as the QA suite, so there is nothing extra to download.
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, launchBrowser } from "../qa/lib.mjs";

const svg = readFileSync(join(ROOT, "src", "app", "icon.svg"), "utf8");
const out = join(ROOT, "public", "icons");
mkdirSync(out, { recursive: true });

const BRAND = "#FFC400";
const icons = [
  // "any": the rounded tile itself, transparent corners.
  { file: "icon-192.png", size: 192, scale: 1, background: "transparent" },
  { file: "icon-512.png", size: 512, scale: 1, background: "transparent" },
  // "maskable": full-bleed brand colour with the glyph inside the safe zone, so any mask shape works.
  { file: "maskable-512.png", size: 512, scale: 0.62, background: BRAND },
  // iOS rounds the corners itself, so it wants a full-bleed square.
  { file: "apple-touch-icon.png", size: 180, scale: 0.8, background: BRAND },
];

const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  for (const { file, size, scale, background } of icons) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;background:${background}}
       .w{width:${size}px;height:${size}px;display:grid;place-items:center}
       .w svg{width:${Math.round(size * scale)}px;height:${Math.round(size * scale)}px;display:block}</style>
       <div class="w">${svg}</div>`,
    );
    await page.screenshot({ path: join(out, file), omitBackground: background === "transparent" });
    console.log("wrote", file);
  }
} finally {
  await browser.close();
}
