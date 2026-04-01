// POST /api/photos/upload — multipart upload → R2 + D1 metadata
// Limits: 5 photos per order, 10MB each

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PHOTOS_PER_ORDER = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file');
    const shopSlug = formData.get('shop_slug');
    const orderId = formData.get('order_id');
    const caption = formData.get('caption') || '';
    const uploadedBy = formData.get('uploaded_by') || 'unknown';

    if (!file || !shopSlug || !orderId) {
      return json({ error: 'file, shop_slug, and order_id required' }, 400);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, HEIC' }, 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return json({ error: 'File too large. Maximum 10MB.' }, 400);
    }

    // Check existing photo count for this order
    const countResult = await context.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM order_photos WHERE shop_slug = ? AND order_id = ?'
    ).bind(shopSlug, orderId).first();

    if (countResult.cnt >= MAX_PHOTOS_PER_ORDER) {
      return json({ error: 'Maximum ' + MAX_PHOTOS_PER_ORDER + ' photos per order' }, 400);
    }

    // Generate R2 key
    const ext = file.name.split('.').pop() || 'jpg';
    const uuid = crypto.randomUUID();
    const r2Key = `${shopSlug}/${orderId}/${uuid}.${ext}`;

    // Upload to R2
    await context.env.PHOTOS.put(r2Key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { shopSlug, orderId, uploadedBy },
    });

    // Save metadata to D1
    const photoId = crypto.randomUUID();
    await context.env.DB.prepare(
      'INSERT INTO order_photos (id, shop_slug, order_id, r2_key, filename, content_type, size_bytes, uploaded_by, caption) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(photoId, shopSlug, orderId, r2Key, file.name, file.type, file.size, uploadedBy, caption).run();

    return json({
      id: photoId,
      r2_key: r2Key,
      filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
      url: '/api/photos/' + encodeURIComponent(r2Key),
    }, 201);

  } catch (err) {
    return json({ error: 'Upload failed' }, 500);
  }
}
