import React from 'react'
import ReactDOM from 'react-dom/client'
// TODO: Import BrowserRouter from react-router-dom
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* TODO: Wrap App component with BrowserRouter */}
    <App />
  </React.StrictMode>,
)