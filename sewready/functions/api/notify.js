// POST /api/notify
// Send real SMS (Twilio) + email (Resend) notifications
// Body: { shop_slug, order_id, customer_phone, customer_email, customer_name, shop_name, shop_phone, type }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendSMS(env, to, body, shop, orderId) {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return { status: 'skipped', error: 'Twilio not configured' };
  }

  try {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(sid + ':' + token),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      }
    );

    const data = await resp.json();

    if (resp.ok) {
      // Log success
      await env.DB.prepare(
        `INSERT INTO notification_log (shop_slug, order_id, customer_phone, type, status, provider_id, created_at)
         VALUES (?, ?, ?, 'sms', 'sent', ?, datetime('now'))`
      ).bind(shop, orderId, to, data.sid || '').run();
      return { status: 'sent', sid: data.sid };
    } else {
      await env.DB.prepare(
        `INSERT INTO notification_log (shop_slug, order_id, customer_phone, type, status, error, created_at)
         VALUES (?, ?, ?, 'sms', 'failed', ?, datetime('now'))`
      ).bind(shop, orderId, to, data.message || 'Unknown error').run();
      return { status: 'failed', error: data.message };
    }
  } catch (err) {
    await env.DB.prepare(
      `INSERT INTO notification_log (shop_slug, order_id, customer_phone, type, status, error, created_at)
       VALUES (?, ?, ?, 'sms', 'failed', ?, datetime('now'))`
    ).bind(shop, orderId, to, err.message).run();
    return { status: 'failed', error: err.message };
  }
}

async function sendEmail(env, to, subject, html, shop, orderId) {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    return { status: 'skipped', error: 'Resend not configured' };
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SewReady <noreply@ranger-beers.com>',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await resp.json();

    if (resp.ok) {
      await env.DB.prepare(
        `INSERT INTO notification_log (shop_slug, order_id, customer_email, type, status, provider_id, created_at)
         VALUES (?, ?, ?, 'email', 'sent', ?, datetime('now'))`
      ).bind(shop, orderId, to, data.id || '').run();
      return { status: 'sent', id: data.id };
    } else {
      await env.DB.prepare(
        `INSERT INTO notification_log (shop_slug, order_id, customer_email, type, status, error, created_at)
         VALUES (?, ?, ?, 'email', 'failed', ?, datetime('now'))`
      ).bind(shop, orderId, to, data.message || 'Unknown error').run();
      return { status: 'failed', error: data.message };
    }
  } catch (err) {
    await env.DB.prepare(
      `INSERT INTO notification_log (shop_slug, order_id, customer_email, type, status, error, created_at)
       VALUES (?, ?, ?, 'email', 'failed', ?, datetime('now'))`
    ).bind(shop, orderId, to, err.message).run();
    return { status: 'failed', error: err.message };
  }
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const {
    shop_slug, order_id, customer_phone, customer_email,
    customer_name, shop_name, shop_phone, type
  } = body;

  if (!shop_slug) return json({ error: 'shop_slug is required' }, 400);

  const env = context.env;
  const results = { sms: null, email: null };

  const statusText = type === 'completed' ? 'has been completed' : 'is ready for pickup';

  // Send SMS
  if (customer_phone) {
    const smsBody = `Hi ${customer_name || 'there'}! Your order ${order_id || ''} at ${shop_name || 'SewReady'} ${statusText}. Call us at ${shop_phone || ''} with any questions.`;
    results.sms = await sendSMS(env, customer_phone, smsBody, shop_slug, order_id);
  }

  // Send Email
  if (customer_email) {
    const subject = `Your order ${order_id || ''} at ${shop_name || 'SewReady'} ${statusText}`;
    const html = `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0e1528;color:#f0e8dc;border-radius:14px;">
        <h2 style="color:#5ba4a4;margin:0 0 16px">Your Order is ${type === 'completed' ? 'Complete' : 'Ready'}!</h2>
        <p>Hi ${customer_name || 'there'},</p>
        <p>Your order <strong>${order_id || ''}</strong> at <strong>${shop_name || 'SewReady'}</strong> ${statusText}.</p>
        <p>Please pick it up at your earliest convenience or contact us to arrange pickup.</p>
        ${shop_phone ? `<p style="margin-top:16px"><strong>Phone:</strong> ${shop_phone}</p>` : ''}
        <hr style="border:none;border-top:1px solid rgba(240,232,220,.1);margin:24px 0">
        <p style="font-size:12px;color:rgba(240,232,220,.5)">Powered by SewReady</p>
      </div>
    `;
    results.email = await sendEmail(env, customer_email, subject, html, shop_slug, order_id);
  }

  return json({ ok: true, results });
}
