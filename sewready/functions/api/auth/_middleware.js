// Auth middleware — validates session cookie, attaches context.user
// Protects all /api/auth/* routes except login, register (bootstrap), and me (returns 401 gracefully)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // CORS preflight — handled by parent _middleware.js, just pass through
  if (context.request.method === 'OPTIONS') {
    return context.next();
  }

  // Public endpoints don't require auth
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return context.next();
  }

  // Extract session token from cookie
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/sewready_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    // /api/auth/me returns 401 gracefully (frontend uses this to check login state)
    if (url.pathname === '/api/auth/me') {
      return json({ user: null }, 401);
    }
    return json({ error: 'Unauthorized' }, 401);
  }

  // Look up session in D1
  try {
    const session = await context.env.DB.prepare(
      'SELECT token, shop_slug, user_id, role, expires_at FROM sessions WHERE token = ?'
    ).bind(token).first();

    if (!session) {
      return json({ error: 'Invalid session' }, 401);
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await context.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return json({ error: 'Session expired' }, 401);
    }

    // Load user details
    const user = await context.env.DB.prepare(
      'SELECT id, shop_slug, email, name, role, employee_id, active FROM admin_users WHERE id = ?'
    ).bind(session.user_id).first();

    if (!user || !user.active) {
      return json({ error: 'User not found or inactive' }, 401);
    }

    // Attach user to context for downstream handlers
    context.user = {
      id: user.id,
      shop_slug: user.shop_slug,
      email: user.email,
      name: user.name,
      role: user.role,
      employee_id: user.employee_id,
    };
  } catch (err) {
    return json({ error: 'Auth error' }, 500);
  }

  return context.next();
}
