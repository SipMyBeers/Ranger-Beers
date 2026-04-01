// ══════════════════════════════════════════════════════════════
//  SewReady — Incoming Orders Page
//  Shows customer-submitted orders waiting for drop-off
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── DOM Refs ───────────────────────────────────────────────
  const grid = document.getElementById('incomingGrid');
  const emptyState = document.getElementById('incomingEmpty');
  const countEl = document.getElementById('incomingCount');
  const searchInput = document.getElementById('incomingSearch');
  const toastEl = document.getElementById('toast');
  const notifBtn = document.getElementById('notifBtn');
  const notifBadge = document.getElementById('notifBadge');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifList = document.getElementById('notifList');
  const markAllReadBtn = document.getElementById('markAllRead');

  // ── Toast ──────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('toast-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('toast-show'), 4000);
  }

  // ── Relative Time ─────────────────────────────────────────
  function relativeTime(ts) {
    if (!ts) return '';
    const time = typeof ts === 'string' ? new Date(ts).getTime() : ts;
    const diff = Math.max(0, Date.now() - time);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  function fmt(n) { return '$' + n.toFixed(2); }

  // ── Notifications ─────────────────────────────────────────
  const notifIcons = {
    dropoff:  { icon: '\u{1F4E6}', cls: 'notif-icon-dropoff' },
    new:      { icon: '\u{1F4E9}', cls: 'notif-icon-new' },
    status:   { icon: '\u{1F504}', cls: 'notif-icon-status' },
    ready:    { icon: '\u2705',     cls: 'notif-icon-ready' },
    notified: { icon: '\u{1F4E8}', cls: 'notif-icon-notified' }
  };

  function renderNotifBadge() {
    const notifications = DataStore.getNotifications();
    const unread = notifications.filter(n => !n.read).length;
    notifBadge.textContent = unread;
    notifBadge.classList.toggle('hidden', unread === 0);
  }

  function renderNotifications() {
    const notifications = DataStore.getNotifications();
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

      item.addEventListener('click', (e) => {
        if (e.target.closest('.notif-dismiss')) return;
        DataStore.markRead(n.id);
        renderNotifBadge();
        renderNotifications();
        if (n.incomingId) {
          // Scroll to the incoming card
          const card = document.getElementById('inc-' + n.incomingId);
          if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (n.orderId) {
          window.location.href = 'orders.html?highlight=' + n.orderId;
        }
      });

      item.querySelector('.notif-dismiss').addEventListener('click', (e) => {
        e.stopPropagation();
        DataStore.dismissNotification(n.id);
        renderNotifBadge();
        renderNotifications();
      });

      notifList.appendChild(item);
    });
  }

  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      notifDropdown.classList.toggle('open');
    });
  }
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      DataStore.markAllRead();
      renderNotifBadge();
      renderNotifications();
    });
  }
  document.addEventListener('click', (e) => {
    if (notifDropdown && !e.target.closest('.notif-dropdown') && !e.target.closest('.notif-btn')) {
      notifDropdown.classList.remove('open');
    }
  });

  // ── Render Incoming Cards ─────────────────────────────────
  function renderIncoming(filter) {
    const incoming = DataStore.getIncoming();
    let filtered = incoming;

    if (filter) {
      const q = filter.toLowerCase();
      filtered = incoming.filter(o =>
        (o.customer && o.customer.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.uniform && o.uniform.toLowerCase().includes(q)) ||
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.unit && o.unit.toLowerCase().includes(q))
      );
    }

    countEl.textContent = incoming.length + ' pending';

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(inc => {
      const total = inc.costs ? inc.costs.labor : 0;
      const svcCount = inc.modifications ? inc.modifications.length : 0;
      const dropoffInfo = inc.scheduledBlock
        ? '<div class="inc-card-dropoff"><strong>Scheduled drop-off:</strong> ' +
          inc.scheduledBlock.date + ' at ' + formatTime(inc.scheduledBlock.startTime) + '</div>'
        : '<div class="inc-card-dropoff inc-card-dropoff-none">No drop-off scheduled — walk-in</div>';

      return '<div class="inc-card" id="inc-' + inc.id + '">' +
        '<div class="inc-card-header">' +
          '<div class="inc-card-id">' + inc.id + '</div>' +
          '<div class="inc-card-time">' + relativeTime(inc.createdAt) + '</div>' +
        '</div>' +
        '<div class="inc-card-customer">' +
          '<div class="inc-card-name">' + inc.customer + '</div>' +
          '<div class="inc-card-phone">' + (inc.phone || '') + '</div>' +
          (inc.unit ? '<div class="inc-card-unit">' + inc.unit + '</div>' : '') +
        '</div>' +
        '<div class="inc-card-items">' +
          '<strong>Items:</strong> ' + (inc.uniform || 'Not specified') +
        '</div>' +
        '<div class="inc-card-services">' +
          '<strong>Services (' + svcCount + '):</strong>' +
          '<ul class="inc-card-svc-list">' +
            (inc.modifications || []).map(m => '<li>' + m + '</li>').join('') +
          '</ul>' +
        '</div>' +
        (inc.deadline ? '<div class="inc-card-deadline"><strong>Need by:</strong> ' + inc.deadline + '</div>' : '') +
        dropoffInfo +
        (inc.customerComment ? '<div class="inc-card-notes"><strong>Notes:</strong> ' + inc.customerComment + '</div>' : '') +
        '<div class="inc-card-footer">' +
          '<div class="inc-card-total">' + fmt(total) + '</div>' +
          '<button class="inc-receive-btn" onclick="receiveOrder(\'' + inc.id + '\')">Mark Received</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function formatTime(t) {
    if (!t) return '';
    const parts = t.split(':');
    let h = parseInt(parts[0]);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return h + ':' + m + ' ' + ampm;
  }

  // ── Receive Order (global for onclick) ────────────────────
  window.receiveOrder = function(id) {
    const inc = DataStore.getIncomingOrder(id);
    if (!inc) return;

    const order = DataStore.receiveIncoming(id);
    if (order) {
      showToast(inc.customer + ' checked in — Order ' + order.id + ' created');
      renderIncoming(searchInput.value.trim());
    }
  };

  // ── Search ────────────────────────────────────────────────
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderIncoming(searchInput.value.trim());
    });
  }

  // ── Sidebar Toggle ────────────────────────────────────────
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar-open');
    });
  }

  // ── Init ──────────────────────────────────────────────────
  renderNotifBadge();
  renderNotifications();
  renderIncoming();
});
