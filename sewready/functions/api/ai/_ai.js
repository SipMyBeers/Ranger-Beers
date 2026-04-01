// ══════════════════════════════════════════════════════════════
//  Shared Workers AI helper
//  Usage: import { generate } from './_ai.js';
//  const text = await generate(env.AI, systemPrompt, userPrompt);
//  const text = await generate(env.AI, systemPrompt, userPrompt, { history, maxTokens });
// ══════════════════════════════════════════════════════════════

export async function generate(ai, systemPrompt, userPrompt, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(options.history || []),
    { role: 'user', content: userPrompt }
  ];

  const result = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
    messages,
    max_tokens: options.maxTokens || 500,
    temperature: options.temperature || 0.7,
  });

  return result.response || '';
}
