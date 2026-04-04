// POST /api/auth/forgot-password — sends password reset email via Resend

import { checkRateLimit } from './_rate-limit.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  try {
    // Rate limit: 3 attempts per 15 minutes per IP
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const allowed = await checkRateLimit(context.env.DB, `forgot:${ip}`, 3, 900);
    if (!allowed) return json({ error: 'Too many reset requests. Try again in 15 minutes.' }, 429);

    const { email, shop_slug } = await context.request.json();

    if (!email || !shop_slug) {
      return json({ error: 'Email and shop_slug are required' }, 400);
    }

    // Look up user
    const user = await context.env.DB.prepare(
      'SELECT id, name, email FROM admin_users WHERE shop_slug = ? AND email = ? AND active = 1'
    ).bind(shop_slug, email.toLowerCase()).first();

    // Always return success (don't reveal if email exists)
    if (!user) {
      return json({ ok: true, message: 'If that email is registered, a reset link has been sent.' });
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token
    await context.env.DB.prepare(
      'UPDATE admin_users SET reset_token = ?, reset_expires = ? WHERE id = ?'
    ).bind(token, expiresAt, user.id).run();

    // Build reset link
    const origin = new URL(context.request.url).origin;
    const resetLink = `${origin}/shops/${shop_slug}/index.html?reset_token=${token}`;

    // Send email via Resend
    if (context.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: context.env.RESEND_FROM || 'SewReady <noreply@sewing.ranger-beers.com>',
            to: [user.email],
            subject: 'SewReady — Password Reset',
            html: `
              <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
                <h2 style="color:#1a1a2e;margin:0 0 8px">Password Reset</h2>
                <p style="color:#666;font-size:14px;line-height:1.6">
                  Hi ${user.name},<br><br>
                  We received a request to reset your SewReady admin password. Click the button below to set a new password:
                </p>
                <a href="${resetLink}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#3a6ea5;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Reset Password</a>
                <p style="color:#999;font-size:12px;line-height:1.6">
                  This link expires in 1 hour. If you didn't request this, you can safely ignore this email.<br><br>
                  Or copy this link: ${resetLink}
                </p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        // Log but don't fail — user shouldn't know if email failed
        console.error('Reset email failed:', emailErr);
      }
    }

    return json({ ok: true, message: 'If that email is registered, a reset link has been sent.' });

  } catch (err) {
    return json({ error: 'Failed to process reset request' }, 500);
  }
}
