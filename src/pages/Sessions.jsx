import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import Avatar from '../components/Avatar.jsx'
import SlotPicker from '../components/SlotPicker.jsx'
import { EXPERTS, fmtLeft } from '../data.js'

const TABS = ['upcoming', 'completed', 'cancelled']

export default function Sessions({ sessions, setSessions, onResched, notify }) {
  const [tab, setTab] = useState('upcoming')
  const [resch, setResch] = useState(null)
  const [v, setV] = useState({ day: null, time: null })
  const list = sessions.filter((s) => s.status === tab)

  const update = (id, patch) => setSessions((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const save = () => {
    onResched(resch.id, v)
    setResch(null); notify('Session rescheduled')
  }

  return (
    <>
      <h1 className="page-t">My Sessions</h1>
      <div className="seg" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className="chip pill" aria-pressed={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>

      {list.length === 0 && <div className="empty"><p>No {tab} sessions yet.</p></div>}
      <div className="grid">
        {list.map((s) => {
          const e = EXPERTS.find((x) => x.id === s.expertId)
          return (
            <article className="ses" key={s.id}>
              <div className="ses-top">
                <div>
                  <span className={'tag ' + (s.soon ? 'red' : s.status)}>{s.soon ? (s.left > 0 ? 'Starts in ' + fmtLeft(s.left) : 'In progress') : s.status === 'completed' ? '✓ Completed' : s.status === 'cancelled' ? 'Cancelled' : 'Upcoming'}</span>
                  <h3>{s.title}</h3>
                  <p className="muted sm">with {e.name}</p>
                </div>
                <Avatar expert={e} size={44} />
              </div>
              <div className="ses-info"><span><Icon n="calendar" size={15} /> {s.when}</span><span><Icon n="clock" size={15} /> {s.mins} Min</span></div>
              {s.status === 'upcoming' && (
                <div className="ses-act">
                  <button className="btn ghost sm" onClick={() => { setV({ day: null, time: null }); setResch(s) }}>Reschedule</button>
                  <button className="btn sm" disabled={!s.soon} onClick={() => notify('Joining call with ' + e.name + '...')}><Icon n="video" size={16} /> Join Call</button>
                  <button className="link danger" onClick={() => { update(s.id, { status: 'cancelled' }); notify('Session cancelled') }}>Cancel</button>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {resch && (
        <Sheet title="Reschedule" onClose={() => setResch(null)}>
          <p className="muted" style={{ margin: 0 }}>{resch.title}</p>
          <SlotPicker value={v} onChange={setV} />
          <button className="btn block" style={{ marginTop: 22 }} disabled={!v.day || !v.time} onClick={save}>Save new time</button>
        </Sheet>
      )}
    </>
  )
}
