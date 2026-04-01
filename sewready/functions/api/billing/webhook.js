// POST /api/billing/webhook
// Snipcart webhook handler — syncs subscription + order state to D1
// Configure this URL in Snipcart Dashboard → Webhooks
// NOTE: This endpoint must NOT be behind admin auth middleware

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Verify Snipcart request token via their API
async function verifySnipcartToken(token, apiKey) {
  if (!token) return false;
  try {
    const resp = await fetch('https://app.snipcart.com/api/requestvalidation/' + token, {
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Accept': 'application/json',
      },
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// Extract shop slug from order/subscription custom fields
function getShopSlug(item) {
  if (!item) return null;
  const customFields = item.customFields || [];
  const shopField = customFields.find(f => f.name === 'Shop');
  return shopField ? shopField.value : null;
}

// Determine tier from item ID
function getTierFromItemId(itemId) {
  if (itemId === 'plan-full') return 'full';
  if (itemId === 'plan-online') return 'online';
  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const payload = await request.text();

  // Verify webhook authenticity
  const requestToken = request.headers.get('x-snipcart-requesttoken');
  const apiKey = env.SNIPCART_SECRET_KEY || env.SNIPCART_API_KEY;
  if (apiKey && requestToken) {
    const valid = await verifySnipcartToken(requestToken, apiKey);
    if (!valid) {
      return json({ error: 'Invalid request token' }, 400);
    }
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const eventName = event.eventName;
  const content = event.content;

  if (!content) {
    return json({ received: true });
  }

  try {
    switch (eventName) {

      // ── Order completed (hardware purchases + initial subscription) ──
      case 'order.completed': {
        const items = content.items || [];
        const userEmail = content.email || content.user?.email;
        const snipcartToken = content.token;

        for (const item of items) {
          const tier = getTierFromItemId(item.id);
          if (!tier) continue; // hardware item, skip tier update

          const slug = getShopSlug(item);
          if (!slug) continue;

          await env.DB.prepare(
            `UPDATE shops SET
              snipcart_customer_email = ?,
              snipcart_order_token = ?,
              subscription_status = 'active',
              tier = ?,
              updated_at = datetime('now')
            WHERE slug = ?`
          ).bind(userEmail || '', snipcartToken || '', tier, slug).run();
        }
        break;
      }

      // ── Subscription created ──────────────────────────────
      case 'subscription.created': {
        const subscriptionId = content.id;
        const item = content.item || {};
        const slug = getShopSlug(item);
        const tier = getTierFromItemId(item.id);
        const userEmail = content.user?.email;

        if (slug) {
          await env.DB.prepare(
            `UPDATE shops SET
              snipcart_subscription_id = ?,
              snipcart_customer_email = ?,
              subscription_status = 'active',
              tier = ?,
              updated_at = datetime('now')
            WHERE slug = ?`
          ).bind(subscriptionId || '', userEmail || '', tier || 'online', slug).run();
        }
        break;
      }

      // ── Subscription paused ───────────────────────────────
      case 'subscription.paused': {
        const subscriptionId = content.id;
        const item = content.item || {};
        const slug = getShopSlug(item);

        if (slug) {
          await env.DB.prepare(
            `UPDATE shops SET
              subscription_status = 'paused',
              updated_at = datetime('now')
            WHERE slug = ?`
          ).bind(slug).run();
        } else if (subscriptionId) {
          await env.DB.prepare(
            `UPDATE shops SET
              subscription_status = 'paused',
              updated_at = datetime('now')
            WHERE snipcart_subscription_id = ?`
          ).bind(subscriptionId).run();
        }
        break;
      }

      // ── Subscription resumed ──────────────────────────────
      case 'subscription.resumed': {
        const subscriptionId = content.id;
        const item = content.item || {};
        const slug = getShopSlug(item);

        if (slug) {
          await env.DB.prepare(
            `UPDATE shops SET
              subscription_status = 'active',
              updated_at = datetime('now')
            WHERE slug = ?`
          ).bind(slug).run();
        } else if (subscriptionId) {
          await env.DB.prepare(
            `UPDATE shops SET
              subscription_status = 'active',
              updated_at = datetime('now')
            WHERE snipcart_subscription_id = ?`
          ).bind(subscriptionId).run();
        }
        break;
      }

      // ── Subscription cancelled ────────────────────────────
      case 'subscription.cancelled': {
        const subscriptionId = content.id;
        const item = content.item || {};
        const slug = getShopSlug(item);

        if (slug) {
          await env.DB.prepare(
            `UPDATE shops SET
              subscription_status = 'canceled',
              tier = 'storefront',
              updated_at = datetime('now')
            WHERE slug = ?`
          ).bind(slug).run();
        } else if (subscriptionId) {
          await env.DB.prepare(
            `UPDATE shops SET
              subscription_status = 'canceled',
              tier = 'storefront',
              updated_at = datetime('now')
            WHERE snipcart_subscription_id = ?`
          ).bind(subscriptionId).run();
        }
        break;
      }

      // ── Subscription invoice created (payment attempt) ────
      case 'subscription.invoice.created': {
        // Could track payment attempts here if needed
        break;
      }

      default:
        // Unhandled event — acknowledge receipt
        break;
    }
  } catch (err) {
    // Log but still return 200 so Snipcart doesn't retry excessively
    console.error('Webhook processing error:', err);
  }

  return json({ received: true });
}
