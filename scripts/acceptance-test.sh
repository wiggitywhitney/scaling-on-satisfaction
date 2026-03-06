#!/usr/bin/env bash
# ABOUTME: Runs acceptance gate tests with secrets injected via vals
# ABOUTME: Uses explicit bash subprocess since vals exec resets PATH
set -euo pipefail
cd "$(dirname "$0")/.."
/opt/homebrew/bin/vals exec -f .vals.yaml -- /opt/homebrew/bin/bash -c \
  'export PATH="/opt/homebrew/bin:$PATH"; npx vitest run test/acceptance-gate.test.js'
