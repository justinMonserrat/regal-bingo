import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BINGO_SQUARES } from '../data/bingoSquares'
import { uploadProofImage, submitProof, hasExistingSubmission } from '../lib/submissions'
import Footer from '../components/Footer'
import './UploadProof.css'

function UploadProof() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedTask, setSelectedTask] = useState('')
  const [message, setMessage] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Get available tasks (excluding free space)
  const availableTasks = BINGO_SQUARES.filter(square => square.field !== null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    setError('')

    if (!file) {
      setSelectedFile(null)
      setPreviewUrl('')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size too large. Please upload an image smaller than 5MB.')
      return
    }

    setSelectedFile(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedTask || !selectedFile) {
      setError('Please select a task and upload an image.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Check if user already has a submission for this task
      const existing = await hasExistingSubmission(null, selectedTask)
      if (existing) {
        if (existing.status === 'approved') {
          setError('You have already completed this challenge.')
        } else if (existing.status === 'pending') {
          setError('You already have a pending submission for this challenge.')
        }
        return
      }

      // Upload image
      const { url: imageUrl, path: imagePath } = await uploadProofImage(selectedFile, user.id)

      // Get task label
      const taskSquare = availableTasks.find(square => square.field === selectedTask)
      const taskLabel = taskSquare ? taskSquare.label : selectedTask

      // Submit proof
      await submitProof({
        taskField: selectedTask,
        taskLabel,
        message: message.trim() || null,
        receiptNumber: receiptNumber.trim() || null,
        imageUrl,
        imagePath
      })

      setSuccess('Challenge completion submitted successfully! Our team will review your submission within 3-5 days. You will receive an email notification when points are added to your RCC account.')

      // Reset form
      setSelectedTask('')
      setMessage('')
      setReceiptNumber('')
      setSelectedFile(null)
      setPreviewUrl('')

      // Redirect after success
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (err) {
      setError(err.message || 'Failed to submit proof. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!user) return null

  return (
    <div className="upload-proof-container">
      <div className="upload-proof-card">
        <h1>Submit Task Completion</h1>
        <p className="upload-proof-description">
          Upload a receipt or photo as verification.
          <br />
          <br />
          <strong>Important:</strong> Submit within 3-5 days of completion. Only one challenge per visit.
        </p>

        <form onSubmit={handleSubmit} className="upload-proof-form">
          <div className="form-group">
            <label htmlFor="task">Select Challenge *</label>
            <select
              id="task"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              required
              className="task-select"
            >
              <option value="">Choose a bingo challenge...</option>
              {availableTasks.map((square) => (
                <option key={square.field} value={square.field}>
                  {square.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="receipt">Receipt Number (Optional)</label>
            <input
              id="receipt"
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Enter receipt number if applicable"
              className="receipt-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message (Optional)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any additional details or notes..."
              rows={3}
              className="message-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Upload Documentation *</label>
            <input
              id="image"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              required
              className="file-input"
            />
            <p className="file-help">
              Accepted formats: JPEG, PNG, WebP. Maximum file size: 5MB.
            </p>
          </div>

          {previewUrl && (
            <div className="image-preview">
              <label>Preview:</label>
              <img src={previewUrl} alt="Proof preview" className="preview-image" />
            </div>
          )}

          {/* Messages positioned above buttons for visibility */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !selectedTask || !selectedFile}
            >
              {loading ? 'Processing...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  )
}

export default UploadProof
