(function () {
  var API_BASE = 'https://ranger-beers-api.dzbeers747.workers.dev';
  var adminPassword = '';

  var gate = document.getElementById('admin-gate');
  var dash = document.getElementById('admin-dash');
  var passwordInput = document.getElementById('admin-password');
  var loginBtn = document.getElementById('admin-login');
  var leadList = document.getElementById('lead-list');
  var invoiceList = document.getElementById('invoice-list');
  var leadDetail = document.getElementById('lead-detail');

  function headers() {
    return { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword };
  }

  async function login() {
    adminPassword = passwordInput.value;
    try {
      var res = await fetch(API_BASE + '/api/admin/leads', { headers: headers() });
      if (!res.ok) throw new Error();
      gate.style.display = 'none';
      dash.classList.add('active');
      sessionStorage.setItem('rb-admin', adminPassword);
      loadLeads();
    } catch (e) {
      alert('Wrong password');
      adminPassword = '';
    }
  }

  loginBtn.addEventListener('click', login);
  passwordInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });

  var saved = sessionStorage.getItem('rb-admin');
  if (saved) { passwordInput.value = saved; login(); }

  document.querySelectorAll('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      var target = this.dataset.tab;
      document.getElementById('tab-leads').style.display = target === 'leads' ? 'block' : 'none';
      document.getElementById('tab-invoices').style.display = target === 'invoices' ? 'block' : 'none';
      if (target === 'invoices') loadInvoices();
    });
  });

  async function loadLeads() {
    var res = await fetch(API_BASE + '/api/admin/leads', { headers: headers() });
    var data = await res.json();
    leadList.innerHTML = '';
    leadDetail.classList.remove('active');
    for (var i = 0; i < data.leads.length; i++) {
      var lead = data.leads[i];
      var tr = document.createElement('tr');
      var date = new Date(lead.created_at).toLocaleDateString();
      tr.innerHTML = '<td><span class="source-pill source-pill--' + lead.source + '">' + lead.source.replace('_', ' ') + '</span></td>' +
        '<td>' + lead.lead_name + '</td><td>' + lead.lead_email + '</td>' +
        '<td><span class="status-pill status-pill--' + lead.status + '">' + lead.status.replace('_', ' ') + '</span></td>' +
        '<td>' + date + '</td>';
      (function(l) { tr.addEventListener('click', function () { showDetail(l); }); })(lead);
      leadList.appendChild(tr);
    }
  }

  function showDetail(lead) {
    var html = '<h3>' + lead.lead_name + '</h3>';
    html += '<p><strong>Source:</strong> ' + lead.source.replace('_', ' ') + '</p>';
    html += '<p><strong>Email:</strong> ' + lead.lead_email + '</p>';
    if (lead.lead_phone) html += '<p><strong>Phone:</strong> ' + lead.lead_phone + '</p>';
    if (lead.business_name) html += '<p><strong>Business:</strong> ' + lead.business_name + '</p>';
    if (lead.site_url) html += '<p><strong>Site:</strong> <a href="' + lead.site_url + '" target="_blank" style="color:var(--gold)">' + lead.site_url + '</a></p>';
    if (lead.need_type) html += '<p><strong>Need:</strong> ' + lead.need_type.replace('_', ' ') + '</p>';
    if (lead.description) html += '<p><strong>Description:</strong> ' + lead.description + '</p>';
    if (lead.referrer_name) html += '<p><strong>Referrer:</strong> ' + lead.referrer_name + ' (' + lead.referrer_email + ')</p>';
    if (lead.deal_amount) html += '<p><strong>Deal:</strong> $' + lead.deal_amount.toLocaleString() + '</p>';

    html += '<div class="lead-actions">' +
      '<select id="detail-status">' +
      '<option value="new"' + (lead.status === 'new' ? ' selected' : '') + '>New</option>' +
      '<option value="contacted"' + (lead.status === 'contacted' ? ' selected' : '') + '>Contacted</option>' +
      '<option value="closed_won"' + (lead.status === 'closed_won' ? ' selected' : '') + '>Closed Won</option>' +
      '<option value="closed_lost"' + (lead.status === 'closed_lost' ? ' selected' : '') + '>Closed Lost</option>' +
      '</select>' +
      '<input type="number" id="detail-amount" placeholder="Deal amount" value="' + (lead.deal_amount || '') + '" step="0.01">' +
      '<button id="detail-save">Save</button></div>';

    leadDetail.innerHTML = html;
    leadDetail.classList.add('active');

    document.getElementById('detail-save').addEventListener('click', async function () {
      var status = document.getElementById('detail-status').value;
      var deal_amount = parseFloat(document.getElementById('detail-amount').value) || null;
      var res = await fetch(API_BASE + '/api/admin/leads/' + lead.id, {
        method: 'PATCH', headers: headers(), body: JSON.stringify({ status: status, deal_amount: deal_amount }),
      });
      if (res.ok) { loadLeads(); } else { alert('Update failed'); }
    });
  }

  async function loadInvoices() {
    var res = await fetch(API_BASE + '/api/admin/invoices', { headers: headers() });
    var data = await res.json();
    invoiceList.innerHTML = '';
    for (var i = 0; i < data.invoices.length; i++) {
      var inv = data.invoices[i];
      var tr = document.createElement('tr');
      var date = new Date(inv.created_at).toLocaleDateString();
      tr.innerHTML = '<td>' + inv.referrer_name + '</td><td>' + inv.lead_name + '</td>' +
        '<td class="amt">$' + inv.deal_amount.toLocaleString() + '</td>' +
        '<td class="amt">$' + inv.commission.toLocaleString() + '</td>' +
        '<td><span class="status-pill status-pill--' + (inv.status === 'paid' ? 'closed_won' : 'new') + '">' + inv.status + '</span></td>' +
        '<td>' + date + '</td>' +
        '<td class="invoice-actions"><a href="' + API_BASE + '/api/admin/invoices/' + inv.id + '/pdf" target="_blank">PDF</a>' +
        (inv.status === 'unpaid' ? '<button data-id="' + inv.id + '">Mark Paid</button>' : '') + '</td>';
      invoiceList.appendChild(tr);
    }
    invoiceList.querySelectorAll('button[data-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var res = await fetch(API_BASE + '/api/admin/invoices/' + this.dataset.id + '/paid', {
          method: 'PATCH', headers: headers(),
        });
        if (res.ok) loadInvoices();
      });
    });
  }
})();
