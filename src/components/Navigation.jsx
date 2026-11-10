// TODO: Import NavLink from react-router-dom instead of using regular links

function Navigation() {
  return (
    <nav className="navigation">
      {/* TODO: Replace these <a> tags with NavLink components
          - Use the className prop with a function that receives { isActive }
          - Update the paths to match your routes
      */}
      <a href="/" className="nav-link">
        Home
      </a>
      <a href="/projects" className="nav-link">
        Projects
      </a>
      <a href="/about" className="nav-link">
        About
      </a>
      <a href="/contact" className="nav-link">
        Contact
      </a>
    </nav>
  )
}

export default Navigation