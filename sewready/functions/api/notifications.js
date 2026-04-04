// GET /api/notifications?shop=slug
// POST /api/notifications { shop_slug, ...data }

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
    'SELECT * FROM notifications WHERE shop_slug = ? ORDER BY created_at DESC LIMIT 100'
  ).bind(shop).all();

  const notifs = result.results.map(row => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    orderId: row.order_id,
    incomingId: row.incoming_id,
    read: !!row.read,
    time: new Date(row.created_at).getTime()
  }));

  return json(notifs);
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const shop = body.shop_slug;
  if (!shop) return json({ error: 'shop_slug is required' }, 400);

  const db = context.env.DB;
  const id = body.id || ('n' + Date.now());

  await db.prepare(
    `INSERT OR REPLACE INTO notifications (id, shop_slug, type, title, body, order_id, incoming_id, read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, shop,
    body.type || 'new',
    body.title || '',
    body.body || '',
    body.orderId || null,
    body.incomingId || null,
    body.read ? 1 : 0,
    new Date(body.time || Date.now()).toISOString()
  ).run();

  return json({ ok: true, id });
}
