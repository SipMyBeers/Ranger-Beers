// GET /api/drivers/auth/me — return current driver session info

import { validateDriverSession } from '../_driver-auth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  // Use shared validator directly (belt + suspenders with middleware)
  const driver = context.driver || await validateDriverSession(context);
  if (!driver) {
    return json({ driver: null }, 401);
  }
  return json({ driver });
}
