// GET /api/auth/me — return current user from session cookie

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  // context.user is set by _middleware.js
  if (!context.user) {
    return json({ user: null }, 401);
  }

  return json({ user: context.user });
}
