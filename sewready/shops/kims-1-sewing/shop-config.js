// ══════════════════════════════════════════════════════════════
//  Kim's #1 Sewing & Dry Cleaning — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'kims-1-sewing',
  name: 'Kim\'s #1 Sewing & Dry Cleaning',
  tagline: 'Professional uniform alterations & dry cleaning. AR 670-1 compliant. Trusted by soldiers at Fort Liberty.',
  motto: 'Fort Liberty\'s finest thread.',
  address: '2501 Bragg Blvd, Fayetteville, NC 28303',
  phone: '(910) 555-0101',
  email: 'kim@kims1sewing.com',
  owner: 'Kim P.',
  themeColors: {
    primary: '#c0392b',
    secondary: '#2c3e50',
    accent: '#c9a84c'
  },
  story: 'Kim has served the Fort Liberty military community for over 20 years. Specializing in uniform alterations and dry cleaning, every stitch meets AR 670-1 standards.',
  trustSignals: {
    orders: '500+',
    rating: '4.9'
  },
  enabledServiceIds: null,
  adminPassword: process.env.ADMIN_PASSWORD || ''
};

const employees = [
  { id: 'emp-1', name: 'Kim P.', role: 'Owner', color: '#c0392b',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'18:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:{start:'10:00',end:'15:00'} } },
  { id: 'emp-2', name: 'Soyeon L.', role: 'Seamstress', color: '#e74c3c',
    schedule: { 0:null, 1:{start:'09:00',end:'18:00'}, 2:{start:'09:00',end:'18:00'}, 3:{start:'09:00',end:'14:00'}, 4:{start:'09:00',end:'18:00'}, 5:{start:'09:00',end:'18:00'}, 6:null } },
  { id: 'emp-3', name: 'Jun K.', role: 'Tailor', color: '#3498db',
    schedule: { 0:null, 1:{start:'10:00',end:'18:00'}, 2:{start:'10:00',end:'18:00'}, 3:{start:'10:00',end:'18:00'}, 4:{start:'10:00',end:'18:00'}, 5:{start:'09:00',end:'16:00'}, 6:{start:'10:00',end:'15:00'} } },
  { id: 'emp-4', name: 'Minji C.', role: 'Cleaner', color: '#2ecc71',
    schedule: { 0:null, 1:{start:'09:00',end:'17:00'}, 2:{start:'09:00',end:'17:00'}, 3:{start:'09:00',end:'17:00'}, 4:{start:'09:00',end:'17:00'}, 5:{start:'09:00',end:'17:00'}, 6:null } }
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
