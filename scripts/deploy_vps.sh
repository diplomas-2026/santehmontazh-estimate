#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/opt/santehmontazh-estimate"
API_DIR="$PROJECT_DIR/product-api"
WEB_DIR="$PROJECT_DIR/product-web"
WEB_ROOT="/var/www/projects/santehmontazh-estimate.matstart.ru"
API_HEALTH_URL="http://127.0.0.1:18080/swagger-ui/index.html"

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
curl --fail --silent "$API_HEALTH_URL" >/dev/null

echo "[deploy] Done"
