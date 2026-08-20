import { resolveVehicle } from "../lib/openrouter.ts";

const topic = process.argv[2] || "Build an APK web-intelligence tool that needs browser UI and local analysis";

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

async function main() {
  console.log("Resolving:", topic);
  const { resolution, modelUsed } = await resolveVehicle(topic, system);
  console.log("Model used:", modelUsed);
  console.log(JSON.stringify(resolution, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
