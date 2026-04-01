// GET /api/photos/:key — serve photo from R2
// The key is URL-encoded and may contain slashes (shop/order/uuid.ext)

export async function onRequestGet(context) {
  try {
    // Reconstruct the full R2 key from the URL path after /api/photos/
    const url = new URL(context.request.url);
    const pathAfterPhotos = url.pathname.replace('/api/photos/', '');
    const r2Key = decodeURIComponent(pathAfterPhotos);

    if (!r2Key) {
      return new Response(JSON.stringify({ error: 'Key required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const object = await context.env.PHOTOS.get(r2Key);
    if (!object) {
      return new Response(JSON.stringify({ error: 'Photo not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to serve photo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
