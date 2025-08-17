/**
 * Enhanced error handling for API responses and authentication
 */

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, details)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, details)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 422, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, details)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, details)
    this.name = 'RateLimitError'
  }
}

/**
 * Handle API response errors with proper error types
 */
export const handleAPIError = async (response: Response): Promise<never> => {
  let errorData: any
  try {
    errorData = await response.json()
  } catch {
    errorData = { message: 'Unknown error occurred' }
  }

  const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`
  
  switch (response.status) {
    case 401:
      throw new AuthenticationError(errorMessage, errorData)
    case 403:
      throw new AuthorizationError(errorMessage, errorData)
    case 404:
      throw new NotFoundError(errorMessage, errorData)
    case 422:
      throw new ValidationError(errorMessage, errorData)
    case 429:
      throw new RateLimitError(errorMessage, errorData)
    default:
      throw new APIError(errorMessage, response.status, errorData)
  }
}

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error instanceof AuthenticationError || 
         error instanceof AuthorizationError ||
         (error instanceof APIError && (error.status === 401 || error.status === 403))
}

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return error instanceof TypeError && error.message.includes('fetch')
}

/**
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  if (error instanceof AuthenticationError) {
    return 'Please sign in to continue.'
  }
  
  if (error instanceof AuthorizationError) {
    return 'You don\'t have permission to perform this action.'
  }
  
  if (error instanceof NotFoundError) {
    return 'The requested resource was not found.'
  }
  
  if (error instanceof ValidationError) {
    return 'Please check your input and try again.'
  }
  
  if (error instanceof RateLimitError) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.'
  }
  
  if (error instanceof APIError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Log error with appropriate level
 */
export const logError = (error: any, context?: string): void => {
  const prefix = context ? `[${context}]` : '[Error]'
  
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    console.warn(prefix, 'Auth error:', error.message)
  } else if (error instanceof ValidationError) {
    console.warn(prefix, 'Validation error:', error.message, error.details)
  } else if (error instanceof APIError) {
    console.error(prefix, 'API error:', error.status, error.message, error.details)
  } else {
    console.error(prefix, 'Unexpected error:', error)
  }
}

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry auth errors or validation errors
      if (isAuthError(error) || error instanceof ValidationError) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Error boundary helper for React components
 */
export interface ErrorInfo {
  error: Error
  errorInfo: any
}

export const handleComponentError = (error: Error, errorInfo: any): ErrorInfo => {
  logError(error, 'Component')
  return { error, errorInfo }
}

/**
 * Global error handler for unhandled promise rejections
 */
export const setupGlobalErrorHandling = (): void => {
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'UnhandledPromise')
    
    // Prevent default browser error handling for auth errors
    if (isAuthError(event.reason)) {
      event.preventDefault()
    }
  })
  
  window.addEventListener('error', (event) => {
    logError(event.error, 'GlobalError')
  })
}
