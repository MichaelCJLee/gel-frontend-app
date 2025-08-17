import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react'
import type {
  ConversationContextType,
  Conversation,
  Message,
  AgentStep
} from '../lib/types'
import { generateId } from '../lib/storage'
import { SessionService, type ChatSessionResponse, type SessionMessage, type BackendAgentStep } from '../lib/sessionService'
import { useAuth } from '../hooks/useAuth'
import { useAuthErrorHandler } from '../hooks/useAuthErrorHandler'
import { logError, getUserFriendlyErrorMessage } from '../lib/errorHandler'

// Development testing utilities
if (import.meta.env.DEV) {
  import('../lib/test-conversation-context')
}

/**
 * Convert backend SessionMessage to frontend Message format
 */
function convertSessionMessageToMessage(sessionMsg: SessionMessage): Message {
  const agentSteps = sessionMsg.agent_steps?.map(convertBackendAgentStep) || []
  
  console.log('[convertSessionMessageToMessage] Converting message:', {
    id: sessionMsg.id,
    role: sessionMsg.role,
    hasAgentSteps: !!sessionMsg.agent_steps,
    agentStepsCount: sessionMsg.agent_steps?.length || 0,
    convertedStepsCount: agentSteps.length,
    rawAgentSteps: sessionMsg.agent_steps
  })
  
  if (sessionMsg.agent_steps && sessionMsg.agent_steps.length > 0) {
    console.log('[convertSessionMessageToMessage] Converting agent steps for message:', sessionMsg.id)
    sessionMsg.agent_steps.forEach((step, idx) => {
      console.log(`  Step ${idx}:`, step)
    })
  }
  
  return {
    id: sessionMsg.id,
    content: sessionMsg.content,
    role: sessionMsg.role,
    timestamp: new Date(sessionMsg.timestamp),
    agentSteps
  }
}

/**
 * Convert backend AgentStep to frontend AgentStep format
 */
function convertBackendAgentStep(backendStep: BackendAgentStep): AgentStep {
  return {
    id: backendStep.id,
    title: backendStep.title,
    description: backendStep.content,
    status: backendStep.status === 'complete' ? 'completed' :
            backendStep.status === 'pending' ? 'pending' : 'error',
    timestamp: new Date(backendStep.timestamp),
    data: {
      type: backendStep.type,
      ...backendStep.metadata
    },
    agent: 'analyst' // Default to analyst for backend steps
  }
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function useConversations() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationProvider')
  }
  return context
}

interface ConversationProviderProps {
  children: React.ReactNode
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  // Backend session management state
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSessionResponse | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [, setError] = useState<string | null>(null)
  const [messageLoadingStates, setMessageLoadingStates] = useState<Record<string, boolean>>({})

  // Services and hooks
  const sessionService = useRef(new SessionService())
  const { user } = useAuth()
  const { handleAuthError, retryWithTokenRefresh } = useAuthErrorHandler()

  // In-memory message storage (keyed by session ID)
  // TODO: Move to backend message storage in future enhancement
  const messagesRef = useRef<Record<string, Message[]>>({})

  // Get current conversation (mapped from current session)
  const currentConversation = conversations.find(conv => conv.id === currentSession?.id) || null

  /**
   * Map backend session to frontend conversation format
   */
  const mapSessionToConversation = useCallback((session: ChatSessionResponse): Conversation => {
    return {
      id: session.id,
      title: session.title,
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
      messages: messagesRef.current[session.id] || [], // Get messages from memory
      project: session.metadata?.project as string | undefined
    }
  }, [])

