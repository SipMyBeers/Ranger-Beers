#!/bin/zsh
# Deploy ranger-beers.com to Cloudflare Pages.
# Stages the site into a temp dir, excluding files that are not served:
# oversized PDFs (Pages rejects >25MiB) and unreferenced raw screenshots
# (~70MB that repeatedly corrupt the bulk upload).
set -e
cd "$(dirname "$0")"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
rsync -a \
  --exclude='.git' --exclude='.wrangler' --exclude='.claude' \
  --exclude='node_modules' --exclude='media/screenshots' \
  --exclude='docs/claymore.pdf' --exclude='deploy.sh' \
  --exclude='*.md' \
  ./ "$STAGE/"
source ~/.secrets/cloudflare.env
NODE_OPTIONS="--tls-max-v1.2" npx wrangler pages deploy "$STAGE" --project-name=ranger-beers --commit-dirty=true
