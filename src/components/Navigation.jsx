import { NavLink } from 'react-router-dom'

function Navigation() {
  return (
    <nav className="navigation">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Home
      </NavLink>
      <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Projects
      </NavLink>
      <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        About
      </NavLink>
      <NavLink to="/contact" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Contact
      </NavLink>
    </nav>
  )
}

export default Navigation
