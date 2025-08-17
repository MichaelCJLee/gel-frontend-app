import type { ReactNode } from 'react'
import { useAuthContext } from './AuthProvider'
import { LoginPage } from './LoginPage'

interface AuthGuardProps {
  children: ReactNode
}

/**
 * AuthGuard component for admin-provisioned GenOne system
 * Handles route protection with proper loading states and authentication flow
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { loading, error, login, isAuthenticated } = useAuthContext()

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading GenOne...</p>
        </div>
      </div>
    )
  }

  // Handle login with proper error handling
  const handleLogin = async (email: string, password: string): Promise<void> => {
    try {
      await login(email, password)
      // Login successful - AuthGuard will automatically re-render with authenticated state
    } catch (err) {
      // Error is already handled by useAuth hook and stored in error state
      console.error('Login failed:', err)
    }
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={handleLogin}
        isLoading={loading}
        error={error?.message || null}
      />
    )
  }

  // User is authenticated - show protected content
  return <>{children}</>
}

// Export for convenience
export default AuthGuard 