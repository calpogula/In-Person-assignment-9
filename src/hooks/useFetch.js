import { useState, useEffect } from 'react'

// TODO: Implement the useFetch custom hook
// This hook should:
// 1. Accept a URL as a parameter
// 2. Return an object with { data, loading, error }
// 3. Handle fetch with proper cleanup using AbortController
// 4. Set loading states appropriately

export function useFetch(url) {
  // TODO: Set up state for data, loading, and error

  // TODO: Use useEffect to fetch data when URL changes
  // Remember to:
  // - Create an AbortController for cleanup
  // - Handle errors properly
  // - Set loading to false when done
  // - Return cleanup function that aborts the fetch

  // For now, return mock data so the app doesn't break
  return {
    data: null,
    loading: false,
    error: null
  }
}

// Example implementation structure:
/*
export function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // TODO: Implement fetch logic here
  }, [url])

  return { data, loading, error }
}
*/