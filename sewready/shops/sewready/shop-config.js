// ══════════════════════════════════════════════════════════════
//  SewReady — Demo Shop Configuration
// ══════════════════════════════════════════════════════════════

const shopConfig = {
  tier: 'tier3',
  slug: 'sewready',
  name: 'SewReady',
  tagline: 'Your shop. Online. In 24 hours.',
  motto: 'Beautiful websites for sewing & alteration shops.',
  address: '123 Main Street, Fayetteville, NC 28301',
  phone: '(503) 592-3451',
  email: 'owner@ranger-beers.com',
  owner: 'Dylan B.',
  themeColors: {
    primary: '#c9a84c',
    secondary: '#141210',
    accent: '#e8d5a3'
  },
  established: 2024,
  website: 'https://sewing.ranger-beers.com',
  socials: {
    facebook: '',
    instagram: '',
    google: '',
    yelp: '',
    tiktok: ''
  },
  story: 'SewReady builds beautiful, mobile-ready websites for sewing & alteration shops near military installations. Free setup. Live in 24 hours.',
  trustSignals: {
    orders: '1,200+',
    rating: '5.0'
  },
  enabledServiceIds: null,
  adminPassword: 'demo123'
};

const employees = [
  { id: 'emp-1', name: 'Dylan B.', role: 'Owner', color: '#c9a84c',
    schedule: { 0:null, 1:{start:'08:00',end:'18:00'}, 2:{start:'08:00',end:'18:00'}, 3:{start:'08:00',end:'18:00'}, 4:{start:'08:00',end:'18:00'}, 5:{start:'08:00',end:'18:00'}, 6:{start:'09:00',end:'14:00'} } },
  { id: 'emp-2', name: 'Maria S.', role: 'Seamstress', color: '#5ba4a4',
    schedule: { 0:null, 1:{start:'09:00',end:'17:00'}, 2:{start:'09:00',end:'17:00'}, 3:{start:'09:00',end:'17:00'}, 4:{start:'09:00',end:'17:00'}, 5:{start:'09:00',end:'17:00'}, 6:null } },
  { id: 'emp-3', name: 'Jin K.', role: 'Tailor', color: '#a855f7',
    schedule: { 0:null, 1:{start:'10:00',end:'18:00'}, 2:{start:'10:00',end:'18:00'}, 3:null, 4:{start:'10:00',end:'18:00'}, 5:{start:'10:00',end:'18:00'}, 6:{start:'10:00',end:'15:00'} } }
];

const shopHours = {
  0: null,
  1: { start: '08:00', end: '18:00' },
  2: { start: '08:00', end: '18:00' },
  3: { start: '08:00', end: '18:00' },
  4: { start: '08:00', end: '18:00' },
  5: { start: '08:00', end: '18:00' },
  6: { start: '09:00', end: '14:00' }
};

const closedDates = [];
var sharedOrders = [
  { id: 'ORD-2001', customer: 'Sarah Mitchell', uniform: 'ASU Jacket — Sleeve Shorten', status: 'in-progress', scheduledBlock: { date: '2026-03-10', startTime: '09:00', endTime: '10:30', employeeId: 'emp-1' }},
  { id: 'ORD-2002', customer: 'James Rivera', uniform: 'ACU Pants — Hem & Taper', status: 'received', scheduledBlock: { date: '2026-03-10', startTime: '11:00', endTime: '12:00', employeeId: 'emp-2' }},
  { id: 'ORD-2003', customer: 'Maria Chen', uniform: 'Dress Blues — Full Taper', status: 'ready', scheduledBlock: { date: '2026-03-11', startTime: '09:30', endTime: '11:00', employeeId: 'emp-3' }},
  { id: 'ORD-2004', customer: 'Kevin Brooks', uniform: 'PT Shorts — Waist Take-In', status: 'received', scheduledBlock: { date: '2026-03-11', startTime: '13:00', endTime: '14:00', employeeId: 'emp-1' }},
  { id: 'ORD-2005', customer: 'Angela Torres', uniform: 'OCP Blouse — Nametape & Rank', status: 'in-progress', scheduledBlock: { date: '2026-03-12', startTime: '08:30', endTime: '09:30', employeeId: 'emp-2' }},
  { id: 'ORD-2006', customer: 'David Kim', uniform: 'Class A Pants — Hem', status: 'received', scheduledBlock: { date: '2026-03-12', startTime: '10:00', endTime: '11:00', employeeId: 'emp-3' }}
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
