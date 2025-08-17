import { useRef, useCallback, useEffect } from 'react'
import type { StreamingSession, ProcessedEvent } from '../lib/types'
import { langGraphService } from '../lib/langGraphService'
import { useAuth } from './useAuth'

interface UseStreamingSessionOptions {
  onEvent?: (event: ProcessedEvent, messageId?: string) => void
  onMessage?: (content: string, messageId?: string) => void
  onError?: (error: Error, messageId?: string) => void
  onStreamingComplete?: (messageId?: string, conversationId?: string) => void
  userId?: string
}

interface UseStreamingSessionReturn {
  streamMessage: (sessionId: string, message: string, messageId?: string, files?: File[]) => Promise<void>
  cancelStreaming: (sessionId: string) => void
  isStreaming: (sessionId: string) => boolean
  getSession: (sessionId: string) => StreamingSession | undefined
  cleanup: () => void
}

/**
 * Hook for managing LangGraph streaming sessions with backend session integration
 * Now uses backend session IDs instead of generating thread IDs
 * Provides session isolation, automatic cleanup, and resource management
 */
export const useStreamingSession = (
  options: UseStreamingSessionOptions = {}
): UseStreamingSessionReturn => {
  const { onEvent, onMessage, onError, onStreamingComplete } = options
  const { user } = useAuth()

  // Session management
  const sessionsRef = useRef<Map<string, StreamingSession>>(new Map())
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())

  // Create or get session for backend session ID
  const getOrCreateSession = useCallback((sessionId: string): StreamingSession => {
    let session = sessionsRef.current.get(sessionId)

    if (!session) {
      console.log('[useStreamingSession] Creating NEW streaming session for backend session:', sessionId)

      session = {
        id: sessionId,
        threadId: sessionId, // Use session ID as thread ID for backend integration
        status: 'idle',
        lastActivity: Date.now(),
        resources: new Set()
      }

      sessionsRef.current.set(sessionId, session)

      // Auto-cleanup after 30 minutes of inactivity
      const cleanupTimer = setTimeout(() => {
        destroySession(sessionId)
      }, 30 * 60 * 1000)

      session.resources.add(() => clearTimeout(cleanupTimer))
      timersRef.current.add(cleanupTimer)
    } else {
      console.log('[useStreamingSession] REUSING existing streaming session for backend session:', sessionId)
    }

    return session
  }, [])

  // Destroy session and cleanup resources
  const destroySession = useCallback((sessionId: string) => {
    const session = sessionsRef.current.get(sessionId)
    if (!session) {
      console.log('[useStreamingSession] Attempted to destroy non-existent session:', sessionId)
      return
    }

    console.log('[useStreamingSession] DESTROYING streaming session for backend session:', sessionId)

    // Cancel any ongoing streaming
    session.abortController?.abort()

    // Cleanup all resources
    session.resources.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.warn('Error during session cleanup:', error)
      }
    })

    // Update session status
    session.status = 'closed'

    // Remove from sessions map
    sessionsRef.current.delete(sessionId)
  }, [])

  // Stream message with backend session integration
  const streamMessage = useCallback(async (sessionId: string, message: string, messageId?: string, files?: File[]) => {
    console.log('[useStreamingSession] streamMessage called with:', { sessionId, message, messageId, filesCount: files?.length || 0 })

    if (!user) {
      throw new Error('User must be authenticated to stream messages')
    }

    const session = getOrCreateSession(sessionId)
    console.log('[useStreamingSession] Streaming session created/retrieved:', {
      sessionId: session.id,
      threadId: session.threadId,
      status: session.status
    })
    
    // Cancel any existing streaming for this session
    if (session.abortController) {
      console.log('[useStreamingSession] Aborting existing stream')
      session.abortController.abort()
    }
    
    // Create new abort controller
    session.abortController = new AbortController()
    session.status = 'connecting'
    session.lastActivity = Date.now()

    console.log('[useStreamingSession] Calling langGraphService.streamMessage...')

    try {
      session.status = 'streaming'

      // Use file upload method if files are provided, otherwise use regular method
      if (files && files.length > 0) {
        console.log('[useStreamingSession] Using file upload method with', files.length, 'files')
        await langGraphService.streamMessageWithFiles(message, files, {
          sessionId: sessionId, // Use backend session ID
          threadId: session.threadId, // Also pass as thread ID for compatibility
          signal: session.abortController.signal,
          onEvent: (event) => {
            console.log('[useStreamingSession] Received file upload event:', event)
            // Check if the request was aborted
            if (session.abortController?.signal.aborted) {
              console.log('[useStreamingSession] Request aborted, ignoring event')
              return
            }
            session.lastActivity = Date.now()
            onEvent?.(event, messageId)
          },
          onMessage: (content) => {
            console.log('[useStreamingSession] Received file upload message:', content)
            // Check if the request was aborted
            if (session.abortController?.signal.aborted) {
              console.log('[useStreamingSession] Request aborted, ignoring message')
              return
            }
            session.lastActivity = Date.now()
            onMessage?.(content, messageId)
          },
          onError: (error) => {
            console.error('[useStreamingSession] Received file upload error:', error)
            // Check if the request was aborted
            if (session.abortController?.signal.aborted) {
              console.log('[useStreamingSession] Request aborted, ignoring error')
              return
            }
            session.status = 'error'
            onError?.(error, messageId)
          }
        })
      } else {
        console.log('[useStreamingSession] Using regular text-only method')
        await langGraphService.streamMessage(message, {
          sessionId: sessionId, // Use backend session ID
          threadId: session.threadId, // Also pass as thread ID for compatibility
          signal: session.abortController.signal,
          onEvent: (event) => {
            console.log('[useStreamingSession] Received event:', event)
            // Check if the request was aborted
            if (session.abortController?.signal.aborted) {
              console.log('[useStreamingSession] Request aborted, ignoring event')
              return
            }
            session.lastActivity = Date.now()
            onEvent?.(event, messageId)
          },
          onMessage: (content) => {
            console.log('[useStreamingSession] Received message:', content)
            // Check if the request was aborted
            if (session.abortController?.signal.aborted) {
              console.log('[useStreamingSession] Request aborted, ignoring message')
              return
            }
            session.lastActivity = Date.now()
            onMessage?.(content, messageId)
          },
          onError: (error) => {
            console.error('[useStreamingSession] Received error:', error)
            // Check if the request was aborted
            if (session.abortController?.signal.aborted) {
              console.log('[useStreamingSession] Request aborted, ignoring error')
              return
            }
            session.status = 'error'
            onError?.(error, messageId)
          }
        })
      }
      
      // Streaming completed successfully
      if (!session.abortController?.signal.aborted && session.status === 'streaming') {
        console.log('[useStreamingSession] Streaming completed successfully')
        session.status = 'idle'
        onStreamingComplete?.(messageId, session.id)
      }
      
    } catch (error) {
      console.error('[useStreamingSession] Error in streamMessage:', error)
      
      // Check if this is an abort error (request was cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[useStreamingSession] Request was aborted')
        session.status = 'idle'
        return
      }
      
      // Only handle as error if not aborted
      if (!session.abortController?.signal.aborted) {
        session.status = 'error'
        const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error'
        onError?.(new Error(errorMessage), messageId)
      }
    }
  }, [getOrCreateSession, onEvent, onMessage, onError, onStreamingComplete, user])

  // Cancel streaming for a specific session
  const cancelStreaming = useCallback((sessionId: string) => {
    const session = sessionsRef.current.get(sessionId)
    if (session?.abortController) {
      session.abortController.abort()
      session.status = 'idle'
    }
  }, [])

  // Check if session is currently streaming
  const isStreaming = useCallback((sessionId: string): boolean => {
    const session = sessionsRef.current.get(sessionId)
    return session?.status === 'streaming' || session?.status === 'connecting'
  }, [])

  // Get session for backend session ID
  const getSession = useCallback((sessionId: string): StreamingSession | undefined => {
    return sessionsRef.current.get(sessionId)
  }, [])

  // Cleanup all sessions and resources
  const cleanup = useCallback(() => {
    // Cancel all active sessions
    sessionsRef.current.forEach((_, sessionId) => {
      destroySession(sessionId)
    })

    // Clear all timers
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current.clear()

    // Clear sessions map
    sessionsRef.current.clear()
  }, [destroySession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[useStreamingSession] Component unmounting, cleaning up sessions')
      cleanup()
    }
  }, [cleanup])

  return {
    streamMessage,
    cancelStreaming,
    isStreaming,
    getSession,
    cleanup
  }
} 