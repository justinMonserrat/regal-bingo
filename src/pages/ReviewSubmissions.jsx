import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getPendingSubmissions, getCompletedSubmissions, reviewSubmission } from '../lib/submissions'
import Footer from '../components/Footer'
import './ReviewSubmissions.css'

function ReviewSubmissions() {
    const { user, isManager, managerResolved } = useAuth()
    const navigate = useNavigate()

    const [submissions, setSubmissions] = useState([])
    const [completedSubmissions, setCompletedSubmissions] = useState([])
    const [activeTab, setActiveTab] = useState('pending')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [processingId, setProcessingId] = useState(null)

    const loadSubmissions = async () => {
        try {
            setLoading(true)
            setError('') // Clear previous errors
            console.log('Loading submissions for manager:', user?.id)

            // Check if user is actually a manager
            const { data: managerCheck, error: managerError } = await supabase
                .from('manager_roles')
                .select('user_id')
                .eq('user_id', user.id)
                .single()

            console.log('Manager role check:', { managerCheck, managerError })

            if (managerError && managerError.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Manager check failed:', managerError)
                setError('Failed to verify manager status.')
                return
            }

            if (!managerCheck) {
                console.log('User is not in manager_roles table')
                setError('You do not have manager permissions.')
                return
            }

            const [pendingData, completedData] = await Promise.all([
                getPendingSubmissions(),
                getCompletedSubmissions()
            ])
            console.log('Loaded pending submissions:', pendingData)
            console.log('Loaded completed submissions:', completedData)
            setSubmissions(pendingData)
            setCompletedSubmissions(completedData)
        } catch (err) {
            console.error('Load submissions error:', {
                message: err.message,
                stack: err.stack,
                error: err
            })
            setError(`Failed to load submissions: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log('ReviewSubmissions useEffect:', { user: !!user, isManager, managerResolved })

        if (!user) {
            navigate('/login')
            return
        }

        // Wait for manager status to be resolved
        if (!managerResolved) {
            console.log('Waiting for manager status to resolve...')
            return
        }

        if (!isManager) {
            console.log('User is not a manager, redirecting to dashboard')
            navigate('/dashboard')
            return
        }

        console.log('User is a manager, loading submissions...')
        loadSubmissions()
    }, [user, isManager, managerResolved, navigate])

    const handleReview = async (submissionId, status) => {
        if (processingId) return // Prevent multiple simultaneous reviews

        try {
            setProcessingId(submissionId)
            setError('')

            await reviewSubmission(submissionId, status, user.id)

            // Remove the reviewed submission from the list
            setSubmissions(prev => prev.filter(sub => sub.id !== submissionId))

        } catch (err) {
            setError(err.message || `Failed to ${status} submission. Please try again.`)
            console.error('Review error:', err)
        } finally {
            setProcessingId(null)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTimeRemaining = (expiresAt) => {
        const now = new Date()
        const expires = new Date(expiresAt)
        const diffMs = expires - now

        if (diffMs <= 0) return 'Expired'

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        if (days > 0) {
            return `${days}d ${hours}h remaining`
        } else {
            return `${hours}h remaining`
        }
    }

    console.log('ReviewSubmissions render:', {
        user: !!user,
        isManager,
        managerResolved,
        loading,
        submissionsCount: submissions.length
    })

    if (!user || !managerResolved) return null

    return (
        <div className="review-submissions-container">
            <div className="review-submissions-header">
                <h1>Review Task Completions</h1>
            </div>

            <div className="back-button-container">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="back-button orange"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="review-tabs">
                <button
                    className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Reviews ({submissions.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed Reviews ({completedSubmissions.length})
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div className="loading-message">Loading submissions...</div>
            ) : activeTab === 'pending' ? (
                submissions.length === 0 ? (
                    <div className="no-submissions">
                        <h2>No Pending Reviews</h2>
                        <p>All caught up! There are no task completions waiting for review.</p>
                    </div>
                ) : (
                    <div className="submissions-grid">
                        {submissions.map((submission) => (
                            <div key={submission.id} className="submission-card">
                                <div className="submission-header">
                                    <h3>{submission.task_label}</h3>
                                    <span className="submission-date">
                                        {formatDate(submission.created_at)}
                                    </span>
                                </div>

                                <div className="submission-user">
                                    <strong>User:</strong> {submission.users.email}
                                </div>

                                {submission.receipt_number && (
                                    <div className="submission-receipt">
                                        <strong>Receipt #:</strong> {submission.receipt_number}
                                    </div>
                                )}

                                {submission.message && (
                                    <div className="submission-message">
                                        <strong>Message:</strong>
                                        <p>{submission.message}</p>
                                    </div>
                                )}

                                <div className="submission-image">
                                    <img
                                        src={submission.image_url}
                                        alt="Proof submission"
                                        className="proof-image"
                                        loading="lazy"
                                    />
                                </div>

                                <div className="submission-expiry">
                                    <span className={`expiry-time ${getTimeRemaining(submission.expires_at).includes('Expired') ? 'expired' : ''}`}>
                                        {getTimeRemaining(submission.expires_at)}
                                    </span>
                                </div>

                                <div className="submission-actions">
                                    <button
                                        onClick={() => handleReview(submission.id, 'rejected')}
                                        disabled={processingId === submission.id}
                                        className="reject-button"
                                    >
                                        {processingId === submission.id ? 'Processing...' : 'Reject'}
                                    </button>
                                    <button
                                        onClick={() => handleReview(submission.id, 'approved')}
                                        disabled={processingId === submission.id}
                                        className="approve-button"
                                    >
                                        {processingId === submission.id ? 'Processing...' : 'Approve'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                // Completed submissions tab
                completedSubmissions.length === 0 ? (
                    <div className="no-submissions">
                        <h2>No Completed Reviews</h2>
                        <p>No reviews have been completed yet.</p>
                    </div>
                ) : (
                    <div className="submissions-grid">
                        {completedSubmissions.map((submission) => (
                            <div key={submission.id} className="submission-card completed">
                                <div className="submission-header">
                                    <div className="user-info">
                                        <strong>{submission.users?.email || 'Unknown User'}</strong>
                                        <span className="submission-date">
                                            Submitted: {new Date(submission.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="review-date">
                                            Reviewed: {new Date(submission.reviewed_at).toLocaleDateString()}
                                        </span>
                                        {submission.reviewed_by_user?.email && (
                                            <span className="reviewer">
                                                By: {submission.reviewed_by_user.email}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`status-badge ${submission.status}`}>
                                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                    </div>
                                </div>

                                <div className="submission-content">
                                    <div className="submission-details">
                                        <div className="task-info">
                                            <strong>Challenge:</strong> {submission.task_label}
                                        </div>
                                        {submission.message && (
                                            <div className="message">
                                                <strong>Message:</strong> {submission.message}
                                            </div>
                                        )}
                                        {submission.receipt_number && (
                                            <div className="receipt-number">
                                                <strong>Receipt #:</strong> {submission.receipt_number}
                                            </div>
                                        )}
                                    </div>

                                    <div className="image-preview">
                                        <img
                                            src={submission.image_url}
                                            alt="Submission proof"
                                            onError={(e) => {
                                                e.target.style.display = 'none'
                                                e.target.nextSibling.style.display = 'block'
                                            }}
                                        />
                                        <div className="image-error" style={{ display: 'none' }}>
                                            Image not available
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'pending' && submissions.length > 0 && (
                <div className="submissions-summary">
                    <p>{submissions.length} submission{submissions.length !== 1 ? 's' : ''} pending review</p>
                </div>
            )}

            {activeTab === 'completed' && completedSubmissions.length > 0 && (
                <div className="submissions-summary">
                    <p>{completedSubmissions.length} completed review{completedSubmissions.length !== 1 ? 's' : ''}</p>
                </div>
            )}

            <Footer />
        </div>
    )
}

export default ReviewSubmissions
