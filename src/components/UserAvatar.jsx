export const PRESETS = [
  ['🦊', '#FFB4A2'], ['🐼', '#A5D8FF'], ['🦉', '#FFE08A'], ['🐯', '#FFD0A8'],
  ['🐙', '#D9C2FF'], ['🦄', '#FFC9E3'], ['🚀', '#B8F2C9'], ['🌿', '#C5E1A5'],
]
export default function UserAvatar({ user, size = 44 }) {
  const a = user.avatar
  const base = { width: size, height: size, fontSize: size * 0.42 }
  if (a?.type === 'photo') return <div className="av ua" style={base}><img src={a.src} alt="" /></div>
  if (a?.type === 'emoji') return <div className="av ua" style={{ ...base, background: a.bg, fontSize: size * 0.5 }}>{a.e}</div>
  return <div className="av ua" style={{ ...base, background: '#FFD84D' }}>{(user.name[0] || '?').toUpperCase()}</div>
}
