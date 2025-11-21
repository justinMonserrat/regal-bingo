// Email service for sending bug reports and support requests
export async function sendBugReport({ description, userEmail, browserInfo, url }) {
  try {
    const response = await fetch('/.netlify/functions/send-bug-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        userEmail,
        browserInfo,
        url,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send bug report')
    }

    return await response.json()
  } catch (error) {
    console.error('Bug report error:', error)
    throw new Error('Failed to send bug report. Please try again.')
  }
}

export async function sendSupportRequest({ subject, message, userEmail }) {
  try {
    const response = await fetch('/.netlify/functions/send-support-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        message,
        userEmail,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send support request')
    }

    return await response.json()
  } catch (error) {
    console.error('Support request error:', error)
    throw new Error('Failed to send support request. Please try again.')
  }
}
