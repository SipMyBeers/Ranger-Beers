// /api/driver-assignments — GET list, POST create assignments

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/driver-assignments?shop=slug&order_id=X&driver_id=Y
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return json({ error: 'shop parameter required' }, 400);

  let query = 'SELECT da.*, d.name as driver_name, d.phone as driver_phone FROM driver_assignments da LEFT JOIN drivers d ON da.driver_id = d.id WHERE da.shop_slug = ?';
  const params = [shop];

  const orderId = url.searchParams.get('order_id');
  const driverId = url.searchParams.get('driver_id');

  if (orderId) { query += ' AND da.order_id = ?'; params.push(orderId); }
  if (driverId) { query += ' AND da.driver_id = ?'; params.push(driverId); }

  query += ' ORDER BY da.scheduled_date DESC, da.created_at DESC';

  try {
    const { results } = await context.env.DB.prepare(query).bind(...params).all();
    return json(results);
  } catch (err) {
    return json({ error: 'Failed to list assignments' }, 500);
  }
}

// POST /api/driver-assignments — create assignment
export async function onRequestPost(context) {
  try {
    const { shop_slug, order_id, driver_id, pickup_address, delivery_address, scheduled_date, scheduled_time, notes } = await context.request.json();
    if (!shop_slug || !order_id) return json({ error: 'shop_slug and order_id required' }, 400);

    const id = crypto.randomUUID();
    const status = driver_id ? 'assigned' : 'pending';

    await context.env.DB.prepare(
      'INSERT INTO driver_assignments (id, shop_slug, order_id, driver_id, pickup_address, delivery_address, status, scheduled_date, scheduled_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, shop_slug, order_id, driver_id || null, pickup_address || null, delivery_address || null, status, scheduled_date || null, scheduled_time || null, notes || null).run();

    return json({ id, shop_slug, order_id, driver_id, status, scheduled_date, scheduled_time }, 201);
  } catch (err) {
    return json({ error: 'Failed to create assignment' }, 500);
  }
}
