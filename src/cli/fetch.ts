import { fetchTranscripts } from "../lib/fetch-transcript.ts";
import { ProvenanceLog } from "../lib/provenance.ts";

const URLS = [
  "https://chatgpt.com/s/t_6a84a86f707481918107996df4281581",
  "https://chatgpt.com/s/t_6a84ad6c2b0881919b07626f1bf7559b",
];

const OUT_DIR = "./transcripts";

async function main() {
  const log = new ProvenanceLog();
  console.log("[GFSA] fetch-transcript — start");
  console.log(`[GFSA] targets: ${URLS.length} URLs → ${OUT_DIR}`);

  const manifest = await fetchTranscripts(URLS, OUT_DIR, log);

  const ok = manifest.results.filter(r => r.status === "ok").length;
  const total = manifest.results.length;

  console.log(`\n[GFSA] ${ok}/${total} transcripts fetched`);
  console.log(`[GFSA] provenance → ${OUT_DIR}/provenance.yaml`);
  console.log(`[GFSA] manifest   → ${OUT_DIR}/manifest.json`);

  const chain = log.verify();
  if (chain.ok) {
    console.log("[GFSA] provenance chain: VERIFIED");
  } else {
    console.warn("[GFSA] provenance chain: INCOMPLETE");
    console.warn("  missing:", chain.missing);
    console.warn("  out-of-order:", chain.outOfOrder);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("[FATAL]", err.message);
  process.exit(1);
});
