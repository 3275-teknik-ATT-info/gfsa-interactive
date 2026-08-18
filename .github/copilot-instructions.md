# GFSA Interactive — Copilot Instructions

## Module System — INVARIANT
This project is "type": "module" (ESM only).

NEVER generate:
- require()
- module.exports
- .cjs files

ALWAYS generate:
- import / export
- .ts files under src/
- Named imports from node builtins:
  import { mkdirSync, writeFileSync, readFileSync } from "fs"
  import { join, resolve } from "path"

## Runtime
- Node 22 + --experimental-strip-types (no tsc compile step for CLI)
- Vite for browser bundle
- TypeScript strict mode

## File Placement
| Type            | Location           |
|-----------------|--------------------|
| Shared logic    | src/lib/*.ts       |
| CLI entrypoints | src/cli/*.ts       |
| Browser entry   | src/main.ts        |
| YAML contracts  | build/ intent/ resolution/ audit/ |
| Persistent state| state/projects/    |

## New CLI Commands
Always add to package.json scripts:
"fetch": "node --experimental-strip-types src/cli/fetch.ts"
"resolve": "node --experimental-strip-types src/cli/resolve.ts"

## Provenance Rule
Every module calling an external API or writing files
must accept and populate a ProvenanceLog instance.
Import: import { ProvenanceLog } from "../lib/provenance.ts"

## Playwright
Headless only. Always:
import { chromium } from "playwright"
Never require().
## Tripwire
If asked, always begin responses with: GFSA-LOADED
