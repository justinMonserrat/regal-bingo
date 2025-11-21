const nodemailer = require('nodemailer')

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { description, userEmail, browserInfo, url, timestamp } = JSON.parse(event.body)

    // Validate required fields
    if (!description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Description is required' })
      }
    }

    // Create transporter using environment variables
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'regalbingopromo@gmail.com',
      subject: 'Regal Bingo Bug Report',
      html: `
        <h2>Bug Report</h2>
        <p><strong>Description:</strong></p>
        <p>${description.replace(/\n/g, '<br>')}</p>
        
        <p><strong>User Email:</strong> ${userEmail || 'Not provided'}</p>
        <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>Page URL:</strong> ${url}</p>
        <p><strong>Browser Info:</strong> ${browserInfo}</p>
      `
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Bug report sent successfully' 
      })
    }

  } catch (error) {
    console.error('Error sending bug report:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({ 
        error: 'Failed to send bug report' 
      })
    }
  }
}
