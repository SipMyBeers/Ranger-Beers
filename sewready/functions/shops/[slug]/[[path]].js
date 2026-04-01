// Dynamic shop serving — serves any /shops/:slug/* from D1 + aaa-tailor template
// Static shops (with actual files) take priority in Cloudflare Pages,
// so this only fires for shops that don't have static folders.

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

  const esc = (s) => (s || '').replace(/'/g, "\\'");

  return `// ══════════════════════════════════════════════════════════════
//  ${esc(shop.name)} — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: '${esc(shop.tier)}',
  vertical: '${esc(shop.vertical || 'sewing')}',
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

export async function onRequest(context) {
  const { params, env } = context;
  const slug = params.slug;
  const pathParts = params.path || [];
  let path = pathParts.join('/') || 'customer.html';

  // Check if this shop has static files deployed.
  // Try fetching the static shop-config.js — if it exists, this is a static shop
  // and we should let Cloudflare Pages serve the static files as-is.
  const staticCheckUrl = new URL(context.request.url);
  staticCheckUrl.pathname = `/shops/${slug}/shop-config.js`;
  const staticCheck = await env.ASSETS.fetch(new Request(staticCheckUrl.toString()));
  if (staticCheck.ok) {
    // Static shop — serve from static files, not D1
    return context.next();
  }

  // No static files — look up shop in D1
  const shop = await env.DB.prepare(
    'SELECT * FROM shops WHERE slug = ? AND active = 1'
  ).bind(slug).first();

  // Not found in D1 either — 404
  if (!shop) return context.next();

  // Parse config if needed
  if (shop.config && typeof shop.config === 'string') {
    try { shop.config = JSON.parse(shop.config); } catch {}
  }

  // Serve shop-config.js dynamically from D1
  if (path === 'shop-config.js') {
    return new Response(generateShopConfig(shop), {
      headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' },
    });
  }

  // For non-HTML assets (css, js, images), fall through to static files
  // These are shared assets referenced via relative paths (../../styles.css)
  if (!path.endsWith('.html')) {
    return context.next();
  }

  // Fetch the template HTML from aaa-tailor via ASSETS binding
  const templateUrl = new URL(context.request.url);
  templateUrl.pathname = `/shops/${TEMPLATE_SHOP}/${path}`;

  const templateResponse = await env.ASSETS.fetch(new Request(templateUrl.toString(), {
    headers: context.request.headers,
  }));

  if (!templateResponse.ok) {
    return context.next(); // template file doesn't exist
  }

  let html = await templateResponse.text();

  // Inject shop config script before </head>
  const configScript = `<script>\n${generateShopConfig(shop)}\n</script>`;
  html = html.replace('</head>', `${configScript}\n</head>`);

  // Swap services/inventory data files based on vertical
  const vertical = shop.vertical || 'sewing';
  if (vertical === 'surplus') {
    html = html.replace('../../services-data.js', '../../services-data-surplus.js');
    html = html.replace('../../inventory-data.js', '../../inventory-data-surplus.js');
  } else if (vertical === 'smoke') {
    html = html.replace('../../services-data.js', '../../services-data-smoke.js');
    html = html.replace('../../inventory-data.js', '../../inventory-data-smoke.js');
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
