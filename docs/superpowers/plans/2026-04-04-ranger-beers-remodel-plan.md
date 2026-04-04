# Ranger Beers Remodel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ranger-beers.com from a military school hub into a personal brand site with SUMMON WebGPU hero, three-button intake flow, portfolio showcase, and admin dashboard with lead tracking + auto-generated referral invoices.

**Architecture:** Static HTML/CSS/JS frontend on GitHub Pages (same repo). SUMMON scene vendored as hero background. Cloudflare Worker (`ranger-beers-api`) extended with lead submission, admin CRUD, and PDF invoice generation via pdf-lib. D1 for persistence.

**Tech Stack:** HTML/CSS/JS (no framework), Three.js WebGPU (vendored from SUMMON build), Cloudflare Workers, D1, pdf-lib

---

## File Map

### Frontend (`/Users/beers/Desktop/Ranger-Beers/`)

| File | Action | Responsibility |
|------|--------|---------------|
| `index.html` | **Rewrite** | New single-page site: hero, three buttons, portfolio, footer |
| `css/styles.css` | **Rewrite** | New stylesheet: dark gold theme, responsive, modal styles |
| `js/summon.js` | **Create** | Vendored SUMMON WebGPU scene (built bundle from dist) |
| `js/summon.css` | **Create** | Vendored SUMMON styles (from dist) |
| `js/forms.js` | **Create** | Three-button modal logic, stepped forms, API submission |
| `js/portfolio.js` | **Create** | Portfolio grid, lightbox expand/collapse |
| `js/admin.js` | **Create** | Admin dashboard: login, lead list, detail, invoices |
| `admin.html` | **Create** | Admin dashboard page |
| `images/portfolio/` | **Create** | Screenshot thumbnails for each portfolio site |

### Backend (`/Users/beers/Desktop/ranger-beers-api/`)

| File | Action | Responsibility |
|------|--------|---------------|
| `schema.sql` | **Modify** | Add `leads` and `invoices` tables |
| `src/index.js` | **Modify** | Add lead submission, admin auth, lead CRUD, invoice endpoints |
| `wrangler.toml` | **Modify** | Add `ADMIN_PASSWORD` secret reference |
| `package.json` | **Modify** | Add `pdf-lib` dependency |
| `src/pdf.js` | **Create** | Invoice PDF generation with pdf-lib |

### Files to Remove (old military hub)

All school subdirectories (`ranger/`, `sapper/`, `jungle/`, `mountain/`, `sf/`, `arctic/`, `presidents-hundred/`, `airborne/`, `air-assault/`, `sniper/`, `jumpmaster/`, `pathfinder/`, `eib/`, `mos/`, etc.), plus old pages: `about.html`, `courses.html`, `faq.html`, `inventory.html`, `leaderboard.html`, `pricing.html`, `resources.html`, `shop.html`, `standards.html`, `auth-callback.html`. Also remove `js/course-auth.js`, `js/course-engine.js`, `js/gear-data.js`, `js/gear-modal.js`, `js/shared.js`, `js/config.js`, `css/course-styles.css`, `css/school-landing.css`.

---

## Task 1: D1 Schema — Add leads and invoices tables

**Files:**
- Modify: `/Users/beers/Desktop/ranger-beers-api/schema.sql`

- [ ] **Step 1: Add the leads table to schema.sql**

Append to the end of `schema.sql`:

```sql
-- ── Leads & Referral Tracking ──

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK(source IN ('new_site', 'existing_site', 'referral')),
  lead_name TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  lead_phone TEXT,
  business_name TEXT,
  site_url TEXT,
  need_type TEXT CHECK(need_type IN ('new_site', 'landing_page', 'web_app', 'ecommerce', 'other')),
  description TEXT,
  referrer_name TEXT,
  referrer_email TEXT,
  referrer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'closed_won', 'closed_lost')),
  deal_amount REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  referrer_name TEXT NOT NULL,
  referrer_email TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  deal_amount REAL NOT NULL,
  commission REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_invoices_lead ON invoices(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
```

- [ ] **Step 2: Apply the migration to D1**

Run:
```bash
cd /Users/beers/Desktop/ranger-beers-api
npx wrangler d1 execute ranger-beers-db --remote --file=schema.sql
```

