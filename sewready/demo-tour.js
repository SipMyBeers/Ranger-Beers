// ══════════════════════════════════════════════════════════════
//  SewReady — Demo Tour
//  Shows guided tooltips when a user enters via /demo
//  Tour flag is set in sessionStorage by demo.html
// ══════════════════════════════════════════════════════════════

(function () {
  if (sessionStorage.getItem('sewready_demo_tour') !== 'true') return;

  // Only run tour on the dashboard (index.html)
  if (!window.location.pathname.includes('index.html')) return;

  // Clear so tour only shows once
  sessionStorage.removeItem('sewready_demo_tour');

  var steps = [
    {
      title: 'Welcome to Your Dashboard',
      text: 'This is where you manage everything — orders, schedules, and shop performance at a glance.',
      target: '.main-content, main',
      position: 'center'
    },
    {
      title: 'Order Pipeline',
      text: 'Your active orders flow through statuses: Received → In Progress → Ready → Picked Up. Click any order card to see details.',
      target: '#statusCards, .stat-grid',
      position: 'below'
    },
    {
      title: 'Navigation',
      text: 'Use the sidebar to access Orders, Incoming, Calendar, Analytics, Settings, and more.',
      target: '.sidebar, .sidebar-nav',
      position: 'right'
    },
    {
      title: 'Notifications',
      text: 'Real-time alerts for new orders, status changes, and deadlines. SMS and email notifications go out automatically on the Full plan.',
      target: '.notif-btn',
      position: 'below'
    },
    {
      title: 'You\'re All Set!',
      text: 'Explore the demo freely — try creating orders, checking analytics, or visiting the customer portal. When you\'re ready, sign up at /onboard.html.',
      target: null,
      position: 'center'
    }
  ];

  var currentStep = 0;
  var tooltip = null;
  var backdrop = null;

  function createTooltip() {
    backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99998;transition:opacity .3s';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', endTour);

    tooltip = document.createElement('div');
    tooltip.style.cssText = 'position:fixed;z-index:100000;background:#141d33;border:2px solid #06b6d4;border-radius:12px;padding:20px;max-width:320px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.5);transition:all .3s';
    document.body.appendChild(tooltip);
  }

  function showStep(n) {
    currentStep = n;
    var step = steps[n];
    var dots = steps.map(function (_, i) {
      return '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + (i === n ? '#06b6d4' : 'rgba(240,232,220,.15)') + ';margin:0 2px"></span>';
    }).join('');

    var isLast = n === steps.length - 1;
    tooltip.innerHTML =
      '<div style="margin-bottom:10px">' + dots + '</div>' +
      '<h4 style="margin:0 0 6px;font-size:14px;color:#06b6d4">' + step.title + '</h4>' +
      '<p style="margin:0 0 16px;font-size:13px;color:rgba(240,232,220,.6);line-height:1.5">' + step.text + '</p>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button id="tourSkip" style="padding:6px 14px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;background:rgba(240,232,220,.08);color:#f0e8dc">' + (isLast ? 'Close' : 'Skip') + '</button>' +
        (isLast ? '' : '<button id="tourNext" style="padding:6px 14px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;background:#3a6ea5;color:#fff">Next</button>') +
      '</div>';

    document.getElementById('tourSkip').addEventListener('click', endTour);
    var nextBtn = document.getElementById('tourNext');
    if (nextBtn) nextBtn.addEventListener('click', function () { showStep(n + 1); });

    // Position tooltip
    if (step.position === 'center' || !step.target) {
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
    } else {
      var targetEl = document.querySelector(step.target);
      if (targetEl) {
        var rect = targetEl.getBoundingClientRect();
        targetEl.style.position = targetEl.style.position || 'relative';
        targetEl.style.zIndex = '99999';

        if (step.position === 'below') {
          tooltip.style.top = (rect.bottom + 12) + 'px';
          tooltip.style.left = Math.max(16, rect.left) + 'px';
          tooltip.style.transform = 'none';
        } else if (step.position === 'right') {
          tooltip.style.top = rect.top + 'px';
          tooltip.style.left = (rect.right + 12) + 'px';
          tooltip.style.transform = 'none';
        }
      } else {
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
      }
    }
  }

  function endTour() {
    if (tooltip) tooltip.remove();
    if (backdrop) backdrop.remove();
    // Reset z-indexes
    document.querySelectorAll('[style*="z-index: 99999"]').forEach(function (el) {
      el.style.zIndex = '';
    });
  }

  // Start tour after a brief delay for page to load
  setTimeout(function () {
    createTooltip();
    showStep(0);
  }, 1000);
})();
