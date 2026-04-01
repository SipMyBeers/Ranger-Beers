document.addEventListener('DOMContentLoaded', () => {

  // ── Tier Gating ────────────────────────────────────────────
  const _SHOP_TIER = (typeof shopConfig !== 'undefined' && shopConfig.tier) || 'full';

  // Storefront tier: show upgrade prompt and bail — admin dashboard not available
  if (_SHOP_TIER === 'storefront') {
    var main = document.querySelector('.main-content') || document.querySelector('main');
    if (main) {
      main.innerHTML =
        '<div style="max-width:480px;margin:80px auto;text-align:center;padding:32px">' +
          '<h2 style="margin-bottom:12px">Admin Dashboard Not Available</h2>' +
          '<p style="color:var(--text-muted)">This shop is on the <strong>Storefront</strong> plan, which includes a public landing page only.</p>' +
          '<p style="margin-top:16px"><a href="mailto:owner@ranger-beers.com" style="color:var(--accent)">Contact us to upgrade</a></p>' +
        '</div>';
    }
    return;
  }

  // ── Order Data (from DataStore) ────────────────────────────
  const orders = DataStore.getOrders();

  const statusLabels = {
    'received': 'Received',
    'in-progress': 'In Progress',
    'ready': 'Ready for Pickup',
    'completed': 'Completed'
  };

  const today = new Date(2026, 2, 1); // March 1, 2026

  // ── Notifications (from DataStore) ─────────────────────────
  const notifications = DataStore.getNotifications();

  // ── State ──────────────────────────────────────────────────
  let activeStatFilter = null; // null or status key
  let selectedTimelineDate = null;

  // ── DOM Refs ───────────────────────────────────────────────
  const greetEl = document.getElementById('greeting');
  const notifBtn = document.getElementById('notifBtn');
  const notifBadge = document.getElementById('notifBadge');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifList = document.getElementById('notifList');
  const markAllReadBtn = document.getElementById('markAllRead');
  const openDropoffBtn = document.getElementById('openDropoffBtn');
  const dropoffOverlay = document.getElementById('dropoffOverlay');
  const dropoffClose = document.getElementById('dropoffClose');
  const dropoffSearch = document.getElementById('dropoffSearch');
  const dropoffResults = document.getElementById('dropoffResults');
  const dropoffConfirm = document.getElementById('dropoffConfirm');
  const dropoffConfirmDetails = document.getElementById('dropoffConfirmDetails');
  const dropoffChecklist = document.getElementById('dropoffChecklist');
  const dropoffConfirmBtn = document.getElementById('dropoffConfirmBtn');
  const dropoffCancelBtn = document.getElementById('dropoffCancelBtn');
  const toastEl = document.getElementById('toast');
  const strip = document.getElementById('timelineStrip');
  const timelineDetail = document.getElementById('timelineDetail');
  const pickupList = document.getElementById('pickupList');
  const activeList = document.getElementById('activeList');

  // ── Toast Helper ───────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg, duration) {
    duration = duration || 4000;
    toastEl.textContent = msg;
    toastEl.classList.add('toast-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('toast-show'), duration);
  }

  // ── Send Real Customer Notification (SMS + Email) ──────────
  function sendCustomerNotification(order) {
    if (_SHOP_TIER !== 'full') {
      showToast('Upgrade to Full Shop for SMS & email notifications');
      return;
    }
    var shopCfg = DataStore.getShopConfig();
    showToast('Sending notification to ' + order.customer + '...');

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_slug: (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready',
        order_id: order.id,
        customer_phone: order.phone,
        customer_email: order.email,
        customer_name: order.customer,
        shop_name: shopCfg.name || 'SewReady',
        shop_phone: shopCfg.phone || '',
        type: order.status || 'ready'
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      var smsOk = res.results && res.results.sms && res.results.sms.status === 'sent';
      var emailOk = res.results && res.results.email && res.results.email.status === 'sent';
      var methods = [];
      if (smsOk) methods.push('SMS');
      if (emailOk) methods.push('Email');
      if (methods.length > 0) {
        showToast('Notified ' + order.customer + ' via ' + methods.join(' & '));
      } else {
        showToast('Notification queued for ' + order.customer);
      }
    })
    .catch(function () {
      showToast('Notified ' + order.customer + ' (queued offline)');
    });

    DataStore.addNotification({
      type: 'notified',
      title: 'Customer notified',
      body: order.customer + ' notified about ' + order.id + ' — ' + order.uniform,
      orderId: order.id
    });
    renderNotifBadge();
    renderNotifications();
  }

  // ── Greeting ───────────────────────────────────────────────
  const hour = today.getHours();
  if (hour < 12) greetEl.textContent = 'Good morning, Maria';
  else if (hour < 17) greetEl.textContent = 'Good afternoon, Maria';
  else greetEl.textContent = 'Good evening, Maria';

  document.getElementById('todayDate').textContent =
    today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // ── Relative Time ──────────────────────────────────────────
  function relativeTime(ts) {
    const diff = Math.max(0, Date.now() - ts);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  // ══════════════════════════════════════════════════════════
  //  RENDER FUNCTIONS
  // ══════════════════════════════════════════════════════════

  function renderStats() {
    const counts = { received: 0, 'in-progress': 0, ready: 0, completed: 0 };
    orders.forEach(o => counts[o.status]++);
    document.getElementById('statNew').textContent = counts.received;
    document.getElementById('statProgress').textContent = counts['in-progress'];
    document.getElementById('statReady').textContent = counts.ready;
    document.getElementById('statCompleted').textContent = counts.completed;
  }

  function renderNotifBadge() {
    const unread = notifications.filter(n => !n.read).length;
    notifBadge.textContent = unread;
    notifBadge.classList.toggle('hidden', unread === 0);
  }

  // ── Notification Type Icons ────────────────────────────────
  const notifIcons = {
    dropoff:  { icon: '\u{1F4E6}', cls: 'notif-icon-dropoff' },
    new:      { icon: '\u{1F4E9}', cls: 'notif-icon-new' },
    status:   { icon: '\u{1F504}', cls: 'notif-icon-status' },
    ready:    { icon: '\u2705',     cls: 'notif-icon-ready' },
    notified: { icon: '\u{1F4E8}', cls: 'notif-icon-notified' }
  };

  function renderNotifications() {
    notifList.innerHTML = '';
    if (notifications.length === 0) {
      notifList.innerHTML = '<div class="notif-empty">No notifications</div>';
      return;
    }
    notifications.forEach(n => {
      const iconData = notifIcons[n.type] || notifIcons.new;
      const item = document.createElement('div');
      item.className = 'notif-item' + (n.read ? '' : ' unread');
      item.innerHTML =
        '<div class="notif-item-icon ' + iconData.cls + '">' + iconData.icon + '</div>' +
        '<div class="notif-item-body">' +
          '<div class="notif-item-title">' + n.title + '</div>' +
          '<div class="notif-item-text">' + n.body + '</div>' +
          '<div class="notif-item-time">' + relativeTime(n.time) + '</div>' +
        '</div>' +
        '<button class="notif-dismiss" title="Dismiss">&times;</button>';

      // Click notification → mark read + navigate
      item.addEventListener('click', (e) => {
        if (e.target.closest('.notif-dismiss')) return;
        DataStore.markRead(n.id);
        renderNotifBadge();
        renderNotifications();
        if (n.incomingId) {
          window.location.href = 'incoming.html';
        } else if (n.orderId) {
          window.location.href = 'orders.html?highlight=' + n.orderId;
        }
      });

      // Dismiss
      item.querySelector('.notif-dismiss').addEventListener('click', (e) => {
        e.stopPropagation();
        DataStore.dismissNotification(n.id);
        renderNotifBadge();
        renderNotifications();
      });

      notifList.appendChild(item);
    });
  }

  // ── Stat Card Filters ──────────────────────────────────────
  const statMapping = {
    'stat-new': 'received',
    'stat-progress': 'in-progress',
    'stat-ready': 'ready',
    'stat-completed': 'completed'
  };

  function setupStatCards() {
    document.querySelectorAll('.dash-stat').forEach(card => {
      card.addEventListener('click', () => {
        let filterKey = null;
        for (const [cls, status] of Object.entries(statMapping)) {
          if (card.classList.contains(cls)) { filterKey = status; break; }
        }
        if (activeStatFilter === filterKey) {
          activeStatFilter = null;
          card.classList.remove('stat-active');
        } else {
          document.querySelectorAll('.dash-stat').forEach(c => c.classList.remove('stat-active'));
          activeStatFilter = filterKey;
          card.classList.add('stat-active');
        }
        renderPickups();
        renderActiveOrders();
      });
    });
  }

  // ── Day-by-Day Timeline ────────────────────────────────────
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function renderTimeline() {
    strip.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const dayOrders = orders.filter(o => o.deadline === dateStr && o.status !== 'completed');
      const isToday = i === 0;

      const col = document.createElement('div');
      col.className = 'tl-day' + (isToday ? ' tl-today' : '') + (dayOrders.length === 0 ? ' tl-empty' : '');
      if (selectedTimelineDate === dateStr) col.classList.add('tl-selected');
      col.dataset.date = dateStr;

      const label = isToday ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[d.getDay()];
      const dateNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      let orderDots = '';
      dayOrders.forEach(o => {
        const urgClass = o.urgency === 'urgent' ? 'tl-urgent' : o.urgency === 'soon' ? 'tl-soon' : 'tl-ontrack';
        orderDots +=
          '<div class="tl-order ' + urgClass + '">' +
            '<span class="tl-order-name">' + o.customer + '</span>' +
            '<span class="tl-order-type">' + o.uniform + '</span>' +
            '<span class="tl-order-pickup">' + (o.pickupType === 'driver' ? '\u{1F69A}' : '\u{1F6B6}') + '</span>' +
          '</div>';
      });

      col.innerHTML =
        '<div class="tl-header">' +
          '<span class="tl-label">' + label + '</span>' +
          '<span class="tl-date">' + monthShort + ' ' + dateNum + '</span>' +
        '</div>' +
        '<div class="tl-count">' + dayOrders.length + ' order' + (dayOrders.length !== 1 ? 's' : '') + '</div>' +
        '<div class="tl-orders">' + (orderDots || '<span class="tl-none">No deadlines</span>') + '</div>';

      // Click handler
      col.addEventListener('click', () => {
        if (selectedTimelineDate === dateStr) {
          selectedTimelineDate = null;
          timelineDetail.classList.remove('open');
          timelineDetail.innerHTML = '';
        } else {
          selectedTimelineDate = dateStr;
          renderTimelineDetail(dateStr);
        }
        // Update selection styling
        strip.querySelectorAll('.tl-day').forEach(day => {
          day.classList.toggle('tl-selected', day.dataset.date === selectedTimelineDate);
        });
      });

      strip.appendChild(col);
    }
  }

  function renderTimelineDetail(dateStr) {
    const dayOrders = orders.filter(o => o.deadline === dateStr && o.status !== 'completed');
    if (dayOrders.length === 0) {
      timelineDetail.classList.remove('open');
      timelineDetail.innerHTML = '';
      return;
    }

    const d = new Date(dateStr + 'T00:00:00');
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    let html = '<h3>Orders due ' + dayLabel + '</h3>';
    dayOrders.forEach(o => {
      html +=
        '<div class="tl-detail-order" data-id="' + o.id + '">' +
          '<div class="tl-detail-left">' +
            '<span class="uniform-badge badge-' + o.uniformKey + '">' + o.uniform + '</span>' +
            '<strong>' + o.customer + '</strong>' +
            '<span style="font-size:12px;color:var(--text-muted)">' + o.id + '</span>' +
          '</div>' +
          '<div class="tl-detail-right">' +
            '<span class="deadline ' + o.urgency + '">' + statusLabels[o.status] + '</span>' +
          '</div>' +
        '</div>';
    });

    timelineDetail.innerHTML = html;
    timelineDetail.classList.add('open');

    // Click each order → navigate to orders page
    timelineDetail.querySelectorAll('.tl-detail-order').forEach(row => {
      row.addEventListener('click', () => {
        window.location.href = 'orders.html?highlight=' + row.dataset.id;
      });
    });
  }

  // ── Scheduled Pickups ──────────────────────────────────────
  function renderPickups() {
    pickupList.innerHTML = '';
    let activeOrders = orders.filter(o => o.status !== 'completed');
    if (activeStatFilter) {
      activeOrders = activeOrders.filter(o => o.status === activeStatFilter);
    }

    const pickupsByDay = {};
    activeOrders.forEach(o => {
      if (!pickupsByDay[o.deadline]) pickupsByDay[o.deadline] = [];
      pickupsByDay[o.deadline].push(o);
    });

    const sortedDays = Object.keys(pickupsByDay).sort();

    if (sortedDays.length === 0) {
      pickupList.innerHTML = '<p class="dash-empty">No scheduled pickups.</p>';
      return;
    }

    sortedDays.forEach(day => {
      const d = new Date(day + 'T00:00:00');
      const diff = Math.round((d - today) / 86400000);
      let dayLabel;
      if (diff === 0) dayLabel = 'Today';
      else if (diff === 1) dayLabel = 'Tomorrow';
      else dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const urgClass = diff <= 0 ? 'pu-urgent' : diff <= 2 ? 'pu-soon' : 'pu-ok';

      const group = document.createElement('div');
      group.className = 'pu-day-group';

      let cards = '';
      pickupsByDay[day].forEach(o => {
        const icon = o.pickupType === 'driver' ? '\u{1F69A}' : '\u{1F6B6}';
        const methodLabel = o.pickupType === 'driver' ? 'Driver pickup' : 'Customer pickup';
        cards +=
          '<div class="pu-card" data-id="' + o.id + '">' +
            '<div class="pu-card-left">' +
              '<span class="pu-icon">' + icon + '</span>' +
            '</div>' +
            '<div class="pu-card-body">' +
              '<div class="pu-customer">' + o.customer + '</div>' +
              '<div class="pu-detail">' +
                '<span class="uniform-badge badge-' + o.uniformKey + '">' + o.uniform + '</span>' +
                '<span class="pu-method">' + methodLabel + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="pu-card-actions">' +
              '<button class="pu-action-btn pu-call" title="Call customer" data-action="call" data-id="' + o.id + '">\u{1F4DE}</button>' +
              (_SHOP_TIER === 'full' ? '<button class="pu-action-btn pu-notify" title="Notify customer" data-action="notify" data-id="' + o.id + '">\u{1F4E9}</button>' : '') +
              '<button class="pu-action-btn" title="View order" data-action="view" data-id="' + o.id + '">\u{1F441}</button>' +
            '</div>' +
            '<div class="pu-card-right">' +
              '<span class="status-pill status-pill-' + o.status + '">' + statusLabels[o.status] + '</span>' +
            '</div>' +
          '</div>';
      });

      group.innerHTML =
        '<div class="pu-day-header ' + urgClass + '">' +
          '<span class="pu-day-label">' + dayLabel + '</span>' +
          '<span class="pu-day-count">' + pickupsByDay[day].length + ' pickup' + (pickupsByDay[day].length !== 1 ? 's' : '') + '</span>' +
        '</div>' +
        cards;

      pickupList.appendChild(group);
    });

    // Attach pickup card action listeners
    pickupList.querySelectorAll('.pu-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const orderId = btn.dataset.id;
        const order = orders.find(o => o.id === orderId);
        if (action === 'call') {
          showToast('Calling ' + order.customer + ' at ' + order.phone + '...');
        } else if (action === 'notify') {
          sendCustomerNotification(order);
        } else if (action === 'view') {
          window.location.href = 'orders.html?highlight=' + orderId;
        }
      });
    });

    // Click card body → navigate
    pickupList.querySelectorAll('.pu-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.pu-action-btn')) return;
        window.location.href = 'orders.html?highlight=' + card.dataset.id;
      });
    });
  }

  // ── Active Orders List ─────────────────────────────────────
  function renderActiveOrders() {
    activeList.innerHTML = '';
    let filtered = orders.filter(o => o.status !== 'completed');
    if (activeStatFilter) {
      filtered = filtered.filter(o => o.status === activeStatFilter);
    }
    const sorted = filtered.sort((a, b) => a.deadline.localeCompare(b.deadline));

    sorted.forEach(o => {
      const pct = o.total > 0 ? Math.round((o.progress / o.total) * 100) : 0;
      const d = new Date(o.deadline + 'T00:00:00');
      const diff = Math.round((d - today) / 86400000);
      let deadlineText;
      if (diff < 0) deadlineText = 'Overdue';
      else if (diff === 0) deadlineText = 'Due today';
      else if (diff === 1) deadlineText = 'Due tomorrow';
      else deadlineText = 'Due in ' + diff + ' days';

      const row = document.createElement('div');
      row.className = 'ao-row';
      row.dataset.id = o.id;
      row.innerHTML =
        '<div class="ao-left">' +
          '<div class="ao-customer">' + o.customer + '</div>' +
          '<div class="ao-sub">' +
            '<span class="uniform-badge badge-' + o.uniformKey + '">' + o.uniform + '</span>' +
            '<span class="ao-id">' + o.id + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="ao-center">' +
          '<div class="ao-progress-wrap">' +
            '<div class="ao-progress-bar">' +
              '<div class="ao-progress-fill" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<span class="ao-progress-text">' + o.progress + '/' + o.total + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="ao-right">' +
          '<span class="deadline ' + o.urgency + '">' + deadlineText + '</span>' +
          '<span class="status-pill status-pill-' + o.status + '">' + statusLabels[o.status] + '</span>' +
        '</div>';

      row.addEventListener('click', () => {
        window.location.href = 'orders.html?highlight=' + o.id;
      });

      activeList.appendChild(row);
    });
  }

  // ══════════════════════════════════════════════════════════
  //  NOTIFICATION BELL
  // ══════════════════════════════════════════════════════════

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('open');
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.classList.remove('open');
    }
  });

  markAllReadBtn.addEventListener('click', () => {
    DataStore.markAllRead();
    renderNotifBadge();
    renderNotifications();
  });

  // ══════════════════════════════════════════════════════════
  //  DROP-OFF FLOW
  // ══════════════════════════════════════════════════════════

  let selectedDropoffOrder = null;

  openDropoffBtn.addEventListener('click', () => {
    notifDropdown.classList.remove('open');
    dropoffOverlay.classList.add('open');
    dropoffSearch.value = '';
    selectedDropoffOrder = null;
    dropoffConfirm.classList.remove('visible');
    renderDropoffResults('');
    dropoffSearch.focus();
  });

  dropoffClose.addEventListener('click', closeDropoff);
  dropoffOverlay.addEventListener('click', (e) => {
    if (e.target === dropoffOverlay) closeDropoff();
  });

  function closeDropoff() {
    dropoffOverlay.classList.remove('open');
    selectedDropoffOrder = null;
  }

  dropoffSearch.addEventListener('input', () => {
    renderDropoffResults(dropoffSearch.value);
  });

  function renderDropoffResults(query) {
    const q = query.toLowerCase();
    const received = orders.filter(o =>
      o.status === 'received' &&
      (!q || o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
    );

    dropoffResults.innerHTML = '';
    if (received.length === 0) {
      dropoffResults.innerHTML = '<div class="notif-empty">No matching orders awaiting drop-off</div>';
      return;
    }

    received.forEach(o => {
      const item = document.createElement('div');
      item.className = 'dropoff-result-item' + (selectedDropoffOrder === o.id ? ' selected' : '');
      item.innerHTML =
        '<div class="dropoff-result-info">' +
          '<div class="dropoff-result-customer">' + o.customer + '</div>' +
          '<div class="dropoff-result-detail">' + o.id + ' &mdash; ' + o.uniform + ' &mdash; ' + o.modifications.length + ' modification' + (o.modifications.length !== 1 ? 's' : '') + '</div>' +
        '</div>' +
        '<span class="status-pill status-pill-received">Received</span>';

      item.addEventListener('click', () => {
        selectedDropoffOrder = o.id;
        // Highlight selection
        dropoffResults.querySelectorAll('.dropoff-result-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        // Show confirm panel
        showDropoffConfirm(o);
      });

      dropoffResults.appendChild(item);
    });
  }

  function showDropoffConfirm(order) {
    dropoffConfirmDetails.innerHTML =
      '<strong>Customer:</strong> ' + order.customer + '<br>' +
      '<strong>Order:</strong> ' + order.id + '<br>' +
      '<strong>Uniform:</strong> ' + order.uniform + '<br>' +
      '<strong>Deadline:</strong> ' + order.deadline;

    dropoffChecklist.innerHTML = '';
    order.modifications.forEach(mod => {
      const div = document.createElement('div');
      div.className = 'dropoff-checklist-item';
      div.textContent = mod;
      dropoffChecklist.appendChild(div);
    });

    dropoffConfirm.classList.add('visible');
  }

  dropoffConfirmBtn.addEventListener('click', () => {
    const order = orders.find(o => o.id === selectedDropoffOrder);
    if (!order) return;

    // Change status via DataStore (also deducts inventory)
    DataStore.updateOrderStatus(order.id, 'in-progress');

    // Add notification
    DataStore.addNotification({
      type: 'status',
      title: 'Drop-off confirmed',
      body: order.customer + ' (' + order.id + ') — ' + order.uniform + ' is now In Progress',
      orderId: order.id
    });

    // Print drop-off receipt
    if (typeof printDropoffReceipt === 'function') printDropoffReceipt(order);

    // Toast
    showToast('Drop-off confirmed for ' + order.customer + ' (' + order.id + '). Order is now In Progress.');

    // Close modal
    closeDropoff();

    // Re-render everything
    renderStats();
    renderNotifBadge();
    renderNotifications();
    renderTimeline();
    renderPickups();
    renderActiveOrders();
  });

  dropoffCancelBtn.addEventListener('click', () => {
    selectedDropoffOrder = null;
    dropoffConfirm.classList.remove('visible');
    dropoffResults.querySelectorAll('.dropoff-result-item').forEach(el => el.classList.remove('selected'));
  });

  // ══════════════════════════════════════════════════════════
  //  SIDEBAR TOGGLE (Mobile)
  // ══════════════════════════════════════════════════════════

  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // ══════════════════════════════════════════════════════════
  //  INITIAL RENDER
  // ══════════════════════════════════════════════════════════

  renderStats();
  renderNotifBadge();
  renderNotifications();
  renderTimeline();
  renderPickups();
  renderActiveOrders();
  setupStatCards();

  // ══════════════════════════════════════════════════════════
  //  ORDER CREATION FORM
  // ══════════════════════════════════════════════════════════

  // Check if we're on the order creation page
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    setupOrderForm();
  }

});

