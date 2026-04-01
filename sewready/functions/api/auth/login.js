// POST /api/auth/login — verify email+password, create session, set HTTP-only cookie

import { checkRateLimit } from './_rate-limit.js';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function onRequestPost(context) {
  try {
    // Rate limit: 5 attempts per 15 minutes per IP
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const allowed = await checkRateLimit(context.env.DB, `login:${ip}`, 5, 900);
    if (!allowed) return json({ error: 'Too many login attempts. Try again in 15 minutes.' }, 429);

    const { email, password, shop_slug } = await context.request.json();

    if (!email || !password || !shop_slug) {
      return json({ error: 'Email, password, and shop_slug are required' }, 400);
    }

    // Look up user
    const user = await context.env.DB.prepare(
      'SELECT id, shop_slug, email, password_hash, name, role, employee_id, active FROM admin_users WHERE shop_slug = ? AND email = ?'
    ).bind(shop_slug, email.toLowerCase()).first();

    if (!user || !user.active) {
      // Fallback: check legacy admin_password on shops table
      const shop = await context.env.DB.prepare(
        'SELECT slug, admin_password, name FROM shops WHERE slug = ?'
      ).bind(shop_slug).first();

      if (shop && shop.admin_password && password === shop.admin_password) {
        // Legacy password match — create a temporary session with owner role
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await context.env.DB.prepare(
          'INSERT INTO sessions (token, shop_slug, user_id, role, expires_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(token, shop_slug, 'legacy-owner', 'owner', expiresAt).run();

        const cookie = `sewready_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
        return json({
          user: { id: 'legacy-owner', name: shop.name + ' Owner', email: '', role: 'owner', shop_slug },
          legacy: true,
        }, 200, { 'Set-Cookie': cookie });
      }

      return json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password hash
    const inputHash = await hashPassword(password);
    if (inputHash !== user.password_hash) {
      return json({ error: 'Invalid email or password' }, 401);
    }

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await context.env.DB.prepare(
      'INSERT INTO sessions (token, shop_slug, user_id, role, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(token, shop_slug, user.id, user.role, expiresAt).run();

    // Audit log
    await context.env.DB.prepare(
      'INSERT INTO audit_log (shop_slug, user_id, user_name, action, entity_type) VALUES (?, ?, ?, ?, ?)'
    ).bind(shop_slug, user.id, user.name, 'login', 'session').run();

    const cookie = `sewready_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
    return json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shop_slug: user.shop_slug,
        employee_id: user.employee_id,
      },
    }, 200, { 'Set-Cookie': cookie });

  } catch (err) {
    return json({ error: 'Login failed' }, 500);
  }
}
