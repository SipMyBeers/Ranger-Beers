// ══════════════════════════════════════════════════════════════
//  STAR Sewing & Cleaners — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'star-sewing',
  name: 'STAR Sewing & Cleaners',
  tagline: 'Full-service sewing and cleaning for military uniforms. Fast turnaround near Fort Liberty.',
  motto: 'Stars don\'t wait. Neither do we.',
  address: '2615 Bragg Blvd, Fayetteville, NC 28303',
  phone: '(910) 555-0102',
  email: 'info@starsewing.com',
  owner: 'David R.',
  themeColors: {
    primary: '#2980b9',
    secondary: '#1a1a2e',
    accent: '#f1c40f'
  },
  story: 'STAR Sewing has been a trusted name near Fort Liberty for 12 years, providing uniform alterations, boot repair, and professional cleaning services.',
  trustSignals: {
    orders: '500+',
    rating: '4.9'
  },
  enabledServiceIds: null,
  adminPassword: 'dbju74'
};

const employees = [
  { id: 'emp-1', name: 'David R.', role: 'Owner', color: '#2980b9',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'18:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:{start:'10:00',end:'15:00'} } },
  { id: 'emp-2', name: 'Rosa M.', role: 'Seamstress', color: '#e91e63',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'14:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:null } },
  { id: 'emp-3', name: 'Tony G.', role: 'Boot Repair', color: '#795548',
    schedule: { 0:null, 1:{start:'10:00',end:'18:00'}, 2:{start:'10:00',end:'18:00'}, 3:{start:'10:00',end:'18:00'}, 4:{start:'10:00',end:'18:00'}, 5:{start:'09:00',end:'16:00'}, 6:{start:'10:00',end:'15:00'} } }
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
