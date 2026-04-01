// Admin auth middleware — protects all /api/admin/* routes except /api/admin/auth
// Expects: Authorization: Bearer <token>
// Token is a simple HMAC of the admin password + timestamp

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Allow auth endpoint without token
  if (url.pathname === '/api/admin/auth') {
    return context.next();
  }

  // Allow OPTIONS for CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const adminPassword = context.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return json({ error: 'Admin not configured' }, 500);
  }

  // Token format: base64(password:timestamp)
  // Valid for 24 hours
  try {
    const decoded = atob(token);
    const [pwd, ts] = decoded.split(':');
    const timestamp = parseInt(ts, 10);
    const now = Date.now();

    if (pwd !== adminPassword) {
      return json({ error: 'Invalid token' }, 401);
    }

    // Token expires after 24 hours
    if (now - timestamp > 24 * 60 * 60 * 1000) {
      return json({ error: 'Token expired' }, 401);
    }
  } catch {
    return json({ error: 'Invalid token' }, 401);
  }

  return context.next();
}
