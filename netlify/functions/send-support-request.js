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
    const { subject, message, userEmail, timestamp } = JSON.parse(event.body)

    // Validate required fields
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
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
      subject: subject || 'Regal Bingo Support Request',
      html: `
        <h2>Support Request</h2>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        
        <p><strong>User Email:</strong> ${userEmail || 'Not provided'}</p>
        <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
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
        message: 'Support request sent successfully' 
      })
    }

  } catch (error) {
    console.error('Error sending support request:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({ 
        error: 'Failed to send support request' 
      })
    }
  }
}
