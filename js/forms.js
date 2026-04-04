(function () {
  const API_BASE = 'https://ranger-beers-api.dzbeers747.workers.dev';
  const CALENDLY_URL = 'https://calendly.com/rangerbeers'; // placeholder

  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  const closeBtn = document.getElementById('modal-close');

  const flows = {
    new_site: {
      title: 'Need a site?',
      fields: [
        { name: 'business_name', label: 'Business Name', type: 'text', required: true },
        { name: 'need_type', label: 'What do you need?', type: 'select', required: true, options: [
          { value: '', text: 'Select one...' },
          { value: 'new_site', text: 'New website' },
          { value: 'landing_page', text: 'Landing page' },
          { value: 'web_app', text: 'Web app' },
          { value: 'ecommerce', text: 'E-commerce' },
          { value: 'other', text: 'Other' },
        ]},
        { name: 'lead_name', label: 'Your Name', type: 'text', required: true },
        { name: 'lead_email', label: 'Email', type: 'email', required: true },
        { name: 'lead_phone', label: 'Phone', type: 'tel', required: false },
      ],
      successMsg: "Got it. I'll be in touch.",
    },
    existing_site: {
      title: 'Have a site?',
      fields: [
        { name: 'site_url', label: 'Your Site URL', type: 'url', required: true },
        { name: 'description', label: "What's wrong / what do you want?", type: 'textarea', required: true },
        { name: 'lead_name', label: 'Your Name', type: 'text', required: true },
        { name: 'lead_email', label: 'Email', type: 'email', required: true },
        { name: 'lead_phone', label: 'Phone', type: 'tel', required: false },
      ],
      successMsg: "Got it. I'll take a look.",
    },
    referral: {
      title: 'Have a referral?',
      fields: [
        { name: 'referrer_name', label: 'Your Name', type: 'text', required: true },
        { name: 'referrer_email', label: 'Your Email', type: 'email', required: true },
        { name: 'referrer_phone', label: 'Your Phone', type: 'tel', required: false },
        { name: 'lead_name', label: "Their Name", type: 'text', required: true },
        { name: 'lead_email', label: "Their Email", type: 'email', required: true },
        { name: 'lead_phone', label: "Their Phone", type: 'tel', required: false },
        { name: 'need_type', label: 'What do they need?', type: 'select', required: true, options: [
          { value: '', text: 'Select one...' },
          { value: 'new_site', text: 'New website' },
          { value: 'landing_page', text: 'Landing page' },
          { value: 'web_app', text: 'Web app' },
          { value: 'ecommerce', text: 'E-commerce' },
          { value: 'other', text: 'Other' },
        ]},
      ],
      successMsg: "Locked in. You'll get 10% when the deal closes.",
    },
  };

  function renderForm(flowKey) {
    const flow = flows[flowKey];
    let html = '<h2>' + flow.title + '</h2><form id="intake-form">';

    for (const field of flow.fields) {
      html += '<label for="field-' + field.name + '">' + field.label + (field.required ? '' : ' (optional)') + '</label>';

      if (field.type === 'select') {
        html += '<select id="field-' + field.name + '" name="' + field.name + '"' + (field.required ? ' required' : '') + '>';
        for (const opt of field.options) {
          html += '<option value="' + opt.value + '">' + opt.text + '</option>';
        }
        html += '</select>';
      } else if (field.type === 'textarea') {
        html += '<textarea id="field-' + field.name + '" name="' + field.name + '"' + (field.required ? ' required' : '') + '></textarea>';
      } else {
        html += '<input id="field-' + field.name + '" name="' + field.name + '" type="' + field.type + '"' + (field.required ? ' required' : '') + '>';
      }
    }

    html += '<button type="submit" class="modal-submit">Submit</button>';
    html += '<div class="modal-calendly"><a href="' + CALENDLY_URL + '" target="_blank" rel="noopener">Or book a call instead</a></div>';
    html += '</form>';

    modalBody.innerHTML = html;

    document.getElementById('intake-form').addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm(flowKey, this);
    });
  }

  async function submitForm(flowKey, form) {
    var btn = form.querySelector('.modal-submit');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    var data = { source: flowKey };
    var formData = new FormData(form);
    for (var pair of formData.entries()) {
      if (pair[1]) data[pair[0]] = pair[1];
    }

    try {
      var res = await fetch(API_BASE + '/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Submission failed');

      modalBody.innerHTML = '<div class="modal-success"><h2>Roger that.</h2><p>' + flows[flowKey].successMsg + '</p></div>';
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Submit';
      alert('Something went wrong. Try again.');
    }
  }

  function openModal(flowKey) {
    renderForm(flowKey);
    overlay.classList.add('active');
  }

  function closeModal() {
    overlay.classList.remove('active');
  }

  document.querySelectorAll('.hero-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(this.dataset.flow);
    });
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
