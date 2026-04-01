// POST /api/drivers/auth/login — driver login (email + password + shop_slug)

import { checkRateLimit } from '../../auth/_rate-limit.js';

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
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const allowed = await checkRateLimit(context.env.DB, `driver-login:${ip}`, 5, 900);
    if (!allowed) return json({ error: 'Too many login attempts. Try again in 15 minutes.' }, 429);

    const { email, password, shop_slug } = await context.request.json();
    if (!email || !password || !shop_slug) {
      return json({ error: 'Email, password, and shop_slug are required' }, 400);
    }

    const driver = await context.env.DB.prepare(
      'SELECT id, shop_slug, name, phone, vehicle, email, password_hash, active FROM drivers WHERE shop_slug = ? AND email = ?'
    ).bind(shop_slug, email.toLowerCase()).first();

    if (!driver || !driver.active || !driver.password_hash) {
      return json({ error: 'Invalid email or password' }, 401);
    }

    const inputHash = await hashPassword(password);
    if (inputHash !== driver.password_hash) {
      return json({ error: 'Invalid email or password' }, 401);
    }

    // Create 7-day session with role='driver'
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await context.env.DB.prepare(
      'INSERT INTO sessions (token, shop_slug, user_id, role, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(token, shop_slug, driver.id, 'driver', expiresAt).run();

    const cookie = `sewready_driver_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;
    return json({
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicle: driver.vehicle,
        shop_slug: driver.shop_slug,
      },
    }, 200, { 'Set-Cookie': cookie });

  } catch (err) {
    return json({ error: 'Login failed' }, 500);
  }
}
