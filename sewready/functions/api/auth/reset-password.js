// POST /api/auth/reset-password — validates token, updates password

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
    const { token, password } = await context.request.json();

    if (!token || !password) {
      return json({ error: 'Token and new password are required' }, 400);
    }

    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Look up user by reset token
    const user = await context.env.DB.prepare(
      'SELECT id, shop_slug, name, email, reset_expires FROM admin_users WHERE reset_token = ? AND active = 1'
    ).bind(token).first();

    if (!user) {
      return json({ error: 'Invalid or expired reset link' }, 400);
    }

    // Check expiry
    if (!user.reset_expires || new Date(user.reset_expires) < new Date()) {
      // Clear the expired token
      await context.env.DB.prepare(
        'UPDATE admin_users SET reset_token = NULL, reset_expires = NULL WHERE id = ?'
      ).bind(user.id).run();
      return json({ error: 'Reset link has expired. Please request a new one.' }, 400);
    }

    // Hash new password and update
    const passwordHash = await hashPassword(password);
    await context.env.DB.prepare(
      'UPDATE admin_users SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(passwordHash, user.id).run();

    // Invalidate all existing sessions for this user
    await context.env.DB.prepare(
      'DELETE FROM sessions WHERE user_id = ?'
    ).bind(user.id).run();

    // Audit log
    await context.env.DB.prepare(
      'INSERT INTO audit_log (shop_slug, user_id, user_name, action, entity_type) VALUES (?, ?, ?, ?, ?)'
    ).bind(user.shop_slug, user.id, user.name, 'password_reset', 'admin_user').run();

    return json({ ok: true, message: 'Password has been reset. You can now sign in.' });

  } catch (err) {
    return json({ error: 'Failed to reset password' }, 500);
  }
}
