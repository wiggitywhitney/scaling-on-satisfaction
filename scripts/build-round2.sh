#!/usr/bin/env bash
# ABOUTME: Build Round 2 container images with cheap (haiku) and expensive (opus) models
# ABOUTME: Accepts registry prefix, tag, and style arguments for Docker image tagging
set -euo pipefail

# Build Round 2 variant images: cheap model (2a) and expensive model (2b)
# Both use the same prompt style (winning style from Round 1, set at build time).
# Usage: ./scripts/build-round2.sh [registry] [tag] [style]
# Example: ./scripts/build-round2.sh ghcr.io/wiggitywhitney latest funny

REGISTRY="${1:-story-app}"
TAG="${2:-latest}"
STYLE="${3:-funny}"

CHEAP_MODEL="claude-haiku-4-5-20251001"
EXPENSIVE_MODEL="claude-opus-4-6"

echo "Building Round 2 images (style: ${STYLE})..."

echo "  App 2a (cheap model: ${CHEAP_MODEL})..."
docker build \
  --platform linux/amd64 \
  --build-arg VARIANT_STYLE="${STYLE}" \
  --build-arg VARIANT_MODEL="${CHEAP_MODEL}" \
  --build-arg ROUND=2 \
  --build-arg MIN_GENERATION_DELAY_MS=3000 \
  -t "${REGISTRY}-2a:${TAG}" \
  .

echo "  App 2b (expensive model: ${EXPENSIVE_MODEL})..."
docker build \
  --platform linux/amd64 \
  --build-arg VARIANT_STYLE="${STYLE}" \
  --build-arg VARIANT_MODEL="${EXPENSIVE_MODEL}" \
  --build-arg ROUND=2 \
  -t "${REGISTRY}-2b:${TAG}" \
  .

echo "Done. Images built:"
echo "  ${REGISTRY}-2a:${TAG}  (${STYLE}, ${CHEAP_MODEL})"
echo "  ${REGISTRY}-2b:${TAG}  (${STYLE}, ${EXPENSIVE_MODEL})"
