function AboutPage() {
  return (
    <div className="about-page">
      <h1>About Me</h1>

      <section className="about-intro">
        <div className="about-content">
          <img
            src="/images/profile.jpg"
            alt="Profile"
            className="profile-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=Profile'
            }}
          />
          <div className="about-text">
            <h2>Hello! I'm a passionate developer</h2>
            <p>
              I love creating web applications that solve real problems and
              provide great user experiences. With a strong foundation in both
              front-end and back-end technologies, I enjoy bringing ideas to life
              through code.
            </p>
            <p>
              Currently focused on React, Node.js, and modern web technologies.
              I'm always eager to learn new things and take on challenging projects.
            </p>
          </div>
        </div>
      </section>

      <section className="skills-section">
        <h2>Technical Skills</h2>
        <div className="skills-categories">
          <div className="skill-category">
            <h3>Frontend</h3>
            <ul>
              <li>React & React Router</li>
              <li>JavaScript (ES6+)</li>
              <li>HTML5 & CSS3</li>
              <li>Responsive Design</li>
            </ul>
          </div>
          <div className="skill-category">
            <h3>Backend</h3>
            <ul>
              <li>Node.js</li>
              <li>Express.js</li>
              <li>RESTful APIs</li>
              <li>MongoDB</li>
            </ul>
          </div>
          <div className="skill-category">
            <h3>Tools</h3>
            <ul>
              <li>Git & GitHub</li>
              <li>VS Code</li>
              <li>npm/yarn</li>
              <li>Vite</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="timeline-section">
        <h2>My Journey</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-date">2025</div>
            <div className="timeline-content">
              <h3>Full Stack Developer</h3>
              <p>Building modern web applications with React and Node.js</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2024</div>
            <div className="timeline-content">
              <h3>Started Web Development</h3>
              <p>Began learning HTML, CSS, and JavaScript</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">2023</div>
            <div className="timeline-content">
              <h3>Computer Science Student</h3>
              <p>Started my journey in programming</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage