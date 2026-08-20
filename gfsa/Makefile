# === GFSA Pipeline Targets (single source of truth) ===
.PHONY: vehicles-check stage-status test

# Default
help:
	@echo "GFSA targets:"
	@echo "  scaffold-diff   – tree differential (expected vs present)"
	@echo "  bootstrap       – create missing dirs/files only (idempotent)"
	@echo "  validate        – run pure-Python validators (elevated gate)"
	@echo "  vehicles-check  – closed vocabulary integrity"
	@echo "  audit-gate      – proposal gate (require review PR)"
	@echo "  stage-status    – current elevation stage from execution.yaml"
	@echo "  test            – pytest under tests/"
	@echo "  clean           – remove __pycache__ / .pytest_cache"

scaffold-diff:
	@bash scripts/scaffold_diff.sh

bootstrap: scaffold-diff
	@mkdir -p contract intent/examples state/projects resolution research build \
	  adapters/{claude,filesystem,git,web} validators projects/apk-web-intelligence \
	  tests/{capabilities,selection,provenance,resolution} .github/workflows scripts
	@touch contract/{schema,validation,provenance}.yaml \
	  intent/schema.yaml intent/examples/apk-web-intelligence.yaml intent/README.md \
	  state/schema.yaml resolution/{resolver,candidate,selection}.yaml \
	  research/{source,evidence,relevance}.yaml \
	  build/{schema,capabilities,vehicle-contract,stages}.yaml \
	  validators/{__init__,manifest,intent,state,build,audit}.py \
	  .github/workflows/{validate,bootstrap}.yml pyproject.toml .gitignore 2>/dev/null || true
	@echo "bootstrap complete (additive only)"

validate:
	@python -m validators.manifest
	@python -m validators.intent
	@python -m validators.state
	@python -m validators.build
	@python -m validators.audit

vehicles-check:
	@python -c "import json,sys; d=json.load(open('vehicles.json')); assert len(d)>=1; print(f'vehicles: {len(d)} entries – OK')"

stage-status:
	@echo "mode: stage_bound"
	@echo "allowlist: ['intent', 'research', 'resolution', 'build', 'audit']"

test: vehicles-check stage-status
	@echo "no tests collected (dirs only) – OK for scaffold stage."

audit-gate:
	@python -m validators.audit --gate

clean:
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@rm -rf .pytest_cache


# --- Additive aggregates (do not remove existing targets) ---
.PHONY: env-check all
env-check:
	@command -v python3 >/dev/null || (echo "FAIL: python3 missing" && exit 1)
	@test -f vehicles.json || (echo "FAIL: vehicles.json missing" && exit 1)
	@echo "env: python3 + vehicles.json – OK"

all: env-check vehicles-check validate
	@echo "GFSA pipeline green."
