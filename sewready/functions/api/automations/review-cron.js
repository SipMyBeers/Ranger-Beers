// ══════════════════════════════════════════════════════════════
//  Review Response Cron — Bulk AI Response Generator
//  POST  (protected by ADMIN_PASSWORD)
//  Finds pending reviews without responses, generates them via AI,
//  and updates status to 'ready'.
// ══════════════════════════════════════════════════════════════

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

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
    `You are the owner of ${shopName || 'the shop'}, a ${vertical || 'retail'} shop.`,
    'Respond to customer reviews professionally and warmly.',
    tone,
    'Keep your response under 100 words.',
    'Never be defensive or dismissive.',
    'Include the shop phone number using the (910) 555-xxxx pattern.',
    'Output ONLY the response text, no labels or formatting.'
  ].join(' ');
}

async function generateResponse(ai, systemPrompt, reviewText, stars) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${stars}-star review: "${reviewText}"` }
  ];

  const result = await ai.run(MODEL, {
    messages,
    max_tokens: 200,
    temperature: 0.7
  });

  return (result.response || '').trim();
}

export async function onRequestPost({ request, env }) {
  try {
    // ── Auth check ──────────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const password = body.password || request.headers.get('X-Admin-Password') || '';

    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    // ── Fetch pending reviews that need AI responses ────────
    const pending = await env.DB.prepare(
      `SELECT id, shop_slug, stars, review_text
       FROM review_responses
       WHERE status = 'pending' AND (response_text IS NULL OR response_text = '')
       ORDER BY created_at ASC
       LIMIT 20`
    ).all();

    const rows = pending.results || [];

    if (rows.length === 0) {
      return json({ ok: true, processed: 0, message: 'No pending reviews to process' });
    }

    // ── Look up shop details for each unique shop_slug ─────
    const shopCache = {};
    for (const row of rows) {
      if (!shopCache[row.shop_slug]) {
        try {
          const shop = await env.DB.prepare(
            'SELECT name, vertical FROM shops WHERE slug = ?'
          ).bind(row.shop_slug).first();
          shopCache[row.shop_slug] = shop || { name: row.shop_slug, vertical: 'sewing' };
        } catch {
          shopCache[row.shop_slug] = { name: row.shop_slug, vertical: 'sewing' };
        }
      }
    }

    // ── Generate responses ─────────────────────────────────
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const shop = shopCache[row.shop_slug];
      const systemPrompt = buildSystemPrompt(shop.name, shop.vertical, row.stars);

      try {
        const responseText = await generateResponse(
          env.AI, systemPrompt, row.review_text, row.stars
        );

        await env.DB.prepare(
          `UPDATE review_responses
           SET response_text = ?, status = 'ready', updated_at = datetime('now')
           WHERE id = ?`
        ).bind(responseText, row.id).run();

        successCount++;
        results.push({ id: row.id, status: 'ready' });
      } catch (err) {
        errorCount++;
        results.push({ id: row.id, status: 'error', error: err.message });
      }
    }

    return json({
      ok: true,
      processed: rows.length,
      success: successCount,
      errors: errorCount,
      results
    });
  } catch (e) {
    console.error('review-cron error:', e);
    return json({ ok: false, error: 'Cron processing failed' }, 500);
  }
}
