// ══════════════════════════════════════════════════════════════
//  SewRunner — Driver App
//  Auth, delivery queue, status progression, auto-refresh
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var slug = typeof shopConfig !== 'undefined' ? shopConfig.slug : '';
  var driverInfo = null;
  var driverId = null;
  var refreshTimer = null;
  var currentTab = 'drvPanelAvailable';
  var previousDeliveryIds = [];
  var notificationsEnabled = false;

  // ── Helpers ────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function toast(msg, type) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' toast-' + type : '');
    setTimeout(function () { el.className = 'toast'; }, 3000);
  }

  async function api(path, opts) {
    var res = await fetch(path, opts || {});
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ── Maps Navigation ──────────────────────────────────────
  function openNavigation(address) {
    var encoded = encodeURIComponent(address);
    window.open('https://www.google.com/maps/dir/?api=1&destination=' + encoded, '_blank');
  }

  // ── Notifications ───────────────────────────────────────
  async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      notificationsEnabled = true;
      return;
    }
    if (Notification.permission === 'denied') return;
    var result = await Notification.requestPermission();
    notificationsEnabled = (result === 'granted');
  }

  function checkForNewDeliveries(deliveries) {
    if (!notificationsEnabled) return;
    var unassigned = deliveries.filter(function (d) {
      return d.status === 'pending' && !d.driver_id;
    });
    var currentIds = unassigned.map(function (d) { return d.id; });
    var newOnes = currentIds.filter(function (id) {
      return previousDeliveryIds.indexOf(id) === -1;
    });
    previousDeliveryIds = currentIds;

    if (newOnes.length === 0) return;
    var msg = newOnes.length === 1
      ? '1 new delivery available!'
      : newOnes.length + ' new deliveries available!';

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(function (reg) {
        reg.showNotification('SewRunner', {
          body: msg,
          icon: '/icon-192.png',
          tag: 'new-delivery',
          renotify: true,
        });
      });
    } else {
      new Notification('SewRunner', { body: msg });
    }
  }

  // ── Brand Hydration ────────────────────────────────────────
  function applyBrand() {
    if (typeof shopConfig === 'undefined') return;
    var c = shopConfig.themeColors || {};
    var root = document.documentElement;
    if (c.primary) root.style.setProperty('--drv-primary', c.primary);
    if (c.accent) root.style.setProperty('--drv-accent', c.accent);
    var shopName = $('drvShopName');
    if (shopName) shopName.textContent = shopConfig.name || 'SewRunner';
  }

  // ── Setup Token Flow ───────────────────────────────────────
  function checkSetupToken() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get('setup_token');
    if (!token) return false;

    $('drvLoginOverlay').style.display = 'none';
    $('drvSetupOverlay').style.display = '';

    $('drvSetupBtn').onclick = async function () {
      var pw = $('drvNewPassword').value;
      var confirm = $('drvConfirmPassword').value;
      var errEl = $('drvSetupError');
      errEl.textContent = '';

      if (!pw || pw.length < 6) {
        errEl.textContent = 'Password must be at least 6 characters';
        return;
      }
      if (pw !== confirm) {
        errEl.textContent = 'Passwords do not match';
        return;
      }

      try {
        $('drvSetupBtn').disabled = true;
        await api('/api/drivers/auth/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token, password: pw, shop_slug: slug }),
        });
        toast('Password set! You can now sign in.', 'success');
        // Remove token from URL and show login
        window.history.replaceState({}, '', window.location.pathname);
        $('drvSetupOverlay').style.display = 'none';
        $('drvLoginOverlay').style.display = '';
      } catch (err) {
        errEl.textContent = err.message;
      } finally {
        $('drvSetupBtn').disabled = false;
      }
    };

    return true;
  }

  // ── Auth Flow ──────────────────────────────────────────────
  async function checkSession() {
    try {
      var data = await api('/api/drivers/auth/me');
      if (data.driver) {
        driverInfo = data.driver;
        driverId = data.driver.id;
        showApp();
        return;
      }
    } catch (e) { /* not logged in */ }
    showLogin();
  }

  function showLogin() {
    $('drvLoginOverlay').style.display = '';
    $('drvApp').style.display = 'none';
  }

  function showApp() {
    $('drvLoginOverlay').style.display = 'none';
    $('drvSetupOverlay').style.display = 'none';
    $('drvApp').style.display = '';
    var name = driverInfo.name || 'Driver';
    $('drvDriverName').textContent = name;

    // Welcome banner
    var banner = $('drvWelcomeBanner');
    if (banner) {
      banner.style.display = '';
      var greeting = $('drvWelcomeGreeting');
      if (greeting) {
        var firstName = name.split(' ')[0];
        greeting.innerHTML = 'Welcome back, ' + escHtml(firstName) + ' <span class="drv-status-dot" style="width:8px;height:8px;display:inline-block"></span>';
      }
    }

    requestNotificationPermission();
    renderProfile();
    loadDeliveries();
    startAutoRefresh();
  }

  function bindLogin() {
    $('drvLoginBtn').onclick = async function () {
      var email = $('drvEmail').value.trim();
      var pw = $('drvPassword').value;
      var errEl = $('drvLoginError');
      errEl.textContent = '';

      if (!email || !pw) {
        errEl.textContent = 'Email and password are required';
        return;
      }

      try {
        $('drvLoginBtn').disabled = true;
        var data = await api('/api/drivers/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: pw, shop_slug: slug }),
        });
        driverInfo = data.driver;
        driverId = data.driver.id;
        showApp();
      } catch (err) {
        errEl.textContent = err.message;
      } finally {
        $('drvLoginBtn').disabled = false;
      }
    };

    // Enter key support
    $('drvPassword').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('drvLoginBtn').click();
    });
  }

  // ── Tab Switching ──────────────────────────────────────────
  function bindTabs() {
    var tabs = document.querySelectorAll('.drv-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var panels = document.querySelectorAll('.drv-tab-panel');
        panels.forEach(function (p) { p.classList.remove('active'); });
        var panelId = tab.getAttribute('data-panel');
        $(panelId).classList.add('active');
        currentTab = panelId;
      });
    });
  }

  // ── Delivery Rendering ─────────────────────────────────────
  function statusLabel(s) {
    var map = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'en-route': 'En Route',
      'picked-up': 'Picked Up',
      'delivered': 'Delivered',
    };
    return map[s] || s;
  }

  function statusColor(s) {
    var map = {
      'pending': '#c9a84c',
      'assigned': '#60a5fa',
      'en-route': '#f59e0b',
      'picked-up': '#a78bfa',
      'delivered': '#34d399',
    };
    return map[s] || '#888';
  }

  function nextAction(status) {
    var map = {
      'pending': { label: 'Accept', nextStatus: 'assigned', assignSelf: true },
      'assigned': { label: 'Start Route', nextStatus: 'en-route' },
      'en-route': { label: 'Picked Up', nextStatus: 'picked-up' },
      'picked-up': { label: 'Delivered', nextStatus: 'delivered' },
    };
    return map[status] || null;
  }

  function renderDeliveryCard(d, showActions) {
    var card = document.createElement('div');
    card.className = 'drv-delivery-card drv-status-' + d.status;

    var scheduleText = '';
    if (d.scheduled_date) {
      scheduleText = d.scheduled_date;
      if (d.scheduled_time) scheduleText += ' at ' + d.scheduled_time;
    }

    // Customer initial for avatar
    var initial = (d.customer || '?').charAt(0).toUpperCase();
    var pillClass = 'drv-pill-' + d.status;

    var html = '';

    // ── Header: avatar + order ID | pill badge
    html += '<div class="drv-card-header">';
    html += '<div class="drv-card-header-left">';
    html += '<div class="drv-card-avatar">' + initial + '</div>';
    html += '<div>';
    if (d.customer) html += '<div class="drv-card-customer">' + escHtml(d.customer) + '</div>';
    html += '<span class="drv-card-order">Order ' + (d.order_id || '\u2014').slice(0, 8) + '</span>';
    html += '</div></div>';
    html += '<span class="drv-card-badge ' + pillClass + '">' + statusLabel(d.status) + '</span>';
    html += '</div>';

    // ── Phone
    if (d.customer_phone) {
      html += '<a class="drv-card-phone" href="tel:' + escHtml(d.customer_phone) + '">' + escHtml(d.customer_phone) + '</a>';
    }

    // ── Addresses block
    if (d.pickup_address || d.delivery_address) {
      html += '<div class="drv-card-addresses">';
      if (d.pickup_address) {
        html += '<div class="drv-card-addr"><span class="drv-addr-label">Pickup</span><a class="drv-addr-link" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(d.pickup_address) + '" target="_blank" rel="noopener">' + escHtml(d.pickup_address) + '</a></div>';
      }
      if (d.delivery_address) {
        html += '<div class="drv-card-addr"><span class="drv-addr-label">Deliver</span><a class="drv-addr-link" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(d.delivery_address) + '" target="_blank" rel="noopener">' + escHtml(d.delivery_address) + '</a></div>';
      }
      html += '</div>';
    }

    // ── Schedule
    if (scheduleText) {
      html += '<div class="drv-card-schedule">\ud83d\udcc5 ' + escHtml(scheduleText) + '</div>';
    }
    // ── Notes
    if (d.notes) {
      html += '<div class="drv-card-notes">' + escHtml(d.notes) + '</div>';
    }

    // ── Actions
    if (showActions) {
      var action = nextAction(d.status);
      var navStatuses = ['assigned', 'en-route', 'picked-up'];
      var navAddr = d.delivery_address || d.pickup_address;
      if (action || (navAddr && navStatuses.indexOf(d.status) !== -1)) {
        html += '<div class="drv-delivery-actions">';
        if (navAddr && navStatuses.indexOf(d.status) !== -1) {
          html += '<button class="drv-navigate-btn" data-addr="' + escHtml(navAddr) + '">\ud83d\udccd Navigate</button>';
        }
        if (action) {
          html += '<button class="drv-action-btn" data-id="' + d.id + '" data-next="' + action.nextStatus + '"';
          if (action.assignSelf) html += ' data-assign="1"';
          html += '>' + action.label + '</button>';
        }
        html += '</div>';
      }
    }

    card.innerHTML = html;
    return card;
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ── Load & Render Deliveries ───────────────────────────────
  async function loadDeliveries() {
    try {
      var data = await api('/api/drivers/deliveries');
      var deliveries = data.deliveries || [];
      renderDeliveries(deliveries);
    } catch (err) {
      // Demo fallback if API is not available
      console.log('Using demo deliveries fallback');
      renderDeliveries([
        { id: 'DLV-101', order_id: 'ORD-8821', customer: 'SFC Miller, David', customer_phone: '910-555-0123', delivery_address: '82nd Abn Div Rd, Fort Liberty, NC', status: 'assigned', notes: 'Leave at CQ desk if not present.' },
        { id: 'DLV-102', order_id: 'ORD-9012', customer: 'CPT Reynolds, Sarah', customer_phone: '910-555-0456', delivery_address: '524 S. Reilly Rd, Fayetteville, NC', status: 'pending' },
        { id: 'DLV-103', order_id: 'ORD-7741', customer: 'PV2 Henderson, Kyle', customer_phone: '910-555-0789', pickup_address: '6441 Yadkin Rd, Fayetteville, NC', status: 'picked-up' }
      ]);
    }
  }

  function renderDeliveries(deliveries) {
    checkForNewDeliveries(deliveries);
    var available = [];
    var active = [];
    var history = [];

    deliveries.forEach(function (d) {
      if (d.status === 'delivered') {
        history.push(d);
      } else if (d.status === 'pending' && !d.driver_id) {
        available.push(d);
      } else {
        active.push(d);
      }
    });

      renderList($('drvAvailableList'), available, true, 'No available deliveries', '✨');
      renderList($('drvActiveList'), active, true, 'No active deliveries', '🛣️');
      renderList($('drvHistoryList'), history, false, 'No delivery history yet', '📜');

    // Update welcome banner stats
    var statAvail = $('drvStatAvailable');
    var statActive = $('drvStatActive');
    var statDone = $('drvStatCompleted');
    if (statAvail) statAvail.textContent = available.length;
    if (statActive) statActive.textContent = active.length;
    if (statDone) statDone.textContent = history.length;

    // Update tab count badges
    updateTabCounts(available.length, active.length, history.length);
  }

  function updateTabCounts(avail, active, hist) {
    var tabs = document.querySelectorAll('.drv-tab');
    var counts = [avail, active, hist, null]; // 4th tab = profile, no count
    tabs.forEach(function (tab, i) {
      var label = tab.querySelector('.drv-tab-label');
      if (!label) return;
      // Remove old count badge if present
      var old = tab.querySelector('.drv-tab-count');
      if (old) old.remove();
      if (counts[i] !== null && counts[i] > 0) {
        var badge = document.createElement('span');
        badge.className = 'drv-tab-count';
        badge.textContent = counts[i];
        label.appendChild(badge);
      }
    });
  }

  function renderList(container, items, showActions, emptyMsg, emptyIcon) {
    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = '<div class="drv-empty"><span class="drv-empty-icon">' + (emptyIcon || '') + '</span><span class="drv-empty-text">' + emptyMsg + '</span></div>';
      return;
    }
    items.forEach(function (d) {
      container.appendChild(renderDeliveryCard(d, showActions));
    });

    // Bind action buttons
    if (showActions) {
      container.querySelectorAll('.drv-action-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          handleStatusAction(btn);
        });
      });
      container.querySelectorAll('.drv-navigate-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openNavigation(btn.getAttribute('data-addr'));
        });
      });
    }
  }

  // ── Status Progression ─────────────────────────────────────
  async function handleStatusAction(btn) {
    var assignmentId = btn.getAttribute('data-id');
    var nextStatus = btn.getAttribute('data-next');
    var assignSelf = btn.getAttribute('data-assign');

    btn.disabled = true;
    btn.textContent = '...';

    try {
      var body = { status: nextStatus, shop_slug: slug };
      if (assignSelf) body.driver_id = driverId;

      await api('/api/driver-assignments/' + assignmentId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      toast('Status updated to ' + statusLabel(nextStatus), 'success');
      await loadDeliveries();
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = nextAction(btn.getAttribute('data-next'));
    }
  }

  // ── Profile ────────────────────────────────────────────────
  function notificationStatusText() {
    if (!('Notification' in window)) return 'Not supported';
    if (Notification.permission === 'denied') return 'Blocked';
    if (notificationsEnabled) return 'On';
    return 'Off';
  }

  function renderProfile() {
    var card = $('drvProfileCard');
    if (!driverInfo) return;

    var notifStatus = notificationStatusText();
    var notifColor = notifStatus === 'On' ? '#22c55e' : notifStatus === 'Blocked' ? '#ef4444' : '#94a3b8';
    var notifAction = '';
    if (notifStatus === 'Off') {
      notifAction = '<button id="drvNotifToggle" style="padding:5px 14px;font-size:12px;font-weight:700;border:none;color:#fff;background:linear-gradient(135deg,#22c55e,#3b82f6);border-radius:8px;cursor:pointer">Enable</button>';
    }

    var initial = (driverInfo.name || '?').charAt(0).toUpperCase();
    var html = '';

    // ── Header: avatar + name + email + stats
    html += '<div class="drv-profile-header">';
    html += '<div class="drv-profile-avatar">' + initial + '</div>';
    html += '<p class="drv-profile-name">' + escHtml(driverInfo.name) + '</p>';
    html += '<p class="drv-profile-email">' + escHtml(driverInfo.email || '') + '</p>';
    html += '<div class="drv-profile-stats">';
    html += '<div class="drv-profile-stat"><span class="drv-profile-stat-value" id="drvProfileDeliveries">\u2014</span><span class="drv-profile-stat-label">Deliveries</span></div>';
    html += '<div class="drv-profile-stat"><span class="drv-profile-stat-value">\u2b50</span><span class="drv-profile-stat-label">Rating</span></div>';
    html += '</div>';
    html += '</div>';

    // ── Info section
    html += '<div class="drv-profile-section">';
    html += '<div class="drv-profile-section-title">Information</div>';
    html += '<div class="drv-profile-row"><span class="drv-profile-label">Phone</span><span class="drv-profile-value">' + escHtml(driverInfo.phone || '\u2014') + '</span></div>';
    html += '<div class="drv-profile-row"><span class="drv-profile-label">Vehicle</span><span class="drv-profile-value">' + escHtml(driverInfo.vehicle || '\u2014') + '</span></div>';
    html += '</div>';

    // ── Notifications section
    html += '<div class="drv-profile-section">';
    html += '<div class="drv-profile-section-title">Notifications</div>';
    html += '<div class="drv-profile-row"><span class="drv-profile-label">Push Alerts</span><span style="display:flex;align-items:center;gap:8px"><span style="color:' + notifColor + ';font-weight:700">' + notifStatus + '</span>' + notifAction + '</span></div>';
    html += '</div>';

    // ── Sign out
    html += '<button class="drv-logout-btn" id="drvLogoutBtn">Sign Out</button>';

    card.innerHTML = html;

    if ($('drvNotifToggle')) {
      $('drvNotifToggle').onclick = async function () {
        await requestNotificationPermission();
        renderProfile();
      };
    }

    $('drvLogoutBtn').onclick = async function () {
      try {
        await api('/api/drivers/auth/logout', { method: 'POST' });
      } catch (e) { /* ok */ }
      stopAutoRefresh();
      driverInfo = null;
      driverId = null;
      window.location.reload();
    };
  }

  // ── Auto-Refresh ───────────────────────────────────────────
  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(loadDeliveries, 30000);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    applyBrand();
    bindTabs();
    bindLogin();

    if (!checkSetupToken()) {
      checkSession();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
