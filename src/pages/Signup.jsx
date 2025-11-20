import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { BINGO_SQUARES } from '../data/bingoSquares'
import './Auth.css'

function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable signup.')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // User record and progress are created automatically by database trigger
        // Verify progress record exists (with retry)
        let retries = 0
        while (retries < 5) {
          const { data } = await supabase
            .from('progress')
            .select('id')
            .eq('user_id', authData.user.id)
            .single()

          if (data) {
            navigate('/dashboard')
            return
          }

          await new Promise(resolve => setTimeout(resolve, 200))
          retries++
        }

        // If still not found, try creating manually as fallback
        const progressData = {}
        BINGO_SQUARES.filter((square) => square.field).forEach((square) => {
          progressData[square.field] = false
        })

        await supabase
          .from('progress')
          .insert([
            {
              user_id: authData.user.id,
              ...progressData,
            },
          ])

        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src="/src/assets/regal_logo_stacked_orange.png" alt="Regal Logo" className="auth-logo" />
        <h1 className="auth-title">Regal Bingo</h1>
        <h2>Create Account</h2>
        {!isSupabaseConfigured && (
          <div className="error-message">
            Backend is not configured. Update your .env file with Supabase credentials to enable signup.
          </div>
        )}
        <form onSubmit={handleSignup}>
          {error && <div className="error-message">{error}</div>}
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
              placeholder="Create a password"
              minLength={6}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading || !isSupabaseConfigured}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup

