// POST /api/payments — process a Square payment
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost(context) {
  try {
    const { shop_slug, source_id, amount, currency } = await context.request.json();
    if (!source_id || !amount) return json({ ok: false, error: 'Missing payment details' }, 400);

    const db = context.env.DB;
    // Get the shop's Square access token from config
    const shop = await db.prepare('SELECT config FROM shops WHERE slug = ?').bind(shop_slug).first();
    if (!shop) return json({ ok: false, error: 'Shop not found' }, 404);

    let config = {};
    try { config = JSON.parse(shop.config || '{}'); } catch (e) {}
    const accessToken = config.square_access_token;
    if (!accessToken) {
      // No Square configured — mark as pay-at-pickup
      return json({ ok: true, method: 'pay-later', message: 'Payment will be collected at pickup' });
    }

    // Process payment via Square API
    const idempotencyKey = crypto.randomUUID();
    const resp = await fetch('https://connect.squareupsandbox.com/v2/payments', {
      method: 'POST',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_id,
        idempotency_key: idempotencyKey,
        amount_money: { amount, currency: currency || 'USD' }
      })
    });
    const result = await resp.json();

    if (result.payment && result.payment.status === 'COMPLETED') {
      // Log the payment
      await db.prepare(
        'INSERT INTO payments (shop_slug, square_payment_id, amount, currency, status) VALUES (?, ?, ?, ?, ?)'
      ).bind(shop_slug, result.payment.id, amount, currency || 'USD', 'completed').run();
      return json({ ok: true, method: 'card', payment_id: result.payment.id });
    } else {
      return json({ ok: false, error: result.errors?.[0]?.detail || 'Payment failed' }, 400);
    }
  } catch (e) {
    return json({ ok: false, error: 'Payment processing error' }, 500);
  }
}
