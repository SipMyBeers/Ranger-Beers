// GET /api/drivers/deliveries — fetch available + active + completed assignments for this driver

import { validateDriverSession } from './_driver-auth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const driver = await validateDriverSession(context);
  if (!driver) return json({ error: 'Unauthorized' }, 401);

  try {
    // Fetch all assignments this driver can see:
    // - Unassigned (pending) in their shop — available to accept
    // - Assigned to them in any active status
    // - Completed by them (delivered) — history
    const { results } = await context.env.DB.prepare(`
      SELECT da.id, da.order_id, da.driver_id, da.pickup_address, da.delivery_address,
             da.status, da.scheduled_date, da.scheduled_time, da.notes,
             da.created_at, da.updated_at,
             o.customer, o.phone AS customer_phone, o.email AS customer_email,
             o.uniform, o.status AS order_status
      FROM driver_assignments da
      LEFT JOIN orders o ON da.order_id = o.id AND da.shop_slug = o.shop_slug
      WHERE da.shop_slug = ?
        AND (
          (da.status = 'pending' AND da.driver_id IS NULL)
          OR da.driver_id = ?
        )
        AND da.status != 'cancelled'
      ORDER BY
        CASE da.status
          WHEN 'en-route' THEN 1
          WHEN 'picked-up' THEN 2
          WHEN 'assigned' THEN 3
          WHEN 'pending' THEN 4
          WHEN 'delivered' THEN 5
          ELSE 6
        END,
        da.scheduled_date ASC,
        da.scheduled_time ASC
    `).bind(driver.shop_slug, driver.id).all();

    return json({ deliveries: results, driver_id: driver.id });
  } catch (err) {
    return json({ error: 'Failed to fetch deliveries' }, 500);
  }
}
