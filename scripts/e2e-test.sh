#!/usr/bin/env bash
# ABOUTME: Starts two server instances and runs Playwright e2e tests
# ABOUTME: Supports round selection (1, 2, or both) via first argument
set -euo pipefail
cd "$(dirname "$0")/.."

ROUND="${1:-1}"
CLEANUP_PIDS=()

free_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "  Killing stale process(es) on port ${port}..."
    echo "$pids" | xargs kill 2>/dev/null || true
    sleep 1
  fi
}

cleanup() {
  echo ""
  echo "Stopping server instances..."
  for pid in "${CLEANUP_PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
  echo "Done."
}
trap cleanup EXIT

wait_for_healthy() {
  local url="$1"
  local label="$2"
  local timeout=30
  local elapsed=0
  echo "  Waiting for ${label} (${url})..."
  while ! curl -sf "${url}/api/admin/status" > /dev/null 2>&1; do
    sleep 1
    elapsed=$((elapsed + 1))
    if [[ $elapsed -ge $timeout ]]; then
      echo "  ERROR: ${label} did not become healthy within ${timeout}s"
      exit 1
    fi
  done
  echo "  ${label} is healthy."
}

run_round() {
  local round="$1"
  echo ""
  echo "=== Running E2E tests for Round ${round} ==="

  # Round-specific config
  local coord_style="dry"
  local variant_style="funny"
  local coord_model="claude-sonnet-4-20250514"
  local variant_model="claude-sonnet-4-20250514"

  if [[ "$round" == "2" ]]; then
    coord_style="funny"
    variant_style="funny"
    coord_model="claude-haiku-4-5-20251001"
    variant_model="claude-opus-4-6"
  fi

  # Ensure ports are free before starting
  free_port 8080
  free_port 8081

  echo "Starting coordinator (port 8080, round=${round}, style=${coord_style}, model=${coord_model})..."
  ROUND="$round" \
  PORT=8080 \
  VARIANT_STYLE="$coord_style" \
  VARIANT_MODEL="$coord_model" \
  VARIANT_URLS="http://localhost:8081" \
  PREGEN_DELAY_MS=500 \
  node src/index.js &
  CLEANUP_PIDS+=($!)

  echo "Starting variant (port 8081, round=${round}, style=${variant_style}, model=${variant_model})..."
  ROUND="$round" \
  PORT=8081 \
  VARIANT_STYLE="$variant_style" \
  VARIANT_MODEL="$variant_model" \
  VARIANT_URLS="http://localhost:8080" \
  PREGEN_DELAY_MS=500 \
  node src/index.js &
  CLEANUP_PIDS+=($!)

  wait_for_healthy "http://localhost:8080" "Coordinator"
  wait_for_healthy "http://localhost:8081" "Variant"

  echo "Running Playwright tests..."
  npx playwright test --reporter=list

  echo "Stopping Round ${round} instances..."
  for pid in "${CLEANUP_PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
  CLEANUP_PIDS=()

  echo "=== Round ${round} E2E tests passed ==="
}

# Install Playwright browsers if needed
npx playwright install --with-deps chromium 2>/dev/null || true

if [[ "$ROUND" == "both" ]]; then
  run_round 1
  run_round 2
else
  run_round "$ROUND"
fi

echo ""
echo "All E2E tests passed!"
