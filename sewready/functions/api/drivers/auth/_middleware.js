// Driver auth middleware — validates sewready_driver_session cookie, attaches context.driver

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const PUBLIC_PATHS = ['/api/drivers/auth/login', '/api/drivers/auth/set-password'];

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (context.request.method === 'OPTIONS') {
    return context.next();
  }

  if (PUBLIC_PATHS.includes(url.pathname)) {
    return context.next();
  }

  const cookieHeader = context.request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/sewready_driver_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    if (url.pathname === '/api/drivers/auth/me') {
      return json({ driver: null }, 401);
    }
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const session = await context.env.DB.prepare(
      "SELECT token, shop_slug, user_id, role, expires_at FROM sessions WHERE token = ? AND role = 'driver'"
    ).bind(token).first();

    if (!session) {
      return json({ error: 'Invalid session' }, 401);
    }

    if (new Date(session.expires_at) < new Date()) {
      await context.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return json({ error: 'Session expired' }, 401);
    }

    const driver = await context.env.DB.prepare(
      'SELECT id, shop_slug, name, phone, vehicle, email, active FROM drivers WHERE id = ? AND active = 1'
    ).bind(session.user_id).first();

    if (!driver) {
      return json({ error: 'Driver not found or inactive' }, 401);
    }

    context.driver = {
      id: driver.id,
      shop_slug: driver.shop_slug,
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle,
      email: driver.email,
    };
  } catch (err) {
    return json({ error: 'Auth error' }, 500);
  }

  return context.next();
}
