// POST /api/intake
// Intake form submission — auto-provisions shop in D1, emails owner, confirms buyer

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildConfirmationEmail(shopName, ownerName, tier, siteUrl) {
  return [
    `Hi ${ownerName || 'there'},`,
    '',
    `Thanks for submitting your intake form for "${shopName}"!`,
    '',
    siteUrl ? `Your site is already live at: ${siteUrl}` : '',
    '',
    `Here's what happens next:`,
    '',
    `  1. We'll review your submission and customize your site`,
    `  2. Dylan will reach out to confirm details and answer any questions`,
    `  3. Your full ${tier || ''} site goes live — most within 24 hours`,
    '',
    `If you need to make changes or have questions, just reply to this email`,
    `or text/call Dylan at (503) 592-3451.`,
    '',
    `— Ranger Beers Sites`,
    `   sites.ranger-beers.com`,
  ].filter(Boolean).join('\n');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { subject, details, shopName, ownerName, phone, email, tier, vertical } = body;

  if (!subject || !details || !shopName) {
    return json({ error: 'Missing required fields' }, 400);
  }

  // Store intake submission
  try {
    await env.DB.prepare(
      `INSERT INTO intake_submissions (shop_name, owner_name, phone, email, tier, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(shopName, ownerName || null, phone || null, email || null, tier || null, details).run();
  } catch (e) { /* best-effort */ }

  // Auto-provision: create shop in D1 if it doesn't already exist
  let siteUrl = null;
  const slug = slugify(shopName);
  const shopVertical = vertical || 'sewing';

  try {
    const existing = await env.DB.prepare('SELECT slug FROM shops WHERE slug = ?').bind(slug).first();
    if (!existing) {
      const adminPass = Math.random().toString(36).slice(2, 8);
      await env.DB.prepare(
        `INSERT INTO shops (slug, name, tier, owner, address, phone, email, tagline,
         theme_primary, theme_secondary, theme_accent, vertical, admin_password, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
      ).bind(
        slug, shopName, 'storefront',
        ownerName || null, body.address || null, phone || null, email || null,
        body.tagline || `Welcome to ${shopName}`,
        body.accentColor || '#c9a84c', '#1c2833', '#06b6d4',
        shopVertical, adminPass
      ).run();

      siteUrl = `https://sites.ranger-beers.com/shops/${slug}/`;
    } else {
      siteUrl = `https://sites.ranger-beers.com/shops/${slug}/`;
    }
  } catch (e) { /* best-effort — site will still be created manually if this fails */ }

  // Send emails
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    return json({ error: 'Email service not configured', siteUrl }, 503);
  }

  try {
    // Email to you (owner) — include the auto-provisioned URL
    const emailDetails = siteUrl
      ? `AUTO-PROVISIONED: ${siteUrl}\n\n${details}`
      : details;

    const ownerResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ranger Beers Sites <noreply@sewing.ranger-beers.com>',
        to: ['owner@ranger-beers.com'],
        reply_to: email || undefined,
        subject: subject,
        text: emailDetails,
      }),
    });

    // Confirmation email to buyer with their live site URL
    if (email) {
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ranger Beers Sites <noreply@sewing.ranger-beers.com>',
          to: [email],
          reply_to: 'owner@ranger-beers.com',
          subject: siteUrl
            ? `Your site is live, ${ownerName || shopName}!`
            : `We got your intake form, ${ownerName || shopName}!`,
          text: buildConfirmationEmail(shopName, ownerName, tier, siteUrl),
        }),
      }).catch(() => {});
    }

    if (ownerResp.ok) {
      return json({ ok: true, siteUrl, message: 'Intake submitted — shop provisioned' });
    } else {
      const err = await ownerResp.json().catch(() => ({}));
      return json({ error: 'Failed to send email', siteUrl, detail: err.message || '' }, 500);
    }
  } catch (err) {
    return json({ error: 'Email service error', siteUrl, detail: err.message }, 500);
  }
}
