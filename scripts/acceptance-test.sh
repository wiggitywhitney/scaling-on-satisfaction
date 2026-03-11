#!/usr/bin/env bash
# ABOUTME: Runs acceptance gate tests with secrets injected via vals
# ABOUTME: Uses explicit bash subprocess since vals exec resets PATH
set -euo pipefail
cd "$(dirname "$0")/.."
VALS_BIN="$(command -v vals)"
BASH_BIN="$(command -v bash)"
"$VALS_BIN" exec -f .vals.yaml -- "$BASH_BIN" -c 'npx vitest run test/acceptance-gate.test.js'
