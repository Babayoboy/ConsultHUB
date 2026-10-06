import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import ExpertCard from '../components/ExpertCard.jsx'
import { CATEGORIES, PILLS, EXPERTS } from '../data.js'

const DEFAULT = { cats: [], min: 100, max: 500, rating: 0 }

export default function Home({ saved, onSave, onBook }) {
  const [q, setQ] = useState('')
  const [f, setF] = useState(DEFAULT)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(DEFAULT)

  const list = useMemo(() => EXPERTS.filter((e) =>
    (!f.cats.length || f.cats.includes(e.cat)) && e.rate >= f.min && e.rate <= f.max && e.rating >= f.rating &&
    (e.name + e.role + e.bio).toLowerCase().includes(q.trim().toLowerCase())), [f, q])

  const active = f.cats.length + (f.min > 100 || f.max < 500 ? 1 : 0) + (f.rating ? 1 : 0)
  const pill = (p) => (p === 'All' ? !f.cats.length : f.cats.length === 1 && f.cats[0] === p)
  const toggle = (c) => setDraft((d) => ({ ...d, cats: d.cats.includes(c) ? d.cats.filter((x) => x !== c) : [...d.cats, c] }))
  const openSheet = () => { setDraft(f); setOpen(true) }
  const reset = () => { setF(DEFAULT); setQ('') }

  return (
    <>
      <div className="searchrow">
        <div className="search">
          <Icon n="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an expert or topic..." aria-label="Search experts" />
        </div>
        <button className="icon-btn big" onClick={openSheet} aria-label="Filters">
          <Icon n="sliders" />{active > 0 && <span className="badge">{active}</span>}
        </button>
      </div>

      <div className="pills" role="group" aria-label="Categories">
        {['All', ...PILLS].map((p) => (
          <button key={p} className="chip pill" aria-pressed={pill(p)} onClick={() => setF({ ...f, cats: p === 'All' ? [] : [p] })}>{p}</button>
        ))}
      </div>

      <div className="sec-h"><h2>Featured Experts</h2><button className="link" onClick={reset}>SEE ALL</button></div>

      {list.length ? (
        <div className="grid">{list.map((e) => <ExpertCard key={e.id} e={e} saved={saved.includes(e.id)} onSave={onSave} onBook={onBook} />)}</div>
      ) : (
        <div className="empty"><p>No experts match your filters.</p><button className="btn sm" onClick={reset}>Clear filters</button></div>
      )}

      {open && (
        <Sheet title="Filters" onClose={() => setOpen(false)} action={<button className="link" onClick={() => setDraft(DEFAULT)}>Reset All</button>}>
          <div className="lbl">Category</div>
          <div className="chips">
            {CATEGORIES.map((c) => <button key={c} className="chip" aria-pressed={draft.cats.includes(c)} onClick={() => toggle(c)}>{c}</button>)}
          </div>

          <div className="lbl">Hourly rate <span className="rng">₹{draft.min} - ₹{draft.max}{draft.max === 500 ? '+' : ''}</span></div>
          <div className="dual">
            <div className="track"><div className="fill" style={{ left: ((draft.min - 100) / 4) + '%', right: (100 - (draft.max - 100) / 4) + '%' }} /></div>
            <input type="range" min="100" max="500" step="10" value={draft.min} aria-label="Minimum rate"
              onChange={(e) => setDraft({ ...draft, min: Math.min(+e.target.value, draft.max - 10) })} />
            <input type="range" min="100" max="500" step="10" value={draft.max} aria-label="Maximum rate"
              onChange={(e) => setDraft({ ...draft, max: Math.max(+e.target.value, draft.min + 10) })} />
          </div>
          <div className="mm">
            <label>Min (₹)<input type="number" readOnly value={draft.min} /></label>
            <label>Max (₹)<input type="number" readOnly value={draft.max} /></label>
          </div>

          <div className="lbl">Minimum rating</div>
          <div className="chips">
            {[[0, 'Any'], [4, '4.0+'], [4.5, '4.5+']].map(([v, l]) => (
              <button key={l} className="chip" aria-pressed={draft.rating === v} onClick={() => setDraft({ ...draft, rating: v })}>{l}{v ? ' ★' : ''}</button>
            ))}
          </div>

          <button className="btn block" style={{ marginTop: 24 }} onClick={() => { setF(draft); setOpen(false) }}>Show Results</button>
        </Sheet>
      )}
    </>
  )
}
