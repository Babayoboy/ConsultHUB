import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from './components/Icon.jsx'
import BookSheet from './components/BookSheet.jsx'
import Home from './pages/Home.jsx'
import Sessions from './pages/Sessions.jsx'
import Messages from './pages/Messages.jsx'
import Saved from './pages/Saved.jsx'
import Logo from './components/Logo.jsx'
import UserAvatar from './components/UserAvatar.jsx'
import Profile from './pages/Profile.jsx'
import NotifSheet from './components/NotifSheet.jsx'
import { SESSIONS, THREADS, EXPERTS, REPLIES, MIN, fmtWhen, fmtLeft, slotToTs } from './data.js'

const NAV = [['home', 'Home', 'home'], ['sessions', 'Sessions', 'calendar'], ['messages', 'Messages', 'chat'], ['saved', 'Saved', 'bookmark'], ['profile', 'Profile', 'user']]

export default function Shell({ user, theme, notify, onLogout, onUpdate }) {
  const [tab, setTab] = useState('home')
  const [saved, setSaved] = useState([1])
  const [sessions, setSessions] = useState(SESSIONS)
  const [threads, setThreads] = useState(THREADS)
  const [openId, setOpenId] = useState(null)
  const [typing, setTyping] = useState({})
  const [notifs, setNotifs] = useState([])
  const [panel, setPanel] = useState(false)
  const [booking, setBooking] = useState(null)
  const [credits, setCredits] = useState(1500)
  const [prefs, setPrefs] = useState({ notif: true, lock: false })
  const [now, setNow] = useState(Date.now())
  const live = useRef({}); live.current = { tab, openId, prefs, saved, threads }
  const fired = useRef(new Set())
  useEffect(() => { window.scrollTo(0, 0) }, [tab])
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(i) }, [])

  // Push a notification: in-app list + toast, and a system notification when the app is in the background
  const push = useCallback((n) => {
    setNotifs((a) => [{ id: Date.now() + Math.random(), ts: Date.now(), read: false, ...n }, ...a].slice(0, 40))
    if (!live.current.prefs.notif) return
    notify(n.title)
    try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted') new Notification(n.title, { body: n.body, icon: '/favicon.svg', tag: n.tag }) } catch (e) {}
  }, [notify])

  const receive = useCallback((expertId, text) => {
    const ex = EXPERTS.find((x) => x.id === expertId), L = live.current
    const cur = L.threads.find((x) => x.expertId === expertId)
    const tid = cur ? cur.id : Math.max(0, ...L.threads.map((x) => x.id)) + 1
    const viewing = L.tab === 'messages' && L.openId === tid, m = { me: false, t: text, ts: Date.now() }
    setThreads((a) => (a.some((x) => x.id === tid)
      ? a.map((x) => (x.id === tid ? { ...x, msgs: [...x.msgs, m], unread: viewing ? 0 : x.unread + 1 } : x))
      : [...a, { id: tid, expertId, unread: viewing ? 0 : 1, msgs: [m] }]))
    if (!viewing) push({ kind: 'message', title: ex.name, body: text, tag: 'msg' + expertId, target: { thread: expertId } })
  }, [push])

  const send = (tid, text) => {
    const t = threads.find((x) => x.id === tid)
    setThreads((a) => a.map((x) => (x.id === tid ? { ...x, msgs: [...x.msgs, { me: true, t: text, ts: Date.now() }] } : x)))
    const n = t.msgs.length
    setTimeout(() => setTyping((o) => ({ ...o, [tid]: true })), 700)
    setTimeout(() => { setTyping((o) => ({ ...o, [tid]: false })); receive(t.expertId, REPLIES[n % REPLIES.length]) }, 2600)
  }
  const openThread = (id) => { setOpenId(id); setThreads((a) => a.map((t) => (t.id === id ? { ...t, unread: 0 } : t))) }
  // if a message lands in the thread being viewed, keep it read
  useEffect(() => { if (tab === 'messages' && openId) setThreads((a) => (a.some((t) => t.id === openId && t.unread) ? a.map((t) => (t.id === openId ? { ...t, unread: 0 } : t)) : a)) }, [tab, openId, threads])

  // Simulated incoming message (stands in for a realtime backend)
  useEffect(() => { const t = setTimeout(() => receive(3, 'Hi! I saw you were exploring admissions advice. Happy to help. When are you free this week?'), 25000); return () => clearTimeout(t) }, [receive])

  // "Consultant for you" picks from time to time
  useEffect(() => {
    let i = 0, t
    const go = (d) => { t = setTimeout(() => {
      const booked = sessions.filter((s) => s.status === 'upcoming').map((s) => s.expertId)
      const pool = EXPERTS.filter((e) => e.online && !booked.includes(e.id))
      if (pool.length) { const e = pool[i++ % pool.length]; push({ kind: 'match', title: 'Consultant for you', body: `${e.name} (${e.role}) is online now · ₹${e.rate}/hr`, target: { book: e.id } }) }
      go(120000) }, d) }
    go(50000); return () => clearTimeout(t)
  }, [push]) // eslint-disable-line

  // Meeting reminders: 15 / 5 / 1 min before, and when it starts
  useEffect(() => {
    sessions.filter((s) => s.status === 'upcoming').forEach((s) => {
      const left = s.at - now, name = EXPERTS.find((e) => e.id === s.expertId).name, f = (k) => fired.current.has(`${s.id}:${s.at}:${k}`), mark = (k) => fired.current.add(`${s.id}:${s.at}:${k}`)
      if (left <= 0 && left > -s.mins * MIN) { if (!f('go')) { [15, 5, 1].forEach(mark); mark('go'); push({ kind: 'meeting', title: 'Your session has started', body: `${s.title} with ${name}. Tap to join.`, tag: 's' + s.id, target: { tab: 'sessions' } }) }; return }
      for (const th of [1, 5, 15]) if (left > 0 && left <= th * MIN) {
        if (!f(th)) push({ kind: 'meeting', title: `Session in ${fmtLeft(left)}`, body: `${s.title} with ${name}`, tag: 's' + s.id, target: { tab: 'sessions' } })
        ;[1, 5, 15].filter((x) => x >= th).forEach(mark); break
      }
    })
  }, [now, sessions, push])

  const onSave = (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const confirm = (e, v) => {
    if (credits < e.rate) { notify('Not enough credits. Top up in Profile'); return }
    const at = slotToTs(v.day, v.time)
    setCredits((c) => c - e.rate)
    setSessions((a) => [{ id: Date.now(), title: `Session with ${e.name}`, expertId: e.id, at, when: fmtWhen(at), mins: 60, status: 'upcoming' }, ...a])
    setBooking(null); setTab('sessions'); notify('Booked with ' + e.name)
  }
  const reschedule = (id, v) => { const at = slotToTs(v.day, v.time); setSessions((a) => a.map((s) => (s.id === id ? { ...s, at, when: fmtWhen(at) } : s))) }
  const topUp = (a, label, txn) => { setCredits((c) => c + a); push({ kind: 'pay', title: 'Payment received', body: `₹${a.toLocaleString('en-IN')} added via ${label} · ${txn}`, target: { tab: 'profile' } }) }

  const liveSessions = useMemo(() => sessions.map((s) => { if (s.status !== 'upcoming') return s; const left = s.at - now; return { ...s, left, soon: left <= 15 * MIN && left > -s.mins * MIN } }), [sessions, now])
  const unread = threads.reduce((n, t) => n + t.unread, 0)
  const unseen = notifs.filter((n) => !n.read).length
  useEffect(() => {
    document.title = (unread + unseen ? `(${unread + unseen}) ` : '') + 'EduMen: book an hour with an expert'
    try { unread ? navigator.setAppBadge?.(unread) : navigator.clearAppBadge?.() } catch (e) {}
  }, [unread, unseen])

  const openNotif = (n) => {
    setNotifs((a) => a.map((x) => (x.id === n.id ? { ...x, read: true } : x))); setPanel(false)
    const t = n.target || {}
    if (t.thread) { const th = threads.find((x) => x.expertId === t.thread); setTab('messages'); if (th) openThread(th.id) }
    else if (t.book) { setTab('home'); setBooking(EXPERTS.find((e) => e.id === t.book)) }
    else if (t.tab) setTab(t.tab)
  }
  const goTab = (id) => { setTab(id); if (id !== 'messages') setOpenId(null) }
  const stats = { upcoming: sessions.filter((s) => s.status === 'upcoming').length, done: sessions.filter((s) => s.status === 'completed').length, saved: saved.length }

  const nav = (cls) => NAV.map(([id, label, icon]) => (
    <button key={id} className={cls + (tab === id ? ' on' : '')} onClick={() => goTab(id)} aria-current={tab === id ? 'page' : undefined}>
      <span className="ico"><Icon n={icon} size={22} />{id === 'messages' && unread > 0 && <i className="dot sm" />}</span><span>{label}</span>
    </button>
  ))

  return (
    <div className="shell">
      <aside className="side">
        <Logo />
        <nav className="side-nav" aria-label="Main">{nav('side-link')}</nav>
        <div className="side-foot">
          <UserAvatar user={user} size={38} />
          <div className="grow"><b className="sm">{user.name}</b><div className="muted sm clip">{user.email}</div></div>
          <button className="icon-btn sm" onClick={() => setPanel(true)} aria-label="Notifications"><Icon n="bell" size={16} />{unseen > 0 && <i className="dot sm" />}</button>
          <button className="icon-btn sm" onClick={theme.toggle} aria-label="Switch theme"><Icon n={theme.isDark ? 'sun' : 'moon'} size={16} /></button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <Logo />
          <div className="top-r">
            <button className="icon-btn" onClick={theme.toggle} aria-label="Switch theme"><Icon n={theme.isDark ? 'sun' : 'moon'} size={18} /></button>
            <button className="icon-btn" onClick={() => setPanel(true)} aria-label={unseen ? `Notifications, ${unseen} new` : 'Notifications'}><Icon n="bell" size={18} />{unseen > 0 && <i className="dot sm" />}</button>
          </div>
        </header>
        <main className="content">
          {tab === 'home' && <Home saved={saved} onSave={onSave} onBook={setBooking} />}
          {tab === 'sessions' && <Sessions sessions={liveSessions} setSessions={setSessions} onResched={reschedule} notify={notify} />}
          {tab === 'messages' && <Messages threads={threads} openId={openId} setOpenId={setOpenId} onOpen={openThread} onSend={send} typing={typing} />}
          {tab === 'saved' && <Saved saved={saved} onSave={onSave} onBook={setBooking} goHome={() => setTab('home')} />}
          {tab === 'profile' && <Profile user={user} stats={stats} credits={credits} theme={theme} prefs={prefs} setPrefs={setPrefs} onUpdate={onUpdate} onTopUp={topUp} onLogout={onLogout} notify={notify} />}
        </main>
      </div>

      <nav className={'bottom' + (tab === 'messages' && openId ? ' hide' : '')} aria-label="Main">{nav('b-link')}</nav>
      {panel && <NotifSheet items={notifs} onOpen={openNotif} onReadAll={() => setNotifs((a) => a.map((n) => ({ ...n, read: true })))} onClose={() => setPanel(false)} />}
      {booking && <BookSheet expert={booking} onConfirm={confirm} onClose={() => setBooking(null)} />}
    </div>
  )
}
