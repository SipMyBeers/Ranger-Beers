// POST /api/notifications/read-all { shop_slug }
// Mark all notifications as read

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const shop = body.shop_slug;
  if (!shop) return json({ error: 'shop_slug is required' }, 400);

  const db = context.env.DB;
  await db.prepare(
    'UPDATE notifications SET read = 1 WHERE shop_slug = ?'
  ).bind(shop).run();

  return json({ ok: true });
}
