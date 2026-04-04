// POST /api/incoming/:id/receive { shop_slug }
// Convert incoming order → real order, delete from incoming

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const shop = body.shop_slug;
  const id = context.params.id;
  if (!shop) return json({ error: 'shop_slug is required' }, 400);

  const db = context.env.DB;

  // Fetch the incoming order
  const inc = await db.prepare(
    'SELECT * FROM incoming_orders WHERE id = ? AND shop_slug = ?'
  ).bind(id, shop).first();

  if (!inc) return json({ error: 'not found' }, 404);

  let incData;
  try { incData = JSON.parse(inc.data); } catch { incData = {}; }

  // Create a new order from the incoming data
  const orderId = body.order_id || ('SR-' + Date.now());
  const now = new Date().toISOString();
  const orderData = { ...incData, id: orderId, status: 'received', shop_slug: shop };

  await db.batch([
    db.prepare(
      `INSERT INTO orders (id, shop_slug, status, customer, phone, email, uniform, deadline, urgency, data, created_at, updated_at)
       VALUES (?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      orderId, shop,
      incData.customer || null,
      incData.phone || null,
      incData.email || null,
      incData.uniform || null,
      incData.deadline || null,
      incData.urgency || 'on-track',
      JSON.stringify(orderData),
      now, now
    ),
    db.prepare(
      'DELETE FROM incoming_orders WHERE id = ? AND shop_slug = ?'
    ).bind(id, shop)
  ]);

  return json({ ok: true, order_id: orderId });
}
