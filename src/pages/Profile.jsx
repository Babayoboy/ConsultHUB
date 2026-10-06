import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import UserAvatar, { PRESETS } from '../components/UserAvatar.jsx'
import TopUp from '../components/TopUp.jsx'
import { askNotifPermission } from '../hooks.js'

const inr = (n) => '₹' + n.toLocaleString('en-IN')

function shrink(file, cb) {
  const r = new FileReader()
  r.onload = () => {
    const img = new Image()
    img.onload = () => {
      const S = 256, k = Math.max(S / img.width, S / img.height)
      const c = document.createElement('canvas'); c.width = c.height = S
      const w = img.width * k, h = img.height * k
      c.getContext('2d').drawImage(img, (S - w) / 2, (S - h) / 2, w, h)
      cb(c.toDataURL('image/jpeg', 0.85))
    }
    img.src = r.result
  }
  r.readAsDataURL(file)
}

function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={'sw' + (on ? ' on' : '')} onClick={onChange}><i /></button>
}

function EditSheet({ user, onSave, onClose, notify }) {
  const [d, setD] = useState({ name: user.name, email: user.email, headline: user.headline || '', avatar: user.avatar })
  const [err, setErr] = useState({})
  const file = useRef()
  const pick = (e) => {
    const f = e.target.files[0]; e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) return notify('Please choose an image file')
    shrink(f, (src) => setD((x) => ({ ...x, avatar: { type: 'photo', src } })))
  }
  const save = () => {
    const n = {}
    if (d.name.trim().length < 2) n.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) n.email = 'Enter a valid email.'
    setErr(n)
    if (Object.keys(n).length) return
    onSave({ ...user, name: d.name.trim(), email: d.email.trim(), headline: d.headline.trim(), avatar: d.avatar })
  }
  const preview = { ...user, name: d.name || user.name, avatar: d.avatar }
  return (
    <Sheet title="Edit profile" onClose={onClose}>
      <div className="ed-av"><UserAvatar user={preview} size={92} /></div>
      <div className="ed-btns">
        <button className="btn ghost sm" onClick={() => file.current.click()}><Icon n="camera" size={16} /> Upload photo</button>
        {d.avatar && <button className="btn ghost sm" onClick={() => setD({ ...d, avatar: undefined })}><Icon n="trash" size={16} /> Remove</button>}
        <input ref={file} type="file" accept="image/*" hidden onChange={pick} />
      </div>
      <div className="lbl ctr">Or pick an avatar</div>
      <div className="presets" role="group" aria-label="Avatar">
        {PRESETS.map(([e, bg]) => (
          <button key={e} className="pre" style={{ background: bg }} aria-pressed={d.avatar?.e === e} aria-label={'Avatar ' + e} onClick={() => setD({ ...d, avatar: { type: 'emoji', e, bg } })}>{e}</button>
        ))}
      </div>
      {[['name', 'Full name', 'name'], ['email', 'Email', 'email'], ['headline', 'Headline (optional)', 'off']].map(([k, l, ac]) => (
        <div className="field" key={k} style={{ marginTop: 14, marginBottom: 0 }}>
          <label htmlFor={'e-' + k}>{l}</label>
          <div className="inp"><input id={'e-' + k} value={d[k]} maxLength={k === 'headline' ? 60 : 80} type={k === 'email' ? 'email' : 'text'} autoComplete={ac} aria-invalid={!!err[k]} placeholder={k === 'headline' ? 'e.g. Product designer in Delhi' : ''} onChange={(e) => { setD({ ...d, [k]: e.target.value }); setErr({ ...err, [k]: '' }) }} /></div>
          {err[k] && <div className="err">{err[k]}</div>}
        </div>
      ))}
      <button className="btn block" style={{ marginTop: 20 }} onClick={save}>Save changes</button>
    </Sheet>
  )
}

export default function Profile({ user, stats, credits, theme, prefs, setPrefs, onUpdate, onTopUp, onLogout, notify }) {
  const [sheet, setSheet] = useState(null)
  const rows = [
    { i: 'card', t: 'Payment Methods', s: 'Google Pay, UPI, cards', go: () => setSheet('top') },
    { i: theme.isDark ? 'moon' : 'sun', t: 'Dark theme', s: 'Switch between light and dark', sw: theme.isDark, toggle: theme.toggle },
    { i: 'bell', t: 'Notifications', s: 'Session reminders, messages, picks for you', sw: prefs.notif, toggle: () => { if (!prefs.notif) askNotifPermission(); setPrefs({ ...prefs, notif: !prefs.notif }) } },
    { i: 'lock', t: 'App lock', s: 'Ask for biometrics on open', sw: prefs.lock, toggle: () => setPrefs({ ...prefs, lock: !prefs.lock }) },
    { i: 'shield', t: 'Privacy & Security', s: 'Data and account safety', go: () => notify('Privacy settings coming soon') },
    { i: 'help', t: 'Help & Support', s: 'FAQs and live chat', go: () => notify('Support: help@EduMen.app') },
  ]
  return (
    <div className="pf">
      <div className="pf-banner" />
      <div className="pf-head">
        <button className="pf-av" onClick={() => setSheet('edit')} aria-label="Change profile photo">
          <UserAvatar user={user} size={96} /><span className="pf-cam"><Icon n="camera" size={15} /></span>
        </button>
        <h1 className="pf-name">{user.name}</h1>
        <div className="muted sm pf-mail">{user.email}</div>
        {user.headline && <p className="pf-line">{user.headline}</p>}
        <span className="tag upcoming">{user.role === 'expert' ? 'Expert' : 'Learner'}</span>
        <button className="btn ghost sm" onClick={() => setSheet('edit')}><Icon n="edit" size={15} /> Edit Profile</button>
      </div>

      <div className="stats2">
        <div className="card"><Icon n="bookmark" size={18} /><span className="muted sm">Saved Experts</span><b>{stats.saved} Bookmarked</b></div>
        <div className="card"><Icon n="clock" size={18} /><span className="muted sm">Sessions</span><b>{stats.done} done · {stats.upcoming} next</b></div>
      </div>

      <div className="card credits">
        <div><span className="muted sm">Consultation Credits</span><b>{inr(credits)}</b></div>
        <button className="btn sm" onClick={() => setSheet('top')}><Icon n="plus" size={16} /> Top Up</button>
      </div>

      <div className="sect">Account settings</div>
      <div className="card srows">
        {rows.map((r) => {
          const inner = (<>
            <span className="s-ico"><Icon n={r.i} size={18} /></span>
            <span className="grow"><b>{r.t}</b><span className="muted sm">{r.s}</span></span>
            {r.sw !== undefined ? <Switch on={r.sw} onChange={r.toggle} label={r.t} /> : <Icon n="chev" size={18} />}
          </>)
          return r.sw !== undefined
            ? <div className="srow" key={r.t}>{inner}</div>
            : <button className="srow" key={r.t} onClick={r.go}>{inner}</button>
        })}
      </div>
      <button className="logout" onClick={onLogout}><Icon n="logout" size={18} /> Log out</button>

      {sheet === 'edit' && <EditSheet user={user} notify={notify} onClose={() => setSheet(null)} onSave={(u) => { onUpdate(u); setSheet(null); notify('Profile updated') }} />}
      {sheet === 'top' && <TopUp onClose={() => setSheet(null)} onAdd={onTopUp} />}
    </div>
  )
}
