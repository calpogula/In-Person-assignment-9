import { useState, useEffect } from 'react'

// TODO: Implement the useLocalStorage custom hook
// This hook should:
// 1. Accept a key and initial value
// 2. Return [storedValue, setValue] like useState
// 3. Sync with localStorage
// 4. Handle JSON parsing/stringifying

export function useLocalStorage(key, initialValue) {
  // TODO: Initialize state with value from localStorage or initialValue

  // TODO: Create a setter function that:
  // - Updates state
  // - Saves to localStorage

  // For now, just use regular useState so the app doesn't break
  const [storedValue, setStoredValue] = useState(initialValue)

  return [storedValue, setStoredValue]
}

// Example implementation structure:
/*
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    // TODO: Get from localStorage
  })

  const setValue = (value) => {
    // TODO: Save to state and localStorage
  }

  return [storedValue, setValue]
}
*/