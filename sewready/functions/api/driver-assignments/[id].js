// PATCH /api/driver-assignments/:id — update assignment status (triggers SMS)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SMS_MESSAGES = {
  'assigned': 'Your SewReady driver has been assigned and will pick up your order on {date}.',
  'en-route': 'Your SewReady driver is on the way to pick up your order!',
  'picked-up': 'Your order has been picked up by our driver and is heading to the shop.',
  'delivered': 'Your completed order has been delivered! Thank you for choosing SewReady.',
};

export async function onRequestPatch(context) {
  const { id } = context.params;
  try {
    const body = await context.request.json();
    const { status, driver_id, pickup_address, delivery_address, scheduled_date, scheduled_time, notes, shop_slug } = body;
    if (!shop_slug) return json({ error: 'shop_slug required' }, 400);

    const sets = ["updated_at = datetime('now')"];
    const params = [];

    if (status) { sets.push('status = ?'); params.push(status); }
    if (driver_id !== undefined) { sets.push('driver_id = ?'); params.push(driver_id); }
    if (pickup_address !== undefined) { sets.push('pickup_address = ?'); params.push(pickup_address); }
    if (delivery_address !== undefined) { sets.push('delivery_address = ?'); params.push(delivery_address); }
    if (scheduled_date !== undefined) { sets.push('scheduled_date = ?'); params.push(scheduled_date); }
    if (scheduled_time !== undefined) { sets.push('scheduled_time = ?'); params.push(scheduled_time); }
    if (notes !== undefined) { sets.push('notes = ?'); params.push(notes); }

    params.push(id, shop_slug);
    await context.env.DB.prepare(
      `UPDATE driver_assignments SET ${sets.join(', ')} WHERE id = ? AND shop_slug = ?`
    ).bind(...params).run();

    // If status changed, try to send SMS to customer
    if (status && SMS_MESSAGES[status]) {
      try {
        // Get assignment + order details for customer phone
        const assignment = await context.env.DB.prepare(
          'SELECT da.order_id, da.scheduled_date, o.phone, o.customer FROM driver_assignments da JOIN orders o ON da.order_id = o.id WHERE da.id = ? AND da.shop_slug = ?'
        ).bind(id, shop_slug).first();

        if (assignment && assignment.phone) {
          const message = SMS_MESSAGES[status].replace('{date}', assignment.scheduled_date || 'the scheduled date');
          // Fire SMS via existing notify endpoint
          await fetch(new URL('/api/notify', context.request.url).href, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shop_slug,
              order_id: assignment.order_id,
              phone: assignment.phone,
              type: 'sms',
              message,
            }),
          }).catch(function () { /* SMS failure shouldn't block status update */ });
        }
      } catch (e) { /* non-critical */ }
    }

    return json({ ok: true, status });
  } catch (err) {
    return json({ error: 'Failed to update assignment' }, 500);
  }
}
