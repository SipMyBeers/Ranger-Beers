// ══════════════════════════════════════════════════════════════
//  SewReady — Analytics Dashboard
//  Canvas 2D charts (no library), fetches from /api/analytics
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  var slug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready';

  // Date range: default last 30 days
  var endDate = new Date();
  var startDate = new Date(Date.now() - 30 * 86400000);

  var startInput = document.getElementById('startDate');
  var endInput = document.getElementById('endDate');
  var refreshBtn = document.getElementById('refreshBtn');

  startInput.value = startDate.toISOString().slice(0, 10);
  endInput.value = endDate.toISOString().slice(0, 10);

  // Sidebar toggle
  var sidebarToggle = document.getElementById('sidebarToggle');
  var sidebar = document.getElementById('sidebar');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () { sidebar.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  refreshBtn.addEventListener('click', loadAnalytics);

  function loadAnalytics() {
    var s = startInput.value;
    var e = endInput.value;
    document.getElementById('dateRange').textContent = s + ' to ' + e;

    fetch('/api/analytics?shop=' + encodeURIComponent(slug) + '&start=' + s + '&end=' + e)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        renderStats(data);
        renderOrdersChart(data.perDay || []);
        renderRevenueChart(data.revenueByDay || []);
        renderStatusChart(data.byStatus || []);
        renderServicesChart(data.topServices || []);
      })
      .catch(function () {
        // Fallback: show zeros
        renderStats({ todayOrders: 0, totalRevenue: 0, avgOrderValue: 0, totalOrders: 0 });
      });
  }

  function renderStats(data) {
    document.getElementById('statOrdersToday').textContent = data.todayOrders || 0;
    document.getElementById('statRevenue').textContent = '$' + (data.totalRevenue || 0).toFixed(2);
    document.getElementById('statAvgValue').textContent = '$' + (data.avgOrderValue || 0).toFixed(2);
    document.getElementById('statTotalOrders').textContent = data.totalOrders || 0;
  }

  // ── Line Chart: Orders Per Day ───────────────────────────
  function renderOrdersChart(perDay) {
    var canvas = document.getElementById('ordersChart');
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth * 2;
    var h = canvas.height = 500;
    ctx.clearRect(0, 0, w, h);

    if (perDay.length === 0) {
      ctx.fillStyle = 'rgba(240,232,220,0.3)';
      ctx.font = '28px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No data for this period', w / 2, h / 2);
      return;
    }

    var pad = { top: 30, right: 30, bottom: 60, left: 60 };
    var cw = w - pad.left - pad.right;
    var ch = h - pad.top - pad.bottom;
    var maxVal = Math.max.apply(null, perDay.map(function (d) { return d.count; })) || 1;

    // Grid lines
    ctx.strokeStyle = 'rgba(240,232,220,0.06)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var y = pad.top + ch - (ch * i / 4);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(240,232,220,0.4)';
      ctx.font = '22px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * i / 4), pad.left - 8, y + 6);
    }

    // Line
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    perDay.forEach(function (d, idx) {
      var x = pad.left + (cw * idx / (perDay.length - 1 || 1));
      var y = pad.top + ch - (ch * d.count / maxVal);
      if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.lineTo(pad.left, pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = 'rgba(168,85,247,0.1)';
    ctx.fill();

    // Dots + labels
    perDay.forEach(function (d, idx) {
      var x = pad.left + (cw * idx / (perDay.length - 1 || 1));
      var y = pad.top + ch - (ch * d.count / maxVal);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.fill();

      // X axis label (show every Nth)
      if (perDay.length <= 15 || idx % Math.ceil(perDay.length / 10) === 0) {
        ctx.save();
        ctx.translate(x, pad.top + ch + 15);
        ctx.rotate(-0.5);
        ctx.fillStyle = 'rgba(240,232,220,0.4)';
        ctx.font = '20px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(d.day.slice(5), 0, 0); // MM-DD
        ctx.restore();
      }
    });
  }

  // ── Bar Chart: Revenue Per Day ───────────────────────────
  function renderRevenueChart(revenueByDay) {
    var canvas = document.getElementById('revenueChart');
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth * 2;
    var h = canvas.height = 500;
    ctx.clearRect(0, 0, w, h);

    if (revenueByDay.length === 0) {
      ctx.fillStyle = 'rgba(240,232,220,0.3)';
      ctx.font = '28px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No revenue data', w / 2, h / 2);
      return;
    }

    var pad = { top: 30, right: 30, bottom: 60, left: 70 };
    var cw = w - pad.left - pad.right;
    var ch = h - pad.top - pad.bottom;
    var maxVal = Math.max.apply(null, revenueByDay.map(function (d) { return d.revenue; })) || 1;
    var barW = Math.max(4, (cw / revenueByDay.length) - 4);

    // Grid
    for (var i = 0; i <= 4; i++) {
      var y = pad.top + ch - (ch * i / 4);
      ctx.strokeStyle = 'rgba(240,232,220,0.06)';
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(240,232,220,0.4)';
      ctx.font = '22px Inter';
      ctx.textAlign = 'right';
      ctx.fillText('$' + Math.round(maxVal * i / 4), pad.left - 8, y + 6);
    }

    // Bars
    revenueByDay.forEach(function (d, idx) {
      var x = pad.left + (cw * idx / revenueByDay.length) + 2;
      var barH = (ch * d.revenue / maxVal);
      var y = pad.top + ch - barH;

      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(x, y, barW, barH);

      // X label
      if (revenueByDay.length <= 15 || idx % Math.ceil(revenueByDay.length / 10) === 0) {
        ctx.save();
        ctx.translate(x + barW / 2, pad.top + ch + 15);
        ctx.rotate(-0.5);
        ctx.fillStyle = 'rgba(240,232,220,0.4)';
        ctx.font = '20px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(d.day.slice(5), 0, 0);
        ctx.restore();
      }
    });
  }

  // ── Pie Chart: Orders by Status ──────────────────────────
  function renderStatusChart(byStatus) {
    var canvas = document.getElementById('statusChart');
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth * 2;
    var h = canvas.height = 500;
    ctx.clearRect(0, 0, w, h);

    if (byStatus.length === 0) {
      ctx.fillStyle = 'rgba(240,232,220,0.3)';
      ctx.font = '28px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No status data', w / 2, h / 2);
      return;
    }

    var colors = {
      'received': '#f59e0b',
      'in-progress': '#3b82f6',
      'ready': '#22c55e',
      'completed': '#a855f7',
      'cancelled': '#ef4444',
    };
    var total = byStatus.reduce(function (s, d) { return s + d.count; }, 0);
    var cx = w * 0.35, cy = h / 2, r = Math.min(w * 0.3, h * 0.4);

    var startAngle = -Math.PI / 2;
    byStatus.forEach(function (d) {
      var sliceAngle = (d.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[d.status] || '#888';
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Legend
    var lx = w * 0.65, ly = h * 0.2;
    byStatus.forEach(function (d, idx) {
      var y = ly + idx * 40;
      ctx.fillStyle = colors[d.status] || '#888';
      ctx.fillRect(lx, y, 24, 24);
      ctx.fillStyle = 'rgba(240,232,220,0.7)';
      ctx.font = '24px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(d.status + ' (' + d.count + ')', lx + 36, y + 18);
    });
  }

  // ── Horizontal Bar Chart: Top Services ───────────────────
  function renderServicesChart(topServices) {
    var canvas = document.getElementById('servicesChart');
    var ctx = canvas.getContext('2d');
    var w = canvas.width = canvas.offsetWidth * 2;
    var h = canvas.height = 500;
    ctx.clearRect(0, 0, w, h);

    if (topServices.length === 0) {
      ctx.fillStyle = 'rgba(240,232,220,0.3)';
      ctx.font = '28px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('No service data', w / 2, h / 2);
      return;
    }

    var pad = { top: 20, right: 40, bottom: 20, left: 200 };
    var maxVal = topServices[0].count || 1;
    var barH = Math.min(40, (h - pad.top - pad.bottom) / topServices.length - 8);

    topServices.forEach(function (s, idx) {
      var y = pad.top + idx * (barH + 8);
      var barW = ((w - pad.left - pad.right) * s.count / maxVal);

      // Label
      ctx.fillStyle = 'rgba(240,232,220,0.6)';
      ctx.font = '22px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(s.name.length > 20 ? s.name.slice(0, 20) + '...' : s.name, pad.left - 10, y + barH * 0.7);

      // Bar
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(pad.left, y, barW, barH);

      // Count
      ctx.fillStyle = 'rgba(240,232,220,0.5)';
      ctx.font = '20px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(s.count, pad.left + barW + 8, y + barH * 0.7);
    });
  }

  // Initial load
  loadAnalytics();
});

// ── Monthly Report Export ───────────────────────────────────
function exportReport() {
  var shopName = document.querySelector('.shop-name') ? document.querySelector('.shop-name').textContent : 'SewReady Shop';
  var startVal = document.getElementById('startDate') ? document.getElementById('startDate').value : '';
  var endVal = document.getElementById('endDate') ? document.getElementById('endDate').value : '';
  var dateRange = startVal && endVal ? startVal + ' to ' + endVal : 'This Month';

  // Gather all visible stats
  var stats = {};
  document.querySelectorAll('.dash-stat').forEach(function (card) {
    var label = card.querySelector('.dash-stat-label');
    var value = card.querySelector('.dash-stat-number');
    if (label && value) stats[label.textContent] = value.textContent;
  });

  var statsHtml = Object.keys(stats).map(function (k) {
    return '<div class="stat"><div class="value">' + stats[k] + '</div><div class="label">' + k + '</div></div>';
  }).join('\n');

  var html = '<!DOCTYPE html>\n' +
    '<html><head><title>' + shopName + ' - Monthly Report</title>\n' +
    '<style>\n' +
    '  body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333}\n' +
    '  h1{font-size:1.8rem;border-bottom:3px solid #c9a84c;padding-bottom:12px}\n' +
    '  .meta{color:#666;margin-bottom:32px}\n' +
    '  .stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin:24px 0}\n' +
    '  .stat{background:#f8f6f3;border:1px solid #e0dcd6;border-radius:12px;padding:20px;text-align:center}\n' +
    '  .stat .value{font-size:1.8rem;font-weight:800;color:#1a1816}\n' +
    '  .stat .label{font-size:0.85rem;color:#666;margin-top:4px}\n' +
    '  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e0dcd6;font-size:0.8rem;color:#999;text-align:center}\n' +
    '  @media print{body{margin:0}h1{font-size:1.5rem}}\n' +
    '</style></head><body>\n' +
    '<h1>' + shopName + '</h1>\n' +
    '<div class="meta">Performance Report &mdash; ' + dateRange + ' &mdash; Generated ' + new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'}) + '</div>\n' +
    '<div class="stats">\n' + statsHtml + '\n</div>\n' +
    '<div class="footer">Generated by SewReady &mdash; sewing.ranger-beers.com</div>\n' +
    '</body></html>';

  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(function () { win.print(); }, 500);
}
