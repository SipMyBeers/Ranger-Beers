// ══════════════════════════════════════════════════════════════
//  SewReady — Shared Data (single source of truth)
// ══════════════════════════════════════════════════════════════

// ── Employees ─────────────────────────────────────────────────
const employees = [
  { id: 'emp-1', name: 'Maria S.', role: 'Owner', color: '#a855f7',
    schedule: { 0:null, 1:{start:'08:00',end:'18:00'}, 2:{start:'08:00',end:'18:00'}, 3:{start:'08:00',end:'18:00'}, 4:{start:'08:00',end:'18:00'}, 5:{start:'08:00',end:'18:00'}, 6:{start:'09:00',end:'14:00'} } },
  { id: 'emp-2', name: 'Ana R.', role: 'Seamstress', color: '#06b6d4',
    schedule: { 0:null, 1:{start:'08:00',end:'18:00'}, 2:{start:'08:00',end:'18:00'}, 3:{start:'08:00',end:'14:00'}, 4:{start:'08:00',end:'18:00'}, 5:{start:'08:00',end:'18:00'}, 6:null } },
  { id: 'emp-3', name: 'Carlos M.', role: 'Seamstress', color: '#f97316',
    schedule: { 0:null, 1:{start:'10:00',end:'18:00'}, 2:{start:'08:00',end:'18:00'}, 3:{start:'08:00',end:'18:00'}, 4:{start:'08:00',end:'18:00'}, 5:{start:'08:00',end:'16:00'}, 6:{start:'09:00',end:'14:00'} } }
];

// ── Shop Hours & Closures ─────────────────────────────────────
const shopHours = {
  0: null,
  1: { start: '08:00', end: '18:00' },
  2: { start: '08:00', end: '18:00' },
  3: { start: '08:00', end: '18:00' },
  4: { start: '08:00', end: '18:00' },
  5: { start: '08:00', end: '18:00' },
  6: { start: '09:00', end: '14:00' }
};

const closedDates = ['2026-03-15'];

// ── Shift Requests ────────────────────────────────────────────
const shiftRequests = [
  {
    id: 'req-1',
    employeeId: 'emp-2',
    date: '2026-03-05',
    type: 'day-off',
    currentShift: { start: '08:00', end: '18:00' },
    requestedShift: null,
    reason: 'Doctor appointment',
    preferredSwap: 'emp-3',
    status: 'pending',
    submittedAt: '2026-03-01 9:00 AM'
  }
];

// ── Shared Orders (lightweight copies for calendar + employee) ─
const sharedOrders = [
  { id: 'SR-001', customer: 'SGT Rodriguez', phone: '(555) 201-4488', uniform: 'OCP Top', uniformKey: 'ocp-top',
    deadline: '2026-03-02', urgency: 'urgent', status: 'received',
    modifications: ['Rank Insignia', 'Name Tape', 'US Army Tape', 'Unit Patch', 'Skill Badges'],
    sopTitle: 'OCP Top — Full Setup', sopTime: '45 min',
    scheduledBlock: { date: '2026-03-02', startTime: '08:00', endTime: '08:45', employeeId: 'emp-1' } },
  { id: 'SR-002', customer: 'SPC Chen', phone: '(555) 339-7102', uniform: 'OCP Bottom', uniformKey: 'ocp-bottom',
    deadline: '2026-03-04', urgency: 'on-track', status: 'in-progress',
    modifications: ['Name Tape'],
    sopTitle: 'OCP Bottom — Name Tape', sopTime: '10 min',
    scheduledBlock: { date: '2026-03-04', startTime: '09:00', endTime: '09:10', employeeId: 'emp-2' } },
  { id: 'SR-003', customer: '1LT Adams', phone: '(555) 442-8830', uniform: 'Ranger Bundle', uniformKey: 'ranger-bundle',
    deadline: '2026-03-03', urgency: 'soon', status: 'received',
    modifications: ['Cat Eyes', 'IR Flag', 'Ranger Tab'],
    sopTitle: 'Ranger Bundle — Cat Eyes & Tab', sopTime: '30 min',
    scheduledBlock: { date: '2026-03-03', startTime: '10:00', endTime: '10:30', employeeId: 'emp-3' } },
  { id: 'SR-004', customer: 'SSG Petrov', phone: '(555) 581-2269', uniform: 'AGSU', uniformKey: 'agsu',
    deadline: '2026-03-06', urgency: 'on-track', status: 'in-progress',
    modifications: ['Awards Rack', 'Skill Badges', 'Rank Insignia'],
    sopTitle: 'AGSU Jacket — Awards & Badges', sopTime: '60 min',
    scheduledBlock: { date: '2026-03-06', startTime: '08:00', endTime: '09:00', employeeId: 'emp-1' } },
  { id: 'SR-005', customer: 'PFC Williams', phone: '(555) 773-0154', uniform: 'Patrol Cap', uniformKey: 'patrol-cap',
    deadline: '2026-03-01', urgency: 'urgent', status: 'ready',
    modifications: ['Rank Insignia'],
    sopTitle: 'Patrol Cap — Rank Insignia', sopTime: '10 min',
    scheduledBlock: { date: '2026-03-01', startTime: '08:00', endTime: '08:10', employeeId: 'emp-2' } },
  { id: 'SR-006', customer: 'CPT Hayes', phone: '(555) 604-9917', uniform: 'OCP Top', uniformKey: 'ocp-top',
    deadline: '2026-03-05', urgency: 'on-track', status: 'completed',
    modifications: ['Rank Insignia (new)', 'Name Tape (keep)', 'US Army Tape (keep)', 'Unit Patch (keep)'],
    sopTitle: 'OCP Top — Promotion Re-sew', sopTime: '15 min',
    scheduledBlock: { date: '2026-03-05', startTime: '14:00', endTime: '14:15', employeeId: 'emp-1' } }
];

// ── Time Helpers ──────────────────────────────────────────────
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
