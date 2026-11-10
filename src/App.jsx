import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import ProjectsLayout from './pages/ProjectsLayout'
import NotFoundPage from './pages/NotFoundPage'
import { useLocalStorage } from './hooks/useLocalStorage'
import './styles/App.css'

const HomePage = lazy(() => import('./pages/HomePage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))

function App() {
  const [theme, setTheme] = useLocalStorage('portfolio-theme', 'light')

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="app-header">
        <Navigation />
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      <main className="app-main">
        <Suspense fallback={<div className="spinner">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsLayout />}>
              <Route index element={<ProjectsPage />} />
              <Route path=":id" element={<ProjectDetailPage />} />
            </Route>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 My Portfolio. Built with React Router.</p>
      </footer>
    </div>
  )
}

export default App
