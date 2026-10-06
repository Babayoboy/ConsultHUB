import ExpertCard from '../components/ExpertCard.jsx'
import { EXPERTS } from '../data.js'
export default function Saved({ saved, onSave, onBook, goHome }) {
  const list = EXPERTS.filter((e) => saved.includes(e.id))
  return (
    <>
      <h1 className="page-t">Saved</h1>
      {list.length ? (
        <div className="grid">{list.map((e) => <ExpertCard key={e.id} e={e} saved onSave={onSave} onBook={onBook} />)}</div>
      ) : (
        <div className="empty"><p>Tap the bookmark on an expert to keep them here.</p><button className="btn sm" onClick={goHome}>Find experts</button></div>
      )}
    </>
  )
}
