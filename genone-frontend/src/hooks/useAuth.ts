import { useState, useEffect, useCallback } from 'react'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, AuthError } from '../lib/supabase'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: AuthError | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateLastLogin: () => Promise<void>
}

export type UseAuthReturn = AuthState & AuthActions & {
  isAuthenticated: boolean
  hasRole: (roleName: string) => boolean
}

/**
 * Enhanced authentication hook for admin-provisioned GenOne system
 * Provides secure authentication state management with profile loading
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  // Get user-friendly error messages for admin-provisioned system
  const getAuthErrorMessage = useCallback((error: any): AuthError => {
    let message: string

    switch (error?.message) {
      case 'Invalid login credentials':
        message = 'Invalid email or password. Please verify the credentials provided by your administrator.'
        break
      case 'Email not confirmed':
        message = 'Your account setup is incomplete. Please contact your administrator.'
        break
      case 'Too many requests':
        message = 'Too many login attempts. Please wait a few minutes and try again.'
        break
      case 'User not found':
        message = 'No account found with this email. Contact your administrator to verify your access.'
        break
      case 'Signup is disabled':
        message = 'This system uses administrator-managed accounts. Contact your administrator for access.'
        break
      case 'Access denied':
        message = 'Your account may be disabled. Please contact your administrator.'
        break
      default:
        message = 'Unable to sign in. Please contact your administrator for assistance.'
    }

    return {
      message,
      status: error?.status || 400
    }
  }, [])

  // Load user profile with role information
  const loadUserProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('id', userId)
        .eq('is_active', true) // Only load active profiles
        .single()

      if (error) {
        console.error('Profile loading error:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Failed to load profile:', err)
      return null
    }
  }, [])

  // Update user's last login timestamp
  const updateLastLogin = useCallback(async (): Promise<void> => {
    if (!user?.id) return

    try {
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)
    } catch (err) {
      console.error('Failed to update last login:', err)
      // Don't throw - this is not critical
    }
  }, [user?.id])

  // Login function optimized for admin-provisioned accounts
  const login = useCallback(async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true)
      setError(null)

      const normalizedEmail = email.toLowerCase().trim()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      })

      if (error) {
        console.error('Supabase auth error:', error.message)
        const authError = getAuthErrorMessage(error)
        setError(authError)
        throw new Error(authError.message)
      }

      if (data.user) {
        setUser(data.user)
        return data.user
      }

      throw new Error('Login failed: No user returned')
    } catch (err) {
      console.error('Login error:', err)
      const authError = err instanceof Error ?
        getAuthErrorMessage(err) :
        { message: 'Login failed. Please try again.', status: 500 }

      setError(authError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getAuthErrorMessage])

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        // Don't throw - force local logout anyway
      }
      
      setUser(null)
      setProfile(null)
    } catch (err) {
      console.error('Logout failed:', err)
      // Force local logout even if remote logout fails
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh profile data
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) return

    try {
      const profileData = await loadUserProfile(user.id)
      setProfile(profileData)
    } catch (err) {
      console.error('Failed to refresh profile:', err)
    }
  }, [user?.id, loadUserProfile])

  // Check if user has specific role
  const hasRole = useCallback((roleName: string): boolean => {
    return profile?.role?.name === roleName
  }, [profile?.role?.name])

  // Initialize authentication state and listen for changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error)
        setError(getAuthErrorMessage(error))
        setLoading(false)
        return
      }

      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(err => {
      console.error('getSession failed:', err)
      setLoading(false)
    })

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)

        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setError(null)
        }

        if (event === 'SIGNED_IN' && currentUser) {
          // Load profile asynchronously - don't block the UI
          loadUserProfile(currentUser.id)
            .then(setProfile)
            .catch(err => {
              console.error('Profile loading failed:', err)
            })

          // Update last login asynchronously - don't block the UI
          updateLastLogin().catch(err => {
            console.error('Last login update failed:', err)
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [getAuthErrorMessage, loadUserProfile, updateLastLogin])

  // Load profile when user changes
  useEffect(() => {
    if (user?.id && !profile) {
      loadUserProfile(user.id)
        .then(setProfile)
        .catch(err => {
          console.error('Profile loading failed:', err)
        })
    } else if (!user) {
      setProfile(null)
    }
  }, [user?.id, profile, loadUserProfile])

  return {
    // State
    user,
    profile,
    loading,
    error,
    
    // Computed state
    isAuthenticated: !!user,
    
    // Actions
    login,
    logout,
    refreshProfile,
    updateLastLogin,
    hasRole
  }
} 