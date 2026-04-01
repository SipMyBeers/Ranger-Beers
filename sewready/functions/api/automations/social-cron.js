// ══════════════════════════════════════════════════════════════
//  Social Content Auto-Generator (Cron Endpoint)
//  POST — called by external cron, protected by X-API-Key
// ══════════════════════════════════════════════════════════════

import { generate } from '../ai/_ai.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function generateId() {
  return 'sp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const PLATFORMS = ['instagram', 'facebook', 'tiktok'];

function getNextScheduledTime() {
  // Schedule for tomorrow at 10 AM UTC
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(10, 0, 0, 0);
  return tomorrow.toISOString();
}

export async function onRequestPost({ request, env }) {
  // Auth check
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== env.ADMIN_PASSWORD) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  const results = [];
  const errors = [];

  try {
    // Query shops with social automation enabled
    const shopsResult = await env.DB.prepare(
      `SELECT s.slug, s.name, s.vertical
       FROM shops s
       JOIN automation_config ac ON ac.shop_slug = s.slug
       WHERE ac.feature = 'social'
         AND ac.enabled = 1
         AND s.active = 1`
    ).all();

    const shops = shopsResult.results || [];

    if (shops.length === 0) {
      return json({ ok: true, message: 'No shops with social automation enabled', generated: 0 });
    }

    for (const shop of shops) {
      try {
        const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];

        const systemPrompt = `You are a social media manager for a ${shop.vertical || 'sewing'} shop called "${shop.name}". Create engaging social media posts with emojis, calls-to-action, and relevant hashtags. Keep posts concise and platform-appropriate.

You MUST respond in EXACTLY this format with these three sections, each on its own line:
CAPTION: (the full post caption with emojis and CTA)
HASHTAGS: (comma-separated hashtags, each starting with #)
IMAGE_PROMPT: (a descriptive prompt for generating an accompanying image)`;

        const userPrompt = `Generate a ${platform} post for "${shop.name}". Make it timely, engaging, and include a clear call-to-action.`;

        const raw = await generate(env.AI, systemPrompt, userPrompt, { maxTokens: 400 });

        // Parse response
        let caption = '';
        let hashtags = [];
        let imagePrompt = '';

        const captionMatch = raw.match(/CAPTION:\s*(.+?)(?=\nHASHTAGS:|$)/s);
        const hashtagMatch = raw.match(/HASHTAGS:\s*(.+?)(?=\nIMAGE_PROMPT:|$)/s);
        const imageMatch = raw.match(/IMAGE_PROMPT:\s*(.+)/s);

        caption = captionMatch ? captionMatch[1].trim() : raw.trim();

        if (hashtagMatch) {
          hashtags = hashtagMatch[1].trim().split(/[,\s]+/).filter(h => h.startsWith('#'));
        } else {
          hashtags = (caption.match(/#\w+/g) || []);
        }

        imagePrompt = imageMatch
          ? imageMatch[1].trim()
          : `Professional photo for a ${shop.vertical} shop social media post`;

        const id = generateId();
        const scheduledFor = getNextScheduledTime();

        await env.DB.prepare(
          `INSERT INTO social_posts (id, shop_slug, caption, hashtags, platform, image_prompt, status, scheduled_for, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, datetime('now'))`
        ).bind(
          id,
          shop.slug,
          caption,
          JSON.stringify(hashtags),
          platform,
          imagePrompt,
          scheduledFor
        ).run();

        results.push({ shop: shop.slug, postId: id, platform, scheduledFor });
      } catch (shopErr) {
        errors.push({ shop: shop.slug, error: shopErr.message });
      }
    }

    return json({
      ok: true,
      generated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (e) {
    console.error('social-cron error:', e);
    return json({ ok: false, error: e.message || 'Cron execution failed' }, 500);
  }
}
