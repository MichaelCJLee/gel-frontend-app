import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for localStorage with TypeScript support
 * Handles serialization/deserialization and provides reactive updates
 * Optimized to prevent excessive re-renders
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) return initialValue
      
      return JSON.parse(item, (_key, value) => {
        // Convert date strings back to Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value)
        }
        return value
      })
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Use setStoredValue with function to get current value
      setStoredValue((currentValue) => {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(currentValue) : value
        
        // Only update if the value actually changed to prevent unnecessary re-renders
        if (JSON.stringify(valueToStore) === JSON.stringify(currentValue)) {
          return currentValue
        }
        
        // Save to localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
        
        // Dispatch custom event for cross-tab synchronization (but not for this instance)
        window.dispatchEvent(new CustomEvent('localStorage-change', {
          detail: { key, value: valueToStore, source: 'local' }
        }))
        
        return valueToStore
      })
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key])

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
      
      // Dispatch custom event for cross-tab synchronization
      window.dispatchEvent(new CustomEvent('localStorage-change', {
        detail: { key, value: null, source: 'local' }
      }))
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this key in other tabs/windows and custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue, (_key, value) => {
            // Convert date strings back to Date objects
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
              return new Date(value)
            }
            return value
          })
          setStoredValue(newValue)
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error)
        }
      }
    }

    const handleCustomChange = (e: CustomEvent) => {
      // Only handle events from other instances, not our own
      if (e.detail.key === key && e.detail.source !== 'local') {
        if (e.detail.value === null) {
          setStoredValue(initialValue)
        } else {
          setStoredValue(e.detail.value)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorage-change', handleCustomChange as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorage-change', handleCustomChange as EventListener)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
} 