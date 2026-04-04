// POST /api/demo — creates ephemeral demo shop with pre-seeded data
// GET  /api/demo?slug=xxx — checks if demo shop exists

import { checkRateLimit } from './auth/_rate-limit.js';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// Sample orders for the demo
const DEMO_ORDERS = [
  {
    customer: 'SGT Rodriguez, J.',
    phone: '(910) 555-0142',
    email: 'demo@example.com',
    uniform: 'OCP Top',
    status: 'ready',
    urgency: 'on-track',
    deadline: null, // set dynamically
    data: {
      items: [
        { service: 'Name Tape', qty: 2, price: 5 },
        { service: 'Rank Insignia', qty: 2, price: 6 },
        { service: 'Unit Patch', qty: 2, price: 5 },
      ],
      notes: 'E-6 promotion — needs SSG rank sewn on both sleeves',
      total: 32,
    },
  },
  {
    customer: 'PFC Kim, S.',
    phone: '(910) 555-0198',
    email: 'kim.s@army.mil',
    uniform: 'AGSU Jacket',
    status: 'in-progress',
    urgency: 'rush',
    deadline: null,
    data: {
      items: [
        { service: 'Hem Jacket', qty: 1, price: 25 },
        { service: 'Take In Sides', qty: 1, price: 20 },
        { service: 'Sleeve Shorten', qty: 2, price: 15 },
      ],
      notes: 'Promotion board Friday — RUSH',
      total: 75,
    },
  },
  {
    customer: 'SSG Park, M.',
    phone: '(910) 555-0211',
    email: 'park.m@army.mil',
    uniform: 'OCP Bottom',
    status: 'received',
    urgency: 'on-track',
    deadline: null,
    data: {
      items: [
        { service: 'Hem Pants', qty: 1, price: 12 },
        { service: 'Taper Legs', qty: 1, price: 15 },
      ],
      notes: 'Boot-blouse style, standard hem',
      total: 27,
    },
  },
  {
    customer: 'CPT Johnson, R.',
    phone: '(910) 555-0177',
    email: 'johnson.r@army.mil',
    uniform: 'Patrol Cap',
    status: 'picked-up',
    urgency: 'on-track',
    deadline: null,
    data: {
      items: [
        { service: 'Rank on Cap', qty: 1, price: 8 },
      ],
      notes: 'Captain rank, centered',
      total: 8,
    },
  },
  {
    customer: 'SPC Martinez, A.',
    phone: '(910) 555-0133',
    email: 'martinez.a@army.mil',
    uniform: 'OCP Top',
    status: 'received',
    urgency: 'on-track',
    deadline: null,
    data: {
      items: [
        { service: 'US Army Tape', qty: 1, price: 5 },
        { service: 'Name Tape', qty: 1, price: 5 },
        { service: 'Flag Patch', qty: 1, price: 5 },
        { service: 'Unit Patch', qty: 2, price: 5 },
      ],
      notes: 'New arrival, fresh OCP set',
      total: 25,
    },
  },
];

export async function onRequestPost(context) {
  try {
    // Rate limit: 3 demos per hour per IP
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';
    const allowed = await checkRateLimit(context.env.DB, `demo:${ip}`, 3, 3600);
    if (!allowed) return json({ error: 'Too many demo requests. Try again in an hour.' }, 429);

    // Cleanup expired demos (> 24h old) before creating new one
    const db = context.env.DB;
    try {
      const expired = await db.prepare(
        "SELECT slug FROM shops WHERE slug LIKE 'demo-%' AND created_at < datetime('now', '-1 day')"
      ).all();
      for (const shop of expired.results) {
        await db.batch([
          db.prepare('DELETE FROM orders WHERE shop_slug = ?').bind(shop.slug),
          db.prepare('DELETE FROM sessions WHERE shop_slug = ?').bind(shop.slug),
          db.prepare('DELETE FROM admin_users WHERE shop_slug = ?').bind(shop.slug),
          db.prepare('DELETE FROM notifications WHERE shop_slug = ?').bind(shop.slug),
          db.prepare('DELETE FROM shops WHERE slug = ?').bind(shop.slug),
        ]);
      }
    } catch (cleanupErr) {
      console.error('Demo cleanup error:', cleanupErr);
    }

    // Generate unique demo slug
    const demoId = crypto.randomUUID().substring(0, 8);
    const slug = `demo-${demoId}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Create demo shop
    await context.env.DB.prepare(`
      INSERT INTO shops (slug, name, tier, owner, address, phone, email, tagline,
        theme_primary, theme_secondary, theme_accent, admin_password, config, active)
      VALUES (?, 'Demo Tailor Shop', 'full', 'Demo Owner', '1247 Bragg Blvd, Fayetteville, NC 28301',
        '(910) 555-0100', 'demo@sewing.ranger-beers.com', 'Try SewReady — fully functional demo shop',
        '#3b82f6', '#1c2833', '#06b6d4', NULL, ?, 1)
    `).bind(slug, JSON.stringify({ demo: true, expires: expiresAt })).run();

    // Create demo admin user
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(process.env.DEMO_PASSWORD || '<demo-password>');
    await context.env.DB.prepare(`
      INSERT INTO admin_users (id, shop_slug, email, password_hash, name, role, active)
      VALUES (?, ?, 'demo@sewing.ranger-beers.com', ?, 'Demo Owner', 'owner', 1)
    `).bind(userId, slug, passwordHash).run();

    // Seed orders
    for (let i = 0; i < DEMO_ORDERS.length; i++) {
      const o = DEMO_ORDERS[i];
      const orderId = `SR-${String(1001 + i).padStart(4, '0')}`;
      const daysFromNow = [0, 1, 3, -1, 5][i];
      const deadline = new Date(now.getTime() + daysFromNow * 86400000).toISOString().split('T')[0];

      await context.env.DB.prepare(`
        INSERT INTO orders (id, shop_slug, status, customer, phone, email, uniform, deadline, urgency, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId, slug, o.status, o.customer, o.phone, o.email,
        o.uniform, deadline, o.urgency, JSON.stringify(o.data)
      ).run();
    }

    // Seed a notification
    await context.env.DB.prepare(`
      INSERT INTO notifications (id, shop_slug, type, title, body, order_id, read)
      VALUES (?, ?, 'new-order', 'New Order Received', 'SPC Martinez placed an online order', 'SR-1005', 0)
    `).bind(crypto.randomUUID(), slug).run();

    // Create session
    const token = crypto.randomUUID();
    await context.env.DB.prepare(
      'INSERT INTO sessions (token, shop_slug, user_id, role, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(token, slug, userId, 'owner', expiresAt).run();

    const cookie = `sewready_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;

    return json({
      ok: true,
      slug,
      redirect: `/shops/${slug}/index.html`,
      credentials: { email: 'demo@sewing.ranger-beers.com', password: '<demo-password>' },
      expires: expiresAt,
    }, 201, { 'Set-Cookie': cookie });

  } catch (err) {
    console.error('Demo creation error:', err);
    return json({ error: 'Failed to create demo. Please try again.' }, 500);
  }
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return json({ error: 'slug parameter required' }, 400);
  }

  const shop = await context.env.DB.prepare(
    'SELECT slug, name, config FROM shops WHERE slug = ?'
  ).bind(slug).first();

  if (!shop) {
    return json({ exists: false });
  }

  let config = {};
  try { config = JSON.parse(shop.config || '{}'); } catch (e) {}

  return json({
    exists: true,
    demo: !!config.demo,
    expires: config.expires || null,
  });
}
