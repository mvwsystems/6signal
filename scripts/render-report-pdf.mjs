#!/usr/bin/env node
// Render a prospect/client report HTML file to a print PDF with headless
// Chromium (Playwright). Usage:
//   node scripts/render-report-pdf.mjs <input.html> <output.pdf>
// The HTML owns its own @page rules; this only waits for web fonts and prints
// with backgrounds on. Requires `playwright` resolvable from the cwd or a
// global install (the cloud sandbox ships one; locally: npx playwright install chromium).
import { createRequire } from "node:module";
// require() honours NODE_PATH, so a global Playwright works: NODE_PATH=$(npm root -g) node scripts/render-report-pdf.mjs ...
const { chromium } = createRequire(import.meta.url)("playwright");
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: render-report-pdf.mjs <input.html> <output.pdf>");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const fontsOk = await page.evaluate(() =>
  ["700 20px 'Chakra Petch'", "400 14px Inter", "400 12px 'JetBrains Mono'"].map((f) => [f, document.fonts.check(f)])
);
console.log("fonts:", fontsOk.map(([f, ok]) => `${f} ${ok ? "ok" : "MISSING"}`).join(" | "));
await page.pdf({ path: resolve(output), format: "Letter", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log("wrote", output);
