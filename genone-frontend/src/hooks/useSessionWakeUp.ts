import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { useAuthErrorHandler } from './useAuthErrorHandler'

/**
 * Hook to handle session wake-up after idle periods
 * Automatically validates and refreshes sessions when user returns
 */
export const useSessionWakeUp = () => {
  const { isAuthenticated } = useAuth()
  const { validateSession, refreshSession } = useAuthErrorHandler()
  const lastActivityRef = useRef<number>(Date.now())
  const isValidatingRef = useRef<boolean>(false)

  /**
   * Update last activity timestamp
   */
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  /**
   * Check if session needs validation based on idle time
   */
  const needsValidation = useCallback((): boolean => {
    const now = Date.now()
    const idleTime = now - lastActivityRef.current
    const IDLE_THRESHOLD = 5 * 60 * 1000 // 5 minutes

    return idleTime > IDLE_THRESHOLD
  }, [])

  /**
   * Validate session and refresh if needed
   */
  const wakeUpSession = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || isValidatingRef.current) {
      return false
    }

    try {
      isValidatingRef.current = true
      console.log('[SessionWakeUp] Validating session after idle period...')

      const isValid = await validateSession()
      
      if (!isValid) {
        console.log('[SessionWakeUp] Session invalid, attempting refresh...')
        const refreshed = await refreshSession()
        
        if (refreshed) {
          console.log('[SessionWakeUp] Session refreshed successfully')
          updateActivity()
          return true
        } else {
          console.log('[SessionWakeUp] Session refresh failed')
          return false
        }
      } else {
        console.log('[SessionWakeUp] Session is valid')
        updateActivity()
        return true
      }
    } catch (error) {
      console.error('[SessionWakeUp] Session validation error:', error)
      return false
    } finally {
      isValidatingRef.current = false
    }
  }, [isAuthenticated, validateSession, refreshSession, updateActivity])

  /**
   * Handle user interaction - validate session if needed
   */
  const handleUserInteraction = useCallback(async () => {
    if (!isAuthenticated) return

    updateActivity()

    // Only validate if we've been idle for a while
    if (needsValidation()) {
      await wakeUpSession()
    }
  }, [isAuthenticated, updateActivity, needsValidation, wakeUpSession])

  /**
   * Handle window focus - always validate session
   */
  const handleWindowFocus = useCallback(async () => {
    if (!isAuthenticated) return

    console.log('[SessionWakeUp] Window focused, checking session...')
    await wakeUpSession()
  }, [isAuthenticated, wakeUpSession])

  /**
   * Handle page visibility change
   */
  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState === 'visible' && isAuthenticated) {
      console.log('[SessionWakeUp] Page became visible, checking session...')
      await wakeUpSession()
    }
  }, [isAuthenticated, wakeUpSession])

  /**
   * Set up event listeners for user activity and focus
   */
  useEffect(() => {
    if (!isAuthenticated) return

    // Activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true })
    })

    // Add focus listener
    window.addEventListener('focus', handleWindowFocus)
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction)
      })
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, handleUserInteraction, handleWindowFocus, handleVisibilityChange])

  /**
   * Periodic session health check
   */
  useEffect(() => {
    if (!isAuthenticated) return

    const healthCheckInterval = setInterval(async () => {
      if (needsValidation()) {
        console.log('[SessionWakeUp] Periodic health check - validating session...')
        await wakeUpSession()
      }
    }, 2 * 60 * 1000) // Check every 2 minutes

    return () => clearInterval(healthCheckInterval)
  }, [isAuthenticated, needsValidation, wakeUpSession])

  return {
    wakeUpSession,
    handleUserInteraction,
    updateActivity
  }
}
