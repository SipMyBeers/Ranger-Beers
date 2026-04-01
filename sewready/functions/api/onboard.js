// POST /api/onboard — self-service shop creation
// Creates shop row + owner admin_user in D1

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

function slugify(name) {
  return name.toLowerCase()
    .replace(/[''"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { shop_name, address, phone, email, password, owner_name, theme_primary, tier } = body;

    // Validate required fields
    if (!shop_name || !email || !password || !owner_name) {
      return json({ error: 'Shop name, owner name, email, and password are required' }, 400);
    }

    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Generate slug
    let slug = slugify(shop_name);
    if (!slug) {
      return json({ error: 'Invalid shop name' }, 400);
    }

    // Check if slug exists, append number if needed
    const existing = await context.env.DB.prepare(
      'SELECT slug FROM shops WHERE slug = ?'
    ).bind(slug).first();

    if (existing) {
      // Try slug-2, slug-3, etc.
      let counter = 2;
      let newSlug = slug + '-' + counter;
      while (true) {
        const check = await context.env.DB.prepare(
          'SELECT slug FROM shops WHERE slug = ?'
        ).bind(newSlug).first();
        if (!check) { slug = newSlug; break; }
        counter++;
        newSlug = slug + '-' + counter;
        if (counter > 10) {
          return json({ error: 'Shop name is taken. Please choose a different name.' }, 409);
        }
      }
    }

    // Check if email already exists as admin_user
    const existingUser = await context.env.DB.prepare(
      'SELECT id FROM admin_users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (existingUser) {
      return json({ error: 'An account with this email already exists. Try signing in instead.' }, 409);
    }

    // Create shop
    const selectedTier = tier || 'storefront';
    const primaryColor = theme_primary || '#a855f7';

    await context.env.DB.prepare(`
      INSERT INTO shops (slug, name, tier, owner, address, phone, email, theme_primary, theme_secondary, theme_accent, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '#1c2833', '#06b6d4', 1)
    `).bind(slug, shop_name, selectedTier, owner_name, address || '', phone || '', email.toLowerCase(), primaryColor).run();

    // Create owner admin_user
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await context.env.DB.prepare(`
      INSERT INTO admin_users (id, shop_slug, email, password_hash, name, role, active)
      VALUES (?, ?, ?, ?, ?, 'owner', 1)
    `).bind(userId, slug, email.toLowerCase(), passwordHash, owner_name).run();

    // Create session so user is logged in immediately
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await context.env.DB.prepare(
      'INSERT INTO sessions (token, shop_slug, user_id, role, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(token, slug, userId, 'owner', expiresAt).run();

    // Audit log
    await context.env.DB.prepare(
      'INSERT INTO audit_log (shop_slug, user_id, user_name, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(slug, userId, owner_name, 'shop_created', 'shop', slug).run();

    const cookie = `sewready_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;

    return json({
      ok: true,
      shop: { slug, name: shop_name, tier: selectedTier },
      user: { id: userId, name: owner_name, email: email.toLowerCase(), role: 'owner', shop_slug: slug },
      redirect: `/shops/${slug}/index.html`,
    }, 201, { 'Set-Cookie': cookie });

  } catch (err) {
    console.error('Onboard error:', err);
    return json({ error: 'Failed to create shop. Please try again.' }, 500);
  }
}