Expected: Tables created successfully (existing tables use IF NOT EXISTS so they're safe).

- [ ] **Step 3: Commit**

```bash
cd /Users/beers/Desktop/ranger-beers-api
git add schema.sql
git commit -m "feat: add leads and invoices tables to D1 schema"
```

---

## Task 2: API — Lead submission endpoint

**Files:**
- Modify: `/Users/beers/Desktop/ranger-beers-api/src/index.js`

- [ ] **Step 1: Add the handleLeadSubmit function**

Add this function before the `// ── Router ──` comment in `src/index.js`:

```javascript
// ── Leads: Submit ──
async function handleLeadSubmit(request, env) {
  const origin = request.headers.get('Origin');
  const body = await request.json();

  const { source, lead_name, lead_email, lead_phone, business_name, site_url, need_type, description, referrer_name, referrer_email, referrer_phone } = body;

  if (!source || !lead_name || !lead_email) {
    return json({ error: 'source, lead_name, and lead_email are required' }, 400, origin, env);
  }

  const validSources = ['new_site', 'existing_site', 'referral'];
  if (!validSources.includes(source)) {
    return json({ error: 'Invalid source' }, 400, origin, env);
  }

  if (source === 'referral' && (!referrer_name || !referrer_email)) {
    return json({ error: 'Referral requires referrer_name and referrer_email' }, 400, origin, env);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO leads (id, source, lead_name, lead_email, lead_phone, business_name, site_url, need_type, description, referrer_name, referrer_email, referrer_phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, source, lead_name, lead_email, lead_phone || null, business_name || null, site_url || null, need_type || null, description || null, referrer_name || null, referrer_email || null, referrer_phone || null).run();

  return json({ success: true, id }, 201, origin, env);
}
```

- [ ] **Step 2: Add the route to the router**

In the `fetch` handler, add before the `return json({ error: 'Not found' }` line:

```javascript
    // Lead submission
    if (path === '/api/lead' && method === 'POST') return handleLeadSubmit(request, env);
```

- [ ] **Step 3: Update CORS_HEADERS to include PATCH method**

Change the CORS_HEADERS at the top of the file:

```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Password',
};
```

- [ ] **Step 4: Test locally**

```bash
cd /Users/beers/Desktop/ranger-beers-api
npx wrangler dev
```

In another terminal:
```bash
curl -X POST http://localhost:8787/api/lead \
  -H "Content-Type: application/json" \
  -d '{"source":"new_site","lead_name":"Test User","lead_email":"test@example.com","business_name":"Test LLC","need_type":"new_site"}'
```

Expected: `{"success":true,"id":"<uuid>"}`

- [ ] **Step 5: Commit**

```bash
cd /Users/beers/Desktop/ranger-beers-api
git add src/index.js
git commit -m "feat: add lead submission endpoint"
```

---

## Task 3: API — Admin auth + lead CRUD

**Files:**
- Modify: `/Users/beers/Desktop/ranger-beers-api/src/index.js`
- Modify: `/Users/beers/Desktop/ranger-beers-api/wrangler.toml`

- [ ] **Step 1: Add admin auth helper**

Add after the `authenticateRequest` function:

```javascript
// ── Admin Auth (simple password) ──
function authenticateAdmin(request, env) {
  const password = request.headers.get('X-Admin-Password');
  return password && password === env.ADMIN_PASSWORD;
}
```

- [ ] **Step 2: Add admin lead list handler**

```javascript
// ── Admin: List Leads ──
async function handleAdminLeads(request, env) {
  const origin = request.headers.get('Origin');
  if (!authenticateAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin, env);

  const rows = await env.DB.prepare(
    'SELECT * FROM leads ORDER BY created_at DESC'
  ).all();

  return json({ leads: rows.results }, 200, origin, env);
}
```

- [ ] **Step 3: Add admin lead update handler**

```javascript
// ── Admin: Update Lead ──
async function handleAdminLeadUpdate(request, env, leadId) {
  const origin = request.headers.get('Origin');
  if (!authenticateAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin, env);

  const body = await request.json();
  const { status, deal_amount } = body;

  const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();
  if (!lead) return json({ error: 'Lead not found' }, 404, origin, env);

  const newStatus = status || lead.status;
  const newDealAmount = deal_amount !== undefined ? deal_amount : lead.deal_amount;

  await env.DB.prepare(
    'UPDATE leads SET status = ?, deal_amount = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(newStatus, newDealAmount, leadId).run();

  // Auto-generate invoice when closing a referral deal
  if (newStatus === 'closed_won' && lead.source === 'referral' && newDealAmount && lead.referrer_email) {
    const existingInvoice = await env.DB.prepare('SELECT id FROM invoices WHERE lead_id = ?').bind(leadId).first();
    if (!existingInvoice) {
      const invoiceId = crypto.randomUUID();
      const commission = Math.round(newDealAmount * 0.10 * 100) / 100;
      await env.DB.prepare(
        'INSERT INTO invoices (id, lead_id, referrer_name, referrer_email, lead_name, deal_amount, commission) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(invoiceId, leadId, lead.referrer_name, lead.referrer_email, lead.lead_name, newDealAmount, commission).run();
    }
  }

  return json({ success: true }, 200, origin, env);
}
```

- [ ] **Step 4: Add routes to the router**

Add before the `return json({ error: 'Not found' }` line:

```javascript
    // Admin routes
    if (path === '/api/admin/leads' && method === 'GET') return handleAdminLeads(request, env);

    const adminLeadMatch = path.match(/^\/api\/admin\/leads\/([^/]+)$/);
    if (adminLeadMatch && method === 'PATCH') return handleAdminLeadUpdate(request, env, adminLeadMatch[1]);
```

- [ ] **Step 5: Set the admin password secret**

```bash
cd /Users/beers/Desktop/ranger-beers-api
npx wrangler secret put ADMIN_PASSWORD
```

Enter a strong password when prompted.

- [ ] **Step 6: Test locally**

```bash
curl -X GET http://localhost:8787/api/admin/leads \
  -H "X-Admin-Password: your-test-password"
```

Expected: `{"leads":[...]}` (includes the test lead from Task 2).

- [ ] **Step 7: Commit**

```bash
cd /Users/beers/Desktop/ranger-beers-api
git add src/index.js
git commit -m "feat: add admin auth and lead CRUD endpoints"
```

---

## Task 4: API — Invoice endpoints + PDF generation

**Files:**
- Create: `/Users/beers/Desktop/ranger-beers-api/src/pdf.js`
- Modify: `/Users/beers/Desktop/ranger-beers-api/src/index.js`
- Modify: `/Users/beers/Desktop/ranger-beers-api/package.json`

- [ ] **Step 1: Install pdf-lib**

```bash
cd /Users/beers/Desktop/ranger-beers-api
npm install pdf-lib
```

- [ ] **Step 2: Create src/pdf.js**

Create `/Users/beers/Desktop/ranger-beers-api/src/pdf.js`:

```javascript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateInvoicePDF(invoice) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter size
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const gold = rgb(0.77, 0.7, 0.35);

  let y = 720;

  // Header
  page.drawText('INVOICE', { x: 50, y, size: 28, font: helveticaBold, color: black });
  y -= 40;

  // Divider
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 1, color: gold });
  y -= 30;

  // To / From
  page.drawText('To:', { x: 50, y, size: 10, font: helveticaBold, color: gray });
  page.drawText('BEERS LABS LLC', { x: 100, y, size: 12, font: helveticaBold, color: black });
  y -= 24;

  page.drawText('From:', { x: 50, y, size: 10, font: helveticaBold, color: gray });
  page.drawText(`${invoice.referrer_name}`, { x: 100, y, size: 12, font: helvetica, color: black });
  y -= 16;
  page.drawText(invoice.referrer_email, { x: 100, y, size: 10, font: helvetica, color: gray });
  y -= 30;

  // Date
  page.drawText('Date:', { x: 50, y, size: 10, font: helveticaBold, color: gray });
  const dateStr = new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(dateStr, { x: 100, y, size: 12, font: helvetica, color: black });
  y -= 24;

  // Re
  page.drawText('Re:', { x: 50, y, size: 10, font: helveticaBold, color: gray });
  page.drawText(`Referral commission — ${invoice.lead_name}`, { x: 100, y, size: 12, font: helvetica, color: black });
  y -= 40;

  // Divider
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 1, color: gold });
  y -= 30;

  // Amounts
  page.drawText('Deal amount:', { x: 50, y, size: 12, font: helvetica, color: gray });
  page.drawText(`$${invoice.deal_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, { x: 250, y, size: 14, font: helveticaBold, color: black });
  y -= 28;

  page.drawText('Commission (10%):', { x: 50, y, size: 12, font: helvetica, color: gray });
  page.drawText(`$${invoice.commission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, { x: 250, y, size: 14, font: helveticaBold, color: gold });
  y -= 40;

  // Divider
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 0.5, color: gray });
  y -= 24;

  page.drawText('Payment due upon receipt.', { x: 50, y, size: 10, font: helvetica, color: gray });

  // Footer
  page.drawText('BEERS LABS LLC — ranger-beers.com', { x: 50, y: 40, size: 8, font: helvetica, color: gray });

  return await doc.save();
}
```

- [ ] **Step 3: Add invoice handlers to index.js**

Add the import at the top of `src/index.js`:

```javascript
import { generateInvoicePDF } from './pdf.js';
```

Add before the `return json({ error: 'Not found' }` line in the router:

```javascript
// ── Admin: List Invoices ──
async function handleAdminInvoices(request, env) {
  const origin = request.headers.get('Origin');
  if (!authenticateAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin, env);

  const rows = await env.DB.prepare(
    'SELECT * FROM invoices ORDER BY created_at DESC'
  ).all();

  return json({ invoices: rows.results }, 200, origin, env);
}

// ── Admin: Invoice PDF ──
async function handleAdminInvoicePDF(request, env, invoiceId) {
  const origin = request.headers.get('Origin');
  if (!authenticateAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin, env);

  const invoice = await env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(invoiceId).first();
  if (!invoice) return json({ error: 'Invoice not found' }, 404, origin, env);

  const pdfBytes = await generateInvoicePDF(invoice);

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${invoiceId}.pdf"`,
      ...corsHeaders(origin, env),
    },
  });
}

