import { useEffect, useState } from 'react'
export const askNotifPermission = () => { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission() } catch (e) {} }
export function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('ch-theme') } catch (e) { return null } })
  useEffect(() => {
    if (!theme) return
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'dark' ? '#0E1120' : '#4338CA')
    try { localStorage.setItem('ch-theme', theme) } catch (e) {}
  }, [theme])
  const isDark = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') }
}
