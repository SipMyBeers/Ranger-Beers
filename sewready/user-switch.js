// ══════════════════════════════════════════════════════════════
//  SewReady — Switch User Dropdown (loaded on all pages)
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const userInfo = document.querySelector('.user-info');
  if (!userInfo) return;

  // Current user (default to first employee)
  let currentEmpId = localStorage.getItem('sewready-user') || 'emp-1';
  let currentEmp = employees.find(e => e.id === currentEmpId) || employees[0];

  // Build dropdown HTML
  const dropdown = document.createElement('div');
  dropdown.className = 'user-switch-dropdown';

  function renderDropdown() {
    currentEmp = employees.find(e => e.id === currentEmpId) || employees[0];

    dropdown.innerHTML =
      '<div class="user-switch-header">Switch Account</div>' +
      employees.map(emp => {
        const isActive = emp.id === currentEmpId;
        return '<button class="user-switch-item' + (isActive ? ' active' : '') + '" data-emp-id="' + emp.id + '">' +
          '<span class="user-switch-avatar" style="background:' + emp.color + '">' + emp.name.charAt(0) + '</span>' +
          '<span class="user-switch-meta">' +
            '<span class="user-switch-name">' + emp.name + '</span>' +
            '<span class="user-switch-role">' + emp.role + '</span>' +
          '</span>' +
          (isActive ? '<span class="user-switch-check">&#10003;</span>' : '') +
        '</button>';
      }).join('');

    // Click handlers
    dropdown.querySelectorAll('.user-switch-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        currentEmpId = item.dataset.empId;
        localStorage.setItem('sewready-user', currentEmpId);
        currentEmp = employees.find(el => el.id === currentEmpId) || employees[0];
        updateHeader();
        renderDropdown();
        dropdown.classList.remove('open');
      });
    });
  }

  function updateHeader() {
    const avatar = userInfo.querySelector('.user-avatar');
    const name = userInfo.querySelector('.user-name');
    if (avatar) {
      avatar.textContent = currentEmp.name.charAt(0);
      avatar.style.background = currentEmp.color;
    }
    if (name) {
      name.textContent = currentEmp.name;
    }
  }

  // Append dropdown to user-info
  userInfo.appendChild(dropdown);

  // Toggle on click
  userInfo.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  // Close when clicking outside
  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });

  // Init
  updateHeader();
  renderDropdown();
});