// ── Admin: Mark Invoice Paid ──
async function handleAdminInvoicePaid(request, env, invoiceId) {
  const origin = request.headers.get('Origin');
  if (!authenticateAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, origin, env);

  await env.DB.prepare('UPDATE invoices SET status = ? WHERE id = ?').bind('paid', invoiceId).run();
  return json({ success: true }, 200, origin, env);
}
```

Wait — those functions need to be defined *before* the router, not inline. Place them above the `// ── Router ──` comment, then add these routes inside the router:

```javascript
    if (path === '/api/admin/invoices' && method === 'GET') return handleAdminInvoices(request, env);

    const adminInvoicePdfMatch = path.match(/^\/api\/admin\/invoices\/([^/]+)\/pdf$/);
    if (adminInvoicePdfMatch && method === 'GET') return handleAdminInvoicePDF(request, env, adminInvoicePdfMatch[1]);

    const adminInvoicePaidMatch = path.match(/^\/api\/admin\/invoices\/([^/]+)\/paid$/);
    if (adminInvoicePaidMatch && method === 'PATCH') return handleAdminInvoicePaid(request, env, adminInvoicePaidMatch[1]);
```

- [ ] **Step 4: Test PDF generation locally**

Create a test lead and close it, then fetch the invoice PDF:

```bash
# Create a referral lead
curl -X POST http://localhost:8787/api/lead \
  -H "Content-Type: application/json" \
  -d '{"source":"referral","lead_name":"Client Co","lead_email":"client@test.com","referrer_name":"John Doe","referrer_email":"john@test.com","referrer_phone":"555-0100","need_type":"new_site"}'

# Close it (use the id from the response above)
curl -X PATCH http://localhost:8787/api/admin/leads/<LEAD_ID> \
  -H "X-Admin-Password: your-test-password" \
  -H "Content-Type: application/json" \
  -d '{"status":"closed_won","deal_amount":5000}'

# List invoices to get the invoice ID
curl http://localhost:8787/api/admin/invoices -H "X-Admin-Password: your-test-password"

# Download the PDF
curl http://localhost:8787/api/admin/invoices/<INVOICE_ID>/pdf \
  -H "X-Admin-Password: your-test-password" \
  -o test-invoice.pdf
```

Expected: `test-invoice.pdf` opens and shows a clean invoice with $5,000 deal, $500 commission, BEERS LABS LLC.

- [ ] **Step 5: Commit**

```bash
cd /Users/beers/Desktop/ranger-beers-api
git add src/pdf.js src/index.js package.json package-lock.json
git commit -m "feat: add invoice list, PDF generation, and mark-paid endpoints"
```

---

## Task 5: Deploy updated API

**Files:**
- No file changes — deployment only

- [ ] **Step 1: Deploy the Worker**

```bash
cd /Users/beers/Desktop/ranger-beers-api
npx wrangler deploy
```

Expected: `Published ranger-beers-api` with the new routes live.

- [ ] **Step 2: Verify production endpoints**

```bash
# Test lead submission
curl -X POST https://api.ranger-beers.com/api/lead \
  -H "Content-Type: application/json" \
  -d '{"source":"new_site","lead_name":"Smoke Test","lead_email":"smoke@test.com","need_type":"other"}'

# Should return 201 with success
```

Note: Replace `api.ranger-beers.com` with whatever custom domain the Worker uses, or use the `*.workers.dev` URL from the deploy output.

- [ ] **Step 3: Commit (no changes, just a checkpoint)**

Nothing to commit — this is a deploy step only.

---

## Task 6: Vendor SUMMON into the frontend

**Files:**
- Create: `/Users/beers/Desktop/Ranger-Beers/js/summon.js`
- Create: `/Users/beers/Desktop/Ranger-Beers/css/summon.css`

- [ ] **Step 1: Rebuild SUMMON with toned-down settings**

Before copying the build, we need to reduce intensity. Edit `/Users/beers/Projects/portfolio/summon/src/postprocessing.js` — change the bloom strength default:

```javascript
export const uniforms = {
  bloomStrength: uniform(0.4),       // was 1.0 — toned down for hero bg
  scanlineIntensity: uniform(0.0),   // was 0.08 — disabled for clean look
  flashIntensity: uniform(0.0),
};
```

Then rebuild:
```bash
cd /Users/beers/Projects/portfolio/summon
npm run build
```

- [ ] **Step 2: Copy the built JS bundle**

```bash
cp /Users/beers/Projects/portfolio/summon/dist/assets/index-*.js /Users/beers/Desktop/Ranger-Beers/js/summon.js
```

- [ ] **Step 3: Copy the built CSS**

```bash
cp /Users/beers/Projects/portfolio/summon/dist/assets/index-*.css /Users/beers/Desktop/Ranger-Beers/css/summon.css
```

- [ ] **Step 4: Verify the files exist and are non-trivial**

```bash
ls -la /Users/beers/Desktop/Ranger-Beers/js/summon.js
ls -la /Users/beers/Desktop/Ranger-Beers/css/summon.css
```

Expected: Both files exist, JS is several hundred KB (Three.js bundle).

- [ ] **Step 5: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add js/summon.js css/summon.css
git commit -m "feat: vendor SUMMON WebGPU scene for hero background"
```

---

## Task 7: Capture portfolio screenshots

**Files:**
- Create: `/Users/beers/Desktop/Ranger-Beers/images/portfolio/` (directory + 8 images)

- [ ] **Step 1: Create the portfolio directory**

```bash
mkdir -p /Users/beers/Desktop/Ranger-Beers/images/portfolio
```

- [ ] **Step 2: Capture screenshots of each portfolio site**

Use a headless browser or manual screenshots. Each should be 1200x800 or similar, saved as:

```
images/portfolio/boarhog.png
images/portfolio/gormers.png
images/portfolio/pomoborrow.png
images/portfolio/dittomethis.png
images/portfolio/killsesh.png
images/portfolio/rollick.png
images/portfolio/lootlens.png
images/portfolio/aurajam.png
```

If Playwright or Puppeteer is available:
```bash
npx playwright screenshot --viewport-size=1200,800 https://www.boarhogllc.com/ /Users/beers/Desktop/Ranger-Beers/images/portfolio/boarhog.png
npx playwright screenshot --viewport-size=1200,800 https://gormers.com/ /Users/beers/Desktop/Ranger-Beers/images/portfolio/gormers.png
npx playwright screenshot --viewport-size=1200,800 https://pomoborrow.com/ /Users/beers/Desktop/Ranger-Beers/images/portfolio/pomoborrow.png
npx playwright screenshot --viewport-size=1200,800 https://dittomethis.com/ /Users/beers/Desktop/Ranger-Beers/images/portfolio/dittomethis.png
npx playwright screenshot --viewport-size=1200,800 https://killsesh.com/ /Users/beers/Desktop/Ranger-Beers/images/portfolio/killsesh.png
npx playwright screenshot --viewport-size=1200,800 https://rollick.bet/ /Users/beers/Desktop/Ranger-Beers/images/portfolio/rollick.png
npx playwright screenshot --viewport-size=1200,800 https://lootlens.ai/ /Users/beers/Desktop/Ranger-Beers/images/portfolio/lootlens.png
npx playwright screenshot --viewport-size=1200,800 https://aurajam.com/ /Users/beers/Desktop/Ranger-Beers/images/portfolio/aurajam.png
```

If that doesn't work, take manual screenshots and place them in the directory.

- [ ] **Step 3: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add images/portfolio/
git commit -m "feat: add portfolio site screenshots"
```

