// POST /api/drivers/auth/logout — clear driver session

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export async function onRequestPost(context) {
  try {
    const cookieHeader = context.request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/sewready_driver_session=([^;]+)/);
    const token = match ? match[1] : null;

    if (token) {
      await context.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }

    const cookie = 'sewready_driver_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    return json({ ok: true }, 200, { 'Set-Cookie': cookie });
  } catch (err) {
    return json({ error: 'Logout failed' }, 500);
  }
}
