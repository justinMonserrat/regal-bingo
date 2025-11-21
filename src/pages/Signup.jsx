import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import RegalLogo from '../assets/regal_logo_stacked_orange.png'
import { BINGO_SQUARES } from '../data/bingoSquares'
import './Auth.css'

function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
        // Check if email confirmation is required
        if (authData.user && !authData.session) {
          // Email confirmation required - show confirmation message
          setShowConfirmation(true)
          return
        }

        // User is immediately logged in (no email confirmation required)
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

  // Show email confirmation message after successful signup
  if (showConfirmation) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <img src={RegalLogo} alt="Regal Logo" className="auth-logo" />
          <h1 className="auth-title">Regal Bingo</h1>
          <h2>Check Your Email</h2>
          <div className="confirmation-message">
            <p style={{ color: '#dcdcdc', textAlign: 'center', marginBottom: '20px' }}>
              We've sent a confirmation email to:
            </p>
            <p style={{ color: '#ff6900', textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
              {email}
            </p>
            <p style={{ color: '#dcdcdc', textAlign: 'center', marginBottom: '20px' }}>
              Please click the link in the email to verify your account and start playing Regal Bingo!
            </p>
            <p style={{ color: '#999', textAlign: 'center', fontSize: '14px' }}>
              Don't see the email? Check your spam folder or{' '}
              <button 
                onClick={() => setShowConfirmation(false)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#ff6900', 
                  textDecoration: 'underline', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                try again
              </button>
            </p>
          </div>
          <button 
            className="auth-button" 
            onClick={() => navigate('/login')}
            style={{ marginTop: '20px' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <img src={RegalLogo} alt="Regal Logo" className="auth-logo" />
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
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a password"
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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

