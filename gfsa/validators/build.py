"""GFSA build validator — artifact existence + vehicle legality."""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    ROOT / "Makefile",
    ROOT / "vehicles.json",
    ROOT / "contract" / "execution.yaml",
    ROOT / "contract" / "provenance.yaml",
    ROOT / "intent" / "examples" / "apk-web-intelligence.yaml",
]


def _sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def validate() -> None:
    missing = [str(p.relative_to(ROOT)) for p in REQUIRED if not p.exists() or p.stat().st_size == 0]
    if missing:
        raise FileNotFoundError(f"build artifacts missing/empty: {missing}")

    legal = set(json.loads((ROOT / "vehicles.json").read_text()))
    print(f"build: {len(REQUIRED)} artifacts present, {len(legal)} legal vehicles – OK")
    for p in REQUIRED:
        print(f"  {p.relative_to(ROOT)}: {_sha256(p)[:12]}…")


if __name__ == "__main__":
    try:
        validate()
    except Exception as e:
        print(f"FAIL: {e}", file=sys.stderr)
        sys.exit(1)
