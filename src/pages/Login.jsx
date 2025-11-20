import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import RegalLogo from '../assets/regal_logo_stacked_orange.png'
import './Auth.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable login.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) throw loginError

      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={RegalLogo} alt="Regal Logo" className="auth-logo" />
        <h1 className="auth-title">Regal Bingo</h1>
        <h2>Log In</h2>
        <form onSubmit={handleLogin}>
          {error && <div className="error-message">{error}</div>}
          {!isSupabaseConfigured && (
            <div className="error-message">
              Backend is not configured. Update your .env file with Supabase credentials to enable login.
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading || !isSupabaseConfigured}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="auth-link">
          <Link to="/reset-password">Forgot your password?</Link>
        </p>
        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

export default Login

