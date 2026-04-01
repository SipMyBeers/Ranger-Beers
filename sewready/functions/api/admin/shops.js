// GET  /api/admin/shops — list all shops
// POST /api/admin/shops — create a new shop

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare(
    'SELECT slug, name, tier, owner, address, phone, email, tagline, active, created_at, updated_at FROM shops ORDER BY created_at DESC'
  ).all();

  return json({ shops: results });
}

export async function onRequestPost(context) {
  const body = await context.request.json();

  const {
    slug, name, tier, owner, address, phone, email, tagline,
    theme_primary, theme_secondary, theme_accent,
    admin_password, config
  } = body;

  if (!slug || !name) {
    return json({ error: 'slug and name are required' }, 400);
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return json({ error: 'Slug must be lowercase alphanumeric with hyphens only' }, 400);
  }

  // Check for duplicate
  const existing = await context.env.DB.prepare(
    'SELECT slug FROM shops WHERE slug = ?'
  ).bind(slug).first();

  if (existing) {
    return json({ error: 'A shop with this slug already exists' }, 409);
  }

  await context.env.DB.prepare(
    `INSERT INTO shops (slug, name, tier, owner, address, phone, email, tagline, theme_primary, theme_secondary, theme_accent, admin_password, config)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    slug,
    name,
    tier || 'storefront',
    owner || null,
    address || null,
    phone || null,
    email || null,
    tagline || null,
    theme_primary || '#a855f7',
    theme_secondary || '#1c2833',
    theme_accent || '#06b6d4',
    admin_password || null,
    config ? JSON.stringify(config) : null
  ).run();

  return json({ ok: true, slug }, 201);
}
