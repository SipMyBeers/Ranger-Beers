// POST /api/contact
// Contact form submission — sends email to shop owner via Resend
// Body: { shop_slug, name, phone, email, message }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { shop_slug, name, phone, email, message } = body;

  if (!shop_slug || !name || !message) {
    return json({ error: 'Missing required fields: shop_slug, name, message' }, 400);
  }

  // Look up shop email from D1
  let shopEmail = null;
  let shopName = 'SewReady Shop';
  try {
    const row = await env.DB.prepare(
      'SELECT email, name FROM shops WHERE slug = ? AND active = 1'
    ).bind(shop_slug).first();
    if (row) {
      shopEmail = row.email;
      shopName = row.name || shopName;
    }
  } catch {
    // DB lookup failed, continue with fallback
  }

  // Store submission in D1
  try {
    await env.DB.prepare(
      'INSERT INTO contact_submissions (shop_slug, name, phone, message) VALUES (?, ?, ?, ?)'
    ).bind(shop_slug, name, phone || null, message).run();
  } catch (e) { /* best-effort storage */ }

  if (!shopEmail) {
    return json({ error: 'Shop not found or no email configured' }, 404);
  }

  // Send email via Resend
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    return json({ error: 'Email service not configured' }, 503);
  }

  try {
    const emailBody = [
      `New contact form submission for ${shopName}`,
      '',
      `Name: ${name}`,
      phone ? `Phone: ${phone}` : '',
      email ? `Email: ${email}` : '',
      '',
      'Message:',
      message,
      '',
      '---',
      'Sent via SewReady contact form'
    ].filter(Boolean).join('\n');

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SewReady <noreply@sewing.ranger-beers.com>',
        to: [shopEmail],
        reply_to: email || undefined,
        subject: `New Contact: ${name} — ${shopName}`,
        text: emailBody,
      }),
    });

    if (resp.ok) {
      return json({ ok: true, message: 'Message sent successfully' });
    } else {
      const err = await resp.json().catch(() => ({}));
      return json({ error: 'Failed to send message', detail: err.message || '' }, 500);
    }
  } catch (err) {
    return json({ error: 'Email service error', detail: err.message }, 500);
  }
}
