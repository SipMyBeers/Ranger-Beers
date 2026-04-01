// POST /api/customers/auth { shop_slug, email, password }
// Returns customer data if credentials match

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const shop = body.shop_slug;
  const email = (body.email || '').toLowerCase();
  const password = body.password;

  if (!shop || !email || !password) {
    return json({ error: 'shop_slug, email, and password are required' }, 400);
  }

  const db = context.env.DB;
  const row = await db.prepare(
    'SELECT * FROM customers WHERE shop_slug = ? AND LOWER(email) = ?'
  ).bind(shop, email).first();

  if (!row) return json({ error: 'Invalid email or password' }, 401);

  let custData;
  try { custData = JSON.parse(row.data); } catch { custData = row; }

  if (custData.password !== password) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  // Don't send password back
  const safe = { ...custData };
  delete safe.password;
  return json(safe);
}
