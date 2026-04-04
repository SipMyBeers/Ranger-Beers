// /api/photos — GET list, DELETE photos for an order

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/photos?shop=slug&order_id=X
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  const orderId = url.searchParams.get('order_id');
  if (!shop) return json({ error: 'shop parameter required' }, 400);

  let query = 'SELECT id, shop_slug, order_id, r2_key, filename, content_type, size_bytes, uploaded_by, caption, created_at FROM order_photos WHERE shop_slug = ?';
  const params = [shop];

  if (orderId) { query += ' AND order_id = ?'; params.push(orderId); }
  query += ' ORDER BY created_at DESC';

  try {
    const { results } = await context.env.DB.prepare(query).bind(...params).all();
    // Add URL to each photo
    const photos = results.map(function (p) {
      p.url = '/api/photos/' + encodeURIComponent(p.r2_key);
      return p;
    });
    return json(photos);
  } catch (err) {
    return json({ error: 'Failed to list photos' }, 500);
  }
}

// DELETE /api/photos?shop=slug&id=photoId
export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  const photoId = url.searchParams.get('id');
  if (!shop || !photoId) return json({ error: 'shop and id required' }, 400);

  try {
    // Get R2 key before deleting metadata
    const photo = await context.env.DB.prepare(
      'SELECT r2_key FROM order_photos WHERE id = ? AND shop_slug = ?'
    ).bind(photoId, shop).first();

    if (!photo) return json({ error: 'Photo not found' }, 404);

    // Delete from R2
    await context.env.PHOTOS.delete(photo.r2_key);

    // Delete metadata from D1
    await context.env.DB.prepare(
      'DELETE FROM order_photos WHERE id = ? AND shop_slug = ?'
    ).bind(photoId, shop).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Failed to delete photo' }, 500);
  }
}
