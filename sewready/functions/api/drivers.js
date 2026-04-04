// /api/drivers — GET list, POST create drivers

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/drivers?shop=slug
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return json({ error: 'shop parameter required' }, 400);

  try {
    const { results } = await context.env.DB.prepare(
      'SELECT id, shop_slug, name, phone, vehicle, email, active, reset_token, reset_expires FROM drivers WHERE shop_slug = ? ORDER BY name'
    ).bind(shop).all();
    return json(results);
  } catch (err) {
    return json({ error: 'Failed to list drivers' }, 500);
  }
}

// POST /api/drivers — create driver (with optional email + invite token)
export async function onRequestPost(context) {
  try {
    const { shop_slug, name, phone, vehicle, email } = await context.request.json();
    if (!shop_slug || !name) return json({ error: 'shop_slug and name required' }, 400);

    const id = crypto.randomUUID();
    let resetToken = null;
    let resetExpires = null;

    if (email) {
      // Generate invite token (24h expiry)
      resetToken = crypto.randomUUID();
      resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    await context.env.DB.prepare(
      'INSERT INTO drivers (id, shop_slug, name, phone, vehicle, email, reset_token, reset_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, shop_slug, name, phone || null, vehicle || null, email ? email.toLowerCase() : null, resetToken, resetExpires).run();

    const result = { id, shop_slug, name, phone, vehicle, email: email || null, active: 1 };
    if (resetToken) {
      result.invite_token = resetToken;
    }
    return json(result, 201);
  } catch (err) {
    return json({ error: 'Failed to create driver' }, 500);
  }
}
