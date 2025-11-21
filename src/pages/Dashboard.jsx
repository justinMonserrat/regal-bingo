import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { BINGO_SQUARES } from '../data/bingoSquares'
import Logo from '../components/Logo'
import useMediaQuery from '../hooks/useMediaQuery'
import { MOBILE_COLUMNS, transposeSquares } from '../utils/boardLayout'
import { getUserSubmissions } from '../lib/submissions'
import './Dashboard.css'

function Dashboard() {
  const { user: authUser, isManager, loading: authLoading, supabaseReady } = useAuth()
  const navigate = useNavigate()
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedProgress, setSelectedProgress] = useState(null)
  const [progressLogs, setProgressLogs] = useState([])
  const [userSubmissions, setUserSubmissions] = useState([])
  const [managerLoading, setManagerLoading] = useState(false)
  const [managerError, setManagerError] = useState('')
  const [visitLocked, setVisitLocked] = useState(false)
  const [lastVisitTime, setLastVisitTime] = useState(null)
  const isWideGrid = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    if (!authLoading && supabaseReady && !isManager) {
      navigate('/')
    }
  }, [authLoading, supabaseReady, isManager, navigate])

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    navigate('/login')
  }

  const goHome = () => {
    navigate('/')
  }

  const resetSelection = () => {
    setSelectedUser(null)
    setSelectedProgress(null)
    setProgressLogs([])
    setUserSubmissions([])
    setVisitLocked(false)
    setLastVisitTime(null)
    setManagerError('')
  }

  const loadLogs = async (userId) => {
    if (!isManager || !userId) return
    const { data, error } = await supabase
      .from('progress_logs')
      .select('id, square_field, action, created_at, manager:manager_id(email)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to load progress logs', error)
      setProgressLogs([])
      return
    }

    const logs = data ?? []
    setProgressLogs(logs)

    const latest = logs[0]
    if (latest?.action === 'check') {
      setVisitLocked(true)
      setLastVisitTime(latest.created_at)
    } else {
      setVisitLocked(false)
      setLastVisitTime(null)
    }
  }

  const loadUserSubmissions = async (userId) => {
    if (!isManager || !userId) return
    try {
      const { data, error } = await supabase
        .from('proof_submissions')
        .select(`
          *,
          reviewed_by_user:users!proof_submissions_reviewed_by_fkey(email)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load user submissions:', error)
        setUserSubmissions([])
        return
      }

      setUserSubmissions(data || [])
    } catch (err) {
      console.error('Error loading user submissions:', err)
      setUserSubmissions([])
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!isManager) return
    if (!isSupabaseConfigured) {
      setManagerError('Supabase is not configured. Managers cannot search until environment variables are set.')
      return
    }

    setManagerError('')
    setManagerLoading(true)
    resetSelection()

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', searchEmail)
        .eq('is_manager', false)
        .single()

      if (userError || !userData) {
        throw new Error('User not found')
      }

      setSelectedUser(userData)

      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userData.id)
        .single()

      if (progressError) throw progressError

      setSelectedProgress(progressData)
      await loadLogs(userData.id)
      await loadUserSubmissions(userData.id)
    } catch (err) {
      setManagerError(err.message || 'Failed to find user')
    } finally {
      setManagerLoading(false)
    }
  }

  const toggleSquare = async (squareField) => {
    if (!isManager || !selectedUser || !selectedProgress || !squareField) return

    const isChecking = !selectedProgress[squareField]
    if (isChecking && visitLocked) {
      setManagerError('Limit 1 tile per visit. Tap "Start Next Visit" once the guest returns.')
      return
    }

    setManagerError('')
    const newValue = !selectedProgress[squareField]

    try {
      const { error } = await supabase
        .from('progress')
        .update({ [squareField]: newValue })
        .eq('user_id', selectedUser.id)

      if (error) throw error

      await supabase
        .from('progress_logs')
        .insert({
          user_id: selectedUser.id,
          manager_id: authUser?.id ?? null,
          square_field: squareField,
          action: isChecking ? 'check' : 'uncheck',
        })

      setSelectedProgress({ ...selectedProgress, [squareField]: newValue })
      await loadLogs(selectedUser.id)

      if (isChecking) {
        setVisitLocked(true)
        setLastVisitTime(new Date().toISOString())
      } else {
        setVisitLocked(false)
        setLastVisitTime(null)
      }
    } catch (err) {
      setManagerError(err.message || 'Failed to update square')
    }
  }

  const handleStartNextVisit = () => {
    setVisitLocked(false)
    setLastVisitTime(null)
    setManagerError('')
  }

  const squareLabelMap = useMemo(() => {
    const map = {}
    BINGO_SQUARES.forEach((square) => {
      if (square.field) {
        map[square.field] = square.label
      }
    })
    return map
  }, [])

  const lastCheckMap = useMemo(() => {
    if (!progressLogs?.length) return {}
    const entries = {}
    progressLogs.forEach((log) => {
      if (!entries[log.square_field]) {
        entries[log.square_field] = log
      }
    })
    return entries
  }, [progressLogs])

  const managedSquares = useMemo(() => {
    const base = BINGO_SQUARES.map((square, index) => {
      const log = square.field ? lastCheckMap[square.field] : null
      return {
        ...square,
        id: square.field || `free-${index}`,
        checked: square.isFree ? true : Boolean(selectedProgress?.[square.field]),
        lastCheckedAt: log?.action === 'check' ? log.created_at : null,
      }
    })

    if (isWideGrid) {
      return transposeSquares(base, MOBILE_COLUMNS)
    }
    return base
  }, [selectedProgress, lastCheckMap, isWideGrid])

  const formatTimestamp = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (!supabaseReady || !isSupabaseConfigured) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Logo />
        </div>
        <div className="bingo-container">
          <h2>Supabase Not Configured</h2>
          <p>Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to enable account features.</p>
        </div>
      </div>
    )
  }

  if (authLoading || !isManager) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <section className="hero-panel">
        <div className="hero-content">
          <button className="hero-logo-button" onClick={goHome} type="button">
            <Logo size={180} />
          </button>
          <div className="hero-copy">
            <h1>Manager Dashboard</h1>
            <p className="hero-description">
              Search guests, update their Regal Bingo cards, and log visits from one place.
            </p>
            <div className="user-pill">
              <div className="user-pill-info">
                <p className="pill-label">Signed in as</p>
                <p className="pill-email">{authUser?.email}</p>
              </div>
              <button onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      </section>

      <section className="manager-content">
        <div className="manager-top-actions">
          <button type="button" className="home-button" onClick={goHome}>
            Home
          </button>
          <button 
            type="button" 
            className="review-submissions-button" 
            onClick={() => navigate('/review-submissions')}
          >
            Review Completions
          </button>
        </div>
        <div className="search-section">
          <div className="manager-tools-header">
            <h2>Manager Tools</h2>
          </div>
          <form onSubmit={handleSearch}>
            <div className="search-group">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Enter guest email"
                required
              />
              <button type="submit" disabled={managerLoading}>
                {managerLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {managerError && <div className="error-message">{managerError}</div>}
          </form>
        </div>

        {selectedUser && selectedProgress && (
          <>
            <div className="visit-rule-banner">
              <div>
                <strong>Visit Rule:</strong> Limit 1 tile checked off per visit. Last check-in{' '}
                {lastVisitTime ? formatTimestamp(lastVisitTime) : '—'}.
              </div>
              <button type="button" onClick={handleStartNextVisit} disabled={!visitLocked}>
                {visitLocked ? 'Start Next Visit' : 'Ready for Next Visit'}
              </button>
            </div>

            <div className="bingo-container">
              <h2>Bingo Board for {selectedUser.email}</h2>
              <div className="bingo-grid">
                {managedSquares.map((square) => {
                  const classes = [
                    'bingo-square',
                    square.checked ? 'checked' : '',
                    square.field ? 'clickable' : 'free',
                  ]

                  return (
                    <div
                      key={square.id}
                      className={classes.join(' ').trim()}
                      onClick={() => toggleSquare(square.field)}
                      role={square.field ? 'button' : 'presentation'}
                      aria-disabled={!square.field}
                    >
                      <div className="square-label">{square.label}</div>
                      {square.checked && <span className="checkmark">✓</span>}
                      {square.lastCheckedAt && (
                        <div className="square-meta">
                          Checked {formatTimestamp(square.lastCheckedAt)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="toggle-hint">
                Click any square to update progress (FREE SPACE is automatic)
              </p>
            </div>

            <div className="manager-actions">
              <button type="button" onClick={resetSelection}>
                Done
              </button>
            </div>

            <div className="user-submissions-section">
              <h3>Task Submissions</h3>
              {userSubmissions.length === 0 ? (
                <p className="submissions-empty">No submissions found for this user.</p>
              ) : (
                <div className="submissions-list">
                  {userSubmissions.map((submission) => (
                    <div key={submission.id} className="submission-item">
                      <div className="submission-header">
                        <span className="submission-task">{submission.task_label}</span>
                        <span className={`submission-status ${submission.status}`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                      <div className="submission-details">
                        <span className="submission-date">
                          Submitted: {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                        {submission.reviewed_at && (
                          <span className="submission-reviewed">
                            Reviewed: {new Date(submission.reviewed_at).toLocaleDateString()}
                            {submission.reviewed_by_user?.email && ` by ${submission.reviewed_by_user.email}`}
                          </span>
                        )}
                      </div>
                      {submission.message && (
                        <div className="submission-message">
                          <strong>Message:</strong> {submission.message}
                        </div>
                      )}
                      {submission.receipt_number && (
                        <div className="submission-receipt">
                          <strong>Receipt #:</strong> {submission.receipt_number}
                        </div>
                      )}
                      {submission.image_url && (
                        <div className="submission-image">
                          <img 
                            src={submission.image_url} 
                            alt="Submission proof"
                            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="visit-log-card">
              <h3>Recent Check-ins</h3>
              {progressLogs.length === 0 ? (
                <p className="visit-log-empty">No visits have been logged yet.</p>
              ) : (
                <ul className="visit-log-list">
                  {progressLogs.map((log) => (
                    <li key={log.id}>
                      <span className="visit-log-time">{formatTimestamp(log.created_at)}</span>
                      <span className="visit-log-detail">
                        {log.action === 'check' ? 'Checked' : 'Unchecked'}{' '}
                        {squareLabelMap[log.square_field] || log.square_field}
                        {log.manager?.email ? ` • ${log.manager.email}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default Dashboard

