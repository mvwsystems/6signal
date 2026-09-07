#!/usr/bin/env bash
# Regenerate the downloadable white paper PDFs (public/papers/*.pdf).
# Run after editing any white paper: bash scripts/generate-wp-pdfs.sh
# Requires: a completed `next build` and Google Chrome installed.
set -euo pipefail
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SLUGS=(
  question-cluster-advantage
  local-entity-gap-ai-search
  aeo-field-manual-answer-engine-optimization
  ai-search-measurement-playbook
  the-connective-layer-ai-infrastructure-construction
  local-ai-infrastructure-blueprint
  the-supplier-signal-dfw-material-suppliers
)
PATH="/usr/local/bin:$PATH" npx next start -p 3999 & SERVER=$!
trap "kill $SERVER" EXIT
sleep 6
for slug in "${SLUGS[@]}"; do
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=15000 \
    --print-to-pdf="public/papers/$slug.pdf" "http://localhost:3999/research/$slug"
  echo "generated public/papers/$slug.pdf"
done
