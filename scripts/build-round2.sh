#!/usr/bin/env bash
# ABOUTME: Build Round 2 container images — same style, different models (Haiku vs Opus)
# ABOUTME: Accepts registry prefix and tag arguments for Docker image tagging
set -euo pipefail

# Build Round 2 variant images: Haiku (2a) and Opus (2b)
# Round 2 compares model quality, not style. Both use the same (funny) style.
# Usage: ./scripts/build-round2.sh [registry_prefix] [tag]
# Example: ./scripts/build-round2.sh wiggitywhitney/story-app latest

REGISTRY="${1:-story-app}"
TAG="${2:-latest}"

HAIKU_MODEL="claude-haiku-4-5-20251001"
OPUS_MODEL="claude-opus-4-6"

echo "Building Round 2 images (Haiku vs Opus)..."

echo "  App 2a (Haiku: ${HAIKU_MODEL})..."
docker build \
  --platform linux/amd64 \
  --build-arg VARIANT_STYLE=funny \
  --build-arg VARIANT_MODEL="${HAIKU_MODEL}" \
  --build-arg ROUND=2 \
  --build-arg MIN_GENERATION_DELAY_MS=3000 \
  -t "${REGISTRY}-2a:${TAG}" \
  .

echo "  App 2b (Opus: ${OPUS_MODEL})..."
docker build \
  --platform linux/amd64 \
  --build-arg VARIANT_STYLE=funny \
  --build-arg VARIANT_MODEL="${OPUS_MODEL}" \
  --build-arg ROUND=2 \
  -t "${REGISTRY}-2b:${TAG}" \
  .

echo "Done. Images built:"
echo "  ${REGISTRY}-2a:${TAG}  (Haiku — ${HAIKU_MODEL})"
echo "  ${REGISTRY}-2b:${TAG}  (Opus — ${OPUS_MODEL})"
