import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Logo from '../components/Logo'
import RegalLogo from '../assets/regal_logo_stacked_orange.png'
import './Auth.css'

function ResetPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [recoveryMode, setRecoveryMode] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setRecoveryMode(false)
            return
        }

        let active = true

        const checkSession = async () => {
            const { data } = await supabase.auth.getSession()
            if (!active) return
            if (data.session) {
                setRecoveryMode(true)
            }
        }

        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return
            if (event === 'PASSWORD_RECOVERY' || session) {
                setRecoveryMode(true)
            }
            if (event === 'SIGNED_OUT') {
                setRecoveryMode(false)
            }
        })

        return () => {
            active = false
            subscription?.unsubscribe()
        }
    }, [])

    const handleSendReset = async (e) => {
        e.preventDefault()
        if (!isSupabaseConfigured) {
            setError('Supabase is not configured. Password reset is unavailable.')
            return
        }
        setError('')
        setMessage('')
        setSubmitting(true)
        try {
            await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            setMessage('Check your email for a secure link to set a new password.')
        } catch (err) {
            setError(err.message || 'Failed to send reset instructions.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        if (!isSupabaseConfigured) {
            setError('Supabase is not configured. Password reset is unavailable.')
            return
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setError('')
        setMessage('')
        setSubmitting(true)
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
            if (updateError) throw updateError
            setMessage('Password updated! You can now log back in.')
            setNewPassword('')
            setConfirmPassword('')
            await supabase.auth.signOut()
        } catch (err) {
            setError(err.message || 'Failed to update password.')
        } finally {
            setSubmitting(false)
        }
    }

    const renderContent = () => {
        if (!isSupabaseConfigured) {
            return (
                <p className="error-message">
                    Supabase credentials are missing. Configure them to enable password resets.
                </p>
            )
        }

        if (recoveryMode) {
            return (
                <form onSubmit={handleUpdatePassword}>
                    {error && <div className="error-message">{error}</div>}
                    {message && <div className="success-message">{message}</div>}
                    <div className="form-group">
                        <label htmlFor="new-password">New password</label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            minLength={6}
                            required
                            placeholder="Enter new password"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-password">Confirm password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                            required
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button type="submit" className="auth-button" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Password'}
                    </button>
                    <p className="auth-link">
                        <button type="button" onClick={() => navigate('/login')} className="link-button">
                            Back to Login
                        </button>
                    </p>
                </form>
            )
        }

        return (
            <form onSubmit={handleSendReset}>
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}
                <div className="form-group">
                    <label htmlFor="reset-email">Email</label>
                    <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your account email"
                    />
                </div>
                <button type="submit" className="auth-button" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Send Reset Link'}
                </button>
                <p className="auth-link">
                    <button type="button" onClick={() => navigate('/login')} className="link-button">
                        Back to Login
                    </button>
                </p>
            </form>
        )
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <img src={RegalLogo} alt="Regal Logo" className="auth-logo auth-logo-centered" />
                <h1 className="auth-title">Regal Bingo</h1>
                <h2>Password Reset</h2>
                {renderContent()}
            </div>
        </div>
    )
}

export default ResetPassword

