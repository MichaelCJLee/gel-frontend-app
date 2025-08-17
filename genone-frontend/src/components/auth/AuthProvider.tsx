import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { UseAuthReturn } from '../../hooks/useAuth'

// Create authentication context
const AuthContext = createContext<UseAuthReturn | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Authentication provider for admin-provisioned GenOne system
 * Wraps the application with authentication state management
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 */
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

// Export types for convenience
export type { UseAuthReturn }
export { useAuth } 