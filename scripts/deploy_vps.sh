#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/opt/santehmontazh-estimate"
API_DIR="$PROJECT_DIR/product-api"
WEB_DIR="$PROJECT_DIR/product-web"
WEB_ROOT="/var/www/projects/santehmontazh-estimate.matstart.ru"
API_HEALTH_URL="http://127.0.0.1:18080/api/swagger-ui/index.html"

echo "[deploy] Updating repository"
rm -f "$WEB_DIR/package-lock.json"
git -C "$PROJECT_DIR" pull --ff-only

echo "[deploy] Rebuilding API containers"
cd "$API_DIR"
docker compose up -d --build

echo "[deploy] Building frontend"
docker run --rm \
  -v "$WEB_DIR:/app" \
  -w /app \
  node:22-bookworm \
  sh -lc 'npm install --no-package-lock && npm run build'

echo "[deploy] Publishing frontend"
mkdir -p "$WEB_ROOT"
rsync -a --delete "$WEB_DIR/dist/" "$WEB_ROOT/"

echo "[deploy] Verifying API"
api_ready="false"
for attempt in $(seq 1 30); do
  if curl --fail --silent "$API_HEALTH_URL" >/dev/null; then
    api_ready="true"
    echo "[deploy] API is ready"
    break
  fi

  echo "[deploy] Waiting for API to become ready (attempt $attempt/30)"
  sleep 2
done

if [[ "$api_ready" != "true" ]]; then
  echo "[deploy] API did not become ready in time" >&2
  exit 1
fi

echo "[deploy] Done"
