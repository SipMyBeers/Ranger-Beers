// GET /api/analytics — SQL aggregations on orders by date range
// Query params: shop, start, end (ISO dates)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  const start = url.searchParams.get('start') || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const end = url.searchParams.get('end') || new Date().toISOString().slice(0, 10);

  if (!shop) return json({ error: 'shop parameter required' }, 400);

  try {
    // Total orders in range
    const totalOrders = await context.env.DB.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE shop_slug = ? AND date(created_at) BETWEEN ? AND ?"
    ).bind(shop, start, end).first();

    // Orders by status
    const { results: byStatus } = await context.env.DB.prepare(
      "SELECT status, COUNT(*) as count FROM orders WHERE shop_slug = ? AND date(created_at) BETWEEN ? AND ? GROUP BY status"
    ).bind(shop, start, end).all();

    // Orders per day
    const { results: perDay } = await context.env.DB.prepare(
      "SELECT date(created_at) as day, COUNT(*) as count FROM orders WHERE shop_slug = ? AND date(created_at) BETWEEN ? AND ? GROUP BY date(created_at) ORDER BY day"
    ).bind(shop, start, end).all();

    // Revenue per day (from data JSON — parse price field)
    const { results: allOrders } = await context.env.DB.prepare(
      "SELECT data, created_at FROM orders WHERE shop_slug = ? AND date(created_at) BETWEEN ? AND ?"
    ).bind(shop, start, end).all();

    let totalRevenue = 0;
    const revenueByDay = {};
    const serviceCounts = {};
    const uniformCounts = {};

    allOrders.forEach(function (row) {
      try {
        const d = JSON.parse(row.data || '{}');
        const price = parseFloat(d.totalPrice || d.total || d.price || 0);
        totalRevenue += price;

        const day = (row.created_at || '').slice(0, 10);
        revenueByDay[day] = (revenueByDay[day] || 0) + price;

        // Count services
        if (d.services && Array.isArray(d.services)) {
          d.services.forEach(function (s) {
            var name = typeof s === 'string' ? s : (s.name || s.id || 'Unknown');
            serviceCounts[name] = (serviceCounts[name] || 0) + 1;
          });
        }

        // Count uniform types
        if (d.uniform) {
          uniformCounts[d.uniform] = (uniformCounts[d.uniform] || 0) + 1;
        }
        if (d.items && Array.isArray(d.items)) {
          d.items.forEach(function (item) {
            var key = item.key || item.name || 'Unknown';
            uniformCounts[key] = (uniformCounts[key] || 0) + 1;
          });
        }
      } catch (e) { /* skip unparseable */ }
    });

    // Today's orders
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = await context.env.DB.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE shop_slug = ? AND date(created_at) = ?"
    ).bind(shop, today).first();

    // Top services (sorted)
    const topServices = Object.entries(serviceCounts)
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 10)
      .map(function (e) { return { name: e[0], count: e[1] }; });

    // Top uniforms
    const topUniforms = Object.entries(uniformCounts)
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 10)
      .map(function (e) { return { name: e[0], count: e[1] }; });

    return json({
      period: { start, end },
      totalOrders: totalOrders.count,
      todayOrders: todayOrders.count,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgOrderValue: totalOrders.count > 0 ? Math.round((totalRevenue / totalOrders.count) * 100) / 100 : 0,
      byStatus,
      perDay,
      revenueByDay: Object.entries(revenueByDay).map(function (e) { return { day: e[0], revenue: e[1] }; }).sort(function (a, b) { return a.day.localeCompare(b.day); }),
      topServices,
      topUniforms,
    });
  } catch (err) {
    return json({ error: 'Analytics query failed' }, 500);
  }
}
