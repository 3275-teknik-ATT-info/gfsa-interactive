#!/usr/bin/env python3
import json, hashlib, uuid, sys
from datetime import datetime, timezone
from pathlib import Path

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

def sha256_of(obj):
    return hashlib.sha256(canonical(obj).encode()).hexdigest()

def main():
    if len(sys.argv) < 2:
        print("Usage: bind_resolution.py <resolution.json>")
        sys.exit(1)

    resolution = json.loads(Path(sys.argv[1]).read_text())
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    actor = "llm"
    stage = "bind"

    directive = {
        "id": str(uuid.uuid4()),
        "stage": stage,
        "actor": actor,
        "payload": resolution,
        "bindings": ["validate", "commit"],
        "metrics": {
            "latency_ms": 0,
            "size_bytes": 0,
            "hash_time_ms": 0
        },
        "timestamp": now
    }

    # Finalize size first
    directive["metrics"]["size_bytes"] = len(canonical(directive).encode())

    # Now hash the complete object
    content_hash = sha256_of(directive)
    provenance = f"{content_hash}:{actor}:{stage}:{now}"

    observation = {
        "parent_hash": content_hash,
        "observation": {
            "selected": resolution.get("selected"),
            "model_note": "free-model resolution bound"
        },
        "visibility": "developer",
        "timestamp": now
    }

    aep = {
        "provenance": provenance,
        "event": "resolution_bound",
        "elevation": False,
        "observation": observation,
        "signature": None
    }

    out_dir = Path("artifacts") / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "directive.json").write_text(json.dumps(directive, indent=2))
    (out_dir / "observation.json").write_text(json.dumps(observation, indent=2))
    (out_dir / "aep.json").write_text(json.dumps(aep, indent=2))
    (out_dir / "PROVENANCE").write_text(provenance + "\n")

    print(f"Bound → {out_dir}")
    print(f"Provenance: {provenance}")

if __name__ == "__main__":
    main()
