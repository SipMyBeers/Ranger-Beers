// GET /api/export?shop=slug&type=orders|customers|analytics&format=csv
// Requires valid session (checked via cookie)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function csvEscape(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const shop = url.searchParams.get('shop');
  const type = url.searchParams.get('type') || 'orders';

  if (!shop) {
    return json({ error: 'shop parameter required' }, 400);
  }

  // Validate session
  const cookieHeader = context.request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/sewready_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return json({ error: 'Authentication required' }, 401);
  }

  const session = await context.env.DB.prepare(
    'SELECT shop_slug, user_id, role, expires_at FROM sessions WHERE token = ?'
  ).bind(token).first();

  if (!session || new Date(session.expires_at) < new Date()) {
    return json({ error: 'Invalid or expired session' }, 401);
  }

  if (session.shop_slug !== shop) {
    return json({ error: 'Access denied' }, 403);
  }

  let csv = '';
  let filename = '';

  try {
    if (type === 'orders') {
      const { results } = await context.env.DB.prepare(
        'SELECT id, status, customer, phone, email, uniform, deadline, urgency, data, created_at, updated_at FROM orders WHERE shop_slug = ? ORDER BY created_at DESC'
      ).bind(shop).all();

      const rows = results.map(r => {
        let total = '';
        let items = '';
        let notes = '';
        try {
          const d = JSON.parse(r.data || '{}');
          total = d.total || '';
          items = (d.items || []).map(i => `${i.service} x${i.qty}`).join('; ');
          notes = d.notes || '';
        } catch (e) {}
        return {
          order_id: r.id,
          status: r.status,
          customer: r.customer,
          phone: r.phone,
          email: r.email,
          uniform: r.uniform,
          deadline: r.deadline,
          urgency: r.urgency,
          items,
          total,
          notes,
          created: r.created_at,
          updated: r.updated_at,
        };
      });

      const headers = ['order_id', 'status', 'customer', 'phone', 'email', 'uniform', 'deadline', 'urgency', 'items', 'total', 'notes', 'created', 'updated'];
      csv = toCsv(headers, rows);
      filename = `${shop}-orders-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'customers') {
      const { results } = await context.env.DB.prepare(
        'SELECT id, name, phone, email, unit, created_at FROM customers WHERE shop_slug = ? ORDER BY name'
      ).bind(shop).all();

      const rows = results.map(r => ({
        customer_id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        unit: r.unit,
        created: r.created_at,
      }));

      const headers = ['customer_id', 'name', 'phone', 'email', 'unit', 'created'];
      csv = toCsv(headers, rows);
      filename = `${shop}-customers-${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'analytics') {
      // Summary stats
      const orderCount = await context.env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM orders WHERE shop_slug = ?'
      ).bind(shop).first();

      const statusCounts = await context.env.DB.prepare(
        'SELECT status, COUNT(*) as cnt FROM orders WHERE shop_slug = ? GROUP BY status'
      ).bind(shop).all();

      const monthlyOrders = await context.env.DB.prepare(`
        SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as orders,
          SUM(CASE WHEN json_extract(data, '$.total') IS NOT NULL THEN CAST(json_extract(data, '$.total') AS REAL) ELSE 0 END) as revenue
        FROM orders WHERE shop_slug = ?
        GROUP BY month ORDER BY month DESC LIMIT 12
      `).bind(shop).all();

      const rows = monthlyOrders.results.map(r => ({
        month: r.month,
        orders: r.orders,
        revenue: r.revenue || 0,
      }));

      const headers = ['month', 'orders', 'revenue'];
      csv = toCsv(headers, rows);
      filename = `${shop}-analytics-${new Date().toISOString().split('T')[0]}.csv`;

    } else {
      return json({ error: 'Invalid type. Use: orders, customers, or analytics' }, 400);
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err) {
    console.error('Export error:', err);
    return json({ error: 'Export failed' }, 500);
  }
}
