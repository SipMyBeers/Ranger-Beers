// POST /api/auth/logout — delete session, clear cookie

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function onRequestPost(context) {
  try {
    const cookieHeader = context.request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/sewready_session=([^;]+)/);
    const token = match ? match[1] : null;

    if (token) {
      // Audit before deleting
      if (context.user) {
        await context.env.DB.prepare(
          'INSERT INTO audit_log (shop_slug, user_id, user_name, action, entity_type) VALUES (?, ?, ?, ?, ?)'
        ).bind(context.user.shop_slug, context.user.id, context.user.name, 'logout', 'session').run();
      }

      await context.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }

    const cookie = 'sewready_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    return json({ ok: true }, 200, { 'Set-Cookie': cookie });
  } catch (err) {
    return json({ error: 'Logout failed' }, 500);
  }
}
