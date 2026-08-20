"""GFSA intent validator — Stage ② (topic / given / find)."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("FAIL: PyYAML required — pip install pyyaml", file=sys.stderr)
    sys.exit(1)

REQUIRED = ("topic", "given", "find")
CANDIDATES = [
    Path("intent/examples/apk-web-intelligence.yaml"),
    Path("intent/schema.yaml"),
    Path("intent/intent.yaml"),
]


def _load(path: Path) -> dict:
    data = yaml.safe_load(path.read_text()) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: root must be mapping")
    return data


def validate(path: Path | None = None) -> None:
    if path is None:
        path = next((p for p in CANDIDATES if p.exists() and p.stat().st_size > 0), None)
    if path is None:
        raise FileNotFoundError(
            "no non-empty intent file found; tried: "
            + ", ".join(str(p) for p in CANDIDATES)
        )
    data = _load(path)
    missing = [k for k in REQUIRED if k not in data or data[k] in (None, "", [])]
    if missing:
        raise ValueError(f"{path}: missing/empty keys {missing}")
    print(f"intent: {path} – OK")


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    try:
        validate(target)
    except Exception as e:
        print(f"FAIL: {e}", file=sys.stderr)
        sys.exit(1)
