// GET /api/audit — query audit_log for a shop
// Query params: shop, entity_type, entity_id, limit, offset

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  const entityType = url.searchParams.get('entity_type');
  const entityId = url.searchParams.get('entity_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  if (!shop) {
    return json({ error: 'shop parameter required' }, 400);
  }

  let query = 'SELECT * FROM audit_log WHERE shop_slug = ?';
  const params = [shop];

  if (entityType) {
    query += ' AND entity_type = ?';
    params.push(entityType);
  }
  if (entityId) {
    query += ' AND entity_id = ?';
    params.push(entityId);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const stmt = context.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();
    return json(results);
  } catch (err) {
    return json({ error: 'Failed to query audit log' }, 500);
  }
}
