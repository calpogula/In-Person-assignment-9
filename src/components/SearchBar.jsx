import { useState, useRef, useEffect } from 'react'

function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef(null)

  // put the cursor in the box when the projects page opens
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    // Search as user types
    onSearch(value)
  }

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
    searchInputRef.current?.focus()
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search projects by name, tech, or description..."
          value={searchTerm}
          onChange={handleChange}
          className="search-input"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="clear-button"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </form>
  )
}

export default SearchBar
