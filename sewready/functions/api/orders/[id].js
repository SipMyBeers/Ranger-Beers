// GET /api/orders/:id?shop=slug
// PATCH /api/orders/:id { shop_slug, ...changes }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  const id = context.params.id;
  if (!shop) return json({ error: 'shop is required' }, 400);

  const db = context.env.DB;
  const row = await db.prepare(
    'SELECT * FROM orders WHERE id = ? AND shop_slug = ?'
  ).bind(id, shop).first();

  if (!row) return json({ error: 'not found' }, 404);

  try {
    return json(JSON.parse(row.data));
  } catch {
    return json(row);
  }
}

export async function onRequestPatch(context) {
  const body = await context.request.json();
  const shop = body.shop_slug;
  const id = context.params.id;
  if (!shop) return json({ error: 'shop_slug is required' }, 400);

  const db = context.env.DB;
  const now = new Date().toISOString();

  // Fetch existing row to merge data
  const existing = await db.prepare(
    'SELECT * FROM orders WHERE id = ? AND shop_slug = ?'
  ).bind(id, shop).first();

  if (!existing) return json({ error: 'not found' }, 404);

  let merged;
  try {
    const prev = JSON.parse(existing.data);
    merged = { ...prev, ...body };
  } catch {
    merged = body;
  }

  await db.prepare(
    `UPDATE orders SET status = ?, customer = ?, phone = ?, email = ?, uniform = ?,
     deadline = ?, urgency = ?, data = ?, updated_at = ?
     WHERE id = ? AND shop_slug = ?`
  ).bind(
    merged.status || existing.status,
    merged.customer || existing.customer,
    merged.phone || existing.phone,
    merged.email || existing.email,
    merged.uniform || existing.uniform,
    merged.deadline || existing.deadline,
    merged.urgency || existing.urgency,
    JSON.stringify(merged),
    now,
    id, shop
  ).run();

  return json({ ok: true, id });
}
