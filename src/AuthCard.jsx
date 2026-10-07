import { useState } from 'react'
import { supabase } from './supabase.js'

export default function AuthCard({ mode, setMode, onAuth, notify }) {
  const su = mode === 'signup'
  const [f, setF] = useState({ name: '', email: '', pw: '', role: 'learner' })
  const [err, setErr] = useState({})
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: '' }) }
  const switchTo = (m) => { setMode(m); setErr({}) }

  const submit = async (e) => {
    e.preventDefault()
    const n = {}
    if (su && f.name.trim().length < 2) n.name = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) n.email = 'Enter a valid email, like you@example.com.'
    if (f.pw.length < 8) n.pw = 'Use at least 8 characters.'
    setErr(n)
    if (Object.keys(n).length) return

    const email = f.email.trim()
    const password = f.pw
    if (!supabase) {
      notify('Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }
    setLoading(true)

    try {
      if (su) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: f.name.trim(),
              requested_account_type: f.role,
            }
          }
        })

        if (error) throw error

        if (!data.session) {
          notify(f.role === 'expert'
            ? 'Account created. Verify your email; expert access requires approval.'
            : 'Account created. Check your email to verify it, then log in.')
          return
        }
        await onAuth(data.user)
        if (f.role === 'expert') notify('Expert access requires approval before you can publish a profile.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        await onAuth(data.user)
      }
    } catch (error) {
      setErr({ pw: error.message || 'Authentication failed.' })
      notify(error.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    const email = f.email.trim()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr({ email: 'Enter your email first to reset password.' })
      return
    }
    
    if (!supabase) {
      notify('Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      notify('Password reset link sent to your email!')
    } catch (error) {
      notify(error.message || 'Could not send the password reset email.')
    }
  }

  const field = (k, label, props) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <div className="inp">
        <input id={k} value={f[k]} onChange={set(k)} aria-invalid={!!err[k]} {...props} />
        {k === 'pw' && <button type="button" className="eye" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>}
      </div>
      {err[k] && <div className="err">{err[k]}</div>}
    </div>
  )

  return (
    <aside className="auth" id="auth" aria-label="Account">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={!su} onClick={() => switchTo('login')}>Log in</button>
        <button role="tab" aria-selected={su} onClick={() => switchTo('signup')}>Sign up</button>
      </div>
      <h2>{su ? 'Create your account' : 'Welcome back'}</h2>
      <p className="sub">{su ? 'Join to book experts or offer your own sessions.' : 'Log in to see your sessions and messages.'}</p>
      <form onSubmit={submit} noValidate>
        {su && (
          <div className="role" role="radiogroup" aria-label="I want to">
            {[['learner', 'Get advice', 'Book experts'], ['expert', 'Give advice', 'Become an expert']].map(([v, t, s]) => (
              <div key={v}><input type="radio" name="role" id={'r-' + v} checked={f.role === v} onChange={() => setF({ ...f, role: v })} /><label htmlFor={'r-' + v}>{t}<small>{s}</small></label></div>
            ))}
          </div>
        )}
        {su && field('name', 'Full name', { autoComplete: 'name', placeholder: 'Aarav Sharma' })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
        {field('pw', 'Password', { type: show ? 'text' : 'password', autoComplete: su ? 'new-password' : 'current-password', placeholder: 'At least 8 characters' })}
        {!su && <div className="row"><label><input type="checkbox" /> Remember me</label><a href="#auth" onClick={handleForgotPassword}>Forgot password?</a></div>}
        <button className="btn block" type="submit" disabled={loading}>
          {loading ? 'Processing...' : (su ? 'Create account' : 'Log in')}
        </button>
      </form>
      <p className="fine">{su ? 'By signing up you agree to the Terms and Privacy Policy.' : 'New here? Use Sign up above. It takes under a minute.'}</p>
    </aside>
  )
}