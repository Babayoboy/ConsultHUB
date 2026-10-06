import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import { EXPERTS, chatTime } from '../data.js'

export default function Messages({ threads, openId, setOpenId, onOpen, onSend, typing }) {
  const [text, setText] = useState('')
  const [box, setBox] = useState(null)
  const end = useRef(), ta = useRef()
  const th = threads.find((t) => t.id === openId)

  // Mobile: lock page scroll behind the chat and follow the on-screen keyboard
  useEffect(() => {
    if (!th) return
    const small = () => window.innerWidth < 900
    const prev = document.body.style.overflow
    if (small()) document.body.style.overflow = 'hidden'
    const vv = window.visualViewport
    const fit = () => setBox(vv && small() ? { top: vv.offsetTop, height: vv.height } : null)
    fit(); vv?.addEventListener('resize', fit); vv?.addEventListener('scroll', fit)
    return () => { document.body.style.overflow = prev; vv?.removeEventListener('resize', fit); vv?.removeEventListener('scroll', fit) }
  }, [!!th])

  useLayoutEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [th?.msgs.length, openId, typing[openId], box?.height])

  const grow = () => { const el = ta.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 110) + 'px' }
  const send = (e) => {
    e?.preventDefault()
    const v = text.trim(); if (!v) return
    onSend(openId, v); setText('')
    requestAnimationFrame(() => { grow(); ta.current?.focus() })
  }
  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer:fine)').matches) send(e) }

  if (th) {
    const ex = EXPERTS.find((x) => x.id === th.expertId)
    return (
      <div className="chat" style={box ? { top: box.top, height: box.height } : undefined}>
        <div className="chat-h">
          <button className="icon-btn sm" onClick={() => setOpenId(null)} aria-label="Back to messages"><Icon n="back" size={18} /></button>
          <Avatar expert={ex} size={38} />
          <div className="grow"><b className="clip">{ex.name}</b><div className="muted sm">{typing[th.id] ? 'typing…' : ex.online ? 'Online' : 'Offline'}</div></div>
        </div>
        <div className="chat-body">
          {th.msgs.map((m, i) => (
            <div key={i} className={'bub' + (m.me ? ' me' : '') + (th.msgs[i - 1]?.me === m.me ? ' cont' : '')}>
              {m.t}<span className="bt">{chatTime(m.ts)}</span>
            </div>
          ))}
          {typing[th.id] && <div className="bub typ" aria-label="Typing"><i /><i /><i /></div>}
          <div ref={end} />
        </div>
        <form className="chat-in" onSubmit={send}>
          <textarea ref={ta} rows={1} value={text} onChange={(e) => { setText(e.target.value); grow() }} onKeyDown={onKey} placeholder="Write a message" aria-label="Message" enterKeyHint="send" />
          <button className="send" disabled={!text.trim()} aria-label="Send"><Icon n="send" size={18} /></button>
        </form>
      </div>
    )
  }

  return (
    <>
      <h1 className="page-t">Messages</h1>
      <div className="list">
        {[...threads].sort((a, b) => b.msgs.at(-1).ts - a.msgs.at(-1).ts).map((t) => {
          const ex = EXPERTS.find((x) => x.id === t.expertId), last = t.msgs[t.msgs.length - 1]
          return (
            <button className={'row-item' + (t.unread ? ' unr' : '')} key={t.id} onClick={() => onOpen(t.id)}>
              <Avatar expert={ex} />
              <div className="grow"><b>{ex.name}</b><div className="muted sm clip">{last.me ? 'You: ' : ''}{last.t}</div></div>
              <div className="meta"><span className="muted sm">{chatTime(last.ts)}</span>{t.unread > 0 && <span className="cnt" aria-label={t.unread + ' unread'}>{t.unread}</span>}</div>
            </button>
          )
        })}
      </div>
    </>
  )
}
