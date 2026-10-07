export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="mark">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6D5BFF" /><stop offset="1" stopColor="#4338CA" /></linearGradient></defs>
      <rect width="32" height="32" rx="9" fill="url(#lg)" />
      <path d="M22.5 11.2A7.6 7.6 0 1 0 22.5 20.8" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="21.2" cy="16" r="2.7" fill="#FFD84D" />
    </svg>
  )
}
export default function Logo({ as: T = 'div', ...p }) {
  return <T className="logo" {...p}><LogoMark />EduMen</T>
}