---

## Task 8: Rewrite index.html — Homepage

**Files:**
- Rewrite: `/Users/beers/Desktop/Ranger-Beers/index.html`

- [ ] **Step 1: Write the new index.html**

Replace the entire contents of `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ranger Beers — I Build Websites</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/summon.css">
    <meta name="theme-color" content="#000000">
    <meta name="description" content="Ranger Beers — Army Ranger, Combat Medic, Website Builder. Need a site? Have a referral? Let's talk.">
</head>
<body>

    <!-- Top Bar -->
    <nav class="topbar">
        <a href="/" class="topbar-brand">RANGER BEERS</a>
        <a href="/admin.html" class="topbar-admin" id="topbar-admin" style="display:none;">Admin</a>
    </nav>

    <!-- SUMMON Hero Background -->
    <section class="hero" id="hero">
        <div id="summon-container" class="hero-bg"></div>
        <div class="hero-content">
            <h1 class="hero-title">RANGER BEERS</h1>
            <p class="hero-tagline">Army Ranger. Combat Medic. I build websites.</p>
            <div class="hero-buttons">
                <button class="hero-btn" data-flow="new_site">Need a site?</button>
                <button class="hero-btn" data-flow="existing_site">Have a site?</button>
                <button class="hero-btn hero-btn--referral" data-flow="referral">Have a referral?</button>
            </div>
        </div>
    </section>

    <!-- Modal Overlay for Forms -->
    <div class="modal-overlay" id="modal-overlay">
        <div class="modal" id="modal">
            <button class="modal-close" id="modal-close">&times;</button>
            <div class="modal-body" id="modal-body"></div>
        </div>
    </div>

    <!-- Portfolio -->
    <section class="portfolio" id="portfolio">
        <h2 class="portfolio-heading">BUILT BY RANGER BEERS</h2>
        <div class="portfolio-grid">
            <div class="portfolio-card" data-url="https://www.boarhogllc.com/" data-name="Boarhog LLC" data-desc="Defense contracting & technical services">
                <img src="images/portfolio/boarhog.png" alt="Boarhog LLC" loading="lazy">
                <span class="portfolio-card-name">Boarhog LLC</span>
            </div>
            <div class="portfolio-card" data-url="https://gormers.com/" data-name="Gormers" data-desc="AI knowledge ecosystem — personalized mini language models">
                <img src="images/portfolio/gormers.png" alt="Gormers" loading="lazy">
                <span class="portfolio-card-name">Gormers</span>
            </div>
            <div class="portfolio-card" data-url="https://pomoborrow.com/" data-name="PomoBorrow" data-desc="Zero-friction time tracking — privacy first">
                <img src="images/portfolio/pomoborrow.png" alt="PomoBorrow" loading="lazy">
                <span class="portfolio-card-name">PomoBorrow</span>
            </div>
            <div class="portfolio-card" data-url="https://dittomethis.com/" data-name="DittoMeThis" data-desc="URL analyzer & content replication planner">
                <img src="images/portfolio/dittomethis.png" alt="DittoMeThis" loading="lazy">
                <span class="portfolio-card-name">DittoMeThis</span>
            </div>
            <div class="portfolio-card" data-url="https://killsesh.com/" data-name="KillSesh" data-desc="Cybersecurity — remote session termination">
                <img src="images/portfolio/killsesh.png" alt="KillSesh" loading="lazy">
                <span class="portfolio-card-name">KillSesh</span>
            </div>
            <div class="portfolio-card" data-url="https://rollick.bet/" data-name="Rollick" data-desc="Multi-platform reseller command center">
                <img src="images/portfolio/rollick.png" alt="Rollick" loading="lazy">
                <span class="portfolio-card-name">Rollick</span>
            </div>
            <div class="portfolio-card" data-url="https://lootlens.ai/" data-name="LootLens" data-desc="AI-powered marketplace scanner & pricing">
                <img src="images/portfolio/lootlens.png" alt="LootLens" loading="lazy">
                <span class="portfolio-card-name">LootLens</span>
            </div>
            <div class="portfolio-card" data-url="https://aurajam.com/" data-name="AuraJam" data-desc="AI-powered DJ transition tool">
                <img src="images/portfolio/aurajam.png" alt="AuraJam" loading="lazy">
                <span class="portfolio-card-name">AuraJam</span>
            </div>
        </div>
    </section>

    <!-- Portfolio Lightbox -->
    <div class="lightbox" id="lightbox">
        <button class="lightbox-close" id="lightbox-close">&times;</button>
        <img class="lightbox-img" id="lightbox-img" alt="">
        <div class="lightbox-info">
            <h3 class="lightbox-name" id="lightbox-name"></h3>
            <p class="lightbox-desc" id="lightbox-desc"></p>
            <a class="lightbox-link" id="lightbox-link" href="#" target="_blank" rel="noopener">Visit Site &rarr;</a>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <p class="footer-copy">BEERS LABS LLC &copy; 2026</p>
    </footer>

    <script type="module" src="js/summon.js"></script>
    <script src="js/forms.js"></script>
    <script src="js/portfolio.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify the HTML is valid**

Open in browser: `open /Users/beers/Desktop/Ranger-Beers/index.html`

Expected: Page loads with structure visible (styles will be unstyled until Task 9).

- [ ] **Step 3: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add index.html
git commit -m "feat: rewrite index.html as personal brand + referral site"
```

---

## Task 9: Rewrite styles.css

**Files:**
- Rewrite: `/Users/beers/Desktop/Ranger-Beers/css/styles.css`

- [ ] **Step 1: Write the new stylesheet**

Replace the entire contents of `css/styles.css`:

