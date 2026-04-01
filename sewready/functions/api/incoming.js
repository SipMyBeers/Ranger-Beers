// GET /api/incoming?shop=slug
// POST /api/incoming { shop_slug, ...data }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return json({ error: 'shop is required' }, 400);

  const db = context.env.DB;
  const result = await db.prepare(
    'SELECT * FROM incoming_orders WHERE shop_slug = ? ORDER BY created_at DESC'
  ).bind(shop).all();

  const items = result.results.map(row => {
    try { return JSON.parse(row.data); } catch { return row; }
  });

  return json(items);
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const shop = body.shop_slug;
  if (!shop) return json({ error: 'shop_slug is required' }, 400);

  const db = context.env.DB;
  const id = body.id || ('INC-' + Date.now());

  await db.prepare(
    `INSERT OR REPLACE INTO incoming_orders (id, shop_slug, status, customer, phone, email, data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, shop,
    body.status || 'pending',
    body.customer || null,
    body.phone || null,
    body.email || null,
    JSON.stringify(body),
    body.createdAt || new Date().toISOString()
  ).run();

  return json({ ok: true, id });
}
