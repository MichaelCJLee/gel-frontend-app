# 🎯 Frontend-Backend Integration Design Document

## 📊 Executive Summary

This document provides a comprehensive integration plan for connecting the GenOne frontend (React + Vite + Tailwind) with the production-ready FastAPI backend service. The backend features full Supabase authentication, session management, persistent memory, and real-time streaming capabilities.

## 🏗️ Current Architecture Analysis

### ✅ **Backend Status: PRODUCTION READY**

The backend is fully implemented with:

1. **FastAPI Service** (`/fastapi_service/`)
   - Complete authentication system with Supabase JWT verification
   - Session management with CRUD operations
   - Real-time streaming with Server-Sent Events
   - Dual memory modes (in-memory + PostgreSQL persistent)
   - Production-ready middleware and error handling

2. **Business Analyst Agent** (`/agent_factory/business_analyst/`)
   - LangGraph-based agent with comprehensive tools
   - PostgreSQL checkpointer for persistent memory
   - Multi-source search capabilities (Azure DevOps, Confluence, Web)
   - State management and conversation continuity

3. **Database Schema** (Supabase)
   - `chat_sessions` - Session management
   - `checkpoints`, `checkpoint_blobs`, `checkpoint_writes` - LangGraph memory
   - `profiles`, `roles` - User management

### ⚠️ **Frontend Integration Gaps**

1. **Missing Authentication Headers**: Frontend calls backend without JWT tokens
2. **Local Storage Dependency**: Conversations stored locally instead of backend
3. **No Session Management**: Frontend doesn't use backend session APIs
4. **Incomplete Streaming**: Missing authentication in streaming requests

## 🔧 Integration Requirements

### **Core API Endpoints (Backend Ready)**

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/v1/sessions/` | POST | ✅ | Create chat session |
| `/api/v1/sessions/` | GET | ✅ | List user sessions |
| `/api/v1/sessions/{id}` | GET/PUT/DELETE | ✅ | Session CRUD |
| `/api/v1/chat/stream` | POST | ✅ | Authenticated streaming |
| `/api/v1/chat/stream/legacy` | POST | ❌ | Legacy streaming |
| `/api/v1/health` | GET | ❌ | Health check |

### **Request/Response Models (Backend Defined)**

```typescript
// Session Management
interface ChatSessionCreate {
  title: string
  metadata?: Record<string, any>
}

interface ChatSessionResponse {
  id: string
  user_id: string
  thread_id: string
  title: string
  created_at: string
  updated_at: string
  is_active: boolean
  metadata: Record<string, any>
}

// Streaming Chat
interface StreamingChatRequest {
  message: string
  session_id?: string
  thread_id?: string
  stream_mode: "updates" | "messages" | "values" | "debug"
  use_persistent_memory: boolean
  include_metadata: boolean
}
```

## 🎯 Expected Outcomes

After completing this integration:

1. **✅ Full Backend Integration**: Frontend uses all backend APIs with proper authentication
2. **✅ Persistent Sessions**: Conversations stored in Supabase database with user isolation
3. **✅ Memory Persistence**: LangGraph memory working across sessions and browser refreshes
4. **✅ Real-time Streaming**: Authenticated streaming with proper error handling
5. **✅ Production Ready**: Scalable, secure, and maintainable architecture

## 📋 Implementation Phases

### **Phase 1: Authentication Integration**
- Update LangGraph service with JWT authentication
- Create session service for backend API calls
- Add error handling for authentication failures
- Test authentication flow end-to-end

### **Phase 2: Session Management Migration**
- Replace localStorage with backend session management
- Update conversation context to use backend sessions
- Implement session CRUD operations in UI
- Test session persistence and user isolation

### **Phase 3: Streaming Integration**
- Update streaming hook to use session IDs
- Test real-time streaming with authentication
- Verify memory persistence across sessions
- Test error handling in streaming

### **Phase 4: Testing & Polish**
- Write comprehensive unit tests
- Perform end-to-end integration testing
- Test performance with multiple sessions
- Verify security and user isolation

### **Phase 5: Production Deployment**
- Configure production environment variables
- Set up monitoring and logging
- Performance optimization
- Security review and penetration testing

## 🔧 Migration Notes

### **Data Migration**
- **No migration needed**: Existing localStorage data will not be migrated
- Users will start fresh with backend-managed sessions
- This is acceptable for testing/development phase

### **Security Considerations**
- All API calls require JWT authentication
- User isolation enforced at database level
- Thread IDs are user-prefixed for security
- Rate limiting and CORS properly configured

## 🚀 Implementation Details

### **Phase 1: Authentication Integration**

#### 1.1 Update LangGraph Service

```typescript
// genone-frontend/src/lib/langGraphService.ts
export class LangGraphService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    return headers
  }

  async streamMessage(
    message: string,
    options: {
      sessionId?: string
      threadId?: string
      onEvent?: (event: ProcessedEvent) => void
      onMessage?: (content: string) => void
      onError?: (error: Error) => void
      signal?: AbortSignal
    } = {}
  ): Promise<void> {
    const { sessionId, threadId, onEvent, onMessage, onError, signal } = options

    const requestBody = {
      message,
      session_id: sessionId,
      thread_id: threadId,
      stream_mode: 'updates',
      use_persistent_memory: true,
      include_metadata: true
    }

    const headers = await this.getAuthHeaders()

    const response = await fetch(`${this.baseUrl}/api/v1/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal,
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.')
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // ... rest of streaming implementation
  }
}
```

#### 1.2 Create Session Service

```typescript
// genone-frontend/src/lib/sessionService.ts
export class SessionService {
  private apiBase: string

  constructor(apiBase: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1') {
    this.apiBase = apiBase
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  async createSession(title: string, metadata = {}): Promise<ChatSessionResponse> {
    const response = await fetch(`${this.apiBase}/sessions/`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ title, metadata })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create session: ${error.detail || response.statusText}`)
    }

    return await response.json()
  }

  async listSessions(page = 1, pageSize = 20): Promise<SessionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      active_only: 'true'
    })

    const response = await fetch(`${this.apiBase}/sessions/?${params}`, {
      headers: await this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to list sessions: ${response.statusText}`)
    }

    return await response.json()
  }

  // Additional methods: getSession, updateSession, deleteSession
}
```

### **Phase 2: Session Management Migration**

#### 2.1 Update Conversation Context

```typescript
// genone-frontend/src/context/ConversationContext.tsx
export function ConversationProvider({ children }: ConversationProviderProps) {
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSessionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionService = useRef(new SessionService())
  const { user } = useAuth()

  // Load sessions from backend on mount
  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await sessionService.current.listSessions()
      setSessions(response.sessions)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMessage)
      console.error('Failed to load sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createConversation = useCallback(async (title: string): Promise<string> => {
    try {
      setError(null)
      const session = await sessionService.current.createSession(title)
      setSessions(prev => [session, ...prev])
      setCurrentSession(session)
      return session.id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session'
      setError(errorMessage)
      throw err
    }
  }, [])

  // ... rest of implementation
}
```

### **Environment Configuration**

```bash
# genone-frontend/.env
VITE_SUPABASE_URL=https://fzooarztswbfepghrczt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### **Testing Strategy**

```typescript
// Test JWT token inclusion in requests
describe('Authentication Integration', () => {
  it('should include JWT token in API requests', async () => {
    const mockSession = { access_token: 'test-token' }
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: mockSession }
    })

    const fetchSpy = jest.spyOn(global, 'fetch')
    const sessionService = new SessionService()

    await sessionService.listSessions()

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    )
  })
})
```

---

**Ready for implementation! 🚀**
