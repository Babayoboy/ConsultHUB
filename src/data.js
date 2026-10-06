export const CATEGORIES = ['Career', 'Health', 'Business', 'Edu', 'Tech & IT', 'Marketing', 'Finance', 'Design', 'Legal']
export const PILLS = ['Career', 'Health', 'Business', 'Edu']
export const DAYS = ['Wed, Oct 7', 'Thu, Oct 8', 'Fri, Oct 9', 'Sat, Oct 10']
export const TIMES = ['09:00 am', '11:30 am', '02:00 pm', '05:00 pm']

export const EXPERTS = [
  { id: 1, name: 'Sarah Jenkins', role: 'Career Coach', cat: 'Career', rate: 150, rating: 4.9, color: '#FFB4A2', online: true, bio: 'Executive Career Coach. Specializing in leadership transitions and salary negotiations for mid-to-senior levels.' },
  { id: 2, name: 'Marcus Reed', role: 'Business Coach', cat: 'Business', rate: 225, rating: 4.8, color: '#A5D8FF', online: true, bio: 'Startup Strategy Advisor. Helping early-stage founders build scalable business models and secure funding.' },
  { id: 3, name: 'Ananya Reddy', role: 'Edu Coach', cat: 'Edu', rate: 120, rating: 4.7, color: '#FFE08A', online: true, bio: 'Admissions Counselor. Guiding students in applying for Ivy League and highly competitive universities.' },
  { id: 4, name: 'Amit Patel', role: 'Tech & IT Coach', cat: 'Tech & IT', rate: 200, rating: 4.8, color: '#B8F2C9', online: false, bio: 'Senior Systems Expert. Specializes in system design and deep tech optimizations for engineering teams.' },
  { id: 5, name: 'Dr. Priya Nair', role: 'General Physician', cat: 'Health', rate: 300, rating: 4.9, color: '#D9C2FF', online: true, bio: 'Plain-language second opinions on reports, routines and recovery.' },
  { id: 6, name: 'Kabir Singh', role: 'Finance Mentor', cat: 'Finance', rate: 180, rating: 4.6, color: '#FFC9E3', online: false, bio: 'Budgeting, pricing and cash flow for small shops and freelancers.' },
  { id: 7, name: 'Meera Joshi', role: 'Brand Designer', cat: 'Design', rate: 140, rating: 4.7, color: '#FFD0A8', online: true, bio: 'Logo, brand and portfolio reviews for freelancers and early startups.' },
  { id: 8, name: 'Adv. Rahul Verma', role: 'Startup Lawyer', cat: 'Legal', rate: 350, rating: 4.8, color: '#C5E1A5', online: false, bio: 'Company registration, contracts and IP basics explained without jargon.' },
]

export const initials = (n) => n.replace(/^(Dr\.|Adv\.)\s*/, '').split(' ').map((w) => w[0]).join('')

export const MIN = 60000
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const time12 = (d) => `${String(d.getHours() % 12 || 12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`
export const fmtWhen = (ts) => { const d = new Date(ts); return `${MON[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${time12(d)}` }
// 'Wed, Oct 7' + '02:00 pm' -> timestamp
export const slotToTs = (day, time) => {
  const [m, dd] = day.split(', ')[1].split(' '); const [hm, ap] = time.split(' '); let [h, mi] = hm.split(':').map(Number)
  if (ap === 'pm' && h < 12) h += 12; if (ap === 'am' && h === 12) h = 0
  return new Date(new Date().getFullYear(), MON.indexOf(m), +dd, h, mi).getTime()
}
export const fmtLeft = (ms) => { const m = Math.max(1, Math.ceil(ms / MIN)); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m` }
export const chatTime = (ts) => time12(new Date(ts))

const n0 = Date.now(), Y = new Date().getFullYear()
const mk = (id, title, expertId, at, mins, status) => ({ id, title, expertId, at, when: fmtWhen(at), mins, status })
export const SESSIONS = [
  mk(1, 'Growth Strategy Alignment', 1, Math.ceil((n0 + 6 * MIN) / MIN) * MIN, 45, 'upcoming'), // demo: starts ~6 min after launch
  mk(2, 'Financial Audit Review', 6, new Date(Y, 9, 8, 8, 54).getTime() + 7 * 864e5, 60, 'upcoming'),
  mk(3, 'Pitch Deck Review & Seed Advice', 2, new Date(Y, 9, 5, 8, 55).getTime(), 45, 'completed'),
  mk(4, 'Portfolio Walkthrough', 7, new Date(Y, 9, 2, 16, 0).getTime(), 30, 'cancelled'),
]

export const THREADS = [
  { id: 1, expertId: 1, unread: 1, msgs: [{ me: false, t: 'Hi! Looking forward to our call today. Anything you want me to review first?', ts: n0 - 12 * MIN }] },
  { id: 2, expertId: 2, unread: 0, msgs: [{ me: true, t: 'Thanks for the seed round notes.', ts: n0 - 26 * 60 * MIN }, { me: false, t: 'Glad they helped. Send the updated deck when it is ready.', ts: n0 - 25 * 60 * MIN }] },
]

export const REPLIES = ['Sounds good. Could you share a bit more context?', 'Great, I will take a look and come prepared.', 'Thanks for the update! Anything specific you want to focus on?', 'Noted. Let us cover that in our session.', 'Happy to help. Feel free to send over any documents.']
