export async function onRequestGet(context) {
  const db = context.env.DB;
  const base = 'https://sewing.ranger-beers.com';
  let urls = [
    { loc: base + '/', priority: '1.0' },
    { loc: base + '/packages.html', priority: '0.8' },
  ];
  try {
    const shops = await db.prepare('SELECT slug FROM shops WHERE active = 1').all();
    if (shops.results) {
      shops.results.forEach(s => {
        urls.push({ loc: base + '/shops/' + s.slug + '/', priority: '0.7' });
      });
    }
  } catch (e) {}
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  });
}
