import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

function HomePage() {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Good morning')
    } else if (hour < 18) {
      setGreeting('Good afternoon')
    } else {
      setGreeting('Good evening')
    }
  }, [])

  return (
    <div className="home-page">
      <section className="hero">
        <h1>{greeting}! I'm a Full Stack Developer</h1>
        <p className="hero-subtitle">
          I build modern web applications with React, Node.js, and more.
        </p>

        <div className="hero-buttons">
          <Link to="/projects" className="btn btn-primary">
            View My Projects
          </Link>
          <Link to="/contact" className="btn btn-secondary">
            Get In Touch
          </Link>
        </div>
      </section>

      <section className="highlights">
        <h2>What I Do</h2>
        <div className="skills-grid">
          <div className="skill-card">
            <span className="skill-icon">⚛️</span>
            <h3>React Development</h3>
            <p>Building interactive UIs with modern React patterns</p>
          </div>
          <div className="skill-card">
            <span className="skill-icon">🎨</span>
            <h3>Responsive Design</h3>
            <p>Creating beautiful, mobile-first experiences</p>
          </div>
          <div className="skill-card">
            <span className="skill-icon">🚀</span>
            <h3>Performance</h3>
            <p>Optimizing for speed and user experience</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
