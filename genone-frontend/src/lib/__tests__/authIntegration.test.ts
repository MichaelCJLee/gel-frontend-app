/**
 * Authentication Integration Tests
 * Tests JWT token inclusion and error handling in API calls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LangGraphService } from '../langGraphService'
import { SessionService } from '../sessionService'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    }
  }
}))

// Import the mocked supabase after mocking
const { supabase } = await import('../supabase')

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Authentication Integration', () => {
  let langGraphService: LangGraphService
  let sessionService: SessionService

  beforeEach(() => {
    langGraphService = new LangGraphService()
    sessionService = new SessionService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('LangGraphService Authentication', () => {
    it('should include JWT token in streaming requests', async () => {
      // Mock successful auth session
      const mockSession = { access_token: 'test-jwt-token' }
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock successful streaming response
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"type": "stream_start"}\n\n')
          })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: vi.fn()
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/event-stream'
        }),
        body: { getReader: () => mockReader }
      })

      // Test streaming with session ID
      await langGraphService.streamMessage('test message', {
        sessionId: 'test-session-id'
      })

      // Verify fetch was called with correct headers
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/stream'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token',
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          }),
          body: expect.stringContaining('"session_id":"test-session-id"')
        })
      )
    })

    it('should throw authentication error when no token available', async () => {
      // Mock no session
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null
      })

      const onError = vi.fn()

      // Test streaming with error handler
      await langGraphService.streamMessage('test message', {
        onError
      })

      // Verify error handler was called with auth error
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required. Please sign in.'
        })
      )

      // Verify no fetch call was made
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle 401 authentication errors from backend', async () => {
      // Mock session with token
      const mockSession = { access_token: 'invalid-token' }
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock 401 response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        text: () => Promise.resolve('Unauthorized')
      })

      const onError = vi.fn()

      // Test streaming with error handler
      await langGraphService.streamMessage('test message', {
        onError
      })

      // Verify error handler was called with auth error
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required. Please sign in.'
        })
      )
    })

    it('should handle 403 authorization errors from backend', async () => {
      // Mock session with token
      const mockSession = { access_token: 'valid-but-unauthorized-token' }
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock 403 response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers(),
        text: () => Promise.resolve('Forbidden')
      })

      const onError = vi.fn()

      // Test streaming with error handler
      await langGraphService.streamMessage('test message', {
        onError
      })

      // Verify error handler was called with authorization error
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Access denied. Please check your permissions.')
        })
      )
    })
  })

  describe('SessionService Authentication', () => {
    it('should include JWT token in session API calls', async () => {
      // Mock successful auth session
      const mockSession = { access_token: 'test-jwt-token' }
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock successful session creation response
      const mockSessionResponse = {
        id: 'session-123',
        user_id: 'user-456',
        thread_id: 'thread-789',
        title: 'Test Session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        metadata: {}
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockSessionResponse)
      })

      // Test session creation
      const result = await sessionService.createSession('Test Session')

      // Verify fetch was called with correct headers
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ title: 'Test Session', metadata: {} })
        })
      )

      // Verify response
      expect(result).toEqual(mockSessionResponse)
    })

    it('should throw authentication error when listing sessions without token', async () => {
      // Mock no session
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null
      })

      // Test should throw authentication error
      await expect(
        sessionService.listSessions()
      ).rejects.toThrow('Authentication required. Please sign in.')

      // Verify no fetch call was made
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle session API errors properly', async () => {
      // Mock session with token
      const mockSession = { access_token: 'test-jwt-token' }
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock 404 response for non-existent session
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Session not found' })
      })

      // Test should throw proper error
      await expect(
        sessionService.getSession('non-existent-session')
      ).rejects.toThrow('Resource not found')
    })
  })

  describe('Connection Testing', () => {
    it('should test authenticated connection successfully', async () => {
      // Mock session with token
      const mockSession = { access_token: 'test-jwt-token' }
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock successful health check
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      })

      // Test authenticated connection
      const result = await langGraphService.testAuthenticatedConnection()

      // Verify result and headers
      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token'
          })
        })
      )
    })

    it('should test session service connection', async () => {
      // Mock session with token
      const mockSession = { access_token: 'test-jwt-token' }
      ;(supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock successful sessions list response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          sessions: [],
          total: 0,
          page: 1,
          page_size: 1
        })
      })

      // Test connection
      const result = await sessionService.testConnection()

      // Verify result
      expect(result).toBe(true)
    })
  })
})
