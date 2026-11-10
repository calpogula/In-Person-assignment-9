import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="error-page">
      <h1>404</h1>
      <p>That page doesn't exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to Home
      </Link>
    </div>
  )
}

export default NotFoundPage
