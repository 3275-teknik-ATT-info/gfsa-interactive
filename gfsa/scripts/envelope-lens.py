#!/usr/bin/env python3
import json, hashlib, sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

ALLOWED_ACTORS = {"llm", "system", "github-actions", "gfsa-bot"}
REQUIRED_STAGES = ["ingest", "bind", "validate", "commit", "observe", "elevate"]
MAX_CLOCK_SKEW = timedelta(minutes=30)   # relaxed for Codespace clock drift

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def sha256_of(obj):
    return hashlib.sha256(canonical(obj).encode()).hexdigest()

def parse_provenance(header: str):
    parts = header.strip().split(":")
    if len(parts) < 4:
        return None
    return {"hash": parts[0], "actor": parts[1], "stage": parts[2], "timestamp": ":".join(parts[3:])}

def main(artifact_dir: str):
    d = Path(artifact_dir)
    errors = []

    directive = json.loads((d / "directive.json").read_text())
    aep = json.loads((d / "aep.json").read_text())
    provenance_header = (d / "PROVENANCE").read_text().strip()

    parsed = parse_provenance(provenance_header)
    if not parsed:
        errors.append("provenance header malformed")

    recomputed = sha256_of(directive)
    if parsed and parsed["hash"] != recomputed:
        errors.append(f"hash mismatch: header={parsed['hash'][:12]}… recomputed={recomputed[:12]}…")

    if parsed and parsed["actor"] not in ALLOWED_ACTORS:
        errors.append(f"actor '{parsed['actor']}' not allowed")

    if parsed and parsed["stage"] not in REQUIRED_STAGES:
        errors.append(f"stage '{parsed['stage']}' not declared")

    try:
        ts = datetime.fromisoformat(parsed["timestamp"].replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if abs(now - ts) > MAX_CLOCK_SKEW:
            errors.append("timestamp outside allowed window")
    except Exception:
        errors.append("timestamp unparseable")

    obs = aep.get("observation")
    if obs and obs.get("parent_hash") != recomputed:
        errors.append("ObservationPacket.parent_hash != directive hash")

    if errors:
        print("LENS FAIL (elevation blocked):")
        for e in errors:
            print(f"  - {e}")
        aep["elevation"] = False
        (d / "aep.json").write_text(json.dumps(aep, indent=2))
        sys.exit(1)

    print("LENS PASS – elevation permitted")
    aep["elevation"] = True
    (d / "aep.json").write_text(json.dumps(aep, indent=2))
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: envelope-lens.py <artifact_dir>")
        sys.exit(1)
    main(sys.argv[1])
