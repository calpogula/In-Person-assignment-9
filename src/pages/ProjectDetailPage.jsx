import { useParams, useNavigate } from 'react-router-dom'
import { projects } from '../data/projects'

function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = projects.find(p => p.id === id)

  if (!project) {
    return (
      <div className="error-page">
        <h2>Project not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/projects')}>
          Back to Projects
        </button>
      </div>
    )
  }

  return (
    <div className="project-detail-page">
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <article className="project-detail">
        <header className="project-header">
          <h1>{project.title}</h1>
          <div className="project-meta">
            <span className="project-date">{project.date}</span>
            <span className="project-category">{project.category}</span>
          </div>
        </header>

        {project.imageUrl && (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="project-image"
          />
        )}

        <section className="project-content">
          <h2>Project Overview</h2>
          <p>{project.details || project.description}</p>

          <h3>Technologies Used</h3>
          <div className="tech-stack">
            {project.technologies.map(tech => (
              <span key={tech} className="tech-badge">{tech}</span>
            ))}
          </div>

          <h3>Key Features</h3>
          <ul className="features-list">
            {project.features?.map((feature, index) => (
              <li key={index}>{feature}</li>
            )) || (
              <>
                <li>Responsive design</li>
                <li>Modern UI/UX</li>
                <li>Performance optimized</li>
              </>
            )}
          </ul>

          <div className="project-links">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                View on GitHub
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                View Live Demo
              </a>
            )}
          </div>
        </section>
      </article>
    </div>
  )
}

export default ProjectDetailPage