```css
/* ── Reset & Variables ── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --gold: #C5B358;
  --gold-dim: rgba(197, 179, 88, 0.3);
  --gold-glow: rgba(197, 179, 88, 0.15);
  --bg: #000;
  --bg-card: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(197, 179, 88, 0.4);
  --text: #fff;
  --text-secondary: #aaa;
  --text-muted: #555;
  --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --radius: 12px;
  --max-w: 1200px;
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* ── Top Bar ── */
.topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}

.topbar-brand {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--gold);
  text-decoration: none;
}

.topbar-admin {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  letter-spacing: 1px;
  transition: color 0.3s;
}
.topbar-admin:hover { color: var(--gold); }

/* ── Hero ── */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-bg canvas {
  width: 100% !important;
  height: 100% !important;
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 24px;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 900;
  letter-spacing: 4px;
  color: var(--gold);
  text-shadow: 0 0 40px rgba(197, 179, 88, 0.3);
}

.hero-tagline {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: var(--text-secondary);
  margin-top: 12px;
  letter-spacing: 1px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 48px;
  flex-wrap: wrap;
}

.hero-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 16px 32px;
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s;
}

.hero-btn:hover {
  border-color: var(--gold);
  background: rgba(197, 179, 88, 0.08);
  color: var(--gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px var(--gold-glow);
}

.hero-btn--referral {
  border-color: var(--gold-dim);
  color: var(--gold);
}

/* ── Modal ── */
.modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  align-items: center;
  justify-content: center;
}

.modal-overlay.active {
  display: flex;
}

.modal {
  background: #0a0a0a;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 90%;
  max-width: 520px;
  padding: 40px;
  position: relative;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s;
}
.modal-close:hover { color: var(--gold); }

.modal-body h2 {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 24px;
  color: var(--gold);
}

.modal-body label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
  margin-top: 16px;
}

.modal-body input,
.modal-body select,
.modal-body textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  font-family: var(--font);
  font-size: 14px;
  color: var(--text);
  transition: border-color 0.3s;
}

.modal-body input:focus,
.modal-body select:focus,
.modal-body textarea:focus {
  outline: none;
  border-color: var(--gold);
}

.modal-body textarea { resize: vertical; min-height: 80px; }
.modal-body select { cursor: pointer; }
.modal-body select option { background: #0a0a0a; }

.modal-submit {
  width: 100%;
  margin-top: 24px;
  padding: 14px;
  background: var(--gold);
  color: #000;
  border: none;
  border-radius: 8px;
  font-family: var(--font);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 1px;
  cursor: pointer;
  transition: opacity 0.3s;
}
.modal-submit:hover { opacity: 0.85; }
.modal-submit:disabled { opacity: 0.4; cursor: not-allowed; }

.modal-success {
  text-align: center;
  padding: 20px 0;
}
.modal-success h2 { color: var(--gold); }
.modal-success p { color: var(--text-secondary); margin-top: 8px; }

.modal-calendly {
  margin-top: 16px;
  text-align: center;
}
.modal-calendly a {
  color: var(--gold);
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Portfolio ── */
.portfolio {
  position: relative;
  z-index: 10;
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 80px 24px 120px;
}

.portfolio-heading {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 4px;
  text-align: center;
  color: var(--gold);
  margin-bottom: 48px;
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.portfolio-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.portfolio-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}

.portfolio-card img {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  display: block;
  filter: brightness(0.85);
  transition: filter 0.3s;
}

.portfolio-card:hover img { filter: brightness(1); }

.portfolio-card-name {
  display: block;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text);
}

/* ── Lightbox ── */
.lightbox {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
}

.lightbox.active {
  display: flex;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 24px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 32px;
  cursor: pointer;
  transition: color 0.3s;
}
.lightbox-close:hover { color: var(--gold); }

.lightbox-img {
  max-width: 90%;
  max-height: 60vh;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  object-fit: contain;
}

.lightbox-info { text-align: center; }

.lightbox-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--text);
}

.lightbox-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.lightbox-link {
  display: inline-block;
  margin-top: 16px;
  color: var(--gold);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 1px;
  transition: opacity 0.3s;
}
.lightbox-link:hover { opacity: 0.7; }

/* ── Footer ── */
.footer {
  text-align: center;
  padding: 40px 24px;
  border-top: 1px solid var(--border);
}

.footer-copy {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 2px;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 560px) {
  .hero-buttons { flex-direction: column; align-items: center; }
  .hero-btn { width: 100%; max-width: 280px; }
  .portfolio-grid { grid-template-columns: 1fr; }
  .modal { padding: 24px; width: 95%; }
}
```

- [ ] **Step 2: Open in browser and verify**

```bash
open /Users/beers/Desktop/Ranger-Beers/index.html
```

Expected: Dark page, gold topbar brand, hero section centered, three buttons visible, portfolio grid below. SUMMON won't render yet (needs JS integration in Task 11) but layout should be correct.

- [ ] **Step 3: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add css/styles.css
git commit -m "feat: rewrite styles.css for personal brand layout"
```

---

## Task 10: Create forms.js — Three-button intake flows

**Files:**
- Create: `/Users/beers/Desktop/Ranger-Beers/js/forms.js`

- [ ] **Step 1: Write forms.js**

Create `/Users/beers/Desktop/Ranger-Beers/js/forms.js`:

```javascript
(function () {
  const API_BASE = 'https://ranger-beers-api.beers-labs.workers.dev'; // UPDATE to actual Worker URL
  const CALENDLY_URL = 'https://calendly.com/rangerbeers'; // UPDATE to actual Calendly link

  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  const closeBtn = document.getElementById('modal-close');

  // Flow definitions
  const flows = {
    new_site: {
      title: 'Need a site?',
      fields: [
        { name: 'business_name', label: 'Business Name', type: 'text', required: true },
        { name: 'need_type', label: 'What do you need?', type: 'select', required: true, options: [
          { value: '', text: 'Select one...' },
          { value: 'new_site', text: 'New website' },
          { value: 'landing_page', text: 'Landing page' },
          { value: 'web_app', text: 'Web app' },
          { value: 'ecommerce', text: 'E-commerce' },
          { value: 'other', text: 'Other' },
        ]},
        { name: 'lead_name', label: 'Your Name', type: 'text', required: true },
        { name: 'lead_email', label: 'Email', type: 'email', required: true },
        { name: 'lead_phone', label: 'Phone', type: 'tel', required: false },
      ],
      successMsg: "Got it. I'll be in touch.",
    },
    existing_site: {
      title: 'Have a site?',
      fields: [
        { name: 'site_url', label: 'Your Site URL', type: 'url', required: true },
        { name: 'description', label: "What's wrong / what do you want?", type: 'textarea', required: true },
        { name: 'lead_name', label: 'Your Name', type: 'text', required: true },
        { name: 'lead_email', label: 'Email', type: 'email', required: true },
        { name: 'lead_phone', label: 'Phone', type: 'tel', required: false },
      ],
      successMsg: "Got it. I'll take a look.",
    },
    referral: {
      title: 'Have a referral?',
      fields: [
        { name: 'referrer_name', label: 'Your Name', type: 'text', required: true },
        { name: 'referrer_email', label: 'Your Email', type: 'email', required: true },
        { name: 'referrer_phone', label: 'Your Phone', type: 'tel', required: false },
        { name: 'lead_name', label: "Their Name", type: 'text', required: true },
        { name: 'lead_email', label: "Their Email", type: 'email', required: true },
        { name: 'lead_phone', label: "Their Phone", type: 'tel', required: false },
        { name: 'need_type', label: 'What do they need?', type: 'select', required: true, options: [
          { value: '', text: 'Select one...' },
          { value: 'new_site', text: 'New website' },
          { value: 'landing_page', text: 'Landing page' },
          { value: 'web_app', text: 'Web app' },
          { value: 'ecommerce', text: 'E-commerce' },
          { value: 'other', text: 'Other' },
        ]},
      ],
      successMsg: "Locked in. You'll get 10% when the deal closes.",
    },
  };

  function renderForm(flowKey) {
    const flow = flows[flowKey];
    let html = `<h2>${flow.title}</h2><form id="intake-form">`;

    for (const field of flow.fields) {
      html += `<label for="field-${field.name}">${field.label}${field.required ? '' : ' (optional)'}</label>`;

      if (field.type === 'select') {
        html += `<select id="field-${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>`;
        for (const opt of field.options) {
          html += `<option value="${opt.value}">${opt.text}</option>`;
        }
        html += '</select>';
      } else if (field.type === 'textarea') {
        html += `<textarea id="field-${field.name}" name="${field.name}" ${field.required ? 'required' : ''}></textarea>`;
      } else {
        html += `<input id="field-${field.name}" name="${field.name}" type="${field.type}" ${field.required ? 'required' : ''}>`;
      }
    }

    html += `<button type="submit" class="modal-submit">Submit</button>`;
    html += `<div class="modal-calendly"><a href="${CALENDLY_URL}" target="_blank" rel="noopener">Or book a call instead</a></div>`;
    html += '</form>';

    modalBody.innerHTML = html;

    document.getElementById('intake-form').addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm(flowKey, this);
    });
  }

  async function submitForm(flowKey, form) {
    const btn = form.querySelector('.modal-submit');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const data = { source: flowKey };
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
      if (value) data[key] = value;
    }

    try {
      const res = await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Submission failed');

      modalBody.innerHTML = `
        <div class="modal-success">
          <h2>Roger that.</h2>
          <p>${flows[flowKey].successMsg}</p>
        </div>
      `;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Submit';
      alert('Something went wrong. Try again.');
    }
  }

  function openModal(flowKey) {
    renderForm(flowKey);
    overlay.classList.add('active');
  }

  function closeModal() {
    overlay.classList.remove('active');
  }

  // Bind hero buttons
  document.querySelectorAll('.hero-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(this.dataset.flow);
    });
  });

  // Close modal
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
```

- [ ] **Step 2: Verify in browser**

Open `index.html`, click each of the three buttons. Expected:
- "Need a site?" shows business name, need type dropdown, name/email/phone, submit, and Calendly link
- "Have a site?" shows URL, description textarea, name/email/phone
- "Have a referral?" shows your info fields, then their info fields, then need type dropdown
- Escape or clicking outside closes the modal

- [ ] **Step 3: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add js/forms.js
git commit -m "feat: add three-button intake form modal system"
```

