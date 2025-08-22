import { supabase } from './supabase'

/**
 * Backend session management service
 * Handles CRUD operations for chat sessions with the FastAPI backend
 */

// Types matching the backend models
export interface ChatSessionCreate {
  title: string
  metadata?: Record<string, any>
}

export interface ChatSessionResponse {
  id: string
  user_id: string
  thread_id: string
  title: string
  created_at: string
  updated_at: string
  is_active: boolean
  metadata: Record<string, any>
}

export interface ChatSessionUpdate {
  title?: string
  metadata?: Record<string, any>
  is_active?: boolean
}

export interface SessionListResponse {
  sessions: ChatSessionResponse[]
  total: number
  page: number
  page_size: number
}

export interface SessionStatsResponse {
  total_sessions: number
  active_sessions: number
  total_messages: number
  last_activity?: string
}

// Message history types (matching backend API)
export interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string // ISO string from backend
  agent_steps?: BackendAgentStep[] | null
}

export interface BackendAgentStep {
  id: string
  type: string
  title: string
  content: string
  timestamp: string // ISO string from backend
  status: 'pending' | 'complete' | 'error'
  metadata?: Record<string, any>
}

export interface SessionMessagesResponse {
  session_id: string
  thread_id: string
  messages: SessionMessage[]
  total_messages: number
  last_updated: string
}

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

export class SessionService {
  private apiBase: string

  constructor(apiBase: string = import.meta.env.VITE_API_BASE_URL_2 || '/api/v1') {
    // Remove trailing slash if present to ensure consistent URL construction
    this.apiBase = apiBase.replace(/\/$/, '')
    console.log('[SessionService] Initialized with apiBase:', this.apiBase)
  }

  /**
   * Get authentication headers with JWT token from Supabase
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[SessionService] Auth session error:', error)
      throw new APIError('Authentication error: ' + error.message, 401)
    }
    
    if (!session?.access_token) {
      console.error('[SessionService] No access token available')
      throw new APIError('Authentication required. Please sign in.', 401)
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Handle API response errors with proper error types
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: 'Unknown error occurred' }
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`
      
      switch (response.status) {
        case 401:
          throw new APIError('Authentication required. Please sign in.', 401, errorData)
        case 403:
          throw new APIError('Access denied', 403, errorData)
        case 404:
          throw new APIError('Resource not found', 404, errorData)
        case 422:
          throw new APIError('Validation error: ' + errorMessage, 422, errorData)
        case 429:
          throw new APIError('Too many requests. Please wait.', 429, errorData)
        default:
          throw new APIError(errorMessage, response.status, errorData)
      }
    }
    
    return await response.json()
  }

  /**
   * Create a new chat session
   */
  async createSession(title: string, metadata: Record<string, any> = {}): Promise<ChatSessionResponse> {
    console.log('[SessionService] Creating session:', { title, metadata })
    
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.apiBase}/sessions/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, metadata })
      })
      
      const session = await this.handleResponse<ChatSessionResponse>(response)
      console.log('[SessionService] Session created:', session.id)
      return session
    } catch (error) {
      console.error('[SessionService] Failed to create session:', error)
      throw error
    }
  }

  /**
   * List user's chat sessions with pagination
   */
  async listSessions(
    page: number = 1, 
    pageSize: number = 20, 
    activeOnly: boolean = true
  ): Promise<SessionListResponse> {
    console.log('[SessionService] Listing sessions:', { page, pageSize, activeOnly })
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        active_only: activeOnly.toString()
      })
      
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.apiBase}/sessions/?${params}`, {
        headers
      })
      
      const result = await this.handleResponse<SessionListResponse>(response)
      console.log('[SessionService] Sessions loaded:', result.sessions.length)
      return result
    } catch (error) {
      console.error('[SessionService] Failed to list sessions:', error)
      throw error
    }
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<ChatSessionResponse> {
    console.log('[SessionService] Getting session:', sessionId)
    
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.apiBase}/sessions/${sessionId}`, {
        headers
      })
      
      const session = await this.handleResponse<ChatSessionResponse>(response)
      console.log('[SessionService] Session retrieved:', session.id)
      return session
    } catch (error) {
      console.error('[SessionService] Failed to get session:', error)
      throw error
    }
  }

  /**
   * Update a session
   */
  async updateSession(sessionId: string, updates: ChatSessionUpdate): Promise<ChatSessionResponse> {
    console.log('[SessionService] Updating session:', sessionId, updates)
    
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.apiBase}/sessions/${sessionId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      })
      
      const session = await this.handleResponse<ChatSessionResponse>(response)
      console.log('[SessionService] Session updated:', session.id)
      return session
    } catch (error) {
      console.error('[SessionService] Failed to update session:', error)
      throw error
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    console.log('[SessionService] Deleting session:', sessionId)
    
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.apiBase}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers
      })
      
      if (!response.ok) {
        await this.handleResponse(response) // This will throw the appropriate error
      }
      
      console.log('[SessionService] Session deleted:', sessionId)
    } catch (error) {
      console.error('[SessionService] Failed to delete session:', error)
      throw error
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<SessionStatsResponse> {
    console.log('[SessionService] Getting session stats')

    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.apiBase}/sessions/stats`, {
        headers
      })

      const stats = await this.handleResponse<SessionStatsResponse>(response)
      console.log('[SessionService] Session stats retrieved:', stats)
      return stats
    } catch (error) {
      console.error('[SessionService] Failed to get session stats:', error)
      throw error
    }
  }

  /**
   * Get conversation history for a session
   * Retrieves messages from LangGraph checkpoints including agent reasoning steps
   */
  async getSessionMessages(sessionId: string): Promise<SessionMessagesResponse> {
    console.log('[SessionService] Getting session messages:', sessionId)

    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.apiBase}/sessions/${sessionId}/messages`, {
        headers
      })

      const messages = await this.handleResponse<SessionMessagesResponse>(response)
      console.log('[SessionService] Session messages retrieved:', {
        sessionId: messages.session_id,
        messageCount: messages.total_messages,
        threadId: messages.thread_id
      })
      console.log('[SessionService] Raw messages response:', JSON.stringify(messages.messages, null, 2))
      return messages
    } catch (error) {
      console.error('[SessionService] Failed to get session messages:', error)
      throw error
    }
  }

  /**
   * Test connection to the session API
   */
  async testConnection(): Promise<boolean> {
    console.log('[SessionService] Testing connection')
    
    try {
      await this.listSessions(1, 1)
      console.log('[SessionService] Connection test successful')
      return true
    } catch (error) {
      console.error('[SessionService] Connection test failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService()
