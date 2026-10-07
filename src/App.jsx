import { useCallback, useEffect, useRef, useState } from 'react'
import Landing from './Landing.jsx'
import Shell from './Shell.jsx'
import Toast from './components/Toast.jsx'
import { useTheme } from './hooks.js'
import { supabase } from './supabase.js'

const fromAuthUser = (authUser) => ({
  id: authUser.id,
  name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Member',
  email: authUser.email || '',
  role: 'learner',
})

export default function App() {
  const theme = useTheme()
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(!!supabase)
  const [msg, setMsg] = useState('')
  const timer = useRef()
  const notify = useCallback((m) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(''), 2600) }, [])

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) notify(`Could not restore your session: ${error.message}`)
      if (data.session?.user) setUser(fromAuthUser(data.session.user))
      setCheckingSession(false)
    }).catch((error) => {
      if (!active) return
      notify(`Could not restore your session: ${error.message}`)
      setCheckingSession(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setUser(null)
      else if (session?.user) {
        const next = fromAuthUser(session.user)
        setUser((current) => current?.id === next.id
          ? { ...current, ...next, name: current.name, role: current.role, headline: current.headline, avatar: current.avatar }
          : next)
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [notify])

  const login = async (authUser) => {
    setUser(fromAuthUser(authUser))
    window.scrollTo(0, 0)
    notify('Welcome back')
  }
  const update = (u) => setUser(u)
  const logout = async () => {
    if (!supabase) return
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        notify(`Could not log out: ${error.message}`)
        return
      }
      setUser(null)
      notify('Logged out')
    } catch (error) {
      notify(`Could not log out: ${error.message || 'Network request failed.'}`)
      return
    }
  }

  return (
    <>
      {checkingSession
        ? <main className="wrap" aria-live="polite">Restoring your session…</main>
        : user
          ? <Shell user={user} theme={theme} notify={notify} onLogout={logout} onUpdate={update} />
          : <Landing theme={theme} notify={notify} onAuth={login} />}
      <Toast msg={msg} />
    </>
  )
}
