// ══════════════════════════════════════════════════════════════
//  SewReady — Receipt & Label Print Templates
//  Uses QRCode.js for QR generation, window.print() for output
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────
  var _shopSlug = (typeof shopConfig !== 'undefined' && shopConfig.slug) ? shopConfig.slug : 'sewready';
  var _baseUrl = 'https://sewing.ranger-beers.com';

  function _getShopCfg() {
    if (typeof shopConfig !== 'undefined') return shopConfig;
    if (typeof DataStore !== 'undefined') return DataStore.getShopConfig();
    return { name: 'SewReady', address: '', phone: '', email: '' };
  }

  function _fmt(n) { return '$' + (typeof n === 'number' ? n.toFixed(2) : '0.00'); }

  function _now() {
    var d = new Date();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function _formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function _calcTotal(order) {
    if (!order.costs) return 0;
    var mat = 0;
    if (order.costs.materials) {
      mat = order.costs.materials.reduce(function (s, m) {
        return s + (m.qty || 1) * (m.price || m.unitPrice || 0);
      }, 0);
    }
    return (order.costs.labor || 0) + mat;
  }

  function _trackUrl(orderId) {
    return _baseUrl + '/shops/' + _shopSlug + '/customer.html?track=' + encodeURIComponent(orderId);
  }

  // ── QR Code generation ─────────────────────────────────────
  function _makeQR(containerId, text, size) {
    size = size || 100;
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(el, {
        text: text,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      el.innerHTML = '<span style="font-size:9px;color:#999">[QR unavailable]</span>';
    }
  }

  // ── Inject print container and trigger print ───────────────
  function _printHTML(html, className) {
    // Remove any existing print containers
    var old = document.querySelectorAll('.print-receipt, .print-label');
    old.forEach(function (el) { el.remove(); });

    var div = document.createElement('div');
    div.className = className || 'print-receipt';
    div.innerHTML = html;
    document.body.appendChild(div);

    // Generate QR codes after DOM insertion
    var qrEls = div.querySelectorAll('[data-qr-text]');
    qrEls.forEach(function (el) {
      var text = el.getAttribute('data-qr-text');
      var size = parseInt(el.getAttribute('data-qr-size') || '100');
      if (typeof QRCode !== 'undefined') {
        new QRCode(el, {
          text: text,
          width: size,
          height: size,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    });

    // Small delay so QR renders, then print
    setTimeout(function () {
      window.print();
      // Cleanup after print dialog closes
      setTimeout(function () { div.remove(); }, 1000);
    }, 300);
  }

  // ══════════════════════════════════════════════════════════════
  //  1. DROP-OFF RECEIPT
  // ══════════════════════════════════════════════════════════════
  function printDropoffReceipt(order, cfg) {
    cfg = cfg || _getShopCfg();
    var total = _calcTotal(order);
    var mods = order.modifications || [];
    var qrText = _trackUrl(order.id);

    var itemsHtml = '';
    mods.forEach(function (m) {
      itemsHtml += '<div class="receipt-item"><span class="receipt-item-name">' + m + '</span></div>';
    });

    var materialsHtml = '';
    if (order.costs && order.costs.materials) {
      order.costs.materials.forEach(function (m) {
        materialsHtml += '<div class="receipt-item">' +
          '<span class="receipt-item-name">' + m.item + (m.qty > 1 ? ' x' + m.qty : '') + '</span>' +
          '<span class="receipt-item-price">' + _fmt(m.qty * (m.price || m.unitPrice || 0)) + '</span>' +
          '</div>';
      });
    }

    var html =
      '<div class="receipt-header">' +
        '<p class="receipt-shop-name">' + (cfg.name || 'SewReady') + '</p>' +
        '<p class="receipt-shop-info">' + (cfg.address || '') + '</p>' +
        '<p class="receipt-shop-info">' + (cfg.phone || '') + ' | ' + (cfg.email || '') + '</p>' +
      '</div>' +

      '<div class="receipt-section-title">Drop-Off Receipt</div>' +

      '<div class="receipt-row"><span class="receipt-row-label">Order #</span><span class="receipt-row-value">' + order.id + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Customer</span><span class="receipt-row-value">' + (order.customer || '') + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Phone</span><span class="receipt-row-value">' + (order.phone || '') + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Uniform</span><span class="receipt-row-value">' + (order.uniform || '') + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Drop-off</span><span class="receipt-row-value">' + _now() + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Deadline</span><span class="receipt-row-value">' + _formatDate(order.deadline) + '</span></div>' +

      '<div class="receipt-section-title">Services</div>' +
      '<div class="receipt-items">' + itemsHtml + '</div>' +

      (materialsHtml ? '<div class="receipt-section-title">Materials</div><div class="receipt-items">' + materialsHtml + '</div>' : '') +

      '<div class="receipt-totals">' +
        '<div class="receipt-total-row"><span>Labor</span><span>' + _fmt(order.costs ? order.costs.labor : 0) + '</span></div>' +
        '<div class="receipt-total-row receipt-grand-total"><span>Estimated Total</span><span>' + _fmt(total) + '</span></div>' +
      '</div>' +

      '<div class="receipt-qr" data-qr-text="' + qrText + '" data-qr-size="100"></div>' +
      '<div class="receipt-qr-label" style="text-align:center;font-size:9px">Scan to track your order</div>' +

      '<div class="receipt-footer">' +
        '<p>Thank you for choosing ' + (cfg.name || 'SewReady') + '!</p>' +
        '<p>We\'ll notify you when your order is ready.</p>' +
      '</div>' +

      '<div class="receipt-cut-line">- - - - - - - - cut here - - - - - - - -</div>';

    _printHTML(html, 'print-receipt');
  }

  // ══════════════════════════════════════════════════════════════
  //  2. PICKUP RECEIPT
  // ══════════════════════════════════════════════════════════════
  function printPickupReceipt(order, cfg) {
    cfg = cfg || _getShopCfg();
    var total = _calcTotal(order);
    var mods = order.modifications || [];
    var qrText = _trackUrl(order.id);

    var itemsHtml = '';
    mods.forEach(function (m) {
      itemsHtml += '<div class="receipt-item"><span class="receipt-item-name">' + m + '</span></div>';
    });

    var materialsHtml = '';
    if (order.costs && order.costs.materials) {
      order.costs.materials.forEach(function (m) {
        materialsHtml += '<div class="receipt-item">' +
          '<span class="receipt-item-name">' + m.item + (m.qty > 1 ? ' x' + m.qty : '') + '</span>' +
          '<span class="receipt-item-price">' + _fmt(m.qty * (m.price || m.unitPrice || 0)) + '</span>' +
          '</div>';
      });
    }

    var html =
      '<div class="receipt-header">' +
        '<p class="receipt-shop-name">' + (cfg.name || 'SewReady') + '</p>' +
        '<p class="receipt-shop-info">' + (cfg.address || '') + '</p>' +
        '<p class="receipt-shop-info">' + (cfg.phone || '') + '</p>' +
      '</div>' +

      '<div class="receipt-section-title">Pickup Receipt</div>' +

      '<div class="receipt-row"><span class="receipt-row-label">Order #</span><span class="receipt-row-value">' + order.id + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Customer</span><span class="receipt-row-value">' + (order.customer || '') + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Completed</span><span class="receipt-row-value">' + _now() + '</span></div>' +

      '<div class="receipt-section-title">Services Performed</div>' +
      '<div class="receipt-items">' + itemsHtml + '</div>' +

      (materialsHtml ? '<div class="receipt-section-title">Materials</div><div class="receipt-items">' + materialsHtml + '</div>' : '') +

      '<div class="receipt-totals">' +
        '<div class="receipt-total-row"><span>Labor</span><span>' + _fmt(order.costs ? order.costs.labor : 0) + '</span></div>' +
        '<div class="receipt-total-row receipt-grand-total"><span>Total</span><span>' + _fmt(total) + '</span></div>' +
      '</div>' +

      '<div class="receipt-thankyou">Thank You!</div>' +

      '<div class="receipt-qr" data-qr-text="' + qrText + '" data-qr-size="100"></div>' +
      '<div class="receipt-qr-label" style="text-align:center;font-size:9px">Leave us a review!</div>' +

      '<div class="receipt-footer">' +
        '<p>' + (cfg.name || 'SewReady') + '</p>' +
        '<p>' + (cfg.phone || '') + '</p>' +
      '</div>' +

      '<div class="receipt-cut-line">- - - - - - - - cut here - - - - - - - -</div>';

    _printHTML(html, 'print-receipt');
  }

  // ══════════════════════════════════════════════════════════════
  //  3. ORDER LABEL (small 2"x3" garment tag)
  // ══════════════════════════════════════════════════════════════
  function printOrderLabel(order, cfg) {
    cfg = cfg || _getShopCfg();
    var qrText = order.id;

    var html =
      '<div class="label-order-id">' + order.id + '</div>' +
      '<div class="label-customer">' + (order.customer || '') + '</div>' +
      '<div class="label-info">' + (order.uniform || '') + '</div>' +
      '<div class="label-info">Due: ' + _formatDate(order.deadline) + '</div>' +
      '<div class="label-qr" data-qr-text="' + qrText + '" data-qr-size="60"></div>';

    _printHTML(html, 'print-label');
  }

  // ══════════════════════════════════════════════════════════════
  //  4. CUSTOMER CONFIRMATION
  // ══════════════════════════════════════════════════════════════
  function printCustomerConfirmation(order, cfg) {
    cfg = cfg || _getShopCfg();
    var total = _calcTotal(order);
    var mods = order.modifications || [];
    var qrText = _trackUrl(order.id);

    var itemsHtml = '';
    mods.forEach(function (m) {
      itemsHtml += '<div class="receipt-item"><span class="receipt-item-name">' + m + '</span></div>';
    });

    var apptHtml = '';
    if (order.scheduledBlock) {
      apptHtml =
        '<div class="receipt-section-title">Appointment</div>' +
        '<div class="receipt-row"><span class="receipt-row-label">Date</span><span class="receipt-row-value">' + _formatDate(order.scheduledBlock.date) + '</span></div>' +
        '<div class="receipt-row"><span class="receipt-row-label">Time</span><span class="receipt-row-value">' + (order.scheduledBlock.startTime || '') + '</span></div>';
    }

    var html =
      '<div class="receipt-header">' +
        '<p class="receipt-shop-name">' + (cfg.name || 'SewReady') + '</p>' +
        '<p class="receipt-shop-info">' + (cfg.address || '') + '</p>' +
        '<p class="receipt-shop-info">' + (cfg.phone || '') + '</p>' +
      '</div>' +

      '<div class="receipt-section-title">Order Confirmation</div>' +

      '<div class="receipt-row"><span class="receipt-row-label">Order #</span><span class="receipt-row-value">' + order.id + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Customer</span><span class="receipt-row-value">' + (order.customer || '') + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Submitted</span><span class="receipt-row-value">' + _now() + '</span></div>' +
      '<div class="receipt-row"><span class="receipt-row-label">Deadline</span><span class="receipt-row-value">' + _formatDate(order.deadline) + '</span></div>' +

      apptHtml +

      '<div class="receipt-section-title">Services Requested</div>' +
      '<div class="receipt-items">' + itemsHtml + '</div>' +

      '<div class="receipt-totals">' +
        '<div class="receipt-total-row receipt-grand-total"><span>Estimated Total</span><span>' + _fmt(total) + '</span></div>' +
      '</div>' +

      '<div class="receipt-section-title">What to Expect</div>' +
      '<div style="font-size:10px;line-height:1.6;padding:4px 0">' +
        '<p>1. Bring your uniform(s) to the shop</p>' +
        '<p>2. We\'ll inspect and confirm services</p>' +
        '<p>3. You\'ll receive updates via text/email</p>' +
        '<p>4. Pick up when notified — that\'s it!</p>' +
      '</div>' +

      '<div class="receipt-qr" data-qr-text="' + qrText + '" data-qr-size="100"></div>' +
      '<div class="receipt-qr-label" style="text-align:center;font-size:9px">Scan to track your order</div>' +

      '<div class="receipt-footer">' +
        '<p>Questions? Call ' + (cfg.phone || 'us') + '</p>' +
        '<p>' + (cfg.name || 'SewReady') + '</p>' +
      '</div>';

    _printHTML(html, 'print-receipt');
  }

  // ── Expose globally ────────────────────────────────────────
  window.printDropoffReceipt = printDropoffReceipt;
  window.printPickupReceipt = printPickupReceipt;
  window.printOrderLabel = printOrderLabel;
  window.printCustomerConfirmation = printCustomerConfirmation;

})();
