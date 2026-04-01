// ══════════════════════════════════════════════════════════════
//  Campaign Sender (Cron Endpoint)
//  POST — sends scheduled campaigns via Resend (email) / Twilio (SMS)
//  Protected by X-API-Key
// ══════════════════════════════════════════════════════════════

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function sendEmail(env, to, subject, body) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'noreply@sewready.com',
      to: Array.isArray(to) ? to : [to],
      subject,
      html: body,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }

  return await res.json();
}

async function sendSMS(env, to, message) {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_FROM_NUMBER;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error ${res.status}: ${err}`);
  }

  return await res.json();
}

export async function onRequestPost({ request, env }) {
  // Auth check
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== env.ADMIN_PASSWORD) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  const sent = [];
  const errors = [];

  try {
    // Find scheduled campaigns that are due
    const now = new Date().toISOString();
    const campaignsResult = await env.DB.prepare(
      `SELECT c.id, c.shop_slug, c.campaign_type, c.email_subject, c.email_body, c.sms, c.sent_count
       FROM campaigns c
       WHERE c.status = 'scheduled'
         AND c.scheduled_for <= ?
       ORDER BY c.scheduled_for ASC
       LIMIT 50`
    ).bind(now).all();

    const campaigns = campaignsResult.results || [];

    if (campaigns.length === 0) {
      return json({ ok: true, message: 'No campaigns due for sending', sent: 0 });
    }

    for (const campaign of campaigns) {
      try {
        // Get shop info and customer list for this campaign
        const shop = await env.DB.prepare(
          `SELECT name, email FROM shops WHERE slug = ?`
        ).bind(campaign.shop_slug).first();

        // Get customers with email/phone for this shop
        const customers = await env.DB.prepare(
          `SELECT email, phone FROM customers WHERE shop_slug = ? LIMIT 100`
        ).bind(campaign.shop_slug).all();

        const customerList = customers.results || [];
        let emailsSent = 0;
        let smsSent = 0;

        // Send emails
        if (campaign.email_subject && campaign.email_body && env.RESEND_API_KEY) {
          const emailRecipients = customerList
            .filter(c => c.email)
            .map(c => c.email);

          if (emailRecipients.length > 0) {
            try {
              // Send in batches of 10
              for (let i = 0; i < emailRecipients.length; i += 10) {
                const batch = emailRecipients.slice(i, i + 10);
                await sendEmail(env, batch, campaign.email_subject, campaign.email_body);
                emailsSent += batch.length;
              }
            } catch (emailErr) {
              errors.push({ campaignId: campaign.id, type: 'email', error: emailErr.message });
            }
          }
        }

        // Send SMS
        if (campaign.sms && env.TWILIO_ACCOUNT_SID) {
          const smsRecipients = customerList
            .filter(c => c.phone)
            .map(c => c.phone);

          for (const phone of smsRecipients) {
            try {
              await sendSMS(env, phone, campaign.sms);
              smsSent++;
            } catch (smsErr) {
              errors.push({ campaignId: campaign.id, type: 'sms', phone, error: smsErr.message });
            }
          }
        }

        const totalSent = emailsSent + smsSent;
        const newSentCount = (campaign.sent_count || 0) + totalSent;

        // Update campaign status
        await env.DB.prepare(
          `UPDATE campaigns SET status = 'sent', sent_count = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(newSentCount, campaign.id).run();

        sent.push({
          campaignId: campaign.id,
          shop: campaign.shop_slug,
          emailsSent,
          smsSent,
        });
      } catch (campErr) {
        errors.push({ campaignId: campaign.id, error: campErr.message });

        // Mark as failed so it doesn't retry endlessly
        try {
          await env.DB.prepare(
            `UPDATE campaigns SET status = 'failed', updated_at = datetime('now') WHERE id = ?`
          ).bind(campaign.id).run();
        } catch (_) { /* ignore */ }
      }
    }

    return json({
      ok: true,
      sent: sent.length,
      failed: errors.length,
      results: sent,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e) {
    console.error('campaign-cron error:', e);
    return json({ ok: false, error: e.message || 'Cron execution failed' }, 500);
  }
}
