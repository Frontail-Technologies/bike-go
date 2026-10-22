/**
 * Regression suite runner.
 *
 *   bun run build && bun run qa                 # everything
 *   bun run qa -- phase2                         # one suite
 *   QA_BASE_URL=http://localhost:3000 bun run qa # against a running server
 *
 * Needs an installed Edge or Chrome (QA_CHANNEL to choose). Exits non-zero on any failure.
 */
import { createReporter, ensureShots, launchBrowser, startServer } from "./lib.mjs";

const available = ["design-system", "phase2", "loans"];
const wanted = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const suites = wanted.length ? wanted : available;
for (const name of suites) if (!available.includes(name)) throw new Error(`Unknown suite "${name}". Available: ${available.join(", ")}`);

const server = process.env.QA_BASE_URL ? { base: process.env.QA_BASE_URL, stop() {} } : await startServer();
const browser = await launchBrowser();
const reporter = createReporter();
ensureShots();

try {
  for (const name of suites) {
    reporter.section(`SUITE ${name}`);
    const { default: run } = await import(`./suites/${name}.mjs`);
    await run({ browser, base: server.base, t: reporter });
  }
} finally {
  await browser.close();
  server.stop();
}

const { pass, fail, failures } = reporter.state;
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) console.log(`Failed:\n - ${failures.join("\n - ")}`);
process.exit(fail ? 1 : 0);