---

## Task 11: Create portfolio.js — Grid + lightbox

**Files:**
- Create: `/Users/beers/Desktop/Ranger-Beers/js/portfolio.js`

- [ ] **Step 1: Write portfolio.js**

Create `/Users/beers/Desktop/Ranger-Beers/js/portfolio.js`:

```javascript
(function () {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxName = document.getElementById('lightbox-name');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxLink = document.getElementById('lightbox-link');
  const lightboxClose = document.getElementById('lightbox-close');

  document.querySelectorAll('.portfolio-card').forEach(function (card) {
    card.addEventListener('click', function () {
      const img = this.querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = this.dataset.name;
      lightboxName.textContent = this.dataset.name;
      lightboxDesc.textContent = this.dataset.desc;
      lightboxLink.href = this.dataset.url;
      lightbox.classList.add('active');
    });
  });

  lightboxClose.addEventListener('click', function () {
    lightbox.classList.remove('active');
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') lightbox.classList.remove('active');
  });
})();
```

- [ ] **Step 2: Verify in browser**

Click a portfolio card. Expected: lightbox opens with larger image, name, description, and "Visit Site" link. Escape or clicking outside closes it.

- [ ] **Step 3: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add js/portfolio.js
git commit -m "feat: add portfolio lightbox interaction"
```

---

## Task 12: Integrate SUMMON as hero background

**Files:**
- Modify: `/Users/beers/Projects/portfolio/summon/src/main.js` (temporarily, for rebuild)
- Modify: `/Users/beers/Desktop/Ranger-Beers/js/summon.js` (re-vendor after rebuild)

The vendored SUMMON bundle expects its own HTML structure (entry screen, canvas container, etc.). We need to adapt it to mount into our `#summon-container` div instead.

- [ ] **Step 1: Modify SUMMON's main.js to export an init function**

Edit `/Users/beers/Projects/portfolio/summon/src/main.js`. Change the auto-init to an exported function:

Replace the `init()` call at the bottom of the file with:

```javascript
// Export for external use
export function mountSummon(container) {
  const canvasContainer = container || document.getElementById('canvas-container');
  if (!canvasContainer) return;

  // Override the canvas container lookup
  const origGetById = document.getElementById.bind(document);
  document.getElementById = function(id) {
    if (id === 'canvas-container') return canvasContainer;
    if (id === 'entry-screen') return null; // skip entry screen
    if (id === 'enter-btn') return null;
    return origGetById(id);
  };

  init().then(() => {
    document.getElementById = origGetById; // restore
    // Auto-start (skip the entry screen click)
    onEnter();
  });
}

// Auto-init if standalone
if (document.getElementById('canvas-container')) {
  init();
}
```

- [ ] **Step 2: Rebuild SUMMON**

```bash
cd /Users/beers/Projects/portfolio/summon
npm run build
```

- [ ] **Step 3: Re-vendor the built files**

```bash
cp /Users/beers/Projects/portfolio/summon/dist/assets/index-*.js /Users/beers/Desktop/Ranger-Beers/js/summon.js
cp /Users/beers/Projects/portfolio/summon/dist/assets/index-*.css /Users/beers/Desktop/Ranger-Beers/css/summon.css
```

- [ ] **Step 4: Add a small bootstrap script to index.html**

Add this right before the closing `</body>` tag in `index.html`, replacing the existing `<script type="module" src="js/summon.js"></script>` line:

```html
<script type="module">
  import { mountSummon } from './js/summon.js';
  const container = document.getElementById('summon-container');
  if (container) mountSummon(container);
</script>
```

- [ ] **Step 5: Verify in browser (Chrome 113+)**

Open `index.html` in Chrome. Expected: SUMMON's dithered gold WebGPU scene renders behind the hero text. Subtle fluid sim responds to mouse. No entry screen — it auto-plays.

Note: If WebGPU is not available, the hero will just be a black background — acceptable fallback.

