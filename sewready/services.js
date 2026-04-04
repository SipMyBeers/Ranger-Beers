document.addEventListener('DOMContentLoaded', () => {

  // svcImages, services, catLabels, catClass loaded from services-data.js

  const grid = document.getElementById('svcGrid');
  const searchInput = document.getElementById('svcSearch');
  const catFilter = document.getElementById('svcCatFilter');
  const countEl = document.getElementById('svcCount');

  function fmt(n) { return '$' + n.toFixed(2); }

  function render() {
    const q = searchInput.value.toLowerCase();
    const cat = catFilter.value;

    const filtered = services.filter(s => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q));
      const matchCat = cat === 'all' || s.category === cat;
      return matchSearch && matchCat;
    });

    countEl.textContent = filtered.length + ' service' + (filtered.length !== 1 ? 's' : '');

    grid.innerHTML = '';
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="sop-empty">No services match your search.</div>';
      return;
    }

    filtered.forEach(svc => {
      const card = document.createElement('div');
      card.className = 'svc-card';
      const imgSrc = svcImages[svc.id] || '';
      card.innerHTML =
        (imgSrc ? '<div class="svc-card-img"><img src="' + imgSrc + '" alt="' + svc.name + '" onerror="this.parentElement.style.display=\'none\'"></div>' : '') +
        '<div class="svc-card-header">' +
          '<span class="svc-card-name">' + svc.name + '</span>' +
          '<div class="svc-card-header-right">' +
            '<span class="svc-card-price">' + fmt(svc.price) + '</span>' +
            '<span class="svc-expand-arrow">&#9654;</span>' +
          '</div>' +
        '</div>' +
        '<div class="svc-card-preview">' +
          '<span class="svc-cat-label ' + catClass[svc.category] + '">' + catLabels[svc.category] + '</span>' +
          '<span class="svc-card-time-sm">&#9202; ' + svc.time + '</span>' +
        '</div>' +
        '<div class="svc-card-details">' +
          '<div class="svc-card-desc">' + svc.desc + '</div>' +
          '<div class="svc-card-tags">' +
            svc.tags.map(t => '<span class="svc-tag">' + t + '</span>').join('') +
          '</div>' +
          '<div class="svc-card-time">&#9202; Est. ' + svc.time + '</div>' +
        '</div>';
      card.addEventListener('click', () => {
        card.classList.toggle('svc-card-open');
      });
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
