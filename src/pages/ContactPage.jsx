import { useState } from 'react'
// TODO: Import useNavigate for programmatic navigation after form submission

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setSubmitMessage('Thank you for your message! I\'ll get back to you soon.')
      setIsSubmitting(false)
      setFormData({ name: '', email: '', message: '' })

      // TODO: Navigate to home page after successful submission
      // setTimeout(() => navigate('/'), 2000)
    }, 1000)
  }

  return (
    <div className="contact-page">
      <h1>Get In Touch</h1>
      <p className="page-description">
        Have a project in mind? Let's work together!
      </p>

      <div className="contact-content">
        <section className="contact-info">
          <h2>Contact Information</h2>
          <div className="contact-methods">
            <div className="contact-method">
              <span className="contact-icon">📧</span>
              <div>
                <h3>Email</h3>
                <a href="mailto:hello@example.com">hello@example.com</a>
              </div>
            </div>
            <div className="contact-method">
              <span className="contact-icon">💼</span>
              <div>
                <h3>LinkedIn</h3>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Connect on LinkedIn
                </a>
              </div>
            </div>
            <div className="contact-method">
              <span className="contact-icon">🐙</span>
              <div>
                <h3>GitHub</h3>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View my GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="contact-form-section">
          <h2>Send a Message</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>

            {submitMessage && (
              <div className="success-message">
                {submitMessage}
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}

export default ContactPage