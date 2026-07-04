#!/usr/bin/env sh
# One-command update for the Japanese Text Analyzer.
#
# Pulls the latest code, rebuilds the images, and applies any new data/schema.
# All steps are idempotent: the backend creates missing tables on startup, and
# every importer skips data it already has, so this only fills in what's new
# (e.g. a newly added index) without touching existing data or the model.
set -eu

cd "$(dirname "$0")"

echo "==> 1/3  Pulling latest code"
git pull --ff-only

echo "==> 2/3  Rebuilding and restarting services"
docker compose up -d --build

echo "==> 3/3  Applying data/schema updates (idempotent)"
docker compose run --rm backend python scripts/init_database.py

echo ""
echo "Update complete. Frontend: http://localhost:3000"
