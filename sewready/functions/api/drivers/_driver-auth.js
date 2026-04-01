// Shared driver session validator — used by deliveries.js and future driver endpoints

export async function validateDriverSession(context) {
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/sewready_driver_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) return null;

  const session = await context.env.DB.prepare(
    "SELECT token, shop_slug, user_id, role, expires_at FROM sessions WHERE token = ? AND role = 'driver'"
  ).bind(token).first();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await context.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }

  const driver = await context.env.DB.prepare(
    'SELECT id, shop_slug, name, phone, vehicle, email, active FROM drivers WHERE id = ? AND active = 1'
  ).bind(session.user_id).first();

  if (!driver) return null;

  return {
    id: driver.id,
    shop_slug: driver.shop_slug,
    name: driver.name,
    phone: driver.phone,
    vehicle: driver.vehicle,
    email: driver.email,
  };
}
