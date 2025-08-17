import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

/**
 * Admin-provisioned login page for GenOne
 * NO signup functionality - users are created by administrators only
 */
export function LoginPage({ onLogin, isLoading = false, error }: LoginPageProps) {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({})

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {}

    if (!credentials.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!credentials.password.trim()) {
      errors.password = 'Password is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onLogin(credentials.email, credentials.password)
    } catch (err) {
      // Error handling is managed by parent component
      console.error('Login error:', err)
    }
  }

  // Handle input changes with validation reset
  const handleInputChange = (field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({ ...prev, [field]: e.target.value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border">
        {/* GenOne branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-foreground rounded-sm flex items-center justify-center">
                <svg className="w-4 h-4 text-background" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">GenOne</h1>
            </div>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address..."
                value={credentials.email}
                onChange={handleInputChange('email')}
                disabled={isLoading}
                className={`pl-10 h-12 ${validationErrors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                autoComplete="email"
                autoFocus
              />
            </div>
            {validationErrors.email && (
              <p className="text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>
          
          {/* Password field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                onClick={() => {
                  // TODO: Implement forgot password functionality
                  alert('Please contact your administrator for password reset assistance.')
                }}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                value={credentials.password}
                onChange={handleInputChange('password')}
                disabled={isLoading}
                className={`pl-10 h-12 ${validationErrors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                autoComplete="current-password"
              />
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-500">{validationErrors.password}</p>
            )}
          </div>

          {/* Authentication error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full h-12" 
            disabled={isLoading || !credentials.email.trim() || !credentials.password.trim()}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Admin contact message - NO SIGNUP LINK */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              className="text-foreground hover:underline font-medium focus:outline-none transition-colors"
              onClick={() => {
                alert('Please contact your administrator to get your GenOne account.')
              }}
            >
              Contact admin
            </button>
          </p>
        </div>

        {/* Additional help text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Accounts are managed by your administrator for security
          </p>
        </div>
      </Card>
    </div>
  )
} 