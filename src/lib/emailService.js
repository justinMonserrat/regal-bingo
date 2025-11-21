// Email service using Netlify Forms
export async function sendBugReport({ description, userEmail, browserInfo, url }) {
  try {
    const formData = new FormData()
    formData.append('form-name', 'bug-report')
    formData.append('description', description)
    formData.append('userEmail', userEmail || 'Not provided')
    formData.append('browserInfo', browserInfo)
    formData.append('url', url)
    formData.append('timestamp', new Date().toLocaleString())

    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    })

    if (!response.ok) {
      throw new Error('Failed to send bug report')
    }

    return { success: true }
  } catch (error) {
    console.error('Bug report error:', error)
    throw new Error('Failed to send bug report. Please try again.')
  }
}

export async function sendSupportRequest({ subject, message, userEmail }) {
  try {
    const formData = new FormData()
    formData.append('form-name', 'support-request')
    formData.append('subject', subject || 'Regal Bingo Support Request')
    formData.append('message', message)
    formData.append('userEmail', userEmail || 'Not provided')
    formData.append('timestamp', new Date().toLocaleString())

    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    })

    if (!response.ok) {
      throw new Error('Failed to send support request')
    }

    return { success: true }
  } catch (error) {
    console.error('Support request error:', error)
    throw new Error('Failed to send support request. Please try again.')
  }
}
