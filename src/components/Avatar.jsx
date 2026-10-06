import { initials } from '../data.js'
export default function Avatar({ expert, size = 48 }) {
  return (
    <div className={'av' + (expert.online ? ' on' : '')} style={{ background: expert.color, width: size, height: size, fontSize: size * 0.36 }}>
      {initials(expert.name)}
    </div>
  )
}
