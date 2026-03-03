#!/usr/bin/env bash
set -euo pipefail

# Build Round 1 variant images: dry (1a) and funny (1b)
# Usage: ./scripts/build-round1.sh [registry]
# Example: ./scripts/build-round1.sh ghcr.io/wiggitywhitney

REGISTRY="${1:-story-app}"
TAG="${2:-latest}"

echo "Building Round 1 images..."

echo "  App 1a (dry/academic)..."
docker build \
  --build-arg VARIANT_STYLE=dry \
  --build-arg ROUND=1 \
  -t "${REGISTRY}-1a:${TAG}" \
  .

echo "  App 1b (funny/engaging)..."
docker build \
  --build-arg VARIANT_STYLE=funny \
  --build-arg ROUND=1 \
  -t "${REGISTRY}-1b:${TAG}" \
  .

echo "Done. Images built:"
echo "  ${REGISTRY}-1a:${TAG}  (dry/academic)"
echo "  ${REGISTRY}-1b:${TAG}  (funny/engaging)"