- [ ] **Step 6: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add js/summon.js css/summon.css index.html
git commit -m "feat: integrate SUMMON WebGPU as hero background"
```

---

## Task 13: Create admin.html + admin.js

**Files:**
- Create: `/Users/beers/Desktop/Ranger-Beers/admin.html`
- Create: `/Users/beers/Desktop/Ranger-Beers/js/admin.js`

- [ ] **Step 1: Write admin.html**

Create `/Users/beers/Desktop/Ranger-Beers/admin.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin — Ranger Beers</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <style>
        .admin-gate {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .admin-gate-form {
            text-align: center;
        }
        .admin-gate-form h1 {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 3px;
            color: var(--gold);
            margin-bottom: 24px;
        }
        .admin-gate-form input {
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            font-family: var(--font);
            font-size: 14px;
            color: var(--text);
            width: 280px;
            text-align: center;
        }
        .admin-gate-form input:focus {
            outline: none;
            border-color: var(--gold);
        }
        .admin-gate-form button {
            display: block;
            margin: 16px auto 0;
            background: var(--gold);
            color: #000;
            border: none;
            border-radius: 8px;
            padding: 10px 32px;
            font-family: var(--font);
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 1px;
            cursor: pointer;
        }

        /* Dashboard */
        .admin-dash { display: none; padding: 80px 24px 40px; max-width: var(--max-w); margin: 0 auto; }
        .admin-dash.active { display: block; }

        .admin-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 32px;
        }
        .admin-tab {
            background: none;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            padding: 8px 20px;
            border-radius: 8px;
            font-family: var(--font);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            letter-spacing: 0.5px;
            transition: all 0.3s;
        }
        .admin-tab.active {
            border-color: var(--gold);
            color: var(--gold);
            background: rgba(197,179,88,0.08);
        }

        /* Lead list */
        .lead-table { width: 100%; border-collapse: collapse; }
        .lead-table th {
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--text-muted);
            padding: 8px 12px;
            border-bottom: 1px solid var(--border);
        }
        .lead-table td {
            padding: 12px;
            font-size: 13px;
            color: var(--text-secondary);
            border-bottom: 1px solid var(--border);
            cursor: pointer;
        }
        .lead-table tr:hover td { color: var(--text); }

        .source-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .source-pill--new_site { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .source-pill--existing_site { background: rgba(168,85,247,0.15); color: #a855f7; }
        .source-pill--referral { background: rgba(197,179,88,0.15); color: var(--gold); }

        .status-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .status-pill--new { background: rgba(255,255,255,0.08); color: var(--text-secondary); }
        .status-pill--contacted { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .status-pill--closed_won { background: rgba(34,197,94,0.15); color: #22c55e; }
        .status-pill--closed_lost { background: rgba(239,68,68,0.15); color: #ef4444; }

        /* Lead detail panel */
        .lead-detail {
            display: none;
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 24px;
            margin-bottom: 24px;
        }
        .lead-detail.active { display: block; }
        .lead-detail h3 { color: var(--gold); font-size: 16px; margin-bottom: 16px; }
        .lead-detail p { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
        .lead-detail p strong { color: var(--text); }

        .lead-actions {
            margin-top: 16px;
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }
        .lead-actions select,
        .lead-actions input {
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 8px 12px;
            font-family: var(--font);
            font-size: 13px;
            color: var(--text);
        }
        .lead-actions select option { background: #0a0a0a; }
        .lead-actions button {
            background: var(--gold);
            color: #000;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-family: var(--font);
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
        }

        /* Invoice list */
        .invoice-table { width: 100%; border-collapse: collapse; }
        .invoice-table th {
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--text-muted);
            padding: 8px 12px;
            border-bottom: 1px solid var(--border);
        }
        .invoice-table td {
            padding: 12px;
            font-size: 13px;
            color: var(--text-secondary);
            border-bottom: 1px solid var(--border);
        }
        .invoice-table .amt { color: var(--gold); font-weight: 700; }

        .invoice-actions { display: flex; gap: 8px; }
        .invoice-actions a,
        .invoice-actions button {
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
        }
        .invoice-actions a {
            color: var(--gold);
            border: 1px solid var(--gold-dim);
        }
        .invoice-actions button {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border: 1px solid rgba(34,197,94,0.3);
            font-family: var(--font);
        }
    </style>
</head>
<body>

    <nav class="topbar">
        <a href="/" class="topbar-brand">RANGER BEERS</a>
        <a href="/" class="topbar-admin">Home</a>
    </nav>

    <!-- Login Gate -->
    <div class="admin-gate" id="admin-gate">
        <div class="admin-gate-form">
            <h1>ADMIN</h1>
            <input type="password" id="admin-password" placeholder="Password" autofocus>
            <button id="admin-login">Enter</button>
        </div>
    </div>

    <!-- Dashboard -->
    <div class="admin-dash" id="admin-dash">
        <div class="admin-tabs">
            <button class="admin-tab active" data-tab="leads">Leads</button>
            <button class="admin-tab" data-tab="invoices">Invoices</button>
        </div>

        <div id="tab-leads">
            <div class="lead-detail" id="lead-detail"></div>
            <table class="lead-table">
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody id="lead-list"></tbody>
            </table>
        </div>

        <div id="tab-invoices" style="display:none;">
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Referrer</th>
                        <th>Client</th>
                        <th>Deal</th>
                        <th>Commission</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="invoice-list"></tbody>
            </table>
        </div>
    </div>

    <script src="js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write admin.js**

Create `/Users/beers/Desktop/Ranger-Beers/js/admin.js`:

```javascript
(function () {
  const API_BASE = 'https://ranger-beers-api.beers-labs.workers.dev'; // UPDATE to actual Worker URL
  let adminPassword = '';

  const gate = document.getElementById('admin-gate');
  const dash = document.getElementById('admin-dash');
  const passwordInput = document.getElementById('admin-password');
  const loginBtn = document.getElementById('admin-login');
  const leadList = document.getElementById('lead-list');
  const invoiceList = document.getElementById('invoice-list');
  const leadDetail = document.getElementById('lead-detail');

  function headers() {
    return {
      'Content-Type': 'application/json',
      'X-Admin-Password': adminPassword,
    };
  }

  // Login
  async function login() {
    adminPassword = passwordInput.value;
    try {
      const res = await fetch(`${API_BASE}/api/admin/leads`, { headers: headers() });
      if (!res.ok) throw new Error();
      gate.style.display = 'none';
      dash.classList.add('active');
      sessionStorage.setItem('rb-admin', adminPassword);
      loadLeads();
    } catch (e) {
      alert('Wrong password');
      adminPassword = '';
    }
  }

  loginBtn.addEventListener('click', login);
  passwordInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') login();
  });

  // Auto-login from session
  const saved = sessionStorage.getItem('rb-admin');
  if (saved) {
    passwordInput.value = saved;
    login();
  }

  // Tabs
  document.querySelectorAll('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      const target = this.dataset.tab;
      document.getElementById('tab-leads').style.display = target === 'leads' ? 'block' : 'none';
      document.getElementById('tab-invoices').style.display = target === 'invoices' ? 'block' : 'none';
      if (target === 'invoices') loadInvoices();
    });
  });

  // Load leads
  async function loadLeads() {
    const res = await fetch(`${API_BASE}/api/admin/leads`, { headers: headers() });
    const data = await res.json();
    leadList.innerHTML = '';
    leadDetail.classList.remove('active');

    for (const lead of data.leads) {
      const tr = document.createElement('tr');
      const date = new Date(lead.created_at).toLocaleDateString();
      tr.innerHTML = `
        <td><span class="source-pill source-pill--${lead.source}">${lead.source.replace('_', ' ')}</span></td>
        <td>${lead.lead_name}</td>
        <td>${lead.lead_email}</td>
        <td><span class="status-pill status-pill--${lead.status}">${lead.status.replace('_', ' ')}</span></td>
        <td>${date}</td>
      `;
      tr.addEventListener('click', function () { showDetail(lead); });
      leadList.appendChild(tr);
    }
  }

  // Show lead detail
  function showDetail(lead) {
    let html = `<h3>${lead.lead_name}</h3>`;
    html += `<p><strong>Source:</strong> ${lead.source.replace('_', ' ')}</p>`;
    html += `<p><strong>Email:</strong> ${lead.lead_email}</p>`;
    if (lead.lead_phone) html += `<p><strong>Phone:</strong> ${lead.lead_phone}</p>`;
    if (lead.business_name) html += `<p><strong>Business:</strong> ${lead.business_name}</p>`;
    if (lead.site_url) html += `<p><strong>Site:</strong> <a href="${lead.site_url}" target="_blank" style="color:var(--gold)">${lead.site_url}</a></p>`;
    if (lead.need_type) html += `<p><strong>Need:</strong> ${lead.need_type.replace('_', ' ')}</p>`;
    if (lead.description) html += `<p><strong>Description:</strong> ${lead.description}</p>`;
    if (lead.referrer_name) html += `<p><strong>Referrer:</strong> ${lead.referrer_name} (${lead.referrer_email})</p>`;
    if (lead.deal_amount) html += `<p><strong>Deal:</strong> $${lead.deal_amount.toLocaleString()}</p>`;

    html += `<div class="lead-actions">
      <select id="detail-status">
        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
        <option value="closed_won" ${lead.status === 'closed_won' ? 'selected' : ''}>Closed Won</option>
        <option value="closed_lost" ${lead.status === 'closed_lost' ? 'selected' : ''}>Closed Lost</option>
      </select>
      <input type="number" id="detail-amount" placeholder="Deal amount" value="${lead.deal_amount || ''}" step="0.01">
      <button id="detail-save">Save</button>
    </div>`;

    leadDetail.innerHTML = html;
    leadDetail.classList.add('active');

    document.getElementById('detail-save').addEventListener('click', async function () {
      const status = document.getElementById('detail-status').value;
      const deal_amount = parseFloat(document.getElementById('detail-amount').value) || null;

      const res = await fetch(`${API_BASE}/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status, deal_amount }),
      });

      if (res.ok) {
        loadLeads();
      } else {
        alert('Update failed');
      }
    });
  }

  // Load invoices
  async function loadInvoices() {
    const res = await fetch(`${API_BASE}/api/admin/invoices`, { headers: headers() });
    const data = await res.json();
    invoiceList.innerHTML = '';

    for (const inv of data.invoices) {
      const tr = document.createElement('tr');
      const date = new Date(inv.created_at).toLocaleDateString();
      tr.innerHTML = `
        <td>${inv.referrer_name}</td>
        <td>${inv.lead_name}</td>
        <td class="amt">$${inv.deal_amount.toLocaleString()}</td>
        <td class="amt">$${inv.commission.toLocaleString()}</td>
        <td><span class="status-pill status-pill--${inv.status === 'paid' ? 'closed_won' : 'new'}">${inv.status}</span></td>
        <td>${date}</td>
        <td class="invoice-actions">
          <a href="${API_BASE}/api/admin/invoices/${inv.id}/pdf" target="_blank">PDF</a>
          ${inv.status === 'unpaid' ? `<button data-id="${inv.id}">Mark Paid</button>` : ''}
        </td>
      `;
      invoiceList.appendChild(tr);
    }

    // Bind mark-paid buttons
    invoiceList.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const res = await fetch(`${API_BASE}/api/admin/invoices/${this.dataset.id}/paid`, {
          method: 'PATCH',
          headers: headers(),
        });
        if (res.ok) loadInvoices();
      });
    });
  }
})();
```

- [ ] **Step 3: Verify in browser**

Open `admin.html`. Expected:
- Password gate appears
- Enter password → leads table loads
- Click a lead → detail panel expands with status dropdown, deal amount, save button
- Switch to Invoices tab → shows invoice list with PDF links and mark-paid buttons

- [ ] **Step 4: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add admin.html js/admin.js
git commit -m "feat: add admin dashboard with lead tracking and invoice management"
```

