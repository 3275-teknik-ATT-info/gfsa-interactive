#!/usr/bin/env bash
set -euo pipefail
EXPECTED=$(cat <<'TREE'
contract/schema.yaml
contract/execution.yaml
contract/validation.yaml
contract/provenance.yaml
contract/audit.yaml
intent/schema.yaml
intent/examples/apk-web-intelligence.yaml
intent/README.md
state/schema.yaml
state/projects/
resolution/resolver.yaml
resolution/candidate.yaml
resolution/selection.yaml
research/source.yaml
research/evidence.yaml
research/relevance.yaml
build/schema.yaml
build/capabilities.yaml
build/vehicles.yaml
build/vehicle-contract.yaml
build/stages.yaml
adapters/claude/
adapters/filesystem/
adapters/git/
adapters/web/
validators/__init__.py
validators/manifest.py
validators/intent.py
validators/state.py
validators/build.py
validators/audit.py
projects/apk-web-intelligence/
tests/capabilities/
tests/selection/
tests/provenance/
tests/resolution/
.github/workflows/validate.yml
.github/workflows/bootstrap.yml
Makefile
pyproject.toml
README.md
.gitignore
TREE
)
echo "=== GFSA Scaffold Diff (expected vs present) ==="
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if [[ -e "$path" ]]; then
    echo "[OK]   $path"
  else
    echo "[MISS] $path"
  fi
done <<< "$EXPECTED"
echo "=== End Diff ==="
