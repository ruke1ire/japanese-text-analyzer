#!/usr/bin/env sh
# One-command setup for the Japanese Text Analyzer.
#
# Runs everything through Docker — no host Python, MeCab, or extra tools needed,
# only Docker with the compose plugin. Safe to re-run: every step is idempotent
# (env is not overwritten, importers skip already-populated data, an existing
# model is left in place).
#
# Usage:
#   ./setup.sh              # default model quantization (Q4_K_M)
#   ./setup.sh Q4_0         # pick a different quantization (see .env.example)
set -eu

cd "$(dirname "$0")"

QUANT="${1:-Q4_K_M}"

echo "==> 1/4  Creating .env (if missing)"
cp -n .env.example .env || true

echo "==> 2/4  Building Docker images"
docker compose build

echo "==> 3/4  Initializing database (downloads dictionaries, imports words/kanji/indexes)"
docker compose run --rm backend python scripts/init_database.py

echo "==> 4/4  Downloading translation model ($QUANT)"
# MODELS_DIR must point at the mounted volume; the script's in-container default
# resolves to /data/models, which is not persisted.
docker compose run --rm -e MODELS_DIR=/app/data/models backend \
    python scripts/download_translation_model.py "$QUANT"

echo "==> Starting services"
docker compose up -d

echo ""
echo "Done. Open:"
echo "  Frontend: http://localhost:3000"
echo "  API docs: http://localhost:8000/docs"
