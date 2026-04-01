// POST /api/admin/auth
// Body: { password }
// Returns: { token } — base64(password:timestamp)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const { password } = body;

  if (!password) {
    return json({ error: 'Password is required' }, 400);
  }

  const adminPassword = context.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return json({ error: 'Admin not configured' }, 500);
  }

  if (password !== adminPassword) {
    return json({ error: 'Invalid password' }, 401);
  }

  // Generate token: base64(password:timestamp)
  const token = btoa(password + ':' + Date.now());

  return json({ ok: true, token });
}
