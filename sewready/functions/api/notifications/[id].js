// PATCH /api/notifications/:id { shop_slug, read }
// DELETE /api/notifications/:id?shop=slug

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPatch(context) {
  const body = await context.request.json();
  const shop = body.shop_slug;
  const id = context.params.id;
  if (!shop) return json({ error: 'shop_slug is required' }, 400);

  const db = context.env.DB;

  if (body.read !== undefined) {
    await db.prepare(
      'UPDATE notifications SET read = ? WHERE id = ? AND shop_slug = ?'
    ).bind(body.read ? 1 : 0, id, shop).run();
  }

  return json({ ok: true });
}

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  const id = context.params.id;
  if (!shop) return json({ error: 'shop is required' }, 400);

  const db = context.env.DB;
  await db.prepare(
    'DELETE FROM notifications WHERE id = ? AND shop_slug = ?'
  ).bind(id, shop).run();

  return json({ ok: true });
}
