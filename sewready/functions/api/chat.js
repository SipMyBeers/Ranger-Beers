// POST /api/chat — AI chat via Claude API
// Looks up shop config, builds system prompt, calls Claude Haiku

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  try {
    const { shop_slug, message, history } = await context.request.json();

    if (!shop_slug || !message) {
      return json({ error: 'shop_slug and message required' }, 400);
    }

    // Rate limiting: 20 msgs/session/hour (using simple D1 counter)
    // For now, we skip rate limiting implementation and rely on API key limits

    // Look up shop config
    const shop = await context.env.DB.prepare(
      'SELECT name, address, phone, email, config FROM shops WHERE slug = ?'
    ).bind(shop_slug).first();

    if (!shop) {
      return json({ error: 'Shop not found' }, 404);
    }

    let config = {};
    try { config = JSON.parse(shop.config || '{}'); } catch (e) {}

    // Build shop context for system prompt
    const hours = config.shopHours || {};
    const hoursStr = Object.entries(hours)
      .map(function (e) { return e[0] + ': ' + (e[1].closed ? 'Closed' : e[1].open + ' - ' + e[1].close); })
      .join(', ');

    const services = config.services || [];
    const servicesStr = services.length > 0
      ? services.slice(0, 20).map(function (s) { return s.name || s; }).join(', ')
      : 'Military uniform alterations, sewing, patches, name tapes, hemming, awards rack assembly';

    const systemPrompt = `You are ${shop.name}'s customer service assistant. You help customers with questions about the shop.

Shop Details:
- Name: ${shop.name}
- Address: ${shop.address || 'Contact us for address'}
- Phone: ${shop.phone || 'Contact us'}
- Email: ${shop.email || ''}
- Hours: ${hoursStr || 'Monday-Saturday, call for specific hours'}
- Services: ${servicesStr}

Guidelines:
- Keep responses concise (2-3 sentences max)
- Be friendly and professional
- If asked about pricing, give general ranges and suggest contacting the shop for exact quotes
- If asked about order status, direct them to use the order tracker on the website
- Only answer questions related to the shop and its services
- If unsure, suggest calling the shop directly`;

    // Build messages array
    const messages = [];
    if (history && Array.isArray(history)) {
      history.slice(-8).forEach(function (msg) {
        messages.push({ role: msg.role, content: msg.content });
      });
    }
    messages.push({ role: 'user', content: message });

    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return json({ error: 'AI chat not configured' }, 503);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return json({ error: 'AI service error', detail: errBody }, 502);
    }

    const result = await response.json();
    const reply = result.content && result.content[0] ? result.content[0].text : 'Sorry, I could not generate a response.';

    return json({ reply });

  } catch (err) {
    return json({ error: 'Chat failed' }, 500);
  }
}
