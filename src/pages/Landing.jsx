import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BINGO_SQUARES } from '../data/bingoSquares'
import { TILE_RULES } from '../data/rules'
import Logo from '../components/Logo'
import Footer from '../components/Footer'
import useMediaQuery from '../hooks/useMediaQuery'
import { MOBILE_COLUMNS, transposeSquares } from '../utils/boardLayout'
import './Dashboard.css'
import './Landing.css'

function Landing({ user, isManager, isSupabaseConfigured }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(null)
  const [boardLoading, setBoardLoading] = useState(false)
  const isWideGrid = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    let active = true

    const loadProgress = async () => {
      if (!isSupabaseConfigured || !user || isManager) {
        setProgress(null)
        return
      }

      setBoardLoading(true)
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error('Error loading progress', error)
        setProgress(null)
      } else {
        setProgress(data ?? null)
      }

      setBoardLoading(false)
    }

    loadProgress()

    return () => {
      active = false
    }
  }, [user, isManager, isSupabaseConfigured])

  const baseSquares = useMemo(() => BINGO_SQUARES.map((square, index) => ({
    ...square,
    id: square.field || `free-${index}`,
    checked: square.isFree ? true : Boolean(progress?.[square.field]),
  })), [progress])

  const squares = useMemo(() => {
    if (isWideGrid) {
      return transposeSquares(baseSquares, MOBILE_COLUMNS)
    }
    return baseSquares
  }, [baseSquares, isWideGrid])

  const rowPrize = isWideGrid
    ? {
      title: 'Complete One Row',
      description: 'Complete any row of five squares to earn 5,000 Regal Crown Club points.',
      points: '5,000 pts',
    }
    : {
      title: 'Complete One Row',
      description: 'Complete any row of three squares to earn 5,000 Regal Crown Club points.',
      points: '5,000 pts',
    }

  const columnPrize = isWideGrid
    ? {
      title: 'Complete One Column',
      description: 'Complete any column of three squares to earn 10,000 Regal Crown Club points.',
      points: '10,000 pts',
    }
    : {
      title: 'Complete One Column',
      description: 'Complete any column of five squares to earn 10,000 Regal Crown Club points.',
      points: '10,000 pts',
    }

  return (
    <div className="landing-page">
      <header className="landing-hero">
        <div className="landing-logo-wrapper">
          <Logo size={220} />
        </div>
        <div className="hero-text">
          <h1>Regal Bingo</h1>
          <p className="season-tag">December Promotion</p>
          {user ? (
            isManager ? (
              <p className="hero-subtext">
                You're signed in as a manager.<br />Head to the manager dashboard to update guest progress.
              </p>
            ) : (
              <p className="hero-subtext">
                Welcome back, {user.email}!<br /><br />Complete challenges to earn RCC points!
              </p>
            )
          ) : (
            <p className="hero-subtext">
              Complete exciting movie theater challenges throughout December to earn valuable Regal Crown Club points and exclusive rewards.
            </p>
          )}
          <div className="hero-actions">
            {user ? (
              isManager ? (
                <button className="primary" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    className="primary"
                    onClick={() => navigate('/upload-proof')}
                  >
                    Submit Challenge
                  </button>
                  <button
                    className="secondary"
                    onClick={async () => {
                      if (isSupabaseConfigured) {
                        await supabase.auth.signOut()
                      }
                      navigate('/login')
                    }}
                  >
                    Log Out
                  </button>
                </>
              )
            ) : (
              <>
                <button className="primary" onClick={() => navigate('/signup')}>
                  Create Account
                </button>
                <button className="secondary" onClick={() => navigate('/login')}>
                  Customer Login
                </button>
              </>
            )}
          </div>
          <div className="rules-callout">
            <h3 style={{ textAlign: 'center' }}>Quick Rules</h3>
            <ul>
              {TILE_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                onClick={() => navigate('/faq')}
                style={{
                  background: 'transparent',
                  border: '2px solid #ff6900',
                  color: '#ff6900',
                  padding: '0.5rem 1rem',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#ff6900'
                  e.target.style.color = '#000000'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.color = '#ff6900'
                }}
              >
                View Full FAQ
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="landing-board">
        <div className="bingo-container">
          <div className="section-header">
            <h2>Your Bingo Card</h2>
            {boardLoading && <span className="loading-pill">Syncing progress…</span>}
          </div>
          <div className="bingo-grid">
            {squares.map((square) => (
              <div
                key={square.id}
                className={`bingo-square ${square.checked ? 'checked' : ''} ${square.isFree ? 'free' : ''}`}
              >
                <div className="square-label">{square.label}</div>
                {square.checked && <span className="checkmark">✓</span>}
              </div>
            ))}
          </div>
          <p className="board-note">
            Submit documentation for completed challenges - limit one challenge per visit. See FAQ for complete rules and restrictions.
          </p>
        </div>

      </section>

      <section className="landing-prizes">
        <h2>RCC Point Rewards</h2>
        <div className="prize-cards">
          <div className="prize-card">
            <div className="points">{rowPrize.points}</div>
            <p><strong>{rowPrize.title}</strong></p>
            <p>{rowPrize.description}</p>
          </div>
          <div className="prize-card">
            <div className="points">{columnPrize.points}</div>
            <p><strong>{columnPrize.title}</strong></p>
            <p>{columnPrize.description}</p>
          </div>
          <div className="prize-card">
            <div className="points">10,000 pts</div>
            <p><strong>Complete Full Card</strong></p>
            <p>Complete the entire bingo card to earn a bonus 10,000 RCC points (25,000 total).</p>
          </div>
        </div>
        <p className="prize-note">Points will be added to your RCC account after review. See FAQ for complete details and restrictions.</p>
      </section>

      <Footer />
    </div>
  )
}

export default Landing

