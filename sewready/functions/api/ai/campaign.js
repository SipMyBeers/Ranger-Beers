// ══════════════════════════════════════════════════════════════
//  AI-Powered Marketing Campaign Generator
//  POST { vertical, shopName, shopSlug?, campaignType }
// ══════════════════════════════════════════════════════════════

import { generate } from './_ai.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function generateId() {
  return 'camp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const VALID_TYPES = ['holiday', 'newproduct', 'loyalty', 'seasonal', 'promotion', 'flash-sale'];

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { vertical, shopName, shopSlug, campaignType } = body;

    if (!vertical || !shopName || !campaignType) {
      return json({ ok: false, error: 'Missing required fields: vertical, shopName, campaignType' }, 400);
    }

    const systemPrompt = `You are a marketing expert for a ${vertical} shop called "${shopName}". Generate marketing campaign content that is professional, compelling, and drives action.

You MUST respond in EXACTLY this format with these three sections, each on its own line:
SUBJECT: (email subject line, under 60 characters)
BODY: (email body, 3-4 sentences, persuasive and professional)
SMS: (SMS message, MUST be under 160 characters total including any emojis)`;

    const userPrompt = `Create a ${campaignType} marketing campaign for "${shopName}", a ${vertical} shop. The email should feel personal and the SMS should be punchy and actionable.`;

    const raw = await generate(env.AI, systemPrompt, userPrompt, { maxTokens: 400 });

    // Parse structured response
    let subject = '';
    let emailBody = '';
    let sms = '';

    const subjectMatch = raw.match(/SUBJECT:\s*(.+?)(?=\nBODY:|$)/s);
    const bodyMatch = raw.match(/BODY:\s*(.+?)(?=\nSMS:|$)/s);
    const smsMatch = raw.match(/SMS:\s*(.+)/s);

    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    } else {
      subject = `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Special from ${shopName}`;
    }

    if (bodyMatch) {
      emailBody = bodyMatch[1].trim();
    } else {
      emailBody = raw.trim();
    }

    if (smsMatch) {
      sms = smsMatch[1].trim();
      // Enforce 160 char limit
      if (sms.length > 160) {
        sms = sms.substring(0, 157) + '...';
      }
    } else {
      sms = `${shopName}: Don't miss our ${campaignType} deals! Visit us today.`;
    }

    const id = generateId();

    // Store in D1 if available
    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO campaigns (id, shop_slug, campaign_type, email_subject, email_body, sms, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'draft', datetime('now'))`
        ).bind(
          id,
          shopSlug || 'demo',
          campaignType,
          subject,
          emailBody,
          sms
        ).run();
      } catch (dbErr) {
        console.error('D1 insert failed (campaigns):', dbErr.message);
      }
    }

    return json({
      ok: true,
      campaign: {
        id,
        email: { subject, body: emailBody },
        sms
      }
    });
  } catch (e) {
    console.error('campaign error:', e);
    return json({ ok: false, error: e.message || 'Failed to generate campaign' }, 500);
  }
}
