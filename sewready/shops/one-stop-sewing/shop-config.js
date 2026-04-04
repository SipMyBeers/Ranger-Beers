// ══════════════════════════════════════════════════════════════
//  One Stop Sewing & Cleaning — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'one-stop-sewing',
  name: 'One Stop Sewing & Cleaning',
  tagline: 'Your one-stop shop for sewing, cleaning, and uniform services near Fort Liberty.',
  motto: 'One stop. Zero hassle.',
  address: '2835 Bragg Blvd, Fayetteville, NC 28303',
  phone: '(910) 555-0104',
  email: 'info@onestopsewing.com',
  owner: 'James W.',
  themeColors: {
    primary: '#27ae60',
    secondary: '#1b2631',
    accent: '#f39c12'
  },
  story: 'One Stop Sewing has served military families for 10 years. We handle everything from simple hemming to full dress uniform setups, plus professional cleaning.',
  trustSignals: {
    orders: '500+',
    rating: '4.9'
  },
  enabledServiceIds: null,
  adminPassword: process.env.ADMIN_PASSWORD || ''
};

const employees = [
  { id: 'emp-1', name: 'James W.', role: 'Owner', color: '#27ae60',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'18:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:{start:'10:00',end:'15:00'} } },
  { id: 'emp-2', name: 'Linda H.', role: 'Seamstress', color: '#e91e63',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'14:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:null } },
  { id: 'emp-3', name: 'Mike T.', role: 'Awards', color: '#3498db',
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
