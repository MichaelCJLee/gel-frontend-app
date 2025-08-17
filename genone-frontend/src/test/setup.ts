import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_API_BASE_URL: 'http://localhost:8000/api/v1'
  },
  writable: true
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock TextEncoder/TextDecoder for streaming tests
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Setup console mocking to reduce noise in tests
const originalConsole = { ...console }

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()

  // Mock console methods to reduce test noise
  console.log = vi.fn()
  console.warn = vi.fn()
  console.error = vi.fn()
})

afterEach(() => {
  // Restore console after each test
  Object.assign(console, originalConsole)
})
