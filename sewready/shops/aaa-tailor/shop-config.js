// ══════════════════════════════════════════════════════════════
//  AAA Tailor Shop — Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'aaa-tailor',
  name: 'AAA Tailor Shop',
  tagline: 'First-class tailoring. A+ service for military uniforms.',
  motto: 'Precision in every stitch.',
  address: '5710 Bragg Blvd, Fayetteville, NC 28303',
  phone: '(910) 555-0129',
  email: 'al@aaatailor.com',
  owner: 'Al D.',
  themeColors: {
    primary: '#f44336',
    secondary: '#1c2833',
    accent: '#ffeb3b'
  },
  established: 2014,
  website: 'https://aaatailor.com',
  socials: {
    facebook: 'https://facebook.com/aaatailor',
    instagram: 'https://instagram.com/aaatailor',
    google: 'https://g.page/aaatailor',
    yelp: '',
    tiktok: ''
  },
  story: 'AAA Tailor Shop delivers first-class tailoring services. Al takes pride in providing A+ work for every military uniform.',
  trustSignals: {
    orders: '500+',
    rating: '4.9'
  },
  enabledServiceIds: null,
  adminPassword: 'lu46hn'
};

const employees = [
  { id: 'emp-1', name: 'Al D.', role: 'Owner', color: '#f44336',
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
var sharedOrders = [
  { id: 'ORD-1041', customer: 'Sarah Mitchell', uniform: 'ASU Jacket — Sleeve Shorten', status: 'in-progress', scheduledBlock: { date: '2026-03-01', startTime: '09:00', endTime: '10:30', employeeId: 'emp-1' }},
  { id: 'ORD-1042', customer: 'James Rivera', uniform: 'ACU Pants — Hem', status: 'received', scheduledBlock: { date: '2026-03-01', startTime: '11:00', endTime: '12:00', employeeId: 'emp-1' }},
  { id: 'ORD-1043', customer: 'Maria Chen', uniform: 'Dress Blues — Taper', status: 'ready', scheduledBlock: { date: '2026-03-02', startTime: '09:30', endTime: '11:00', employeeId: 'emp-1' }},
  { id: 'ORD-1044', customer: 'Kevin Brooks', uniform: 'PT Shorts — Waist Take-In', status: 'received', scheduledBlock: { date: '2026-03-02', startTime: '13:00', endTime: '14:00', employeeId: 'emp-1' }}
];

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
