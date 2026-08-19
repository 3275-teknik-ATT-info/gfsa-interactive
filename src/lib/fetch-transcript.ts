import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { ProvenanceLog } from "./provenance.ts";

export interface FetchResult {
  slug: string;
  url: string;
  chars: number;
  file: string;
  status: "ok" | "suspect" | "error";
  error?: string;
}

export interface FetchManifest {
  fetched_at: string;
  tool: string;
  results: FetchResult[];
  provenance: ReturnType<ProvenanceLog["getAll"]>;
}

const slugFromUrl = (url: string): string =>
  url.match(/t_([a-z0-9]+)/)?.[1] ?? `unknown-${Date.now()}`;

export async function fetchTranscripts(
  urls: string[],
  outDir: string,
  log: ProvenanceLog
): Promise<FetchManifest> {
  mkdirSync(outDir, { recursive: true });

  log.add("USER_DECLARED", [`urls provided: ${urls.length}`]);
  log.add("OBSERVED", ["transcript fetch task captured"]);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  log.add("RESEARCHED", ["playwright chromium launched"]);

  const results: FetchResult[] = [];

  for (const url of urls) {
    const slug = slugFromUrl(url);
    console.log(`[FETCH] ${slug}`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);

      let text = "";
      try {
        await page.waitForSelector("main", { timeout: 8000 });
        text = await page.innerText("main");
      } catch {
        console.warn(`  [WARN] <main> not found — falling back to body`);
        text = await page.innerText("body");
      }

      const outFile = join(outDir, `${slug}.txt`);
      writeFileSync(outFile, text, "utf8");

      const result: FetchResult = {
        slug,
        url,
        chars: text.length,
        file: outFile,
        status: text.length > 100 ? "ok" : "suspect",
      };

      results.push(result);
      console.log(`  [OK] ${text.length} chars → ${outFile}`);

    } catch (err: any) {
      console.error(`  [ERR] ${url}: ${err.message}`);
      results.push({ slug, url, chars: 0, file: "", status: "error", error: err.message });
    }
  }

  await browser.close();

  log.add("INFERRED", [`${results.filter(r => r.status === "ok").length}/${urls.length} fetched ok`]);
  log.add("SELECTED", ["transcript fetch complete"]);
  log.add("VERIFIED", results.map(r => `${r.slug}: ${r.status}`));

  // Write combined file
  const combined = results
    .filter(r => r.file)
    .map(r => {
      const div = `\n${"=".repeat(72)}\nTRANSCRIPT: ${r.slug}\nURL: ${r.url}\n${"=".repeat(72)}\n`;
      const { readFileSync } = await import("fs");
      return div + readFileSync(r.file, "utf8");
    });

  // Write manifest
  const manifest: FetchManifest = {
    fetched_at: new Date().toISOString(),
    tool: "playwright/chromium",
    results,
    provenance: log.getAll(),
  };

  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  writeFileSync(join(outDir, "provenance.yaml"), log.toYAML(), "utf8");

  return manifest;
}
