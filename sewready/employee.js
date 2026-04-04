document.addEventListener('DOMContentLoaded', () => {

  // ── Shop Config brand hydration ─────────────────────────
  if (typeof shopConfig !== 'undefined') {
    if (shopConfig.name) document.title = shopConfig.name + ' — My Schedule';
    const bn = document.querySelector('.brand-name');
    if (bn && shopConfig.name) bn.textContent = shopConfig.name;
    if (shopConfig.themeColors) {
      const root = document.documentElement.style;
      if (shopConfig.themeColors.primary) root.setProperty('--accent-purple', shopConfig.themeColors.primary);
      if (shopConfig.themeColors.secondary) root.setProperty('--bg-deep', shopConfig.themeColors.secondary);
      if (shopConfig.themeColors.accent) root.setProperty('--accent-yellow', shopConfig.themeColors.accent);
    }
  }

  const toast = document.getElementById('toast');
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('toast-show');
    setTimeout(() => toast.classList.remove('toast-show'), 3000);
  }

  // ── Parse employee ID from URL ──────────────────────────────
  const params = new URLSearchParams(window.location.search);
  let empId = params.get('id');
  if (!empId && params.get('preview') === '1') empId = 'emp-1';
  const emp = employees.find(e => e.id === empId);

  if (!emp) {
    document.querySelector('.emp-main').innerHTML =
      '<div class="emp-section"><p class="emp-empty" style="text-align:center;margin-top:40px;">' + t('emp.notFound') + '</p></div>';
    document.getElementById('empRequestBtn').style.display = 'none';
    return;
  }

  // ── Header ──────────────────────────────────────────────────
  document.getElementById('empName').textContent = emp.name;
  document.getElementById('empRole').textContent = emp.role;
  const avatar = document.getElementById('empAvatar');
  avatar.textContent = emp.name.charAt(0);
  avatar.style.background = emp.color;

  // ── Week calculation (Mon–Sat containing today) ─────────────
  const today = new Date(2026, 2, 1); // March 1, 2026
  const todayStr = '2026-03-01';

  // Find Monday of this week
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  // Build Mon–Sat (6 days)
  const weekDays = [];
  const dayLabels = [t('day.mon'), t('day.tue'), t('day.wed'), t('day.thu'), t('day.fri'), t('day.sat')];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    weekDays.push({ label: dayLabels[i], date: d, dateStr: dateStr, dow: d.getDay() });
  }

  // ── Render Week Strip ───────────────────────────────────────
  const weekStrip = document.getElementById('empWeekStrip');
  weekStrip.innerHTML = weekDays.map(day => {
    const sched = emp.schedule[day.dow];
    const closed = isDayClosed(day.dateStr);
    const isToday = day.dateStr === todayStr;

    let cls = 'emp-day-card';
    if (isToday) cls += ' emp-day-today';
    if (closed) cls += ' emp-day-closed';
    else if (!sched) cls += ' emp-day-off';

    let hoursText;
    if (closed) {
      hoursText = t('bigcal.closed');
    } else if (sched) {
      hoursText = formatTime(sched.start) + ' – ' + formatTime(sched.end);
    } else {
      hoursText = t('emp.off');
    }

    return '<div class="' + cls + '">' +
      '<div class="emp-day-name">' + day.label + '</div>' +
      '<div class="emp-day-date">' + day.date.getDate() + '</div>' +
      '<div class="emp-day-hours">' + hoursText + '</div>' +
    '</div>';
  }).join('');

  // ── Render Orders ───────────────────────────────────────────
  function getStatusLabels() {
    return {
      'received': t('status.received'),
      'in-progress': t('status.inProgress'),
      'ready': t('status.ready'),
      'completed': t('status.completed'),
      'pending': t('status.pending')
    };
  }

  function renderCombinedOrders(container, confirmedList, incomingList) {
    const statusLabels = getStatusLabels();
    // Merge confirmed and incoming, sort by start time
    const combined = [];
    confirmedList.forEach(o => combined.push({ order: o, isPending: false }));
    incomingList.forEach(o => combined.push({ order: o, isPending: true }));
    combined.sort((a, b) => {
      const aTime = a.order.scheduledBlock ? a.order.scheduledBlock.startTime : '99:99';
      const bTime = b.order.scheduledBlock ? b.order.scheduledBlock.startTime : '99:99';
      return aTime.localeCompare(bTime);
    });

    if (combined.length === 0) {
      container.innerHTML = '<p class="emp-empty">' + t('emp.noOrders') + '</p>';
      return;
    }

    container.innerHTML = combined.map(entry => {
      const o = entry.order;
      const block = o.scheduledBlock;
      const pendingCls = entry.isPending ? ' emp-order-pending' : '';
      const status = entry.isPending ? 'pending' : o.status;
      const statusLabel = statusLabels[status] || status;
      return '<div class="emp-order-card' + pendingCls + '" style="border-left-color:' + emp.color + '">' +
        '<div class="emp-order-time">' + formatTime(block.startTime) + ' – ' + formatTime(block.endTime) + '</div>' +
        '<div class="emp-order-id">' + o.id + '</div>' +
        '<div class="emp-order-customer">' + o.customer + '</div>' +
        '<div class="emp-order-uniform">' + o.uniform + '</div>' +
        '<span class="emp-order-status ' + status + '">' + statusLabel + '</span>' +
      '</div>';
    }).join('');
  }

  // Today's orders — confirmed + incoming
  const todayOrders = sharedOrders.filter(o =>
    o.scheduledBlock && o.scheduledBlock.date === todayStr && o.scheduledBlock.employeeId === empId
  );
  const todayIncoming = DataStore.getIncoming().filter(o =>
    o.scheduledBlock && o.scheduledBlock.date === todayStr && o.scheduledBlock.employeeId === empId
  );
  renderCombinedOrders(document.getElementById('empTodayOrders'), todayOrders, todayIncoming);

  // Upcoming orders (future dates) — confirmed + incoming
  const upcomingOrders = sharedOrders
    .filter(o => o.scheduledBlock && o.scheduledBlock.date > todayStr && o.scheduledBlock.employeeId === empId)
    .sort((a, b) => a.scheduledBlock.date.localeCompare(b.scheduledBlock.date));
  const upcomingIncoming = DataStore.getIncoming()
    .filter(o => o.scheduledBlock && o.scheduledBlock.date > todayStr && o.scheduledBlock.employeeId === empId)
    .sort((a, b) => a.scheduledBlock.date.localeCompare(b.scheduledBlock.date));
  renderCombinedOrders(document.getElementById('empUpcomingOrders'), upcomingOrders, upcomingIncoming);

  // ── Shift Request Modal ─────────────────────────────────────
  const overlay = document.getElementById('empOverlay');
  const reqBtn = document.getElementById('empRequestBtn');
  const closeBtn = document.getElementById('empModalClose');
  const reqType = document.getElementById('reqType');
  const timeRow = document.getElementById('reqTimeRow');
  const swapGroup = document.getElementById('reqSwapGroup');
  const swapSelect = document.getElementById('reqSwapWith');

  reqBtn.addEventListener('click', () => {
    overlay.classList.add('visible');
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('visible');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('visible');
  });

  // Populate swap dropdown (other employees)
  const otherEmps = employees.filter(e => e.id !== empId);
  swapSelect.innerHTML = otherEmps.map(e =>
    '<option value="' + e.id + '">' + e.name + '</option>'
  ).join('');

  // Toggle conditional fields
  reqType.addEventListener('change', () => {
    const val = reqType.value;
    timeRow.style.display = val === 'change-hours' ? 'flex' : 'none';
    swapGroup.style.display = val === 'swap' ? 'block' : 'none';
  });

  // Submit
  document.getElementById('reqSubmit').addEventListener('click', () => {
    const date = document.getElementById('reqDate').value;
    if (!date) {
      showToast(t('emp.selectDate'));
      return;
    }

    const type = reqType.value;
    const reason = document.getElementById('reqReason').value.trim();

    const dow = new Date(date + 'T00:00:00').getDay();
    const currentShift = emp.schedule[dow] || null;

    let requestedShift = null;
    let preferredSwap = null;

    if (type === 'change-hours') {
      requestedShift = {
        start: document.getElementById('reqStartTime').value,
        end: document.getElementById('reqEndTime').value
      };
    } else if (type === 'swap') {
      preferredSwap = swapSelect.value;
    }

    const now = new Date(2026, 2, 1);
    const timeStr = now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    DataStore.createShiftRequest({
      employeeId: empId,
      date: date,
      type: type,
      currentShift: currentShift,
      requestedShift: requestedShift,
      reason: reason,
      preferredSwap: preferredSwap,
      submittedAt: timeStr
    });

    overlay.classList.remove('visible');
    document.getElementById('reqDate').value = '';
    document.getElementById('reqReason').value = '';
    showToast(t('emp.requestSubmitted'));
  });

  // Language change — re-render
  document.addEventListener('language-changed', () => {
    sweepDOM();
    // Re-render week strip with translated labels
    const newDayLabels = [t('day.mon'), t('day.tue'), t('day.wed'), t('day.thu'), t('day.fri'), t('day.sat')];
    weekStrip.innerHTML = weekDays.map((day, i) => {
      const sched = emp.schedule[day.dow];
      const closed = isDayClosed(day.dateStr);
      const isToday = day.dateStr === todayStr;
      let cls = 'emp-day-card';
      if (isToday) cls += ' emp-day-today';
      if (closed) cls += ' emp-day-closed';
      else if (!sched) cls += ' emp-day-off';
      let hoursText;
      if (closed) hoursText = t('bigcal.closed');
      else if (sched) hoursText = formatTime(sched.start) + ' – ' + formatTime(sched.end);
      else hoursText = t('emp.off');
      return '<div class="' + cls + '">' +
        '<div class="emp-day-name">' + newDayLabels[i] + '</div>' +
        '<div class="emp-day-date">' + day.date.getDate() + '</div>' +
        '<div class="emp-day-hours">' + hoursText + '</div>' +
      '</div>';
    }).join('');
    // Re-render orders
    renderCombinedOrders(document.getElementById('empTodayOrders'), todayOrders, todayIncoming);
    renderCombinedOrders(document.getElementById('empUpcomingOrders'), upcomingOrders, upcomingIncoming);
  });

});
