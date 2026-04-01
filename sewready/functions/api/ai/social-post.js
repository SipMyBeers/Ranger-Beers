// ══════════════════════════════════════════════════════════════
//  AI-Powered Social Post Generator
//  POST { vertical, shopName, shopSlug? }
// ══════════════════════════════════════════════════════════════

import { generate } from './_ai.js';

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

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { vertical, shopName, shopSlug } = body;

    if (!vertical || !shopName) {
      return json({ ok: false, error: 'Missing required fields: vertical, shopName' }, 400);
    }

    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];

    const systemPrompt = `You are a social media manager for a ${vertical} shop called "${shopName}". Create engaging social media posts with emojis, calls-to-action, and relevant hashtags. Keep posts concise and platform-appropriate.

You MUST respond in EXACTLY this format with these three sections, each on its own line:
CAPTION: (the full post caption with emojis and CTA)
HASHTAGS: (comma-separated hashtags, each starting with #)
IMAGE_PROMPT: (a descriptive prompt for generating an accompanying image)`;

    const userPrompt = `Generate a ${platform} post for "${shopName}", a ${vertical} shop. Make it engaging, authentic, and include a clear call-to-action.`;

    const raw = await generate(env.AI, systemPrompt, userPrompt, { maxTokens: 400 });

    // Parse structured response
    let caption = '';
    let hashtags = [];
    let imagePrompt = '';

    const captionMatch = raw.match(/CAPTION:\s*(.+?)(?=\nHASHTAGS:|$)/s);
    const hashtagMatch = raw.match(/HASHTAGS:\s*(.+?)(?=\nIMAGE_PROMPT:|$)/s);
    const imageMatch = raw.match(/IMAGE_PROMPT:\s*(.+)/s);

    if (captionMatch) {
      caption = captionMatch[1].trim();
    } else {
      // Fallback: use the whole response as caption
      caption = raw.trim();
    }

    if (hashtagMatch) {
      hashtags = hashtagMatch[1].trim().split(/[,\s]+/).filter(h => h.startsWith('#'));
    }
    // Extract any inline hashtags from caption if none parsed
    if (hashtags.length === 0) {
      hashtags = (caption.match(/#\w+/g) || []);
    }

    if (imageMatch) {
      imagePrompt = imageMatch[1].trim();
    } else {
      imagePrompt = `Professional photo for a ${vertical} shop social media post, ${shopName}`;
    }

    const id = generateId();

    // Store in D1 if available
    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO social_posts (id, shop_slug, caption, hashtags, platform, image_prompt, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'draft', datetime('now'))`
        ).bind(
          id,
          shopSlug || 'demo',
          caption,
          JSON.stringify(hashtags),
          platform,
          imagePrompt
        ).run();
      } catch (dbErr) {
        console.error('D1 insert failed (social_posts):', dbErr.message);
      }
    }

    return json({
      ok: true,
      post: {
        id,
        caption,
        hashtags,
        platform,
        imagePrompt
      }
    });
  } catch (e) {
    console.error('social-post error:', e);
    return json({ ok: false, error: e.message || 'Failed to generate social post' }, 500);
  }
}
