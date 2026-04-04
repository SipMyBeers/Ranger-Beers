// /api/drivers/:id — PATCH update, DELETE deactivate driver

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// PATCH /api/drivers/:id
export async function onRequestPatch(context) {
  const { id } = context.params;
  try {
    const body = await context.request.json();
    const { name, phone, vehicle, active, shop_slug } = body;
    if (!shop_slug) return json({ error: 'shop_slug required' }, 400);

    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (phone !== undefined) { sets.push('phone = ?'); params.push(phone); }
    if (vehicle !== undefined) { sets.push('vehicle = ?'); params.push(vehicle); }
    if (active !== undefined) { sets.push('active = ?'); params.push(active ? 1 : 0); }

    if (sets.length === 0) return json({ error: 'No fields to update' }, 400);

    params.push(id, shop_slug);
    await context.env.DB.prepare(
      `UPDATE drivers SET ${sets.join(', ')} WHERE id = ? AND shop_slug = ?`
    ).bind(...params).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Failed to update driver' }, 500);
  }
}

// DELETE /api/drivers/:id — soft delete (deactivate)
export async function onRequestDelete(context) {
  const { id } = context.params;
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return json({ error: 'shop parameter required' }, 400);

  try {
    await context.env.DB.prepare(
      'UPDATE drivers SET active = 0 WHERE id = ? AND shop_slug = ?'
    ).bind(id, shop).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Failed to deactivate driver' }, 500);
  }
}
