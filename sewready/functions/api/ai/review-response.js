// ══════════════════════════════════════════════════════════════
//  AI-Powered Review Response Generator
//  POST { stars, reviewText, shopName, vertical, shopSlug? }
//  Returns { ok, response, id }
// ══════════════════════════════════════════════════════════════

import { generate } from './_ai.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function buildSystemPrompt(shopName, vertical, stars) {
  const rating = Number(stars);
  let tone = '';
  if (rating >= 5) {
    tone = 'For this 5-star review: be grateful, mention their specific praise, and invite them back.';
  } else if (rating >= 3) {
    tone = 'For this 3-4 star review: acknowledge the positives, address concerns thoughtfully, and offer to make it right.';
  } else {
    tone = 'For this 1-2 star review: be empathetic, apologize sincerely, and offer direct contact to resolve the issue.';
  }

  return [
    `You are the owner of ${shopName}, a ${vertical} shop.`,
    'Respond to customer reviews professionally and warmly.',
    tone,
    'Keep your response under 100 words.',
    'Never be defensive or dismissive.',
    'Include the shop phone number using the (910) 555-xxxx pattern (make up the last four digits and keep them consistent).',
    'Do not include a greeting like "Dear customer" — jump straight into the response.',
    'Output ONLY the response text, no labels or formatting.'
  ].join(' ');
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { stars, reviewText, shopName, vertical, shopSlug } = body;

    if (stars === undefined || !reviewText || !shopName || !vertical) {
      return json({ ok: false, error: 'Missing required fields: stars, reviewText, shopName, vertical' }, 400);
    }

    const rating = Number(stars);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return json({ ok: false, error: 'stars must be a number between 1 and 5' }, 400);
    }

    const systemPrompt = buildSystemPrompt(shopName, vertical, rating);
    const userPrompt = `${rating}-star review: "${reviewText}"`;

    const response = await generate(env.AI, systemPrompt, userPrompt, {
      maxTokens: 200,
      temperature: 0.7
    });

    // Store as draft in D1
    let id = null;
    try {
      const result = await env.DB.prepare(
        `INSERT INTO review_responses (shop_slug, stars, review_text, response_text, status, created_at)
         VALUES (?, ?, ?, ?, 'draft', datetime('now'))`
      ).bind(shopSlug || 'default', rating, reviewText, response).run();
      id = result.meta?.last_row_id || null;
    } catch (dbErr) {
      // D1 write failure is non-fatal — still return the AI response
      console.error('D1 insert failed:', dbErr.message);
    }

    return json({ ok: true, response, id });
  } catch (e) {
    console.error('review-response error:', e);
    return json({ ok: false, error: 'Failed to generate review response' }, 500);
  }
}
