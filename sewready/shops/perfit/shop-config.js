// ══════════════════════════════════════════════════════════════
//  Perfit — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'perfit',
  name: 'Perfit',
  tagline: 'Perfect fit, every time. Military uniform tailoring specialists.',
  motto: 'Perfect fit. Every time.',
  address: '5595 Bragg Blvd, Fayetteville, NC 28303',
  phone: '(910) 555-0128',
  email: 'info@perfit.com',
  owner: 'Amanda R.',
  themeColors: {
    primary: '#388e3c',
    secondary: '#1a1a2e',
    accent: '#e91e63'
  },
  story: 'At Perfit, the name says it all. Amanda and Kevin specialize in getting the perfect fit for every military uniform.',
  trustSignals: {
    orders: '500+',
    rating: '4.9'
  },
  enabledServiceIds: null,
  adminPassword: process.env.ADMIN_PASSWORD || ''
};

const employees = [
  { id: 'emp-1', name: 'Amanda R.', role: 'Owner', color: '#388e3c',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'18:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:{start:'10:00',end:'15:00'} } },
  { id: 'emp-2', name: 'Kevin T.', role: 'Tailor', color: '#e91e63',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'14:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:null } }
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
