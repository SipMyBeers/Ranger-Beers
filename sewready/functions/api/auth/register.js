// POST /api/auth/register — create admin user
// First user for a shop = owner (bootstrap). After that, only owners can create users.

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

export async function onRequestPost(context) {
  try {
    const { email, password, name, role, shop_slug, employee_id } = await context.request.json();

    if (!email || !password || !name || !shop_slug) {
      return json({ error: 'email, password, name, and shop_slug are required' }, 400);
    }

    // Check if any admin users exist for this shop
    const existingCount = await context.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM admin_users WHERE shop_slug = ?'
    ).bind(shop_slug).first();

    const isBootstrap = existingCount.cnt === 0;

    if (!isBootstrap) {
      // Require authenticated owner
      if (!context.user) {
        return json({ error: 'Unauthorized — only shop owners can create users' }, 401);
      }
      if (context.user.role !== 'owner') {
        return json({ error: 'Forbidden — only owners can create users' }, 403);
      }
      if (context.user.shop_slug !== shop_slug) {
        return json({ error: 'Forbidden — wrong shop' }, 403);
      }
    }

    // Check for duplicate email
    const existing = await context.env.DB.prepare(
      'SELECT id FROM admin_users WHERE shop_slug = ? AND email = ?'
    ).bind(shop_slug, email.toLowerCase()).first();

    if (existing) {
      return json({ error: 'A user with this email already exists' }, 409);
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const userRole = isBootstrap ? 'owner' : (role || 'employee');
    const validRoles = ['owner', 'manager', 'employee'];
    if (!validRoles.includes(userRole)) {
      return json({ error: 'Invalid role' }, 400);
    }

    await context.env.DB.prepare(
      'INSERT INTO admin_users (id, shop_slug, email, password_hash, name, role, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, shop_slug, email.toLowerCase(), passwordHash, name, userRole, employee_id || null).run();

    // Audit log
    await context.env.DB.prepare(
      'INSERT INTO audit_log (shop_slug, user_id, user_name, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      shop_slug,
      isBootstrap ? id : context.user.id,
      isBootstrap ? name : context.user.name,
      'create_user',
      'admin_user',
      id,
      JSON.stringify({ email: email.toLowerCase(), name, role: userRole })
    ).run();

    return json({
      user: { id, email: email.toLowerCase(), name, role: userRole, shop_slug, employee_id: employee_id || null },
      bootstrap: isBootstrap,
    }, 201);

  } catch (err) {
    return json({ error: 'Registration failed' }, 500);
  }
}
