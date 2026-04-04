// ══════════════════════════════════════════════════════════════
//  Nan's Cleaners — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'nans-cleaners',
  name: 'Nan\'s Cleaners',
  tagline: 'Reliable cleaning and pressing. Military uniforms our specialty.',
  motto: 'Sharp service. Sharper uniforms.',
  address: '4215 Bragg Blvd, Fayetteville, NC 28303',
  phone: '(910) 555-0116',
  email: 'nan@nanscleaners.com',
  owner: 'Nan W.',
  themeColors: {
    primary: '#27ae60',
    secondary: '#1a1a2e',
    accent: '#3498db'
  },
  story: 'Nan\'s Cleaners has kept Fort Liberty soldiers looking sharp for 11 years. Expert pressing and cleaning for all uniform types.',
  trustSignals: {
    orders: '500+',
    rating: '4.9'
  },
  enabledServiceIds: null,
  adminPassword: 'oumbqd'
};

const employees = [
  { id: 'emp-1', name: 'Nan W.', role: 'Owner', color: '#27ae60',
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
