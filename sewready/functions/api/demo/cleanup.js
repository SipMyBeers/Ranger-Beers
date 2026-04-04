// POST /api/demo/cleanup — deletes expired demo shops (> 24h old)
// Requires Authorization: Bearer {CLEANUP_SECRET}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const auth = context.request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');

  if (!context.env.CLEANUP_SECRET || token !== context.env.CLEANUP_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const db = context.env.DB;

  try {
    const expired = await db.prepare(
      "SELECT slug FROM shops WHERE slug LIKE 'demo-%' AND created_at < datetime('now', '-1 day')"
    ).all();

    let deleted = 0;
    for (const shop of expired.results) {
      await db.batch([
        db.prepare('DELETE FROM orders WHERE shop_slug = ?').bind(shop.slug),
        db.prepare('DELETE FROM sessions WHERE shop_slug = ?').bind(shop.slug),
        db.prepare('DELETE FROM admin_users WHERE shop_slug = ?').bind(shop.slug),
        db.prepare('DELETE FROM notifications WHERE shop_slug = ?').bind(shop.slug),
        db.prepare('DELETE FROM notification_log WHERE shop_slug = ?').bind(shop.slug),
        db.prepare('DELETE FROM shops WHERE slug = ?').bind(shop.slug),
      ]);
      deleted++;
    }

    return json({ ok: true, deleted, message: `Cleaned up ${deleted} expired demo shops.` });
  } catch (err) {
    return json({ error: 'Cleanup failed', detail: err.message }, 500);
  }
}
