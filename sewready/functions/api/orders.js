// GET /api/orders?shop=slug&status=X
// POST /api/orders { shop_slug, ...data }

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

  const status = url.searchParams.get('status');
  const db = context.env.DB;

  let result;
  if (status) {
    result = await db.prepare(
      'SELECT * FROM orders WHERE shop_slug = ? AND status = ? ORDER BY deadline ASC'
    ).bind(shop, status).all();
  } else {
    result = await db.prepare(
      'SELECT * FROM orders WHERE shop_slug = ? ORDER BY deadline ASC'
    ).bind(shop).all();
  }

  // Parse the JSON data blob back into each row
  const orders = result.results.map(row => {
    try {
      const full = JSON.parse(row.data);
      return { ...full, _db_id: row.id };
    } catch {
      return row;
    }
  });

  return json(orders);
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const shop = body.shop_slug;
  if (!shop) return json({ error: 'shop_slug is required' }, 400);

  const db = context.env.DB;
  const now = new Date().toISOString();
  const id = body.id || ('SR-' + Date.now());

  await db.prepare(
    `INSERT OR REPLACE INTO orders (id, shop_slug, status, customer, phone, email, uniform, deadline, urgency, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, shop,
    body.status || 'received',
    body.customer || null,
    body.phone || null,
    body.email || null,
    body.uniform || null,
    body.deadline || null,
    body.urgency || 'on-track',
    JSON.stringify(body),
    body.createdAt || now,
    now
  ).run();

  return json({ ok: true, id });
}
