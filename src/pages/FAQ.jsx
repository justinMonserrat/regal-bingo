import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Footer from '../components/Footer'
import SupportModal from '../components/SupportModal'
import './FAQ.css'

function FAQ() {
  const navigate = useNavigate()
  const [openSection, setOpenSection] = useState(null)
  const [showSupportModal, setShowSupportModal] = useState(false)

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section)
  }

  const faqSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      questions: [
        {
          q: 'How do I participate in Regal Bingo?',
          a: 'Create an account by clicking "Create Account" on the homepage. Once registered, you\'ll receive your personal 5×3 bingo card with 15 different movie-going challenges to complete during December.'
        },
        {
          q: 'What is the goal of Regal Bingo?',
          a: 'Complete challenges on your bingo card by visiting Regal theaters and engaging in various activities. Complete rows, columns, or the entire card for Rgal Crown Club points!'
        },
        {
          q: 'When does the promotion run?',
          a: 'Regal Bingo runs throughout the month of December. All challenges must be completed and submitted for review within the specified time framebefore the end of the promotional period.'
        }
      ]
    },
    {
      id: 'challenges',
      title: 'Bingo Challenges',
      questions: [
        {
          q: 'What types of challenges are on the bingo card?',
          a: 'Challenges include purchasing concessions (popcorn, drinks, candy, ice cream, hot food), seeing movies at specific times (weekday, matinee, IMAX), buying movie merchandise, signing up for Regal Unlimited, leaving reviews, and making charitable donations.'
        },
        {
          q: 'Can I complete challenges in any order?',
          a: 'Yes! You can complete the challenges in any order you prefer. Although you can only complete one challenge per visit. The center square is a FREE SPACE that\'s automatically marked as complete.'
        },
        {
          q: 'Do I need to complete the entire card?',
          a: 'No, you can earn points for individually completed rows, columns, or the entire card. Each level of completion offers different point rewards.'
        },
        {
          q: 'What counts as proof for each challenge?',
          a: 'Most challenges require a receipt or photo as verification. For example: receipts for purchases, screenshots for leaving a review, photos of your movie ticket for specific showtimes, confirmation emails for subscriptions.'
        }
      ]
    },
    {
      id: 'submissions',
      title: 'Submitting Completions',
      questions: [
        {
          q: 'How do I submit proof of completing a challenge?',
          a: 'Click "Submit Completion" on your dashboard, select the challenge you completed, upload a clear photo of your receipt or proof, and optionally add any notes. Our team will review your submission within 3-5 days.'
        },
        {
          q: 'Can I complete multiple challenges at once?',
          a: 'Unfortunately, no. You can only complete one challenge per visit. If a receipt is able to be used for multiple challenges, you must choose only one challenge to complete.'
        },
        {
          q: 'Can I get credit for purchases made with points?',
          a: 'Unfortunately, no. You must pay for your purchases with cash or credit card. Points cannot be used to pay for purchases. Unlimited and snack saver discounts can be used.'
        },
        {
          q: 'What file formats are accepted for uploads?',
          a: 'We accept JPEG, PNG, and WebP image formats. Files must be under 5MB in size. Make sure your receipt or proof is clearly visible and readable.'
        },
        {
          q: 'How long do I have to submit proof?',
          a: 'You should submit proof within 3-5 days of completing a challenge. Proof submitted after this time frame may be rejected.This ensures timely processing and prevents any issues with receipt verification.'
        },
        {
          q: 'What if my submission is rejected?',
          a: 'If a submission is rejected, you can resubmit with clearer documentation or contact customer service for clarification on what additional proof is needed.'
        }
      ]
    },
    {
      id: 'points-rewards',
      title: 'Points & Rewards',
      questions: [
        {
          q: 'How many RCC points do I earn for completing challenges?',
          a: 'Points vary by challenge completion level: completing a row of 3 squares earns 5,000 points, completing a row of 5 squares earns 10,000 points, and completing the entire card would earns a bonus of 10,000 RCC points. For a maximum of 25,000 points earned.'
        },
        {
          q: 'Can I earn points for multipl rows and columns?',
          a: 'No, you can only earn points for one row and column. You can earn bonus points for completing the entire card.'
        },
        {
          q: 'When will I receive my RCC points?',
          a: 'Points will be added to your Regal Crown Club account within 24-48 hours after your challenge completion is approved by our review team. You will receive an email notification when your points are added to your regal account.'
        },
        {
          q: 'Can I track my point earnings?',
          a: 'Yes! Your dashboard shows which challenges you\'ve completed and their approval status.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      questions: [
        {
          q: 'How can I contact support?',
          a: 'You can contact support by clicking the "Contact Support" button at the bottom of the page. You can also ask to speak to a manager at your local theater.'
        },
        {
          q: 'I\'m having trouble uploading my receipt. What should I do?',
          a: 'Ensure your image is under 5MB and in JPEG, PNG, or WebP format. Try taking a new, clear photo with good lighting. If problems persist, try using a different device or browser.'
        },
        {
          q: 'My bingo card isn\'t loading properly.',
          a: 'Try refreshing your browser or clearing your cache. If the issue continues, try logging out and back in. Contact support if problems persist.'
        },
        {
          q: 'I forgot my password. How do I reset it?',
          a: 'Click "Forgot your password?" on the login page. Enter your email address and follow the instructions in the reset email we send you.'
        },
        {
          q: 'Can I access Regal Bingo on my mobile device?',
          a: 'Yes! Regal Bingo is fully responsive and works on smartphones and tablets. You can even add it to your home screen for easy access.'
        }
      ]
    },
    {
      id: 'rules',
      title: 'Rules & Policies',
      questions: [
        {
          q: 'Who is eligible to participate?',
          a: 'Regal Bingo is open to Regal Crown Club members. If you do not have a Regal Crown Club account, you can sign up for a free account online or through the Regal app.'
        },
        {
          q: 'Can I have multiple accounts?',
          a: 'No, each person is limited to one Regal Bingo account per promotional period. Multiple accounts may result in disqualification.'
        },
        {
          q: 'What happens if I submit false or fraudulent proof?',
          a: 'Submitting false documentation will result in immediate disqualification from the promotion and potential suspension from future Regal promotions.'
        },
        {
          q: 'Are there any geographic restrictions?',
          a: 'Regal Bingo is available at participating Regal theater locations. Some challenges may only be available at select theaters.'
        },
        {
          q: 'What if a challenge becomes unavailable during the promotion?',
          a: 'If a challenge becomes unavailable due to circumstances beyond our control, we may provide alternative completion methods or substitute challenges.'
        }
      ]
    }
  ]

  return (
    <div className="faq-container">
      <div className="faq-header">
        <Logo size={120} />
        <h1>Frequently Asked Questions</h1>
        <p className="faq-subtitle">Everything you need to know about <br />Regal Bingo</p>
        <button onClick={() => navigate('/')} className="back-home-button">
          Back to Home
        </button>
      </div>

      <div className="faq-content">
        {faqSections.map((section) => (
          <div key={section.id} className="faq-section">
            <button
              className={`section-header ${openSection === section.id ? 'open' : ''}`}
              onClick={() => toggleSection(section.id)}
            >
              <h2>{section.title}</h2>
              <span className="toggle-icon">
                {openSection === section.id ? '−' : '+'}
              </span>
            </button>

            {openSection === section.id && (
              <div className="section-content">
                {section.questions.map((item, index) => (
                  <div key={index} className="faq-item">
                    <h3 className="question">{item.q}</h3>
                    <p className="answer">{item.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="faq-footer">
        <div className="contact-info">
          <h3>Still have questions?</h3>
          <p>
            Contact Regal customer service or visit your local theater for additional assistance.
          </p>
          <div className="quick-links">
            <button
              onClick={() => setShowSupportModal(true)}
              className="link-button contact-button"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

      <Footer />

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  )
}

export default FAQ