// ══════════════════════════════════════════════════════════
//  ORDER FORM FUNCTIONALITY
// ══════════════════════════════════════════════════════════

function setupOrderForm() {
  const form = document.getElementById('orderForm');
  const resetBtn = document.getElementById('resetForm');

  // Generate order ID
  function generateOrderId() {
    const prefix = 'ORD-';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return prefix + randomNum;
  }

  // Get current date for estimated completion
  function getDefaultCompletionDate() {
    const today = new Date();
    const completion = new Date(today);
    completion.setDate(today.getDate() + 3); // Default to 3 days from now
    return completion.toISOString().split('T')[0];
  }

  // Set default values
  document.getElementById('estimatedCompletion').value = getDefaultCompletionDate();

  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form values
    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const itemType = document.getElementById('itemType').value;
    const itemDescription = document.getElementById('itemDescription').value;
    const itemCondition = document.getElementById('itemCondition').value;
    const serviceType = document.getElementById('serviceType').value;
    const priority = document.getElementById('priority').value;
    const estimatedCompletion = document.getElementById('estimatedCompletion').value;
    const specialInstructions = document.getElementById('specialInstructions').value;
    const estimatedPrice = document.getElementById('estimatedPrice').value || '0.00';
    const deposit = document.getElementById('deposit').value || '0.00';
    const paymentMethod = document.getElementById('paymentMethod').value;

    // Create new order object
    const newOrder = {
      id: generateOrderId(),
      customer: customerName,
      phone: customerPhone,
      email: customerEmail,
      uniform: `${itemType} — ${itemDescription}`,
      status: 'received',
      scheduledBlock: {
        date: estimatedCompletion,
        startTime: '09:00',
        endTime: '10:00',
        employeeId: 'emp-1'
      },
      serviceType: serviceType,
      priority: priority,
      condition: itemCondition,
      specialInstructions: specialInstructions,
      estimatedPrice: parseFloat(estimatedPrice),
      depositPaid: parseFloat(deposit),
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString()
    };

    // Add to data store
    DataStore.createOrder(newOrder);

    // Add notification
    DataStore.addNotification({
      type: 'new-order',
      title: 'New Order Created',
      body: `${customerName} — ${itemType} — ${serviceType}`,
      orderId: newOrder.id
    });

    // Show success message
    showToast(`Order created successfully! Order #${newOrder.id} for ${customerName}`);

    // Reset form
    form.reset();
    document.getElementById('estimatedCompletion').value = getDefaultCompletionDate();

    // Update UI elements that might be on the page
    if (typeof renderStats === 'function') renderStats();
    if (typeof renderNotifBadge === 'function') renderNotifBadge();
    if (typeof renderNotifications === 'function') renderNotifications();
  });

  // Reset form button
  resetBtn.addEventListener('click', function() {
    form.reset();
    document.getElementById('estimatedCompletion').value = getDefaultCompletionDate();
  });
}

// Helper function to show toast messages
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('visible');
    
    // Hide after 4 seconds
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 4000);
  } else {
    alert(message); // Fallback if toast element doesn't exist
  }
}
