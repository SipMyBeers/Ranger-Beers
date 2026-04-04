// POST /api/incoming/:id/dismiss { shop_slug }
// Delete incoming order

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
  await db.prepare(
    'DELETE FROM incoming_orders WHERE id = ? AND shop_slug = ?'
  ).bind(id, shop).run();

  return json({ ok: true });
}
