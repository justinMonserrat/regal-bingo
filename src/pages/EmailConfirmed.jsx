import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import './Auth.css'

function EmailConfirmed() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('confirming')

  useEffect(() => {
    let active = true
    const checkSession = async () => {
      if (!supabase) {
        if (active) setStatus('unconfigured')
        return
      }
      try {
        const { data } = await supabase.auth.getSession()
        if (!active) return
        if (data.session) {
          setStatus('confirmed')
        } else {
          setStatus('unknown')
        }
      } catch (error) {
        console.error('Unable to verify session', error)
        if (active) setStatus('error')
      }
    }
    checkSession()
    return () => {
      active = false
    }
  }, [])

  const handleContinue = () => {
    navigate('/')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Logo size={120} />
        <h1 className="auth-title">Regal Bingo</h1>
        <h2>Email Confirmation</h2>
        {status === 'confirming' && (
          <p style={{ color: '#dcdcdc', textAlign: 'center' }}>
            Finalizing your account&hellip;
          </p>
        )}
        {status === 'confirmed' && (
          <>
            <p style={{ color: '#dcdcdc', textAlign: 'center' }}>
              Your email has been confirmed. You can now access your account and continue earning tiles.
            </p>
            <button className="auth-button" onClick={handleContinue}>
              Go to Home
            </button>
          </>
        )}
        {status === 'unknown' && (
          <>
            <p className="error-message">
              We weren't able to verify your confirmation status automatically.
            </p>
            <button className="auth-button" onClick={() => navigate('/login')}>
              Return to Login
            </button>
          </>
        )}
        {status === 'unconfigured' && (
          <p className="error-message">
            Supabase credentials are missing. Please configure your project before using email confirmation.
          </p>
        )}
        {status === 'error' && (
          <p className="error-message">
            Something went wrong while verifying your confirmation. Please try again or contact support.
          </p>
        )}
      </div>
    </div>
  )
}

export default EmailConfirmed

