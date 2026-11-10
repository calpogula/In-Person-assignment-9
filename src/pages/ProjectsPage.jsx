import { useState } from 'react'
// TODO: Import Link from react-router-dom
import ProjectCard from '../components/ProjectCard'
import SearchBar from '../components/SearchBar'
// TODO: Import the custom useFetch hook once created
import { projects } from '../data/projects'

function ProjectsPage() {
  const [filteredProjects, setFilteredProjects] = useState(projects)

  // TODO: Replace this with the useFetch custom hook
  // const { data: projects, loading, error } = useFetch('/api/projects')

  const handleSearch = (searchTerm) => {
    const filtered = projects.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.technologies.some(tech =>
        tech.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    setFilteredProjects(filtered)
  }

  return (
    <div className="projects-page">
      <h1>My Projects</h1>
      <p className="page-description">
        Here are some of the projects I've worked on recently.
      </p>

      <SearchBar onSearch={handleSearch} />

      {/* TODO: Add loading and error states when using useFetch */}

      <div className="projects-grid">
        {filteredProjects.map(project => (
          // TODO: Wrap ProjectCard with Link to navigate to project detail
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="no-results">
          <p>No projects match your search.</p>
        </div>
      )}
    </div>
  )
}

export default ProjectsPage