import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  isAuthError, 
  getUserFriendlyErrorMessage, 
  logError,
  AuthenticationError,
  AuthorizationError 
} from '../lib/errorHandler'

/**
 * Hook for handling authentication errors and token refresh
 */
export const useAuthErrorHandler = () => {
  const navigate = useNavigate()

  /**
   * Handle authentication errors by redirecting to login
   */
  const handleAuthError = useCallback((error: any) => {
    if (isAuthError(error)) {
      logError(error, 'AuthErrorHandler')
      
      // Clear any invalid session
      supabase.auth.signOut()
      
      // Redirect to login page
      navigate('/auth', { 
        replace: true,
        state: { 
          message: getUserFriendlyErrorMessage(error),
          returnUrl: window.location.pathname 
        }
      })
      
      return true // Indicates error was handled
    }
    
    return false // Error was not an auth error
  }, [navigate])

  /**
   * Attempt to refresh the session token
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[AuthErrorHandler] Attempting to refresh session...')
      
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('[AuthErrorHandler] Session refresh failed:', error)
        return false
      }
      
      if (data.session) {
        console.log('[AuthErrorHandler] Session refreshed successfully')
        return true
      }
      
      console.warn('[AuthErrorHandler] No session returned from refresh')
      return false
    } catch (error) {
      console.error('[AuthErrorHandler] Session refresh error:', error)
      return false
    }
  }, [])

  /**
   * Retry a function with automatic token refresh on auth errors
   */
  const retryWithTokenRefresh = useCallback(async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> => {
    let lastError: any
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        // Only retry auth errors
        if (!isAuthError(error)) {
          throw error
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break
        }
        
        console.log('[AuthErrorHandler] Auth error detected, attempting token refresh...')
        
        // Try to refresh the token
        const refreshed = await refreshSession()
        if (!refreshed) {
          console.log('[AuthErrorHandler] Token refresh failed, stopping retries')
          break
        }
        
        console.log('[AuthErrorHandler] Token refreshed, retrying request...')
      }
    }
    
    // If we get here, all retries failed
    handleAuthError(lastError)
    throw lastError
  }, [refreshSession, handleAuthError])

  /**
   * Check if the current session is valid
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('[AuthErrorHandler] Session validation error:', error)
        return false
      }
      
      if (!session) {
        console.log('[AuthErrorHandler] No active session')
        return false
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('[AuthErrorHandler] Session token expired')
        
        // Try to refresh
        return await refreshSession()
      }
      
      console.log('[AuthErrorHandler] Session is valid')
      return true
    } catch (error) {
      console.error('[AuthErrorHandler] Session validation failed:', error)
      return false
    }
  }, [refreshSession])

  /**
   * Set up automatic session monitoring
   */
  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        console.log('[AuthErrorHandler] Auth state changed:', event)
        
        if (event === 'SIGNED_OUT') {
          console.log('[AuthErrorHandler] User signed out')
          // Could redirect to login here if needed
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthErrorHandler] Token refreshed automatically')
        } else if (event === 'SIGNED_IN') {
          console.log('[AuthErrorHandler] User signed in')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    handleAuthError,
    refreshSession,
    retryWithTokenRefresh,
    validateSession
  }
}

/**
 * Higher-order function to wrap API calls with automatic auth error handling
 */
export const withAuthErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (isAuthError(error)) {
        // Let the component handle auth errors using the hook
        throw error
      }
      
      // Re-throw non-auth errors
      throw error
    }
  }
}

/**
 * Utility to create an authenticated fetch wrapper
 */
export const createAuthenticatedFetch = () => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw new AuthenticationError('Failed to get session: ' + error.message)
    }
    
    if (!session?.access_token) {
      throw new AuthenticationError('No access token available')
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    if (response.status === 401) {
      throw new AuthenticationError('Authentication required')
    } else if (response.status === 403) {
      throw new AuthorizationError('Access denied')
    }
    
    return response
  }
}
