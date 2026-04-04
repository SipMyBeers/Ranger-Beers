# SewReady — Deployment Guide

## Architecture

```
Git Push (master) → GitHub Actions → Cloudflare Pages Deploy → Cache Purge
```

- **Hosting**: Cloudflare Pages (project: `sewready`)
- **Live URL**: https://sewing.ranger-beers.com
- **Pages URL**: https://sewready.pages.dev
- **Repo**: https://github.com/SipMyBeers/sewready

## How Deployment Works

### Automatic (CI/CD)

Every push to `master` triggers `.github/workflows/deploy.yml`:

1. **Checkout** — pulls latest code
2. **Deploy** — runs `wrangler pages deploy . --project-name=sewready`
3. **Cache Purge** — calls Cloudflare API to purge all cached assets on `ranger-beers.com`

The deploy typically completes in 30-45 seconds.

### Manual (Local)

If CI is broken or you need to deploy without pushing:

```bash
cd "/Users/beers/Desktop/Sewing Ops"
npx wrangler pages deploy . --project-name=sewready --branch=master
```

This deploys directly using your local wrangler OAuth session (`npx wrangler login` if needed).

**Note:** Manual local deploys do NOT purge the edge cache. You must purge manually (see below).

## Pushing Changes — Step by Step

```bash
cd "/Users/beers/Desktop/Sewing Ops"

# 1. Stage your changes
git add customer.js customer.css customer.html   # (or whatever you changed)

# 2. NOTE: index.html is the landing/sales page, packages.html is the configurator.
#    They are separate files — do NOT copy one over the other.

# 3. If you edited customer.html, sync to ALL shop directories:
#    The shop copies use ../../ paths; the root uses ./ paths.
for shop in shops/*/; do
  sed \
    -e 's|href="styles.css"|href="../../styles.css"|g' \
    -e 's|href="customer.css"|href="../../customer.css"|g' \
    -e 's|href="print.css"|href="../../print.css"|g' \
    -e 's|src="translations.js"|src="../../translations.js"|g' \
    -e 's|src="shared-data.js"|src="../../shared-data.js"|g' \
    -e 's|src="services-data.js"|src="../../services-data.js"|g' \
    -e 's|src="inventory-data.js"|src="../../inventory-data.js"|g' \
    -e 's|src="data-store.js"|src="../../data-store.js"|g' \
    -e 's|src="receipt.js"|src="../../receipt.js"|g' \
    -e 's|src="customer.js"|src="../../customer.js"|g' \
    -e 's|src="background-video.mp4"|src="../../background-video.mp4"|g' \
    customer.html > "${shop}customer.html"
done

# 4. Stage synced shop files
git add shops/*/customer.html

# 5. Commit
git commit -m "Description of changes"

# 6. Push — this triggers the CI deploy + cache purge
git push origin master
```

## Verifying a Deploy

```bash
# Check CI status
gh run list --limit 1

# Watch a run in real time
gh run watch <run-id>

# Check what Cloudflare Pages has deployed
npx wrangler pages deployment list --project-name sewready

# Verify the live site has your changes
curl -sI "https://sewing.ranger-beers.com/customer.js" | grep cf-cache-status
# MISS = fresh from Pages, HIT = served from edge cache

# Test via preview URL (bypasses custom domain cache)
# Use the deployment hash from `wrangler pages deployment list`
curl -s "https://<deploy-hash>.sewready.pages.dev/customer.js" | head -5
```

## Cache Purging

Cloudflare's CDN edge caches JS/CSS files for 1 hour (`Cache-Control: max-age=3600`). After a deploy, cached files may be stale until purged.

### Automatic (CI)
The deploy workflow purges all cache after each deploy. This requires the `CLOUDFLARE_API_TOKEN` to have **Zone:Cache Purge** permission.

### Manual (Dashboard)
1. Go to https://dash.cloudflare.com
2. Select the `ranger-beers.com` zone
3. Navigate to **Caching → Configuration**
4. Click **Purge Everything**

### Manual (CLI)
```bash
# Requires an API token with Zone:Cache Purge permission
ZONE_ID="8a4dbcb14d9d4b8f798937ffc0ef4b62"
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## GitHub Secrets Required

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | `744bfb33248c0cfcf366989496008f63` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (needs Pages:Edit + Zone:Cache Purge) |
| `CLOUDFLARE_ZONE_ID` | Zone ID for `ranger-beers.com`: `8a4dbcb14d9d4b8f798937ffc0ef4b62` |

## API Token Permissions

The `CLOUDFLARE_API_TOKEN` stored in GitHub Secrets needs these permissions:

| Permission | Access | Purpose |
|------------|--------|---------|
| Account → Cloudflare Pages | Edit | Deploy to Pages |
| Zone → Cache Purge | Edit | Purge CDN cache after deploy |

To update the token:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Edit the token used for CI
3. Add **Zone → Cache Purge → Edit** for the `ranger-beers.com` zone
4. Save — the token value doesn't change, just the permissions

## File Structure

```
/Users/beers/Desktop/Sewing Ops/
├── index.html             ← Landing/sales page (served at root URL /)
│                            This is the main SewReady marketing page with
│                            shop showcase, pricing, FAQ, chat widget, etc.
├── packages.html          ← Package configurator (separate page)
├── customer.html          ← Main shop template (root-level)
├── customer.js            ← Customer portal logic
├── customer.css           ← Customer portal styles
├── Assets/shops/          ← Per-shop logos, hero images (committed to git)
├── _headers               ← Cloudflare cache/security headers
├── _redirects             ← URL routing for shop pages
├── wrangler.toml          ← Cloudflare Pages + D1 + R2 config
├── .github/workflows/
│   └── deploy.yml         ← CI/CD pipeline
└── shops/
    └── aaa-tailor/
        ├── customer.html  ← Synced copy (../../ paths + shop-config.js)
        └── shop-config.js ← Shop-specific config
```

**Note:** index.html and packages.html are now separate files — do NOT sync them.

## Troubleshooting

**Site shows old code after push:**
- Check CI ran: `gh run list --limit 1`
- Check cache: `curl -sI https://sewing.ranger-beers.com/customer.js | grep cf-cache`
- If `cf-cache-status: HIT` with old content → purge cache (see above)
- Test via preview URL to confirm deploy worked: `https://<hash>.sewready.pages.dev`

**CI deploy succeeds but cache purge fails:**
- The API token needs `Zone:Cache Purge` permission
- Update at https://dash.cloudflare.com/profile/api-tokens

**wrangler login expired:**
- Run `npx wrangler login` to re-authenticate via browser
