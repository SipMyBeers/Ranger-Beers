document.addEventListener('DOMContentLoaded', () => {

  const inventory = storeInventory;

  const grid = document.getElementById('invGrid');
  const statsEl = document.getElementById('invStats');
  const searchInput = document.getElementById('invSearch');
  const catFilter = document.getElementById('catFilter');
  const invCountEl = document.getElementById('invCount');

  // Build category filter options
  const categories = [...new Set(inventory.map(i => i.category))].sort();
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catFilter.appendChild(opt);
  });

  function fmt(n) { return '$' + n.toFixed(2); }

  function render() {
    const q = searchInput.value.toLowerCase();
    const cat = catFilter.value;

    const filtered = inventory.filter(i => {
      const matchSearch = !q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
      const matchCat = cat === 'all' || i.category === cat;
      return matchSearch && matchCat;
    });

    invCountEl.textContent = filtered.length + ' item' + (filtered.length !== 1 ? 's' : '');

    // Stats
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, i) => sum + i.stock * i.price, 0);
    const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= 5).length;
    const outOfStock = inventory.filter(i => i.stock === 0).length;

    statsEl.innerHTML =
      '<div class="inv-stat"><span class="inv-stat-number">' + totalItems + '</span><span class="inv-stat-label">Total SKUs</span></div>' +
      '<div class="inv-stat"><span class="inv-stat-number">' + fmt(totalValue) + '</span><span class="inv-stat-label">Inventory Value</span></div>' +
      '<div class="inv-stat"><span class="inv-stat-number" style="color:var(--soon)">' + lowStock + '</span><span class="inv-stat-label">Low Stock Items</span></div>' +
      '<div class="inv-stat"><span class="inv-stat-number" style="color:var(--urgent)">' + outOfStock + '</span><span class="inv-stat-label">Out of Stock</span></div>';

    // Cards
    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="sop-empty">No inventory items match your search.</div>';
      return;
    }

    filtered.forEach(item => {
      const pct = item.maxStock > 0 ? Math.round((item.stock / item.maxStock) * 100) : 0;
      let stockClass, stockLabel;
      if (item.stock === 0) { stockClass = 'inv-stock-out'; stockLabel = 'Out of Stock'; }
      else if (item.stock <= 5) { stockClass = 'inv-stock-low'; stockLabel = item.stock + ' left — Low'; }
      else { stockClass = 'inv-stock-ok'; stockLabel = item.stock + ' in stock'; }

      let barColor;
      if (pct > 50) barColor = 'var(--on-track)';
      else if (pct > 20) barColor = 'var(--soon)';
      else barColor = 'var(--urgent)';

      const imgHtml = item.image
        ? '<div class="inv-card-img"><img src="' + item.image + '" alt="' + item.name + '" loading="lazy"></div>'
        : '<div class="inv-card-img"><span class="inv-img-placeholder">' + (item.icon || '?') + '</span></div>';

      const card = document.createElement('div');
      card.className = 'inv-card';
      card.innerHTML =
        imgHtml +
        '<div class="inv-card-content">' +
          '<div class="inv-card-header">' +
            '<span class="inv-card-name">' + item.name + '</span>' +
            '<span class="inv-card-price">' + fmt(item.price) + '</span>' +
          '</div>' +
          '<div class="inv-card-meta">' +
            '<span class="inv-cat-badge">' + item.category + '</span>' +
            '<span class="inv-stock-badge ' + stockClass + '">' + stockLabel + '</span>' +
          '</div>' +
          '<div class="inv-card-bar"><div class="inv-card-bar-fill" style="width:' + pct + '%;background:' + barColor + '"></div></div>' +
        '</div>';

      grid.appendChild(card);
    });
  }

  searchInput.addEventListener('input', render);
  catFilter.addEventListener('change', render);

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

  render();
});