---

## Task 14: Clean up old files

**Files:**
- Delete: Old HTML pages, old JS, old CSS

- [ ] **Step 1: Remove old pages**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git rm about.html auth-callback.html courses.html faq.html inventory.html leaderboard.html pricing.html resources.html shop.html standards.html
```

- [ ] **Step 2: Remove old JS files**

```bash
git rm js/config.js js/course-auth.js js/course-engine.js js/gear-data.js js/gear-modal.js js/shared.js js/sw.js
```

- [ ] **Step 3: Remove old CSS files**

```bash
git rm css/course-styles.css css/school-landing.css
```

- [ ] **Step 4: Remove manifest and service worker references**

```bash
git rm manifest.json
```

- [ ] **Step 5: Do NOT remove school subdirectories yet**

Keep the school subdirectories (`ranger/`, `sapper/`, etc.) for now — they may still get traffic and we can redirect or archive them later. This avoids breaking existing links.

- [ ] **Step 6: Commit**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git commit -m "chore: remove old military hub pages and assets"
```

---

## Task 15: Update API_BASE URLs and deploy

**Files:**
- Modify: `/Users/beers/Desktop/Ranger-Beers/js/forms.js`
- Modify: `/Users/beers/Desktop/Ranger-Beers/js/admin.js`

- [ ] **Step 1: Get the actual Worker URL**

```bash
cd /Users/beers/Desktop/ranger-beers-api
npx wrangler whoami && cat wrangler.toml
```

The Worker URL will be something like `https://ranger-beers-api.<account>.workers.dev` or a custom domain. Use whatever is in the deploy output from Task 5.

- [ ] **Step 2: Update API_BASE in forms.js**

Replace the placeholder:
```javascript
const API_BASE = 'https://ranger-beers-api.beers-labs.workers.dev';
```
with the actual URL.

- [ ] **Step 3: Update API_BASE in admin.js**

Same replacement.

- [ ] **Step 4: Update CALENDLY_URL in forms.js**

Replace:
```javascript
const CALENDLY_URL = 'https://calendly.com/rangerbeers';
```
with your actual Calendly link (or leave as placeholder if you haven't set one up yet).

- [ ] **Step 5: Commit and push**

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add js/forms.js js/admin.js
git commit -m "feat: set production API URL and Calendly link"
git push origin main
```

Expected: GitHub Pages deploys automatically. Site goes live at ranger-beers.com within 1-2 minutes.

- [ ] **Step 6: Smoke test production**

1. Visit `ranger-beers.com` — verify hero, three buttons, portfolio grid
2. Click "Need a site?" — fill out form, submit — verify it hits the API
3. Visit `ranger-beers.com/admin.html` — log in, verify the lead appears
4. Click "Have a referral?" — submit a referral lead
5. In admin, close the referral deal with a dollar amount — verify invoice auto-generates
6. Check Invoices tab — view the PDF

---

## Task Summary

| Task | Description | Est. |
|------|-------------|------|
| 1 | D1 schema — leads + invoices tables | 3 min |
| 2 | API — lead submission endpoint | 5 min |
| 3 | API — admin auth + lead CRUD | 5 min |
| 4 | API — invoice endpoints + PDF gen | 5 min |
| 5 | Deploy updated API | 2 min |
| 6 | Vendor SUMMON into frontend | 5 min |
| 7 | Capture portfolio screenshots | 5 min |
| 8 | Rewrite index.html | 5 min |
| 9 | Rewrite styles.css | 3 min |
| 10 | Create forms.js | 5 min |
| 11 | Create portfolio.js | 3 min |
| 12 | Integrate SUMMON as hero bg | 5 min |
| 13 | Create admin dashboard | 5 min |
| 14 | Clean up old files | 3 min |
| 15 | Update URLs and deploy | 3 min |
