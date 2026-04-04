// /api/users — GET list, POST create, PATCH update admin users

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/users?shop=slug
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  if (!shop) return json({ error: 'shop parameter required' }, 400);

  try {
    const { results } = await context.env.DB.prepare(
      'SELECT id, shop_slug, email, name, role, employee_id, active, created_at, updated_at FROM admin_users WHERE shop_slug = ? ORDER BY created_at'
    ).bind(shop).all();
    return json(results);
  } catch (err) {
    return json({ error: 'Failed to list users' }, 500);
  }
}

// POST /api/users — create new admin user (owner only)
export async function onRequestPost(context) {
  try {
    const { email, password, name, role, shop_slug, employee_id } = await context.request.json();
    if (!email || !password || !name || !shop_slug) {
      return json({ error: 'email, password, name, and shop_slug required' }, 400);
    }

    // Check duplicate
    const existing = await context.env.DB.prepare(
      'SELECT id FROM admin_users WHERE shop_slug = ? AND email = ?'
    ).bind(shop_slug, email.toLowerCase()).first();
    if (existing) return json({ error: 'Email already exists' }, 409);

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const userRole = role || 'employee';

    await context.env.DB.prepare(
      'INSERT INTO admin_users (id, shop_slug, email, password_hash, name, role, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, shop_slug, email.toLowerCase(), passwordHash, name, userRole, employee_id || null).run();

    return json({ id, email: email.toLowerCase(), name, role: userRole, shop_slug }, 201);
  } catch (err) {
    return json({ error: 'Failed to create user' }, 500);
  }
}

// PATCH /api/users — update admin user
export async function onRequestPatch(context) {
  try {
    const { id, shop_slug, name, role, password, active, employee_id } = await context.request.json();
    if (!id || !shop_slug) return json({ error: 'id and shop_slug required' }, 400);

    const sets = [];
    const params = [];

    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (role !== undefined) { sets.push('role = ?'); params.push(role); }
    if (active !== undefined) { sets.push('active = ?'); params.push(active ? 1 : 0); }
    if (employee_id !== undefined) { sets.push('employee_id = ?'); params.push(employee_id); }
    if (password) {
      const passwordHash = await hashPassword(password);
      sets.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (sets.length === 0) return json({ error: 'No fields to update' }, 400);

    sets.push("updated_at = datetime('now')");
    params.push(id, shop_slug);

    await context.env.DB.prepare(
      `UPDATE admin_users SET ${sets.join(', ')} WHERE id = ? AND shop_slug = ?`
    ).bind(...params).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Failed to update user' }, 500);
  }
}
