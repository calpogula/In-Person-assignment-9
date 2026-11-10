import { Outlet } from 'react-router-dom'

function ProjectsLayout() {
  return (
    <div className="projects-layout">
      <h2>Projects</h2>
      <Outlet />
    </div>
  )
}

export default ProjectsLayout
