// Shared D1-based sliding window rate limiter

export async function checkRateLimit(db, key, maxAttempts, windowSeconds) {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;

  // Clean old entries and count recent
  await db.prepare('DELETE FROM rate_limits WHERE key = ? AND ts < ?').bind(key, cutoff).run();
  const row = await db.prepare('SELECT COUNT(*) as count FROM rate_limits WHERE key = ?').bind(key).first();

  if (row.count >= maxAttempts) return false;

  // Record this attempt
  await db.prepare('INSERT INTO rate_limits (key, ts) VALUES (?, ?)').bind(key, now).run();
  return true;
}
