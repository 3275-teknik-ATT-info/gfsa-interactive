import { resolveVehicle } from "./lib/openrouter-browser.ts";
import { ProvenanceLog } from "./lib/provenance.ts";

const topicInput = document.getElementById("topic") as HTMLInputElement;
const runBtn = document.getElementById("run") as HTMLButtonElement;
const status = document.getElementById("status") as HTMLDivElement;

const nodes = ["n1", "n2", "n3", "n4", "n5"];

function setNodeState(id: string, state: "active" | "done" | "idle") {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("active", "done");
  if (state !== "idle") el.classList.add(state);
}

function resetNodes() {
  nodes.forEach(id => setNodeState(id, "idle"));
}

const system = `You are the GFSA resolution engine. Reply ONLY with valid JSON:
{
  "candidates": [{"id":"string","compatibility":0.0,"supported_requirements":["string"]}],
  "selected": "string",
  "decision": {
    "requirement": "string",
    "evidence": ["string"],
    "decision": "string",
    "action": ["string"],
    "acceptance": ["string"]
  }
}
Use only vehicles: pwa, cli, bootstrap, browser_extension, worker, hybrid.
Prefer hybrid when browser + local/remote execution is required.`;

runBtn.onclick = async () => {
  const topic = topicInput.value.trim();
  if (!topic) return;

  runBtn.disabled = true;
  resetNodes();
  status.textContent = "Starting…";

  const log = new ProvenanceLog();

  try {
    // Step 1
    log.add("USER_DECLARED", ["topic provided by user"], undefined, { topic });
    setNodeState("n1", "done");

    // Step 2
    log.add("OBSERVED", ["intent captured"]);
    setNodeState("n2", "active");
    await new Promise(r => setTimeout(r, 200));
    setNodeState("n2", "done");

    // Step 3
    setNodeState("n3", "active");
    status.textContent = "Calling LLM…";
    const { resolution, modelUsed } = await resolveVehicle(topic, system);
    log.add("RESEARCHED", ["LLM call completed"], modelUsed);
    log.add("INFERRED", ["candidates scored"], modelUsed, resolution.candidates);

    setNodeState("n3", "done");
    setNodeState("n4", "active");

    // Step 4 + 5
    log.add("SELECTED", [`selected=${resolution.selected}`], modelUsed);
    log.add("VERIFIED", resolution.decision.acceptance || [], modelUsed, resolution.decision);
    setNodeState("n4", "done");
    setNodeState("n5", "done");

    // Verification
    const check = log.verify();
    if (!check.ok) {
      throw new Error(`Provenance verification failed. Missing: ${check.missing.join(", ")} Out-of-order: ${check.outOfOrder}`);
    }

    status.textContent =
      `PROVENANCE VERIFIED\n` +
      `Model used: ${modelUsed}\n` +
      `Selected: ${resolution.selected}\n\n` +
      JSON.stringify(resolution, null, 2) +
      `\n\n--- Provenance Chain ---\n` +
      log.toYAML();

  } catch (err: any) {
    status.textContent = "Error: " + (err.message || String(err));
    resetNodes();
  } finally {
    runBtn.disabled = false;
  }
};
