// ══════════════════════════════════════════════════════════════
//  AI-Powered Customer Chatbot
//  POST { message, vertical, shopName, shopSlug?, sessionId? }
//  Returns { ok, reply, sessionId }
// ══════════════════════════════════════════════════════════════

import { generate } from './_ai.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function buildSystemPrompt(shopName, vertical) {
  const verticalKnowledge = {
    sewing: [
      'Services include: name tape sewing ($5-$10), patch attach ($8-$12), rank insignia ($4), full OCP setup ($35-$65), AGSU setup ($40-$65), hemming & alterations ($10-$25), beret shaping ($8), boot blousing ($4), PCS strip & re-sew bundles.',
      'All work is done per AR 670-1 and DA PAM 670-1 regulations.',
      'Most individual services have same-day turnaround. Full setups may take 1-2 hours.'
    ],
    surplus: [
      'Products include: BDU/OCP uniforms ($15-$45), combat boots ($25-$85), rucksacks ($30-$80), MOLLE gear, sleep systems ($40-$120), wet weather gear, canteens, e-tools, poncho liners (woobie), patches, insignia, medals, ribbons, MREs, and tactical gear.',
      'All items are genuine military surplus, inspected and priced below retail.',
      'We buy surplus items too — customers can sell their gear to us.'
    ],
    smoke: [
      'Products include: vape devices & starter kits ($20-$80), e-liquids ($8-$25), premium cigars ($5-$50), CBD products, glass pieces ($15-$200+), rolling papers & accessories ($2-$5), lighters, grinders.',
      'Must be 21+ with valid ID to enter.',
      'Staff can help with product recommendations and we offer device trade-in programs.'
    ]
  };

  const knowledge = (verticalKnowledge[vertical] || verticalKnowledge.sewing).join(' ');

  return [
    `You are a friendly AI assistant for ${shopName}, a ${vertical} shop.`,
    `You know about the shop's services, prices, and hours.`,
    knowledge,
    'Shop hours: Monday-Friday 9am-6pm, Saturday 10am-3pm, Closed Sunday.',
    'You can help book appointments — suggest available times during business hours.',
    'Keep responses concise (2-3 sentences max).',
    'Be helpful and friendly, use occasional emojis.',
    `If you can't answer something, say "Let me connect you with the owner" and provide the shop phone number: (910) 555-0147.`,
    'Output ONLY your reply, no labels or formatting.'
  ].join(' ');
}

function makeSessionId() {
  return 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

async function loadHistory(db, sessionId) {
  try {
    const rows = await db.prepare(
      `SELECT role, content FROM chat_logs
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT 10`
    ).bind(sessionId).all();

    // Reverse so oldest first, and take last 5 pairs (10 rows max)
    return (rows.results || []).reverse().map(r => ({
      role: r.role,
      content: r.content
    }));
  } catch {
    return [];
  }
}

async function storeMessage(db, sessionId, shopSlug, role, content) {
  try {
    await db.prepare(
      `INSERT INTO chat_logs (session_id, shop_slug, role, content, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`
    ).bind(sessionId, shopSlug || 'default', role, content).run();
  } catch (dbErr) {
    console.error('chat_logs insert failed:', dbErr.message);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { message, vertical, shopName, shopSlug, sessionId: incomingSessionId } = body;

    if (!message || !vertical || !shopName) {
      return json({ ok: false, error: 'Missing required fields: message, vertical, shopName' }, 400);
    }

    const sessionId = incomingSessionId || makeSessionId();
    const systemPrompt = buildSystemPrompt(shopName, vertical);

    // Load conversation history from D1
    const history = await loadHistory(env.DB, sessionId);

    // Generate AI reply with conversation context
    const reply = await generate(env.AI, systemPrompt, message, {
      history,
      maxTokens: 200,
      temperature: 0.7
    });

    // Store both user message and bot reply in D1
    await storeMessage(env.DB, sessionId, shopSlug, 'user', message);
    await storeMessage(env.DB, sessionId, shopSlug, 'assistant', reply);

    return json({ ok: true, reply, sessionId });
  } catch (e) {
    console.error('chat error:', e);
    return json({ ok: false, error: 'Failed to generate chat response' }, 500);
  }
}
