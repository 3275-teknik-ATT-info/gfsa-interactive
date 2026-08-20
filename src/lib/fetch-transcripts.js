/**
 * GFSA Transcript Fetcher
 * Batch-fetches ChatGPT shared conversation URLs using Playwright.
 * Outputs each transcript to a timestamped .txt file + a combined manifest.
 *
 * Usage:
 *   node fetch-transcripts.js
 *
 * Requirements (run once in Codespace):
 *   npm install playwright
 *   npx playwright install chromium
 */

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";;

// ── CONFIG ────────────────────────────────────────────────────────────────────
const URLS = [
  "https://chatgpt.com/s/t_6a84a86f707481918107996df4281581",
  "https://chatgpt.com/s/t_6a84ad6c2b0881919b07626f1bf7559b",
];

const OUT_DIR = "./transcripts";
const RENDER_WAIT_MS = 4000; // time for JS to hydrate
const SELECTOR = "main";     // ChatGPT renders conversation inside <main>
// ─────────────────────────────────────────────────────────────────────────────

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");
const slugFromUrl = (url) => url.match(/t_([a-z0-9]+)/)?.[1] ?? "unknown";

async function fetchTranscript(page, url) {
  const slug = slugFromUrl(url);
  console.log(`\n[FETCH] ${slug}`);
  console.log(`  URL: ${url}`);

  await page.goto(url, { waitUntil: "domcontentloaded" });

  // Wait for JS hydration
  await page.waitForTimeout(RENDER_WAIT_MS);

  // Try to grab rendered conversation text
  let text = "";
  try {
    await page.waitForSelector(SELECTOR, { timeout: 8000 });
    text = await page.innerText(SELECTOR);
  } catch {
    // Fallback: full body text
    console.warn(`  [WARN] <main> not found, falling back to body`);
    text = await page.innerText("body");
  }

  if (!text || text.trim().length < 100) {
    console.warn(`  [WARN] Content suspiciously short (${text.length} chars) — may be gated`);
  }

  return { slug, url, text, chars: text.length };
}

async function main() {
  // Ensure output directory exists
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  const manifest = {
    fetched_at: new Date().toISOString(),
    tool: "playwright/chromium",
    results: [],
  };

  for (const url of URLS) {
    try {
      const result = await fetchTranscript(page, url);

      // Write individual transcript
      const outFile = join(OUT_DIR, `${result.slug}.txt`);
      writeFileSync(outFile, result.text, "utf8");
      console.log(`  [OK]  ${result.chars} chars → ${outFile}`);

      manifest.results.push({
        slug: result.slug,
        url: result.url,
        file: outFile,
        chars: result.chars,
        status: result.chars > 100 ? "ok" : "suspect",
      });
    } catch (err) {
      console.error(`  [ERR] ${url}: ${err.message}`);
      manifest.results.push({
        url,
        status: "error",
        error: err.message,
      });
    }
  }

  // Write manifest
  const manifestFile = join(OUT_DIR, "manifest.json");
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\n[DONE] Manifest → ${manifestFile}`);

  // Write combined file for easy upload
  const combined = manifest.results
    .filter((r) => r.file)
    .map((r) => {
      const divider = `\n${"=".repeat(80)}\nTRANSCRIPT: ${r.slug}\nURL: ${r.url}\n${"=".repeat(80)}\n`;
      return divider + readFileSync(r.file, "utf8");
    })
    .join("\n\n");

  const combinedFile = join(OUT_DIR, "combined.txt");
  writeFileSync(combinedFile, combined, "utf8");
  console.log(`[DONE] Combined → ${combinedFile}`);
  console.log(`\nUpload ${combinedFile} to Claude for review.`);

  await browser.close();
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});

