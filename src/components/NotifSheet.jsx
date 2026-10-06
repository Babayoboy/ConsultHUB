import Sheet from './Sheet.jsx'
import Icon from './Icon.jsx'
import { askNotifPermission } from '../hooks.js'

const ICO = { meeting: 'video', message: 'chat', match: 'star', pay: 'card' }
const ago = (ts) => { const m = Math.floor((Date.now() - ts) / 60000); return m < 1 ? 'now' : m < 60 ? m + 'm' : Math.floor(m / 60) + 'h' }

export default function NotifSheet({ items, onOpen, onReadAll, onClose }) {
  const canAsk = 'Notification' in window && Notification.permission === 'default'
  return (
    <Sheet title="Notifications" onClose={onClose} action={items.some((n) => !n.read) && <button className="link" onClick={onReadAll}>Mark all read</button>}>
      {canAsk && <button className="btn ghost sm block" style={{ marginBottom: 12 }} onClick={() => { askNotifPermission(); onClose() }}><Icon n="bell" size={16} /> Allow alerts on this device</button>}
      {items.length === 0 && <div className="empty"><p>You're all caught up.</p></div>}
      <div className="nlist">
        {items.map((n) => (
          <button key={n.id} className={'nitem' + (n.read ? '' : ' unr')} onClick={() => onOpen(n)}>
            <span className={'nico ' + n.kind}><Icon n={ICO[n.kind] || 'bell'} size={17} /></span>
            <span className="grow"><b>{n.title}</b><span className="muted sm">{n.body}</span></span>
            <span className="muted sm">{ago(n.ts)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
