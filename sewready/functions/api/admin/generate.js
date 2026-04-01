// POST /api/admin/generate
// Body: { slug }
// Generates shop files via GitHub API and commits them to the repo

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// HTML files to copy from template shop
const HTML_FILES = [
  'index.html', 'customer.html', 'orders.html', 'employee.html',
  'incoming.html', 'calendar.html', 'services.html', 'inventory.html',
  'settings.html', 'sop-library.html'
];

const TEMPLATE_SHOP = 'aaa-tailor';

function generateShopConfig(shop) {
  const config = shop.config ? (typeof shop.config === 'string' ? JSON.parse(shop.config) : shop.config) : {};
  const employees = config.employees || [
    {
      id: 'emp-1',
      name: shop.owner || 'Owner',
      role: 'Owner',
      color: shop.theme_primary || '#a855f7',
      schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'18:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:{start:'10:00',end:'15:00'} }
    }
  ];

  const shopHours = config.shopHours || {
    0: null,
    1: { start: '09:00', end: '18:00' },
    2: { start: '09:00', end: '18:00' },
    3: { start: '09:00', end: '18:00' },
    4: { start: '09:00', end: '18:00' },
    5: { start: '09:00', end: '18:00' },
    6: { start: '10:00', end: '15:00' }
  };

  const story = config.story || shop.tagline || '';
  const trustSignals = config.trustSignals || { orders: '0', rating: '5.0' };

  // Escape single quotes in strings
  const esc = (s) => (s || '').replace(/'/g, "\\'");

  return `// ══════════════════════════════════════════════════════════════
//  ${esc(shop.name)} — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: '${esc(shop.tier)}',
  slug: '${esc(shop.slug)}',
  name: '${esc(shop.name)}',
  tagline: '${esc(shop.tagline || '')}',
  address: '${esc(shop.address || '')}',
  phone: '${esc(shop.phone || '')}',
  email: '${esc(shop.email || '')}',
  owner: '${esc(shop.owner || '')}',
  themeColors: {
    primary: '${shop.theme_primary || '#a855f7'}',
    secondary: '${shop.theme_secondary || '#1c2833'}',
    accent: '${shop.theme_accent || '#06b6d4'}'
  },
  story: '${esc(story)}',
  trustSignals: {
    orders: '${esc(trustSignals.orders)}',
    rating: '${esc(trustSignals.rating)}'
  },
  enabledServiceIds: null,
  adminPassword: '${shop.admin_password || Math.random().toString(36).slice(2, 8)}'
};

const employees = ${JSON.stringify(employees, null, 2)};

const shopHours = ${JSON.stringify(shopHours, null, 2)};

const closedDates = [];
const sharedOrders = [];

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function formatTime(str) {
  const [h, m] = str.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return hr + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function parseDuration(durStr) {
  const match = durStr.match(/(\\d+)/);
  return match ? parseInt(match[1], 10) : 30;
}

function isDayClosed(dateStr) {
  if (closedDates.includes(dateStr)) return true;
  const d = new Date(dateStr + 'T00:00:00');
  return !shopHours[d.getDay()];
}
`;
}

async function githubApi(env, method, path, body) {
  const resp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SewReady-Admin',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return resp;
}

async function getFileContent(env, filePath) {
  const resp = await githubApi(env, 'GET', `/contents/${filePath}`);
  if (!resp.ok) return null;
  const data = await resp.json();
  // Content is base64 encoded
  return data.content;
}

async function getFileSha(env, filePath) {
  const resp = await githubApi(env, 'GET', `/contents/${filePath}`);
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.sha;
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const { slug } = body;
  const env = context.env;

  if (!slug) return json({ error: 'slug is required' }, 400);
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return json({ error: 'GitHub integration not configured' }, 500);
  }

  // Fetch shop from D1
  const shop = await env.DB.prepare('SELECT * FROM shops WHERE slug = ?').bind(slug).first();
  if (!shop) return json({ error: 'Shop not found in database' }, 404);

  // Parse config if string
  if (shop.config && typeof shop.config === 'string') {
    try { shop.config = JSON.parse(shop.config); } catch {}
  }

  try {
    // 1. Get the latest commit SHA for the default branch
    const refResp = await githubApi(env, 'GET', '/git/ref/heads/main');
    if (!refResp.ok) {
      const refData = await refResp.json();
      return json({ error: 'Could not get main branch ref', detail: refData.message }, 500);
    }
    const refData = await refResp.json();
    const latestCommitSha = refData.object.sha;

    // 2. Get the base tree
    const commitResp = await githubApi(env, 'GET', `/git/commits/${latestCommitSha}`);
    const commitData = await commitResp.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Collect all files to create
    const treeItems = [];

    // Generate shop-config.js
    const configContent = generateShopConfig(shop);
    treeItems.push({
      path: `shops/${slug}/shop-config.js`,
      mode: '100644',
      type: 'blob',
      content: configContent
    });

    // Copy HTML files from template shop
    for (const htmlFile of HTML_FILES) {
      const templateContent = await getFileContent(env, `shops/${TEMPLATE_SHOP}/${htmlFile}`);
      if (templateContent) {
        treeItems.push({
          path: `shops/${slug}/${htmlFile}`,
          mode: '100644',
          type: 'blob',
          content: atob(templateContent.replace(/\n/g, ''))
        });
      }
    }

    // 4. Update _redirects — append new shop lines
    const redirectsContent = await getFileContent(env, '_redirects');
    if (redirectsContent) {
      const currentRedirects = atob(redirectsContent.replace(/\n/g, ''));
      const newLines = `/shops/${slug}/ /shops/${slug}/customer.html 200\n/shops/${slug} /shops/${slug}/customer.html 301\n`;

      // Only add if not already present
      if (!currentRedirects.includes(`/shops/${slug}/`)) {
        treeItems.push({
          path: '_redirects',
          mode: '100644',
          type: 'blob',
          content: currentRedirects.trimEnd() + '\n' + newLines
        });
      }
    }

    // 5. Create tree
    const treeResp = await githubApi(env, 'POST', '/git/trees', {
      base_tree: baseTreeSha,
      tree: treeItems
    });

    if (!treeResp.ok) {
      const treeData = await treeResp.json();
      return json({ error: 'Failed to create tree', detail: treeData.message }, 500);
    }
    const treeData = await treeResp.json();

    // 6. Create commit
    const newCommitResp = await githubApi(env, 'POST', '/git/commits', {
      message: `Add shop: ${shop.name} (${slug})`,
      tree: treeData.sha,
      parents: [latestCommitSha]
    });

    if (!newCommitResp.ok) {
      const commitErr = await newCommitResp.json();
      return json({ error: 'Failed to create commit', detail: commitErr.message }, 500);
    }
    const newCommit = await newCommitResp.json();

    // 7. Update ref
    const updateRefResp = await githubApi(env, 'PATCH', '/git/refs/heads/main', {
      sha: newCommit.sha
    });

    if (!updateRefResp.ok) {
      const refErr = await updateRefResp.json();
      return json({ error: 'Failed to update ref', detail: refErr.message }, 500);
    }

    return json({
      ok: true,
      slug,
      commit: newCommit.sha,
      files: treeItems.map(t => t.path),
      message: `Shop "${shop.name}" files committed. Site will deploy in ~2 minutes.`
    });

  } catch (err) {
    return json({ error: 'Generation failed', detail: err.message }, 500);
  }
}
