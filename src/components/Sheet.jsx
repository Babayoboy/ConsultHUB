import { useEffect } from 'react'
import Icon from './Icon.jsx'
export default function Sheet({ title, onClose, action, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-h">
          <h2>{title}</h2>
          {action}
          <button className="icon-btn sm" onClick={onClose} aria-label="Close"><Icon n="x" size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
