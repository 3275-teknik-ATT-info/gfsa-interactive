"""GFSA manifest validator — Stage ④ (vehicles + mode + stages)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("FAIL: PyYAML required", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
VEHICLES_JSON = ROOT / "vehicles.json"
VEHICLES_YAML = ROOT / "build" / "vehicles.yaml"
EXECUTION = ROOT / "contract" / "execution.yaml"


def _legal_vehicles() -> set[str]:
    if VEHICLES_JSON.exists():
        data = json.loads(VEHICLES_JSON.read_text())
        if isinstance(data, list):
            return set(data)
    if VEHICLES_YAML.exists() and VEHICLES_YAML.stat().st_size > 0:
        data = yaml.safe_load(VEHICLES_YAML.read_text()) or {}
        if isinstance(data, list):
            return set(data)
        if isinstance(data, dict) and "vehicles" in data:
            return set(data["vehicles"])
    raise FileNotFoundError("no vehicles source (vehicles.json or build/vehicles.yaml)")


def validate() -> None:
    legal = _legal_vehicles()
    if not legal:
        raise ValueError("legal vehicles empty")

    mode = "stage_bound"
    if EXECUTION.exists() and EXECUTION.stat().st_size > 0:
        exe = yaml.safe_load(EXECUTION.read_text()) or {}
        mode = exe.get("mode", mode)

    if mode != "stage_bound":
        raise ValueError(f"mode must be stage_bound, got {mode!r}")

    print(f"manifest: vehicles={len(legal)} mode={mode} – OK")


if __name__ == "__main__":
    try:
        validate()
    except Exception as e:
        print(f"FAIL: {e}", file=sys.stderr)
        sys.exit(1)
