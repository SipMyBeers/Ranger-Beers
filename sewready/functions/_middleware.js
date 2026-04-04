// CORS middleware + hostname routing

const ALLOWED_ORIGINS = [
  'https://sites.ranger-beers.com',
  'https://sewing.ranger-beers.com',
  'http://localhost:8788',
];

const MOVED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We've Moved — Ranger Beers Sites</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'SF Mono','Fira Code','JetBrains Mono',monospace;background:#0a0a0a;color:#f5f0eb;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{text-align:center;max-width:520px;padding:48px 36px;background:rgba(20,18,16,.6);border:1px solid rgba(201,168,76,.25);border-radius:20px;backdrop-filter:blur(20px)}
    .badge{font-size:.6rem;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;margin-bottom:16px}
    h1{font-size:1.8rem;margin-bottom:12px;letter-spacing:-0.5px}
    h1 span{color:#c9a84c}
    p{font-size:.95rem;color:rgba(245,240,235,.5);line-height:1.7;margin-bottom:28px}
    .btn{display:inline-block;padding:14px 36px;background:#c9a84c;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:.9rem;border-radius:12px;transition:background .2s;letter-spacing:1px}
    .btn:hover{background:#d4b65e}
    .sub{font-size:.7rem;color:rgba(245,240,235,.2);margin-top:20px}
    .sub a{color:rgba(201,168,76,.5);text-decoration:none}
    .sub a:hover{color:#c9a84c}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Ranger Beers</div>
    <h1>We've <span>Moved</span></h1>
    <p>Our sites platform has a new home. Same great service, new address. All sewing shops, surplus stores, smoke shops, and more are now at:</p>
    <a href="https://sites.ranger-beers.com" class="btn">sites.ranger-beers.com</a>
    <div class="sub">Questions? <a href="mailto:owner@ranger-beers.com">owner@ranger-beers.com</a> &middot; (503) 592-3451</div>
  </div>
</body>
</html>`;

function getAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.endsWith('.pages.dev')) return origin;
  return null;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Serve "we've moved" page for sewing.ranger-beers.com (non-API, non-shop requests)
  if (url.hostname === 'sewing.ranger-beers.com'
      && !url.pathname.startsWith('/api/')
      && !url.pathname.startsWith('/shops/')) {
    return new Response(MOVED_HTML, {
      status: 301,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Location': 'https://sites.ranger-beers.com' + url.pathname,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Redirect shop pages on old domain to new domain
  if (url.hostname === 'sewing.ranger-beers.com' && url.pathname.startsWith('/shops/')) {
    return Response.redirect('https://sites.ranger-beers.com' + url.pathname + url.search, 301);
  }

  const origin = getAllowedOrigin(request);

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin && { 'Access-Control-Allow-Origin': origin }),
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = await context.next();

  if (origin) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', origin);
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    newHeaders.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
}
