import { useState } from 'react'
// TODO: Import Routes, Route from react-router-dom
// TODO: Import your page components
import Navigation from './components/Navigation'
import './styles/App.css'

function App() {
  // Theme state - will be replaced with useLocalStorage hook later
  const [theme, setTheme] = useState('light')

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
        {/* TODO: Replace this div with Routes and Route components */}
        <div className="placeholder">
          <h1>Welcome to Your Portfolio</h1>
          <p>Set up React Router to navigate between pages!</p>
          <div className="todo-box">
            <h3>TODO:</h3>
            <ol>
              <li>Wrap App with BrowserRouter in main.jsx</li>
              <li>Create page components in src/pages/</li>
              <li>Set up Routes here</li>
              <li>Update Navigation to use NavLink</li>
              <li>Add dynamic project routes</li>
              <li>Implement custom hooks</li>
            </ol>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 My Portfolio. Built with React Router.</p>
      </footer>
    </div>
  )
}

export default App