  /**
   * Load messages for a specific session
   */
  const loadMessagesForSession = useCallback(async (sessionId: string): Promise<Message[]> => {
    // Skip if already loaded
    if (messagesRef.current[sessionId]) {
      console.log('[ConversationContext] Using cached messages for session:', sessionId)
      return messagesRef.current[sessionId]
    }

    setMessageLoadingStates(prev => ({ ...prev, [sessionId]: true }))

    try {
      console.log('[ConversationContext] Loading messages for session:', sessionId)
      const response = await retryWithTokenRefresh(() =>
        sessionService.current.getSessionMessages(sessionId)
      )

      console.log('[ConversationContext] Raw session messages from backend:', response.messages)
      response.messages.forEach((msg, index) => {
        console.log(`[ConversationContext] Raw message ${index}:`, {
          id: msg.id,
          role: msg.role,
          hasAgentSteps: !!msg.agent_steps,
          agentStepsCount: msg.agent_steps?.length || 0
        })
      })
      
      const messages = response.messages.map(convertSessionMessageToMessage)
      
      console.log('[ConversationContext] Converted messages:', messages)
      messages.forEach((msg, index) => {
        console.log(`[ConversationContext] Converted message ${index}:`, {
          id: msg.id,
          role: msg.role,
          hasAgentSteps: !!msg.agentSteps,
          agentStepsCount: msg.agentSteps?.length || 0
        })
      })

      // Cache messages
      messagesRef.current[sessionId] = messages

      // Update conversation in state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === sessionId
            ? { ...conv, messages, updatedAt: new Date(response.last_updated) }
            : conv
        )
      )

      console.log('[ConversationContext] Messages loaded for session:', sessionId, 'count:', messages.length)
      return messages
    } catch (error) {
      console.error(`[ConversationContext] Failed to load messages for session ${sessionId}:`, error)
      // Don't throw - return empty array to allow graceful degradation
      return []
    } finally {
      setMessageLoadingStates(prev => ({ ...prev, [sessionId]: false }))
    }
  }, [retryWithTokenRefresh])

  /**
   * Update conversations from sessions
   */
  const updateConversationsFromSessions = useCallback((sessions: ChatSessionResponse[]) => {
    const mappedConversations = sessions.map(mapSessionToConversation)
    setConversations(mappedConversations)
  }, [mapSessionToConversation])

  /**
   * Load sessions from backend
   */
  const loadSessions = useCallback(async () => {
    if (!user) {
      console.log('[ConversationContext] No user, skipping session load')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log('[ConversationContext] Loading sessions from backend...')
      const response = await retryWithTokenRefresh(() =>
        sessionService.current.listSessions(1, 50) // Load more sessions
      )

      console.log('[ConversationContext] Loaded sessions:', response.sessions.length)
      setSessions(response.sessions)
      updateConversationsFromSessions(response.sessions)

    } catch (err) {
      const errorMessage = getUserFriendlyErrorMessage(err)
      setError(errorMessage)
      logError(err, 'ConversationContext.loadSessions')

      // Handle auth errors
      if (!handleAuthError(err)) {
        console.error('[ConversationContext] Failed to load sessions:', errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, retryWithTokenRefresh, updateConversationsFromSessions, handleAuthError])

  /**
   * Load sessions when user changes
   */
  useEffect(() => {
    if (user) {
      loadSessions()
    } else {
      // Clear sessions when user logs out
      setSessions([])
      setConversations([])
      setCurrentSession(null)
      setError(null)
    }
  }, [user, loadSessions])

  // Create a new conversation (now creates backend session)
  const createConversation = useCallback(async (title?: string, project?: string): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated to create conversations')
    }

    try {
      setError(null)
      console.log('[ConversationContext] Creating new session:', { title, project })

      const metadata = project ? { project } : {}
      const session = await retryWithTokenRefresh(() =>
        sessionService.current.createSession(title || 'New Conversation', metadata)
      )

      console.log('[ConversationContext] Session created:', session.id)

      // Add to sessions list
      setSessions(prev => [session, ...prev])

      // Create conversation from session
      const newConversation = mapSessionToConversation(session)
      setConversations(prev => [newConversation, ...prev])

      // Set as current
      setCurrentSession(session)

      return session.id
    } catch (err) {
      const errorMessage = getUserFriendlyErrorMessage(err)
      setError(errorMessage)
      logError(err, 'ConversationContext.createConversation')

      if (!handleAuthError(err)) {
        console.error('[ConversationContext] Failed to create conversation:', errorMessage)
      }

      throw err
    }
  }, [user, retryWithTokenRefresh, mapSessionToConversation, handleAuthError])

  // Delete a conversation (now deletes backend session)
  const deleteConversation = useCallback(async (id: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete conversations')
    }

    try {
      setError(null)
      console.log('[ConversationContext] Deleting session:', id)

      await retryWithTokenRefresh(() =>
        sessionService.current.deleteSession(id)
      )

      console.log('[ConversationContext] Session deleted:', id)

      // Remove from sessions and conversations
      setSessions(prev => prev.filter(session => session.id !== id))
      setConversations(prev => prev.filter(conv => conv.id !== id))

      // If we're deleting the current conversation, switch to the next available one
      if (currentSession?.id === id) {
        const remainingSessions = sessions.filter(session => session.id !== id)
        const nextSession = remainingSessions.length > 0 ? remainingSessions[0] : null
        setCurrentSession(nextSession)
      }

    } catch (err) {
      const errorMessage = getUserFriendlyErrorMessage(err)
      setError(errorMessage)
      logError(err, 'ConversationContext.deleteConversation')

      if (!handleAuthError(err)) {
        console.error('[ConversationContext] Failed to delete conversation:', errorMessage)
      }

      throw err
    }
  }, [user, retryWithTokenRefresh, currentSession, sessions, handleAuthError])

  // Rename a conversation (now updates backend session)
  const renameConversation = useCallback(async (id: string, title: string) => {
    if (!user) {
      throw new Error('User must be authenticated to rename conversations')
    }

    try {
      setError(null)
      console.log('[ConversationContext] Renaming session:', id, 'to:', title)

      const updatedSession = await retryWithTokenRefresh(() =>
        sessionService.current.updateSession(id, { title })
      )

      console.log('[ConversationContext] Session renamed:', id)

      // Update sessions and conversations
      setSessions(prev =>
        prev.map(session =>
          session.id === id ? updatedSession : session
        )
      )

      setConversations(prev =>
        prev.map(conv =>
          conv.id === id
            ? { ...conv, title, updatedAt: new Date(updatedSession.updated_at) }
            : conv
        )
      )

      // Update current session if it's the one being renamed
      if (currentSession?.id === id) {
        setCurrentSession(updatedSession)
      }

    } catch (err) {
      const errorMessage = getUserFriendlyErrorMessage(err)
      setError(errorMessage)
      logError(err, 'ConversationContext.renameConversation')

      if (!handleAuthError(err)) {
        console.error('[ConversationContext] Failed to rename conversation:', errorMessage)
      }

      throw err
    }
  }, [user, retryWithTokenRefresh, currentSession, handleAuthError])

  // Set current conversation (now sets current session and loads messages)
  const setCurrentConversation = useCallback(async (id: string) => {
    const session = sessions.find(s => s.id === id)
    if (!session) {
      console.warn('[ConversationContext] Session not found:', id)
      return
    }

    // Set current session immediately
    setCurrentSession(session)
    console.log('[ConversationContext] Current session set to:', id)

    // Load messages if not already loaded
    if (!messagesRef.current[id]) {
      await loadMessagesForSession(id)
    }
  }, [sessions, loadMessagesForSession])

  // Add a message to a conversation (now uses in-memory storage with session ID)
  const addMessage = useCallback((conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const messageWithMeta: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date()
    }

    console.log('[ConversationContext] addMessage called:', { conversationId, messageId: messageWithMeta.id, role: messageWithMeta.role, content: messageWithMeta.content })

    // Get current messages for this session
    const currentMessages = messagesRef.current[conversationId] || []

    // Check for duplicate messages (React StrictMode protection)
    const isDuplicate = currentMessages.some(msg =>
      msg.content === messageWithMeta.content &&
      msg.role === messageWithMeta.role &&
      Math.abs(msg.timestamp.getTime() - messageWithMeta.timestamp.getTime()) < 1000 // Within 1 second
    )

    if (isDuplicate) {
      console.log('[ConversationContext] Duplicate message detected, skipping')
      return messageWithMeta.id
    }

    // Add message to memory storage
    messagesRef.current[conversationId] = [...currentMessages, messageWithMeta]

    // Update conversations state to trigger re-render
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: messagesRef.current[conversationId],
              updatedAt: new Date()
            }
          : conv
      )
    )

    return messageWithMeta.id
  }, [])

  // Update a message in a conversation (now uses in-memory storage)
  const updateMessage = useCallback((conversationId: string, messageId: string, updates: Partial<Message>) => {
    console.log('[ConversationContext] updateMessage called:', { conversationId, messageId, updates })

    const currentMessages = messagesRef.current[conversationId] || []
    const messageIndex = currentMessages.findIndex(msg => msg.id === messageId)

    if (messageIndex === -1) {
      console.log('[ConversationContext] Message not found:', messageId, 'in conversation:', conversationId)
      console.log('[ConversationContext] Available messages:', currentMessages.map(m => m.id))
      return
    }

    console.log('[ConversationContext] Updating message:', messageId, 'with updates:', updates)

    // Update message in memory storage
    const updatedMessages = [...currentMessages]
    updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...updates }
    messagesRef.current[conversationId] = updatedMessages

    // Update conversations state to trigger re-render
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: messagesRef.current[conversationId],
              updatedAt: new Date()
            }
          : conv
      )
    )
  }, [])

  // Add an agent step to a message (now uses in-memory storage)
  const addAgentStep = useCallback((conversationId: string, messageId: string, step: Omit<AgentStep, 'id' | 'timestamp'>) => {
    const stepWithMeta: AgentStep = {
      ...step,
      id: generateId(),
      timestamp: new Date()
    }

    const currentMessages = messagesRef.current[conversationId] || []
    const messageIndex = currentMessages.findIndex(msg => msg.id === messageId)

    if (messageIndex === -1) {
      console.warn('[ConversationContext] Message not found for agent step:', messageId)
      return
    }

    // Update message with new agent step
    const updatedMessages = [...currentMessages]
    const message = updatedMessages[messageIndex]
    updatedMessages[messageIndex] = {
      ...message,
      agentSteps: [...(message.agentSteps || []), stepWithMeta]
    }
    messagesRef.current[conversationId] = updatedMessages

    // Update conversations state to trigger re-render
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: messagesRef.current[conversationId],
              updatedAt: new Date()
            }
          : conv
      )
    )
  }, [])

  // Update an agent step (now uses in-memory storage)
  const updateAgentStep = useCallback((conversationId: string, messageId: string, stepId: string, updates: Partial<AgentStep>) => {
    const currentMessages = messagesRef.current[conversationId] || []
    const messageIndex = currentMessages.findIndex(msg => msg.id === messageId)

    if (messageIndex === -1) {
      console.warn('[ConversationContext] Message not found for agent step update:', messageId)
      return
    }

    const updatedMessages = [...currentMessages]
    const message = updatedMessages[messageIndex]
    const stepIndex = (message.agentSteps || []).findIndex(step => step.id === stepId)

    if (stepIndex === -1) {
      console.warn('[ConversationContext] Agent step not found:', stepId)
      return
    }

    // Update agent step
    const updatedSteps = [...(message.agentSteps || [])]
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], ...updates }

    updatedMessages[messageIndex] = {
      ...message,
      agentSteps: updatedSteps
    }
    messagesRef.current[conversationId] = updatedMessages

    // Update conversations state to trigger re-render
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: messagesRef.current[conversationId],
              updatedAt: new Date()
            }
          : conv
      )
    )
  }, [])

  // Export conversation (now includes session metadata)
  const exportConversation = useCallback((id: string): string => {
    const conversation = conversations.find(conv => conv.id === id)
    const session = sessions.find(s => s.id === id)

    if (!conversation || !session) {
      throw new Error('Conversation not found')
    }

    const exportData = {
      ...conversation,
      sessionMetadata: {
        threadId: session.thread_id,
        userId: session.user_id,
        metadata: session.metadata,
        isActive: session.is_active
      }
    }

    return JSON.stringify(exportData, null, 2)
  }, [conversations, sessions])

  // Import conversation (now creates backend session)
  const importConversation = useCallback(async (data: string) => {
    if (!user) {
      throw new Error('User must be authenticated to import conversations')
    }

    try {
      const importedData = JSON.parse(data, (_key, value) => {
        // Convert date strings back to Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value)
        }
        return value
      })

      // Validate the conversation structure
      if (!importedData.title || !Array.isArray(importedData.messages)) {
        throw new Error('Invalid conversation format')
      }

      setError(null)
      console.log('[ConversationContext] Importing conversation:', importedData.title)

      // Create new session for imported conversation
      const title = `[Imported] ${importedData.title}`
      const metadata = importedData.sessionMetadata?.metadata || { imported: true }

      const session = await retryWithTokenRefresh(() =>
        sessionService.current.createSession(title, metadata)
      )

      console.log('[ConversationContext] Session created for import:', session.id)

      // Store messages in memory
      if (importedData.messages.length > 0) {
        messagesRef.current[session.id] = importedData.messages
      }

      // Add to sessions and conversations
      setSessions(prev => [session, ...prev])
      const newConversation = mapSessionToConversation(session)
      setConversations(prev => [newConversation, ...prev])

      // Set as current
      setCurrentSession(session)

    } catch (error) {
      const errorMessage = getUserFriendlyErrorMessage(error)
      setError(errorMessage)
      logError(error, 'ConversationContext.importConversation')

      if (!handleAuthError(error)) {
        console.error('[ConversationContext] Failed to import conversation:', errorMessage)
      }

      throw new Error(`Failed to import conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [user, retryWithTokenRefresh, mapSessionToConversation, handleAuthError])

  // Clear all conversations (now clears memory and optionally backend sessions)
  const clearAllConversations = useCallback(async (deleteFromBackend: boolean = false) => {
    try {
      setError(null)

      if (deleteFromBackend && user) {
        console.log('[ConversationContext] Deleting all sessions from backend...')

        // Delete all sessions from backend
        const deletePromises = sessions.map(session =>
          retryWithTokenRefresh(() =>
            sessionService.current.deleteSession(session.id)
          ).catch(err => {
            console.error('[ConversationContext] Failed to delete session:', session.id, err)
            // Continue with other deletions even if one fails
          })
        )

        await Promise.allSettled(deletePromises)
        console.log('[ConversationContext] Backend sessions deletion completed')
      }

      // Clear local state
      setSessions([])
      setConversations([])
      setCurrentSession(null)
      messagesRef.current = {}

      console.log('[ConversationContext] All conversations cleared')

    } catch (err) {
      const errorMessage = getUserFriendlyErrorMessage(err)
      setError(errorMessage)
      logError(err, 'ConversationContext.clearAllConversations')

      if (!handleAuthError(err)) {
        console.error('[ConversationContext] Failed to clear conversations:', errorMessage)
      }

      throw err
    }
  }, [user, sessions, retryWithTokenRefresh, handleAuthError])

  // Refresh a single conversation to get updated title
  const refreshConversation = useCallback(async (conversationId: string) => {
    if (!user) return
    
    try {
      const updatedSession = await sessionService.current.getSession(conversationId)
      
      // Update the conversation in state with new title
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                title: updatedSession.title,
                updatedAt: new Date(updatedSession.updated_at)
              }
            : conv
        )
      )
      
      console.log('[ConversationContext] Refreshed conversation:', conversationId, 'New title:', updatedSession.title)
    } catch (error) {
      console.error('[ConversationContext] Failed to refresh conversation:', error)
    }
  }, [user])

  const contextValue: ConversationContextType = {
    // State
    conversations,
    currentConversation,
    isLoading,
    searchQuery,
    messageLoadingStates,

    // Actions
    createConversation,
    deleteConversation,
    renameConversation,
    setCurrentConversation,
    addMessage,
    updateMessage,
    addAgentStep,
    updateAgentStep,
    setSearchQuery,
    exportConversation,
    importConversation,
    clearAllConversations,
    refreshConversation
  }

  // Expose context for testing in development
  React.useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      import('../lib/test-conversation-context').then(({ setConversationContextRef }) => {
        setConversationContextRef(contextValue)
      })
    }
  }, [contextValue])

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  )
} 