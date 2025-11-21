import { useState } from 'react'
import { sendBugReport } from '../lib/emailService'
import './Footer.css'

function Footer() {
  const [showBugReport, setShowBugReport] = useState(false)
  const [bugDescription, setBugDescription] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleSubmitBugReport = async (e) => {
    e.preventDefault()
    
    if (!bugDescription.trim()) {
      setSubmitMessage('Please describe the issue you encountered.')
      return
    }

    setIsSubmitting(true)
    setSubmitMessage('')
    
    try {
      await sendBugReport({
        description: bugDescription,
        userEmail: userEmail || null,
        browserInfo: navigator.userAgent,
        url: window.location.href
      })
      
      // Show success message
      setSubmitMessage('Thank you! Your bug report has been sent successfully.')
      
      // Reset form after delay
      setTimeout(() => {
        setBugDescription('')
        setUserEmail('')
        setSubmitMessage('')
        setShowBugReport(false)
        setIsSubmitting(false)
      }, 2000)
      
    } catch (error) {
      setSubmitMessage('Failed to send bug report. Please try again or contact support directly.')
      setIsSubmitting(false)
    }
  }

  const closeBugReport = () => {
    setShowBugReport(false)
    setBugDescription('')
    setUserEmail('')
    setSubmitMessage('')
    setIsSubmitting(false)
  }

  return (
    <>
      <footer className="site-footer">
        <div className="footer-content">
          <p className="footer-text">
            © 2024 Regal Bingo • December Promotion
          </p>
          <button 
            onClick={() => setShowBugReport(true)}
            className="bug-report-button"
          >
            Report a Bug
          </button>
        </div>
      </footer>

      {/* Bug Report Modal */}
      {showBugReport && (
        <div className="modal-overlay" onClick={closeBugReport}>
          <div className="bug-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report a Bug</h3>
              <button 
                onClick={closeBugReport}
                className="close-button"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitBugReport} className="bug-report-form">
              <div className="form-group">
                <label htmlFor="bug-description">
                  Describe the issue you encountered *
                </label>
                <textarea
                  id="bug-description"
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  placeholder="Please provide details about what went wrong, what you were trying to do, and any error messages you saw..."
                  rows={5}
                  required
                  className="bug-textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="user-email">
                  Your email (optional)
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="email-input"
                />
                <p className="help-text">
                  Providing your email helps us follow up if we need more information.
                </p>
              </div>

              {submitMessage && (
                <div className={`submit-message ${submitMessage.includes('Thank you') ? 'success' : 'error'}`}>
                  {submitMessage}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeBugReport}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Footer
