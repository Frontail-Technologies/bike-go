/**
 * Draws the brand artwork (sign-in background and banners) into public/hero (run: `bun run art`).
 * These are illustrations rendered from code, not photographs. To use real photography instead, drop
 * files in public/hero and keep the same names.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, launchBrowser } from "../qa/lib.mjs";

const OUT = join(ROOT, "public", "hero");
mkdirSync(OUT, { recursive: true });

// ------------------------------------------------------------------ helpers
/** Small deterministic random source so every run draws the same picture. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A jagged ridge line filled down to `bottom`. */
function ridge({ seed, width, base, amp, step, fill, bottom, opacity = 1 }) {
  const r = rng(seed);
  const pts = [];
  let y = base;
  for (let x = -step; x <= width + step; x += step) {
    y = base + (r() - 0.5) * amp * 2 + Math.sin(x / (step * 7)) * amp * 0.6;
    pts.push([x, y]);
  }
  const d = pts.map(([x, py], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`).join(" ");
  return `<path d="${d} L${width + step},${bottom} L${-step},${bottom} Z" fill="${fill}" opacity="${opacity}"/>`;
}

/** Motorcycle with rider, side view facing right, drawn in a 400x300 box as a dark silhouette with a rim light. */
function rider({ x, y, scale, body = "#1d1a26", rim = "#ffb25a", tank = "#ffc400" }) {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="200" cy="268" rx="190" ry="11" fill="#000" opacity="0.55"/>
    <ellipse cx="200" cy="150" rx="260" ry="190" fill="url(#backlight)"/>
    <g fill="none">
      <circle cx="92" cy="212" r="50" stroke="${body}" stroke-width="15"/>
      <circle cx="308" cy="212" r="50" stroke="${body}" stroke-width="15"/>
      <circle cx="92" cy="212" r="50" stroke="${rim}" stroke-width="3" opacity="0.8" transform="translate(1.5 -1.5)"/>
      <circle cx="308" cy="212" r="50" stroke="${rim}" stroke-width="3" opacity="0.8" transform="translate(1.5 -1.5)"/>
    </g>
    <g stroke="${body}" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M92 212 L160 196 L214 176" stroke-width="10"/>
      <path d="M160 196 L196 120" stroke-width="9"/>
      <path d="M150 204 L84 224 L58 226" stroke-width="11"/>
      <path d="M308 212 L274 112" stroke-width="10"/>
    </g>
    <rect x="150" y="162" width="78" height="54" rx="12" fill="${body}"/>
    <rect x="164" y="148" width="42" height="24" rx="6" fill="${body}"/>
    <path d="M186 118 C196 86 238 82 262 104 C268 110 266 122 256 124 L196 134 C188 135 184 126 186 118 Z" fill="${tank}"/>
    <path d="M186 118 C196 86 238 82 262 104" fill="none" stroke="#fff3b0" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <path d="M268 160 C286 150 322 152 340 170" stroke="${body}" stroke-width="9" stroke-linecap="round" fill="none"/>
    <circle cx="288" cy="118" r="15" fill="${body}"/>
    <circle cx="296" cy="118" r="8" fill="#ffe9a8"/>
    <!-- rider -->
    <g fill="${body}" stroke="${body}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M148 130 C156 102 190 82 224 76 L240 92 C228 104 214 118 204 138 Z"/>
      <path d="M226 86 L282 92" stroke-width="15" fill="none"/>
      <path d="M150 134 C170 152 192 162 216 168" stroke-width="24" fill="none"/>
      <path d="M216 168 L204 202" stroke-width="19" fill="none"/>
      <circle cx="244" cy="62" r="23"/>
    </g>
    <path d="M262 56 C274 58 278 70 272 80" fill="none" stroke="#7fb8ff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
    <path d="M224 48 C236 36 254 38 264 48" fill="none" stroke="${rim}" stroke-width="4" stroke-linecap="round" opacity="0.95"/>
    <path d="M148 126 C162 100 194 82 226 74 L240 90" fill="none" stroke="${rim}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
    <path d="M150 128 C170 146 192 156 214 162" fill="none" stroke="${rim}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
    <rect x="152" y="164" width="74" height="50" rx="11" fill="none" stroke="${rim}" stroke-width="2.5" opacity="0.45"/>
  </g>`;
}

/** Road in one-point perspective with edge lines and a dashed centre line. */
function road({ height, horizon, vx, topW = 14, bottomW, dashes = 12 }) {
  const left = (y) => vx - lerpW(y) / 2;
  const right = (y) => vx + lerpW(y) / 2;
  const lerpW = (y) => topW + ((y - horizon) / (height - horizon)) * (bottomW - topW);
  let svg = `<path d="M${left(horizon)},${horizon} L${right(horizon)},${horizon} L${right(height)},${height} L${left(height)},${height} Z" fill="url(#asphalt)"/>`;
  svg += `<path d="M${vx - 6},${horizon} L${vx + 6},${horizon} L${vx + bottomW * 0.18},${height} L${vx - bottomW * 0.18},${height} Z" fill="url(#reflect)"/>`;
  // edge lines
  const edge = (side) => {
    const o = (y) => (side < 0 ? left(y) : right(y));
    return `<path d="M${o(horizon)},${horizon} L${o(height)},${height}" stroke="#ffd98a" stroke-width="3" opacity="0.5" fill="none"/>`;
  };
  svg += edge(-1) + edge(1);
  // dashes: depth grows non-linearly so they bunch near the horizon
  for (let i = 0; i < dashes; i++) {
    const t0 = Math.pow(i / dashes, 2.1);
    const t1 = Math.pow((i + 0.5) / dashes, 2.1);
    const y0 = horizon + t0 * (height - horizon);
    const y1 = horizon + t1 * (height - horizon);
    const w0 = 2 + t0 * 22;
    const w1 = 2 + t1 * 22;
    svg += `<path d="M${vx - w0 / 2},${y0} L${vx + w0 / 2},${y0} L${vx + w1 / 2},${y1} L${vx - w1 / 2},${y1} Z" fill="#ffc400" opacity="${0.35 + t1 * 0.6}"/>`;
  }
  return svg;
}

const grain = (w, h, opacity = 0.07) => `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="${opacity}" style="mix-blend-mode:overlay"/>`;

function sky({ width, horizon, glowX, stars = true }) {
  const r = rng(11);
  let starSvg = "";
  if (stars)
    for (let i = 0; i < 70; i++) {
      const sx = r() * width;
      const sy = r() * horizon * 0.55;
      starSvg += `<circle cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.2 + r() * 0.5).toFixed(2)}"/>`;
    }
  return `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#090a16"/>
      <stop offset="0.38" stop-color="#241833"/>
      <stop offset="0.62" stop-color="#7a2e35"/>
      <stop offset="0.82" stop-color="#e8873f"/>
      <stop offset="1" stop-color="#ffd27a"/>
    </linearGradient>
    <radialGradient id="sun" cx="${glowX}" cy="${horizon}" r="${Math.round(width * 0.55)}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff4c2" stop-opacity="0.95"/>
      <stop offset="0.18" stop-color="#ffc861" stop-opacity="0.7"/>
      <stop offset="0.5" stop-color="#ff8a3d" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7a4a3c"/>
      <stop offset="0.3" stop-color="#3a2b33"/>
      <stop offset="1" stop-color="#14121a"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a2f3a"/>
      <stop offset="0.25" stop-color="#2a1a2c"/>
      <stop offset="1" stop-color="#0e0c14"/>
    </linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb066" stop-opacity="0"/>
      <stop offset="0.55" stop-color="#ffb066" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#ffb066" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="backlight" cx="0.5" cy="0.45" r="0.5">
      <stop offset="0" stop-color="#ff9a4a" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="reflect" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffc66b" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#ffc66b" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${horizon + 2}" fill="url(#sky)"/>
  ${starSvg}
  <rect width="${width}" height="${horizon + 2}" fill="url(#sun)"/>
  <circle cx="${glowX}" cy="${horizon - 6}" r="${Math.round(width * 0.045)}" fill="#fff6d0" opacity="0.95"/>`;
}

// ------------------------------------------------------------------ the three pieces
function welcome() {
  const W = 1080;
  const H = 1920;
  const horizon = 560;
  const vx = 650;
  return {
    file: "welcome.jpg",
    W,
    H,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#0b0b10"/>
      ${sky({ width: W, horizon, glowX: 700 })}
      ${ridge({ seed: 3, width: W, base: horizon - 150, amp: 70, step: 46, fill: "#6a3040", bottom: horizon + 4, opacity: 0.85 })}
      ${ridge({ seed: 8, width: W, base: horizon - 80, amp: 56, step: 38, fill: "#3a2036", bottom: horizon + 4 })}
      ${ridge({ seed: 21, width: W, base: horizon - 22, amp: 34, step: 30, fill: "#17111d", bottom: horizon + 4 })}
      <rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#ground)"/>
      <rect y="${horizon - 90}" width="${W}" height="${220}" fill="url(#haze)"/>
      ${road({ width: W, height: H, horizon, vx, topW: 18, bottomW: 1500, dashes: 16 })}
      ${rider({ x: 175, y: 300, scale: 1.95 })}
      <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0b0b10" stop-opacity="0"/>
        <stop offset="1" stop-color="#0b0b10" stop-opacity="1"/>
      </linearGradient>
      <rect y="${Math.round(H * 0.5)}" width="${W}" height="${Math.round(H * 0.5)}" fill="url(#fadeDown)"/>
      ${grain(W, H)}
    </svg>`,
  };
}

function homeBanner() {
  const W = 2400;
  const H = 900;
  const horizon = 520;
  const vx = 1850;
  return {
    file: "home-banner.jpg",
    W,
    H,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#0b0b10"/>
      ${sky({ width: W, horizon, glowX: 1900 })}
      ${ridge({ seed: 5, width: W, base: horizon - 130, amp: 60, step: 60, fill: "#6a3040", bottom: horizon + 4, opacity: 0.85 })}
      ${ridge({ seed: 14, width: W, base: horizon - 70, amp: 48, step: 48, fill: "#3a2036", bottom: horizon + 4 })}
      ${ridge({ seed: 27, width: W, base: horizon - 20, amp: 28, step: 36, fill: "#17111d", bottom: horizon + 4 })}
      <rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#ground)"/>
      <rect y="${horizon - 90}" width="${W}" height="${220}" fill="url(#haze)"/>
      ${road({ width: W, height: H, horizon, vx, topW: 16, bottomW: 1400, dashes: 12 })}
      ${rider({ x: 1540, y: 300, scale: 1.55 })}
      ${grain(W, H, 0.06)}
    </svg>`,
  };
}

function offerBanner() {
  const W = 2400;
  const H = 420;
  const r = rng(5);
  let stripes = "";
  for (let i = -4; i < 40; i++) stripes += `<path d="M${i * 70},${H} L${i * 70 + 160},0" stroke="#111" stroke-opacity="0.06" stroke-width="22"/>`;
  let sparks = "";
  for (let i = 0; i < 9; i++) sparks += `<path d="M${1500 + r() * 150},${70 + i * 36} h${60 + r() * 140}" stroke="#111" stroke-opacity="${(0.1 + r() * 0.16).toFixed(2)}" stroke-width="6" stroke-linecap="round"/>`;
  return {
    file: "offer-banner.jpg",
    W,
    H,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="y" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd23d"/><stop offset="1" stop-color="#ffb300"/></linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#y)"/>
      ${stripes}
      ${sparks}
      <!-- helmet -->
      <g transform="translate(1850 28) scale(1.75)">
        <path d="M28 152 C24 76 82 22 152 26 C218 30 264 82 256 150 L252 178 C250 196 236 206 218 206 L120 206 C72 204 38 188 28 152 Z" fill="#111"/>
        <path d="M168 96 C214 92 262 104 270 140 C274 170 262 196 240 206 L196 206 C186 188 176 160 168 96 Z" fill="#1c1f27"/>
        <path d="M126 92 C178 80 246 88 262 126 L258 156 C216 170 150 164 120 142 Z" fill="#2b2f3a"/>
        <path d="M136 100 C180 92 232 100 250 124" fill="none" stroke="#7fb8ff" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
        <path d="M42 120 C58 62 108 32 152 34" fill="none" stroke="#ffd23d" stroke-width="9" stroke-linecap="round" opacity="0.95"/>
        <path d="M44 150 C60 156 96 160 128 156" fill="none" stroke="#ffd23d" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
        <rect x="100" y="198" width="136" height="14" rx="7" fill="#0a0a0a"/>
      </g>
      ${grain(W, H, 0.05)}
    </svg>`,
  };
}

// ------------------------------------------------------------------ render
const browser = await launchBrowser();
try {
  for (const art of [welcome(), homeBanner(), offerBanner()]) {
    const page = await browser.newPage({ viewport: { width: art.W, height: art.H }, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;background:#000}svg{display:block}</style>${art.svg}`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, art.file), type: "jpeg", quality: 88 });
    console.log("wrote", art.file, `${art.W}x${art.H}`);
    await page.close();
  }
} finally {
  await browser.close();
}
