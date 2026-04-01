// GET    /api/admin/shops/:slug — get shop details
// PATCH  /api/admin/shops/:slug — update shop
// DELETE /api/admin/shops/:slug — deactivate shop

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const slug = context.params.slug;

  const shop = await context.env.DB.prepare(
    'SELECT * FROM shops WHERE slug = ?'
  ).bind(slug).first();

  if (!shop) {
    return json({ error: 'Shop not found' }, 404);
  }

  // Parse config JSON if present
  if (shop.config) {
    try { shop.config = JSON.parse(shop.config); } catch {}
  }

  return json({ shop });
}

export async function onRequestPatch(context) {
  const slug = context.params.slug;
  const body = await context.request.json();

  // Build dynamic SET clause from provided fields
  const allowedFields = [
    'name', 'tier', 'owner', 'address', 'phone', 'email', 'tagline',
    'theme_primary', 'theme_secondary', 'theme_accent',
    'admin_password', 'config', 'active'
  ];

  const sets = [];
  const values = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      sets.push(field + ' = ?');
      if (field === 'config' && typeof body[field] === 'object') {
        values.push(JSON.stringify(body[field]));
      } else {
        values.push(body[field]);
      }
    }
  }

  if (sets.length === 0) {
    return json({ error: 'No fields to update' }, 400);
  }

  sets.push("updated_at = datetime('now')");
  values.push(slug);

  await context.env.DB.prepare(
    'UPDATE shops SET ' + sets.join(', ') + ' WHERE slug = ?'
  ).bind(...values).run();

  return json({ ok: true, slug });
}

export async function onRequestDelete(context) {
  const slug = context.params.slug;

  // Soft delete — set active = 0
  await context.env.DB.prepare(
    "UPDATE shops SET active = 0, updated_at = datetime('now') WHERE slug = ?"
  ).bind(slug).run();

  return json({ ok: true, slug, deactivated: true });
}
