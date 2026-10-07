import { useState } from 'react'
import Icon from './components/Icon.jsx'
import Logo from './components/Logo.jsx'
import ExpertCard from './components/ExpertCard.jsx'
import AuthCard from './AuthCard.jsx'
import { EXPERTS } from './data.js'

const DAYS = ['Today', 'Wed', 'Thu', 'Fri']
const TIMES = { Today: ['6:00 PM', '7:30 PM'], Wed: ['10:00 AM', '2:00 PM', '5:00 PM'], Thu: ['9:00 AM', '11:30 AM', '4:00 PM'], Fri: ['10:00 AM', '1:00 PM'] }
const TAKEN = ['Wed 2:00 PM', 'Thu 9:00 AM']

export default function Landing({ theme, notify, onAuth }) {
  const [mode, setMode] = useState('login')
  const [day, setDay] = useState('Wed')
  const [slot, setSlot] = useState(null)
  const toAuth = (m, msg) => { setMode(m); notify(msg); document.getElementById('top').scrollIntoView({ behavior: 'smooth' }) }

  return (
    <>
      <div className="wrap">
        <nav className="top" aria-label="Main">
          <Logo as="a" href="#top" />
          <div className="nav-r">
            <div className="nav-links"><a href="#experts">Experts</a><a href="#how">How it works</a></div>
            <button className="icon-btn" onClick={theme.toggle} aria-label="Switch theme"><Icon n={theme.isDark ? 'sun' : 'moon'} size={18} /></button>
          </div>
        </nav>

        <header className="hero" id="top">
          <div className="hero-copy">
            <h1>Talk to someone who has <mark>already done it.</mark></h1>
            <p className="lede">Book a one-on-one session with career coaches, founders, doctors and teachers. Pick a time, pay per hour, get a straight answer.</p>
          </div>
          <div className="hero-demo">
            <div className="demo">
              <div className="demo-head">
                <div className="av on" style={{ background: '#FFB4A2' }}>SJ</div>
                <div><h3>Sarah Jenkins</h3><p className="muted">Career coach · 4.9 rating</p></div>
                <div className="rate">₹150<small>per hour</small></div>
              </div>
              <div className="chips" role="group" aria-label="Pick a day">
                {DAYS.map((d) => <button key={d} className="chip" aria-pressed={d === day} onClick={() => { setDay(d); setSlot(null) }}>{d}</button>)}
              </div>
              <div className="chips" role="group" aria-label="Pick a time">
                {TIMES[day].map((t) => <button key={t} className="chip" aria-pressed={t === slot} disabled={TAKEN.includes(day + ' ' + t)} onClick={() => setSlot(t)}>{t}</button>)}
              </div>
              <div className="demo-foot">
                <span>{slot ? <><b>{day}, {slot}</b> · ₹150</> : 'Pick a time to continue'}</span>
                <button className="btn sm" onClick={() => slot ? toAuth('signup', `Sign up to confirm ${day} at ${slot}`) : notify('Pick a time first')}>Book session</button>
              </div>
            </div>
            <div className="trust">
              <div><b>2,400+</b>verified experts</div><div><b>4.8</b>average rating</div><div><b>60 min</b>sessions, any topic</div>
            </div>
          </div>
          <AuthCard mode={mode} setMode={setMode} onAuth={onAuth} notify={notify} />
        </header>
      </div>

      <section className="s" id="experts"><div className="wrap">
        <div className="s-head"><h2>Experts available this week</h2><p className="muted">Every expert is verified. Rates are per hour and shown up front.</p></div>
        <div className="grid">
          {EXPERTS.slice(0, 6).map((e) => <ExpertCard key={e.id} e={e} onBook={() => toAuth('login', 'Log in to book ' + e.name)} />)}
        </div>
      </div></section>

      <section className="s" id="how"><div className="wrap">
        <div className="s-head"><h2>Three steps to your first session</h2></div>
        <div className="steps">
          <div className="step"><h3>Find your expert</h3><p>Search by topic or browse categories like career, health, business and education.</p></div>
          <div className="step"><h3>Pick a time</h3><p>See open slots, choose one that suits you, and pay the hourly rate.</p></div>
          <div className="step"><h3>Meet and follow up</h3><p>Join by video, then message your expert if you think of one more question.</p></div>
        </div>
      </div></section>

      <section className="s"><div className="wrap">
        <div className="cta"><h2>Know your field well? Get paid to share it.</h2><button className="btn" onClick={() => toAuth('signup', 'Choose "Give advice" to become an expert')}>Sign up as an expert</button></div>
      </div></section>
      <footer><div className="wrap"><span>© 2026 EduMen</span><span>Terms · Privacy · Help</span></div></footer>
    </>
  )
}
