// Component for displaying project cards in the grid

function ProjectCard({ project }) {
  return (
    <div className="project-card">
      {project.imageUrl && (
        <img
          src={project.imageUrl}
          alt={project.title}
          className="project-card-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300?text=' + project.title
          }}
        />
      )}
      <div className="project-card-content">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="project-card-tech">
          {project.technologies.slice(0, 3).map(tech => (
            <span key={tech} className="tech-tag">{tech}</span>
          ))}
          {project.technologies.length > 3 && (
            <span className="tech-tag">+{project.technologies.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectCard