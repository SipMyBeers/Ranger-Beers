document.addEventListener('DOMContentLoaded', () => {

  // ── Orders (references shared data) ──────────────────────
  const orders = sharedOrders;

  const statusLabels = {
    'received': 'Received',
    'in-progress': 'In Progress',
    'ready': 'Ready for Pickup',
    'completed': 'Completed'
  };

  const calGrid = document.getElementById('calGrid');
  const monthTitle = document.getElementById('monthTitle');
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  const sideTitle = document.getElementById('calSideTitle');
  const sideOrders = document.getElementById('calSideOrders');

  const today = new Date(2026, 2, 1); // March 1, 2026
  let currentYear = 2026;
  let currentMonth = 2; // 0-indexed, so 2 = March
  let selectedDay = null;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

  // ── Capacity Calculation ──────────────────────────────────
  function getDayCapacity(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const dow = d.getDay();
    if (!shopHours[dow] || closedDates.includes(dateStr)) return null; // closed

    // Total available minutes across all employees
    let totalAvail = 0;
    employees.forEach(emp => {
      const sched = emp.schedule[dow];
      if (sched) totalAvail += parseTime(sched.end) - parseTime(sched.start);
    });
    if (totalAvail === 0) return null;

    // Booked minutes — include both confirmed and incoming orders
    const allOrders = orders.concat(DataStore.getIncoming());
    let booked = 0;
    allOrders.forEach(o => {
      if (o.scheduledBlock && o.scheduledBlock.date === dateStr) {
        booked += parseTime(o.scheduledBlock.endTime) - parseTime(o.scheduledBlock.startTime);
      }
    });

    const ratio = booked / totalAvail;
    if (ratio >= 0.8) return 'full';
    if (ratio >= 0.4) return 'busy';
    return 'free';
  }

  // ── Render Calendar ───────────────────────────────────────
  function renderCalendar() {
    const headers = calGrid.querySelectorAll('.cal-day-header');
    calGrid.innerHTML = '';
    headers.forEach(h => calGrid.appendChild(h));

    monthTitle.textContent = monthNames[currentMonth] + ' ' + currentYear;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-cell cal-cell-empty';
      calGrid.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';

      const dateStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const dayOrders = orders.filter(o => o.deadline === dateStr);
      const closed = isDayClosed(dateStr);

      const isToday = currentYear === today.getFullYear() &&
                      currentMonth === today.getMonth() &&
                      d === today.getDate();

      if (isToday) cell.classList.add('cal-today');
      if (selectedDay === d) cell.classList.add('cal-selected');

      if (closed) {
        cell.classList.add('cal-cell-closed');
        cell.innerHTML =
          '<span class="cal-day-num">' + d + '</span>' +
          '<span class="cal-closed-label">Closed</span>';
      } else {
        // Capacity dot
        const cap = getDayCapacity(dateStr);
        let capHtml = '';
        if (cap) capHtml = '<span class="cal-cap-dot cal-cap-' + cap + '"></span>';

        // Order pills
        let pillsHtml = '';
        dayOrders.forEach(o => {
          pillsHtml += '<span class="cal-pill cal-pill-' + o.urgency + '" title="' + o.customer + '">' + o.customer.split(' ').pop() + '</span>';
        });

        cell.innerHTML =
          '<span class="cal-day-num">' + d + '</span>' +
          '<div class="cal-pills">' + pillsHtml + '</div>' +
          capHtml;
      }

      cell.addEventListener('click', () => selectDay(d, dateStr));
      calGrid.appendChild(cell);
    }
  }

  // ── Select Day — Side Panel ───────────────────────────────
  function selectDay(day, dateStr) {
    selectedDay = day;
    renderCalendar();

    const dateObj = new Date(dateStr + 'T00:00:00');
    const dow = dateObj.getDay();
    const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    sideTitle.textContent = formatted;

    const closed = isDayClosed(dateStr);
    let html = '';

    // ── Store Hours Badge ──
    if (closed) {
      html += '<div class="cal-side-closed-banner"><strong>CLOSED</strong>Shop is closed this day</div>';
    } else {
      const hours = shopHours[dow];
      html += '<div class="cal-hours-badge open">' + formatTime(hours.start) + ' – ' + formatTime(hours.end) + '</div>';
    }

    // ── Employee Shifts ──
    if (!closed) {
      html += '<div class="cal-emp-shifts">';
      employees.forEach(emp => {
        const sched = emp.schedule[dow];
        if (sched) {
          html += '<div class="cal-emp-shift">' +
            '<span class="cal-emp-dot" style="background:' + emp.color + '"></span>' +
            '<span class="cal-emp-name">' + emp.name + '</span>' +
            '<span class="cal-emp-hours">' + formatTime(sched.start) + ' – ' + formatTime(sched.end) + '</span>' +
          '</div>';
        }
      });
      html += '</div>';
    }

    // ── Time-Axis Timeline ──
    const scheduledOrders = orders.filter(o => o.scheduledBlock && o.scheduledBlock.date === dateStr);
    const deadlineOrders = orders.filter(o => o.deadline === dateStr && (!o.scheduledBlock || o.scheduledBlock.date !== dateStr));

    if (!closed && (scheduledOrders.length > 0 || deadlineOrders.length > 0)) {
      const hours = shopHours[dow];
      const startMin = parseTime(hours.start);
      const endMin = parseTime(hours.end);
      const totalMin = endMin - startMin;
      const pxPerMin = 3;
      const timelineHeight = totalMin * pxPerMin;

      html += '<div class="cal-timeline-section"><h4>Scheduled Work</h4>';
      html += '<div class="cal-timeline" style="height:' + timelineHeight + 'px;position:relative;">';

      // Hour and half-hour lines
      for (let m = startMin; m <= endMin; m += 30) {
        const top = (m - startMin) * pxPerMin;
        if ((m - startMin) % 60 === 0) {
          html += '<div class="cal-tl-hour" style="top:' + top + 'px">' +
            '<span class="cal-tl-hour-label">' + formatTime(minutesToTime(m)) + '</span>' +
          '</div>';
        } else {
          html += '<div class="cal-tl-half" style="top:' + top + 'px"></div>';
        }
      }

      // Scheduled blocks
      scheduledOrders.forEach(o => {
        const block = o.scheduledBlock;
        const emp = employees.find(e => e.id === block.employeeId);
        const bStart = parseTime(block.startTime);
        const bEnd = parseTime(block.endTime);
        const top = (bStart - startMin) * pxPerMin;
        const height = Math.max((bEnd - bStart) * pxPerMin, 24);
        const borderColor = emp ? emp.color : 'var(--accent-purple)';

        html += '<div class="cal-tl-block" style="top:' + top + 'px;height:' + height + 'px;border-left-color:' + borderColor + '" data-order="' + o.id + '">' +
          '<span class="cal-tl-block-id">' + o.id + '</span>' +
          '<span class="cal-tl-block-time">' + formatTime(block.startTime) + ' – ' + formatTime(block.endTime) + '</span>' +
          '<div class="cal-tl-block-customer">' + o.customer + ' · ' + o.uniform + '</div>' +
          (emp ? '<div class="cal-tl-block-emp"><span class="cal-emp-dot" style="background:' + emp.color + '"></span> ' + emp.name + '</div>' : '') +
        '</div>';
      });

      html += '</div></div>'; // close timeline + section
    }

    // ── Unscheduled orders due this day ──
    if (deadlineOrders.length > 0) {
      html += '<div class="cal-tl-unscheduled"><h4>Unscheduled — Due This Day</h4>';
      deadlineOrders.forEach(o => {
        html += '<div class="cal-side-card">' +
          '<div class="cal-side-card-header">' +
            '<span class="cal-side-id">' + o.id + '</span>' +
            '<span class="status-pill status-pill-' + o.status + '">' + statusLabels[o.status] + '</span>' +
          '</div>' +
          '<div class="cal-side-customer">' + o.customer + '</div>' +
          '<span class="uniform-badge badge-' + o.uniformKey + '">' + o.uniform + '</span>' +
          '<div class="cal-side-mods">' + o.modifications.join(', ') + '</div>' +
        '</div>';
      });
      html += '</div>';
    }

    // If nothing at all
    if (!closed && scheduledOrders.length === 0 && deadlineOrders.length === 0) {
      html += '<p class="cal-side-empty">No orders scheduled or due this day.</p>';
    }

    sideOrders.innerHTML = html;

    // ── Click handler: navigate to orders page ──
    sideOrders.querySelectorAll('.cal-tl-block').forEach(block => {
      block.addEventListener('click', () => {
        const orderId = block.dataset.order;
        window.location.href = 'orders.html?highlight=' + orderId;
      });
    });
  }

  prevBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    selectedDay = null;
    sideTitle.textContent = 'Select a day';
    sideOrders.innerHTML = '<p class="cal-side-empty">Click on a day to see its orders.</p>';
    renderCalendar();
  });

  nextBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    selectedDay = null;
    sideTitle.textContent = 'Select a day';
    sideOrders.innerHTML = '<p class="cal-side-empty">Click on a day to see its orders.</p>';
    renderCalendar();
  });

  // ── Sidebar Toggle ────────────────────────────────────────
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

  renderCalendar();
});
