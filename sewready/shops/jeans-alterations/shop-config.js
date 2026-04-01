// ══════════════════════════════════════════════════════════════
//  Jean's Alterations — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'jeans-alterations',
  name: 'Jean\'s Alterations',
  tagline: 'Reliable alterations you can trust. Serving soldiers with care.',
  motto: 'Trust and quality in every stitch.',
  address: '5480 Bragg Blvd, Fayetteville, NC 28303',
  phone: '(910) 555-0127',
  email: 'jean@jeansalterations.com',
  owner: 'Jean P.',
  themeColors: {
    primary: '#1976d2',
    secondary: '#141d33',
    accent: '#ff8f00'
  },
  story: 'Jean has been providing reliable alteration services to Fort Liberty soldiers for over 13 years. Trust and quality in every stitch.',
  trustSignals: {
    orders: '500+',
    rating: '4.9'
  },
  enabledServiceIds: null,
  adminPassword: 'vf8v16'
};

const employees = [
  { id: 'emp-1', name: 'Jean P.', role: 'Owner', color: '#1976d2',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'18:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:{start:'10:00',end:'15:00'} } }
];

const shopHours = {
  0: null,
  1: { start: '09:00', end: '18:00' },
  2: { start: '09:00', end: '18:00' },
  3: { start: '09:00', end: '18:00' },
  4: { start: '09:00', end: '18:00' },
  5: { start: '09:00', end: '18:00' },
  6: { start: '10:00', end: '15:00' }
};

const closedDates = [];
const sharedOrders = [];

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function formatTime(str) {
  const [h, m] = str.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return hr + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function parseDuration(durStr) {
  const match = durStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
}

function isDayClosed(dateStr) {
  if (closedDates.includes(dateStr)) return true;
  const d = new Date(dateStr + 'T00:00:00');
  return !shopHours[d.getDay()];
}
