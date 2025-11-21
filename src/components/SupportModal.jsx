import { useState } from 'react'
import { sendSupportRequest } from '../lib/emailService'
import './SupportModal.css'

function SupportModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!message.trim()) {
      setSubmitMessage('Please enter your message.')
      return
    }

    setIsSubmitting(true)
    setSubmitMessage('')
    
    try {
      await sendSupportRequest({
        subject: subject.trim() || 'Regal Bingo Support Request',
        message: message,
        userEmail: userEmail || null
      })
      
      // Show success message
      setSubmitMessage('Thank you! Your support request has been sent successfully. We will get back to you soon.')
      
      // Reset form after delay
      setTimeout(() => {
        setSubject('')
        setMessage('')
        setUserEmail('')
        setSubmitMessage('')
        onClose()
        setIsSubmitting(false)
      }, 2500)
      
    } catch (error) {
      setSubmitMessage('Failed to send support request. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSubject('')
      setMessage('')
      setUserEmail('')
      setSubmitMessage('')
      setIsSubmitting(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="support-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Contact Support</h3>
          <button 
            onClick={handleClose}
            className="close-button"
            aria-label="Close"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="support-form">
          <div className="form-group">
            <label htmlFor="support-email">
              Your email *
            </label>
            <input
              id="support-email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="email-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="support-subject">
              Subject (optional)
            </label>
            <input
              id="support-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your inquiry"
              className="subject-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="support-message">
              Message *
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe your question or issue in detail..."
              rows={5}
              required
              className="message-textarea"
            />
          </div>

          {submitMessage && (
            <div className={`submit-message ${submitMessage.includes('Thank you') ? 'success' : 'error'}`}>
              {submitMessage}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
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
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SupportModal
