// POST /api/drivers/auth/set-password — driver sets initial password via invite token

import { checkRateLimit } from '../../auth/_rate-limit.js';

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
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const allowed = await checkRateLimit(context.env.DB, `driver-setup:${ip}`, 10, 900);
    if (!allowed) return json({ error: 'Too many attempts. Try again later.' }, 429);

    const { token, password, shop_slug } = await context.request.json();
    if (!token || !password || !shop_slug) {
      return json({ error: 'Token, password, and shop_slug are required' }, 400);
    }

    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Find driver by reset_token
    const driver = await context.env.DB.prepare(
      'SELECT id, shop_slug, name, email, reset_token, reset_expires FROM drivers WHERE shop_slug = ? AND reset_token = ? AND active = 1'
    ).bind(shop_slug, token).first();

    if (!driver) {
      return json({ error: 'Invalid or expired invite link' }, 400);
    }

    // Check token expiry
    if (driver.reset_expires && new Date(driver.reset_expires) < new Date()) {
      return json({ error: 'Invite link has expired. Ask your shop admin for a new one.' }, 400);
    }

    // Set password, clear token
    const passwordHash = await hashPassword(password);
    await context.env.DB.prepare(
      'UPDATE drivers SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?'
    ).bind(passwordHash, driver.id).run();

    return json({ ok: true, message: 'Password set successfully. You can now log in.' });
  } catch (err) {
    return json({ error: 'Failed to set password' }, 500);
  }
}
