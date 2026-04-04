// ══════════════════════════════════════════════════════════════
//  Sue's Sewing & Laundry — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'sues-sewing',
  name: 'Sue\'s Sewing & Laundry',
  tagline: 'Sewing, alterations, and laundry services for military personnel near Fort Liberty.',
  motto: 'Trusted hands. Trusted thread.',
  address: '3180 Bragg Blvd, Fayetteville, NC 28303',
  phone: '(910) 555-0107',
  email: 'sue@suessewing.com',
  owner: 'Sue N.',
  themeColors: {
    primary: '#e74c3c',
    secondary: '#2c2c54',
    accent: '#f1c40f'
  },
  story: 'Sue has provided reliable sewing and laundry services to Fort Liberty soldiers for 8 years. Fast turnaround and quality work you can count on.',
  trustSignals: {
    orders: '500+',
    rating: '4.9'
  },
  enabledServiceIds: null,
  adminPassword: process.env.ADMIN_PASSWORD || ''
};

const employees = [
  { id: 'emp-1', name: 'Sue N.', role: 'Owner', color: '#e74c3c',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'18:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:{start:'10:00',end:'15:00'} } },
  { id: 'emp-2', name: 'Tom R.', role: 'Repair', color: '#3498db',
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
